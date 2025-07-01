// sidebar.js - 모바일 사이드바 메뉴 생성 (절대 경로 버전)

// ===== 메뉴 데이터 로딩 =====
let sidebarMenuData = null;

async function loadSidebarMenuData() {
    try {
        // YPP_CONFIG에서 경로 정보 가져오기
        if (!window.YPP_CONFIG) {
            console.warn('YPP_CONFIG not found for sidebar');
            return null;
        }
        
        const { basePath } = window.YPP_CONFIG;
        const menuPath = `${basePath}/json/menu-data.json`;
        
        console.log(`Loading sidebar menu data from: ${menuPath}`);
        
        const response = await fetch(menuPath);
        if (!response.ok) {
            throw new Error(`Failed to load menu data: ${response.status}`);
        }
        
        sidebarMenuData = await response.json();
        console.log('Sidebar menu data loaded successfully');
        return sidebarMenuData;
    } catch (error) {
        console.error('Error loading sidebar menu data:', error);
        return null;
    }
}

// ===== 사이드바 메뉴 HTML 생성 =====
function createSidebarMenu(navigation) {
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', '모바일 네비게이션');
    
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
    li.className = `sidebar-item depth-${depth}`;
    
    // 메인 링크 생성
    const link = document.createElement('a');
    
    // URL 경로 처리 (절대 경로)
    if (item.url && window.YPP_CONFIG) {
        link.href = window.getPath(item.url);
    } else {
        link.href = item.url || '#';
    }
    
    link.textContent = item.title;
    link.className = 'sidebar-link';
    
    // 현재 페이지 활성 상태 체크
    if (item.url && window.location.pathname.includes(item.url.replace('.html', ''))) {
        li.classList.add('current-page');
        link.setAttribute('aria-current', 'page');
    }
    
    // 하위 메뉴가 있는 경우
    if (item.children && Object.keys(item.children).length > 0) {
        li.classList.add('has-submenu');
        
        // 토글 아이콘 추가
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        toggleIcon.innerHTML = '›';
        toggleIcon.setAttribute('aria-hidden', 'true');
        link.appendChild(toggleIcon);
        
        // 클릭 이벤트로 서브메뉴 토글
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebarSubmenu(li);
        });
        
        // 접근성을 위한 속성
        link.setAttribute('aria-expanded', 'false');
        link.setAttribute('aria-haspopup', 'true');
        
        // 서브메뉴 생성
        const subMenu = document.createElement('ul');
        subMenu.className = 'sidebar-submenu';
        subMenu.setAttribute('aria-hidden', 'true');
        
        Object.keys(item.children).forEach(childKey => {
            const childItem = item.children[childKey];
            const childLi = createSidebarSubMenuItem(childItem, childKey, depth + 1);
            subMenu.appendChild(childLi);
        });
        
        li.appendChild(link);
        li.appendChild(subMenu);
    } else {
        // 링크 클릭 시 사이드바 닫기
        link.addEventListener('click', (e) => {
            if (item.url && item.url !== '#') {
                closeSidebarAfterDelay();
            }
        });
        
        li.appendChild(link);
    }
    
    return li;
}

