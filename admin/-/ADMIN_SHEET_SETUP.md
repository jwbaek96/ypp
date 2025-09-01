# 🔐 YPP Admin 로그인 시트 설정 가이드

## 1. 시트 생성 및 설정

### 📋 시트 이름
```
ADMIN_USERS
```

### 📊 헤더 설정 (첫 번째 행 A1:F1)
| A | B | C | D | E | F |
|---|---|---|---|---|---|
| **username** | **passwordHash** | **role** | **name** | **isActive** | **lastLogin** |

### 📝 컬럼 설명
- **username**: 로그인 사용자명 (고유값)
- **passwordHash**: 암호화된 비밀번호 해시
- **role**: 사용자 권한 (`super_admin`, `manager`, `user`)
- **name**: 사용자 실명
- **isActive**: 계정 활성화 상태 (`TRUE`/`FALSE`)
- **lastLogin**: 마지막 로그인 시간 (자동 업데이트)

## 2. 초기 데이터 입력

### 기본 관리자 계정
| username | passwordHash | role | name | isActive | lastLogin |
|----------|-------------|------|------|----------|-----------|
| admin | b109f3bbbc244eb82441917ed06d618b9008dd09b3befd1b5e07394c706a8bb980b1d7785e5976ec049b46df5f1326af5a2ea6d103fd07c95385ffab0cacbc86 | super_admin | 시스템 관리자 | TRUE | |

### 운영 관리자 계정
| username | passwordHash | role | name | isActive | lastLogin |
|----------|-------------|------|------|----------|-----------|
| manager | 8d23cf6c86e834a7aa6eded54c26ce2bb2e74903538c61bdd5d2197997ab2f72 | manager | 운영 관리자 | TRUE | |

## 3. 비밀번호 해시 생성 방법

### 방법 1: 브라우저 콘솔 사용
```javascript
// password-generator.js 파일을 브라우저에서 로드 후
generateSingleHash('새비밀번호123!')
```

### 방법 2: Apps Script 함수 직접 호출
```javascript
// Apps Script 에디터에서 실행
function testPasswordHash() {
  const result = addAdminUser({
    username: 'newuser',
    password: '새비밀번호123!',
    role: 'manager',
    name: '새 관리자'
  });
  console.log(result);
}
```

## 4. 계정 관리 함수들

### 새 계정 추가
```javascript
addAdminUser({
  username: 'newadmin',
  password: 'password123!',
  role: 'manager',
  name: '새 관리자'
})
```

### 계정 비활성화
```javascript
setAdminUserActive('username', false)
```

### 비밀번호 변경
```javascript
changeAdminPassword('username', 'newpassword123!')
```

## 5. 권한 레벨

### super_admin
- 모든 데이터 접근
- 계정 관리
- 시스템 설정

### manager
- 데이터 조회/수정
- 제한된 삭제 권한

### user
- 데이터 조회만 가능

## 6. 보안 주의사항

### ⚠️ 중요
1. **기본 비밀번호 즉시 변경**: admin123!, manager123!
2. **HTTPS 필수**: HTTP 환경에서 사용 금지
3. **정기 점검**: 계정 활성화 상태 및 마지막 로그인 확인
4. **백업**: 시트 정기 백업 권장

### 📝 비밀번호 정책
- 최소 8자 이상
- 영문, 숫자, 특수문자 조합
- 주기적 변경 권장

## 7. 시트 보안 설정

### 구글 시트 권한 설정
1. 시트 우클릭 > "시트 보호"
2. 편집 권한을 특정 사용자로 제한
3. "경고 표시" 옵션 활성화

### 시트 숨기기
```javascript
// Apps Script에서 실행
function hideAdminSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_ADMIN_USERS);
  if (sheet) {
    sheet.hideSheet();
  }
}
```

## 8. 테스트 방법

### 1. 시트 확인
- 헤더가 올바르게 설정되었는지 확인
- 기본 계정 데이터가 입력되었는지 확인

### 2. 로그인 테스트
- `admin/login.html` 접속
- 기본 계정으로 로그인 테스트
- 대시보드 접근 확인

### 3. 계정 관리 테스트
```javascript
// Apps Script 에디터에서 실행
function testAccountFunctions() {
  // 새 계정 추가 테스트
  console.log(addAdminUser({
    username: 'test',
    password: 'test123!',
    role: 'user',
    name: '테스트 사용자'
  }));
  
  // 계정 조회 테스트
  console.log(getAdminUser('test'));
  
  // 계정 비활성화 테스트
  console.log(setAdminUserActive('test', false));
}
```

---

## 🚀 빠른 설정 체크리스트

- [ ] 구글 시트에 `ADMIN_USERS` 시트 생성
- [ ] 헤더 설정 (A1:F1)
- [ ] 기본 계정 데이터 입력
- [ ] Apps Script 코드 업데이트
- [ ] 웹앱 재배포
- [ ] 로그인 테스트
- [ ] 기본 비밀번호 변경
- [ ] 시트 보안 설정

**완료 후 반드시 기본 비밀번호를 변경하고 HTTPS 환경에서만 사용하세요!**
