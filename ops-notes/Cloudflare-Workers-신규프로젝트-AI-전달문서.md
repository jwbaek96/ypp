# Cloudflare Workers 신규 프로젝트 AI 전달 문서

## 1) 프로젝트 배경
- 기존 사이트는 GitHub Pages(정적 호스팅)로 운영 중.
- 동적 데이터는 Google Apps Script + Google Sheet를 사용.
- 공공기관망 환경에서 Google 직접 호출(script.google.com) 구간에서 실패 가능성이 큼.
- 목표는 브라우저의 Google 직접 호출을 줄이고, Cloudflare Workers를 중계 API로 사용해 안정성을 높이는 것.

## 2) 현재 상태
- 기존 저장소(`ypp`)를 직접 건드리지 않고, 별도 신규 프로젝트에서 Workers를 먼저 구축할 예정.
- Cloudflare 대시보드 UI에서 Hello World 배포 버튼 비활성 이슈가 있어, CLI 방식으로 진행하는 방향을 선택.
- 즉, "API 중계 서버(Workers) 먼저 구축/배포 -> 이후 기존 ypp 프론트에서 API URL만 교체" 순서로 진행.

## 3) 핵심 아키텍처 (1차)
- 기존: 브라우저 -> Google Apps Script -> Google Sheet
- 변경: 브라우저 -> Cloudflare Workers -> Google Apps Script -> Google Sheet

핵심 원칙:
- GitHub Pages는 유지
- Google Sheet/Apps Script도 1차에서는 유지
- 호출 경로만 중계 API로 전환

## 4) 우선순위 (P0)
1. 교육과정 로드 안정화
2. 신청 제출 정상화
3. 신청 조회 정상화

대상 기능(아카데미):
- courses: 신청 페이지 교육과정 목록 로드
- apply: 신청서 제출
- check: 신청 확인 조회

## 5) 신규 Workers 프로젝트에서 할 일
1. 새 폴더/새 프로젝트에서 Cloudflare Worker 생성
2. 엔드포인트 3개 구현
   - GET /api/academy/courses
   - POST /api/academy/apply
   - POST /api/academy/check
3. Worker에서 Apps Script로 서버-서버 요청 전달
4. CORS 제한(운영 도메인만 허용)
5. 오류 응답 포맷 통일(간단한 success/error)
6. 배포 후 workers.dev URL 확보
7. Postman/브라우저/간단 스크립트로 동작 검증

## 6) 제약사항/주의사항
- 기존 ypp 저장소 파일은 아직 수정하지 않음(안전 우선).
- 민감정보(토큰/키/Apps Script URL)는 코드 하드코딩 금지, Worker 환경변수로 관리.
- 1차에서는 최소 기능 동작이 목표(과도한 리팩터링 금지).
- 스키마 문서는 실제 테스트 후 확정(초기에는 유연하게).
- 중요: 진행 중 막히더라도 GitHub Actions 우회는 즉시 적용하지 말고, 먼저 현황 보고 후 승인받고 진행.

## 7) 로컬에서 CLI로 시작 (권장)
PowerShell 예시:
```powershell
Set-Location $HOME
New-Item -ItemType Directory -Path cf-worker-temp -Force
Set-Location .\cf-worker-temp
npm create cloudflare@latest ypp-api-relay
```

생성 마법사에서 권장 선택:
- 템플릿: Hello World Worker
- 언어: JavaScript (또는 TypeScript)
- Git 초기화: 필요 시 선택
- 즉시 배포: Yes

추가 명령:
```powershell
Set-Location .\ypp-api-relay
npx wrangler login
npx wrangler deploy
```

## 8) 테스트 기준 (완료 정의 - 1차)
- /api/academy/courses 호출 시 교육과정 데이터가 응답됨
- /api/academy/apply 호출 시 시트 저장 성공/실패가 구분되어 응답됨
- /api/academy/check 호출 시 조건 일치 데이터가 조회됨
- 실패 시에도 프론트가 처리 가능한 형태의 에러 응답이 반환됨

## 9) 이후 기존 ypp에 반영할 파일 (참고)
- pages/academy/courseData.js  -> courses API로 전환
- pages/academy/form.js        -> apply API로 전환
- pages/academy/index.html     -> check(및 필요 시 update) API로 전환

## 10) 새 프로젝트 AI에게 바로 전달할 요청문 (복붙용)
```text
목표: Cloudflare Workers 기반 중계 API를 새 프로젝트에서 구축해줘.

배경:
- 기존 서비스는 GitHub Pages + Google Apps Script + Google Sheet 구조.
- 공공기관망에서 script.google.com 직접 호출 실패 가능성이 높아 중계 API로 전환 필요.
- 기존 ypp 저장소는 지금 수정하지 않고, 신규 Workers 프로젝트에서 먼저 API를 완성하고 검증할 것.

필수 구현:
1) GET /api/academy/courses
2) POST /api/academy/apply
3) POST /api/academy/check

요구사항:
- Worker -> Apps Script 전달 구조
- CORS 허용 도메인 제한
- 환경변수로 Apps Script URL/토큰 관리
- 공통 에러 처리(최소한 success/error 분리)
- wrangler 배포 가능 상태로 구성

의사결정 규칙:
- 진행 중 배포/실행 이슈가 발생해도 GitHub Actions 우회를 바로 적용하지 말 것.
- 먼저 실패 원인, 재현 단계, 시도한 해결책, 다음 대안 2개를 보고하고 사용자 승인 후 다음 단계 진행.
- 즉, "Report first, then fallback" 원칙으로 진행.

산출물:
- Worker 코드
- wrangler 설정 파일
- 로컬 실행 및 배포 방법
- API 테스트 방법(예시 curl 또는 간단 테스트 코드)

실패 시 보고 템플릿:
1) 어떤 단계에서 실패했는지
2) 에러 원문
3) 재현 명령/재현 절차
4) 이미 시도한 해결 방법
5) 권장 대안 A/B (장단점 포함)
6) 내가 선택하면 바로 실행할 다음 단계
```

## 11) 진행 전략
- Step 1: courses 먼저 성공
- Step 2: apply 연결
- Step 3: check 연결
- Step 4: 안정화 후 기존 ypp 프론트 URL 교체
