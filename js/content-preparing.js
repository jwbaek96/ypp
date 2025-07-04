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
        const styleId = 'content-preparing-styles';
        if (document.getElementById(styleId)) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* 컨텐츠 준비 중 알림창 */
            .content-preparing-notice {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                padding: 1rem;
                z-index: 998;
                animation: contentPreparingSlideUp 0.5s ease-out;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .content-preparing-notice .notice-container {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                color: white;
                padding: 1.5rem 2rem;
                box-shadow: 
                    0 -12px 40px rgba(102, 126, 234, 0.4),
                    0 -6px 20px rgba(118, 75, 162, 0.3),
                    0 -2px 10px rgba(240, 147, 251, 0.2);
                backdrop-filter: blur(10px);
                border-radius:10px;
            }

            @keyframes contentPreparingSlideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
                        
            
            .content-preparing-notice .notice-content {
                flex: 1;
            }
            
            .content-preparing-notice .notice-title {
                font-size: 1.2rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
            }
            
            .content-preparing-notice .notice-icon {
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(240, 147, 251, 0.4));
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .content-preparing-notice .notice-description {
                font-size: 0.95rem;
                line-height: 1.5;
                opacity: 0.9;
                margin: 0;
                color: #fff;
            }
            
            /* 모바일 반응형 */
            @media (max-width: 768px) {
                .content-preparing-notice {
                    padding: 1rem 1.5rem;
                }
                
                .content-preparing-notice .notice-title {
                    font-size: 1.1rem;
                }
                
                .content-preparing-notice .notice-description {
                    font-size: 0.9rem;
                }
            }
            
            @media (max-width: 480px) {
                .content-preparing-notice {
                    padding: 1rem;
                }
                
                .content-preparing-notice .notice-title {
                    font-size: 1rem;
                }
                
                .content-preparing-notice .notice-description {
                    font-size: 0.85rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // HTML 요소 생성
    function createNoticeElement() {
        const noticeHtml = `
            <div class="content-preparing-notice" id="contentPreparingNotice">
                <div class="notice-container">
                    <div class="notice-content">
                        <div class="notice-title">
                            <span class="notice-icon">⚠</span>
                            컨텐츠 준비 중입니다.
                        </div>
                        <p class="notice-description">
                            현재 페이지는 준비중입니다. 빠른 시일내에 서비스를 제공할 수 있도록 노력하겠습니다. 감사합니다.
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // body에 추가
        document.body.insertAdjacentHTML('beforeend', noticeHtml);
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
        const notice = document.getElementById('contentPreparingNotice');
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