// loading-screen.js - 로딩 화면 제어

// ===== 로딩 화면 설정 =====
const LOADING_CONFIG = {
    minDisplayTime: 2000,    // 최소 표시 시간 (1초)
    fadeOutDuration: 500,    // 페이드아웃 시간 (0.5초)
    logoAnimationDelay: 200  // 로고 애니메이션 지연 시간
};

// ===== 로딩 화면 제어 클래스 =====
class LoadingScreen {
    constructor() {
        this.loadingElement = null;
        this.logoElement = null;
        this.startTime = Date.now();
        this.isContentLoaded = false;
        this.isMinTimeElapsed = false;
        
        this.init();
    }
    
    // 초기화
    init() {
        this.loadingElement = document.getElementById('loading-screen');
        this.logoElement = this.loadingElement?.querySelector('.loading-logo');
        
        if (!this.loadingElement) {
            console.warn('⚠️ Loading screen element not found');
            return;
        }
        
        // 로고 애니메이션 시작
        this.startLogoAnimation();
        
        // 최소 표시 시간 타이머
        setTimeout(() => {
            this.isMinTimeElapsed = true;
            this.checkAndHide();
        }, LOADING_CONFIG.minDisplayTime);
        
        // DOM 준비 상태 확인
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.onContentLoaded();
            });
        } else {
            this.onContentLoaded();
        }
        
        // 모든 리소스 로딩 완료 확인
        if (document.readyState === 'complete') {
            this.onAllResourcesLoaded();
        } else {
            window.addEventListener('load', () => {
                this.onAllResourcesLoaded();
            });
        }
        
        console.log('🎬 Loading screen initialized');
    }
    
    // 로고 애니메이션 시작
    startLogoAnimation() {
        if (this.logoElement) {
            setTimeout(() => {
                this.logoElement.style.opacity = '1';
            }, LOADING_CONFIG.logoAnimationDelay);
        }
    }
    
    // DOM 콘텐츠 로딩 완료
    onContentLoaded() {
        console.log('📄 DOM content loaded');
        
        // 컴포넌트 로딩 완료까지 대기
        this.waitForComponents();
    }
    
    // 모든 리소스 로딩 완료
    onAllResourcesLoaded() {
        console.log('🖼️ All resources loaded');
        this.isContentLoaded = true;
        this.checkAndHide();
    }
    
    // 컴포넌트 로딩 대기
    waitForComponents() {
        const checkComponents = () => {
            const header = document.getElementById('header-container');
            const footer = document.getElementById('footer-container');
            
            // 헤더와 푸터가 로딩되었는지 확인
            const headerLoaded = header && header.innerHTML.trim() !== '';
            const footerLoaded = footer && footer.innerHTML.trim() !== '';
            
            if (headerLoaded && footerLoaded) {
                console.log('🧩 Components loaded');
                this.isContentLoaded = true;
                this.checkAndHide();
            } else {
                // 100ms 후 다시 확인
                setTimeout(checkComponents, 100);
            }
        };
        
        checkComponents();
    }
    
    // 숨김 조건 확인 및 실행
    checkAndHide() {
        if (this.isContentLoaded && this.isMinTimeElapsed) {
            this.hide();
        }
    }
    
    // 로딩 화면 숨기기
    hide() {
        if (!this.loadingElement) return;
        
        console.log('🎭 Hiding loading screen');
        
        // 페이드아웃 클래스 추가
        this.loadingElement.classList.add('fade-out');
        
        // 애니메이션 완료 후 DOM에서 제거
        setTimeout(() => {
            this.loadingElement.style.display = 'none';
            document.body.classList.remove('loading');
            
            // 로딩 완료 이벤트 발생
            this.dispatchLoadingComplete();
            
            console.log('✅ Loading screen hidden');
        }, LOADING_CONFIG.fadeOutDuration);
    }
    
    // 강제 숨기기 (에러 상황 등)
    forceHide() {
        console.log('⚡ Force hiding loading screen');
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
            document.body.classList.remove('loading');
            this.dispatchLoadingComplete();
        }
    }
    
    // 로딩 완료 이벤트 발생
    dispatchLoadingComplete() {
        const event = new CustomEvent('loadingComplete', {
            detail: {
                duration: Date.now() - this.startTime
            }
        });
        document.dispatchEvent(event);
    }
    
    // 진행률 업데이트 (필요시 사용)
    updateProgress(percentage) {
        if (percentage >= 100) {
            this.isContentLoaded = true;
            this.checkAndHide();
        }
    }
}

// ===== 전역 함수들 =====
let loadingScreenInstance = null;

// 로딩 화면 초기화
function initLoadingScreen() {
    if (!loadingScreenInstance) {
        loadingScreenInstance = new LoadingScreen();
    }
    return loadingScreenInstance;
}

// 로딩 화면 강제 숨기기
function hideLoadingScreen() {
    if (loadingScreenInstance) {
        loadingScreenInstance.forceHide();
    }
}

// 진행률 업데이트
function updateLoadingProgress(percentage) {
    if (loadingScreenInstance) {
        loadingScreenInstance.updateProgress(percentage);
    }
}

// ===== 자동 초기화 =====
// 스크립트 로딩 즉시 실행
initLoadingScreen();

// ===== 전역 함수 내보내기 =====
window.initLoadingScreen = initLoadingScreen;
window.hideLoadingScreen = hideLoadingScreen;
window.updateLoadingProgress = updateLoadingProgress;

// ===== 에러 처리 =====
// 10초 후 강제 숨김 (무한 로딩 방지)
setTimeout(() => {
    if (loadingScreenInstance && loadingScreenInstance.loadingElement && 
        loadingScreenInstance.loadingElement.style.display !== 'none') {
        console.warn('⚠️ Loading screen timeout - force hiding');
        hideLoadingScreen();
    }
}, 10000);