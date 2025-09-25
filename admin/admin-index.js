// Google Apps Script 웹앱 URL (배포 후 받은 URL)
const DASHBOARD_APPS_SCRIPT_ID = 'AKfycbyw7jwrWG5vrjeZxogBrl3HUsBiZmbr_HrR9K_jni0OmHk7neQWBFUCgd6kzZcqmA3C';
// const DASHBOARD_APPS_SCRIPT_ID = 'AKfycbxpCCjRsLr1A2Yv8UUQMbcsTyqRi1Jt_pPDERgwFUSUyQv83P8ex8G03u8dNaJQfhRV';
const DASHBOARD_APPS_SCRIPT_URL = `https://script.google.com/macros/s/${DASHBOARD_APPS_SCRIPT_ID}/exec`;

// 인증된 요청을 위한 헬퍼 함수
async function makeAuthenticatedRequest(url, options = {}) {
    const session = adminAuth.getSession();
    if (!session || !session.token) {
        adminAuth.redirectToLogin();
        return null;
    }
    
    // sessionToken을 URL 매개변수 또는 POST 데이터에 추가
    if (options.method === 'POST') {
        const body = options.body || new URLSearchParams();
        if (body instanceof URLSearchParams) {
            body.set('sessionToken', session.token);
        }
        options.body = body;
    } else {
        // GET 요청인 경우 URL에 추가
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}sessionToken=${encodeURIComponent(session.token)}`;
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        // 인증 오류 확인
        if (result.code === 'AUTH_REQUIRED') {
            adminAuth.clearSession();
            adminAuth.redirectToLogin();
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('인증된 요청 오류:', error);
        return null;
    }
}

// 대시보드 데이터 로드 및 표시
async function loadDashboardData() {
    try {
        console.log('대시보드 데이터 로드 중...');

        const response = await fetch(`${DASHBOARD_APPS_SCRIPT_URL}?sheet=SHEET_DASHBOARD`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }
        
        const data = result.data;
        console.log('대시보드 데이터:', data);
        
        // 각 nav-count 요소에 데이터 표시
        updateNavCounts(data);
        
    } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        
        // 에러 시 기본값 표시
        const defaultData = {
            galA: 0, galB: 0, galC: 0, galD: 0,
            boardNews: 0, applyPSAC: 0, applyRelay: 0, applyRelaySpecial: 0,
            helpKR: 0, helpEN: 0, report: 0
        };
        updateNavCounts(defaultData);
    }
}

// 네비게이션 카운트 업데이트
function updateNavCounts(data) {
    // data-nav 속성과 대시보드 데이터 매핑
    const navMapping = {
        'license': data.galA,           // 인허가
        'qualification': data.galB,     // 유자격
        'inside': data.galC,           // 인사이드
        'academy': data.galD,          // 아카데미
        'video': data.galVideo,          // 비디오
        'news': data.boardNews,        // 보도자료
        'psac': data.applyPSAC,        // PSAC
        'relay-school': data.applyRelay, // Relay School
        'relay-school-special': data.applyRelaySpecial, // Relay School Special
        'customer-inquiries-kr': data.helpKR, // 고객문의 (한)
        'customer-inquiries-en': data.helpEN, // 고객문의 (영)
        'corruption-report': data.report  // 부패신고
    };
    
    // 각 nav 항목 업데이트
    Object.keys(navMapping).forEach(navKey => {
        const navElement = document.querySelector(`[data-nav="${navKey}"]`);
        if (navElement) {
            const countElement = navElement.querySelector('.nav-count');
            if (countElement) {
                const count = navMapping[navKey];
                countElement.textContent = `${count}건`;
                console.log(`${navKey}: ${count}건 업데이트`);
            }
        }
    });
    
    // FAQ는 별도 처리 (아직 데이터 없음)
    const faqElement = document.querySelector('[data-nav="faq"]');
    if (faqElement) {
        const faqCount = faqElement.querySelector('.nav-count');
        if (faqCount) {
            faqCount.textContent = ''; // 임시값
        }
    }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('YPP Admin Panel 초기화...');
    const clock = new Clock(); // 시계 인스턴스 생성
    clock.start(); // 시계 시작
    loadDashboardData();
});

// 시계 클래스
class Clock {
    constructor() {
        this.intervalId = null;
    }
    
    start() {
        this.updateClock(); // 즉시 시계 업데이트
        this.intervalId = setInterval(() => this.updateClock(), 1000); // 1초마다 업데이트
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    updateClock() {
        const now = new Date();
        
        // 시간 계산 (12시간 형식)
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        
        // 12시간 형식으로 변환
        if (hours > 12) {
            hours = hours - 12;
        } else if (hours === 0) {
            hours = 12;
        }
        
        // 날짜 계산
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        
        // DOM 업데이트 (한자리수도 그대로 표시)
        document.getElementById('clock-hours').textContent = hours.toString();
        document.getElementById('clock-minutes').textContent = minutes.toString().padStart(2, '0'); // 분은 항상 2자리
        document.getElementById('clock-period').textContent = period;
        document.getElementById('clock-date').textContent = `${year}년 ${month}월 ${date}일`;
    }
}

// 새로고침 버튼 기능 (필요시 추가)
function refreshData() {
    loadDashboardData();
}

// 클릭 이벤트 리스너 추가 (각 nav 항목 클릭 시)
document.addEventListener('DOMContentLoaded', () => {
    // 웹 데이터 관리 항목들 (page-web.html로 이동하는 항목들)
    const webDataNavItems = ['history', 'nuclear', 'thermal', 'substation', 'us-base'];
    
    document.querySelectorAll('[data-nav]').forEach(navItem => {
        const navType = navItem.getAttribute('data-nav');
        
        navItem.addEventListener('click', (e) => {
            console.log(`${navType} 항목 클릭됨`);
            
            // FAQ는 모달로 처리
            if (navType === 'faq') {
                openFaqModal();
                return;
            }
            
            // 웹 데이터 관리 항목들은 page-web.html로 이동
            if (webDataNavItems.includes(navType)) {
                window.location.href = `./page-web.html#${navType}`;
                return;
            }
            
            // 기존 페이지 관리 항목들은 page.html로 이동
            handleNavClick(navType);
        });
    });
});

// 네비게이션 클릭 처리
function handleNavClick(navType) {
    // 현재 선택된 항목 하이라이트
    document.querySelectorAll('[data-nav]').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-nav="${navType}"]`)?.classList.add('active');
    
    // nav-type을 페이지 파라미터로 변환
    const pageMapping = {
        'popups': '팝업',
        'license': '인허가',
        'qualification': '유자격',
        'inside': '인사이드',
        'academy': '아카데미',
        'news': '보도자료',
        'psac': 'PSAC',
        'relay-school': 'RelaySchool',
        'relay-school-special': 'RelaySchoolSpecial',
        'customer-inquiries-kr': '고객문의(KOR)',
        'customer-inquiries-en': '고객문의(ENG)',
        'corruption-report': '부패및윤리신고'
    };
    
    const pageName = pageMapping[navType];
    if (pageName) {
        console.log(`${pageName} 페이지로 이동`);
        // page.html로 이동하면서 파라미터 전달
        window.location.href = `page.html?page=${encodeURIComponent(pageName)}`;
    } else {
        console.log(`알 수 없는 네비게이션: ${navType}`);
    }
}
