const SPREADSHEET_ID = '1wxAf9X9vjJsODggD5O-yzMo84gwOEVBCKKZvM6BgUPw'; // 구글시트 ID

// 시트구분
const SHEET_PSAC_A = 'PSAC 제출폼 과목 관리';
const SHEET_PSAC_B = 'PSAC 과정개요,신청방법';
const SHEET_PSAC_C = 'PSAC 교육일정';
const SHEET_PSAC_D = 'PSAC 주차별 교육일정 및 개요';
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
  const week = e.parameter.week;
  const language = e.parameter.language || 'korean';
  
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
      case 'get_psac_weekly_overview':
        return createJsonResponse(getPsacWeeklyOverview());
      case 'get_psac_week_schedule':
        if (!week) {
          return createJsonResponse({error: 'Week parameter required'}, 400);
        }
        return createJsonResponse(getPsacWeekSchedule(week, language));
      case 'get_rs_details':
        return createJsonResponse(getRelaySchoolDetails());
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
  
  // 파싱된 개요 데이터 생성
  const overview = parsePsacOverviewData(data);
  
  return {
    success: true,
    data: overview,
    timestamp: new Date().toISOString()
  };
}

/**
 * PSAC 개요 데이터 파싱 함수
 */
function parsePsacOverviewData(rawData) {
  const result = {
    courseOverview: {
      korean: {},
      english: {}
    },
    applicationMethod: {
      korean: {},
      english: {}
    }
  };
  
  let currentSection = '';
  let isOverviewSection = false;
  let isApplicationSection = false;
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    
    // 빈 행 건너뛰기
    if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
      continue;
    }
    
    const firstCell = row[0] ? row[0].toString().trim() : '';
    
    // 섹션 구분
    if (firstCell === '과정 개요') {
      isOverviewSection = true;
      isApplicationSection = false;
      continue;
    } else if (firstCell === '신청방법') {
      isOverviewSection = false;
      isApplicationSection = true;
      continue;
    }
    
    // 헤더 행 건너뛰기 (KR, EN)
    if (firstCell === '' && row[1] === 'KR' && row[2] === 'EN') {
      continue;
    }
    
    // 데이터 행 처리
    if (firstCell && row[1] && row[2]) {
      const key = firstCell;
      const koreanValue = row[1].toString();
      const englishValue = row[2].toString();
      
      if (isOverviewSection) {
        result.courseOverview.korean[key] = koreanValue;
        result.courseOverview.english[key] = englishValue;
      } else if (isApplicationSection) {
        result.applicationMethod.korean[key] = koreanValue;
        result.applicationMethod.english[key] = englishValue;
      }
    }
  }
  
  return result;
}

/**
 * PSAC 교육일정 데이터 가져오기
 */
function getPsacSchedule() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_PSAC_C);
  const data = sheet.getDataRange().getValues();
  
  // 파싱된 교육일정 데이터 생성
  const schedule = parsePsacScheduleData(data);
  
  return {
    success: true,
    data: schedule,
    timestamp: new Date().toISOString()
  };
}

/**
 * PSAC 교육일정 데이터 파싱 함수
 */
