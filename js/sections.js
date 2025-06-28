// sections.js - 섹션 컴포넌트 로더

// ===== 섹션 설정 =====
const SECTIONS_CONFIG = {
    // 메인 페이지 섹션들
    hero: {
        path: './components/index/hero.html',
        container: 'hero-section-container'
    },
    intro: {
        path: './components/index/intro.html',
        container: 'intro-section-container'
    },
    epcBusiness: {
        path: './components/index/epc-business.html',
        container: 'epc-business-container'
    },
    protectionProducts: {
        path: './components/index/protection-products.html',
        container: 'protection-products-container'
    },
    companyOverview: {
        path: './components/index/company-overview.html',
        container: 'company-overview-container'
    },
    academy: {
        path: './components/index/academy.html',
        container: 'academy-container'
    },
    contact: {
        path: './components/index/contact.html',
        container: 'contact-container'
    }
};

// ===== 경로 계산 =====
function getBasePath() {
    const currentPath = window.location.pathname;
    const isSubPage = currentPath.includes('/pages/');
    
    if (isSubPage) {
        const depth = (currentPath.match(/\//g) || []).length;
        return depth === 3 ? '../../' : '../';
    }
    return './';
}

// ===== 섹션 로더 =====
async function loadSection(sectionName) {
    const config = SECTIONS_CONFIG[sectionName];
    if (!config) {
        console.error(`❌ Section not found: ${sectionName}`);
        return false;
    }

    const container = document.getElementById(config.container);
    if (!container) {
        console.error(`❌ Container not found: ${config.container}`);
        return false;
    }

    try {
        const basePath = getBasePath();
        const response = await fetch(basePath + config.path);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();
        container.innerHTML = html;
        
        console.log(`✅ Section loaded: ${sectionName}`);
        return true;
        
    } catch (error) {
        console.error(`❌ Failed to load section ${sectionName}:`, error);
        return false;
    }
}

// ===== 여러 섹션 로드 =====
async function loadSections(sectionNames) {
    console.log('🚀 Loading sections:', sectionNames);
    
    const promises = sectionNames.map(sectionName => loadSection(sectionName));
    
    try {
        const results = await Promise.all(promises);
        const successCount = results.filter(result => result).length;
        
        console.log(`🎉 Sections loaded: ${successCount}/${sectionNames.length}`);
        
        // 섹션 로딩 완료 이벤트 발생
        document.dispatchEvent(new CustomEvent('sectionsLoaded', {
            detail: { 
                loaded: sectionNames.filter((name, index) => results[index]),
                failed: sectionNames.filter((name, index) => !results[index])
            }
        }));
        
        return results;
        
    } catch (error) {
        console.error('💥 Section loading failed:', error);
        return [];
    }
}

// ===== 메인 페이지용 섹션 로드 =====
function loadMainPageSections() {
    const mainSections = [
        'hero',
        'intro',
        'epcBusiness', 
        'protectionProducts',
        'companyOverview',
        'academy',
        'contact'
    ];
    
    return loadSections(mainSections);
}

// ===== 섹션별 이벤트 초기화 =====
function initializeSectionEvents() {
    // 아카데미 팝업 이벤트
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="openAcademyPopup"]')) {
            e.preventDefault();
            if (window.openAcademyPopup) {
                window.openAcademyPopup();
            }
        }
    });
    
    // 다운로드 버튼 이벤트
    document.addEventListener('click', function(e) {
        if (e.target.matches('[onclick*="downloadFile"]')) {
            e.preventDefault();
            const filename = e.target.getAttribute('onclick').match(/downloadFile\('([^']+)'\)/);
            if (filename && window.downloadFile) {
                window.downloadFile(filename[1]);
            }
        }
    });
    
    // 부드러운 스크롤 이벤트
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const target = document.querySelector(e.target.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
    
    console.log('🔧 Section events initialized');
}

