// YPP Website - Components Loader (수정된 버전)

// ===== COMPONENT LOADER =====
async function loadComponent(elementId, componentPath) {
    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
            console.log(`✅ Component loaded: ${componentPath}`);
        } else {
            console.error(`❌ Element not found: ${elementId}`);
        }
    } catch (error) {
        console.error(`❌ Failed to load component ${componentPath}:`, error);
    }
}

// ===== LOAD ALL COMPONENTS =====
async function loadAllComponents() {
    const components = [
        { id: 'header-container', path: './components/header.html' },
        { id: 'footer-container', path: './components/footer.html' },
        { id: 'mobile-sidebar-container', path: './components/mobile-sidebar.html' }
    ];

    // Load all components in parallel
    const promises = components.map(component => 
        loadComponent(component.id, component.path)
    );

    try {
        await Promise.all(promises);
        console.log('🎉 All components loaded successfully');
        
        // MenuGenerator 초기화 대기
        await initializeMenuGenerator();
        
        // 컴포넌트 이벤트 초기화
        initializeComponentEvents();
        
    } catch (error) {
        console.error('❌ Some components failed to load:', error);
    }
}

// ===== MENU GENERATOR 초기화 =====
async function initializeMenuGenerator() {
    try {
        if (window.menuGenerator) {
            await window.menuGenerator.init();
            console.log('✅ MenuGenerator 초기화 완료');
        } else {
            console.warn('⚠️ MenuGenerator not found, using static menu');
        }
    } catch (error) {
        console.error('❌ MenuGenerator 초기화 실패:', error);
    }
}

// ===== INITIALIZE COMPONENT EVENTS =====
function initializeComponentEvents() {
    // 햄버거 메뉴 초기화
    initializeMobileMenu();
    
    // 언어 전환 버튼
    initializeLanguageSwitch();
    
    // 데스크톱 드롭다운
    initializeDesktopDropdown();
    
    // 3단계 모바일 사이드바
    initializeMobileSidebar3Level();
    
    console.log('🔧 모든 컴포넌트 이벤트 초기화 완료');
}

// ===== 언어 전환 초기화 =====
function initializeLanguageSwitch() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const lang = this.getAttribute('data-lang');
            console.log(`Language switched to: ${lang}`);
        });
    });
}

// ===== 데스크톱 드롭다운 초기화 =====
function initializeDesktopDropdown() {
    document.querySelectorAll('.nav-item').forEach(item => {
        const link = item.querySelector('.nav-link');
        const dropdown = item.querySelector('.dropdown-menu');
        
        if (dropdown && link) {
            let timeout;
            
            item.addEventListener('mouseenter', function() {
                clearTimeout(timeout);
                dropdown.style.opacity = '1';
                dropdown.style.visibility = 'visible';
                dropdown.style.transform = 'translateY(15px) translateX(-50%)';
            });
            
            item.addEventListener('mouseleave', function() {
                timeout = setTimeout(() => {
                    dropdown.style.opacity = '0';
                    dropdown.style.visibility = 'hidden';
                    dropdown.style.transform = 'translateY(-10px) translateX(-50%)';
                }, 150);
            });
        }
    });
}

// ===== 모바일 메뉴 초기화 (햄버거 버튼만) =====
function initializeMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openMobileSidebar);
    }
}

