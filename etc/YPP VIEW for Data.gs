// Google Apps Script - YPP Admin System

const SPREADSHEET_ID = '1BZ6IzcMFtZhgUuTThvkAf7sU6wVUOwFmpPkCUadFmX0'; // 대시보드 구글시트 ID
const SHEET_DASHBOARD = 'DASHBOARD'; // 대시보드 시트 이름

// 오리지널 시트 정보 (수정/삭제 가능한 원본 시트들)
const ORIGINAL_SHEETS = {
  SHEET_GAL_A: {
    id: '1TSX0ds3gxKp-GENREmnckvuTI3RpwhuLZq6ZJbrVJuA',
    name: '시트1' // 기본 시트명 (필요시 수정)
  },
  SHEET_GAL_B: {
    id: '17hLRXv-zXuo-xsIhsN7Qks4nVwaRuW6_uVkkTNI72e8',
    name: '시트1'
  },
  SHEET_GAL_C: {
    id: '1883SgdNBFGLDyGXs5zITslHQPV-Oa90ilt9eG7af70c',
    name: '시트1'
  },
  SHEET_GAL_F: {
    id: '1gY5o_fHrXxAShXdSzqhyZBdLskbsAEwIdihci0UeU8c',
    name: '시트1'
  },
  SHEET_GAL_VIDEO: {
    id: '1BopJLpq_yYbpJDTFtUxPRQKW2p5A1S9FE-wuXN32ph4',
    name: '시트1'
  },
  SHEET_BOARD_NEWS: {
    id: '1ZEtN7--25jDh_fY4l_KLNs18mNJx3vmQEsgunvD69jo',
    name: '시트1'
  },
  SHEET_APPLY_P: {
    id: '1QAhkg8kpYjVsfXxrgR07dr4t5pRKtLEyg2vc8WeOet4',
    name: 'PSAC 신청'
  },
  SHEET_APPLY_R: {
    id: '1QAhkg8kpYjVsfXxrgR07dr4t5pRKtLEyg2vc8WeOet4',
    name: 'Relay School 신청'
  },
  SHEET_APPLY_RS: {
    id: '1Py8yKWngNV8iRW4lBWzcQ1qiENaPL3QjJGuhvYbnmQg',
    name: '시트1'
  },
  SHEET_HELP_KR: {
    id: '1PCIS1sJyR2HMniaIC-Ga4NIpFGv1xSKYbo1rqXXaMq8',
    name: '시트1'
  },
  SHEET_HELP_EN: {
    id: '1CgXONK55xzAx_WV3-T1b1IawNgJsE94tbLMebZUekDA',
    name: '시트1'
  },
  SHEET_REPORT: {
    id: '1mLh1yywTgwZ_NNaIic-46pPP8VfVR5FG5CeOG1XhiAU',
    name: '시트1'
  }
};

// IMPORTRANGE용 시트 정보 (읽기 전용)
const SHEET_GAL_A = '갤러리 인허가'; // 대시보드 시트의 IMPORTRANGE 시트명
const SHEET_GAL_B = '갤러리 유자격';
const SHEET_GAL_C = '갤러리 인사이드';
const SHEET_GAL_F = '갤러리 아카데미';
const SHEET_GAL_VIDEO = '갤러리 비디오';
const SHEET_BOARD_NEWS = '게시판 보도자료';
const SHEET_APPLY_P = '신청 PSAC';
const SHEET_APPLY_R = '신청 RelaySchool';
const SHEET_APPLY_RS = '신청 RelaySchool Special';
const SHEET_HELP_KR = '문의 KOR';
const SHEET_HELP_EN = '문의 ENG';
const SHEET_REPORT = '신고';

/**
 * HTTP POST 요청 처리 함수 (삭제 등)
 * @param {Object} e - 이벤트 객체
 */