// ===== 섹션 추가/제거 유틸리티 =====
function addSection(sectionName, config) {
    SECTIONS_CONFIG[sectionName] = config;
    console.log(`➕ Section added: ${sectionName}`);
}

function removeSection(sectionName) {
    const container = document.getElementById(SECTIONS_CONFIG[sectionName]?.container);
    if (container) {
        container.innerHTML = '';
    }
    delete SECTIONS_CONFIG[sectionName];
    console.log(`➖ Section removed: ${sectionName}`);
}

// ===== 자동 초기화 (메인 페이지에서만) =====
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname;
    const isMainPage = currentPath === '/' || currentPath.endsWith('index.html') || currentPath.endsWith('/');
    
    if (isMainPage) {
        console.log('📄 Main page detected, loading sections...');
        
        // 컴포넌트 로딩 후 섹션 로드
        setTimeout(async () => {
            await loadMainPageSections();
            initializeSectionEvents();
        }, 200);
    }
});

// ===== 섹션 로딩 완료 후 이벤트 리스너 =====
document.addEventListener('sectionsLoaded', function(e) {
    console.log('🎯 Sections loaded event:', e.detail);
    
    // 애니메이션 초기화
    if (window.observer) {
        const animatedElements = document.querySelectorAll(
            '.overview-card, .business-card, .product-card, .academy-card, .contact-item'
        );
        
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            window.observer.observe(el);
        });
    }
    
    // 카운터 애니메이션 초기화
    if (window.counterObserver) {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            if (counter.hasAttribute('data-target')) {
                window.counterObserver.observe(counter);
            }
        });
    }
});

// ===== 전역 함수로 내보내기 =====
window.loadSection = loadSection;
window.loadSections = loadSections;
window.loadMainPageSections = loadMainPageSections;
window.addSection = addSection;
window.removeSection = removeSection;

// ===== 디버깅용 함수 =====
window.getSectionsConfig = function() {
    return SECTIONS_CONFIG;
};

window.getLoadedSections = function() {
    return Object.keys(SECTIONS_CONFIG).filter(sectionName => {
        const container = document.getElementById(SECTIONS_CONFIG[sectionName].container);
        return container && container.innerHTML.trim() !== '';
    });
};

// ===== 히어로 섹션 =====
// 헤더 높이 기반 히어로 섹션 패딩 조정 (최적화 버전)
function adjustHeroSectionPadding() {
    const header = document.querySelector('#header, header, .header');
    const heroSection = document.querySelector('#hero, .hero-section');
    
    if (header && heroSection) {
        const styles = getComputedStyle(header);
        const totalHeight = header.offsetHeight + 
                          (parseInt(styles.marginTop) || 0) + 
                          (parseInt(styles.marginBottom) || 0);
        
        heroSection.style.paddingTop = `${totalHeight}px`;
        return totalHeight;
    }
    return 0;
}

// 헤더 높이 변화 감지
function initHeaderHeightWatcher() {
    const header = document.querySelector('#header, header, .header');
    if (!header) return;
    
    let lastHeight = 0;
    
    const update = () => {
        const currentHeight = header.offsetHeight;
        if (currentHeight !== lastHeight) {
            lastHeight = currentHeight;
            adjustHeroSectionPadding();
        }
    };
    
    // ResizeObserver 사용 (지원되는 경우)
    if (window.ResizeObserver) {
        new ResizeObserver(update).observe(header);
    }
    
    // 이벤트 리스너
    window.addEventListener('resize', update);
    if (document.fonts?.ready) {
        document.fonts.ready.then(() => setTimeout(update, 100));
    }
}

// 자동 실행
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        adjustHeroSectionPadding();
        initHeaderHeightWatcher();
    }, 100);
});

// 컴포넌트 로딩 완료 시 재실행
// document.addEventListener('sectionsLoaded', () => {
//     setTimeout(adjustHeroSectionPadding, 50);
// });