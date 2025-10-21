// YPP Config를 사용한 Apps Script URL 가져오기
async function getAppsScriptURL() {
    try {
        // YPP Config가 로드되어 있는지 확인
        if (!window.YPPConfig) {
            throw new Error('YPP Config가 로드되지 않았습니다.');
        }

        // Support 페이지 Apps Script URL 가져오기
        const url = await window.YPPConfig.get('SUPPORT');
        console.log('✅ Apps Script URL 로드 완료:', url);
        return url;
    } catch (error) {
        console.error('💥 Apps Script URL 로드 실패:', error);
        throw error; // 에러를 상위로 전파
    }
}

// FAQ 데이터 관리 클래스
class FAQDataManager {
    constructor() {
        this.faqData = null;
        this.isLoading = false;
    }
    
    // Apps Script에서 FAQ 데이터 로드
    async loadFAQData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📊 FAQ 데이터 로딩 시작...');
            
            // Supabase에서 Apps Script URL 가져오기
            const baseURL = await getAppsScriptURL();
            const url = `${baseURL}?sheet=faq&action=getData`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📋 FAQ API 응답:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'API 요청 실패');
            }
            
            this.faqData = result.data;
            console.log(`✅ FAQ 데이터 ${this.faqData.data.length}개 로드 완료`);
            
            // FAQ 렌더링
            this.renderFAQs();
            
            return true;
            
        } catch (error) {
            console.error('💥 FAQ 데이터 로드 실패:', error);
            this.showErrorMessage();
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    // FAQ 렌더링
    renderFAQs() {
        if (!this.faqData || !this.faqData.data || this.faqData.data.length === 0) {
            console.warn('FAQ 데이터가 없습니다.');
            return;
        }
        
        // 5개 카테고리 컨테이너 찾기
        const categories = document.querySelectorAll('.faq-category');
        
        if (categories.length !== 5) {
            console.error('FAQ 카테고리가 5개가 아닙니다.');
            return;
        }
        
        // 모든 데이터 행 처리
        this.faqData.data.forEach((rowData, rowIndex) => {
            if (!rowData || rowData.length === 0) {
                console.warn(`FAQ 데이터 행 ${rowIndex + 1}이 비어있습니다.`);
                return;
            }
            
            console.log(`FAQ 행 ${rowIndex + 1} 처리 중...`, rowData);
            
            // 각 카테고리별로 FAQ 아이템 생성
            this.renderCategoryFAQs(categories[0], rowData, 0, rowIndex);  // A-D열 (인덱스 0-3)
            this.renderCategoryFAQs(categories[1], rowData, 4, rowIndex);  // E-H열 (인덱스 4-7)
            this.renderCategoryFAQs(categories[2], rowData, 8, rowIndex);  // I-L열 (인덱스 8-11)
            this.renderCategoryFAQs(categories[3], rowData, 12, rowIndex); // M-P열 (인덱스 12-15)
            this.renderCategoryFAQs(categories[4], rowData, 16, rowIndex); // Q-T열 (인덱스 16-19)
        });
        
        // FAQ 아코디언 기능 재초기화
        setTimeout(() => {
            if (window.faqAccordion) {
                window.faqAccordion = null;
            }
            if (typeof initFAQ === 'function') {
                initFAQ();
            }
        }, 100);
        
        console.log(`✅ FAQ 렌더링 완료 - 총 ${this.faqData.data.length}개 행 처리됨`);
    }
    
    // 카테고리별 FAQ 아이템 렌더링
    renderCategoryFAQs(categoryElement, rowData, startColumnIndex, rowIndex = 0) {
        const questionKR = rowData[startColumnIndex] || '';     // 한글질문
        const questionEN = rowData[startColumnIndex + 1] || ''; // 영어질문
        const answerKR = rowData[startColumnIndex + 2] || '';   // 한글답변
        const answerEN = rowData[startColumnIndex + 3] || '';   // 영어답변
        
        // 질문이나 답변이 하나라도 있으면 FAQ 아이템 생성
        if (questionKR || questionEN || answerKR || answerEN) {
            console.log(`FAQ 아이템 생성: 행${rowIndex + 1}, 컬럼${startColumnIndex}-${startColumnIndex + 3}`, {
                questionKR: questionKR?.substring(0, 30) + '...',
                questionEN: questionEN?.substring(0, 30) + '...'
            });
            
            const faqItem = this.createFAQItem(questionKR, questionEN, answerKR, answerEN, rowIndex);
            categoryElement.appendChild(faqItem);
        }
    }
    
    // FAQ 아이템 HTML 생성
    createFAQItem(questionKR, questionEN, answerKR, answerEN, rowIndex = 0) {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.setAttribute('data-row', rowIndex); // 행 번호 저장
        
        faqItem.innerHTML = `
            <button class="faq-question" aria-expanded="false">
                <div class="question-text">
                    <span class="question-icon">Q</span>
                    <span data-eng="${this.escapeHtml(questionEN)}" data-kor="${this.escapeHtml(questionKR)}">${questionKR}</span>
                </div>
                <span class="toggle-icon">
                    <i class="fas fa-chevron-down accordion-icon"></i>
                </span>
            </button>
            <div class="faq-answer">
                <div class="answer-content">
                    <div class="answer-text" data-eng="${this.escapeHtml(answerEN)}" data-kor="${this.escapeHtml(answerKR)}" style="white-space: pre-wrap;">
                        ${this.formatText(answerKR)}
                    </div>
                </div>
            </div>
        `;
        
        return faqItem;
    }
    
    // 텍스트 포맷팅 (줄바꿈 처리)
    formatText(text) {
        if (!text) return '';
        return this.escapeHtml(text);
    }
    
    // HTML 이스케이프
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // 에러 메시지 표시
    showErrorMessage() {
        const faqContainer = document.querySelector('.faq-container');
        if (faqContainer) {
            faqContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <p>FAQ 데이터를 불러올 수 없습니다.</p>
                    <p>잠시 후 다시 시도해 주세요.</p>
                </div>
            `;
        }
    }
}

// 전역 FAQ 데이터 매니저
let faqDataManager = null;

// FAQ 데이터 로드 함수
async function loadFAQData() {
    if (!faqDataManager) {
        faqDataManager = new FAQDataManager();
    }
    return await faqDataManager.loadFAQData();
}

// FAQ 초기화 함수
function initFAQDataLoader() {
    // 페이지 로드 시 FAQ 데이터 로드
    document.addEventListener('DOMContentLoaded', function() {
        // YPP Config 로드 확인
        if (!window.YPPConfig) {
            console.error('YPP Config가 로드되지 않았습니다. config.js 스크립트 태그를 확인해주세요.');
            return;
        }

        // 컴포넌트 로딩 완료 후 FAQ 데이터 로드
        if (document.querySelector('.faq-container')) {
            loadFAQData();
        } else {
            document.addEventListener('componentsLoaded', () => {
                setTimeout(loadFAQData, 300);
            });
        }
    });
}

// 전역 함수로 노출
window.loadFAQData = loadFAQData;
window.FAQDataManager = FAQDataManager;

// 자동 초기화 (support 페이지에서만)
if (window.location.pathname.includes('support')) {
    initFAQDataLoader();
}