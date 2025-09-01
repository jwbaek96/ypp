# YPP Admin 로그인 시스템 구현 가이드

## 개요
Google Apps Script를 사용한 안전한 관리자 로그인 시스템이 구현되었습니다. 이 시스템은 해싱을 통한 데이터 암호화, 세션 기반 인증, Apps Script의 HtmlService와 CacheService를 활용합니다.

## 🔐 보안 기능

### 1. 다층 암호화
- **클라이언트 사이드**: SHA-256 + Salt로 1차 해싱
- **서버 사이드**: 추가 Salt로 2차 해싱
- **전송 보안**: HTTPS를 통한 암호화된 데이터 전송

### 2. 세션 관리
- **세션 토큰**: 고유한 SHA-256 기반 토큰 생성
- **만료 시간**: 24시간 자동 만료
- **자동 갱신**: 활동 시 세션 연장
- **캐시 저장**: Google Apps Script CacheService 활용

### 3. 브루트포스 방어
- **로그인 시도 제한**: 계정당 최대 5회 시도
- **계정 잠금**: 실패 시 30분 잠금
- **보안 로깅**: 모든 인증 이벤트 기록

## 📁 파일 구조

```
admin/
├── login.html          # 로그인 페이지
├── auth.js            # 클라이언트 인증 로직
├── index.html         # 메인 대시보드 (인증 적용)
├── admin-index.js     # 대시보드 스크립트 (인증 통합)
└── admin-apps-script.js # 서버 사이드 인증 로직
```

## 🚀 설정 방법

### 1. Apps Script 설정

#### 관리자 계정 설정
`admin-apps-script.js`의 `AUTH_CONFIG.ADMIN_USERS`에서 관리자 계정을 설정:

```javascript
ADMIN_USERS: {
  'admin': {
    passwordHash: 'b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86',
    role: 'super_admin',
    name: '시스템 관리자'
  }
}
```

#### 비밀번호 해시 생성
새 비밀번호의 해시값을 생성하려면:

1. 브라우저 콘솔에서 실행:
```javascript
// 예: 'newpassword123!' -> 해시값 생성
const password = 'newpassword123!';
const encoder = new TextEncoder();
const data = encoder.encode(password + 'ypp_salt_2025');
crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const clientHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 서버 사이드 해싱 시뮬레이션
  const serverData = encoder.encode(clientHash + 'server_salt_2025');
  return crypto.subtle.digest('SHA-256', serverData);
}).then(serverHashBuffer => {
  const serverHashArray = Array.from(new Uint8Array(serverHashBuffer));
  const finalHash = serverHashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Final Hash:', finalHash);
});
```

### 2. 웹앱 배포

1. Apps Script 에디터에서 `admin-apps-script.js` 코드 붙여넣기
2. **배포 > 새 배포** 선택
3. **유형**: 웹앱 선택
4. **액세스 권한**: "모든 사용자" 설정
5. 배포 URL을 `auth.js`의 `scriptId`에 입력

### 3. 파일 업로드

모든 파일을 웹서버의 `admin/` 폴더에 업로드:
- `login.html`
- `auth.js`  
- 수정된 `index.html`
- 수정된 `admin-index.js`

## 🔧 사용 방법

### 1. 로그인
1. `admin/login.html` 접속
2. 사용자명과 비밀번호 입력
3. 로그인 성공 시 대시보드로 자동 이동

### 2. 세션 관리
- **자동 연장**: 페이지 활동 시 세션 자동 갱신
- **로그아웃**: 우상단 로그아웃 버튼 클릭
- **만료**: 24시간 후 자동 만료, 재로그인 필요

### 3. 관리 기능
모든 데이터 조회/수정/삭제 기능은 인증된 세션에서만 접근 가능합니다.

## 🛡️ 보안 설정

### 기본 계정
- **관리자**: `admin` / `admin123!`
- **운영자**: `manager` / `manager123!`

### 보안 강화 권장사항

1. **비밀번호 변경**: 기본 비밀번호를 즉시 변경
2. **HTTPS 필수**: 반드시 HTTPS 환경에서 운영
3. **정기 감사**: 로그인 로그 정기 확인
4. **세션 설정**: 필요에 따라 세션 만료 시간 조정

### 환경 변수 관리
실제 운영 시에는 중요 정보를 PropertiesService로 관리:

```javascript
// Apps Script에서
const properties = PropertiesService.getScriptProperties();
properties.setProperties({
  'ADMIN_PASSWORD_HASH': '실제_해시값',
  'SESSION_SECRET': '세션_비밀키'
});
```

## 🔍 모니터링

### 보안 이벤트 로깅
시스템은 다음 이벤트를 자동으로 기록합니다:
- 로그인 성공/실패
- 계정 잠금
- 세션 생성/만료
- 로그아웃

### 로그 확인
Apps Script 콘솔에서 로그 확인 가능:
1. Apps Script 에디터 열기
2. **실행 > 로그 보기**에서 보안 이벤트 확인

## 🚨 문제 해결

### 로그인 실패
1. **비밀번호 확인**: 대소문자 구분 확인
2. **계정 잠금**: 30분 후 재시도
3. **네트워크**: 인터넷 연결 확인

### 세션 만료
1. **재로그인**: 자동으로 로그인 페이지로 이동
2. **캐시 문제**: 브라우저 캐시 삭제 후 재시도

### Apps Script 오류
1. **배포 상태**: 웹앱이 올바르게 배포되었는지 확인
2. **권한**: Apps Script 실행 권한 확인
3. **스크립트 ID**: `auth.js`의 스크립트 ID 정확성 확인

## 🔄 업데이트

새 버전 배포 시:
1. Apps Script 코드 업데이트
2. **배포 > 배포 관리**에서 버전 업데이트
3. 클라이언트 파일들 교체
4. 브라우저 캐시 삭제

---

**⚠️ 주의사항**
- 기본 비밀번호는 반드시 변경하세요
- HTTPS 환경에서만 사용하세요
- 정기적으로 로그를 확인하세요
- 중요 데이터는 별도 백업하세요
