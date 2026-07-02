// YPP 아카데미 신청 폼 처리 스크립트 (간단한 CORS 처리)

function doPost(e) {
  try {
    let data;
    
    // iframe 방식으로 전송된 데이터 처리
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('데이터를 찾을 수 없습니다.');
    }
    
    const formType = data.formType; // 'psac' 또는 'relay'
    
    if (formType === 'psac') {
      return handlePSAC(data);
    } else if (formType === 'relay') {
      return handleRelay(data);
    }
    
    return createResponse(false, '잘못된 폼 타입입니다.');
    
  } catch (error) {
    console.error('Error:', error);
    return createResponse(false, '서버 오류가 발생했습니다: ' + error.message + e.parameter.data);
  }
}

// PSAC 신청 처리
function handlePSAC(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PSAC 신청');
  
  // 현재 마지막 행 번호 확인 (헤더 제외)
  let lastRow = sheet.getLastRow();
  
  // 각 수강자별로 행 추가
  data.students.forEach(student => {
    lastRow++; // 순번 증가
    
    const rowData = [
      '=ROW()-1',                                           // A: 순번
      new Date(),                                           // B: 신청일시
      "",          // C: 과정명
      "",                  // D: 교육일정
      data.companyInfo.companyName,                         // E: 회사명
      data.companyInfo.representative,                      // F: 대표자
      data.companyInfo.businessNumber,                      // G: 사업자등록번호
      data.companyInfo.businessType,                        // H: 종목업태
      data.companyInfo.address,                             // I: 주소
      data.managerInfo.name,                                // J: 교육담당자
      data.managerInfo.department,                          // K: 담당부서
      data.managerInfo.position,                            // L: 담당자직급
      data.managerInfo.phone,                               // M: 담당자전화
      data.managerInfo.mobile,                              // N: 담당자핸드폰
      data.managerInfo.email,                               // O: 담당자이메일
      student.name,                                         // P: 수강자명
      student.department,                                   // Q: 수강자부서
      student.position,                                     // R: 수강자직급
      student.phone,                                        // S: 수강자전화
      student.mobile,                                       // T: 수강자핸드폰
      student.email,                                        // U: 수강자이메일
      student.selectedCourses.join('; ')                    // V: 선택세부교육
    ];
    
    sheet.appendRow(rowData);
  });
  
  return createResponse(true, `PSAC 신청이 완료되었습니다. (수강자 ${data.students.length}명)`);
}

// Relay School 신청 처리 (수정된 버전)
function handleRelay(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Relay School 신청');
  
  // 현재 마지막 행 번호 확인 (헤더 제외)
  let lastRow = sheet.getLastRow();
  
  // 각 수강자별로 행 추가
  data.students.forEach(student => {
    lastRow++; // 순번 증가
    
  const rowData = [
    //lastRow - 1,                                          // A: 순번
    '=ROW()-1',
    new Date(),                                           // B: 신청일시
    data.companyInfo.companyName,                         // C: 회사명
    data.companyInfo.representative,                      // D: 대표자
    data.companyInfo.businessNumber,                      // E: 사업자등록번호
    data.companyInfo.businessType,                        // F: 종목업태
    data.companyInfo.address,                             // G: 주소
    data.managerInfo.name,                                // H: 교육담당f자
    data.managerInfo.department,                          // I: 담당부서
    data.managerInfo.position,                            // J: 담당자직급
    data.managerInfo.phone,                               // K: 담당자전화
    data.managerInfo.mobile,                              // L: 담당자핸드폰
    data.managerInfo.email,                               // M: 담당자이메일
    student.name,                                         // N: 수강자명
    student.department,                                   // O: 수강자부서
    student.position,                                     // P: 수강자직급
    student.phone,                                        // Q: 수강자전화
    student.mobile,                                       // R: 수강자핸드폰
    student.email,                                        // S: 수강자이메일
    student.selectedCourses.join('; ')                    // T: 선택세부교육
  ];
    
    sheet.appendRow(rowData);
  });
  
  return createResponse(true, `Relay School 신청이 완료되었습니다. (수강자 ${data.students.length}명)`);
}

// 간단한 응답 생성 함수
function createResponse(success, message) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET 요청 처리 (테스트용)
function doGet(e) {
  return createResponse(true, 'YPP 아카데미 신청 폼 API가 정상 작동 중입니다.');
}