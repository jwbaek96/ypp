# 아카데미 우선 대응계획 (Cloudflare Workers)

## 1. 한 줄 요약
- GitHub Pages는 그대로 두고, 아카데미 신청/조회 요청만 Cloudflare Workers 중계 API로 우회한다.

## 2. 아주 쉬운 설명
현재 방식:
- 사용자 브라우저 -> Google Apps Script -> Google Sheet

변경 방식:
- 사용자 브라우저 -> Cloudflare Workers(API) -> Google Apps Script -> Google Sheet

쉽게 비유하면:
- 기존: 손님이 주방(구글 스크립트)에 직접 들어가 주문
- 변경: 손님은 카운터(Workers)에 주문, 카운터가 주방에 전달
- 장점: 손님은 카운터만 보므로, 주방 접근 제한(기관망 차단) 영향을 줄일 수 있음

## 3. 왜 이 방식이 필요한가
- 공공기관망은 `script.google.com` 직접 호출을 차단할 수 있음
- 브라우저에서 구글로 직접 호출하면 CORS/Preflight/보안정책 영향이 큼
- Workers를 두면 브라우저는 우리 API만 호출하므로 차단 리스크를 줄일 수 있음
- 에러 처리, 로깅, rate limit, 토큰 검증을 Workers에서 일괄 관리 가능

## 4. 우리 환경에 맞는 최소 구성
- 프론트 배포: GitHub Pages 유지
- 중계 API: Cloudflare Workers 1개
- 데이터: 기존 Google Apps Script + Google Sheet 유지

초기 목표:
1. 교육과정 로드 정상화
2. 신청 제출 정상화
3. 신청 조회 정상화

## 5. 1순위 엔드포인트 범위 (아카데미)
1. `GET /api/academy/courses`
- 신청 페이지의 교육과정 항목 로드

2. `POST /api/academy/apply`
- 신청 제출

3. `POST /api/academy/check`
- 신청 조회

선택(2차):
4. `POST /api/academy/update`
- 신청 수정 기능

## 6. 실제 동작 예시 (사용자 관점)

### 예시 A: 교육과정 로드
1. 사용자가 아카데미 신청 페이지 접속
2. 브라우저가 `GET /api/academy/courses` 호출
3. Workers가 Apps Script에 과정 데이터 요청
4. 받은 데이터를 브라우저에 반환
5. 페이지가 교육과정 체크박스를 렌더링

### 예시 B: 신청 제출
1. 사용자가 폼 입력 후 제출 클릭
2. 브라우저가 `POST /api/academy/apply` 호출
3. Workers가 필수값 검증 후 Apps Script에 전달
4. Apps Script가 Sheet 저장
5. Workers가 성공/실패 결과 반환
6. 페이지가 완료 메시지 또는 오류 안내 표시

### 예시 C: 신청 조회
1. 사용자가 사업자번호/이름/연락처 입력
2. 브라우저가 `POST /api/academy/check` 호출
3. Workers가 Apps Script 조회
4. 일치 데이터 반환
5. 페이지에서 결과 목록 표시

## 7. 현재 코드에서 바뀌는 지점 (핵심만)
1. `pages/academy/courseData.js`
- 과정 데이터 호출 URL: 직접 Apps Script -> Workers `/api/academy/courses`

2. `pages/academy/form.js`
- `WEBAPP_URL` 직접 제출 -> Workers `/api/academy/apply`

3. `pages/academy/index.html`
- 조회 로직 `searchApplication()` 호출 URL -> Workers `/api/academy/check`
- 저장 로직 `saveApplication()` 호출 URL -> Workers `/api/academy/update`(수정 유지 시)

## 8. Cloudflare Workers 시작 체크리스트 (무료 티어 기준)
1. Cloudflare 계정 생성
2. Workers 프로젝트 생성
3. API 라우트 3개(courses/apply/check) 작성
4. 환경변수에 Apps Script URL 저장
5. CORS 허용 origin을 실제 사이트 도메인으로 제한
6. GitHub Pages 프론트에서 API URL 교체
7. 실제 신청/조회 테스트
8. 실패 로그 확인 후 메시지 보강

## 9. 30분 스타트 플랜
1. Workers 프로젝트 생성 및 배포 URL 확보
2. `/api/academy/courses`만 먼저 연결
3. 신청 페이지에서 과정 로드 정상 확인
4. `/api/academy/apply` 연결
5. 신청 1건 저장 테스트
6. `/api/academy/check` 연결
7. 조회 1건 테스트

## 10. 주의사항
- 무료 티어로 시작은 가능하나 정책/한도는 배포 직전 공식 문서 재확인
- 1차는 구조 전환이 목적이므로, 기존 Apps Script/Sheet를 유지하고 호출 경로만 바꾼다
- 변경 전 백업 브랜치/체크포인트 커밋 필수
