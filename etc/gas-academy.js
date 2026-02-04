const SPREADSHEET_ID = '1wxAf9X9vjJsODggD5O-yzMo84gwOEVBCKKZvM6BgUPw'; // 구글시트 ID

// 시트구분
const SHEET_PSAC_A = 'PSAC 제출폼 과목 관리';
const SHEET_PSAC_B = 'PSAC 개요,신청방법';
const SHEET_PSAC_C = 'PSAC 교육일정';
const SHEET_RS_A = 'RelaySchool 제출폼 과목 관리';
const SHEET_RS_B = 'RelaySchool 과목 상세';

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
      const koreanValue = row[1].toString().trim();
      const englishValue = row[2].toString().trim();
      
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
 * 테스트용 함수
 */
function testFunctions() {
  console.log('PSAC Courses:', getPsacCourses());
  console.log('Relay Courses:', getRelayCourses());
  console.log('PSAC Schedule:', getPsacSchedule());
  console.log('PSAC Week 1:', getPsacWeekSchedule(1, 'korean'));
  console.log('PSAC Week 1 English:', getPsacWeekSchedule(1, 'english'));
  console.log('RelaySchool Details:', getRelaySchoolDetails());
}

/**
 * RelaySchool 과목 상세 데이터 가져오기
 */