function parsePsacScheduleData(rawData) {
  const result = {
    korean: [],
    english: []
  };
  
  // 헤더 정보 찾기 (KR, EN 컬럼 인덱스)
  const headerRow = rawData[1]; // 두 번째 행에 실제 헤더가 있음
  const krStartCol = 0; // 한국어 시작 컬럼
  const enStartCol = headerRow.findIndex(cell => cell && cell.toString().toLowerCase().includes('training period')); // 영어 시작 컬럼
  
  // 데이터 시작 행 (헤더 이후)
  let currentMonth = '';
  let currentMonthEn = '';
  
  for (let i = 2; i < rawData.length; i++) {
    const row = rawData[i];
    
    // 빈 행 건너뛰기
    if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
      continue;
    }
    
    // 한국어 데이터 처리
    const monthKr = row[krStartCol] ? row[krStartCol].toString().trim() : '';
    const periodKr = row[krStartCol + 1] ? row[krStartCol + 1].toString().trim() : '';
    const weekKr = row[krStartCol + 2] ? row[krStartCol + 2].toString().trim() : '';
    const topicKr = row[krStartCol + 3] ? row[krStartCol + 3].toString().trim() : '';
    const instructorKr = row[krStartCol + 4] ? row[krStartCol + 4].toString().trim() : '';
    
    // 영어 데이터 처리 (영어 컬럼이 존재하는 경우)
    let monthEn = '', periodEn = '', weekEn = '', topicEn = '', instructorEn = '';
    if (enStartCol > 0) {
      monthEn = row[enStartCol] ? row[enStartCol].toString().trim() : '';
      periodEn = row[enStartCol + 1] ? row[enStartCol + 1].toString().trim() : '';
      weekEn = row[enStartCol + 2] ? row[enStartCol + 2].toString().trim() : '';
      topicEn = row[enStartCol + 3] ? row[enStartCol + 3].toString().trim() : '';
      instructorEn = row[enStartCol + 4] ? row[enStartCol + 4].toString().trim() : '';
    }
    
    // 월 정보 업데이트 (새로운 월이 나타나면)
    if (monthKr) {
      currentMonth = monthKr;
    }
    if (monthEn) {
      currentMonthEn = monthEn;
    }
    
    // 유효한 교육일정 데이터인지 확인 (교육기간과 주제가 있어야 함)
    if (periodKr && topicKr) {
      // 한국어 데이터 추가
      result.korean.push({
        month: currentMonth,
        period: periodKr,
        week: weekKr,
        topic: topicKr,
        instructor: instructorKr,
        weekNumber: parseInt(weekKr) || 0
      });
    }
    
    // 영어 데이터가 있는 경우 추가
    if (enStartCol > 0 && periodEn && topicEn) {
      result.english.push({
        month: currentMonthEn,
        period: periodEn,
        week: weekEn,
        topic: topicEn,
        instructor: instructorEn,
        weekNumber: parseInt(weekEn) || 0
      });
    }
  }
  
  // 월별로 그룹핑
  const groupedData = {
    korean: groupByMonth(result.korean),
    english: groupByMonth(result.english)
  };
  
  return groupedData;
}

/**
 * 월별로 데이터 그룹핑
 */
function groupByMonth(scheduleData) {
  const grouped = {};
  
  scheduleData.forEach(item => {
    const month = item.month;
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(item);
  });
  
  // 각 월의 데이터를 주차순으로 정렬
  Object.keys(grouped).forEach(month => {
    grouped[month].sort((a, b) => a.weekNumber - b.weekNumber);
  });
  
  return grouped;
}

/**
 * 특정 주차의 교육일정 가져오기
 */
