/**
 * PSAC 개요 및 신청방법 동적 관리 클래스
 * SHEET_PSAC_B 데이터를 기반으로 HTML을 동적 생성
 */

class PSACOverviewManager {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbzvcFA7rwVCSJnhzQHlZH0a8AI0_S-EN-tyTg0tp_lJUmEXTN8d7axtVGrUjkOJLht-kA/exec';
        this.currentLang = this.detectLanguage();
        this.overviewData = null;
        this.weeklyOverviewData = null;
        
        // 초기화
        this.init();
    }
    
    /**
     * 언어 감지
     */
    detectLanguage() {
        const currentLang = document.documentElement.getAttribute('data-lang');
        return currentLang === 'en' ? 'english' : 'korean';
    }
    


    /**
     * 초기화
     */
    async init() {
        try {
            await this.loadOverviewData();
            this.renderInfoTable();
            this.renderContactGrid();
            await this.loadWeeklyOverviewData();
            this.renderWeeklyOverviewSection();
            this.setupLanguageChangeHandler();
            this.setupLanguageObserver();
        } catch (error) {
            console.error('PSAC Overview initialization failed:', error);
            this.showErrorMessage();
        }
    }
    
    /**
     * 개요 데이터 로드
     */
    async loadOverviewData() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_psac_overview`);
            const result = await response.json();
            
            if (result.success) {
                this.overviewData = result.data;
                console.log('PSAC Overview data loaded:', this.overviewData);
            } else {
                throw new Error('Failed to load overview data');
            }
        } catch (error) {
            console.error('Error loading overview data:', error);
            throw error;
        }
    }

    /**
     * 주차별 교육일정 및 개요 데이터 로드
     */
    async loadWeeklyOverviewData() {
        try {
            const response = await fetch(`${this.apiUrl}?action=get_psac_weekly_overview`);
            const result = await response.json();

            if (result.success) {
                this.weeklyOverviewData = result.data;
                console.log('PSAC Weekly Overview data loaded:', this.weeklyOverviewData);
            } else {
                throw new Error('Failed to load weekly overview data');
            }
        } catch (error) {
            console.error('Error loading weekly overview data:', error);
            throw error;
        }
    }
    
    /**
     * 과정 개요 테이블 렌더링
     */
    renderInfoTable() {
        const container = document.querySelector('.psac-info-table-container');
        if (!container || !this.overviewData) return;
        
        const table = this.generateInfoTable();
        container.innerHTML = table;
        
        // 언어 전환 이벤트 재설정
        this.setupDataAttributes(container);
    }
    
    /**
     * 과정 개요 테이블 HTML 생성
     */
    generateInfoTable() {
        const courseData = this.overviewData.courseOverview;
        const korData = courseData.korean;
        const engData = courseData.english;
        
        let tableHTML = `
            <table class="psac-info-table">
                <tbody>`;
        
        // 각 항목별로 테이블 행 생성
        const fields = [
            { key: '목적', labelKor: '목적', labelEng: 'Objective' },
            { key: '주관', labelKor: '주관', labelEng: 'Host' },
            { key: '장소', labelKor: '장소', labelEng: 'Venue' },
            { key: '기간', labelKor: '기간', labelEng: 'Period' },
            { key: '대상', labelKor: '대상', labelEng: 'Target' }
        ];
        
        fields.forEach(field => {
            const korValue = korData[field.key] || '';
            const engValue = engData[field.key] || '';
            const korValueHtml = this.formatMultilineText(korValue);
            const engValueHtml = this.formatMultilineText(engValue);
            
            tableHTML += `
                <tr>
                    <th class="info-label" 
                        data-eng="${field.labelEng}" 
                        data-kor="${field.labelKor}">${field.labelKor}</th>
                    <td class="info-value" 
                        data-eng="${this.escapeHtml(engValueHtml)}" 
                        data-kor="${this.escapeHtml(korValueHtml)}">${korValueHtml}</td>
                </tr>`;
        });
        
        tableHTML += `
                </tbody>
            </table>`;
        
        return tableHTML;
    }
    
    /**
     * 신청방법 그리드 렌더링
     */
    renderContactGrid() {
        const container = document.querySelector('.contact-grid');
        if (!container || !this.overviewData) return;
        
        const gridHTML = this.generateContactGrid();
        container.innerHTML = gridHTML;
        
        // 언어 전환 이벤트 재설정
        this.setupDataAttributes(container);
    }
    
    /**
     * 신청방법 그리드 HTML 생성
     */
    generateContactGrid() {
        const applicationData = this.overviewData.applicationMethod;
        const korData = applicationData.korean;
        const engData = applicationData.english;
        
        const fields = [
            { key: '접수기간', labelKor: '접수기간:', labelEng: 'Application Period:' },
            { key: '개인', labelKor: '개인:', labelEng: 'Individual:' },
            { key: '단체', labelKor: '단체:', labelEng: 'Group:' },
            { key: '결제(납부)', labelKor: '결제(납부):', labelEng: 'Payment:' }
        ];
        
        let gridHTML = '';
        
        fields.forEach(field => {
            const korValue = korData[field.key] || '';
            const engValue = engData[field.key] || '';
            const korValueHtml = this.formatMultilineText(korValue);
            const engValueHtml = this.formatMultilineText(engValue);
            
            // 결제 정보의 경우 특별 처리
            if (field.key === '결제(납부)') {
                const korPaymentHTML = this.formatPaymentText(korValue, 'korean');
                const engPaymentHTML = this.formatPaymentText(engValue, 'english');
                
                gridHTML += `
                    <div class="contact-item">
                        <div class="contact-label" 
                            data-kor="${field.labelKor}" 
                            data-eng="${field.labelEng}">${field.labelKor}</div>
                        <div class="contact-value" 
                            data-kor="${this.escapeHtml(korPaymentHTML)}" 
                            data-eng="${this.escapeHtml(engPaymentHTML)}">${korPaymentHTML}</div>
                    </div>`;
            } else {
                gridHTML += `
                    <div class="contact-item">
                        <div class="contact-label" 
                            data-kor="${field.labelKor}" 
                            data-eng="${field.labelEng}">${field.labelKor}</div>
                        <div class="contact-value" 
                            data-kor="${this.escapeHtml(korValueHtml)}" 
                            data-eng="${this.escapeHtml(engValueHtml)}">${korValueHtml}</div>
                    </div>`;
            }
        });
        
        return gridHTML;
    }

    /**
     * PSAC 주차별 교육일정 및 개요 섹션 렌더링
     */
    renderWeeklyOverviewSection() {
        const container = document.querySelector('.psac-weekly-overview-container');
        if (!container || !this.weeklyOverviewData) return;

        container.innerHTML = this.generateWeeklyOverviewTable();
    }

    /**
     * PSAC 주차별 교육일정 및 개요 테이블 생성
     */
    generateWeeklyOverviewTable() {
        const isEnglish = this.currentLang === 'english';
        const koreanRows = this.weeklyOverviewData.korean || [];
        const englishRows = this.weeklyOverviewData.english || [];

        if (!koreanRows.length && !englishRows.length) {
            return `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <p>${isEnglish ? 'No weekly schedule data available.' : '주차별 교육일정 데이터가 없습니다.'}</p>
                </div>
            `;
        }

        const englishByWeek = this.mapByWeekNumber(englishRows);
        const koreanByWeek = this.mapByWeekNumber(koreanRows);
        const rowSource = isEnglish ? englishRows : koreanRows;

        const header = isEnglish
            ? {
                week: 'Weeks',
                period: 'Training Period',
                topic: 'Topic',
                days: 'Days',
                fee: 'Tuition Fee (KRW)<br>※ VAT excluded'
            }
            : {
                week: '주차',
                period: '교육기간',
                topic: '주제',
                days: '일수',
                fee: '교육비(원)<br>※부가세 별도'
            };

        const rowsHtml = rowSource
            .slice()
            .sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0))
            .map(item => {
                const weekText = item.week || '';
                const periodText = item.period || '';
                const topicText = item.topic || '';
                const daysText = item.days || '';
                const feeText = item.fee || '';
                const topicHtml = this.formatTopicText(topicText);

                return `
                    <tr class="psac-weekly-overview-row">
                        <td class="psac-weekly-overview-cell psac-weekly-overview-week">${this.escapeHtml(weekText)}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-period">${this.escapeHtml(periodText)}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-topic">${topicHtml}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-days">${this.escapeHtml(daysText)}</td>
                        <td class="psac-weekly-overview-cell psac-weekly-overview-fee">${this.escapeHtml(feeText)}</td>
                    </tr>
                `;
            })
            .join('');

        return `
            <div class="psac-weekly-overview-table-wrap">
                <table class="psac-weekly-overview-table">
                    <thead>
                        <tr class="psac-weekly-overview-head-row">
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-week">${header.week}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-period">${header.period}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-topic">${header.topic}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-days">${header.days}</th>
                            <th class="psac-weekly-overview-head psac-weekly-overview-head-fee">${header.fee}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * 주차 번호 기준 맵 생성
     */
    mapByWeekNumber(data) {
        const map = {};
        data.forEach(item => {
            if (item && item.weekNumber) {
                map[item.weekNumber] = item;
            }
        });
        return map;
    }
    
    /**
     * 결제 정보 텍스트 HTML 형식으로 변환
     */
    formatPaymentText(text, language) {
        if (!text) return '';
        
        const lines = text.split('\n').filter(line => line.trim());
        let formattedHTML = '';
        
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('-') || line.startsWith('•')) {
                formattedHTML += `<div>${line}</div>`;
            } else {
                formattedHTML += `<div>${line}</div>`;
            }
        });
        
        // 영어의 경우 스타일 조정
        if (language === 'english') {
            formattedHTML = formattedHTML.replace(/style="margin-left: 72px;"/g, '');
        }
        
        return formattedHTML;
    }
    
    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 개행을 <br>로 변환해 화면에서 줄바꿈이 보이도록 처리
     */
    formatMultilineText(text) {
        const escaped = this.escapeHtml(text || '');
        return escaped.replace(/\r\n|\n|\r/g, '<br>');
    }

    /**
     * 주제 셀 텍스트를 줄별로 스타일링
     */
    formatTopicText(text) {
        const lines = this.splitMultilineText(text);

        if (lines.length === 0) {
            return '';
        }

        if (lines.length === 1) {
            return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-first">${this.escapeHtml(lines[0])}</div>`;
        }

        return lines.map((line, index) => {
            const isFirst = index === 0;
            const isLast = index === lines.length - 1;

            if (isFirst) {
                return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-first">${this.escapeHtml(line)}</div>`;
            }

            if (isLast) {
                return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-last">${this.escapeHtml(line)}</div>`;
            }

            return `<div class="psac-weekly-overview-topic-line psac-weekly-overview-topic-line-mid">${this.escapeHtml(line)}</div>`;
        }).join('');
    }

    /**
     * 셀의 줄바꿈을 보존한 텍스트 배열로 분해
     */
    splitMultilineText(text) {
        return (text || '')
            .toString()
            .split(/\r\n|\n|\r/)
            .map(line => line.trim())
            .filter(line => line.length > 0);
    }
    
    /**
     * 데이터 속성 설정
     */
    setupDataAttributes(container) {
        // 이미 data-kor, data-eng 속성이 설정되어 있으므로
        // 기존 언어 전환 시스템이 자동으로 처리함
    }
    
    /**
     * 언어 변경 감지
     */
    setupLanguageObserver() {
        // MutationObserver로 data-lang 변경 감지
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-lang') {
                    this.currentLang = this.detectLanguage();
                    // 언어가 변경되면 기존 시스템이 자동으로 처리하므로 별도 작업 불필요
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-lang']
        });
    }

    /**
     * 기존 언어 전환 이벤트 연동
     */
    setupLanguageChangeHandler() {
        window.addEventListener('languageChanged', (event) => {
            const selected = event?.detail?.language === 'en' ? 'english' : 'korean';
            this.currentLang = selected;
            this.renderWeeklyOverviewSection();
        });
    }
    
    /**
     * 에러 메시지 표시
     */
    showErrorMessage() {
        const containers = [
            document.querySelector('.psac-info-table-container'),
            document.querySelector('.contact-grid'),
            document.querySelector('.psac-weekly-overview-container')
        ];
        
        containers.forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 1rem;"></i>
                        <p data-kor="데이터를 불러올 수 없습니다." data-eng="Failed to load data.">데이터를 불러올 수 없습니다.</p>
                    </div>`;
            }
        });
    }
}

// DOM이 로드되면 PSACOverviewManager 초기화
document.addEventListener('DOMContentLoaded', function() {
    // PSAC 탭이 있는 페이지에서만 실행
    if (document.querySelector('#psac')) {
        window.psacOverviewManager = new PSACOverviewManager();
    }
});