type AcademyRoute = "courses" | "apply" | "check";

type JsonRecord = Record<string, unknown>;

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

const ROUTE_CONFIG: Record<string, { method: string; upstreamEnv: keyof Env; route: AcademyRoute }> = {
	"/api/academy/courses": { method: "GET", upstreamEnv: "APPS_SCRIPT_URL_COURSES", route: "courses" },
	"/api/academy/apply": { method: "POST", upstreamEnv: "APPS_SCRIPT_URL_APPLY", route: "apply" },
	"/api/academy/check": { method: "POST", upstreamEnv: "APPS_SCRIPT_URL_CHECK", route: "check" },
};

const CORS_HEADERS = "Content-Type, Authorization";
const DEFAULT_RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

export interface Env {
	APPS_SCRIPT_URL_COURSES: string;
	APPS_SCRIPT_URL_APPLY: string;
	APPS_SCRIPT_URL_CHECK: string;
	ALLOWED_ORIGINS: string;
	UPSTREAM_SHARED_TOKEN?: string;
	RATE_LIMIT_MAX_PER_MINUTE?: string;
}

type WorkerHandler = {
	fetch(request: Request, env: Env): Promise<Response>;
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get("Origin");
		const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS);

		if (request.method === "OPTIONS") {
			return handlePreflight(origin, allowedOrigins);
		}

		const pathname = new URL(request.url).pathname;
		const config = ROUTE_CONFIG[pathname];
		if (!config) {
			return jsonResponse(
				{ success: false, error: "Not found" },
				404,
				origin,
				allowedOrigins,
			);
		}

		if (request.method !== config.method) {
			return jsonResponse(
				{ success: false, error: "Method not allowed" },
				405,
				origin,
				allowedOrigins,
			);
		}

		if (!isOriginAllowed(origin, allowedOrigins)) {
			return jsonResponse({ success: false, error: "Origin not allowed" }, 403, origin, allowedOrigins);
		}

		const clientIp = request.headers.get("CF-Connecting-IP") ?? "unknown";
		const limit = parseRateLimit(env.RATE_LIMIT_MAX_PER_MINUTE);
		if (!checkRateLimit(`${config.route}:${clientIp}`, limit)) {
			return jsonResponse(
				{ success: false, error: "Too many requests" },
				429,
				origin,
				allowedOrigins,
			);
		}

		try {
			const upstreamResponse = await forwardToAppsScript(request, env, config);
			const body = await normalizeUpstreamResponse(upstreamResponse);

			if (!upstreamResponse.ok) {
				return jsonResponse(
					{
						success: false,
						error: readErrorMessage(body, "Upstream request failed"),
						upstreamStatus: upstreamResponse.status,
					},
					502,
					origin,
					allowedOrigins,
				);
			}

			return jsonResponse({ success: true, data: body }, 200, origin, allowedOrigins);
		} catch (error) {
			return jsonResponse(
				{ success: false, error: error instanceof Error ? error.message : "Unknown error" },
				500,
				origin,
				allowedOrigins,
			);
		}
	},
} satisfies WorkerHandler;

async function forwardToAppsScript(
	request: Request,
	env: Env,
	config: { method: string; upstreamEnv: keyof Env; route: AcademyRoute },
): Promise<Response> {
	const upstreamUrl = env[config.upstreamEnv];
	if (!upstreamUrl) {
		throw new Error(`Missing environment variable: ${config.upstreamEnv}`);
	}

	const headers = new Headers({ Accept: "application/json, text/plain, */*" });
	if (env.UPSTREAM_SHARED_TOKEN) {
		headers.set("X-Worker-Token", env.UPSTREAM_SHARED_TOKEN);
	}

	if (config.route === "courses") {
		return fetchCourses(upstreamUrl, headers, request.url);
	}

	if (config.route === "check") {
		const requestBody = await readRequestBody(request);
		return fetchCheckData(upstreamUrl, headers, requestBody);
	}

	if (config.method === "GET") {
		return fetch(upstreamUrl, { method: "GET", headers });
	}

	const requestBody = await readRequestBody(request);
	const upstreamBody = withRouteHints(requestBody, config.route);
	headers.set("Content-Type", "application/json");
	return fetch(upstreamUrl, {
		method: config.method,
		headers,
		body: JSON.stringify(upstreamBody),
	});
}

