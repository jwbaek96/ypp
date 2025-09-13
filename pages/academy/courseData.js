/**
 * 구글 시트 기반 과정 데이터 관리
 */

// Apps Script 웹앱 URL
const APPS_SCRIPT_ID = 'AKfycbzhGw0bYOCgC2LyRsOQVnmgsw13PoSiIxM1pqq5n_y2Gj-1fesd6D0llRnAKHcLh_-iqw';
const COURSE_DATA_API_URL = `https://script.google.com/macros/s/${APPS_SCRIPT_ID}/exec`;

// 캐시 저장소
let courseDataCache = {
    psac: null,
    relay: null,
    lastUpdated: null,
    cacheTimeout: 5 * 60 * 1000 // 5분 캐시
};

/**
 * PSAC 과정 데이터 가져오기
 */
async function fetchPsacCourses() {
    try {
        // 캐시 확인
        if (courseDataCache.psac && isCacheValid()) {
            return courseDataCache.psac;
        }

        const response = await fetch(`${COURSE_DATA_API_URL}?action=get_psac_courses`);
        const result = await response.json();
        
        if (result.success) {
            // 기존 form.js 형식으로 변환
            const convertedData = convertPsacData(result.data);
            
            // 캐시 저장
            courseDataCache.psac = convertedData;
            courseDataCache.lastUpdated = new Date();
            
            return convertedData;
        } else {
            throw new Error(result.error || 'Failed to fetch PSAC courses');
        }
    } catch (error) {
        console.error('Error fetching PSAC courses:', error);
        throw error; // 에러를 다시 throw하여 상위에서 처리하도록 함
    }
}

/**
 * Relay School 과정 데이터 가져오기
 */
async function fetchRelayCourses() {
    try {
        // 캐시 확인
        if (courseDataCache.relay && isCacheValid()) {
            return courseDataCache.relay;
        }

        const response = await fetch(`${COURSE_DATA_API_URL}?action=get_relay_courses`);
        const result = await response.json();
        
        if (result.success) {
            // 기존 form.js 형식으로 변환
            const convertedData = convertRelayData(result.data);
            
            // 캐시 저장
            courseDataCache.relay = convertedData;
            courseDataCache.lastUpdated = new Date();
            
            return convertedData;
        } else {
            throw new Error(result.error || 'Failed to fetch Relay courses');
        }
    } catch (error) {
        console.error('Error fetching Relay courses:', error);
        throw error; // 에러를 다시 throw하여 상위에서 처리하도록 함
    }
}

/**
 * PSAC 시트 데이터를 기존 형식으로 변환
 */
function convertPsacData(sheetData) {
    const converted = {};
    const closedCourses = {};

    sheetData.forEach((course, index) => {
        const id = index + 1;
        
        converted[id] = {
            kor: course.nameKR,
            eng: course.nameEN,
            tooltipKR: getTooltipByStatus(course.status, 'KR'),
            tooltipEN: getTooltipByStatus(course.status, 'EN')
        };

        // 마감된 과정 처리
        if (course.status === 'OFF' || course.status === '마감') {
            closedCourses[id] = {
                tooltip: "해당 항목은 접수 마감되었습니다. \n(This course is closed due to exceeding capacity.)"
            };
        }
    });

    return { courses: converted, closedCourses };
}

/**
 * Relay 시트 데이터를 기존 형식으로 변환
 */
function convertRelayData(sheetData) {
    const converted = {};

    sheetData.forEach((course, index) => {
        const id = index + 1;
        
        converted[id] = {
            kor: course.nameKR,
            eng: course.nameEN,
            status: course.status
        };
    });

    return converted;
}

/**
 * 상태에 따른 툴팁 생성
 */
function getTooltipByStatus(status, language) {
    switch(status) {
        case 'OFF':
        case '마감':
            return language === 'KR' ? "<br><span>(마감)</span>" : "<br><span>(closed)</span>";
        case '마감임박':
            return language === 'KR' ? "<br><span style='color:red'>(*마감임박)</span>" : "<br><span style='color:red'>(*almost full)</span>";
        case '마감주의':
            return language === 'KR' ? "<br><span style='color:#0088ff'>(*마감주의)</span>" : "<br><span style='color:#0088ff'>(*almost full)</span>";
        default:
            return "";
    }
}

/**
 * 캐시 유효성 확인
 */
function isCacheValid() {
    if (!courseDataCache.lastUpdated) return false;
    const now = new Date();
    return (now - courseDataCache.lastUpdated) < courseDataCache.cacheTimeout;
}

/**
 * 초기화 함수 - 페이지 로드 시 호출
 */
async function initializeCourseData() {
    console.log('Initializing course data...');
    try {
        await Promise.all([
            fetchPsacCourses(),
            fetchRelayCourses()
        ]);
        console.log('Course data initialized successfully');
    } catch (error) {
        console.error('Error initializing course data:', error);
    }
}