function doPost(e) {
  try {
    // CORS 헤더 설정
    const response = {
      success: false,
      message: '',
      data: null,
      timestamp: new Date().toISOString()
    };

    // 매개변수 안전성 검사
    if (!e) {
      response.message = 'POST 요청 데이터가 없습니다.';
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // POST 데이터 파싱
    let requestData = {};
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    }
    
    // 안전한 파라미터 접근
    const action = requestData.action || (e.parameter && e.parameter.action) || '';
    const sheetType = requestData.sheet || (e.parameter && e.parameter.sheet) || '';
    const itemId = requestData.id || (e.parameter && e.parameter.id) || '';
    
    // 액션별 처리
    switch (action) {
      case 'delete':
        if (!sheetType || !itemId) {
          response.message = '시트 타입과 항목 ID가 필요합니다.';
          break;
        }
        
        const deleteResult = deleteItem(sheetType, itemId);
        response.success = deleteResult.success;
        response.message = deleteResult.message;
        response.data = deleteResult.data;
        break;
        
      case 'batchDelete':
        const ids = requestData.ids || [];
        if (!sheetType || !Array.isArray(ids) || ids.length === 0) {
          response.message = '시트 타입과 삭제할 항목 ID 목록이 필요합니다.';
          break;
        }
        
        const batchResult = batchDeleteItems(sheetType, ids);
        response.success = batchResult.success;
        response.message = batchResult.message;
        response.data = batchResult.data;
        break;
        
      default:
        response.message = `지원하지 않는 액션입니다: ${action}`;
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('doPost 에러:', error);
    const errorResponse = {
      success: false,
      message: `서버 오류: ${error.message}`,
      data: null,
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTTP GET 요청 처리 메인 함수
 * @param {Object} e - 이벤트 객체 (URL 파라미터 포함)
 */
function doGet(e) {
  try {
    // CORS 헤더 설정
    const response = {
      success: false,
      message: '',
      data: null,
      timestamp: new Date().toISOString()
    };

    // 매개변수 안전성 검사 (테스트 실행 시 e가 undefined일 수 있음)
    if (!e || !e.parameter) {
      response.message = 'URL 파라미터가 없습니다. 웹앱으로 호출해주세요.';
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 요청 파라미터 확인
    const sheetType = e.parameter.sheet || '';
    const action = e.parameter.action || 'getData';
    const itemId = e.parameter.id || '';

    // 액션별 처리
    if (action === 'downloadCSV') {
      try {
        // 시트 타입에 따른 시트명 매핑
        const sheetName = getSheetNameByType(sheetType);
        if (!sheetName) {
          response.message = `지원하지 않는 시트 타입입니다: ${sheetType}`;
          response.success = false;
        } else {
          const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
          if (!sheet) {
            response.message = `시트를 찾을 수 없습니다: ${sheetName}`;
            response.success = false;
          } else {
            const data = sheet.getDataRange().getValues();
            
            // CSV 형식으로 변환
            const csv = data.map(row => 
              row.map(cell => `"${String(cell).replace(/"/g, '""')}"`)
                .join(',')
            ).join('\n');
            
            return ContentService
              .createTextOutput(csv)
              .setMimeType(ContentService.MimeType.CSV);
          }
        }
      } catch (error) {
        response.message = `CSV 다운로드 오류: ${error.message}`;
        response.success = false;
      }
    } else if (action === 'delete') {
      // 삭제 액션 처리
      if (!sheetType || !itemId) {
        response.message = '시트 타입과 항목 ID가 필요합니다.';
        response.success = false;
      } else {
        const deleteResult = deleteItem(sheetType, itemId);
        response.success = deleteResult.success;
        response.message = deleteResult.message;
        response.data = deleteResult.data;
      }
    } else if (action === 'update') {
      // 수정 액션 처리
      if (!sheetType || !itemId) {
        response.message = '시트 타입과 항목 ID가 필요합니다.';
        response.success = false;
      } else {
        const dataParam = e.parameter.data || '';
        if (!dataParam) {
          response.message = '수정할 데이터가 필요합니다.';
          response.success = false;
        } else {
          try {
            const updateData = JSON.parse(decodeURIComponent(dataParam));
            const updateResult = updateItem(sheetType, itemId, updateData);
            response.success = updateResult.success;
            response.message = updateResult.message;
            response.data = updateResult.data;
          } catch (error) {
            response.message = '데이터 파싱 오류: ' + error.message;
            response.success = false;
          }
        }
      }
    } else if (action === 'batchDelete') {
      // 배치 삭제 액션 처리
      const idsParam = e.parameter.ids || '';
      if (!sheetType || !idsParam) {
        response.message = '시트 타입과 삭제할 항목 ID 목록이 필요합니다.';
        response.success = false;
      } else {
        try {
          const ids = JSON.parse(idsParam);
          if (!Array.isArray(ids) || ids.length === 0) {
            response.message = '삭제할 항목 ID 목록이 올바르지 않습니다.';
            response.success = false;
          } else {
            const batchResult = batchDeleteItems(sheetType, ids);
            response.success = batchResult.success;
            response.message = batchResult.message;
            response.data = batchResult.data;
          }
        } catch (error) {
          response.message = 'ID 목록 파싱 오류: ' + error.message;
          response.success = false;
        }
      }
    } else if (action === 'getData' || action === undefined || action === '') {
      // 기존 데이터 조회 액션들 (기본 액션)
      // 시트 타입에 따른 분기 처리
      switch (sheetType) {
      case 'SHEET_DASHBOARD':
        response.data = getData(SHEET_DASHBOARD);
        response.message = '대시보드 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_GAL_A':
        response.data = getData(SHEET_GAL_A);
        response.message = '갤러리 인허가 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_GAL_B':
        response.data = getData(SHEET_GAL_B);
        response.message = '갤러리 유자격 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_GAL_C':
        response.data = getData(SHEET_GAL_C);
        response.message = '갤러리 인사이드 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_GAL_F':
        response.data = getData(SHEET_GAL_F);
        response.message = '갤러리 아카데미 데이터 조회 성공';
        response.success = true;
        break;

      case 'SHEET_GAL_VIDEO':
        response.data = getData(SHEET_GAL_VIDEO);
        response.message = '갤러리 비디오 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_BOARD_NEWS':
        response.data = getData(SHEET_BOARD_NEWS);
        response.message = '게시판 보도자료 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_APPLY_P':
        response.data = getData(SHEET_APPLY_P);
        response.message = 'PSAC 신청 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_APPLY_R':
        response.data = getData(SHEET_APPLY_R);
        response.message = 'RelaySchool 신청 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_APPLY_RS':
        response.data = getData(SHEET_APPLY_RS);
        response.message = 'RelaySchool Special 신청 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_HELP_KR':
        response.data = getData(SHEET_HELP_KR);
        response.message = '한국어 문의 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_HELP_EN':
        response.data = getData(SHEET_HELP_EN);
        response.message = '영어 문의 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'SHEET_REPORT':
        response.data = getData(SHEET_REPORT);
        response.message = '신고 데이터 조회 성공';
        response.success = true;
        break;
        
      case 'ALL_STATS':
        response.data = getAllStats();
        response.message = '전체 통계 데이터 조회 성공';
        response.success = true;
        break;
        
      default:
        response.message = `지원하지 않는 시트 타입입니다: ${sheetType}`;
        response.success = false;
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('doGet 에러:', error);
    const errorResponse = {
      success: false,
      message: `서버 오류: ${error.message}`,
      data: null,
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 특정 시트의 데이터를 가져오는 함수 (시트별 맞춤 구조)
 * @param {string} sheetName - 시트 이름
 * @returns {Array|Object} 시트 데이터 (DASHBOARD는 객체, 나머지는 배열)
 */
function getData(sheetName) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
    if (!sheet) {throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);}
    
    // DASHBOARD 시트는 특별 처리
    if (sheetName === SHEET_DASHBOARD) {
      return getDashboardData(sheet);
    }
    
    // 나머지 시트들은 시트별 맞춤 구조
    return getSheetSpecificData(sheet, sheetName);
    
  } catch (error) {
    console.error(`getData 에러 (${sheetName}):`, error);
    throw error;
  }
}

/**
 * DASHBOARD 시트의 특정 셀 데이터를 가져오는 함수
 * @param {Sheet} sheet - 구글시트 객체
 * @returns {Object} 대시보드 데이터 객체
 */
function getDashboardData(sheet) {
  try {
    // 특정 셀들을 지정해서 데이터 가져오기 (3행에서 실제 숫자 데이터)
    const dashboardData = {
        galA: sheet.getRange('B3').getValue() || 0,    // 갤러리 인허가
        galB: sheet.getRange('C3').getValue() || 0,    // 갤러리 유자격  
        galC: sheet.getRange('D3').getValue() || 0,    // 갤러리 인사이드
        galD: sheet.getRange('E3').getValue() || 0,    // 갤러리 아카데미
        galVideo: sheet.getRange('F3').getValue() || 0,    // 갤러리 비디
        boardNews: sheet.getRange('G3').getValue() || 0,     // 게시판 보도자료
        applyPSAC: sheet.getRange('H3').getValue() || 0,     // 신청 PSAC
        applyRelay: sheet.getRange('I3').getValue() || 0,    // 신청 RelaySchool
        applyRelaySpecial: sheet.getRange('J3').getValue() || 0,    // 신청 RelaySchool Special
        helpKR: sheet.getRange('K3').getValue() || 0,        // 문의 KOR
        helpEN: sheet.getRange('L3').getValue() || 0,        // 문의 ENG
        report: sheet.getRange('M3').getValue() || 0         // 신고
    };
    
    console.log(`DASHBOARD 데이터 조회 완료`);
    return dashboardData;
    
  } catch (error) {
    console.error('getDashboardData 에러:', error);
    throw error;
  }
}

/**
 * 각 시트별 맞춤 데이터 구조를 가져오는 함수
 * @param {Sheet} sheet - 구글시트 객체  
 * @param {string} sheetName - 시트 이름
 * @returns {Array} 시트별 맞춤 데이터 배열
 */
function getSheetSpecificData(sheet, sheetName) {
  try {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    // 데이터가 없는 경우
    if (lastRow <= 1) {
      console.log(`${sheetName}에 데이터가 없습니다.`);
      return [];
    }
    
    // 시트별 커스텀 헤더 매핑 정의
    const customHeaders = getCustomHeaders(sheetName);
    const dataStartRow = getDataStartRow(sheetName); // 데이터 시작 행
    
    // 실제 데이터 범위 가져오기
    const dataRange = sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, lastCol);
    const dataValues = dataRange.getValues();
    const sheetData = [];

    console.log(`${sheetName}: 데이터 시작행 ${dataStartRow}, ${dataValues.length}개 행`);

    // 데이터 매핑
    dataValues.forEach((row, index) => {
      // 빈 행 스킵
      if (!row[0] && !row.some(cell => cell !== '')) {
        return;
      }
      
      const item = {};
      
      // 커스텀 헤더 매핑 적용
      Object.keys(customHeaders).forEach(key => {
        const colIndex = customHeaders[key];
        let value = row[colIndex] || '';
        
        // 공통 처리 함수 호출
        value = processFieldValue(value, key, sheetName);
        
        // 빈 값 처리
        if (value === undefined || value === null) {
          value = '';
        }
        
        item[key] = value;
      });

      // 메타 데이터 추가
      item._rowNumber = index + dataStartRow;
      item._sheetName = sheetName;
      
      sheetData.push(item);
    });
    
    console.log(`${sheetName} 데이터 조회 완료: ${sheetData.length}개 항목`);
    return sheetData;
    
  } catch (error) {
    console.error(`getSheetSpecificData 에러 (${sheetName}):`, error);
    throw error;
  }
}

/**
 * 시트별 커스텀 헤더 매핑을 반환하는 함수
 * @param {string} sheetName - 시트 이름
 * @returns {Object} 키:컬럼인덱스 매핑 객체
 */
function getCustomHeaders(sheetName) {
  const headerMappings = {
    [SHEET_GAL_A]: { // 갤러리 인허가
      id: 0,
      date: 2,
      titleKR: 3,
      titleEN: 4,
      image: 5,
      state: 6
    },
    
    [SHEET_GAL_B]: { // 갤러리 유자격
      id: 0,
      date: 2,
      titleKR: 3,
      titleEN: 4,
      image: 5,
      state: 6
    },
    
    [SHEET_GAL_C]: { // 갤러리 인사이드
      id: 0,
      date: 5,
      titleKR: 3,
      titleEN: 4,
      state: 6,
      textKR: 7,
      textEN: 8,
      image: 9
    },
    
    [SHEET_GAL_F]: { // 갤러리 아카데미
      id: 0,
      date: 2,
      titleKR: 3,
      titleEN: 4,
      category: 5,
      state: 6,
      textKR: 7,
      textEN: 8,
      image: 9
    },
    [SHEET_GAL_VIDEO]: { // 갤러리 비디오
      id: 0,              // Submission ID
      respondentId: 1,     // Respondent ID
      submittedAt: 2,      // Submitted at
      number: 3,           // 순번
      state: 4,            // 상태
      titleKR: 5,          // 제목(한글)
      titleEN: 6,          // 제목(영문)
      videoFileKR: 7,      // 비디오 첨부(한글)
      videoFileEN: 8,      // 비디오 첨부(영문)
      contentKR: 9,        // 내용(한글)
      contentEN: 10,       // 내용(영문)
      videoLinkKR: 11,     // 비디오 링크(youtube 링크)(한글)
      videoLinkEN: 12      // 비디오 링크(youtube 링크)(영문)
    },
    
    [SHEET_BOARD_NEWS]: { // 게시판 보도자료
      id: 0,              // Submission ID
      respondentId: 1,     // Respondent ID
      submittedAt: 2,      // Submitted at
      number: 3,           // 순번
      category: 4,         // 분류 (공지사항/보도자료)
      state: 5,            // 상태
      titleKR: 6,          // 제목(한글)
      titleEN: 7,          // 제목(영문)
      image: 8,            // 이미지 업로드
      contentKR: 9,        // 내용(한글)
      contentEN: 10,       // 내용(영문)
      sourceLink: 11,      // 출처(링크)
      fileUpload: 12,      // 파일 업로드
      popup: 13,           // 팝업
      popupImageKR: 14,    // 팝업이미지 업로드(한글)
      popupImageEN: 15     // 팝업이미지 업로드(영문)
    },
    
    [SHEET_APPLY_P]: { // 신청 PSAC
      number: 0,              // 번호
      applicationDate: 1,     // 신청일시
      courseName: 2,          // 과정명
      educationSchedule: 3,   // 교육일정
      companyName: 4,         // 회사명
      ceoName: 5,             // 대표자명
      businessNumber: 6,      // 사업자등록번호
      businessType: 7,        // 종목업태
      companyAddress: 8,      // 주소
      educationManager: 9,    // 교육담당자
      managerDepartment: 10,   // 담당자부서
      managerPosition: 11,    // 담당자직급
      managerPhone: 12,       // 담당자전화
      managerMobile: 13,      // 담당자핸드폰
      managerEmail: 14,       // 담당자이메일
      studentName: 15,        // 수강자명
      studentDepartment: 16,  // 수강자부서
      studentPosition: 17,    // 수강자직급
      studentPhone: 18,       // 수강자전화
      studentMobile: 19,      // 수강자핸드폰
      studentEmail: 20,       // 수강자이메일
      detailedEducation: 21,  // 선택세부교육
      confirmation: 22,       // 확인
      remarks: 23,            // 비고
      lockStatus: 24          // 잠금상태 (true/false)
    },
    
    [SHEET_APPLY_R]: { // 신청 RelaySchool
      number: 0,              // 순번 (A)
      applicationDate: 1,     // 신청일시 (B)
      companyName: 2,         // 회사명 (C)
      ceoName: 3,             // 대표자 (D)
      businessNumber: 4,      // 사업자등록번호 (E)
      businessType: 5,        // 종목업태 (F)
      companyAddress: 6,      // 주소 (G)
      educationManager: 7,    // 교육담당자 (H)
      managerDepartment: 8,   // 담당부서 (I)
      managerPosition: 9,     // 담당자직급 (J)
      managerPhone: 10,       // 담당자전화 (K)
      managerMobile: 11,      // 담당자핸드폰 (L)
      managerEmail: 12,       // 담당자이메일 (M)
      studentName: 13,        // 수강자명 (N)
      studentDepartment: 14,  // 수강자부서 (O)
      studentPosition: 15,    // 수강자직급 (P)
      studentPhone: 16,       // 수강자전화 (Q)
      studentMobile: 17,      // 수강자핸드폰 (R)
      studentEmail: 18,       // 수강자이메일 (S)
      detailedEducation: 19,  // 선택세부교육 (T)
      confirmation: 20,       // 확인 (U)
      remarks: 21,            // 비고 (V)
      lockStatus: 22          // 잠금상태 (W)
    },

    [SHEET_APPLY_RS]: { // 신청 RelaySchool Special
      submissionId: 0,        // Submission ID
      respondentId: 1,        // Respondent ID  
      submittedAt: 2,         // Submitted at
      companyName: 3,
      ceoName: 4,
      businessNumber: 5,
      businessType: 6,
      companyAddress: 7,      //주소
      managerName: 8,    //담당자명
      managerDepartment: 9,   //담당부서
      managerPhone: 10,       //연락처
      managerEmail: 11,       //이메일
      courseContents: 12,     //교육내용
      courseDuration: 13,     //교육기간
      traineeLevel: 14,       //교육 대상자 수준
      traineeCount: 15,       //교육 대상자 인원
      confirmation: 16,       //확인
      remarks: 17,             //비고
      number: 18               //번호
    },

    [SHEET_HELP_KR]: { // 문의 KOR
      submissionId: 0,        // Submission ID
      respondentId: 1,        // Respondent ID  
      submittedAt: 2,         // Submitted at
      inquiryType: 3,         // 문의 유형
      nameCompany: 4,         // 성함/회사명
      emailPhone: 5,          // 이메일/전화번호
      subject: 6,             // 제목
      content: 7,             // 문의 내용
      attachment: 8,          // 파일 첨부 (도면, 제안서, 사양서 등)
      privacyConsent: 10,      // 개인정보 수집·이용 동의
      confirmation: 11,        // 확인
      remarks: 12              // 비고
    },
    
    [SHEET_HELP_EN]: { // 문의 ENG (영한 동일 구조)
      submissionId: 0,        // Submission ID
      respondentId: 1,        // Respondent ID
      submittedAt: 2,         // Submitted at
      inquiryType: 3,         // 문의 유형
      nameCompany: 4,         // 성함/회사명
      emailPhone: 5,          // 이메일/전화번호
      subject: 6,             // 제목
      content: 7,             // 문의 내용
      attachment: 8,          // 파일 첨부 (도면, 제안서, 사양서 등)
      privacyConsent: 10,      // 개인정보 수집·이용 동의
      confirmation: 11,        // 확인
      remarks: 12              // 비고
    },
    
    [SHEET_REPORT]: { // 신고
      id: 0,
      reporterName: 1,
      reporterEmail: 2,
      reportType: 3,
      targetUrl: 4,
      description: 5,
      reportDate: 6,
      status: 7,
      adminNotes: 8
    }
  };
  
  return headerMappings[sheetName] || {};
}

/**
 * 시트별 데이터 시작 행을 반환하는 함수
 * @param {string} sheetName - 시트 이름
 * @returns {number} 데이터 시작 행 번호 (1부터 시작)
 */
function getDataStartRow(sheetName) {
  const dataStartRows = {
    [SHEET_GAL_A]: 2,        // 2행부터 데이터 시작
    [SHEET_GAL_B]: 2,        // 2행부터 데이터 시작 (헤더 2줄)
    [SHEET_GAL_C]: 2,        // 2행부터 데이터 시작
    [SHEET_GAL_F]: 2,        // 2행부터 데이터 시작
    [SHEET_GAL_VIDEO]: 2,        // 2행부터 데이터 시작
    [SHEET_BOARD_NEWS]: 2,   // 2행부터 데이터 시작
    [SHEET_APPLY_P]: 2,      // 2행부터 데이터 시작
    [SHEET_APPLY_R]: 2,      // 2행부터 데이터 시작
    [SHEET_APPLY_RS]: 2,      // 2행부터 데이터 시작
    [SHEET_HELP_KR]: 2,      // 2행부터 데이터 시작
    [SHEET_HELP_EN]: 2,      // 2행부터 데이터 시작
    [SHEET_REPORT]: 2        // 2행부터 데이터 시작
  };
  
  return dataStartRows[sheetName] || 2; // 기본값 2행
}

/**
 * 모든 시트의 통계 정보를 가져오는 함수
 * @returns {Object} 각 시트별 데이터 수와 전체 통계
 */
function getAllStats() {
  try {
    const stats = {
      dashboard: getSheetStats(SHEET_DASHBOARD),
      galleries: {
        permit: getSheetStats(SHEET_GAL_A),
        qualified: getSheetStats(SHEET_GAL_B),
        inside: getSheetStats(SHEET_GAL_C),
        academy: getSheetStats(SHEET_GAL_F),
        video: getSheetStats(SHEET_GAL_VIDEO),
        total: 0
      },
      board: {
        news: getSheetStats(SHEET_BOARD_NEWS)
      },
      applications: {
        psac: getSheetStats(SHEET_APPLY_P),
        relaySchool: getSheetStats(SHEET_APPLY_R),
        relaySchoolSpecial: getSheetStats(SHEET_APPLY_RS),
        total: 0
      },
      inquiries: {
        korean: getSheetStats(SHEET_HELP_KR),
        english: getSheetStats(SHEET_HELP_EN),
        total: 0
      },
      reports: getSheetStats(SHEET_REPORT),
      lastUpdated: new Date().toISOString()
    };
    
    // 합계 계산
    stats.galleries.total = stats.galleries.permit.count + stats.galleries.qualified.count + 
                           stats.galleries.inside.count + stats.galleries.academy.count + stats.galleries.video.count;
    
    stats.applications.total = stats.applications.psac.count + stats.applications.relaySchool.count + stats.applications.relaySchoolSpecial.count;
    stats.inquiries.total = stats.inquiries.korean.count + stats.inquiries.english.count;
    
    return stats;
    
  } catch (error) {
    console.error('getAllStats 에러:', error);
    throw error;
  }
}

/**
 * 특정 시트의 기본 통계 정보를 가져오는 함수
 * @param {string} sheetName - 시트 이름
 * @returns {Object} 시트 통계 정보
 */
function getSheetStats(sheetName) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
    if (!sheet) {
      return { count: 0, lastUpdated: null, error: '시트를 찾을 수 없음' };
    }
    
    const lastRow = sheet.getLastRow();
    const count = Math.max(0, lastRow - 1); // 헤더 제외
    const lastUpdated = new Date().toISOString();
    
    return {
      count: count,
      lastUpdated: lastUpdated,
      sheetName: sheetName
    };
    
  } catch (error) {
    console.error(`getSheetStats 에러 (${sheetName}):`, error);
    return { count: 0, lastUpdated: null, error: error.message };
  }
}

/**
 * 특정 시트에 새 데이터를 추가하는 함수 (POST 요청용)
 * @param {string} sheetName - 시트 이름
 * @param {Object} data - 추가할 데이터
 * @returns {boolean} 성공 여부
 */
function addData(sheetName, data) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`시트를 찾을 수 없습니다: ${sheetName}`);
    }
    
    // 헤더 가져오기
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // 데이터를 헤더 순서대로 배열로 변환
    const rowData = headers.map(header => data[header] || '');
    
    // 타임스탬프 추가 (생성일 컬럼이 있는 경우)
    if (headers.includes('생성일') || headers.includes('등록일')) {
      const timestampIndex = headers.findIndex(h => h === '생성일' || h === '등록일');
      if (timestampIndex !== -1) {
        rowData[timestampIndex] = new Date();
      }
    }
    
    // 새 행 추가
    sheet.appendRow(rowData);
    
    console.log(`${sheetName}에 새 데이터 추가 완료`);
    return true;
    
  } catch (error) {
    console.error(`addData 에러 (${sheetName}):`, error);
    throw error;
  }
}

