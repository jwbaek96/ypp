# YPP Admin Panel 설정 가이드

## 1. Google Apps Script 설정

### 1단계: 스프레드시트 ID 설정
`admin-apps-script.js` 파일에서 다음 부분을 수정하세요:
```javascript
const SPREADSHEET_ID = '1YOUR_SPREADSHEET_ID_HERE'; // 실제 스프레드시트 ID로 변경
```

### 2단계: Google Apps Script에 코드 배포
1. [Google Apps Script](https://script.google.com) 접속
2. 새 프로젝트 생성
3. `admin-apps-script.js` 코드 복사/붙여넣기
4. 배포 → 새 배포 → 웹앱으로 배포
   - 액세스 권한: "모든 사용자"로 설정
   - 배포 ID 복사

### 3단계: HTML에서 배포 ID 설정
`index.html` 파일에서 다음 부분을 수정하세요:
```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

## 2. 스프레드시트 구조

### DASHBOARD 시트
| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| 항목 | 인허가 | 유자격 | 인사이드 | 아카데미 | 보도자료 | PSAC | RelaySchool | 문의KR | 문의EN | 신고 |
| 개수 | 5 | 3 | 8 | 12 | 4 | 15 | 7 | 23 | 11 | 2 |

### 대시보드 데이터 매핑
- `B2`: 갤러리 인허가 개수
- `C2`: 갤러리 유자격 개수
- `D2`: 갤러리 인사이드 개수
- `E2`: 갤러리 아카데미 개수
- `F2`: 게시판 보도자료 개수
- `G2`: PSAC 신청 개수
- `H2`: RelaySchool 신청 개수
- `I2`: 한국어 문의 개수
- `J2`: 영어 문의 개수
- `K2`: 신고 개수

## 3. HTML data-nav 속성 매핑

| HTML data-nav | 대시보드 데이터 | 설명 |
|---------------|----------------|------|
| `license` | `galA` | 갤러리 인허가 |
| `qualification` | `galB` | 갤러리 유자격 |
| `inside` | `galC` | 갤러리 인사이드 |
| `academy` | `galD` | 갤러리 아카데미 |
| `news` | `boardNews` | 게시판 보도자료 |
| `psac` | `applyPSAC` | PSAC 신청 |
| `relay-school` | `applyRelay` | RelaySchool 신청 |
| `customer-inquiries` | `helpKR + helpEN` | 고객문의 (한+영) |
| `corruption-report` | `report` | 부패신고 |

## 4. 테스트 방법

### 브라우저 개발자 도구에서 확인
1. F12 → Console 탭 열기
2. 다음 메시지들이 표시되는지 확인:
   ```
   YPP Admin Panel 초기화...
   대시보드 데이터 로드 중...
   대시보드 데이터: {galA: 5, galB: 3, ...}
   license: 5건 업데이트
   qualification: 3건 업데이트
   ...
   ```

### 수동 테스트
Apps Script 편집기에서 `testGetData()` 함수를 실행하여 데이터가 정상적으로 조회되는지 확인

## 5. 문제 해결

### CORS 에러가 발생하는 경우
- Apps Script 배포 시 "모든 사용자" 액세스 권한으로 설정했는지 확인
- 배포 ID가 올바른지 확인

### 데이터가 표시되지 않는 경우
1. 스프레드시트 ID가 올바른지 확인
2. 시트 이름이 코드와 일치하는지 확인
3. 대시보드 시트의 셀 위치가 올바른지 확인

### 권한 에러가 발생하는 경우
- Google Apps Script에서 스프레드시트 읽기 권한 승인
- 스프레드시트 공유 설정 확인

## 6. 추가 기능 구현

현재 각 nav 항목을 클릭하면 `handleNavClick()` 함수가 호출됩니다.
여기에 각 섹션별 상세 관리 페이지 로직을 추가할 수 있습니다.

```javascript
function handleNavClick(navType) {
    switch(navType) {
        case 'license':
            loadGalleryManagement('license');
            break;
        case 'psac':
            loadApplicationManagement('psac');
            break;
        // ... 다른 케이스들
    }
}
```
