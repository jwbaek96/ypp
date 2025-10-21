/**
 * PSAC 개요 및 신청방법 동적 관리 클래스
 * SHEET_PSAC_B 데이터를 기반으로 HTML을 동적 생성
 */

class PSACOverviewManager {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbxLQuDmLl1OGMiWuw_AoQw25QOOKtBxyXW2cv9p1TM9ljGOyXWwGA0mk12SGith4t1umQ/exec';
        this.currentLang = this.detectLanguage();
        this.overviewData = null;
        
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
            
            tableHTML += `
                <tr>
                    <th class="info-label" 
                        data-eng="${field.labelEng}" 
                        data-kor="${field.labelKor}">${field.labelKor}</th>
                    <td class="info-value" 
                        data-eng="${this.escapeHtml(engValue)}" 
                        data-kor="${this.escapeHtml(korValue)}">${korValue}</td>
                </tr>`;
        });
        
        // 교육비 정보 (특별 처리 - HTML 형식 유지)
        const tuitionKor = this.formatTuitionText(korData['교육비'] || '', 'korean');
        const tuitionEng = this.formatTuitionText(engData['교육비'] || '', 'english');
        
        tableHTML += `
            <tr>
                <th class="week-label" 
                    data-eng="Tuition<br>(VAT excluded)" 
                    data-kor="교육비">교육비</th>
                <td class="price-value"
                    data-eng="${this.escapeHtml(tuitionEng)}"
                    data-kor="${this.escapeHtml(tuitionKor)}">${tuitionKor}</td>
            </tr>`;
        
        tableHTML += `
                </tbody>
            </table>`;
        
        return tableHTML;
    }
    
    /**
     * 교육비 텍스트 HTML 형식으로 변환
     */
    formatTuitionText(text, language) {
        if (!text) return '';
        
        // 줄바꿈을 <p> 태그로 변환
        const lines = text.split('\n').filter(line => line.trim());
        let formattedHTML = '';
        
        lines.forEach(line => {
            line = line.trim();
            
            // ※로 시작하는 특별 정보는 그대로 처리
            if (line.startsWith('※')) {
                formattedHTML += `<p>${line}</p>`;
                return;
            }
            
            if (line.includes('주') || line.includes('Week')) {
                // 주차별 교육비 정보 파싱 (더 정확한 패턴 매칭)
                if (language === 'korean') {
                    // 한국어: "1주 9.2(화)~4(목) 110만원" 형식
                    const match = line.match(/^(\d+주\s+[^0-9]+)\s*(\d+(?:,\d{3})*만원)$/);
                    if (match) {
                        formattedHTML += `<p><span>${match[1]}</span><span> ${match[2]}</span></p>`;
                    } else {
                        // 매칭되지 않으면 원본 그대로
                        formattedHTML += `<p>${line}</p>`;
                    }
                } else {
                    // 영어: "Week 1: Sep 2 (Tue) ~ Sep 4 (Thu) 1,100,000 KRW" 형식
                    const match = line.match(/^(Week\s+\d+:\s+[^0-9]+)\s*(\d+(?:,\d{3})*\s+KRW)$/);
                    if (match) {
                        formattedHTML += `<p><span>${match[1]}</span><span> ${match[2]}</span></p>`;
                    } else {
                        // 매칭되지 않으면 원본 그대로
                        formattedHTML += `<p>${line}</p>`;
                    }
                }
            } else {
                // 일반 정보 (전체 수강, VAT 등)
                formattedHTML += `<p>${line}</p>`;
            }
        });
        
        return formattedHTML;
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
                            data-kor="${this.escapeHtml(korValue)}" 
                            data-eng="${this.escapeHtml(engValue)}">${korValue}</div>
                    </div>`;
            }
        });
        
        return gridHTML;
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
     * 에러 메시지 표시
     */
    showErrorMessage() {
        const containers = [
            document.querySelector('.psac-info-table-container'),
            document.querySelector('.contact-grid')
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