// index-sections.js - 인덱스 페이지 섹션들 HTML 불러오기

// ===== 섹션 설정 =====
const SECTION_CONFIG = [
    {
        name: 'hero',
        containerId: 'hero-section-container',
        filePath: './components/index/hero.html',
        priority: 1
    },
    {
        name: 'intro',
        containerId: 'intro-section-container',
        filePath: './components/index/intro.html',
        priority: 2
    },
    {
        name: 'epc-business',
        containerId: 'epc-business-container',
        filePath: './components/index/epc-business.html',
        priority: 3
    },
    {
        name: 'company-overview',
        containerId: 'company-overview-container',
        filePath: './components/index/company-overview.html',
        priority: 4
    },
    {
        name: 'academy',
        containerId: 'academy-container',
        filePath: './components/index/academy.html',
        priority: 5
    },
    {
        name: 'contact',
        containerId: 'contact-container',
        filePath: './components/index/contact.html',
        priority: 6
    }
];

// ===== 섹션 로딩 클래스 =====
class IndexSectionsLoader {
    constructor() {
        this.loadedSections = new Set();
        this.failedSections = new Set();
        this.loadingPromises = new Map();
        
        this.init();
    }
    
    // 초기화
    init() {
        this.loadAllSections();
    }
    
    // 단일 섹션 로딩
    async loadSection(sectionConfig) {
        const { name, containerId, filePath } = sectionConfig;
        
        // 이미 로딩 중인 경우 기존 Promise 반환
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }
        
        // 이미 로딩 완료된 경우
        if (this.loadedSections.has(name)) {
            return Promise.resolve();
        }
        
        const loadingPromise = this.performSectionLoad(name, containerId, filePath);
        this.loadingPromises.set(name, loadingPromise);
        
