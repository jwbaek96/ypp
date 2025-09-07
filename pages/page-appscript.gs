const SPREADSHEET_ID = '14zEQ4KkszJ6m6twouPTs89b9jEBJvtKacrED5JqtTMI'; // 구글시트 ID

// 시트구분
const SHEET_A = '원자력';
const SHEET_B = '복합화력';
const SHEET_C = '변전소';
const SHEET_D = '미군기지';
const SHEET_E = '자주묻는질문';
const SHEET_F = '연혁';

// 각 시트별 헤더
// SHEET_A = 공급실적[전기분야(year / textKR / textEN) | 계측·제어 분야(year / textKR / textEN) | CGID 분야(year / textKR / textEN) | 해외 원전 분야(year / textKR / textEN)] | 공급사 유자격(한수원)[제어 분야(year / textKR / textEN)	| 전기 분야(year / textKR / textEN) | 시험·기기수리·전문정비 및 예비품(year / textKR / textEN) | CGID(year / textKR / textEN)] | 설계 유자격 (한전기술)[해외 원전 분야(year / textKR / textEN)]
// SHEET_B = KR | EN
// SHEET_C = typeKR / projectNameKR / keySpecificationsKR / countryKR | typeEN / projectNameEN / keySpecificationsEN / countryEN
// SHEET_D = projectNameKR / disciplineKR / periodKR / statusKR | projectNameEN / disciplineEN / periodEN / statusEN
// SHEET_E = 1qKR / 1qEN / 1aKR / 1aEN | 2qKR / 2qEN / 2aKR / 2aEN | 3qKR / 3qEN / 3aKR / 3aEN | 4qKR / 4qEN / 4aKR / 4aEN | 5qKR / 5qEN / 5aKR / 5aEN
// SHEET_F = year / textKR / textEN

/**
 * 메인 doGet 함수 - 웹 요청 처리
 */
