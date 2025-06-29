// main-top-padding.js - 메인 콘텐츠 상단 패딩 자동 조정

// ===== 메인 패딩 제어 클래스 =====
class MainTopPadding {
    constructor() {
        this.header = null;
        this.mainContent = null;
        this.headerHeight = 0;
        this.resizeObserver = null;
        
        this.init();
    }
    
    // 초기화
    init() {
        this.findElements();
        this.setupPaddingAdjustment();
        this.attachEvents();
    }
    
    // DOM 요소 찾기
    findElements() {
        this.header = document.getElementById('header') || document.querySelector('.header');
        this.mainContent = document.querySelector('.main-content') || document.querySelector('main');
    }
    
    // 패딩 조정 설정
    setupPaddingAdjustment() {
        if (!this.header || !this.mainContent) {
            return;
        }
        
        // 초기 패딩 설정
        this.updatePadding();
        
        // ResizeObserver로 헤더 크기 변화 감지
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.updatePadding();
            });
            this.resizeObserver.observe(this.header);
        }
    }
    
    // 이벤트 연결
    attachEvents() {
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', () => {
            this.updatePadding();
        });
        
        // 컴포넌트 로딩 완료 후 재조정
        document.addEventListener('componentsLoaded', () => {
            setTimeout(() => {
                this.findElements();
                this.updatePadding();
            }, 100);
        });
        
        // 로딩 완료 후 재조정
        document.addEventListener('loadingComplete', () => {
            setTimeout(() => {
                this.updatePadding();
            }, 200);
        });
        
        // 사이드바 열림/닫힘 시 재조정
        document.addEventListener('sidebarOpened', () => {
            this.updatePadding();
        });
        
        document.addEventListener('sidebarClosed', () => {
            this.updatePadding();
        });
    }
    
    // 패딩 업데이트
    updatePadding() {
        if (!this.header || !this.mainContent) {
            this.findElements();
            if (!this.header || !this.mainContent) return;
        }
        
        // 헤더 높이 계산
        const newHeaderHeight = this.getHeaderHeight();
        
        // 높이가 변경된 경우에만 업데이트
        if (newHeaderHeight !== this.headerHeight) {
            this.headerHeight = newHeaderHeight;
            this.applyPadding();
        }
    }
    
    // 헤더 높이 계산
    getHeaderHeight() {
        if (!this.header) return 0;
        
        // 헤더의 실제 높이 계산 (border, margin 포함)
        const rect = this.header.getBoundingClientRect();
        const styles = window.getComputedStyle(this.header);
        
        const marginTop = parseFloat(styles.marginTop) || 0;
        const marginBottom = parseFloat(styles.marginBottom) || 0;
        
        return rect.height + marginTop + marginBottom;
    }
    
    // 패딩 적용
    applyPadding() {
        if (!this.mainContent || this.headerHeight <= 0) return;
        
        // 기존 패딩 제거 후 새로운 패딩 적용
        this.mainContent.style.paddingTop = `${this.headerHeight}px`;
        
        // CSS 변수로도 설정 (다른 요소에서 사용 가능)
        document.documentElement.style.setProperty('--header-height', `${this.headerHeight}px`);
    }
    
    // 수동 업데이트 (외부에서 호출 가능)
    forceUpdate() {
        this.findElements();
        this.updatePadding();
    }
    
    // 패딩 제거
    removePadding() {
        if (this.mainContent) {
            this.mainContent.style.paddingTop = '';
        }
        document.documentElement.style.removeProperty('--header-height');
    }
    
    // 현재 상태 반환
    getState() {
        return {
            headerHeight: this.headerHeight,
            hasHeader: !!this.header,
            hasMainContent: !!this.mainContent,
            currentPadding: this.mainContent ? this.mainContent.style.paddingTop : null
        };
    }
    
    // 정리
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        this.removePadding();
    }
}

// ===== 추가 헬퍼 함수들 =====

// 특정 섹션에 추가 오프셋 적용
function addSectionOffset(sectionSelector, offset = 20) {
    const section = document.querySelector(sectionSelector);
    if (section) {
        const currentMargin = parseFloat(window.getComputedStyle(section).marginTop) || 0;
        section.style.marginTop = `${currentMargin + offset}px`;
    }
}

// 스크롤 위치 조정 (앵커 링크용)
function adjustScrollPosition(targetId, additionalOffset = 0) {
    const target = document.getElementById(targetId);
    const header = document.querySelector('.header');
    
    if (target && header) {
        const headerHeight = header.getBoundingClientRect().height;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        const adjustedPosition = targetPosition - headerHeight - additionalOffset;
        
        window.scrollTo({
            top: adjustedPosition,
            behavior: 'smooth'
        });
    }
}

// ===== 전역 변수 =====
let mainTopPaddingInstance = null;

// ===== 초기화 함수 =====
function initMainTopPadding() {
    if (!mainTopPaddingInstance) {
        mainTopPaddingInstance = new MainTopPadding();
    }
    return mainTopPaddingInstance;
}

// ===== 전역 함수들 =====
function updateMainPadding() {
    if (mainTopPaddingInstance) {
        mainTopPaddingInstance.forceUpdate();
    }
}

function removeMainPadding() {
    if (mainTopPaddingInstance) {
        mainTopPaddingInstance.removePadding();
    }
}

function getMainPaddingState() {
    return mainTopPaddingInstance ? mainTopPaddingInstance.getState() : null;
}

// ===== 자동 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    // 다른 컴포넌트들이 로딩된 후 실행
    setTimeout(initMainTopPadding, 500);
});

// ===== 전역 함수 내보내기 =====
window.initMainTopPadding = initMainTopPadding;
window.updateMainPadding = updateMainPadding;
window.removeMainPadding = removeMainPadding;
window.getMainPaddingState = getMainPaddingState;
window.addSectionOffset = addSectionOffset;
window.adjustScrollPosition = adjustScrollPosition;