# YPP Admin 로그인 시스템 설정 가이드

## 📋 개요
Google Apps Script를 활용한 안전한 관리자 로그인 시스템입니다.

## 🚀 설정 단계

### 1. Google Sheets 생성
1. 새로운 Google Sheets 스프레드시트 생성
2. 스프레드시트 이름을 "YPP Admin Database"로 변경
3. 스프레드시트 URL에서 ID 복사 (예: `1abc123def456...`)

### 2. Google Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. "새 프로젝트" 클릭
3. 프로젝트 이름을 "YPP Admin Auth"로 변경
4. `admin-apps-script.js` 파일의 코드를 복사하여 붙여넣기

### 3. 설정 변경
#### Apps Script에서:
```javascript
// 스프레드시트 ID 변경
const ADMIN_SPREADSHEET_ID = '여기에_스프레드시트_ID_입력';
```

#### admin.html에서:
```javascript
// 배포 ID 변경
const ADMIN_DEPLOYMENT_ID = '여기에_앱스스크립트_배포_ID_입력';
```

### 4. Apps Script 배포
1. Apps Script 에디터에서 "배포" > "새 배포" 클릭
2. 유형: "웹 앱" 선택
3. 설정:
   - 설명: "YPP Admin Auth System"
   - 실행 계정: "본인"
   - 액세스 권한: "모든 사용자"
4. "배포" 클릭
5. 배포 ID 복사하여 admin.html에 입력

### 5. 초기 데이터 설정
1. Apps Script 에디터에서 `setupInitialData` 함수 실행
2. 권한 승인 후 실행 완료 확인
3. Google Sheets에 Users, Sessions 시트가 생성되었는지 확인

### 6. 테스트 로그인
- **사용자명**: `admin`
- **비밀번호**: `admin123`

## 🔐 보안 기능

### 비밀번호 해시화
- 클라이언트에서 SHA-256으로 해시화
- 평문 비밀번호는 서버에 전송되지 않음

### 세션 관리
- 토큰 기반 인증
- 24시간 자동 만료
- 로그인 시 세션 연장

### 접근 제어
- 세션 검증을 통한 접근 제어
- 만료된 세션 자동 정리

## 📊 데이터베이스 구조

### Users 시트
| 컬럼 | 설명 |
|------|------|
| id | 사용자 고유 ID |
| username | 사용자명 |
| password | 해시화된 비밀번호 |
| role | 권한 (admin, user 등) |
| status | 계정 상태 (active, inactive) |
| createdAt | 계정 생성일 |
| lastLoginAt | 마지막 로그인 시간 |

### Sessions 시트
| 컬럼 | 설명 |
|------|------|
| token | 세션 토큰 |
| userId | 사용자 ID |
| username | 사용자명 |
| role | 사용자 권한 |
| createdAt | 세션 생성 시간 |
| expiresAt | 세션 만료 시간 |

## 🛠️ 사용자 관리

### 새 사용자 추가
1. Users 시트에 새 행 추가
2. 비밀번호는 SHA-256 해시 값으로 입력
3. role은 'admin' 또는 'user'
4. status는 'active'

### 비밀번호 해시 생성 (JavaScript Console)
```javascript
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// 사용 예시
hashPassword('새비밀번호').then(hash => console.log(hash));
```

## 🔧 유지보수

### 만료된 세션 정리
Apps Script에서 `cleanupExpiredSessions` 함수를 정기적으로 실행하도록 트리거 설정:

1. Apps Script 에디터에서 "트리거" 탭
2. "트리거 추가" 클릭
3. 함수: `cleanupExpiredSessions`
4. 이벤트 소스: "시간 기반"
5. 시간 간격: "1일마다"

## 🚨 주의사항

1. **HTTPS 필수**: 프로덕션 환경에서는 반드시 HTTPS 사용
2. **스프레드시트 권한**: 관리자만 스프레드시트 접근 가능하도록 설정
3. **Apps Script 권한**: 배포 시 "본인" 계정으로 실행되도록 설정
4. **정기 백업**: 사용자 데이터 정기 백업 권장

## 🔄 향후 확장 가능한 기능

1. **2단계 인증 (2FA)**
2. **비밀번호 재설정**
3. **로그인 시도 제한**
4. **감사 로그**
5. **권한별 접근 제어**
6. **이메일 알림**

## 📞 문제 해결

### 로그인 실패 시
1. 스프레드시트 ID 확인
2. 배포 ID 확인
3. Apps Script 권한 확인
4. 브라우저 콘솔에서 오류 메시지 확인

### 세션 만료 시
- 24시간 후 자동 만료
- 재로그인 필요

### 데이터베이스 오류 시
1. 스프레드시트 구조 확인
2. 컬럼 이름 정확성 확인
3. Apps Script 실행 로그 확인