        return loadingPromise;
    }
    
    // 섹션 로딩 실행
    async performSectionLoad(name, containerId, filePath) {
        try {
            const container = document.getElementById(containerId);
            
            if (!container) {
                throw new Error(`Container #${containerId} not found for section ${name}`);
            }
            
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${name} section: ${response.status}`);
            }
            
            const html = await response.text();
            container.innerHTML = html;
            
            this.loadedSections.add(name);
            this.loadingPromises.delete(name);
            
            // 섹션 로딩 완료 이벤트
            this.dispatchSectionLoadedEvent(name, container);
            
        } catch (error) {
            this.failedSections.add(name);
            this.loadingPromises.delete(name);
            throw error;
        }
    }
    
    // 모든 섹션 로딩
    async loadAllSections() {
        // 우선순위에 따라 정렬
        const sortedSections = SECTION_CONFIG.sort((a, b) => a.priority - b.priority);
        
        try {
            // 병렬 로딩으로 성능 최적화
            const loadingPromises = sortedSections.map(section => 
                this.loadSection(section).catch(error => {
                    return { error, section: section.name };
                })
            );
            
            const results = await Promise.all(loadingPromises);
            
            // 에러 처리
            const errors = results.filter(result => result && result.error);
            if (errors.length > 0) {
                // 실패한 섹션들은 빈 컨테이너로 남겨둠
            }
            
            // 모든 섹션 로딩 완료 이벤트
            this.dispatchAllSectionsLoadedEvent();
            
        } catch (error) {
            // 전체 로딩 실패 처리
        }
    }
    
    // 섹션 로딩 완료 이벤트 발생
    dispatchSectionLoadedEvent(sectionName, container) {
        const event = new CustomEvent('sectionLoaded', {
            detail: {
                section: sectionName,
                container: container,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }
    
    // 모든 섹션 로딩 완료 이벤트 발생
    dispatchAllSectionsLoadedEvent() {
        const event = new CustomEvent('allSectionsLoaded', {
            detail: {
                loadedSections: Array.from(this.loadedSections),
                failedSections: Array.from(this.failedSections),
                totalSections: SECTION_CONFIG.length,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }
    
    // 특정 섹션 재로딩
    async reloadSection(sectionName) {
        const sectionConfig = SECTION_CONFIG.find(s => s.name === sectionName);
        if (!sectionConfig) {
            throw new Error(`Section ${sectionName} not found in configuration`);
        }
        
        // 기존 상태 정리
        this.loadedSections.delete(sectionName);
        this.failedSections.delete(sectionName);
        this.loadingPromises.delete(sectionName);
        
        return this.loadSection(sectionConfig);
    }
    
    // 섹션 언로드
    unloadSection(sectionName) {
        const sectionConfig = SECTION_CONFIG.find(s => s.name === sectionName);
        if (!sectionConfig) return;
        
        const container = document.getElementById(sectionConfig.containerId);
        if (container) {
            container.innerHTML = '';
        }
        
        this.loadedSections.delete(sectionName);
        this.failedSections.delete(sectionName);
        this.loadingPromises.delete(sectionName);
    }
    
    // 로딩 상태 확인
    getLoadingState() {
        return {
            loaded: Array.from(this.loadedSections),
            failed: Array.from(this.failedSections),
            loading: Array.from(this.loadingPromises.keys()),
            total: SECTION_CONFIG.length,
            isComplete: this.loadedSections.size + this.failedSections.size === SECTION_CONFIG.length
        };
    }
    
    // 특정 섹션 로딩 여부 확인
    isSectionLoaded(sectionName) {
        return this.loadedSections.has(sectionName);
    }
    
    // 모든 섹션 로딩 완료 여부
    areAllSectionsLoaded() {
        return this.loadedSections.size === SECTION_CONFIG.length;
    }
}

// ===== 유틸리티 함수들 =====

// 섹션별 초기화 함수 호출
function initializeSectionScripts() {
    // 각 섹션의 JavaScript 초기화 함수들 호출
    const initFunctions = [
        'initHeroSection',
        'initIntroSection', 
        'initEpcBusinessSection',
        'initProtectionProductsSection',
        'initCompanyOverviewSection',
        'initAcademySection',
        'initContactSection'
    ];
    
    initFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            try {
                window[funcName]();
            } catch (error) {
                // 개별 초기화 함수 실패는 무시
            }
        }
    });
}

// 섹션 가시성 확인
function isSectionVisible(sectionName) {
    const sectionConfig = SECTION_CONFIG.find(s => s.name === sectionName);
    if (!sectionConfig) return false;
    
    const container = document.getElementById(sectionConfig.containerId);
    if (!container) return false;
    
    const rect = container.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
}

// 섹션으로 스크롤
function scrollToSection(sectionName, offset = 0) {
    const sectionConfig = SECTION_CONFIG.find(s => s.name === sectionName);
    if (!sectionConfig) return;
    
    const container = document.getElementById(sectionConfig.containerId);
    if (!container) return;
    
    const headerHeight = document.querySelector('.header')?.getBoundingClientRect().height || 0;
    const targetPosition = container.getBoundingClientRect().top + window.pageYOffset;
    const adjustedPosition = targetPosition - headerHeight - offset;
    
    window.scrollTo({
        top: adjustedPosition,
        behavior: 'smooth'
    });
}

// ===== 전역 변수 =====
let indexSectionsLoaderInstance = null;

// ===== 초기화 함수 =====
function initIndexSections() {
    if (!indexSectionsLoaderInstance) {
        indexSectionsLoaderInstance = new IndexSectionsLoader();
        
        // 모든 섹션 로딩 완료 후 스크립트 초기화
        document.addEventListener('allSectionsLoaded', () => {
            setTimeout(initializeSectionScripts, 100);
        });
    }
    
    return indexSectionsLoaderInstance;
}

// ===== 전역 함수들 =====
function reloadIndexSection(sectionName) {
    if (indexSectionsLoaderInstance) {
        return indexSectionsLoaderInstance.reloadSection(sectionName);
    }
}

function getIndexSectionsState() {
    return indexSectionsLoaderInstance ? indexSectionsLoaderInstance.getLoadingState() : null;
}

function isIndexSectionLoaded(sectionName) {
    return indexSectionsLoaderInstance ? indexSectionsLoaderInstance.isSectionLoaded(sectionName) : false;
}

// ===== 자동 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    // 컴포넌트 로딩 완료 후 섹션 로딩 시작
    if (document.querySelector('.main-content')) {
        initIndexSections();
    } else {
        document.addEventListener('componentsLoaded', () => {
            setTimeout(initIndexSections, 100);
        });
    }
});

// ===== 전역 함수 내보내기 =====
window.initIndexSections = initIndexSections;
window.reloadIndexSection = reloadIndexSection;
window.getIndexSectionsState = getIndexSectionsState;
window.isIndexSectionLoaded = isIndexSectionLoaded;
window.isSectionVisible = isSectionVisible;
window.scrollToSection = scrollToSection;