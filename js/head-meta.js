// head-meta.js - 동적 메타태그 및 파비콘 삽입

// ===== 메타 데이터 설정 =====
const META_CONFIG = {
    keywords: "디지털보호계전기(Protection relay), 삼중화 보호(TRIUMP), 고장기록장치, 산업용 통신장비(Ethernet), 전력보호, 설비진단, 플랜트제어, 플랜트설계, 전력계통 컨설팅, 정정계산, 전력계통 분석, 전력계통 진단, 전력계통 신뢰도, 디지털변전소, 주한미군 사업, 전기전력설비, 건축기자재, CGID, 전력계통 유지보수, 무정전전원장치(UPS), PLC(programmable logic controller), GCB(발전기차단기;Generator Circuit Breaker), 전력계통 교육, 계통보호 교육",
    
    // 페이지별 설정
    pages: {
        'index.html': {
            title: 'YPP - 안전하고 지속가능한 에너지의 미래를 여는 기업',
            description: 'YPP - 1982년부터 40년간 전력계통 분야를 선도해온 에너지 전문기업'
        },
        'about.html': {
            title: '회사소개 - YPP',
            description: 'YPP 회사소개 - 기업개요, 연혁, 조직도, 오시는 길'
        },
        'system.html': {
            title: '시스템공급 - YPP',
            description: 'YPP 시스템공급 - 전력계통 보호시스템, 보호계전기 통합시스템'
        },
        'solution.html': {
            title: '솔루션개발 - YPP',
            description: 'YPP 솔루션개발 - 스마트그리드 기술, IoT 기반 모니터링'
        },
        'engineering.html': {
            title: '엔지니어링 - YPP',
            description: 'YPP 엔지니어링 서비스 - 설계, 시공, 시운전, 유지보수'
        },
        'esg.html': {
            title: 'ESG경영 - YPP',
            description: 'YPP ESG경영 - 환경, 사회, 지배구조 경영'
        }
    }
};

// ===== 경로 분석 함수 =====
function getBasePath() {
    const currentPath = window.location.pathname;
    const isSubPage = currentPath.includes('/pages/');
    
    if (isSubPage) {
        const depth = (currentPath.match(/\//g) || []).length;
        return depth === 3 ? '../../' : '../';
    }
    return './';
}

function getCurrentPageName() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop() || 'index.html';
    return fileName;
}

// ===== 메타태그 동적 삽입 =====
function insertMetaTags() {
    const head = document.head;
    const currentPage = getCurrentPageName();
    const pageConfig = META_CONFIG.pages[currentPage] || META_CONFIG.pages['index.html'];
    
    // Keywords 메타태그
    const keywordsTag = document.createElement('meta');
    keywordsTag.name = 'keywords';
    keywordsTag.content = META_CONFIG.keywords;
    head.appendChild(keywordsTag);
    
    // Description 업데이트 (기존 태그가 있으면 업데이트)
    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
        descriptionTag = document.createElement('meta');
        descriptionTag.name = 'description';
        head.appendChild(descriptionTag);
    }
    descriptionTag.content = pageConfig.description;
    
    // Title 업데이트
    document.title = pageConfig.title;
    
    console.log(`✅ Meta tags updated for: ${currentPage}`);
}

// ===== 파비콘 동적 삽입 =====
function insertFavicons() {
    const head = document.head;
    const basePath = getBasePath();
    const faviconPath = basePath + 'assets/images/favicon/';
    
    // 기존 파비콘 제거 (중복 방지)
    const existingFavicons = head.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(link => link.remove());
    
    // 파비콘 설정 배열
    const faviconConfigs = [
        { rel: 'shortcut icon', href: 'favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '57x57', href: 'apple-icon-57x57.png' },
        { rel: 'apple-touch-icon', sizes: '60x60', href: 'apple-icon-60x60.png' },
        { rel: 'apple-touch-icon', sizes: '72x72', href: 'apple-icon-72x72.png' },
        { rel: 'apple-touch-icon', sizes: '76x76', href: 'apple-icon-76x76.png' },
        { rel: 'apple-touch-icon', sizes: '114x114', href: 'apple-icon-114x114.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: 'apple-icon-120x120.png' },
        { rel: 'apple-touch-icon', sizes: '144x144', href: 'apple-icon-144x144.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: 'apple-icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: 'apple-icon-180x180.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: 'android-icon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: 'favicon-96x96.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'favicon-16x16.png' }
    ];
    
    // 파비콘 링크 생성 및 삽입
    faviconConfigs.forEach(config => {
        const link = document.createElement('link');
        link.rel = config.rel;
        link.href = faviconPath + config.href;
        
        if (config.sizes) link.sizes = config.sizes;
        if (config.type) link.type = config.type;
        
        head.appendChild(link);
    });
    
    console.log(`✅ Favicons inserted with base path: ${faviconPath}`);
}

// ===== SEO 메타태그 추가 =====
function insertSEOTags() {
    const head = document.head;
    const currentPage = getCurrentPageName();
    const pageConfig = META_CONFIG.pages[currentPage] || META_CONFIG.pages['index.html'];
    
    // Open Graph 태그들
    const ogTags = [
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: pageConfig.title },
        { property: 'og:description', content: pageConfig.description },
        { property: 'og:site_name', content: 'YPP Corporation' },
        { property: 'og:locale', content: 'ko_KR' }
    ];
    
    // Twitter Card 태그들
    const twitterTags = [
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageConfig.title },
        { name: 'twitter:description', content: pageConfig.description }
    ];
    
    // 기본 SEO 태그들
    const basicTags = [
        { name: 'robots', content: 'index, follow' },
        { name: 'author', content: 'YPP Corporation' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
    ];
    
    // 모든 태그 삽입
    [...ogTags, ...twitterTags, ...basicTags].forEach(tagConfig => {
        // 기존 태그 확인
        const selector = tagConfig.property ? 
            `meta[property="${tagConfig.property}"]` : 
            `meta[name="${tagConfig.name}"]`;
        
        let tag = document.querySelector(selector);
        if (!tag) {
            tag = document.createElement('meta');
            if (tagConfig.property) tag.setAttribute('property', tagConfig.property);
            if (tagConfig.name) tag.setAttribute('name', tagConfig.name);
            head.appendChild(tag);
        }
        tag.content = tagConfig.content;
    });
    
    console.log(`✅ SEO tags inserted for: ${currentPage}`);
}

// ===== 초기화 함수 =====
function initializeMetaSystem() {
    insertMetaTags();
    insertFavicons();
    insertSEOTags();
    
    console.log('🎯 Meta system initialized successfully');
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연을 두어 다른 스크립트들과 충돌 방지
    setTimeout(initializeMetaSystem, 100);
});

// ===== 전역 함수로 내보내기 =====
window.initializeMetaSystem = initializeMetaSystem;