function getRelaySchoolDetails() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_RS_B);
    const data = sheet.getDataRange().getValues();
    
    console.log('RelaySchool sheet data rows:', data.length);
    console.log('First few rows:', data.slice(0, 5));
    
    // 시트가 비어있거나 데이터가 없는 경우 테스트 데이터 반환
    if (data.length <= 1 || (data.length === 1 && data[0].every(cell => !cell))) {
      console.log('No data found in sheet, returning test data');
      return {
        success: true,
        data: {
          courses: [
            {
              id: 1,
              title: "디지털릴레이 기본반 (UR, 8-Series)",
              titleKR: "디지털릴레이 기본반 (UR, 8-Series)",
              titleEN: "Digital Relay Basic Course (UR, 8-Series)",
              schedule: {
                days: [
                  {
                    day: "개강일",
                    date: "2025-03-03(월)",
                    subjects: []
                  },
                  {
                    day: "월",
                    date: "2025-03-03",
                    subjects: [
                      { subject: "릴레이 기초 이론", instructor: "김강사" },
                      { subject: "디지털 보호 개요", instructor: "이강사" },
                      { subject: "", instructor: "" },
                      { subject: "실습 준비", instructor: "박강사" },
                      { subject: "", instructor: "" },
                      { subject: "", instructor: "" },
                      { subject: "", instructor: "" }
                    ]
                  }
                ]
              },
              instructors: [
                {
                  name: "김강사",
                  affiliation: "YPP 전력교육원"
                },
                {
                  name: "이강사", 
                  affiliation: "전력시스템 연구소"
                }
              ]
            }
          ]
        },
        timestamp: new Date().toISOString()
      };
    }
    
    // 파싱된 과목 상세 데이터 생성
    const details = parseRelaySchoolDetailsData(data);
    
    console.log('Parsed RelaySchool details:', details);
    console.log('Number of courses parsed:', details.courses.length);
    
    return {
      success: true,
      data: details,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getRelaySchoolDetails:', error);
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * RelaySchool 과목 상세 데이터 파싱 함수
 */
function parseRelaySchoolDetailsData(rawData) {
  const result = {
    courses: []
  };
  
  let currentCourse = null;
  let courseId = 0;
  let inScheduleSection = false;
  
  console.log('Starting to parse RelaySchool data, total rows:', rawData.length);
  
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const titleCell = String(row[0] || '').trim(); // A열: 타이틀
    const koreanCell = String(row[1] || '').trim(); // B열: 한국어 정보
    const englishCell = String(row[5] || '').trim(); // F열: 영어 정보
    
    console.log(`Row ${i}: Title = "${titleCell}", KR = "${koreanCell}", EN = "${englishCell}"`);
    
    // 빈 행 건너뛰기
    if (!titleCell && !koreanCell && !englishCell) {
      continue;
    }
    
    // 과정 제목 감지 (A열에 "제목"이라는 타이틀이 있고, B열에 실제 과정명이 있는 경우)
    if (titleCell === '제목' && koreanCell) {
      console.log(`Found course title at row ${i}: KR="${koreanCell}", EN="${englishCell}"`);
      
      // 이전 과정이 있다면 저장
      if (currentCourse) {
        result.courses.push(currentCourse);
        console.log(`Added previous course to result. Total courses: ${result.courses.length}`);
      }
      
      // 새로운 과정 시작
      courseId++;
      currentCourse = {
        id: courseId,
        title: koreanCell,
        titleKR: koreanCell,
        titleEN: englishCell || koreanCell,
        schedule: {
          korean: {
            days: [],
            sessions: []
          },
          english: {
            days: [],
            sessions: []
          }
        },
        instructor: { korean: '', english: '' },
        period: { korean: '', english: '' },
        objective: { korean: '', english: '' },
        tuition: { korean: '', english: '' },
        curriculum: { korean: '', english: '' },
        instructors: { korean: '', english: '' }
      };
      
      inScheduleSection = false;
      continue;
    }
    
    // 현재 과정이 없으면 건너뛰기
    if (!currentCourse) continue;
    
    // 시간표 섹션 시작 감지
    if (titleCell === '시간표') {
      console.log(`Found schedule section at row ${i}`);
      inScheduleSection = true;
      continue;
    }
    
    // 시간표 데이터 처리
    if (inScheduleSection && titleCell && !titleCell.includes('강사') && !titleCell.includes('교육')) {
      console.log(`Processing schedule row ${i}: ${titleCell}`);
      
      // 시간표 헤더 행인지 확인 (시간/요일 등)
      if (titleCell.includes('시간') || titleCell.includes('요일') || koreanCell.includes('교시')) {
        // 한국어 요일 헤더 처리 (B, C, D, E열)
        const korDays = [];
        for (let col = 2; col <= 4; col++) { // C, D, E열
          if (row[col] && String(row[col]).trim()) {
            korDays.push(String(row[col]).trim());
          }
        }
        currentCourse.schedule.korean.days = korDays;
        
        // 영어 요일 헤더 처리 (F, G, H, I열)
        const engDays = [];
        for (let col = 6; col <= 8; col++) { // G, H, I열
          if (row[col] && String(row[col]).trim()) {
            engDays.push(String(row[col]).trim());
          }
        }
        currentCourse.schedule.english.days = engDays;
        
        console.log(`Schedule headers - KR days: ${korDays}, EN days: ${engDays}`);
      } else {
        // 시간표 데이터 행 처리
        const timeKor = koreanCell; // B열의 시간 정보
        const timeEng = englishCell; // F열의 시간 정보
        
        if (timeKor) {
          const korSession = {
            time: timeKor,
            subjects: []
          };
          
          // C, D, E열의 과목 정보 수집
          for (let col = 2; col <= 4; col++) {
            const subject = row[col] ? String(row[col]).trim() : '';
            korSession.subjects.push(subject);
          }
          currentCourse.schedule.korean.sessions.push(korSession);
          console.log(`Added KR session: ${timeKor}, subjects: ${korSession.subjects}`);
        }
        
        if (timeEng) {
          const engSession = {
            time: timeEng,
            subjects: []
          };
          
          // G, H, I열의 과목 정보 수집
          for (let col = 6; col <= 8; col++) {
            const subject = row[col] ? String(row[col]).trim() : '';
            engSession.subjects.push(subject);
          }
          currentCourse.schedule.english.sessions.push(engSession);
          console.log(`Added EN session: ${timeEng}, subjects: ${engSession.subjects}`);
        }
      }
    }
    // 기타 과정 정보 처리 (시간표 외)
    else if (!inScheduleSection && titleCell && koreanCell) {
      console.log(`Processing course info: ${titleCell} = KR:"${koreanCell}", EN:"${englishCell}"`);
      
      switch (titleCell) {
        case '대표강사':
          currentCourse.instructor.korean = koreanCell;
          currentCourse.instructor.english = englishCell;
          break;
        case '교육기간':
          currentCourse.period.korean = koreanCell;
          currentCourse.period.english = englishCell;
          break;
        case '학습목표':
          currentCourse.objective.korean = koreanCell;
          currentCourse.objective.english = englishCell;
          break;
        case '교육비':
          currentCourse.tuition.korean = koreanCell;
          currentCourse.tuition.english = englishCell;
          break;
        case '교육내용':
          currentCourse.curriculum.korean = koreanCell;
          currentCourse.curriculum.english = englishCell;
          break;
        case '강사 소개':
          currentCourse.instructors.korean = koreanCell;
          currentCourse.instructors.english = englishCell;
          inScheduleSection = false; // 강사 소개 후 시간표 섹션 종료
          break;
      }
    }
  }
  
  // 마지막 과정 추가
  if (currentCourse) {
    result.courses.push(currentCourse);
    console.log(`Added final course to result. Total courses: ${result.courses.length}`);
  }
  
  console.log('Final parsing result:', result);
  console.log('Total courses found:', result.courses.length);
  
  return result;
}