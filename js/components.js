// components.js - 헤더, 푸터, 사이드바 HTML 불러오기 (통합 최적화 버전)

// ===== 환경별 경로 설정 초기화 =====
function initPathConfig() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    // 환경 감지
    const isGitHubPages = hostname.includes('github.io');
    const isProduction = hostname.includes('ypp.co.kr');
    const isLocal = hostname.includes('127.0.0.1') || hostname.includes('localhost');
    
    // GitHub Pages용 기본 경로 설정
    let basePath = '';
    if (isGitHubPages) {
        basePath = '/ypp';
    }
    
    // 전역 경로 설정 객체
    window.YPP_CONFIG = {
        environment: isGitHubPages ? 'github' : (isProduction ? 'production' : 'local'),
        basePath: basePath,
        isGitHubPages: isGitHubPages,
        isProduction: isProduction,
        isLocal: isLocal
    };
    
    console.log('YPP_CONFIG 초기화:', window.YPP_CONFIG);
}

// ===== 상대 경로 계산 함수 (더 이상 사용하지 않음 - 제거 예정) =====
// 절대 경로 기반으로 전환하여 더 이상 필요 없음

// ===== 절대 경로 생성 함수 =====
function getAbsolutePath(relativePath) {
    if (!window.YPP_CONFIG) return relativePath;
    
    const { basePath, isGitHubPages } = window.YPP_CONFIG;
    
    // 이미 절대 경로인 경우
    if (relativePath.startsWith('http') || relativePath.startsWith('//')) {
        return relativePath;
    }
    
    // 상대 경로 처리
    if (relativePath.startsWith('./')) {
        return basePath + relativePath.substring(1);
    } else if (relativePath.startsWith('/')) {
        return basePath + relativePath;
    } else {
        return basePath + '/' + relativePath;
    }
}

// ===== 절대 경로 기반 컴포넌트 로딩 함수 =====
async function loadComponent(componentName, containerId) {
    try {
        const { basePath } = window.YPP_CONFIG;
        const componentPath = `${basePath}/components/${componentName}.html`;
        
        console.log(`Loading component: ${componentPath}`);
        
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to load ${componentName}: ${response.status}`);
        }
        
        const html = await response.text();
        const container = document.getElementById(containerId);
        
        if (container) {
            container.innerHTML = html;
            
            // 컴포넌트 내부 경로 수정
            fixComponentPaths(container);
            
            console.log(`${componentName} loaded successfully`);
        }
    } catch (error) {
        console.error(`Error loading ${componentName}:`, error);
    }
}

// ===== 컴포넌트 내부 경로 수정 함수 =====
function fixComponentPaths(container) {
    if (!window.YPP_CONFIG) return;
    
    const { basePath, isGitHubPages } = window.YPP_CONFIG;
    
    // 이미지 경로 수정
    const images = container.querySelectorAll('img');
    images.forEach(img => {
        const currentSrc = img.getAttribute('src');
        if (currentSrc) {
            // 상대 경로인 경우만 수정
            if (currentSrc.startsWith('./')) {
                img.setAttribute('src', basePath + currentSrc.substring(1));
            } else if (currentSrc.startsWith('/') && isGitHubPages && !currentSrc.startsWith('http')) {
                img.setAttribute('src', basePath + currentSrc);
            }
        }
    });
    
    // 링크 경로 수정
    const links = container.querySelectorAll('a[href]');
    links.forEach(link => {
        const currentHref = link.getAttribute('href');
        if (currentHref) {
            // 내부 링크만 수정 (외부 링크 제외)
            if (currentHref.startsWith('/') && isGitHubPages && !currentHref.startsWith('http')) {
                link.setAttribute('href', basePath + currentHref);
            }
        }
    });
    
    // CSS 배경 이미지 경로 수정 (인라인 스타일)
    const elementsWithBg = container.querySelectorAll('[style*="background"]');
    elementsWithBg.forEach(element => {
        const style = element.getAttribute('style');
        if (style && style.includes('url(')) {
            const updatedStyle = style.replace(/url\(['"]?\.\/([^'")\s]+)['"]?\)/g, `url('${basePath}/$1')`);
            if (isGitHubPages) {
                const finalStyle = updatedStyle.replace(/url\(['"]?\/([^'")\s]+)['"]?\)/g, `url('${basePath}/$1')`);
                element.setAttribute('style', finalStyle);
            } else {
                element.setAttribute('style', updatedStyle);
            }
        }
    });
}

// ===== 로고 링크 제어 함수 =====
function updateLogoLink() {
    // 컴포넌트가 로드된 후 실행되도록 지연
    setTimeout(() => {
        const logoLink = document.getElementById('logo-link');
        if (!logoLink) return;
        
        const currentUrl = window.location.href;
        const { basePath, isGitHubPages } = window.YPP_CONFIG;
        
        // 홈페이지 URL 확인
        const homeUrls = [
            'https://jwbaek96.github.io/ypp/',
            'https://ypp.co.kr/',
            'http://127.0.0.1:5500/',
            'http://localhost:5500/'
        ];
        
        const isHomePage = homeUrls.some(url => currentUrl.startsWith(url)) && 
                          (currentUrl.endsWith('/') || currentUrl.endsWith('/index.html'));
        
        if (isHomePage) {
            logoLink.href = '';
            logoLink.style.cursor = 'default';
            logoLink.onclick = function(e) { e.preventDefault(); };
        } else {
            // 홈페이지로 이동하는 링크 설정
            if (isGitHubPages) {
                logoLink.href = basePath + '/';
            } else {
                logoLink.href = '/';
            }
        }
    }, 100);
}

// ===== 모든 컴포넌트 로딩 =====
async function loadAllComponents() {
    try {
        console.log('Loading all components...');
        
        // 헤더, 푸터, 사이드바 동시 로딩
        await Promise.all([
            loadComponent('header', 'header-container'),
            loadComponent('footer', 'footer-container'),
            loadComponent('sidebar', 'sidebar-container'),
            loadComponent('scrolltotop', 'scrolltotop-container')
        ]);
        
        // 로고 링크 제어
        updateLogoLink();
        
        // 컴포넌트 로딩 완료 이벤트 발생
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
        console.log('All components loaded successfully');
        
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// ===== 전역 헬퍼 함수들 =====
window.getPath = function(relativePath) {
    return getAbsolutePath(relativePath);
};

window.getImagePath = function(imagePath) {
    return getAbsolutePath('/assets/images/' + imagePath);
};

window.getCSSPath = function(cssPath) {
    return getAbsolutePath('/css/' + cssPath);
};

window.getJSPath = function(jsPath) {
    return getAbsolutePath('/js/' + jsPath);
};

// ===== 초기화 및 자동 실행 =====
// 페이지 로드 즉시 환경 설정 초기화
initPathConfig();

// DOM 로드 완료 후 컴포넌트 로딩
document.addEventListener('DOMContentLoaded', function() {
    loadAllComponents();
});

// ===== 전역 함수 내보내기 =====
window.loadAllComponents = loadAllComponents;
window.YPP_CONFIG = window.YPP_CONFIG;