// // YPP Website - Mobile Menu JavaScript

// // ===== MOBILE MENU INITIALIZATION =====
// function initializeMobileMenu() {
//     console.log('🔧 Initializing mobile menu...');
    
//     // DOM 요소들 가져오기
//     const hamburgerBtn = document.getElementById('hamburger-btn');
//     const mobileSidebar = document.getElementById('mobile-sidebar');
//     const sidebarOverlay = document.getElementById('sidebar-overlay');
//     const sidebarClose = document.getElementById('sidebar-close');

//     // 요소 존재 확인
//     if (!hamburgerBtn || !mobileSidebar || !sidebarOverlay || !sidebarClose) {
//         console.warn('⚠️ Mobile menu elements not found, retrying in 500ms...');
//         setTimeout(initializeMobileMenu, 500);
//         return;
//     }

//     // ===== 모바일 사이드바 열기 =====
//     function openMobileSidebar() {
//         console.log('📱 Opening mobile sidebar');
        
//         mobileSidebar.classList.add('active');
//         sidebarOverlay.classList.add('active');
//         document.body.style.overflow = 'hidden';
        
//         // 햄버거 → X 애니메이션
//         animateHamburgerToX(hamburgerBtn);
        
//         // ARIA 접근성
//         mobileSidebar.setAttribute('aria-hidden', 'false');
//         hamburgerBtn.setAttribute('aria-expanded', 'true');
//     }

//     // ===== 모바일 사이드바 닫기 =====
//     function closeMobileSidebar() {
//         console.log('📱 Closing mobile sidebar');
        
//         mobileSidebar.classList.remove('active');
//         sidebarOverlay.classList.remove('active');
//         document.body.style.overflow = 'auto';
        
//         // X → 햄버거 애니메이션
//         resetHamburgerAnimation(hamburgerBtn);
        
//         // ARIA 접근성
//         mobileSidebar.setAttribute('aria-hidden', 'true');
//         hamburgerBtn.setAttribute('aria-expanded', 'false');
        
//         // 모든 서브메뉴 닫기
//         closeAllSubmenus();
//     }

//     // ===== 햄버거 버튼 애니메이션 =====
//     function animateHamburgerToX(btn) {
//         const lines = btn.querySelectorAll('.hamburger-line');
//         if (lines.length >= 3) {
//             lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
//             lines[1].style.opacity = '0';
//             lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
//         }
//     }

//     function resetHamburgerAnimation(btn) {
//         const lines = btn.querySelectorAll('.hamburger-line');
//         if (lines.length >= 3) {
//             lines[0].style.transform = 'none';
//             lines[1].style.opacity = '1';
//             lines[2].style.transform = 'none';
//         }
//     }

//     // ===== 서브메뉴 토글 =====
//     function toggleSubmenu(submenu) {
//         const isOpen = submenu.style.maxHeight && submenu.style.maxHeight !== '0px';
        
//         // 다른 모든 서브메뉴 닫기
//         closeAllSubmenus();
        
//         // 현재 서브메뉴 토글
//         if (!isOpen) {
//             submenu.style.maxHeight = submenu.scrollHeight + 'px';
//             submenu.style.opacity = '1';
//             submenu.setAttribute('aria-hidden', 'false');
//         }
//     }

//     function closeAllSubmenus() {
//         document.querySelectorAll('.sidebar-submenu').forEach(menu => {
//             menu.style.maxHeight = '0px';
//             menu.style.opacity = '0';
//             menu.setAttribute('aria-hidden', 'true');
//         });
//     }

//     // ===== 이벤트 리스너 등록 =====
    
//     // 햄버거 버튼 클릭
//     hamburgerBtn.addEventListener('click', openMobileSidebar);
    
//     // 닫기 버튼 클릭
//     sidebarClose.addEventListener('click', closeMobileSidebar);
    
//     // 오버레이 클릭
//     sidebarOverlay.addEventListener('click', closeMobileSidebar);
    
//     // ESC 키로 닫기
//     document.addEventListener('keydown', function(e) {
//         if (e.key === 'Escape' && mobileSidebar.classList.contains('active')) {
//             closeMobileSidebar();
//         }
//     });

//     // ===== 사이드바 네비게이션 링크 처리 =====
//     document.querySelectorAll('.sidebar-link').forEach(link => {
//         link.addEventListener('click', function(e) {
//             const href = this.getAttribute('href');
//             const submenu = this.parentElement.querySelector('.sidebar-submenu');
            