async function fetchCourses(upstreamUrl: string, headers: Headers, requestUrl: string): Promise<Response> {
	const incoming = new URL(requestUrl);
	const explicitAction = incoming.searchParams.get("action");

	if (explicitAction) {
		const target = withQuery(upstreamUrl, { action: explicitAction });
		return fetch(target, { method: "GET", headers });
	}

	const [psacRes, relayRes] = await Promise.all([
		fetch(withQuery(upstreamUrl, { action: "get_psac_courses" }), { method: "GET", headers }),
		fetch(withQuery(upstreamUrl, { action: "get_relay_courses" }), { method: "GET", headers }),
	]);

	const [psacBody, relayBody] = await Promise.all([
		normalizeUpstreamResponse(psacRes),
		normalizeUpstreamResponse(relayRes),
	]);

	if (!psacRes.ok || !relayRes.ok) {
		const errorMessage = !psacRes.ok
			? readErrorMessage(psacBody, "courses(psac) request failed")
			: readErrorMessage(relayBody, "courses(relay) request failed");

		return new Response(
			JSON.stringify({ success: false, error: errorMessage }),
			{ status: 502, headers: { "Content-Type": "application/json; charset=utf-8" } },
		);
	}

	return new Response(
		JSON.stringify({
			success: true,
			data: {
				psac: extractCourseList(psacBody),
				relay: extractCourseList(relayBody),
			},
		}),
		{ status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } },
	);
}

async function fetchCheckData(upstreamUrl: string, headers: Headers, requestBody: JsonRecord): Promise<Response> {
	const formType = pickExistingString(requestBody, "formType") ?? "relay";
	const sheet = formType === "psac" ? "SHEET_APPLY_P" : "SHEET_APPLY_R";
	const target = withQuery(upstreamUrl, { action: "getData", sheet });

	const upstreamResponse = await fetch(target, { method: "GET", headers });
	const upstreamBody = await normalizeUpstreamResponse(upstreamResponse);

	if (!upstreamResponse.ok) {
		return new Response(
			JSON.stringify({
				success: false,
				error: readErrorMessage(upstreamBody, "Upstream check request failed"),
			}),
			{ status: 502, headers: { "Content-Type": "application/json; charset=utf-8" } },
		);
	}

	const rows = extractRowsFromCheckBody(upstreamBody);
	const name = pickExistingString(requestBody, "name");
	const phone = pickExistingString(requestBody, "phone");
	const email = pickExistingString(requestBody, "email");
	const companyName = pickExistingString(requestBody, "companyName");
	const filtered = rows.filter((row) => matchesCheckCriteria(row, { name, phone, email, companyName }));

	return new Response(
		JSON.stringify({
			success: true,
			data: {
				items: filtered,
				total: filtered.length,
				criteria: {
					formType,
					name: name ?? null,
					phone: phone ?? null,
					email: email ?? null,
					companyName: companyName ?? null,
				},
			},
		}),
		{ status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } },
	);
}

function withQuery(baseUrl: string, query: Record<string, string>): string {
	const url = new URL(baseUrl);
	for (const [key, value] of Object.entries(query)) {
		url.searchParams.set(key, value);
	}
	return url.toString();
}

function extractCourseList(body: unknown): unknown[] {
	if (body && typeof body === "object" && "data" in body && Array.isArray(body.data)) {
		return body.data as unknown[];
	}
	return [];
}

function extractRowsFromCheckBody(body: unknown): JsonRecord[] {
	if (!body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data)) {
		return [];
	}

	return body.data.filter((row): row is JsonRecord => {
		return row !== null && typeof row === "object" && !Array.isArray(row);
	});
}

