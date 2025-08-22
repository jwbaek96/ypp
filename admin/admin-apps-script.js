// Google Apps Script - YPP Admin System
// 개선된 버전

const SPREADSHEET_ID = '1YOUR_SPREADSHEET_ID_HERE'; // 구글시트 ID를 여기에 입력
const SHEET_DASHBOARD = 'DASHBOARD'; // 시트 이름
const SHEET_GAL_A = '갤러리 인허가'; // 시트 이름
const SHEET_GAL_B = '갤러리 유자격'; // 시트 이름
const SHEET_GAL_C = '갤러리 인사이드'; // 시트 이름
const SHEET_GAL_F = '갤러리 아카데미'; // 시트 이름
const SHEET_BOARD_NEWS = '게시판 보도자료'; // 시트 이름
const SHEET_APPLY_P = '신청 PSAC'; // 시트 이름
const SHEET_APPLY_R = '신청 RelaySchool'; // 시트 이름
const SHEET_HELP_KR = '문의 KOR'; // 시트 이름
const SHEET_HELP_EN = '문의 ENG'; // 시트 이름
const SHEET_REPORT = '신고'; // 시트 이름

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

    // 요청 파라미터 확인
    const sheetType = e.parameter.sheet || '';
    const action = e.parameter.action || 'getData';
    
    console.log(`요청받은 시트: ${sheetType}, 액션: ${action}`);

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
    console.log(`데이터 조회 시작: ${sheetName}`);
    
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
        boardNews: sheet.getRange('F3').getValue() || 0,     // 게시판 보도자료
        applyPSAC: sheet.getRange('G3').getValue() || 0,     // 신청 PSAC
        applyRelay: sheet.getRange('H3').getValue() || 0,    // 신청 RelaySchool
        helpKR: sheet.getRange('I3').getValue() || 0,        // 문의 KOR
        helpEN: sheet.getRange('J3').getValue() || 0,        // 문의 ENG
        report: sheet.getRange('K3').getValue() || 0         // 신고
      // 추가 통계 데이터
    //   monthlyStats: {
    //     currentMonth: sheet.getRange('D2').getValue() || 0,
    //     previousMonth: sheet.getRange('D3').getValue() || 0,
    //     growth: sheet.getRange('D4').getValue() || 0
    //   },
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
        
        // 시트별 특별 처리
        if (sheetName === SHEET_GAL_F) { // 갤러리 아카데미 특별 처리
          if (key === 'date') {
            value = formatDate(value);
          } else if (key === 'category') {
            value = (value || '').toString().toLowerCase();
          } else if (key === 'state') {
            value = (value || '').toString().toLowerCase() === 'on' ? 'on' : 'off';
          } else if (key === 'image') {
            value = value ? value.split('\n').filter(url => url.trim() !== '') : [];
          }
        } else if (sheetName === SHEET_GAL_C) { // 갤러리 인사이드 특별 처리
          if (key === 'state') {
            value = (value || '').toString().toLowerCase() === 'on' ? 'on' : 'off';
          } else if (key === 'image') {
            value = value ? value.split('\n').filter(url => url.trim() !== '') : [];
          }
        } else if (sheetName === SHEET_GAL_B) { // 갤러리 유자격 특별 처리
          if (key === 'date') {
            value = formatDate(value);
          } else if (key === 'image') {
            value = value ? value.split('\n').filter(url => url.trim() !== '') : [];
          } else if (key === 'state') {
            value = (value || '').toString().toLowerCase() === 'on' ? 'on' : 'off';
          }
        } else if (sheetName === SHEET_GAL_A) { // 갤러리 인허가 특별 처리 (유자격과 동일)
          if (key === 'date') {
            value = formatDate(value);
          } else if (key === 'image') {
            value = value ? value.split('\n').filter(url => url.trim() !== '') : [];
          } else if (key === 'state') {
            value = (value || '').toString().toLowerCase() === 'on' ? 'on' : 'off';
          }
        }
        
        // 일반적인 날짜 타입 처리 (다른 시트용)
        if (value instanceof Date && key !== 'date') {
          value = value.toISOString().split('T')[0];
        }
        
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
    
    [SHEET_BOARD_NEWS]: { // 게시판 보도자료
      id: 0,
      title: 1,
      content: 2,
      publishDate: 3,
      author: 4,
      category: 5,
      viewCount: 6,
      isHighlight: 7,
      attachmentUrl: 8
    },
    
    [SHEET_APPLY_P]: { // 신청 PSAC
      id: 0,
      applicantName: 1,
      email: 2,
      phone: 3,
      company: 4,
      position: 5,
      applyDate: 6,
      courseType: 7,
      status: 8,
      notes: 9
    },
    
    [SHEET_APPLY_R]: { // 신청 RelaySchool
      id: 0,
      applicantName: 1,
      email: 2,
      phone: 3,
      organization: 4,
      experience: 5,
      applyDate: 6,
      preferredDate: 7,
      status: 8,
      specialRequests: 9
    },
    
    [SHEET_HELP_KR]: { // 문의 KOR
      id: 0,
      name: 1,
      email: 2,
      phone: 3,
      subject: 4,
      message: 5,
      inquiryDate: 6,
      category: 7,
      status: 8,
      response: 9
    },
    
    [SHEET_HELP_EN]: { // 문의 ENG
      id: 0,
      name: 1,
      email: 2,
      phone: 3,
      subject: 4,
      message: 5,
      inquiryDate: 6,
      category: 7,
      status: 8,
      response: 9
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
    [SHEET_BOARD_NEWS]: 2,   // 2행부터 데이터 시작
    [SHEET_APPLY_P]: 2,      // 2행부터 데이터 시작
    [SHEET_APPLY_R]: 2,      // 2행부터 데이터 시작
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
        total: 0
      },
      board: {
        news: getSheetStats(SHEET_BOARD_NEWS)
      },
      applications: {
        psac: getSheetStats(SHEET_APPLY_P),
        relaySchool: getSheetStats(SHEET_APPLY_R),
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
                           stats.galleries.inside.count + stats.galleries.academy.count;
    
    stats.applications.total = stats.applications.psac.count + stats.applications.relaySchool.count;
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
 * 날짜 포맷팅 함수 (갤러리 아카데미용)
 * @param {Date|string} dateValue - 날짜 값
 * @returns {string} 포맷된 날짜 문자열
 */
function formatDate(dateValue) {
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
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
  } catch (error) {
    console.error('formatDate 에러:', error);
    return dateValue ? dateValue.toString() : '';
  }
}

/**
 * 테스트용 함수 - 수동 실행으로 데이터 확인 가능
 */
function testGetData() {
  try {
    console.log('=== 테스트 시작 ===');
    
    // 대시보드 데이터 테스트
    const dashboardData = getData(SHEET_DASHBOARD);
    console.log(`대시보드 데이터: ${dashboardData.length}개`);
    
    // 전체 통계 테스트
    const stats = getAllStats();
    console.log('전체 통계:', stats);
    
    console.log('=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 에러:', error);
  }
}