//             // 서브메뉴가 있는 링크인 경우
//             if (submenu) {
//                 e.preventDefault();
//                 toggleSubmenu(submenu);
//             } 
//             // 앵커 링크인 경우 (같은 페이지 내 이동)
//             else if (href && href.startsWith('#')) {
//                 closeMobileSidebar();
                
//                 // 부드러운 스크롤
//                 setTimeout(() => {
//                     const target = document.querySelector(href);
//                     if (target) {
//                         target.scrollIntoView({
//                             behavior: 'smooth',
//                             block: 'start'
//                         });
//                     }
//                 }, 300);
//             }
//             // 외부 링크인 경우
//             else if (href && !href.startsWith('#')) {
//                 closeMobileSidebar();
//             }
//         });
//     });

//     // ===== 서브메뉴 링크 처리 =====
//     document.querySelectorAll('.sidebar-submenu a').forEach(link => {
//         link.addEventListener('click', function() {
//             const href = this.getAttribute('href');
            
//             // 앵커 링크가 아닌 경우에만 사이드바 닫기
//             if (!href.startsWith('#')) {
//                 closeMobileSidebar();
//             }
//         });
//     });

//     // ===== 전역 함수로 등록 =====
//     window.openMobileSidebar = openMobileSidebar;
//     window.closeMobileSidebar = closeMobileSidebar;
    
//     console.log('✅ Mobile menu initialized successfully');
// }

// // ===== 터치 제스처 지원 =====
// function initializeTouchGestures() {
//     let startX = 0;
//     let startY = 0;
//     let isMoving = false;

//     const mobileSidebar = document.getElementById('mobile-sidebar');
//     if (!mobileSidebar) return;

//     // 터치 시작
//     mobileSidebar.addEventListener('touchstart', function(e) {
//         startX = e.touches[0].clientX;
//         startY = e.touches[0].clientY;
//         isMoving = false;
//     }, { passive: true });

//     // 터치 이동
//     mobileSidebar.addEventListener('touchmove', function(e) {
//         if (!startX || !startY) return;

//         const currentX = e.touches[0].clientX;
//         const currentY = e.touches[0].clientY;
        
//         const diffX = startX - currentX;
//         const diffY = startY - currentY;

//         // 수평 스와이프가 수직 스와이프보다 큰 경우
//         if (Math.abs(diffX) > Math.abs(diffY)) {
//             isMoving = true;
            
//             // 오른쪽으로 스와이프 (사이드바 닫기)
//             if (diffX > 50) {
//                 if (window.closeMobileSidebar) {
//                     window.closeMobileSidebar();
//                 }
//             }
//         }
//     }, { passive: true });

//     // 터치 종료
//     mobileSidebar.addEventListener('touchend', function() {
//         startX = 0;
//         startY = 0;
//         isMoving = false;
//     }, { passive: true });
// }

// // ===== 자동 초기화 =====
// document.addEventListener('DOMContentLoaded', function() {
//     console.log('🚀 DOM loaded, initializing mobile menu...');
    
//     // 컴포넌트 로딩 후 초기화
//     setTimeout(() => {
//         initializeMobileMenu();
//         initializeTouchGestures();
//     }, 100);
// });

// // 컴포넌트 로딩 완료 후 재초기화
// document.addEventListener('componentsLoaded', function() {
//     console.log('🔄 Components loaded, re-initializing mobile menu...');
//     initializeMobileMenu();
//     initializeTouchGestures();
// });

// // ===== 윈도우 리사이즈 처리 =====
// window.addEventListener('resize', function() {
//     // 데스크톱 크기로 변경 시 모바일 메뉴 자동 닫기
//     if (window.innerWidth > 768) {
//         const mobileSidebar = document.getElementById('mobile-sidebar');
//         if (mobileSidebar && mobileSidebar.classList.contains('active')) {
//             if (window.closeMobileSidebar) {
//                 window.closeMobileSidebar();
//             }
//         }
//     }
// });

// // ===== 디버깅용 함수 =====
// window.debugMobileMenu = function() {
//     console.log('🐛 Mobile Menu Debug Info:');
//     console.log('- Hamburger button:', document.getElementById('hamburger-btn'));
//     console.log('- Mobile sidebar:', document.getElementById('mobile-sidebar'));
//     console.log('- Sidebar overlay:', document.getElementById('sidebar-overlay'));
//     console.log('- Sidebar close:', document.getElementById('sidebar-close'));
//     console.log('- Window width:', window.innerWidth);
// };