function matchesCheckCriteria(
	row: JsonRecord,
	criteria: { name?: string; phone?: string; email?: string; companyName?: string },
): boolean {
	const { name, phone, email, companyName } = criteria;

	const nameCandidates = [
		pickStringField(row, "studentName"),
		pickStringField(row, "educationManager"),
		pickStringField(row, "managerName"),
	];

	const phoneCandidates = [
		pickStringField(row, "studentMobile"),
		pickStringField(row, "studentPhone"),
		pickStringField(row, "managerMobile"),
		pickStringField(row, "managerPhone"),
	];

	const emailCandidates = [
		pickStringField(row, "studentEmail"),
		pickStringField(row, "managerEmail"),
	];

	const companyCandidates = [pickStringField(row, "companyName")];

	const nameOk = !name || nameCandidates.some((candidate) => candidate === name);
	const phoneOk = !phone || phoneCandidates.some((candidate) => normalizePhone(candidate) === normalizePhone(phone));
	const emailOk = !email || emailCandidates.some((candidate) => normalizeText(candidate) === normalizeText(email));
	const companyOk = !companyName || companyCandidates.some((candidate) => normalizeText(candidate) === normalizeText(companyName));

	return nameOk && phoneOk && emailOk && companyOk;
}

function pickStringField(row: JsonRecord, key: string): string {
	const value = row[key];
	return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: string): string {
	return value.replace(/\D/g, "");
}

function normalizeText(value: string): string {
	return value.trim().toLowerCase();
}

async function readRequestBody(request: Request): Promise<JsonRecord> {
	const contentType = request.headers.get("Content-Type") ?? "";
	if (!contentType.includes("application/json")) {
		throw new Error("Content-Type must be application/json");
	}

	const body = (await request.json()) as unknown;
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw new Error("Request body must be a JSON object");
	}

	return body as JsonRecord;
}

async function normalizeUpstreamResponse(response: Response): Promise<unknown> {
	const text = await response.text();
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text) as unknown;
	} catch {
		return { raw: text };
	}
}

function readErrorMessage(body: unknown, fallback: string): string {
	if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
		return body.error;
	}

	if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
		return body.message;
	}

	return fallback;
}

function parseAllowedOrigins(value: string): string[] {
	return value
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
	if (!origin) {
		return true;
	}

	return allowedOrigins.includes(origin);
}

function handlePreflight(origin: string | null, allowedOrigins: string[]): Response {
	if (!isOriginAllowed(origin, allowedOrigins)) {
		return new Response(null, { status: 403 });
	}

	return new Response(null, {
		status: 204,
		headers: buildCorsHeaders(origin, allowedOrigins),
	});
}

function jsonResponse(body: unknown, status: number, origin: string | null, allowedOrigins: string[]): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: buildCorsHeaders(origin, allowedOrigins),
	});
}

function buildCorsHeaders(origin: string | null, allowedOrigins: string[]): Headers {
	const headers = new Headers({
		"Content-Type": "application/json; charset=utf-8",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
		"Access-Control-Allow-Headers": CORS_HEADERS,
		Vary: "Origin",
	});

	if (origin && allowedOrigins.includes(origin)) {
		headers.set("Access-Control-Allow-Origin", origin);
	} else if (!origin) {
		headers.set("Access-Control-Allow-Origin", "*");
	}

	return headers;
}

function parseRateLimit(value?: string): number {
	if (!value) {
		return DEFAULT_RATE_LIMIT;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RATE_LIMIT;
}

function checkRateLimit(key: string, limit: number): boolean {
	const now = Date.now();
	const current = rateLimitStore.get(key);

	if (!current || current.resetAt <= now) {
		rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
		cleanupRateLimitStore(now);
		return true;
	}

	if (current.count >= limit) {
		return false;
	}

	current.count += 1;
	rateLimitStore.set(key, current);
	return true;
}

function cleanupRateLimitStore(now: number): void {
	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetAt <= now) {
			rateLimitStore.delete(key);
		}
	}
}

function withRouteHints(body: JsonRecord, route: AcademyRoute): JsonRecord {
	const actionByRoute: Record<AcademyRoute, string> = {
		courses: "courses",
		apply: "apply",
		check: "check",
	};

	const formByRoute: Record<AcademyRoute, string> = {
		courses: "courses",
		apply: "academyApply",
		check: "academyCheck",
	};

	return {
		...body,
		route: pickExistingString(body, "route") ?? route,
		action: pickExistingString(body, "action") ?? actionByRoute[route],
		form: pickExistingString(body, "form") ?? formByRoute[route],
		requestType: pickExistingString(body, "requestType") ?? route,
	};
}

function pickExistingString(body: JsonRecord, key: string): string | undefined {
	const value = body[key];
	return typeof value === "string" && value.trim() ? value : undefined;
}
