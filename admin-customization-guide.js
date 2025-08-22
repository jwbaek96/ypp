// YPP Admin Apps Script - 커스터마이징 가이드

/*
=== 시트별 데이터 구조 커스터마이징 가이드 ===

1. DASHBOARD 시트 (특별 처리)
   - getDashboardData() 함수에서 특정 셀 위치 지정
   - 예시: B2, B3, D2, F2 등의 특정 셀 값을 JSON 객체로 구성

2. 일반 시트들 (갤러리, 게시판, 신청서, 문의, 신고)
   - getCustomHeaders() 함수에서 각 시트별 컬럼 매핑 정의
   - getDataStartRow() 함수에서 데이터 시작 행 지정
*/

// ============================================
// 1. DASHBOARD 커스터마이징 예시
// ============================================

/*
현재 DASHBOARD 구조:
{
  "totalUsers": "B2 셀 값",
  "totalGalleries": "B3 셀 값", 
  "totalApplications": "B4 셀 값",
  "monthlyStats": {
    "currentMonth": "D2 셀 값",
    "previousMonth": "D3 셀 값"
  },
  "systemStatus": {
    "serverStatus": "F2 셀 값",
    "lastUpdate": "F3 셀 값"
  }
}

커스터마이징 방법:
getDashboardData() 함수에서 원하는 셀 위치를 수정하세요.

예시:
totalUsers: sheet.getRange('B2').getValue() || 0,  // B2 셀
customData: sheet.getRange('A10').getValue() || '', // A10 셀 추가
*/

// ============================================
// 2. 일반 시트 커스터마이징 예시
// ============================================

/*
갤러리 인허가 (SHEET_GAL_A) 현재 구조:
{
  "id": "A열 (0번째 컬럼)",
  "title": "B열 (1번째 컬럼)",
  "category": "C열 (2번째 컬럼)",
  "status": "D열 (3번째 컬럼)",
  "createdDate": "E열 (4번째 컬럼)",
  "imageUrl": "F열 (5번째 컬럼)",
  "description": "G열 (6번째 컬럼)",
  "tags": "H열 (7번째 컬럼)"
}

커스터마이징 방법:
getCustomHeaders() 함수에서 [SHEET_GAL_A] 부분을 수정하세요.

예시:
[SHEET_GAL_A]: {
  myCustomId: 0,      // A열을 'myCustomId'로 매핑
  projectTitle: 1,    // B열을 'projectTitle'로 매핑
  type: 2,           // C열을 'type'으로 매핑
  approvalStatus: 3,  // D열을 'approvalStatus'로 매핑
  submitDate: 4,     // E열을 'submitDate'로 매핑
  thumbnail: 5,      // F열을 'thumbnail'로 매핑
  note: 6           // G열을 'note'로 매핑
}
*/

// ============================================
// 3. 데이터 시작 행 커스터마이징
// ============================================

/*
현재 설정:
- 대부분 시트: 2행부터 데이터 시작 (1행은 헤더)
- SHEET_GAL_B: 3행부터 데이터 시작 (1-2행은 헤더)

커스터마이징 방법:
getDataStartRow() 함수에서 시트별 시작 행을 변경하세요.

예시:
const dataStartRows = {
  [SHEET_GAL_A]: 2,        // 2행부터 시작
  [SHEET_GAL_B]: 4,        // 4행부터 시작으로 변경
  [SHEET_GAL_C]: 3,        // 3행부터 시작으로 변경
};
*/

// ============================================
// 4. 실제 요청/응답 예시
// ============================================

/*
DASHBOARD 요청:
GET: https://script.google.com/macros/s/YOUR_ID/exec?sheet=SHEET_DASHBOARD

응답:
{
  "success": true,
  "message": "대시보드 데이터 조회 성공",
  "data": {
    "totalUsers": 150,
    "totalGalleries": 45,
    "monthlyStats": {
      "currentMonth": 12,
      "previousMonth": 8
    },
    "systemStatus": {
      "serverStatus": "정상",
      "lastUpdate": "2025-08-22"
    }
  },
  "timestamp": "2025-08-22T10:30:00.000Z"
}

갤러리 인허가 요청:
GET: https://script.google.com/macros/s/YOUR_ID/exec?sheet=SHEET_GAL_A

응답:
{
  "success": true,
  "message": "갤러리 인허가 데이터 조회 성공",
  "data": [
    {
      "id": "GA001",
      "title": "태양광 발전소 프로젝트",
      "category": "인허가",
      "status": "승인",
      "createdDate": "2025-08-15",
      "imageUrl": "https://example.com/image1.jpg",
      "description": "50MW 규모의 태양광 발전소",
      "tags": "태양광,신재생",
      "_rowNumber": 2,
      "_sheetName": "갤러리 인허가"
    },
    // ... 더 많은 데이터
  ],
  "timestamp": "2025-08-22T10:30:00.000Z"
}
*/

// ============================================
// 5. 프론트엔드에서 사용법
// ============================================

// JavaScript 클라이언트 코드
async function loadCustomData() {
  // 대시보드 데이터 (객체 형태)
  const dashboardResponse = await fetch(`${APPS_SCRIPT_URL}?sheet=SHEET_DASHBOARD`);
  const dashboardResult = await dashboardResponse.json();
  
  if (dashboardResult.success) {
    const dashboard = dashboardResult.data;
    console.log('총 사용자:', dashboard.totalUsers);
    console.log('월간 통계:', dashboard.monthlyStats);
  }
  
  // 갤러리 데이터 (배열 형태)
  const galleryResponse = await fetch(`${APPS_SCRIPT_URL}?sheet=SHEET_GAL_A`);
  const galleryResult = await galleryResponse.json();
  
  if (galleryResult.success) {
    const galleries = galleryResult.data;
    galleries.forEach(item => {
      console.log(`제목: ${item.title}, 상태: ${item.status}`);
    });
  }
}

// ============================================
// 6. 빠른 설정 체크리스트
// ============================================

/*
□ 1. SPREADSHEET_ID 설정
□ 2. 각 시트 이름 확인 및 상수 수정
□ 3. DASHBOARD 셀 위치 확인 및 getDashboardData() 수정
□ 4. 각 시트별 컬럼 구조 확인 및 getCustomHeaders() 수정  
□ 5. 헤더 행 수 확인 및 getDataStartRow() 수정
□ 6. 테스트용 testGetData() 함수 실행으로 동작 확인
□ 7. 웹앱 배포 및 URL 확인
□ 8. 클라이언트에서 API 호출 테스트
*/

// ============================================
// 7. 디버깅 팁
// ============================================

/*
1. testGetData() 함수를 먼저 실행해서 데이터 구조 확인
2. 각 시트의 실제 컬럼 위치와 매핑 확인
3. 로그에서 "데이터 조회 시작" 메시지 확인
4. 빈 데이터가 나오면 데이터 시작 행 번호 확인
5. 에러 발생시 console.log에서 상세 오류 메시지 확인
*/