function doGet(e) {
  try {
    const sheetName = e.parameter.sheet || 'all';
    const action = e.parameter.action || 'getData';
    
    console.log(`요청 받음: sheet=${sheetName}, action=${action}`);
    
    if (action === 'getData') {
      const data = getSheetData(sheetName);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: data,
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid action parameter'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('doGet 에러:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 시트 데이터 가져오기
 */
function getSheetData(sheetName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (sheetName === 'all') {
      // 모든 시트 데이터 반환
      return {
        nuclear: getSheetSpecificData(spreadsheet, SHEET_A),
        thermalPower: getSheetSpecificData(spreadsheet, SHEET_B),
        substation: getSheetSpecificData(spreadsheet, SHEET_C),
        usMilitary: getSheetSpecificData(spreadsheet, SHEET_D),
        faq: getSheetSpecificData(spreadsheet, SHEET_E),
        history: getSheetSpecificData(spreadsheet, SHEET_F)
      };
    }
    
    // 특정 시트만 반환
    switch (sheetName) {
      case 'nuclear':
      case SHEET_A:
        return getSheetSpecificData(spreadsheet, SHEET_A);
      case 'thermal':
      case SHEET_B:
        return getSheetSpecificData(spreadsheet, SHEET_B);
      case 'substation':
      case SHEET_C:
        return getSheetSpecificData(spreadsheet, SHEET_C);
      case 'military':
      case SHEET_D:
        return getSheetSpecificData(spreadsheet, SHEET_D);
      case 'faq':
      case SHEET_E:
        return getSheetSpecificData(spreadsheet, SHEET_E);
      case 'history':
      case SHEET_F:
        return getSheetSpecificData(spreadsheet, SHEET_F);
      default:
        throw new Error(`Unknown sheet: ${sheetName}`);
    }
    
  } catch (error) {
    console.error(`getSheetData 에러 (${sheetName}):`, error);
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
    [SHEET_A]: { // 원자력
      year1: 0,
      textKR1: 1,
      textEN1: 2,
      year2: 3,
      textKR2: 4,
      textEN2: 5,
      year3: 6,
      textKR3: 7,
      textEN3: 8,
      year4: 9,
      textKR4: 10,
      textEN4: 11,
      textKR5: 12,
      textEN5: 13,
      textKR6: 14,
      textEN6: 15,
      textKR7: 16,
      textEN7: 17,
      textKR8: 18,
      textEN8: 19,
      textKR9: 20,
      textEN9: 21,
    },
    
    [SHEET_B]: { // 복합화력
      textKR: 0,  // A열: 한국어
      textEN: 1   // B열: 영어
    },
    
    [SHEET_C]: { // 변전소
      typeKR: 0,
      projectNameKR: 1,
      keySpecificationsKR: 2,
      countryKR: 3,
      typeEN: 4,
      projectNameEN: 5,
      keySpecificationsEN: 6,
      countryEN: 7
    },
    
    [SHEET_D]: { // 미군기지
      projectNameKR: 0,
      disciplineKR: 1,
      periodKR: 2,
      statusKR: 3,
      projectNameEN: 4,
      disciplineEN: 5,
      periodEN: 6,
      statusEN: 7
    },
    
    [SHEET_E]: { // 자주묻는질문
      // FAQ는 특별한 처리가 필요하므로 원본 배열 구조 유지
      question1KR: 0,   // A열: 1번 질문 한글
      question1EN: 1,   // B열: 1번 질문 영어
      answer1KR: 2,     // C열: 1번 답변 한글
      answer1EN: 3,     // D열: 1번 답변 영어
      question2KR: 4,   // E열: 2번 질문 한글
      question2EN: 5,   // F열: 2번 질문 영어
      answer2KR: 6,     // G열: 2번 답변 한글
      answer2EN: 7,     // H열: 2번 답변 영어
      question3KR: 8,   // I열: 3번 질문 한글
      question3EN: 9,   // J열: 3번 질문 영어
      answer3KR: 10,    // K열: 3번 답변 한글
      answer3EN: 11,    // L열: 3번 답변 영어
      question4KR: 12,  // M열: 4번 질문 한글
      question4EN: 13,  // N열: 4번 질문 영어
      answer4KR: 14,    // O열: 4번 답변 한글
      answer4EN: 15,    // P열: 4번 답변 영어
      question5KR: 16,  // Q열: 5번 질문 한글
      question5EN: 17,  // R열: 5번 질문 영어
      answer5KR: 18,    // S열: 5번 답변 한글
      answer5EN: 19     // T열: 5번 답변 영어
    },
    
    [SHEET_F]: { // 연혁
      year: 0,      // A열: 연도
      textKR: 1,    // B열: 내용 한글
      textEN: 2     // C열: 내용 영어
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
    [SHEET_A]: 4,        // 4행부터 데이터 시작 (헤더: 로우3)
    [SHEET_B]: 3,        // 3행부터 데이터 시작 (헤더: 로우1, 언어구분: 로우2)
    [SHEET_C]: 3,        // 3행부터 데이터 시작 (헤더: 로우2)
    [SHEET_D]: 3,        // 3행부터 데이터 시작 (헤더: 로우2)
    [SHEET_E]: 4,        // 4행부터 데이터 시작 (헤더: 로우3)
    [SHEET_F]: 2         // 2행부터 데이터 시작 (헤더: 로우1)
  };
  
  return dataStartRows[sheetName] || 2; // 기본값 2행
}

/**
 * 각 시트별 맞춤 데이터 구조를 가져오는 공통 함수
 * @param {Spreadsheet} spreadsheet - 구글시트 객체  
 * @param {string} sheetName - 시트 이름
 * @returns {Object} 시트별 맞춤 데이터 구조
 */
function getSheetSpecificData(spreadsheet, sheetName) {
  try {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`시트 '${sheetName}'를 찾을 수 없습니다.`);
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    // 데이터가 없는 경우
    if (lastRow < getDataStartRow(sheetName)) {
      console.log(`${sheetName}에 데이터가 없습니다.`);
      return { headers: [], data: [] };
    }
    
    const dataStartRow = getDataStartRow(sheetName);
    const customHeaders = getCustomHeaders(sheetName);
    
    // FAQ는 특별한 처리가 필요
    if (sheetName === SHEET_E) {
      return getFaqDataWithMapping(sheet, dataStartRow, lastRow, lastCol);
    }
    
    // 복합화력도 특별한 처리가 필요 (언어 구분 행 포함)
    if (sheetName === SHEET_B) {
      return getThermalPowerDataWithMapping(sheet, dataStartRow, lastRow, lastCol);
    }
    
    // 헤더 행 가져오기 (데이터 시작행 - 1)
    const headerRow = dataStartRow - 1;
    const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
    
    // 실제 데이터 범위 가져오기
    const dataRange = sheet.getRange(dataStartRow, 1, lastRow - dataStartRow + 1, lastCol);
    const dataValues = dataRange.getValues();
    
    const result = {
      headers: headers,
      data: []
    };
    
    console.log(`${sheetName}: 데이터 시작행 ${dataStartRow}, ${dataValues.length}개 행`);
    
    // 데이터 매핑
    dataValues.forEach((row, index) => {
      // 빈 행 스킵
      if (!row.some(cell => cell !== '')) {
        return;
      }
      
      const item = { id: index + 1 }; // 기본 ID 추가
      
      // 커스텀 헤더 매핑 적용
      Object.keys(customHeaders).forEach(key => {
        const columnIndex = customHeaders[key];
        if (columnIndex < row.length) {
          item[key] = row[columnIndex] || '';
        }
      });
      
      // 메타 데이터 추가
      item._rowNumber = index + dataStartRow;
      item._sheetName = sheetName;
      
      result.data.push(item);
    });
    
    console.log(`${sheetName} 데이터 조회 완료: ${result.data.length}개 항목`);
    return result;
    
  } catch (error) {
    console.error(`getSheetSpecificData 에러 (${sheetName}):`, error);
    throw error;
  }
}

/**
 * FAQ 데이터 특별 처리 함수
 * @param {Sheet} sheet - 시트 객체
 * @param {number} dataStartRow - 데이터 시작 행
 * @param {number} lastRow - 마지막 행
 * @param {number} lastCol - 마지막 열
 * @returns {Object} FAQ 데이터 구조
 */
function getFaqDataWithMapping(sheet, dataStartRow, lastRow, lastCol) {
  try {
    // 헤더 행 (로우 3)
    const headers = sheet.getRange(3, 1, 1, lastCol).getValues()[0];
    
    const result = {
      headers: headers,
      data: []
    };
    
    // 데이터 파싱 (로우 4부터)
    for (let i = dataStartRow; i <= lastRow; i++) {
      const row = sheet.getRange(i, 1, 1, lastCol).getValues()[0];
      if (row.some(cell => cell !== '')) {
        // 프론트엔드가 기대하는 단순한 배열 형태로 반환
        result.data.push(row);
      }
    }
    
    console.log(`FAQ 데이터 처리 완료: ${result.data.length}개 행`);
    return result;
    
  } catch (error) {
    console.error('getFaqDataWithMapping 에러:', error);
    throw error;
  }
}

/**
 * 복합화력 데이터 특별 처리 함수
 * @param {Sheet} sheet - 시트 객체
 * @param {number} dataStartRow - 데이터 시작 행
 * @param {number} lastRow - 마지막 행
 * @param {number} lastCol - 마지막 열
 * @returns {Object} 복합화력 데이터 구조
 */
function getThermalPowerDataWithMapping(sheet, dataStartRow, lastRow, lastCol) {
  try {
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]; // 로우 1
    const langRow = sheet.getRange(2, 1, 1, lastCol).getValues()[0]; // 로우 2
    
    const result = {
      headers: headers,
      language: {
        korean: langRow[0] || '',
        english: langRow[1] || ''
      },
      data: []
    };
    
    // 데이터 파싱 (로우 3부터)
    for (let i = dataStartRow; i <= lastRow; i++) {
      const row = sheet.getRange(i, 1, 1, lastCol).getValues()[0];
      if (row.some(cell => cell !== '')) {
        result.data.push({
          id: i - dataStartRow + 1,
          textKR: row[0] || '',
          textEN: row[1] || '',
          _rowNumber: i,
          _sheetName: SHEET_B
        });
      }
    }
    
    console.log(`복합화력 데이터 처리 완료: ${result.data.length}개 항목`);
    return result;
    
  } catch (error) {
    console.error('getThermalPowerDataWithMapping 에러:', error);
    throw error;
  }
}

/**
 * 테스트 함수 - 스크립트 에디터에서 실행 가능
 */
function testGetData() {
  try {
    console.log('=== 데이터 테스트 시작 ===');
    
    // 각 시트별 테스트
    console.log('--- 원자력 데이터 테스트 ---');
    const nuclearData = getSheetData('nuclear');
    console.log('원자력 데이터:', JSON.stringify(nuclearData, null, 2));
    
    console.log('--- 복합화력 데이터 테스트 ---');
    const thermalData = getSheetData('thermal');
    console.log('복합화력 데이터:', JSON.stringify(thermalData, null, 2));
    
    console.log('--- 변전소 데이터 테스트 ---');
    const substationData = getSheetData('substation');
    console.log('변전소 데이터:', JSON.stringify(substationData, null, 2));
    
    console.log('--- 미군기지 데이터 테스트 ---');
    const militaryData = getSheetData('military');
    console.log('미군기지 데이터:', JSON.stringify(militaryData, null, 2));
    
    console.log('--- FAQ 데이터 테스트 ---');
    const faqData = getSheetData('faq');
    console.log('FAQ 데이터:', JSON.stringify(faqData, null, 2));
    
    console.log('--- 연혁 데이터 테스트 ---');
    const historyData = getSheetData('history');
    console.log('연혁 데이터:', JSON.stringify(historyData, null, 2));
    
    console.log('--- 전체 데이터 테스트 ---');
    const allData = getSheetData('all');
    console.log('전체 데이터 구조:', Object.keys(allData));
    
    console.log('=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 에러:', error);
  }
}

/**
 * 연혁 전용 테스트 함수
 */
function testHistoryData() {
  try {
    console.log('=== 연혁 데이터 상세 테스트 시작 ===');
    
    const historyData = getSheetData('history');
    
    console.log('연혁 헤더:', historyData.headers);
    console.log('연혁 데이터 개수:', historyData.data.length);
    
    if (historyData.data.length > 0) {
      console.log('첫 번째 연혁 항목:', historyData.data[0]);
      console.log('마지막 연혁 항목:', historyData.data[historyData.data.length - 1]);
      
      // 각 연혁 항목의 구조 확인
      historyData.data.forEach((item, index) => {
        console.log(`연혁 ${index + 1}: 연도=${item.year}, 한글=${item.textKR}, 영어=${item.textEN}`);
      });
    }
    
    console.log('=== 연혁 데이터 상세 테스트 완료 ===');
    
  } catch (error) {
    console.error('연혁 테스트 에러:', error);
  }
}
function testFAQData() {
  try {
    console.log('=== FAQ 데이터 상세 테스트 시작 ===');
    
    const faqData = getSheetData('faq');
    
    console.log('FAQ 헤더:', faqData.headers);
    console.log('FAQ 데이터 개수:', faqData.data.length);
    
    if (faqData.data.length > 0) {
      console.log('첫 번째 FAQ 행:', faqData.data[0]);
      console.log('첫 번째 FAQ 행 길이:', faqData.data[0].length);
      
      // 각 카테고리별 데이터 확인
      const firstRow = faqData.data[0];
      console.log('카테고리 1 (A-D):', [firstRow[0], firstRow[1], firstRow[2], firstRow[3]]);
      console.log('카테고리 2 (E-H):', [firstRow[4], firstRow[5], firstRow[6], firstRow[7]]);
      console.log('카테고리 3 (I-L):', [firstRow[8], firstRow[9], firstRow[10], firstRow[11]]);
      console.log('카테고리 4 (M-P):', [firstRow[12], firstRow[13], firstRow[14], firstRow[15]]);
      console.log('카테고리 5 (Q-T):', [firstRow[16], firstRow[17], firstRow[18], firstRow[19]]);
    }
    
    console.log('=== FAQ 데이터 상세 테스트 완료 ===');
    
  } catch (error) {
    console.error('FAQ 테스트 에러:', error);
  }
}