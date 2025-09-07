const DASHBOARD_APPS_SCRIPT_ID = 'AKfycbwVzRfzyNn2Q-bYUbZWNw3A5Q-gFxLRs3tzYwXn5B2zCOrsTdQ9YALg1JFh4pqT4OEI-g';
const DASHBOARD_APPS_SCRIPT_URL = `https://script.google.com/macros/s/${DASHBOARD_APPS_SCRIPT_ID}/exec`;

/**
 * 연혁 데이터 매니저 클래스
 */
class HistoryDataManager {
    constructor() {
        this.historyData = null;
        this.isLoading = false;
    }
    
    // Apps Script에서 연혁 데이터 로드
    async loadHistoryData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        try {
            console.log('📊 연혁 데이터 로딩 시작...');
            const url = `${DASHBOARD_APPS_SCRIPT_URL}?sheet=history&action=getData`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📋 연혁 API 응답:', result);
            
            if (!result.success) {
                throw new Error(result.error || 'API 요청 실패');
            }
            
            this.historyData = result.data;
            console.log(`✅ 연혁 데이터 ${this.historyData.data.length}개 로드 완료`);
            
            // 연혁 섹션 렌더링
            this.renderHistorySection();
            
            return true;
            
        } catch (error) {
            console.error('💥 연혁 데이터 로드 실패:', error);
            this.showErrorMessage();
            return false;
        } finally {
            this.isLoading = false;
        }
    }
    
    // 연혁 섹션 렌더링
    renderHistorySection() {
        try {
            if (!this.historyData || !this.historyData.data) {
                console.error('🚫 연혁 데이터가 없습니다');
                return;
            }
            
            console.log(`📋 연혁 데이터 ${this.historyData.data.length}개 렌더링 시작`);
            
            // 연도별로 데이터 분류
            const dataByDecade = this.groupDataByDecade();
            
            // 각 연도대별 컨테이너에 데이터 렌더링
            this.renderDecadeData('2010', dataByDecade['2010s'] || []);
            this.renderDecadeData('2000', dataByDecade['2000s'] || []);
            this.renderDecadeData('1990', dataByDecade['1990s'] || []);
            this.renderDecadeData('1980', dataByDecade['1980s'] || []);
            
            console.log('✅ 연혁 섹션 렌더링 완료');
            
            // 현재 언어로 업데이트
            const currentLanguage = localStorage.getItem('selectedLanguage') || 'ko';
            this.updateLanguage(currentLanguage);
            
        } catch (error) {
            console.error('💥 연혁 섹션 렌더링 실패:', error);
        }
    }
    
    // 연도별 데이터 분류
    groupDataByDecade() {
        const grouped = {
            '2010s': [],
            '2000s': [],
            '1990s': [],
            '1980s': []
        };
        
        this.historyData.data.forEach(item => {
            const year = parseInt(item.year) || 0;
            
            if (year >= 2010) {
                grouped['2010s'].push(item);
            } else if (year >= 2000) {
                grouped['2000s'].push(item);
            } else if (year >= 1990) {
                grouped['1990s'].push(item);
            } else if (year >= 1980) {
                grouped['1980s'].push(item);
            }
        });
        
        // 각 연도대별로 연도순 정렬 (최신순)
        Object.keys(grouped).forEach(decade => {
            grouped[decade].sort((a, b) => parseInt(b.year) - parseInt(a.year));
        });
        
        return grouped;
    }
    
    // 특정 연도대 데이터 렌더링
    renderDecadeData(decade, data) {
        try {
            const container = document.querySelector(`#history-content-${decade} .history-timeline`);
            if (!container) {
                console.warn(`🚫 연도대 ${decade} 컨테이너를 찾을 수 없습니다`);
                return;
            }
            
            // 기존 동적 생성된 항목들만 제거 (기존 정적 HTML은 유지)
            const existingDynamicItems = container.querySelectorAll('.history-timeline-item[data-dynamic="true"]');
            existingDynamicItems.forEach(item => item.remove());
            
            if (data.length === 0) {
                console.log(`📝 연도대 ${decade}: 데이터 없음`);
                return;
            }
            
            // 새로운 데이터 항목들을 추가
            data.forEach((item, index) => {
                const timelineItem = this.createTimelineItem(item, index, true);
                if (timelineItem) {
                    container.appendChild(timelineItem);
                }
            });
            
            console.log(`✅ 연도대 ${decade}: ${data.length}개 항목 렌더링 완료`);
            
        } catch (error) {
            console.error(`💥 연도대 ${decade} 렌더링 실패:`, error);
        }
    }
    
    // 타임라인 아이템 생성
    createTimelineItem(item, index, isDynamic = false) {
        try {
            const timelineItem = document.createElement('div');
            timelineItem.className = 'history-timeline-item';
            timelineItem.setAttribute('data-index', index);
            
            // 동적 생성된 항목임을 표시
            if (isDynamic) {
                timelineItem.setAttribute('data-dynamic', 'true');
            }
            
            // 연도 요소
            const yearElement = document.createElement('div');
            yearElement.className = 'history-timeline-year';
            yearElement.textContent = item.year || '';
            
            // 내용 요소
            const contentElement = document.createElement('div');
            contentElement.className = 'history-timeline-content';
            
            // 줄바꿈 처리: \n을 <br>로 변환
            const processText = (text) => {
                if (!text) return '';
                return text.replace(/\n/g, '<br>');
            };
            
            const korText = processText(item.textKR || '');
            const engText = processText(item.textEN || '');
            
            contentElement.setAttribute('data-eng', engText);
            contentElement.setAttribute('data-kor', korText);
            contentElement.innerHTML = korText || engText;
            
            // 줄바꿈을 위한 CSS 스타일 적용
            contentElement.style.whiteSpace = 'pre-wrap';
            contentElement.style.lineHeight = '1.6';
            
            // 요소들을 타임라인 아이템에 추가
            timelineItem.appendChild(yearElement);
            timelineItem.appendChild(contentElement);
            
            return timelineItem;
            
        } catch (error) {
            console.error(`💥 타임라인 아이템 생성 실패 (index: ${index}):`, error);
            return null;
        }
    }
    
    // 언어 업데이트
    updateLanguage(language) {
        try {
            // 모든 연도대의 타임라인 컨텐츠 업데이트
            const timelineContents = document.querySelectorAll('.history-timeline-content[data-eng][data-kor]');
            
            timelineContents.forEach(element => {
                const engText = element.getAttribute('data-eng');
                const korText = element.getAttribute('data-kor');
                
                if (language === 'en' && engText) {
                    element.innerHTML = engText;
                } else if (korText) {
                    element.innerHTML = korText;
                }
                
                // 줄바꿈을 위한 CSS 스타일 확인 및 적용
                if (!element.style.whiteSpace) {
                    element.style.whiteSpace = 'pre-wrap';
                    element.style.lineHeight = '1.6';
                }
            });
            
            console.log(`✅ 연혁 언어 전환 완료: ${language}`);
            
        } catch (error) {
            console.error('💥 연혁 언어 전환 실패:', error);
        }
    }
    
    // 에러 메시지 표시
    showErrorMessage() {
        try {
            const historySection = document.querySelector('#status-history .block-content');
            if (historySection) {
                // 기존 정적 HTML 내용을 유지하면서 에러 메시지만 추가
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.innerHTML = `
                    <p data-eng="Failed to load history data. Please try again later." 
                       data-kor="연혁 데이터를 불러오는데 실패했습니다. 나중에 다시 시도해주세요.">
                        연혁 데이터를 불러오는데 실패했습니다. 나중에 다시 시도해주세요.
                    </p>
                    <button onclick="historyDataManager.loadHistoryData()" 
                            data-eng="Retry" 
                            data-kor="다시 시도">
                        다시 시도
                    </button>
                `;
                
                // 에러 메시지를 연혁 섹션 상단에 추가
                historySection.insertBefore(errorDiv, historySection.firstChild);
            }
        } catch (error) {
            console.error('💥 에러 메시지 표시 실패:', error);
        }
    }
}