// ===== 3단계 모바일 사이드바 초기화 =====
function initializeMobileSidebar3Level() {
    console.log('🔄 3단계 사이드바 초기화 중...');
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    document.querySelectorAll('[data-toggle="submenu"]').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    // 사이드바 닫기 버튼
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeMobileSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
    
    // 메뉴 토글 이벤트
    document.querySelectorAll('[data-toggle="submenu"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const parentItem = this.closest('.sidebar-item, .sidebar-subitem');
            const submenu = parentItem.querySelector('.sidebar-submenu, .sidebar-sub-submenu');
            
            if (submenu) {
                toggleSubmenu(parentItem, submenu);
            }
        });
    });
    
    // 일반 링크 클릭 시 사이드바 닫기
    document.querySelectorAll('.sidebar-link, .sidebar-sublink, .sidebar-sub-submenu a').forEach(link => {
        link.addEventListener('click', function() {
            const href = this.getAttribute('href');
            
            // 실제 링크인 경우 사이드바 닫기
            if (href && !href.startsWith('#') && !this.hasAttribute('data-toggle')) {
                closeMobileSidebar();
            }
            
            // onclick 속성이 있는 경우 (교육신청 등)
            if (this.hasAttribute('onclick')) {
                closeMobileSidebar();
            }
        });
    });
    
    console.log('✅ 3단계 사이드바 초기화 완료');
}

// ===== 서브메뉴 토글 함수 =====
function toggleSubmenu(parentItem, submenu) {
    const isActive = parentItem.classList.contains('active');
    
    // 같은 레벨의 다른 메뉴들 닫기
    const parentContainer = parentItem.parentElement;
    Array.from(parentContainer.children).forEach(sibling => {
        if (sibling !== parentItem && (sibling.classList.contains('sidebar-item') || sibling.classList.contains('sidebar-subitem'))) {
            sibling.classList.remove('active');
            const siblingSubmenu = sibling.querySelector('.sidebar-submenu, .sidebar-sub-submenu');
            if (siblingSubmenu) {
                siblingSubmenu.classList.remove('active');
            }
            
            // 하위 메뉴들도 모두 닫기
            sibling.querySelectorAll('.sidebar-subitem, .sidebar-sub-submenu').forEach(subItem => {
                subItem.classList.remove('active');
            });
        }
    });
    
    // 현재 아이템 토글
    if (isActive) {
        parentItem.classList.remove('active');
        submenu.classList.remove('active');
        
        // 하위 메뉴들도 모두 닫기
        parentItem.querySelectorAll('.sidebar-subitem, .sidebar-sub-submenu').forEach(subItem => {
            subItem.classList.remove('active');
        });
    } else {
        parentItem.classList.add('active');
        submenu.classList.add('active');
    }
}

// ===== 모바일 사이드바 열기/닫기 =====
function openMobileSidebar() {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    
    if (mobileSidebar && sidebarOverlay) {
        mobileSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 햄버거 버튼 애니메이션
        if (hamburgerBtn) {
            const lines = hamburgerBtn.querySelectorAll('.hamburger-line');
            if (lines.length >= 3) {
                lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                lines[1].style.opacity = '0';
                lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            }
        }
        
        console.log('📱 모바일 사이드바 열림');
    }
}

function closeMobileSidebar() {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    
    if (mobileSidebar && sidebarOverlay) {
        mobileSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // 햄버거 버튼 리셋
        if (hamburgerBtn) {
            const lines = hamburgerBtn.querySelectorAll('.hamburger-line');
            if (lines.length >= 3) {
                lines[0].style.transform = 'none';
                lines[1].style.opacity = '1';
                lines[2].style.transform = 'none';
            }
        }
        
        // 모든 서브메뉴 닫기
        document.querySelectorAll('.sidebar-item, .sidebar-subitem').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.sidebar-submenu, .sidebar-sub-submenu').forEach(submenu => {
            submenu.classList.remove('active');
        });
        
        console.log('📱 모바일 사이드바 닫힘');
    }
}

// ===== 전역 함수 등록 =====
window.loadComponent = loadComponent;
window.loadAllComponents = loadAllComponents;
window.openMobileSidebar = openMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.initializeMobileSidebar3Level = initializeMobileSidebar3Level;

// ===== 자동 초기화 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting component loading...');
    loadAllComponents();
});

// 컴포넌트 로딩 완료 후 재초기화
document.addEventListener('sectionsLoaded', function() {
    setTimeout(initializeComponentEvents, 100);
});

// ESC 키로 사이드바 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeMobileSidebar();
    }
});