/**
 * 필드 값 처리 공통 함수 (중복 코드 제거)
 * @param {any} value - 처리할 값
 * @param {string} key - 필드 키
 * @param {string} sheetName - 시트 이름
 * @returns {any} 처리된 값
 */
function processFieldValue(value, key, sheetName) {
  // 갤러리 시트들 공통 처리
  const gallerySheets = [SHEET_GAL_A, SHEET_GAL_B, SHEET_GAL_C, SHEET_GAL_F, SHEET_GAL_VIDEO];
  if (gallerySheets.includes(sheetName)) {
    return processGalleryField(value, key, sheetName);
  }
  
  // 신청 시트들 공통 처리
  if ([SHEET_APPLY_P, SHEET_APPLY_R].includes(sheetName)) {
    if (key === 'applicationDate') {
      return formatDate(value, 'datetime');
    }
  }
  
  // RelaySchool Special 신청 시트 처리
  if (sheetName === SHEET_APPLY_RS) {
    if (key === 'submittedAt') {
      return formatDate(value, 'datetime');
    }
  }
  
  // 문의 시트들 공통 처리
  if ([SHEET_HELP_KR, SHEET_HELP_EN].includes(sheetName)) {
    if (key === 'submittedAt') {
      return formatDate(value, 'datetime');
    }
  }
  
  // 보도자료 시트 처리
  if (sheetName === SHEET_BOARD_NEWS) {
    if (key === 'submittedAt') {
      return formatDate(value, 'datetime');
    }
    if (key === 'state') {
      return (value || '').toString().toLowerCase() === 'on' ? 'on' : 'off';
    }
  }
  
  // 신고 시트 처리
  if (sheetName === SHEET_REPORT) {
    if (key === 'submittedAt') {
      return formatDate(value, 'datetime');
    }
  }
  
  // 일반적인 날짜 타입 처리
  if (value instanceof Date && key !== 'date') {
    return value.toISOString().split('T')[0];
  }
  
  return value;
}

