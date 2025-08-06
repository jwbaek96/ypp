
// esg.js - ESG 페이지 탭/섹션 네비게이션 기능 (about.js 기반)

// ===== ESG 페이지 컨트롤러 클래스 =====
class ESGPageController {
    constructor() {
        this.currentTab = 'esg';
        this.currentSection = null;
        
        this.init();
    }
    
    // 초기화
    init() {
        this.setupTabNavigation();
        this.setupSectionNavigation();
        this.handleUrlParams();
        this.attachEvents();
    }
    
    // 탭 네비게이션 설정
    setupTabNavigation() {
        const tabLinks = document.querySelectorAll('.tab-link');
        
        tabLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.getAttribute('data-tab');
                this.switchTab(tabId);
                
                // URL 파라미터 업데이트
                const newUrl = `${window.location.pathname}?tab=${tabId}`;
                window.history.pushState(null, null, newUrl);
            });
        });
    }
    
    // 섹션 네비게이션 설정
    setupSectionNavigation() {
        const sectionLinks = document.querySelectorAll('.section-nav-link');
        
        sectionLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                const sectionId = href.substring(1); // # 제거
                
                this.scrollToSection(sectionId);
                this.updateSectionActiveState(link);
                
                // URL 해시 업데이트
                window.history.pushState(null, null, href);
            });
        });
    }
    
    // URL 파라미터 처리
    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const hash = window.location.hash.substring(1);
        
        if (tabParam) {
            // URL 파라미터에 탭이 있는 경우
            this.switchTab(tabParam);
        } else if (hash) {
            // 호환성을 위해 해시가 있는 경우도 처리
            if (this.isTabId(hash)) {
                this.switchTab(hash);
            } else if (this.isSectionId(hash)) {
                const tabId = this.getTabIdFromSection(hash);
                this.switchTab(tabId);
                setTimeout(() => {
                    this.scrollToSection(hash);
                }, 100);
            }
        } else {
            // 기본 탭으로 설정
            const defaultTabId = 'esg';
            this.switchTab(defaultTabId);
        }
        
        // 브라우저 뒤로가기/앞으로가기 처리
        window.addEventListener('popstate', () => {
            this.handleUrlParams();
        });
    }
    
    // 탭 전환
    switchTab(tabId) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        this.currentTab = tabId;
        
        // 모든 탭 링크 비활성화
        document.querySelectorAll('.tab-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // 해당 탭 링크 활성화
        const activeTabLink = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeTabLink) {
            activeTabLink.classList.add('active');
        }
        
        // 모든 탭 콘텐츠 숨기기
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 해당 탭 콘텐츠 표시
        const activeTabContent = document.getElementById(tabId);
        if (activeTabContent) {
            activeTabContent.classList.add('active');
        }
        
        // 섹션 네비게이션 전환
        this.switchSectionNav(tabId);
    }
    
    // 섹션 네비게이션 전환
    switchSectionNav(tabId) {
        // 모든 섹션 네비게이션 숨기기
        document.querySelectorAll('.section-nav').forEach(nav => {
            nav.style.display = 'none';
        });
        
        // 해당 탭의 섹션 네비게이션 표시
        const activeSectionNav = document.getElementById(`section-nav-${tabId}`);
        if (activeSectionNav) {
            activeSectionNav.style.display = 'flex';
        }
        
        // 섹션 활성화 상태 초기화
        this.clearSectionActiveStates();
    }
    
    // 섹션으로 스크롤
    scrollToSection(sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;
        
        // 헤더 높이 + 탭 네비게이션 높이 계산
        const header = document.querySelector('.header');
        const tabNavigation = document.querySelector('.tab-navigation');
        
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const tabNavHeight = tabNavigation ? tabNavigation.getBoundingClientRect().height : 0;
        const totalOffset = headerHeight + tabNavHeight + 20; // 여유 공간 20px
        
        const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
        const adjustedPosition = targetPosition - totalOffset;
        
        window.scrollTo({
            top: adjustedPosition,
            behavior: 'smooth'
               });
        
        this.currentSection = sectionId;
    }
    
    // 섹션 활성화 상태 업데이트
    updateSectionActiveState(activeLink) {
        // 현재 표시된 섹션 네비게이션 내의 모든 링크 비활성화
        const currentSectionNav = document.querySelector('.section-nav[style*="flex"]');
        if (currentSectionNav) {
            currentSectionNav.querySelectorAll('.section-nav-link').forEach(link => {
                link.classList.remove('active');
            });
        }
        
        // 클릭된 링크 활성화
        activeLink.classList.add('active');
    }
    
    // 섹션 활성화 상태 초기화
    clearSectionActiveStates() {
        document.querySelectorAll('.section-nav-link').forEach(link => {
            link.classList.remove('active');
        });
    }
    
    // 탭 ID인지 확인
    isTabId(id) {
        const tabIds = ['esg', 'environment', 'social', 'governance'];
        return tabIds.includes(id);
    }
    
    // 섹션 ID인지 확인
    isSectionId(id) {
        const sectionPrefixes = ['esg-', 'environment-', 'social-', 'governance-'];
        return sectionPrefixes.some(prefix => id.startsWith(prefix));
    }
    
    // 섹션 ID로부터 탭 ID 추출
    getTabIdFromSection(sectionId) {
        if (sectionId.startsWith('esg-')) return 'esg';
        if (sectionId.startsWith('environment-')) return 'environment';
        if (sectionId.startsWith('social-')) return 'social';
        if (sectionId.startsWith('governance-')) return 'governance';
        return 'esg'; // 기본값
    }
    
    // 추가 이벤트 처리
    attachEvents() {
        // 스크롤 시 현재 보이는 섹션 감지 (옵션)
        this.setupScrollSpy();
        
        // 키보드 네비게이션 (옵션)
        this.setupKeyboardNavigation();
    }
    
    // 스크롤 스파이 (현재 보이는 섹션 자동 감지)
    setupScrollSpy() {
        let ticking = false;
        
        const updateActiveSection = () => {
            const sections = document.querySelectorAll('.content-block[id]');
            const scrollPosition = window.pageYOffset + window.innerHeight / 2;
            
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const sectionTop = rect.top + window.pageYOffset;
                const sectionBottom = sectionTop + rect.height;
                
                if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                    const sectionId = section.id;
                    const correspondingLink = document.querySelector(`[href="#${sectionId}"]`);
                    
                    if (correspondingLink && !correspondingLink.classList.contains('active')) {
                        this.updateSectionActiveState(correspondingLink);
                    }
                }
            });
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateActiveSection);
                ticking = true;
            }
        });
    }
    
    // 외부에서 호출 가능한 메서드들
    goToTab(tabId) {
        this.switchTab(tabId);
        const newUrl = `${window.location.pathname}?tab=${tabId}`;
        window.history.pushState(null, null, newUrl);
    }
    
    goToSection(sectionId) {
        const tabId = this.getTabIdFromSection(sectionId);
        this.switchTab(tabId);
        setTimeout(() => {
            this.scrollToSection(sectionId);
        }, 100);
        window.history.pushState(null, null, `#${sectionId}`);
    }
    
    getCurrentTab() {
        return this.currentTab;
    }
    
    getCurrentSection() {
        return this.currentSection;
    }
}

// ===== 전역 변수 =====
let esgPageController = null;

// ===== 초기화 함수 =====
function initESGPage() {
    if (!esgPageController) {
        esgPageController = new ESGPageController();
    }
    return esgPageController;
}

// ===== 전역 함수들 =====
function goToTab(tabId) {
    if (esgPageController) {
        esgPageController.goToTab(tabId);
    }
}

function goToSection(sectionId) {
    if (esgPageController) {
        esgPageController.goToSection(sectionId);
    }
}

function getCurrentTab() {
    return esgPageController ? esgPageController.getCurrentTab() : null;
}

function getCurrentSection() {
    return esgPageController ? esgPageController.getCurrentSection() : null;
}

// ===== 자동 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    // 컴포넌트 로딩 완료 후 초기화
    if (document.querySelector('.tab-navigation')) {
        initESGPage();
    } else {
        document.addEventListener('componentsLoaded', () => {
            setTimeout(initESGPage, 200);
        });
    }
});

// ===== 전역 함수 내보내기 =====
window.initESGPage = initESGPage;
window.goToTab = goToTab;
window.goToSection = goToSection;
window.getCurrentTab = getCurrentTab;
window.getCurrentSection = getCurrentSection;
