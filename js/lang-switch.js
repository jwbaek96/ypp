// 언어 전환 기능
class LanguageSwitch {
    constructor() {
        this.currentLang = this.getSavedLanguage();
        this.init();
    }

    init() {
        // 즉시 저장된 언어 적용 (DOM이 로드되기 전에도)
        this.applyLanguageImmediately();
        
        // 페이지 로드 시 저장된 언어 적용
        this.applyLanguage(this.currentLang);
        this.updateActiveButton();
        
        // 이벤트 위임을 사용한 언어 버튼 이벤트 리스너 등록
        this.setupEventDelegation();
    }

    // 이벤트 위임으로 동적 요소도 처리
    setupEventDelegation() {
        document.body.addEventListener('click', (e) => {
            // 언어 버튼 클릭 체크
            if (e.target.matches('.lang-btn, .sidebar-lang-btn') || 
                e.target.closest('.lang-btn, .sidebar-lang-btn')) {
                
                const button = e.target.matches('.lang-btn, .sidebar-lang-btn') ? 
                              e.target : e.target.closest('.lang-btn, .sidebar-lang-btn');
                
                // 현재 언어의 반대 언어로 토글
                const currentLang = this.getSavedLanguage();
                const toggleLang = currentLang === 'ko' ? 'en' : 'ko';
                
                this.switchLanguage(toggleLang);
                console.log('언어 토글:', currentLang, '→', toggleLang);
            }
        });
    }

    // 즉시 언어 적용 (DOM 로드 전에도 실행)
    applyLanguageImmediately() {
        // 이미 로드된 요소들에 즉시 적용
        const elements = document.querySelectorAll('[data-kor][data-eng]');
        elements.forEach(element => {
            const korText = element.dataset.kor;
            const engText = element.dataset.eng;
            
            if (this.currentLang === 'ko') {
                if (korText.includes('<') && korText.includes('>')) {
                    element.innerHTML = korText;
                } else {
                    element.textContent = korText;
                }
            } else if (this.currentLang === 'en') {
                if (engText.includes('<') && engText.includes('>')) {
                    element.innerHTML = engText;
                } else {
                    element.textContent = engText;
                }
            }
        });
    }

    // 로컬스토리지에서 저장된 언어 가져오기
    getSavedLanguage() {
        return localStorage.getItem('selectedLanguage') || 'ko';
    }

    // 언어 저장하기
    saveLanguage(lang) {
        localStorage.setItem('selectedLanguage', lang);
    }

    // 언어 전환 실행
    switchLanguage(lang) {
        this.currentLang = lang;
        this.saveLanguage(lang);
        this.applyLanguage(lang);
        this.updateActiveButton();
        
        // 언어 변경 이벤트 발생 (다른 컴포넌트들에게 알림)
        const languageChangeEvent = new CustomEvent('languageChanged', {
            detail: { language: lang }
        });
        window.dispatchEvent(languageChangeEvent);
    }

    // 페이지의 모든 텍스트 변경
    applyLanguage(lang) {
        const elements = document.querySelectorAll('[data-kor][data-eng]');
        
        elements.forEach(element => {
            const korText = element.dataset.kor;
            const engText = element.dataset.eng;
            
            if (lang === 'ko') {
                // HTML 태그가 포함된 경우 innerHTML 사용
                if (korText.includes('<') && korText.includes('>')) {
                    element.innerHTML = korText;
                } else {
                    element.textContent = korText;
                }
            } else if (lang === 'en') {
                // HTML 태그가 포함된 경우 innerHTML 사용
                if (engText.includes('<') && engText.includes('>')) {
                    element.innerHTML = engText;
                } else {
                    element.textContent = engText;
                }
            }
        });
    }

    // 활성화된 버튼 스타일 업데이트
    updateActiveButton() {
        // 헤더와 사이드바의 모든 언어 버튼 찾기
        const allLangButtons = document.querySelectorAll('.lang-btn, .sidebar-lang-btn');
        
        allLangButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.lang === this.currentLang) {
                button.classList.add('active');
            }
        });
        
        // 동적으로 추가된 버튼들도 처리 (약간의 지연 후)
        setTimeout(() => {
            const newButtons = document.querySelectorAll('.lang-btn, .sidebar-lang-btn');
            newButtons.forEach(button => {
                if (button.dataset.lang === this.currentLang) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }, 100);
    }
}

// 언어 전환 기능을 전역으로 초기화하는 함수
function initLanguageSwitch() {
    if (window.languageSwitchInstance) {
        return; // 이미 초기화된 경우 중복 실행 방지
    }
    
    // 언어 버튼이 존재하는지 확인
    const langButtons = document.querySelectorAll('.lang-btn');
    if (langButtons.length > 0) {
        window.languageSwitchInstance = new LanguageSwitch();
        console.log('언어 전환 기능이 초기화되었습니다.');
    } else {
        console.log('언어 버튼을 찾을 수 없습니다. 헤더 로드 후 다시 시도합니다.');
    }
}

// 페이지 로드 전에 미리 언어 적용
function preApplyLanguage() {
    const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
    const elements = document.querySelectorAll('[data-kor][data-eng]');
    
    elements.forEach(element => {
        const korText = element.dataset.kor;
        const engText = element.dataset.eng;
        
        if (savedLang === 'ko') {
            if (korText.includes('<') && korText.includes('>')) {
                element.innerHTML = korText;
            } else {
                element.textContent = korText;
            }
        } else if (savedLang === 'en') {
            if (engText.includes('<') && engText.includes('>')) {
                element.innerHTML = engText;
            } else {
                element.textContent = engText;
            }
        }
    });
}

// 페이지 로드 시 즉시 언어 적용
document.addEventListener('DOMContentLoaded', () => {
    preApplyLanguage();
    initLanguageSwitch();
});

// 헤더 로드 후에도 초기화 시도 (동적 로딩 대응)
setTimeout(() => {
    preApplyLanguage();
    initLanguageSwitch();
}, 1000);

// MutationObserver로 새로운 요소 감지 및 언어 적용
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            
            // 새로 추가된 요소에 언어 적용
            addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    const savedLang = localStorage.getItem('selectedLanguage') || 'ko';
                    const elements = node.querySelectorAll ? node.querySelectorAll('[data-kor][data-eng]') : [];
                    
                    elements.forEach(element => {
                        const korText = element.dataset.kor;
                        const engText = element.dataset.eng;
                        
                        if (savedLang === 'ko') {
                            if (korText.includes('<') && korText.includes('>')) {
                                element.innerHTML = korText;
                            } else {
                                element.textContent = korText;
                            }
                        } else if (savedLang === 'en') {
                            if (engText.includes('<') && engText.includes('>')) {
                                element.innerHTML = engText;
                            } else {
                                element.textContent = engText;
                            }
                        }
                    });
                }
            });
            
            // 언어 버튼이 추가되면 초기화
            const hasLangButtons = addedNodes.some(node => 
                node.nodeType === 1 && 
                (node.querySelector && node.querySelector('.lang-btn'))
            );
            
            if (hasLangButtons) {
                initLanguageSwitch();
            }
        }
    });
});

// 전체 body 감지 시작
observer.observe(document.body, { childList: true, subtree: true });