function getPsacWeekSchedule(weekNumber, language = 'korean') {
  const allSchedule = getPsacSchedule();
  const scheduleData = allSchedule.data[language];
  
  // 모든 월에서 해당 주차 찾기
  for (const month in scheduleData) {
    const weekData = scheduleData[month].find(item => item.weekNumber === parseInt(weekNumber));
    if (weekData) {
      return {
        success: true,
        data: weekData,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  return {
    success: false,
    error: `Week ${weekNumber} not found`,
    timestamp: new Date().toISOString()
  };
}

/**
 * PSAC 주차별 교육일정 및 개요 데이터 가져오기
 */
function getPsacWeeklyOverview() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_PSAC_D);
  const data = sheet.getDataRange().getDisplayValues();

  const weeklyOverview = parsePsacWeeklyOverviewData(data);

  return {
    success: true,
    data: weeklyOverview,
    timestamp: new Date().toISOString()
  };
}

/**
 * PSAC 주차별 교육일정 및 개요 데이터 파싱 함수
 */
function parsePsacWeeklyOverviewData(rawData) {
  const result = {
    korean: [],
    english: []
  };

  if (!rawData || rawData.length === 0) {
    return result;
  }

  const toCellText = (value) => (value === null || value === undefined ? '' : value.toString());
  const normalizeCell = (value) => toCellText(value).trim();
  const isWeekHeader = (value) => /^(주차|week|weeks)$/i.test(normalizeCell(value));
  const isPeriodHeader = (value) => {
    const v = normalizeCell(value).toLowerCase();
    return v.includes('교육기간') || v.includes('training period');
  };

  const findHeaderRowIndex = () => {
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] || [];
      const weekHeaderCount = row.filter(cell => isWeekHeader(cell)).length;
      const hasTrainingPeriodHeader = row.some(cell => isPeriodHeader(cell));

      if (weekHeaderCount >= 2 && hasTrainingPeriodHeader) {
        return i;
      }
    }
    return -1;
  };

  const headerRowIndex = findHeaderRowIndex();
  if (headerRowIndex < 0) {
    return result;
  }

  const headerRow = rawData[headerRowIndex] || [];
  const weekCols = headerRow
    .map((cell, idx) => (isWeekHeader(cell) ? idx : -1))
    .filter(idx => idx >= 0);

  const krStartCol = weekCols.length > 0 ? weekCols[0] : -1;
  const enStartCol = weekCols.length > 1 ? weekCols[1] : -1;

  if (krStartCol < 0 || enStartCol < 0) {
    return result;
  }

  const parsePeriod = (periodText) => {
    return periodText
      .split(/\r\n|\n|\r/)
      .map(v => v.trim())
      .filter(Boolean);
  };

  const parseTopic = (topicText) => {
    const lines = topicText
      .split(/\r\n|\n/)
      .map(v => v.trim())
      .filter(Boolean);

    return {
      title: lines[0] || '',
      overview: lines[1] || '',
      instructors: lines.slice(2).join('\n'),
      raw: topicText
    };
  };

  const parseWeekNumber = (weekText) => {
    const match = weekText.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const buildItem = (row, startCol, language) => {
    const week = toCellText(row[startCol]);
    const period = toCellText(row[startCol + 1]);
    const topic = toCellText(row[startCol + 2]);
    const days = toCellText(row[startCol + 3]);
    const fee = toCellText(row[startCol + 4]);

    if (!week.trim() || !period.trim() || !topic.trim()) {
      return null;
    }

    const isEmptyTopic = topic.replace(/\s|<br\s*\/?>(\s*)/gi, '').trim() === '';
    if (isEmptyTopic) {
      return null;
    }

    const parsedTopic = parseTopic(topic);

    return {
      language,
      week,
      weekNumber: parseWeekNumber(week),
      period,
      periodDates: parsePeriod(period),
      topic: parsedTopic.raw,
      topicTitle: parsedTopic.title,
      topicOverview: parsedTopic.overview,
      instructors: parsedTopic.instructors,
      days,
      fee
    };
  };

  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row = rawData[i] || [];
    if (!row.length) {
      continue;
    }

    const krItem = buildItem(row, krStartCol, 'korean');
    const enItem = buildItem(row, enStartCol, 'english');

    if (krItem) {
      result.korean.push(krItem);
    }
    if (enItem) {
      result.english.push(enItem);
    }
  }

  result.korean.sort((a, b) => a.weekNumber - b.weekNumber);
  result.english.sort((a, b) => a.weekNumber - b.weekNumber);

  return result;
}

/**
 * 테스트용 함수
 */
function testFunctions() {
  console.log('PSAC Courses:', getPsacCourses());
  console.log('Relay Courses:', getRelayCourses());
  console.log('PSAC Schedule:', getPsacSchedule());
  console.log('PSAC Weekly Overview:', getPsacWeeklyOverview());
  console.log('PSAC Week 1:', getPsacWeekSchedule(1, 'korean'));
  console.log('PSAC Week 1 English:', getPsacWeekSchedule(1, 'english'));
}