/**
 * 갤러리 시트 필드 처리 함수
 * @param {any} value - 처리할 값
 * @param {string} key - 필드 키
 * @param {string} sheetName - 시트 이름
 * @returns {any} 처리된 값
 */
function processGalleryField(value, key, sheetName) {
  switch (key) {
    case 'date':
      return formatDate(value, 'datetime');
      
    case 'category':
      // 아카데미 갤러리만 카테고리 처리
      if (sheetName === SHEET_GAL_F) {
        return (value || '').toString().toLowerCase();
      }
      return value;
      
    case 'state':
      return (value || '').toString().toLowerCase() === 'on' ? 'on' : 'off';
      
    case 'image':
      return parseImageField(value);
      
    default:
      return value;
  }
}

/**
 * 이미지 필드 파싱 함수
 * @param {any} value - 이미지 데이터
 * @returns {Array} 이미지 URL 배열
 */
function parseImageField(value) {
  if (!value) return [];
  
  // JSON 문자열로 저장된 배열 파싱 시도
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // JSON 파싱 실패 시 줄바꿈으로 분리
      return value.split('\n').filter(url => url.trim() !== '');
    }
  }
  
  // 줄바꿈으로 구분된 문자열을 배열로 변환
  if (typeof value === 'string') {
    return value.split('\n').filter(url => url.trim() !== '');
  }
  
  // 이미 배열인 경우
  if (Array.isArray(value)) {
    return value;
  }
  
  return [];
}

