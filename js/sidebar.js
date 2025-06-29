// sidebar.js - 모바일 사이드바 메뉴 생성

// sidebar.js - 모바일 사이드바 메뉴 생성

// ===== 경로 계산 함수 (GitHub Pages 대응) =====
function getBasePath() {
    const currentPath = window.location.pathname;
    
    // GitHub Pages 저장소명 감지
    const pathSegments = currentPath.split('/').filter(segment => segment !== '');
    
    // 개인 도메인인 경우 (ypp.co.kr)
    if (window.location.hostname !== 'username.github.io') {
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

// ===== 메뉴 데이터 로딩 =====
let sidebarMenuData = null;

async function loadSidebarMenuData() {
    try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}json/menu-data.json`);
        if (!response.ok) {
            throw new Error(`Failed to load menu data: ${response.status}`);
        }
        
        sidebarMenuData = await response.json();
        return sidebarMenuData;
    } catch (error) {
        return null;
    }
}

// ===== 사이드바 메뉴 HTML 생성 =====
function createSidebarMenu(navigation) {
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';
    
    const ul = document.createElement('ul');
    ul.className = 'sidebar-menu';
    
    // 각 최상위 메뉴 항목 생성
    Object.keys(navigation).forEach(key => {
        const item = navigation[key];
        const li = createSidebarMenuItem(item, key, 1);
        ul.appendChild(li);
    });
    
    nav.appendChild(ul);
    return nav;
}

// ===== 사이드바 메뉴 아이템 생성 =====
function createSidebarMenuItem(item, key, depth) {
    const li = document.createElement('li');
    li.className = 'sidebar-item';
    
    // 메인 링크 생성
    const link = document.createElement('a');
    link.href = item.url || '#';
    link.textContent = item.title;
    link.className = 'sidebar-link';
    
    // 하위 메뉴가 있는 경우
    if (item.children && Object.keys(item.children).length > 0) {
        li.classList.add('has-submenu');
        
        // 클릭 이벤트로 서브메뉴 토글
        link.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSidebarSubmenu(li);
        });
        
        // 서브메뉴 생성
        const subMenu = document.createElement('ul');
        subMenu.className = 'sidebar-submenu';
        
        Object.keys(item.children).forEach(childKey => {
            const childItem = item.children[childKey];
            const childLi = createSidebarSubMenuItem(childItem, childKey);
            subMenu.appendChild(childLi);
        });
        
        li.appendChild(link);
        li.appendChild(subMenu);
    } else {
        // 링크 클릭 시 사이드바 닫기
        link.addEventListener('click', () => {
            if (window.closeSidebar) {
                window.closeSidebar();
            }
        });
        
        li.appendChild(link);
    }
    
    return li;
}

// ===== 서브메뉴 아이템 생성 =====
function createSidebarSubMenuItem(item, key) {
    const li = document.createElement('li');
    
    const link = document.createElement('a');
    link.href = item.url || '#';
    link.textContent = item.title;
    
    // 3단계 메뉴가 있는 경우
    if (item.children && Object.keys(item.children).length > 0) {
        // 클릭 시 서브서브메뉴 토글
        link.addEventListener('click', (e) => {
            e.preventDefault();
            toggleSidebarSubSubmenu(li);
        });
        
        // 3단계 서브메뉴 생성
        const subSubMenu = document.createElement('ul');
        subSubMenu.className = 'sidebar-sub-submenu';
        
        Object.keys(item.children).forEach(subChildKey => {
            const subChildItem = item.children[subChildKey];
            const subChildLi = document.createElement('li');
            
            const subChildLink = document.createElement('a');
            subChildLink.href = subChildItem.url || '#';
            subChildLink.textContent = subChildItem.title;
            subChildLink.style.paddingLeft = '3.5rem';
            subChildLink.style.fontSize = '0.85rem';
            
            // 링크 클릭 시 사이드바 닫기
            subChildLink.addEventListener('click', () => {
                if (window.closeSidebar) {
                    window.closeSidebar();
                }
            });
            
            subChildLi.appendChild(subChildLink);
            subSubMenu.appendChild(subChildLi);
        });
        
        li.appendChild(link);
        li.appendChild(subSubMenu);
    } else {
        // 링크 클릭 시 사이드바 닫기
        link.addEventListener('click', () => {
            if (window.closeSidebar) {
                window.closeSidebar();
            }
        });
        
        li.appendChild(link);
    }
    
    return li;
}

// ===== 서브메뉴 토글 =====
function toggleSidebarSubmenu(menuItem) {
    const submenu = menuItem.querySelector('.sidebar-submenu');
    if (!submenu) return;
    
    const isOpen = submenu.style.maxHeight && submenu.style.maxHeight !== '0px';
    
    // 다른 열린 서브메뉴들 닫기
    const openSubmenus = document.querySelectorAll('.sidebar-submenu[style*="max-height"]');
    openSubmenus.forEach(menu => {
        if (menu !== submenu) {
            menu.style.maxHeight = '0px';
            menu.style.opacity = '0';
        }
    });
    
    if (isOpen) {
        // 닫기
        submenu.style.maxHeight = '0px';
        submenu.style.opacity = '0';
    } else {
        // 열기
        submenu.style.maxHeight = submenu.scrollHeight + 'px';
        submenu.style.opacity = '1';
    }
}

// ===== 3단계 서브메뉴 토글 =====
function toggleSidebarSubSubmenu(menuItem) {
    const subSubmenu = menuItem.querySelector('.sidebar-submenu:last-child'); // 마지막 서브메뉴 선택
    if (!subSubmenu) return;
    
    const isOpen = subSubmenu.style.maxHeight && subSubmenu.style.maxHeight !== '0px';
    
    if (isOpen) {
        // 닫기
        subSubmenu.style.maxHeight = '0px';
        subSubmenu.style.opacity = '0';
    } else {
        // 열기
        subSubmenu.style.maxHeight = subSubmenu.scrollHeight + 'px';
        subSubmenu.style.opacity = '1';
    }
}

// ===== 사이드바 스타일 추가 =====
function addSidebarMenuStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-nav {
            padding: 1rem 0;
        }
        
        .sidebar-menu {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .sidebar-item {
            border-bottom: 1px solid var(--border-color, #e5e5e5);
        }
        
        .sidebar-link {
            display: flex;
            align-items: center;
            padding: 1rem 1.5rem;
            color: var(--text-primary, #333);
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            text-decoration: none;
            cursor: pointer;
        }
        
        .sidebar-link:hover {
            background-color: var(--very-light-gray, #f8f9fa);
            color: var(--primary-blue, #0066cc);
        }
        
        .sidebar-submenu {
            list-style: none;
            background-color: var(--very-light-gray, #f8f9fa);
            border-left: 3px solid var(--primary-blue, #0066cc);
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: all 0.3s ease;
            margin: 0;
            padding: 0;
        }
        
        .sidebar-submenu li {
            border-bottom: 1px solid var(--border-color, #e5e5e5);
        }
        
        .sidebar-submenu li:last-child {
            border-bottom: none;
        }
        
        .sidebar-submenu a {
            display: block;
            padding: 0.75rem 2.5rem;
            color: var(--text-secondary, #666);
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .sidebar-submenu a:hover {
            color: var(--primary-blue, #0066cc);
            background-color: rgba(0, 102, 204, 0.1);
        }
        
        .sidebar-sub-submenu {
            list-style: none;
            background-color: var(--border-light, #f0f0f0);
            max-height: 0;
            opacity: 0;
            overflow: hidden;
            transition: all 0.3s ease;
            margin: 0;
            padding: 0;
        }
        
        .sidebar-sub-submenu a {
            padding-left: 3.5rem !important;
            font-size: 0.85rem !important;
            color: var(--text-secondary, #666);
        }
        
        .sidebar-sub-submenu a:hover {
            color: var(--primary-blue, #0066cc);
            background-color: rgba(0, 102, 204, 0.05);
        }
    `;
    document.head.appendChild(style);
}

// ===== 사이드바 메뉴 삽입 =====
async function insertSidebarMenu() {
    const container = document.querySelector('#mobile-sidebar #desktop-nav-container');
    
    if (!container) {
        return;
    }
    
    // 메뉴 데이터 로딩
    const data = await loadSidebarMenuData();
    if (!data || !data.navigation) {
        return;
    }
    
    // 메뉴 생성 및 삽입
    const menuElement = createSidebarMenu(data.navigation);
    container.innerHTML = '';
    container.appendChild(menuElement);
}

// ===== 언어 버튼 이벤트 =====
function initLanguageButtons() {
    const langButtons = document.querySelectorAll('.sidebar-lang-btn');
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // 모든 버튼에서 active 제거
            langButtons.forEach(b => b.classList.remove('active'));
            // 클릭된 버튼에 active 추가
            btn.classList.add('active');
        });
    });
}

// ===== 초기화 함수 =====
function initSidebar() {
    // 스타일 추가
    addSidebarMenuStyles();
    
    // 컴포넌트 로딩 완료 후 실행
    if (document.querySelector('#mobile-sidebar')) {
        insertSidebarMenu();
        initLanguageButtons();
    } else {
        // 컴포넌트 로딩 대기
        document.addEventListener('componentsLoaded', () => {
            setTimeout(() => {
                insertSidebarMenu();
                initLanguageButtons();
            }, 200);
        });
    }
}

// ===== 자동 실행 =====
document.addEventListener('DOMContentLoaded', function() {
    initSidebar();
});

// ===== 전역 함수 내보내기 =====
window.initSidebar = initSidebar;