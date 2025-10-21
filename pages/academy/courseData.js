/**
 * 구글 시트 기반 과정 데이터 관리
 */

// Apps Script 웹앱 URL (동적으로 로드됨)
let COURSE_DATA_API_URL = null;

// 캐시 저장소
let courseDataCache = {
    psac: null,
    relay: null,
    lastUpdated: null,
    cacheTimeout: 5 * 60 * 1000 // 5분 캐시
};

/**
 * YPPConfig 로드 대기 (더 강력한 버전)
 */
async function waitForYPPConfig() {
    // 이미 초기화되어 있으면 즉시 반환
    if (window.YPPConfig && 
        typeof window.YPPConfig.getConfig === 'function' && 
        window.YPPConfig.initialized) {
        return true;
    }
    
    // Promise와 이벤트 리스너를 결합한 방식
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 150; // 15초 대기
        
        const checkConfig = () => {
            attempts++;
            
            if (window.YPPConfig && 
                typeof window.YPPConfig.getConfig === 'function' && 
                window.YPPConfig.initialized) {
                resolve(true);
                return;
            }
            
            if (attempts >= maxAttempts) {
                reject(new Error('YPP Config 로드 대기 시간 초과'));
                return;
            }
            
            setTimeout(checkConfig, 100);
        };
        
        // 즉시 첫 번째 체크 시작
        checkConfig();
        
        // 추가로 DOMContentLoaded와 load 이벤트도 감지
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkConfig);
        }
        window.addEventListener('load', checkConfig);
    });
}

/**
 * Apps Script URL 가져오기 (캐싱 포함)
 */
async function getCourseDataApiUrl() {
    if (COURSE_DATA_API_URL) {
        return COURSE_DATA_API_URL;
    }
    
    try {
        await waitForYPPConfig();
        COURSE_DATA_API_URL = await window.YPPConfig.getConfig('YPP_APPSURL_ACADEMY_COURSEDATA');
        return COURSE_DATA_API_URL;
    } catch (error) {
        // 폴백: 하드코딩된 URL 사용
        COURSE_DATA_API_URL = 'https://script.google.com/macros/s/AKfycbzhGw0bYOCgC2LyRsOQVnmgsw13PoSiIxM1pqq5n_y2Gj-1fesd6D0llRnAKHcLh_-iqw/exec';
        return COURSE_DATA_API_URL;
    }
}

/**
 * PSAC 과정 데이터 가져오기
 */
async function fetchPsacCourses() {
    try {
        // 캐시 확인
        if (courseDataCache.psac && isCacheValid()) {
            return courseDataCache.psac;
        }

        const apiUrl = await getCourseDataApiUrl();
        const response = await fetch(`${apiUrl}?action=get_psac_courses`);
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

        const apiUrl = await getCourseDataApiUrl();
        const response = await fetch(`${apiUrl}?action=get_relay_courses`);
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
        if (course.status === 'OFF' || course.status === '접수마감') {
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
            status: course.status || 'ON', // 기본값은 'ON'
            tooltipKR: getTooltipByStatus(course.status, 'KR'),
            tooltipEN: getTooltipByStatus(course.status, 'EN')
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
            return language === 'KR' ? "<span class='form-course-list form-course-list-off'>마감</span>" : "<span class='form-course-list form-course-list-off'>Closed</span>";
        case '접수마감':
            return language === 'KR' ? "<span class='form-course-list form-course-list-접수마감'>접수마감</span>" : "<span class='form-course-list form-course-list-접수마감'>Closed</span>";
        case '마감임박':
            return language === 'KR' ? "<span class='form-course-list form-course-list-마감임박'>마감임박</span>" : "<span class='form-course-list form-course-list-마감임박'>Almost Full</span>";
        case '마감주의':
            return language === 'KR' ? "<span class='form-course-list form-course-list-마감주의'>마감주의</span>" : "<span class='form-course-list form-course-list-마감주의'>Almost Full</span>";
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