// ===== 서브메뉴 아이템 생성 =====
function createSidebarSubMenuItem(item, key, depth) {
    const li = document.createElement('li');
    li.className = `sidebar-subitem depth-${depth}`;
    
    const link = document.createElement('a');
    
    // URL 경로 처리 (절대 경로)
    if (item.url && window.YPP_CONFIG) {
        link.href = window.getPath(item.url);
    } else {
        link.href = item.url || '#';
    }
    
    link.textContent = item.title;
    link.className = 'sidebar-sublink';
    
    // 현재 페이지 체크
    if (item.url && window.location.pathname.includes(item.url.replace('.html', ''))) {
        li.classList.add('current-page');
        link.setAttribute('aria-current', 'page');
    }
    
    // 3단계 메뉴가 있는 경우
    if (item.children && Object.keys(item.children).length > 0) {
        li.classList.add('has-sub-submenu');
        
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        toggleIcon.innerHTML = '›';
        link.appendChild(toggleIcon);
        
        // 클릭 시 서브서브메뉴 토글
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebarSubSubmenu(li);
        });
        
        link.setAttribute('aria-expanded', 'false');
        link.setAttribute('aria-haspopup', 'true');
        
        // 3단계 서브메뉴 생성
        const subSubMenu = document.createElement('ul');
        subSubMenu.className = 'sidebar-sub-submenu';
        subSubMenu.setAttribute('aria-hidden', 'true');
        
        Object.keys(item.children).forEach(subChildKey => {
            const subChildItem = item.children[subChildKey];
            const subChildLi = document.createElement('li');
            subChildLi.className = 'sidebar-sub-subitem';
            
            const subChildLink = document.createElement('a');
            
            // URL 경로 처리 (절대 경로)
            if (subChildItem.url && window.YPP_CONFIG) {
                subChildLink.href = window.getPath(subChildItem.url);
            } else {
                subChildLink.href = subChildItem.url || '#';
            }
            
            subChildLink.textContent = subChildItem.title;
            subChildLink.className = 'sidebar-sub-sublink';
            
            // 현재 페이지 체크
            if (subChildItem.url && window.location.pathname.includes(subChildItem.url.replace('.html', ''))) {
                subChildLi.classList.add('current-page');
                subChildLink.setAttribute('aria-current', 'page');
            }
            
            // 링크 클릭 시 사이드바 닫기
            subChildLink.addEventListener('click', (e) => {
                if (subChildItem.url && subChildItem.url !== '#') {
                    closeSidebarAfterDelay();
                }
            });
            
            subChildLi.appendChild(subChildLink);
            subSubMenu.appendChild(subChildLi);
        });
        
        li.appendChild(link);
        li.appendChild(subSubMenu);
    } else {
        // 링크 클릭 시 사이드바 닫기
        link.addEventListener('click', (e) => {
            if (item.url && item.url !== '#') {
                closeSidebarAfterDelay();
            }
        });
        
        li.appendChild(link);
    }
    
    return li;
}

// ===== 서브메뉴 토글 함수들 =====
function toggleSidebarSubmenu(menuItem) {
    const submenu = menuItem.querySelector('.sidebar-submenu');
    const link = menuItem.querySelector('.sidebar-link');
    const toggleIcon = link.querySelector('.toggle-icon');
    
    if (!submenu) return;
    
    const isOpen = submenu.getAttribute('aria-hidden') === 'false';
    
    // 같은 레벨의 다른 열린 서브메뉴들 닫기
    const siblingItems = menuItem.parentElement.querySelectorAll('.sidebar-item.has-submenu');
    siblingItems.forEach(item => {
        if (item !== menuItem) {
            const siblingSubmenu = item.querySelector('.sidebar-submenu');
            const siblingLink = item.querySelector('.sidebar-link');
            const siblingIcon = siblingLink.querySelector('.toggle-icon');
            
            if (siblingSubmenu) {
                siblingSubmenu.style.maxHeight = '0px';
                siblingSubmenu.setAttribute('aria-hidden', 'true');
                siblingLink.setAttribute('aria-expanded', 'false');
                if (siblingIcon) siblingIcon.style.transform = 'rotate(0deg)';
            }
        }
    });
    
    if (isOpen) {
        // 닫기
        submenu.style.maxHeight = '0px';
        submenu.setAttribute('aria-hidden', 'true');
        link.setAttribute('aria-expanded', 'false');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
    } else {
        // 열기
        submenu.style.maxHeight = submenu.scrollHeight + 'px';
        submenu.setAttribute('aria-hidden', 'false');
        link.setAttribute('aria-expanded', 'true');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(90deg)';
    }
}

function toggleSidebarSubSubmenu(menuItem) {
    const subSubmenu = menuItem.querySelector('.sidebar-sub-submenu');
    const link = menuItem.querySelector('.sidebar-sublink');
    const toggleIcon = link.querySelector('.toggle-icon');
    
    if (!subSubmenu) return;
    
    const isOpen = subSubmenu.getAttribute('aria-hidden') === 'false';
    
    if (isOpen) {
        // 닫기
        subSubmenu.style.maxHeight = '0px';
        subSubmenu.setAttribute('aria-hidden', 'true');
        link.setAttribute('aria-expanded', 'false');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
    } else {
        // 열기
        subSubmenu.style.maxHeight = subSubmenu.scrollHeight + 'px';
        subSubmenu.setAttribute('aria-hidden', 'false');
        link.setAttribute('aria-expanded', 'true');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(90deg)';
    }
}

