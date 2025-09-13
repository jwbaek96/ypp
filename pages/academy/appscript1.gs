const SPREADSHEET_ID = '1wxAf9X9vjJsODggD5O-yzMo84gwOEVBCKKZvM6BgUPw'; // 구글시트 ID

// 시트구분
const SHEET_PSAC_A = 'PSAC 제출폼 과목 관리';
const SHEET_PSAC_B = 'PSAC 개요,신청방법';
const SHEET_PSAC_C = 'PSAC 교육일정';
const SHEET_PSAC_D = 'PSAC 과목 상세';
const SHEET_RS_A = 'RelaySchool 제출폼 과목 관리';

/**
 * 웹 앱 진입점 - GET/POST 요청 처리
 */
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

/**
 * 요청 처리 메인 함수
 */
function handleRequest(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'get_psac_courses':
        return createJsonResponse(getPsacCourses());
      case 'get_relay_courses':
        return createJsonResponse(getRelayCourses());
      case 'get_psac_overview':
        return createJsonResponse(getPsacOverview());
      case 'get_psac_schedule':
        return createJsonResponse(getPsacSchedule());
      case 'get_psac_details':
        return createJsonResponse(getPsacDetails());
      default:
        return createJsonResponse({error: 'Invalid action'}, 400);
    }
  } catch (error) {
    console.error('Error:', error);
    return createJsonResponse({error: error.toString()}, 500);
  }
}

/**
 * JSON 응답 생성
 */
function createJsonResponse(data, status = 200) {
  const response = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  if (status !== 200) {
    response.setHeaders({'Status': status});
  }
  
  return response;
}

/**
 * PSAC 과목 관리 데이터 가져오기
 */
function getPsacCourses() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_PSAC_A);
  const data = sheet.getDataRange().getValues();
  
  // 헤더 제거하고 데이터 변환
  const courses = data.slice(1).map((row, index) => {
    return {
      id: index + 1,
      nameKR: row[0] || '',
      nameEN: row[1] || '',
      status: row[2] || 'OFF'
    };
  }).filter(course => course.nameKR); // 빈 행 제거
  
  return {
    success: true,
    data: courses,
    timestamp: new Date().toISOString()
  };
}

/**
 * Relay School 과목 관리 데이터 가져오기
 */
function getRelayCourses() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_RS_A);
  const data = sheet.getDataRange().getValues();
  
  // 헤더 제거하고 데이터 변환
  const courses = data.slice(1).map((row, index) => {
    return {
      id: index + 1,
      nameKR: row[0] || '',
      nameEN: row[1] || '',
      status: row[2] || 'OFF'
    };
  }).filter(course => course.nameKR); // 빈 행 제거
  
  return {
    success: true,
    data: courses,
    timestamp: new Date().toISOString()
  };
}

/**
 * PSAC 개요/신청방법 데이터 가져오기
 */
function getPsacOverview() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_PSAC_B);
  const data = sheet.getDataRange().getValues();
  
  return {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * PSAC 교육일정 데이터 가져오기
 */
function getPsacSchedule() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_PSAC_C);
  const data = sheet.getDataRange().getValues();
  
  return {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * PSAC 과목 상세 데이터 가져오기
 */
function getPsacDetails() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_PSAC_D);
  const data = sheet.getDataRange().getValues();
  
  return {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
}

/**
 * 테스트용 함수
 */
function testFunctions() {
  console.log('PSAC Courses:', getPsacCourses());
  console.log('Relay Courses:', getRelayCourses());
}