// components.js - 헤더, 푸터, 사이드바 HTML 불러오기

// ===== 컴포넌트 로딩 함수 =====
async function loadComponent(componentName, containerId) {
    try {
        const response = await fetch(`./components/${componentName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load ${componentName}: ${response.status}`);
        }
        
        const html = await response.text();
        const container = document.getElementById(containerId);
        
        if (container) {
            container.innerHTML = html;
            console.log(`✅ ${componentName} loaded successfully`);
        } else {
            console.warn(`⚠️ Container #${containerId} not found for ${componentName}`);
        }
    } catch (error) {
        console.error(`❌ Error loading ${componentName}:`, error);
    }
}

// ===== 모든 컴포넌트 로딩 =====
async function loadAllComponents() {
    console.log('🔄 Loading components...');
    
    try {
        // 헤더, 푸터, 사이드바 동시 로딩
        await Promise.all([
            loadComponent('header', 'header-container'),
            loadComponent('footer', 'footer-container'),
            loadComponent('sidebar', 'sidebar-container')
        ]);
        
        console.log('🎉 All components loaded successfully');
        
        // 컴포넌트 로딩 완료 이벤트 발생
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
        
    } catch (error) {
        console.error('❌ Error loading components:', error);
    }
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', function() {
    loadAllComponents();
});

// ===== 전역 함수 내보내기 =====
window.loadAllComponents = loadAllComponents;