// ===== 사이드바 닫기 (지연) =====
function closeSidebarAfterDelay() {
    setTimeout(() => {
        if (window.closeSidebar) {
            window.closeSidebar();
        }
    }, 150);
}

// ===== 사이드바 스타일 추가 =====
function addSidebarMenuStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .sidebar-nav {
            padding: 0.5rem 0;
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
            justify-content: space-between;
            padding: 1rem 1.5rem;
            color: var(--text-primary, #333);
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            text-decoration: none;
            cursor: pointer;
            position: relative;
        }
        
        .sidebar-link:hover {
            background-color: var(--very-light-gray, #f8f9fa);
            color: var(--primary-blue, #0066cc);
        }
        
        .sidebar-item.current-page > .sidebar-link {
            background-color: var(--primary-blue, #0066cc);
            color: white;
        }
        
        .toggle-icon {
            font-size: 1.2rem;
            transition: transform 0.3s ease;
            color: var(--text-secondary, #666);
        }
        
        .sidebar-submenu {
            list-style: none;
            background-color: var(--very-light-gray, #f8f9fa);
            border-left: 3px solid var(--primary-blue, #0066cc);
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            margin: 0;
            padding: 0;
        }
        
        .sidebar-submenu[aria-hidden="false"] {
            max-height: 1000px;
        }
        
        .sidebar-subitem {
            border-bottom: 1px solid var(--border-color, #e5e5e5);
        }
        
        .sidebar-subitem:last-child {
            border-bottom: none;
        }
        
        .sidebar-sublink {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 2.5rem;
            color: var(--text-secondary, #666);
            font-size: 0.9rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .sidebar-sublink:hover {
            color: var(--primary-blue, #0066cc);
            background-color: rgba(0, 102, 204, 0.1);
        }
        
        .sidebar-subitem.current-page > .sidebar-sublink {
            background-color: var(--primary-blue, #0066cc);
            color: white;
        }
        
        .sidebar-sub-submenu {
            list-style: none;
            background-color: var(--border-light, #f0f0f0);
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            margin: 0;
            padding: 0;
        }
        
        .sidebar-sub-submenu[aria-hidden="false"] {
            max-height: 500px;
        }
        
        .sidebar-sub-sublink {
            display: block;
            padding: 0.6rem 3.5rem;
            color: var(--text-secondary, #666);
            font-size: 0.85rem;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .sidebar-sub-sublink:hover {
            color: var(--primary-blue, #0066cc);
            background-color: rgba(0, 102, 204, 0.05);
        }
        
        .sidebar-sub-subitem.current-page > .sidebar-sub-sublink {
            background-color: var(--primary-blue, #0066cc);
            color: white;
        }
        
        @media (max-width: 768px) {
            .sidebar-link {
                padding: 0.875rem 1rem;
                font-size: 0.95rem;
            }
            
            .sidebar-sublink {
                padding: 0.625rem 2rem;
                font-size: 0.85rem;
            }
            
            .sidebar-sub-sublink {
                padding: 0.5rem 3rem;
                font-size: 0.8rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== 사이드바 메뉴 삽입 =====
async function insertSidebarMenu() {
    const container = document.querySelector('#mobile-sidebar #desktop-nav-container');
    
    if (!container) {
        console.log('Sidebar nav container not found');
        return;
    }
    
    // YPP_CONFIG 대기
    let retryCount = 0;
    while (!window.YPP_CONFIG && retryCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
    }
    
    if (!window.YPP_CONFIG) {
        console.warn('YPP_CONFIG not available for sidebar');
        return;
    }
    
    // 메뉴 데이터 로딩
    const data = await loadSidebarMenuData();
    if (!data || !data.navigation) {
        console.log('Sidebar menu data not available');
        return;
    }
    
    // 메뉴 생성 및 삽입
    const menuElement = createSidebarMenu(data.navigation);
    container.innerHTML = '';
    container.appendChild(menuElement);
    
    console.log('Sidebar menu inserted successfully');
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
window.insertSidebarMenu = insertSidebarMenu;