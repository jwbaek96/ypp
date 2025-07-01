// header-menu.js - 데스크톱 네비게이션 메뉴 생성 (절대 경로 버전)

// ===== 메뉴 데이터 로딩 =====
let menuData = null;

async function loadMenuData() {
    try {
        // YPP_CONFIG에서 경로 정보 가져오기
        if (!window.YPP_CONFIG) {
            console.warn('YPP_CONFIG not found, using fallback path');
            return null;
        }
        
        const { basePath } = window.YPP_CONFIG;
        const menuPath = `${basePath}/json/menu-data.json`;
        
        console.log(`Loading menu data from: ${menuPath}`);
        
        const response = await fetch(menuPath);
        if (!response.ok) {
            throw new Error(`Failed to load menu data: ${response.status}`);
        }
        
        menuData = await response.json();
        console.log('Menu data loaded successfully');
        return menuData;
    } catch (error) {
        console.error('Error loading menu data:', error);
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
    
    // URL 경로 처리 (절대 경로)
    if (item.url && window.YPP_CONFIG) {
        link.href = window.getPath(item.url);
    } else {
        link.href = item.url || '#';
    }
    
    link.textContent = item.title;
    link.className = 'menu-link';
    
    // 현재 페이지 활성 상태 체크
    if (item.url && window.location.pathname.includes(item.url.replace('.html', ''))) {
        li.classList.add('current-page');
        link.setAttribute('aria-current', 'page');
    }
    
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
        
        // 상호작용 이벤트 추가
        addMenuInteraction(li, link, subMenu);
    } else {
        li.appendChild(link);
    }
    
    return li;
}

// ===== 메뉴 상호작용 이벤트 =====
function addMenuInteraction(menuItem, link, subMenu) {
    let hoverTimeout;
    let isKeyboardNavigation = false;
    
    // 마우스 호버 이벤트
    menuItem.addEventListener('mouseenter', () => {
        if (!isKeyboardNavigation) {
            clearTimeout(hoverTimeout);
            showSubmenu(menuItem, link, subMenu);
        }
    });
    
    menuItem.addEventListener('mouseleave', () => {
        if (!isKeyboardNavigation) {
            hoverTimeout = setTimeout(() => {
                hideSubmenu(menuItem, link, subMenu);
            }, 150);
        }
    });
    
    // 키보드 네비게이션
    link.addEventListener('keydown', (e) => {
        isKeyboardNavigation = true;
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                toggleSubmenu(menuItem, link, subMenu);
                break;
            case 'Escape':
                hideSubmenu(menuItem, link, subMenu);
                link.focus();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (!menuItem.classList.contains('active')) {
                    showSubmenu(menuItem, link, subMenu);
                }
                const firstSubmenuLink = subMenu.querySelector('a');
                if (firstSubmenuLink) firstSubmenuLink.focus();
                break;
        }
        
        // 마우스 사용 시 키보드 모드 해제
        setTimeout(() => { isKeyboardNavigation = false; }, 100);
    });
    
    // 서브메뉴 내 키보드 네비게이션
    const submenuLinks = subMenu.querySelectorAll('a');
    submenuLinks.forEach((submenuLink, index) => {
        submenuLink.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    if (index > 0) {
                        submenuLinks[index - 1].focus();
                    } else {
                        link.focus();
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (index < submenuLinks.length - 1) {
                        submenuLinks[index + 1].focus();
                    }
                    break;
                case 'Escape':
                    hideSubmenu(menuItem, link, subMenu);
                    link.focus();
                    break;
            }
        });
    });
}

// ===== 서브메뉴 표시/숨김 함수들 =====
function showSubmenu(menuItem, link, subMenu) {
    menuItem.classList.add('active');
    link.setAttribute('aria-expanded', 'true');
    subMenu.setAttribute('aria-hidden', 'false');
}

function hideSubmenu(menuItem, link, subMenu) {
    menuItem.classList.remove('active');
    link.setAttribute('aria-expanded', 'false');
    subMenu.setAttribute('aria-hidden', 'true');
}

function toggleSubmenu(menuItem, link, subMenu) {
    const isActive = menuItem.classList.contains('active');
    if (isActive) {
        hideSubmenu(menuItem, link, subMenu);
    } else {
        showSubmenu(menuItem, link, subMenu);
    }
}

// ===== 메뉴 삽입 =====
async function insertDesktopMenu() {
    const container = document.getElementById('desktop-nav-container');
    
    if (!container) {
        console.log('Desktop nav container not found');
        return;
    }
    
    // YPP_CONFIG 대기
    let retryCount = 0;
    while (!window.YPP_CONFIG && retryCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
    }
    
    if (!window.YPP_CONFIG) {
        console.warn('YPP_CONFIG not available after waiting');
        return;
    }
    
    // 메뉴 데이터 로딩
    const data = await loadMenuData();
    if (!data || !data.navigation) {
        console.log('Menu data not available');
        return;
    }
    
    // 메뉴 생성 및 삽입
    const menuElement = createDesktopMenu(data.navigation);
    container.innerHTML = '';
    container.appendChild(menuElement);
    
    // 외부 클릭 시 모든 서브메뉴 닫기
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.desktop-nav')) {
            const activeMenus = document.querySelectorAll('.menu-item.active');
            activeMenus.forEach(menu => {
                const link = menu.querySelector('.menu-link');
                const subMenu = menu.querySelector('.sub-menu');
                if (link && subMenu) {
                    hideSubmenu(menu, link, subMenu);
                }
            });
        }
    });
    
    console.log('Desktop menu inserted successfully');
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
window.insertDesktopMenu = insertDesktopMenu;