// components.js - 헤더, 푸터, 사이드바 HTML 불러오기

// components.js - 헤더, 푸터, 사이드바 HTML 불러오기

// components.js - 헤더, 푸터, 사이드바 HTML 불러오기

// ===== 경로 계산 함수 (GitHub Pages 대응) =====
function getBasePath() {
    const currentPath = window.location.pathname;
    
    // GitHub Pages 저장소명 감지
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    
    // 개인 도메인인 경우 (ypp.co.kr)
    if (window.location.hostname !== 'jwbaek96.github.io') {
        // 루트 경로인 경우
        if (pathSegments.length === 0 || pathSegments[pathSegments.length - 1] === 'index.html') {
            return './';
        }
        
        // 하위 페이지인 경우
        const depth = pathSegments.length;
        if (pathSegments[pathSegments.length - 1].includes('.html')) {
            return '../'.repeat(depth - 1) || './';
        }
        return '../'.repeat(depth) || './';
    }
    
    // GitHub Pages인 경우 (username.github.io/repository-name)
    // 첫 번째 세그먼트가 저장소명
    if (pathSegments.length <= 1 || 
        (pathSegments.length === 2 && pathSegments[1] === 'index.html')) {
        return './';
    }
    
    // pages/about.html -> ../
    if (pathSegments.length === 3) {
        return '../';
    }
    
    // pages/company/about.html -> ../../
    if (pathSegments.length === 4) {
        return '../../';
    }
    
    return './';
}

// ===== 컴포넌트 로딩 함수 =====
async function loadComponent(componentName, containerId) {
    try {
        const basePath = getBasePath();
        const componentPath = `${basePath}components/${componentName}.html`;
        
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
        }
    } catch (error) {
        // 에러 무시 (콘솔 로그 제거)
    }
}

// ===== 이미지 경로 수정 함수 =====
function fixImagePaths(container, basePath) {
    // 모든 img 태그 찾기
    const images = container.querySelectorAll('img');
    
    images.forEach(img => {
        const currentSrc = img.getAttribute('src');
        
        // 상대 경로인 경우에만 수정 (http:// 또는 https://로 시작하지 않는 경우)
        if (currentSrc && !currentSrc.startsWith('http') && !currentSrc.startsWith('//')) {
            // ./ 로 시작하는 경우 제거
            const cleanSrc = currentSrc.replace(/^\.\//, '');
            // basePath 적용
            img.setAttribute('src', basePath + cleanSrc);
        }
    });
}

// ===== 모든 컴포넌트 로딩 =====
async function loadAllComponents() {
    try {
        // 헤더, 푸터, 사이드바 동시 로딩
        await Promise.all([
            loadComponent('header', 'header-container'),
            loadComponent('footer', 'footer-container'),
            loadComponent('sidebar', 'sidebar-container')
        ]);
        
        // 컴포넌트 로딩 완료 이벤트 발생
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
        
    } catch (error) {
        // 에러 무시 (콘솔 로그 제거)
    }
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', function() {
    loadAllComponents();
});

// ===== 전역 함수 내보내기 =====
window.loadAllComponents = loadAllComponents;