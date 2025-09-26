// content-preparing.js - 컨텐츠 준비 중 알림창 컴포넌트

(function() {
    'use strict';
    
    // 이미 로드되었는지 확인
    if (window.contentPreparingLoaded) {
        return;
    }
    window.contentPreparingLoaded = true;
    
    // CSS 스타일 추가
    function addStyles() {
        const styleId = 'trophy-notice-styles';
        if (document.getElementById(styleId)) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .trophy-notice.mobile-scrolled {
                padding-right: 66px;
                transition: padding-right 0.3s ease;
            }
            
            @media (max-width: 480px) {
                .trophy-notice.english .notice-content p {
                    font-size: 0.8rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // HTML 요소 생성 및 스크롤 이벤트 추가
    function createNoticeElement() {
        const noticeHtml = `
            <div class="trophy-notice" id="trophy-notice">
                <a href="https://www.youtube.com/live/waeJEmo4tds?si=3H7C8pZQ_Ov_EyPY&t=2332" class="notice-container">
                    <div class="notice-img">
                        <img src="/assets/images/trophy.png" alt="Trophy Icon"">
                    </div>
                    <div class="notice-content">
                        <p data-kor="2025 기술경영혁신대전" data-eng="– Presidential Award Winner –">
                        <p data-kor="– 대통령표창 수상 –" data-eng="2025 Korea Technology and Management Innovation Awards">
                    </div>
                </a>
            </div>
        `;
        
        // body에 추가
        document.body.insertAdjacentHTML('beforeend', noticeHtml);
        
        // 스크롤 이벤트 리스너 추가
        addScrollListener();
        
        // 언어 변경 감지 리스너 추가
        addLanguageListener();
    }
    
    // 언어 변경 감지 및 클래스 적용
    function addLanguageListener() {
        const trophyNotice = document.getElementById('trophy-notice');
        if (!trophyNotice) return;
        
        function updateLanguageClass() {
            const selectedLanguage = localStorage.getItem('selectedLanguage');
            const isMobile = window.innerWidth <= 480;
            
            if (isMobile && selectedLanguage === 'en') {
                trophyNotice.classList.add('english');
            } else {
                trophyNotice.classList.remove('english');
            }
        }
        
        // 로컬스토리지 변경 감지
        window.addEventListener('storage', updateLanguageClass);
        
        // 리사이즈 이벤트에서도 체크 (모바일/데스크탑 전환 시)
        window.addEventListener('resize', updateLanguageClass);
        
        // 언어 변경 커스텀 이벤트 감지 (있다면)
        document.addEventListener('languageChanged', updateLanguageClass);
        
        // 초기 실행
        updateLanguageClass();
        
        // 주기적으로 체크 (다른 탭에서 변경된 경우 대비)
        setInterval(updateLanguageClass, 1000);
    }
    
    // 스크롤 이벤트 리스너
    function addScrollListener() {
        const trophyNotice = document.getElementById('trophy-notice');
        if (!trophyNotice) return;
        
        function handleScroll() {
            // 모바일 환경 체크 (480px 이하)
            const isMobile = window.innerWidth <= 480;
            // 스크롤 위치 체크 (300px 이상)
            const scrolled = window.pageYOffset > 300;
            
            if (isMobile && scrolled) {
                trophyNotice.classList.add('mobile-scrolled');
            } else {
                trophyNotice.classList.remove('mobile-scrolled');
            }
        }
        
        // 스크롤 이벤트 등록
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // 리사이즈 이벤트도 등록 (화면 크기 변경 시 대응)
        window.addEventListener('resize', handleScroll, { passive: true });
        
        // 초기 실행
        handleScroll();
    }
    
    // 초기화 함수
    function init() {
        // DOM이 로드된 후 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addStyles();
                createNoticeElement();
            });
        } else {
            addStyles();
            createNoticeElement();
        }
    }
    
    // 컴포넌트 제거 함수 (전역으로 노출)
    window.removeContentPreparingNotice = function() {
        const notice = document.getElementById('trophy-notice');
        if (notice) {
            notice.style.transform = 'translateY(100%)';
            notice.style.opacity = '0';
            notice.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                notice.remove();
            }, 300);
        }
    };
    
    // 자동 초기화
    init();
})();