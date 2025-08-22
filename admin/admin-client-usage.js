// 클라이언트에서 Google Apps Script API 사용 예시

// Google Apps Script 웹앱 URL (배포 후 받은 URL)
const DASHBOARD_APPS_SCRIPT_ID = 'AKfycbwXzf5TeXfuuRDkp_LOODYvK9aHb50pADBEYNVFF94uT9Jtvf8mNHkMh9hmRHFlt7cw';
const DASHBOARD_APPS_SCRIPT_URL = `https://script.google.com/macros/s/${DASHBOARD_APPS_SCRIPT_ID}/exec`;

/**
 * 특정 시트 데이터 가져오기
 */
async function fetchSheetData(sheetType) {
    try {
        const url = `${DASHBOARD_APPS_SCRIPT_URL}?sheet=${sheetType}&action=getData`;
        
        console.log(`데이터 요청: ${sheetType}`);
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            console.log(`${sheetType} 데이터 로드 성공:`, result.data.length, '개');
            return result.data;
        } else {
            console.error(`${sheetType} 데이터 로드 실패:`, result.message);
            return [];
        }
        
    } catch (error) {
        console.error(`${sheetType} API 호출 에러:`, error);
        return [];
    }
}

/**
 * 전체 통계 가져오기
 */
async function fetchAllStats() {
    try {
        const url = `${DASHBOARD_APPS_SCRIPT_URL}?sheet=ALL_STATS&action=getData`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            console.log('전체 통계 로드 성공:', result.data);
            return result.data;
        } else {
            console.error('통계 로드 실패:', result.message);
            return null;
        }
        
    } catch (error) {
        console.error('통계 API 호출 에러:', error);
        return null;
    }
}

// ===== 사용 예시 =====

// 1. 대시보드 데이터 가져오기
async function loadDashboardData() {
    const data = await fetchSheetData('SHEET_DASHBOARD');
    console.log('대시보드 데이터:', data);
    
    // 여기서 데이터를 화면에 표시
    displayDashboardData(data);
}

// 2. 갤러리 데이터 가져오기
async function loadGalleryData(galleryType) {
    let sheetType;
    
    switch(galleryType) {
        case 'permit':
            sheetType = 'SHEET_GAL_A';
            break;
        case 'qualified':
            sheetType = 'SHEET_GAL_B';
            break;
        case 'inside':
            sheetType = 'SHEET_GAL_C';
            break;
        case 'academy':
            sheetType = 'SHEET_GAL_F';
            break;
        default:
            console.error('알 수 없는 갤러리 타입:', galleryType);
            return [];
    }
    
    const data = await fetchSheetData(sheetType);
    return data;
}

// 3. 신청서 데이터 가져오기
async function loadApplicationData(applicationType) {
    const sheetType = applicationType === 'psac' ? 'SHEET_APPLY_P' : 'SHEET_APPLY_R';
    const data = await fetchSheetData(sheetType);
    return data;
}

// 4. 문의 데이터 가져오기
async function loadInquiryData(language) {
    const sheetType = language === 'korean' ? 'SHEET_HELP_KR' : 'SHEET_HELP_EN';
    const data = await fetchSheetData(sheetType);
    return data;
}

// 5. 전체 통계 로드
async function loadAllStatistics() {
    const stats = await fetchAllStats();
    if (stats) {
        console.log('갤러리 총합:', stats.galleries.total);
        console.log('신청서 총합:', stats.applications.total);
        console.log('문의 총합:', stats.inquiries.total);
        
        // 통계를 화면에 표시
        displayStatistics(stats);
    }
}

// ===== 화면 표시 함수들 (예시) =====

function displayDashboardData(data) {
    // 대시보드 데이터를 화면에 표시하는 로직
    console.log('대시보드 표시:', data);
}

function displayStatistics(stats) {
    // 통계를 카드나 차트로 표시하는 로직
    document.getElementById('gallery-count').textContent = stats.galleries.total;
    document.getElementById('application-count').textContent = stats.applications.total;
    document.getElementById('inquiry-count').textContent = stats.inquiries.total;
    document.getElementById('report-count').textContent = stats.reports.count;
}

// ===== 실제 사용 =====

// 페이지 로드 시 통계 데이터 가져오기
document.addEventListener('DOMContentLoaded', async () => {
    console.log('관리자 패널 초기화 중...');
    
    // 전체 통계 로드
    await loadAllStatistics();
    
    // 필요한 경우 특정 데이터도 미리 로드
    // await loadDashboardData();
});

// 버튼 클릭 이벤트 예시
function setupEventListeners() {
    document.getElementById('load-gallery-btn')?.addEventListener('click', async () => {
        const galleryData = await loadGalleryData('academy');
        console.log('아카데미 갤러리 데이터:', galleryData);
    });
    
    document.getElementById('load-applications-btn')?.addEventListener('click', async () => {
        const psacData = await loadApplicationData('psac');
        const relayData = await loadApplicationData('relay');
        console.log('PSAC 신청:', psacData.length, '개');
        console.log('RelaySchool 신청:', relayData.length, '개');
    });
}

// ===== URL별 요청 예시 =====

/*
다음과 같은 URL로 요청할 수 있습니다:

1. 대시보드 데이터:
   https://script.google.com/macros/s/YOUR_ID/exec?sheet=SHEET_DASHBOARD

2. 갤러리 인허가 데이터:
   https://script.google.com/macros/s/YOUR_ID/exec?sheet=SHEET_GAL_A

3. PSAC 신청 데이터:
   https://script.google.com/macros/s/YOUR_ID/exec?sheet=SHEET_APPLY_P

4. 전체 통계:
   https://script.google.com/macros/s/YOUR_ID/exec?sheet=ALL_STATS

5. 한국어 문의:
   https://script.google.com/macros/s/YOUR_ID/exec?sheet=SHEET_HELP_KR

... 등등
*/
