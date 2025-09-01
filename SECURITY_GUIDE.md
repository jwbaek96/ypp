# 🔐 YPP Admin 보안 가이드

## 📋 개요
YPP Admin 시스템의 보안을 강화하기 위한 설정 및 배포 가이드입니다.

## 🚀 1. Apps Script Properties Service 설정

### 1.1 초기 보안 설정
```javascript
// Apps Script 편집기에서 한 번만 실행
function setupSecurityProperties() {
  // 이 함수가 자동으로 보안 키들을 생성하고 저장합니다
}
```

### 1.2 수동 보안 설정
Apps Script 편집기 → 왼쪽 사이드바 → "스크립트 속성"에서 다음 값들을 설정:

| 속성 키 | 설명 | 예시 값 |
|---------|------|---------|
| `PASSWORD_SALT` | 비밀번호 해싱용 솔트 | `YPP_SALT_고유문자열` |
| `SESSION_SECRET` | 세션 토큰 생성용 시크릿 | `YPP_SESSION_고유문자열` |
| `MAX_LOGIN_ATTEMPTS` | 최대 로그인 시도 횟수 | `5` |
| `LOCKOUT_DURATION_MINUTES` | 계정 잠금 시간(분) | `30` |
| `SESSION_TIMEOUT_HOURS` | 세션 만료 시간(시간) | `24` |
| `IP_WHITELIST` | 허용 IP 목록 (콤마로 구분) | `192.168.1.1,10.0.0.1` |
| `ALLOWED_DOMAINS` | 허용 도메인 목록 | `github.com,localhost` |

## 🔧 2. GitHub Secrets 설정

### 2.1 필수 Secrets
Repository → Settings → Secrets and variables → Actions에서 다음 설정:

| Secret 이름 | 설명 | 획득 방법 |
|-------------|------|-----------|
| `APPS_SCRIPT_ID` | Apps Script 프로젝트 ID | Apps Script URL에서 추출 |
| `GOOGLE_SERVICE_ACCOUNT` | Google Service Account JSON | Google Cloud Console에서 생성 |

### 2.2 Google Service Account 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. IAM 및 관리 → 서비스 계정
3. "서비스 계정 만들기" 클릭
4. 권한: `Apps Script API` 활성화
5. JSON 키 생성 → 전체 내용을 `GOOGLE_SERVICE_ACCOUNT`에 저장

## 🛡️ 3. 보안 기능

### 3.1 로그인 보안
- ✅ 비밀번호 해싱 (SHA-256 + Salt)
- ✅ 로그인 시도 제한 (기본 5회)
- ✅ 계정 자동 잠금 (기본 30분)
- ✅ 세션 토큰 기반 인증
- ✅ 보안 이벤트 로깅

### 3.2 데이터 보호
- ✅ ADMIN_USERS 시트 보안
- ✅ 민감한 설정값 Properties Service 저장
- ✅ 세션 타임아웃 관리
- ✅ IP 화이트리스트 (선택적)

### 3.3 배포 보안
- ✅ GitHub Actions 자동 배포
- ✅ Service Account 기반 인증
- ✅ 환경별 설정 분리

## 🚨 4. 보안 체크리스트

### 배포 전 확인사항
- [ ] Properties Service에 보안 키 설정 완료
- [ ] ADMIN_USERS 시트에 관리자 계정 생성
- [ ] Apps Script 웹 앱 권한 설정 ("모든 사용자" 또는 "조직 내")
- [ ] GitHub Secrets 설정 완료
- [ ] Service Account API 권한 확인

### 운영 중 모니터링
- [ ] 로그인 실패 로그 확인
- [ ] 비정상적인 접근 시도 모니터링
- [ ] 세션 토큰 만료 주기적 확인
- [ ] ADMIN_USERS 시트 권한 관리

## 🔄 5. 자동 배포 사용법

### 5.1 배포 트리거
```bash
# 코드 변경 후 푸시하면 자동 배포
git add admin/
git commit -m "Update admin security features"
git push origin main
```

### 5.2 수동 배포
Repository → Actions → "Deploy Apps Script Admin System" → "Run workflow"

## 📞 6. 문제 해결

### 6.1 로그인 안됨
1. ADMIN_USERS 시트 확인
2. Properties Service 설정 확인
3. Apps Script 로그 확인

### 6.2 배포 실패
1. GitHub Secrets 확인
2. Service Account 권한 확인
3. Apps Script API 활성화 확인

### 6.3 보안 로그 확인
Apps Script 편집기 → 실행 → 로그에서 보안 이벤트 확인

## 📋 7. 최초 설정 순서

1. **Apps Script 설정**
   ```javascript
   setupSecurityProperties(); // 한 번만 실행
   ```

2. **ADMIN_USERS 시트 생성**
   | username | password | passwordHash | role | name | isActive | lastLogin |
   |----------|----------|--------------|------|------|----------|-----------|
   | admin | ypp8720 | (자동생성) | admin | 관리자 | TRUE | |

3. **GitHub Secrets 설정**
   - APPS_SCRIPT_ID
   - GOOGLE_SERVICE_ACCOUNT

4. **첫 배포**
   ```bash
   git push origin main
   ```

5. **로그인 테스트**
   - 웹 앱 URL 접속
   - admin/ypp8720으로 로그인

## 🎯 결론

이제 GitHub Secrets를 활용한 안전한 실시간 로그인 시스템이 구축되었습니다:

- **개발 환경**: 로컬에서 테스트
- **배포 환경**: GitHub Actions로 자동 배포
- **보안 관리**: Apps Script Properties Service
- **모니터링**: 보안 이벤트 로깅

실제 운영 환경에서는 추가적으로 **2FA(이중 인증)**, **SSL 인증서**, **정기적인 보안 감사** 등을 고려하시기 바랍니다.
