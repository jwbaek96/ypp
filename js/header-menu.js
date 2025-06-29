// header-menu.js - 데스크톱 네비게이션 메뉴 생성

// ===== 메뉴 데이터 로딩 =====
let menuData = null;

async function loadMenuData() {
    try {
        const response = await fetch('./json/menu-data.json');
        if (!response.ok) {
            throw new Error(`Failed to load menu data: ${response.status}`);
        }
        
        menuData = await response.json();
        console.log('✅ Menu data loaded successfully');
        return menuData;
    } catch (error) {
        console.error('❌ Error loading menu data:', error);
        return null;
    }
}

// ===== 메뉴 HTML 생성 =====
function createDesktopMenu(navigation) {
    const nav = document.createElement('nav');
    nav.className = 'desktop-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', '주요 네비게이션');
    
    const ul = document.createElement('ul');
    ul.className = 'main-menu';
    
    // 각 최상위 메뉴 항목 생성
    Object.keys(navigation).forEach(key => {
        const item = navigation[key];
        const li = createMenuItem(item, key, 1);
        ul.appendChild(li);
    });
    
    nav.appendChild(ul);
    return nav;
}

// ===== 메뉴 아이템 생성 (재귀적) =====
function createMenuItem(item, key, depth) {
    const li = document.createElement('li');
    li.className = `menu-item depth-${depth}`;
    
    // 메인 링크 생성
    const link = document.createElement('a');
    link.href = item.url || '#';
    link.textContent = item.title;
    link.className = 'menu-link';
    
    // 하위 메뉴가 있는 경우
    if (item.children && Object.keys(item.children).length > 0) {
        li.classList.add('has-children');
        link.setAttribute('aria-haspopup', 'true');
        link.setAttribute('aria-expanded', 'false');
        
        // 서브메뉴 생성
        const subMenu = document.createElement('ul');
        subMenu.className = `sub-menu depth-${depth + 1}`;
        subMenu.setAttribute('aria-hidden', 'true');
        
        Object.keys(item.children).forEach(childKey => {
            const childItem = item.children[childKey];
            const childLi = createMenuItem(childItem, childKey, depth + 1);
            subMenu.appendChild(childLi);
        });
        
        li.appendChild(link);
        li.appendChild(subMenu);
        
        // 호버 이벤트 추가
        addHoverEvents(li, link, subMenu);
    } else {
        li.appendChild(link);
    }
    
    return li;
}

// ===== 호버 이벤트 추가 =====
function addHoverEvents(menuItem, link, subMenu) {
    let hoverTimeout;
    
    // 마우스 엔터
    menuItem.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        menuItem.classList.add('active');
        link.setAttribute('aria-expanded', 'true');
        subMenu.setAttribute('aria-hidden', 'false');
    });
    
    // 마우스 리브
    menuItem.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            menuItem.classList.remove('active');
            link.setAttribute('aria-expanded', 'false');
            subMenu.setAttribute('aria-hidden', 'true');
        }, 150);
    });
    
    // 키보드 네비게이션
    link.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const isExpanded = link.getAttribute('aria-expanded') === 'true';
            link.setAttribute('aria-expanded', !isExpanded);
            subMenu.setAttribute('aria-hidden', isExpanded);
            menuItem.classList.toggle('active');
        }
    });
}

// ===== 메뉴 삽입 =====
async function insertDesktopMenu() {
    const container = document.getElementById('desktop-nav-container');
    
    if (!container) {
        console.warn('⚠️ Desktop nav container not found');
        return;
    }
    
    // 메뉴 데이터 로딩
    const data = await loadMenuData();
    if (!data || !data.navigation) {
        console.error('❌ Failed to load navigation data');
        return;
    }
    
    // 메뉴 생성 및 삽입
    const menuElement = createDesktopMenu(data.navigation);
    container.innerHTML = ''; // 기존 내용 제거
    container.appendChild(menuElement);
    
    console.log('🎯 Desktop navigation menu inserted successfully');
}

// ===== 초기화 함수 =====
function initHeaderMenu() {
    // 컴포넌트 로딩 완료 후 실행
    if (document.getElementById('desktop-nav-container')) {
        insertDesktopMenu();
    } else {
        // 컴포넌트 로딩 대기
        document.addEventListener('componentsLoaded', () => {
            setTimeout(insertDesktopMenu, 100);
        });
    }
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', function() {
    initHeaderMenu();
});

// ===== 전역 함수 내보내기 =====
window.initHeaderMenu = initHeaderMenu;