// YPP Website - Components Loader

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
        
        // Re-initialize event listeners after components are loaded
        initializeComponentEvents();
    } catch (error) {
        console.error('❌ Some components failed to load:', error);
    }
}

// ===== INITIALIZE COMPONENT EVENTS =====
function initializeComponentEvents() {
    // Re-run hamburger menu initialization
    if (window.initializeMobileMenu) {
        window.initializeMobileMenu();
    }
    
    // Re-run language switch initialization
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const lang = this.getAttribute('data-lang');
            console.log(`Language switched to: ${lang}`);
        });
    });

    // Re-run dropdown menu initialization for desktop
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

    console.log('🔧 Component events initialized');
}

// ===== MOBILE MENU INITIALIZATION =====
function initializeMobileMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');

    function openMobileSidebar() {
        if (mobileSidebar && sidebarOverlay) {
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Animate hamburger to X
            if (hamburgerBtn) {
                const lines = hamburgerBtn.querySelectorAll('.hamburger-line');
                if (lines.length >= 3) {
                    lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    lines[1].style.opacity = '0';
                    lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
                }
            }
        }
    }

    function closeMobileSidebar() {
        if (mobileSidebar && sidebarOverlay) {
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Reset hamburger animation
            if (hamburgerBtn) {
                const lines = hamburgerBtn.querySelectorAll('.hamburger-line');
                if (lines.length >= 3) {
                    lines[0].style.transform = 'none';
                    lines[1].style.opacity = '1';
                    lines[2].style.transform = 'none';
                }
            }
        }
    }

    // Event listeners
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openMobileSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeMobileSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }

    // Close sidebar when clicking on navigation links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function() {
            if (this.getAttribute('href').startsWith('#')) {
                closeMobileSidebar();
            }
        });
    });

    // Dropdown menu handling in mobile sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        const link = item.querySelector('.sidebar-link');
        const submenu = item.querySelector('.sidebar-submenu');
        
        if (submenu && link) {
            link.addEventListener('click', function(e) {
                if (this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    
                    // Toggle submenu
                    const isOpen = submenu.style.maxHeight && submenu.style.maxHeight !== '0px';
                    
                    // Close all other submenus
                    document.querySelectorAll('.sidebar-submenu').forEach(menu => {
                        menu.style.maxHeight = '0px';
                        menu.style.opacity = '0';
                    });
                    
                    // Toggle current submenu
                    if (!isOpen) {
                        submenu.style.maxHeight = submenu.scrollHeight + 'px';
                        submenu.style.opacity = '1';
                    }
                }
            });
        }
    });

    // Make functions globally available
    window.openMobileSidebar = openMobileSidebar;
    window.closeMobileSidebar = closeMobileSidebar;
}

// Make initialization function globally available
window.initializeMobileMenu = initializeMobileMenu;

// ===== AUTO LOAD ON DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting component loading...');
    loadAllComponents();
});

// ===== EXPORT FUNCTIONS =====
window.loadComponent = loadComponent;
window.loadAllComponents = loadAllComponents;

// 3단계 모바일 사이드바 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileSidebar3Level();
});

// 컴포넌트 로딩 후에도 초기화
document.addEventListener('sectionsLoaded', function() {
    setTimeout(initializeMobileSidebar3Level, 100);
});

function initializeMobileSidebar3Level() {
    console.log('🔄 3단계 사이드바 초기화 중...');
    
    // 기존 이벤트 리스너 제거 (중복 방지)
    document.querySelectorAll('[data-toggle="submenu"]').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
    });
    
    // 새로운 이벤트 리스너 추가
    document.querySelectorAll('[data-toggle="submenu"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📱 메뉴 클릭됨:', this.textContent.trim());
            
            const parentItem = this.closest('.sidebar-item, .sidebar-subitem');
            const submenu = parentItem.querySelector('.sidebar-submenu, .sidebar-sub-submenu');
            
            if (submenu) {
                // 현재 아이템이 열려있는지 확인
                const isActive = parentItem.classList.contains('active');
                
                console.log('현재 상태:', isActive ? '열림' : '닫힘');
                
                // 같은 레벨의 다른 메뉴들 닫기
                const parentContainer = parentItem.parentElement;
                Array.from(parentContainer.children).forEach(sibling => {
                    if (sibling !== parentItem && sibling.classList.contains('sidebar-item', 'sidebar-subitem')) {
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
                    
                    console.log('✅ 메뉴 닫힘');
                } else {
                    parentItem.classList.add('active');
                    submenu.classList.add('active');
                    console.log('✅ 메뉴 열림');
                }
            }
        });
    });
    
    console.log('✅ 3단계 사이드바 초기화 완료');
}

function openMobileSidebar() {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (mobileSidebar && sidebarOverlay) {
        mobileSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        console.log('📱 모바일 사이드바 열림');
    }
}

function closeMobileSidebar() {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (mobileSidebar && sidebarOverlay) {
        mobileSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        
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

// 전역 함수로 등록
window.openMobileSidebar = openMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.initializeMobileSidebar3Level = initializeMobileSidebar3Level;