// 전역 변수
let historyDataManager = null;

/**
 * 연혁 데이터 로드 함수 (외부 호출용)
 */
async function loadHistoryData() {
    if (!historyDataManager) {
        historyDataManager = new HistoryDataManager();
    }
    return await historyDataManager.loadHistoryData();
}

/**
 * 언어 전환 지원 함수
 */
function updateHistoryLanguage(language) {
    if (historyDataManager) {
        historyDataManager.updateLanguage(language);
    }
}

/**
 * 페이지 로드 시 자동 초기화
 */
document.addEventListener('DOMContentLoaded', function() {
    // 연혁 섹션이 있는 페이지에서만 실행
    if (document.querySelector('#status-history')) {
        console.log('🎯 연혁 섹션 감지 - 데이터 로딩 준비');
        
        // 컴포넌트가 로드된 후 연혁 데이터 로드
        if (document.querySelector('#status-history .block-content')) {
            setTimeout(loadHistoryData, 500);
        } else {
            document.addEventListener('componentsLoaded', () => {
                setTimeout(loadHistoryData, 500);
            });
        }
        
        // 언어 전환 이벤트 리스너 추가
        document.addEventListener('languageChanged', (e) => {
            updateHistoryLanguage(e.detail.language);
        });
        
        // 기존 언어 전환 시스템과 연동
        const currentLanguage = localStorage.getItem('selectedLanguage') || 'ko';
        setTimeout(() => {
            updateHistoryLanguage(currentLanguage);
        }, 1000);
    }
});

// 전역 함수 내보내기
window.loadHistoryData = loadHistoryData;
window.updateHistoryLanguage = updateHistoryLanguage;
window.HistoryDataManager = HistoryDataManager;