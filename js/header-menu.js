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
        
        // console.log(`Loading menu data from: ${menuPath}`);
        
        const response = await fetch(menuPath);
        if (!response.ok) {
            throw new Error(`Failed to load menu data: ${response.status}`);
        }
        
        menuData = await response.json();
        // console.log('Menu data loaded successfully');
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

// ===== 메뉴 아이템 생성 (재귀적) - 한영 지원 버전 =====
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
    
    // 한영 텍스트 처리
    if (typeof item.title === 'object' && item.title.ko && item.title.en) {
        // JSON에서 title이 객체인 경우
        link.setAttribute('data-kor', item.title.ko);
        link.setAttribute('data-eng', item.title.en);
        // 현재 언어에 맞는 텍스트 설정 (기본값: 한글)
        const currentLang = localStorage.getItem('selectedLanguage') || 'ko';
        link.textContent = currentLang === 'en' ? item.title.en : item.title.ko;
    } else {
        // 기존 방식 호환성 (문자열인 경우)
        link.textContent = item.title || '';
    }
    
    link.className = 'menu-link';
    
    // 현재 페이지 활성 상태 체크
    if (item.url && window.location.pathname.includes(item.url.replace('.html', ''))) {
        li.classList.add('current-page');
    }
    
    // 하위 메뉴가 있는 경우
    if (item.children && Object.keys(item.children).length > 0) {
        li.classList.add('has-children');
        
        // 서브메뉴 생성
        const subMenu = document.createElement('ul');
        subMenu.className = `sub-menu depth-${depth + 1}`;
        
        Object.keys(item.children).forEach(childKey => {
            const childItem = item.children[childKey];
            const childLi = createMenuItem(childItem, childKey, depth + 1);
            subMenu.appendChild(childLi);
        });
        
        li.appendChild(link);
        li.appendChild(subMenu);
        
        // console.log('서브메뉴 생성됨:', item.title); // 디버깅용
    } else {
        li.appendChild(link);
    }
    
    return li;
}

// ===== 메뉴 삽입 후 언어 적용 =====
async function insertDesktopMenu() {
    const container = document.getElementById('desktop-nav-container');
    
    // if (!container) {
    //     console.log('Desktop nav container not found');
    //     return;
    // }
    
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
    // if (!data || !data.navigation) {
    //     console.log('Menu data not available');
    //     return;
    // }
    
    // console.log('메뉴 데이터:', data.navigation); // 디버깅용
    
    // 메뉴 생성 및 삽입
    const menuElement = createDesktopMenu(data.navigation);
    container.innerHTML = '';
    container.appendChild(menuElement);
    
    // 언어 전환 기능이 있으면 즉시 적용
    if (window.languageSwitchInstance) {
        const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
        window.languageSwitchInstance.applyLanguage(savedLang);
    } else {
        // 언어 전환 기능이 아직 로드되지 않은 경우, 저장된 언어로 설정
        const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
        const menuLinks = container.querySelectorAll('[data-kor][data-eng]');
        menuLinks.forEach(link => {
            if (savedLang === 'en') {
                link.textContent = link.getAttribute('data-eng');
            } else {
                link.textContent = link.getAttribute('data-kor');
            }
        });
    }
    
    // 생성된 메뉴 확인
    const hasChildrenItems = container.querySelectorAll('.has-children');
    const subMenus = container.querySelectorAll('.sub-menu');
//     console.log('하위 메뉴가 있는 항목들:', hasChildrenItems.length);
//     console.log('서브메뉴 개수:', subMenus.length);
    
//     console.log('Desktop menu inserted with bilingual support');
// }

// ===== 메뉴 상호작용 이벤트 =====
function addMenuInteraction(menuItem, link, subMenu) {
    let hoverTimeout;
    let isKeyboardNavigation = false;
    
    // 데스크톱 메뉴에서만 작동하도록 체크
    if (!menuItem.closest('.desktop-nav')) {
        return; // 사이드바 메뉴는 제외
    }
    
    // 마우스 호버 이벤트
    menuItem.addEventListener('mouseenter', () => {
        if (!isKeyboardNavigation && window.innerWidth > 768) { // 데스크톱에서만
            clearTimeout(hoverTimeout);
            showSubmenu(menuItem, link, subMenu);
        }
    });
    
    menuItem.addEventListener('mouseleave', () => {
        if (!isKeyboardNavigation && window.innerWidth > 768) { // 데스크톱에서만
            hoverTimeout = setTimeout(() => {
                hideSubmenu(menuItem, link, subMenu);
            }, 150);
        }
    });
    
}

// ===== 서브메뉴 표시/숨김 함수들 =====
function showSubmenu(menuItem, link, subMenu) {
    // console.log('서브메뉴 표시:', menuItem, subMenu); // 디버깅용
    
    menuItem.classList.add('active');
    link.setAttribute('aria-expanded', 'true');
    subMenu.setAttribute('aria-hidden', 'false');
    
    // CSS의 max-height와 overflow 문제 해결
    subMenu.style.maxHeight = '500px';
    subMenu.style.overflow = 'visible';
    subMenu.style.display = 'block';
    subMenu.style.visibility = 'visible';
    subMenu.style.opacity = '1';
}

function hideSubmenu(menuItem, link, subMenu) {
    // console.log('서브메뉴 숨김:', menuItem, subMenu); // 디버깅용
    
    menuItem.classList.remove('active');
    link.setAttribute('aria-expanded', 'false');
    subMenu.setAttribute('aria-hidden', 'true');
    
    // CSS 초기값으로 되돌리기
    subMenu.style.maxHeight = '0px';
    subMenu.style.overflow = 'hidden';
    subMenu.style.display = '';
    subMenu.style.visibility = '';
    subMenu.style.opacity = '0';
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
    // const data = await loadMenuData();
    // if (!data || !data.navigation) {
    //     console.log('Menu data not available');
    //     return;
    // }
    
    // console.log('메뉴 데이터:', data.navigation); // 디버깅용
    
    // 메뉴 생성 및 삽입
    const menuElement = createDesktopMenu(data.navigation);
    container.innerHTML = '';
    container.appendChild(menuElement);
    
    // 생성된 메뉴 확인
    const hasChildrenItems = container.querySelectorAll('.has-children');
    const subMenus = container.querySelectorAll('.sub-menu');
}

// ===== 외부 클릭 핸들러 =====
function handleOutsideClick(e) {
    // 데스크톱에서만 작동 & 사이드바나 그 오버레이 클릭은 제외
    if (window.innerWidth <= 768 || 
        e.target.closest('.sidebar-container') || 
        e.target.closest('.sidebar-overlay') ||
        e.target.closest('.desktop-nav')) {
        return;
    }
    
    const activeMenus = document.querySelectorAll('.desktop-nav .menu-item.active');
    activeMenus.forEach(menu => {
        const link = menu.querySelector('.menu-link');
        const subMenu = menu.querySelector('.sub-menu');
        if (link && subMenu) {
            hideSubmenu(menu, link, subMenu);
        }
    });
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