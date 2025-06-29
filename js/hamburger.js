// hamburger.js - 햄버거 메뉴 버튼 기능

// ===== 햄버거 버튼 제어 클래스 =====
class HamburgerMenu {
    constructor() {
        this.hamburgerBtn = null;
        this.sidebar = null;
        this.isOpen = false;
        this.overlay = null;
        
        this.init();
    }
    
    // 초기화
    init() {
        this.findElements();
        this.createOverlay();
        this.attachEvents();
    }
    
    // DOM 요소 찾기
    findElements() {
        this.hamburgerBtn = document.getElementById('hamburger-btn');
        this.sidebar = document.getElementById('sidebar-container');
    }
    
    // 오버레이 생성
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'sidebar-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(this.overlay);
        
        // 사이드바 스타일 추가
        this.addSidebarStyles();
    }
    
    // 사이드바 애니메이션 스타일 추가
    addSidebarStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #sidebar-container {
                position: fixed;
                top: 0;
                right: -100%;
                width: 320px;
                height: 100vh;
                background: var(--white, #ffffff);
                box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                transition: right 0.3s ease;
                overflow-y: auto;
            }
            
            #sidebar-container.active {
                right: 0;
            }
            
            @media (max-width: 480px) {
                #sidebar-container {
                    width: 280px;
                }
            }
            
            @media (max-width: 768px) {
                .hamburger-btn {
                    display: flex !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 이벤트 연결
    attachEvents() {
        if (this.hamburgerBtn) {
            this.hamburgerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', () => {
                this.close();
            });
        }
        
        // 사이드바 닫기 버튼 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.id === 'sidebar-close') {
                e.preventDefault();
                this.close();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        // 윈도우 리사이즈 시 데스크톱에서 자동 닫기
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && this.isOpen) {
                this.close();
            }
        });
    }
    
    // 토글
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    // 사이드바 열기
    open() {
        if (!this.sidebar || !this.hamburgerBtn) return;
        
        this.isOpen = true;
        
        // 햄버거 버튼 애니메이션
        this.animateHamburger(true);
        
        // 사이드바 표시
        this.sidebar.classList.add('active');
        
        // 오버레이 표시
        this.overlay.style.opacity = '1';
        this.overlay.style.visibility = 'visible';
        
        // body 스크롤 방지
        document.body.style.overflow = 'hidden';
        
        // ARIA 속성 업데이트
        this.hamburgerBtn.setAttribute('aria-expanded', 'true');
        this.hamburgerBtn.setAttribute('aria-label', '메뉴 닫기');
        
        // 포커스 트랩
        this.trapFocus();
        
        // 커스텀 이벤트 발생
        document.dispatchEvent(new CustomEvent('sidebarOpened'));
    }
    
    // 사이드바 닫기
    close() {
        if (!this.sidebar || !this.hamburgerBtn) return;
        
        this.isOpen = false;
        
        // 햄버거 버튼 애니메이션
        this.animateHamburger(false);
        
        // 사이드바 숨기기
        this.sidebar.classList.remove('active');
        
        // 오버레이 숨기기
        this.overlay.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
        
        // body 스크롤 복원
        document.body.style.overflow = '';
        
        // ARIA 속성 업데이트
        this.hamburgerBtn.setAttribute('aria-expanded', 'false');
        this.hamburgerBtn.setAttribute('aria-label', '메뉴 열기');
        
        // 포커스 해제
        this.releaseFocus();
        
        // 커스텀 이벤트 발생
        document.dispatchEvent(new CustomEvent('sidebarClosed'));
    }
    
    // 햄버거 버튼 애니메이션
    animateHamburger(isOpen) {
        const lines = this.hamburgerBtn.querySelectorAll('.hamburger-line');
        
        if (isOpen) {
            // X 모양으로 변환
            lines[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
            lines[1].style.opacity = '0';
            lines[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        } else {
            // 원래 햄버거 모양으로 복원
            lines[0].style.transform = 'none';
            lines[1].style.opacity = '1';
            lines[2].style.transform = 'none';
        }
    }
    
    // 포커스 트랩 (접근성)
    trapFocus() {
        if (!this.sidebar) return;
        
        const focusableElements = this.sidebar.querySelectorAll(
            'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
            
            // 마지막 요소에서 Tab 시 첫 번째로 이동
            focusableElements[focusableElements.length - 1].addEventListener('keydown', (e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                    e.preventDefault();
                    focusableElements[0].focus();
                }
            });
            
            // 첫 번째 요소에서 Shift+Tab 시 마지막으로 이동
            focusableElements[0].addEventListener('keydown', (e) => {
                if (e.key === 'Tab' && e.shiftKey) {
                    e.preventDefault();
                    focusableElements[focusableElements.length - 1].focus();
                }
            });
        }
    }
    
    // 포커스 해제
    releaseFocus() {
        if (this.hamburgerBtn) {
            this.hamburgerBtn.focus();
        }
    }
    
    // 상태 확인
    getState() {
        return {
            isOpen: this.isOpen,
            hasButton: !!this.hamburgerBtn,
            hasSidebar: !!this.sidebar
        };
    }
    
    // 강제 닫기 (외부에서 호출 가능)
    forceClose() {
        if (this.isOpen) {
            this.close();
        }
    }
}

// ===== 전역 변수 =====
let hamburgerMenuInstance = null;

// ===== 초기화 함수 =====
function initHamburgerMenu() {
    // 컴포넌트 로딩 완료 후 초기화
    const initializeMenu = () => {
        if (!hamburgerMenuInstance) {
            hamburgerMenuInstance = new HamburgerMenu();
        }
    };
    
    // 컴포넌트가 이미 로딩되었는지 확인
    if (document.getElementById('hamburger-btn')) {
        initializeMenu();
    } else {
        // 컴포넌트 로딩 대기
        document.addEventListener('componentsLoaded', () => {
            setTimeout(initializeMenu, 100);
        });
    }
}

// ===== 전역 함수 =====
function toggleSidebar() {
    if (hamburgerMenuInstance) {
        hamburgerMenuInstance.toggle();
    }
}

function closeSidebar() {
    if (hamburgerMenuInstance) {
        hamburgerMenuInstance.close();
    }
}

function getSidebarState() {
    return hamburgerMenuInstance ? hamburgerMenuInstance.getState() : null;
}

// ===== 자동 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    initHamburgerMenu();
});

// ===== 전역 함수 내보내기 =====
window.initHamburgerMenu = initHamburgerMenu;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.getSidebarState = getSidebarState;