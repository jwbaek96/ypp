// components.js - 헤더, 푸터, 사이드바 HTML 불러오기 (GitHub Pages 수정)

// ===== 경로 계산 함수 (GitHub Pages ypp 저장소 대응) =====
function getBasePath() {
    const currentPath = window.location.pathname;
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    
    // GitHub Pages 저장소명 확인
    const isGitHubPages = window.location.hostname.includes('github.io');
    
    if (isGitHubPages && pathSegments[0] === 'ypp') {
        // GitHub Pages: jwbaek96.github.io/ypp/
        if (pathSegments.length === 1) {
            // /ypp/ (루트)
            return './';
        } else if (pathSegments.length === 2) {
            // /ypp/pages/ 폴더
            return '../';
        } else if (pathSegments.length === 3) {
            // /ypp/pages/company/ 폴더
            return '../../';
        } else if (pathSegments.length === 4) {
            // /ypp/pages/company/about.html
            return '../../';
        } else if (pathSegments.length === 5) {
            // /ypp/pages/media/gallery/archive.html
            return '../../../';
        }
    } else {
        // 로컬 개발 환경 또는 일반 도메인
        if (pathSegments.length === 0 || pathSegments[pathSegments.length - 1] === 'index.html') {
            return './';
        } else if (pathSegments.length === 1) {
            return '../';
        } else if (pathSegments.length === 2) {
            return '../../';
        } else if (pathSegments.length === 3) {
            return '../../../';
        }
    }
    
    return './';
}

// ===== 컴포넌트 로딩 함수 =====
async function loadComponent(componentName, containerId) {
    try {
        const basePath = getBasePath();
        const componentPath = `${basePath}components/${componentName}.html`;
        
        console.log(`Loading component: ${componentPath}`); // 디버깅용
        
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Failed to load ${componentName}: ${response.status}`);
        }
        
        const html = await response.text();
        const container = document.getElementById(containerId);
        
        if (container) {
            container.innerHTML = html;
            
            // 이미지 경로 수정
            fixImagePaths(container, basePath);
            
            console.log(`${componentName} loaded successfully`); // 디버깅용
        }
    } catch (error) {
        console.error(`Error loading ${componentName}:`, error); // 디버깅용
    }
}

// ===== 이미지 경로 수정 함수 =====
function fixImagePaths(container, basePath) {
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
        const currentSrc = img.getAttribute('src');
        
        if (currentSrc && !currentSrc.startsWith('http') && !currentSrc.startsWith('//')) {
            const cleanSrc = currentSrc.replace(/^\.\//, '');
            img.setAttribute('src', basePath + cleanSrc);
        }
    });
}

// ===== 모든 컴포넌트 로딩 =====
async function loadAllComponents() {
    try {
        console.log('Loading all components...'); // 디버깅용
        
        // 헤더, 푸터, 사이드바 동시 로딩
        await Promise.all([
            loadComponent('header', 'header-container'),
            loadComponent('footer', 'footer-container'),
            loadComponent('sidebar', 'sidebar-container'),
            loadComponent('scrolltotop', 'scrolltotop-container')
        ]);
        
        // 컴포넌트 로딩 완료 이벤트 발생
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
        console.log('All components loaded successfully'); // 디버깅용
        
    } catch (error) {
        console.error('Error loading components:', error); // 디버깅용
    }
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', function() {
    loadAllComponents();
});

// ===== 전역 함수 내보내기 =====
window.loadAllComponents = loadAllComponents;

// 현재 URL 확인하여 로고 링크 제어
function updateLogoLink() {
    const currentUrl = window.location.href;
    const targetUrl = 'https://jwbaek96.github.io/ypp/';
    const logoLink = document.getElementById('logo-link');
    
    if (currentUrl === targetUrl) {
        logoLink.href = '';
        logoLink.style.cursor = 'default';
    }
}

// DOM 로드 완료 후 실행
document.addEventListener('DOMContentLoaded', updateLogoLink);