/**
 * 날짜 포맷팅 함수 (다양한 날짜 형식 지원)
 * @param {Date|string} dateValue - 날짜 값
 * @param {string} format - 출력 형식 ('date' | 'datetime' | 'time')
 * @returns {string} 포맷된 날짜 문자열
 */
function formatDate(dateValue, format = 'date') {
  try {
    if (!dateValue) return '';
    
    let date;
    if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    
    // 유효한 날짜인지 확인
    if (isNaN(date.getTime())) {
      return dateValue.toString(); // 원본 값 반환
    }
    
    // 구글 시트의 날짜를 그대로 사용 (이미 한국 시간대)
    // 추가 시간대 보정 없이 원본 날짜 형식 유지
    switch (format) {
      case 'datetime':
        return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      case 'time':
        return Utilities.formatDate(date, 'Asia/Seoul', 'HH:mm:ss');
      case 'date':
      default:
        return Utilities.formatDate(date, 'Asia/Seoul', 'yyyy-MM-dd');
    }
    
  } catch (error) {
    console.error('formatDate 에러:', error);
    return dateValue ? dateValue.toString() : '';
  }
}


/**
 * 단일 항목 삭제 함수 (오리지널 시트에서 삭제)
 * @param {string} sheetType - 시트 타입 (SHEET_APPLY_P, SHEET_APPLY_R 등)
 * @param {string} itemId - 삭제할 항목의 ID
 * @returns {Object} 삭제 결과
 */
