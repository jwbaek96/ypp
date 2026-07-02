# ypp-api-relay

Cloudflare Workers 기반 중계 API 프로젝트입니다.

목표는 브라우저에서 Google Apps Script를 직접 호출하지 않고, 아래 흐름으로 바꾸는 것입니다.

브라우저 -> Cloudflare Worker -> Google Apps Script -> Google Sheet

## 구현 범위

- `GET /api/academy/courses`
- `POST /api/academy/apply`
- `POST /api/academy/check`

## 현재 구성

- Apps Script 업스트림 URL은 환경변수로 분리
- 허용 도메인만 CORS 허용
- 응답 형식 통일
- 기본 rate limit 포함
- Worker -> Apps Script 토큰 전달은 선택 사항

## 응답 형식

성공:

```json
{
  "success": true,
  "data": {}
}
```

실패:

```json
{
  "success": false,
  "error": "message"
}
```

## 환경변수

로컬 개발은 `.dev.vars` 파일을 사용하고, 배포 환경은 `wrangler.jsonc` 또는 Cloudflare secret을 사용합니다.

필수 변수:

- `APPS_SCRIPT_URL_COURSES`
- `APPS_SCRIPT_URL_APPLY`
- `APPS_SCRIPT_URL_CHECK`
- `ALLOWED_ORIGINS`

선택 변수:

- `UPSTREAM_SHARED_TOKEN`
- `RATE_LIMIT_MAX_PER_MINUTE`

예시는 [.dev.vars.example](.dev.vars.example)에 있습니다.

## 로컬 실행

1. 의존성 설치

```powershell
npm install
```

2. 로컬 환경변수 파일 생성

```powershell
Copy-Item .dev.vars.example .dev.vars
```

3. 개발 서버 실행

```powershell
npm run dev
```

## 배포

1. Cloudflare 로그인

```powershell
npx wrangler login
```

2. 선택 사항: 토큰 저장

```powershell
npx wrangler secret put UPSTREAM_SHARED_TOKEN
```

3. 배포

```powershell
npm run deploy
```

## 테스트 예시

### courses

```powershell
curl "http://127.0.0.1:8787/api/academy/courses"
```

### apply

```powershell
curl -X POST "http://127.0.0.1:8787/api/academy/apply" ^
  -H "Content-Type: application/json" ^
  -d "{\"formType\":\"relay\",\"companyInfo\":{\"companyName\":\"테스트회사\",\"representative\":\"대표\",\"businessNumber\":\"123-45-67890\",\"businessType\":\"서비스\",\"address\":\"서울\"},\"managerInfo\":{\"name\":\"담당자\",\"department\":\"교육팀\",\"position\":\"매니저\",\"phone\":\"02-0000-0000\",\"mobile\":\"010-0000-0000\",\"email\":\"manager@example.com\"},\"students\":[{\"name\":\"홍길동\",\"department\":\"개발팀\",\"position\":\"사원\",\"phone\":\"02-1111-1111\",\"mobile\":\"010-1111-1111\",\"email\":\"hong@example.com\",\"selectedCourses\":[\"샘플과목\"]}]}"
```

### check

```powershell
curl -X POST "http://127.0.0.1:8787/api/academy/check" ^
  -H "Content-Type: application/json" ^
  -d "{\"formType\":\"relay\",\"name\":\"홍길동\",\"phone\":\"010-1111-1111\",\"email\":\"hong@example.com\",\"companyName\":\"테스트회사\"}"
```

`check` 요청 필드(선택):

- `formType`: `relay`(기본값) 또는 `psac`
- `name`: 수강자명/담당자명 exact match
- `phone`: 숫자만 비교(match)
- `email`: 소문자 기준 exact match
- `companyName`: 회사명 exact match

### CORS 확인

허용 도메인 예시:

```powershell
curl -i "http://127.0.0.1:8787/api/academy/courses" -H "Origin: https://www.ypp.co.kr"
```

차단 도메인 예시:

```powershell
curl -i "http://127.0.0.1:8787/api/academy/courses" -H "Origin: https://evil.example"
```

## 단계별 검증 결과

### 완료

- Worker 라우트 3개 구현 완료
- CORS 허용 도메인 제한 구현 완료
- 공통 오류 응답 구현 완료
- 환경변수 기반 업스트림 연결 구현 완료
- 기본 rate limit 구현 완료

### 현재 로컬 검증 상태

- 편집기 진단 오류 없음 확인
- 다만 이 PC 환경이 `Windows ARM64`라 `workerd` 패키지 설치가 실패함
- 그래서 `npm install`, `wrangler dev`, `wrangler deploy`는 이 환경에서 바로 검증하지 못함

## Windows ARM64 주의

현재 실패 원인:

- `workerd`가 이 로컬 환경의 `win32 arm64`를 지원하지 않아 설치 중단

가능한 우회 방법:

1. x64 Windows PC에서 설치/배포
2. WSL 또는 원격 Linux 환경에서 설치/배포
3. Cloudflare Dashboard 또는 CI 환경에서 배포

배포 승인 자체는 비밀번호 공유 없이 브라우저 로그인으로 진행하면 됩니다.