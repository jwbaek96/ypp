// components.js - 헤더, 푸터, 사이드바 HTML 불러오기

// components.js - 헤더, 푸터, 사이드바 HTML 불러오기

// ===== 경로 계산 함수 =====
function getBasePath() {
    const currentPath = window.location.pathname;
    
    // 루트 경로인 경우 (index.html)
    if (currentPath === '/' || currentPath.endsWith('/index.html') || currentPath.split('/').length <= 2) {
        return './';
    }
    
    // 하위 페이지인 경우 (pages/company/about.html 등)
    const depth = (currentPath.match(/\//g) || []).length;
    
    if (depth >= 3) {
        return '../../';  // pages/company/about.html
    } else if (depth === 2) {
        return '../';     // pages/about.html
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
        }
    } catch (error) {
        // 에러 무시 (콘솔 로그 제거)
    }
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