function deleteItem(sheetType, itemId) {
  try {
    console.log(`삭제 요청: ${sheetType}, ID: ${itemId}`);
    
    // 오리지널 시트 정보 가져오기
    const originalSheet = ORIGINAL_SHEETS[sheetType];
    if (!originalSheet) {
      return { success: false, message: `지원하지 않는 시트 타입입니다: ${sheetType}` };
    }
    
    if (!originalSheet.id) {
      return { success: false, message: `시트 ID가 설정되지 않았습니다: ${sheetType}` };
    }
    
    // 오리지널 스프레드시트 열기
    const spreadsheet = SpreadsheetApp.openById(originalSheet.id);
    const sheet = spreadsheet.getSheetByName(originalSheet.name);
    
    if (!sheet) {
      return { success: false, message: `시트를 찾을 수 없습니다: ${originalSheet.name}` };
    }
    
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
    
    console.log(`데이터 검색 중... 총 ${data.length}행`);
    
    // 헤더 제외하고 데이터 검색
    for (let i = 1; i < data.length; i++) {
      const rowData = data[i];
      
      // 첫 번째 컬럼(ID/번호)과 일치하는 행 찾기
      if (rowData[0] && rowData[0].toString() === itemId.toString()) {
        // 해당 행 삭제 (Excel 행 번호는 1부터 시작)
        sheet.deleteRow(i + 1);
        
        console.log(`삭제 완료: ${originalSheet.name}, ID: ${itemId}, 행: ${i + 1}`);
        return { 
          success: true, 
          message: '항목이 성공적으로 삭제되었습니다.',
          data: { deletedId: itemId, deletedRow: i + 1, sheetName: originalSheet.name }
        };
      }
    }
    
    return { success: false, message: '해당 항목을 찾을 수 없습니다.' };
    
  } catch (error) {
    console.error('deleteItem 에러:', error);
    return { success: false, message: `삭제 중 오류가 발생했습니다: ${error.message}` };
  }
}

/**
 * 다중 항목 삭제 함수 (오리지널 시트에서 삭제)
 * @param {string} sheetType - 시트 타입
 * @param {Array} itemIds - 삭제할 항목 ID 목록
 * @returns {Object} 삭제 결과
 */
function batchDeleteItems(sheetType, itemIds) {
  try {
    console.log(`배치 삭제 요청: ${sheetType}, IDs: ${itemIds.join(', ')}`);
    
    // 오리지널 시트 정보 가져오기
    const originalSheet = ORIGINAL_SHEETS[sheetType];
    if (!originalSheet) {
      return { success: false, message: `지원하지 않는 시트 타입입니다: ${sheetType}` };
    }
    
    if (!originalSheet.id) {
      return { success: false, message: `시트 ID가 설정되지 않았습니다: ${sheetType}` };
    }
    
    // 오리지널 스프레드시트 열기
    const spreadsheet = SpreadsheetApp.openById(originalSheet.id);
    const sheet = spreadsheet.getSheetByName(originalSheet.name);
    
    if (!sheet) {
      return { success: false, message: `시트를 찾을 수 없습니다: ${originalSheet.name}` };
    }
    
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
    
    const rowsToDelete = [];
    const deletedIds = [];
    
    // 삭제할 행 번호 찾기
    for (let i = 1; i < data.length; i++) {
      const rowData = data[i];
      const rowId = rowData[0] ? rowData[0].toString() : '';
      
      if (itemIds.includes(rowId)) {
        rowsToDelete.push(i + 1); // Excel 행 번호 (1부터 시작)
        deletedIds.push(rowId);
      }
    }
    
    if (rowsToDelete.length === 0) {
      return { success: false, message: '삭제할 항목을 찾을 수 없습니다.' };
    }
    
    // 행 번호를 역순으로 정렬해서 뒤에서부터 삭제 (인덱스 변경 방지)
    rowsToDelete.sort((a, b) => b - a);
    
    // 행 삭제 실행
    rowsToDelete.forEach(rowNum => {
      sheet.deleteRow(rowNum);
    });
    
    console.log(`배치 삭제 완료: ${originalSheet.name}, 삭제된 ID: ${deletedIds.join(', ')}`);
    return { 
      success: true, 
      message: `${deletedIds.length}개 항목이 성공적으로 삭제되었습니다.`,
      data: { deletedIds: deletedIds, deletedCount: deletedIds.length, sheetName: originalSheet.name }
    };
    
  } catch (error) {
    console.error('batchDeleteItems 에러:', error);
    return { success: false, message: `배치 삭제 중 오류가 발생했습니다: ${error.message}` };
  }
}

/**
 * 항목 수정 함수
 * @param {string} sheetType - 시트 타입 (예: 'SHEET_APPLY_P')
 * @param {string} itemId - 수정할 항목의 ID
 * @param {Object} updateData - 수정할 데이터 객체
 * @returns {Object} - 성공/실패 정보
 */
function updateItem(sheetType, itemId, updateData) {
  try {
    console.log(`항목 수정 시도: 시트=${sheetType}, ID=${itemId}`);
    
    // 오리지널 시트 정보 가져오기
    const originalSheet = ORIGINAL_SHEETS[sheetType];
    if (!originalSheet) {
      return { success: false, message: `지원하지 않는 시트 타입입니다: ${sheetType}` };
    }
    
    if (!originalSheet.id) {
      return { success: false, message: `시트 ID가 설정되지 않았습니다: ${sheetType}` };
    }
    
    // 오리지널 스프레드시트 열기
    const spreadsheet = SpreadsheetApp.openById(originalSheet.id);
    const sheet = spreadsheet.getSheetByName(originalSheet.name);
    
    if (!sheet) {
      return { success: false, message: `시트를 찾을 수 없습니다: ${originalSheet.name}` };
    }
    
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
    const headers = data[0]; // 첫 번째 행은 헤더
    
    // ID로 해당 행 찾기
    let targetRowIndex = -1;
    let idColumnIndex = 0; // 기본값: 첫 번째 컬럼 (대부분의 시트가 A열을 ID로 사용)
    
    for (let i = 1; i < data.length; i++) {
      const rowId = data[i][idColumnIndex] ? data[i][idColumnIndex].toString() : '';
      if (rowId === itemId.toString()) {
        targetRowIndex = i;
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      return { success: false, message: `ID ${itemId}를 가진 항목을 찾을 수 없습니다.` };
    }
    
    // 기존 행 데이터 복사
    const updateRow = [...data[targetRowIndex]];
    
    // updateData의 각 필드를 해당하는 컬럼에 업데이트
    Object.keys(updateData).forEach(key => {
      let columnIndex = -1;
      
      // PSAC 시트의 컬럼 인덱스 매핑
      if (sheetType === 'SHEET_APPLY_P') {
        const fieldIndexMappings = {
          // 0: 순번 (건드리지 않음)
          // 1: 신청일시 (건드리지 않음)
          // 2: 과정명 (건드리지 않음)
          // 3: 교육일정 (건드리지 않음)
          'companyName': 4,          // 회사명
          'ceoName': 5,              // 대표자
          'businessNumber': 6,       // 사업자등록번호
          'businessType': 7,         // 종목업태
          'companyAddress': 8,       // 주소
          'educationManager': 9,     // 교육담당자
          'managerDepartment': 10,   // 담당부서
          'managerPosition': 11,     // 담당자직급
          'managerPhone': 12,        // 담당자전화
          'managerMobile': 13,       // 담당자핸드폰
          'managerEmail': 14,        // 담당자이메일
          'studentName': 15,         // 수강자명
          'studentDepartment': 16,   // 수강자부서
          'studentPosition': 17,     // 수강자직급
          'studentPhone': 18,        // 수강자전화
          'studentMobile': 19,       // 수강자핸드폰
          'studentEmail': 20,        // 수강자이메일
          'detailedEducation': 21,   // 선택세부교육
          // 22: 확인 (건드리지 않음)
          'remarks': 23,             // 비고
          'lockStatus': 24           // 잠금상태
        };
        
        columnIndex = fieldIndexMappings[key];
      }
      // Relay School 시트의 컬럼 인덱스 매핑
      else if (sheetType === 'SHEET_APPLY_R') {
        const fieldIndexMappings = {
          // 0: 순번 (건드리지 않음)
          // 1: 신청일시 (건드리지 않음)
          'companyName': 2,          // 회사명
          'ceoName': 3,              // 대표자
          'businessNumber': 4,       // 사업자등록번호
          'businessType': 5,         // 종목업태
          'companyAddress': 6,       // 주소
          'educationManager': 7,     // 교육담당자
          'managerDepartment': 8,    // 담당부서
          'managerPosition': 9,      // 담당자직급
          'managerPhone': 10,        // 담당자전화
          'managerMobile': 11,       // 담당자핸드폰
          'managerEmail': 12,        // 담당자이메일
          'studentName': 13,         // 수강자명
          'studentDepartment': 14,   // 수강자부서
          'studentPosition': 15,     // 수강자직급
          'studentPhone': 16,        // 수강자전화
          'studentMobile': 17,       // 수강자핸드폰
          'studentEmail': 18,        // 수강자이메일
          'detailedEducation': 19,   // 선택세부교육
          // 20: 확인 (건드리지 않음)
          'remarks': 21,             // 비고
          'lockStatus': 22           // 잠금상태
        };
        
        columnIndex = fieldIndexMappings[key];
      }
      else if (sheetType === 'SHEET_APPLY_RS') {
        const fieldIndexMappings = {
          // 0: Submission ID (건드리지 않음)
          // 1: Respondent ID (건드리지 않음)
          // 2: Submitted at (건드리지 않음)
          'companyName': 3,
          'ceoName': 4,
          'businessNumber': 5,
          'businessType': 6,
          'companyAddress': 7,      //주소
          'managerName': 8,         //담당자명
          'managerDepartment': 9,   //담당부서
          'managerPhone': 10,       //연락처
          'managerEmail': 11,       //이메일
          'courseContents': 12,     //교육내용
          'courseDuration': 13,     //교육기간
          'traineeLevel': 14,       //교육 대상자 수준
          'traineeCount': 15,       //교육 대상자 인원
          'confirmation': 16,       //확인
          'remarks': 17,             //비고
          'number': 18               //순번
        };
        
        columnIndex = fieldIndexMappings[key];
      }
      // 갤러리 시트들의 컬럼 인덱스 매핑 추가
      else if (['SHEET_GAL_A', 'SHEET_GAL_B', 'SHEET_GAL_C', 'SHEET_GAL_F'].includes(sheetType)) {
        const galleryFieldMappings = {
          'id': 0,        // ID (첫 번째 컬럼)
          'date': 2,      // 날짜
          'titleKR': 3,   // 한글 제목
          'titleEN': 4,   // 영어 제목
          'state': 6      // 상태 (on/off)
        };
        
        // 갤러리 아카데미인 경우 카테고리 필드 추가
        if (sheetType === 'SHEET_GAL_F') {
          galleryFieldMappings['category'] = 5;  // 카테고리 (PSAC/Relay School)
          galleryFieldMappings['contentKR'] = 7; // 한글 내용
          galleryFieldMappings['contentEN'] = 8; // 영어 내용
          galleryFieldMappings['image'] = 9;     // 이미지 배열
        }
        // 인사이드 갤러리인 경우 내용 필드 추가  
        else if (sheetType === 'SHEET_GAL_C') {
          galleryFieldMappings['contentKR'] = 7; // 한글 내용
          galleryFieldMappings['contentEN'] = 8; // 영어 내용
          galleryFieldMappings['image'] = 9;     // 이미지 배열
        }
        // 인허가, 유자격 갤러리인 경우
        else {
          galleryFieldMappings['image'] = 5;     // 이미지 배열
        }
        
        columnIndex = galleryFieldMappings[key];
        console.log(`갤러리 필드 매핑: ${key} -> 컬럼 ${columnIndex}`);
      }
      // 보도자료 시트의 컬럼 인덱스 매핑 추가
      else if (sheetType === 'SHEET_BOARD_NEWS') {
        const pressFieldMappings = {
          'id': 0,         // Submission ID (1번째 컬럼)
          'respondentId': 1, // Respondent ID (2번째 컬럼)
          'submittedAt': 2, // Submitted at (3번째 컬럼)
          'number': 3,     // 순번 (4번째 컬럼)
          'category': 4,   // 분류 (5번째 컬럼)
          'state': 5,      // 상태 (6번째 컬럼) 
          'titleKR': 6,    // 제목(한글) (7번째 컬럼)
          'titleEN': 7,    // 제목(영문) (8번째 컬럼)
          'image': 8,      // 이미지 업로드 (9번째 컬럼)
          'contentKR': 9,  // 내용(한글) (10번째 컬럼)
          'contentEN': 10, // 내용(영문) (11번째 컬럼)
          'sourceLink': 11,// 출처(링크) (12번째 컬럼)
          'fileUpload': 12,// 파일 업로드 (13번째 컬럼)
          'popup': 13,     // 팝업 (14번째 컬럼)
          'popupImageKR': 14, // 팝업이미지 업로드(한글) (15번째 컬럼)
          'popupImageEN': 15  // 팝업이미지 업로드(영문) (16번째 컬럼)
        };
        
        columnIndex = pressFieldMappings[key];
        console.log(`보도자료 필드 매핑: ${key} -> 컬럼 ${columnIndex}`);
      }
      
      // 다른 시트 타입들은 기존 방식 사용 (헤더 매칭)
      if (columnIndex === undefined && !['SHEET_APPLY_P', 'SHEET_APPLY_R', 'SHEET_APPLY_RS', 'SHEET_GAL_A', 'SHEET_GAL_B', 'SHEET_GAL_C', 'SHEET_GAL_F', 'SHEET_BOARD_NEWS'].includes(sheetType)) {
        const normalizeString = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedKey = normalizeString(key);
        
        // 정확한 매칭 시도
        for (let j = 0; j < headers.length; j++) {
          const normalizedHeader = normalizeString(headers[j]);
          if (normalizedHeader === normalizedKey || 
              normalizedHeader.includes(normalizedKey) || 
              normalizedKey.includes(normalizedHeader)) {
            columnIndex = j;
            break;
          }
        }
      }
      
      // 컬럼을 찾았으면 데이터 업데이트
      if (columnIndex !== undefined && columnIndex !== -1) {
        let valueToUpdate = updateData[key];
        
        // 이미지 배열인 경우 JSON 문자열로 변환
        if (key === 'image' && Array.isArray(valueToUpdate)) {
          valueToUpdate = JSON.stringify(valueToUpdate);
        }
        
        updateRow[columnIndex] = valueToUpdate;
        console.log(`필드 업데이트: ${key} -> 컬럼 ${columnIndex} (${headers[columnIndex]}) = ${valueToUpdate}`);
      } else {
        console.log(`컬럼을 찾을 수 없음: ${key}`);
      }
    });
    
    // 시트에 업데이트된 행 쓰기
    const range = sheet.getRange(targetRowIndex + 1, 1, 1, updateRow.length);
    range.setValues([updateRow]);
    
    console.log(`항목 수정 완료: ${originalSheet.name}, ID: ${itemId}`);
    return { 
      success: true, 
      message: '수정이 완료되었습니다.',
      data: { updatedId: itemId, sheetName: originalSheet.name }
    };
    
  } catch (error) {
    console.error('updateItem 에러:', error);
    return { success: false, message: `수정 중 오류가 발생했습니다: ${error.message}` };
  }
}

/**
 * 시트 타입에 따른 시트명 매핑 함수
 * @param {string} sheetType - 시트 타입
 * @returns {string|null} 시트명 또는 null
 */
function getSheetNameByType(sheetType) {
  const sheetMapping = {
    'SHEET_DASHBOARD': SHEET_DASHBOARD,
    'SHEET_GAL_A': SHEET_GAL_A,
    'SHEET_GAL_B': SHEET_GAL_B,
    'SHEET_GAL_C': SHEET_GAL_C,
    'SHEET_GAL_F': SHEET_GAL_F,
    'SHEET_GAL_VIDEO': SHEET_GAL_VIDEO,
    'SHEET_BOARD_NEWS': SHEET_BOARD_NEWS,
    'SHEET_APPLY_P': SHEET_APPLY_P,
    'SHEET_APPLY_R': SHEET_APPLY_R,
    'SHEET_APPLY_RS': SHEET_APPLY_RS,
    'SHEET_HELP_KR': SHEET_HELP_KR,
    'SHEET_HELP_EN': SHEET_HELP_EN,
    'SHEET_REPORT': SHEET_REPORT
  };
  
  return sheetMapping[sheetType] || null;
}
