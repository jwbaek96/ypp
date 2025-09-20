/**
 * PSAC 교육일정 관리 스크립트
 * Google Apps Script에서 교육일정 데이터를 가져와 테이블을 동적으로 생성
 */

class PSACScheduleManager {
    constructor() {
        // Apps Script 웹앱 URL (appscript1.gs와 동일한 스프레드시트)
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwIBWN67LFMvxgh61qn3m38RMohUEe--M125_UkS6MfjhhR34m-nGSPGaQSdcXxgk767Q/exec';
        this.scheduleData = null;
        this.currentLanguage = 'korean';
    }

    /**
     * 초기화 함수
     */
    async init() {
        try {
            await this.loadScheduleData();
            this.renderScheduleTable();
            console.log('PSAC Schedule Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PSAC Schedule Manager:', error);
            this.showErrorMessage();
        }
    }

    /**
     * Apps Script에서 교육일정 데이터 로드
     */
    async loadScheduleData() {
        try {
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=get_psac_schedule`);
            const result = await response.json();
            
            if (result.success) {
                this.scheduleData = result.data;
                console.log('Schedule data loaded:', this.scheduleData);
            } else {
                throw new Error(result.error || 'Failed to load schedule data');
            }
        } catch (error) {
            console.error('Error loading schedule data:', error);
            throw error;
        }
    }

    /**
     * 현재 언어 감지
     */
    detectCurrentLanguage() {
        // lang-switch.js의 getCurrentLanguage 함수를 사용하거나
        // 페이지의 언어 상태를 확인
        if (typeof getCurrentLanguage === 'function') {
            const lang = getCurrentLanguage();
            this.currentLanguage = lang === 'eng' ? 'english' : 'korean';
        } else {
            // 폴백: body 클래스나 다른 방법으로 언어 감지
            const bodyClass = document.body.className;
            this.currentLanguage = bodyClass.includes('lang-en') ? 'english' : 'korean';
        }
    }

    /**
     * 테이블 렌더링
     */
    renderScheduleTable() {
        if (!this.scheduleData) {
            console.error('No schedule data available');
            return;
        }

        this.detectCurrentLanguage();
        const scheduleContainer = document.querySelector('.psac-schedule-container');
        
        if (!scheduleContainer) {
            console.error('Schedule container not found');
            return;
        }

        // 새로운 테이블 HTML 생성
        const tableHTML = this.generateTableHTML();
        scheduleContainer.innerHTML = tableHTML;

        console.log('Schedule table rendered successfully');
    }

    /**
     * 테이블 HTML 생성
     */
    generateTableHTML() {
        const data = this.scheduleData[this.currentLanguage];
        
        if (!data || Object.keys(data).length === 0) {
            return this.generateEmptyTableHTML();
        }

        const headerHTML = this.generateTableHeader();
        const bodyHTML = this.generateTableBody(data);

        return `
            <table class="psac-schedule-table">
                ${headerHTML}
                ${bodyHTML}
            </table>
        `;
    }

    /**
     * 테이블 헤더 생성
     */
    generateTableHeader() {
        const isKorean = this.currentLanguage === 'korean';
        
        return `
            <thead>
                <tr>
                    <th colspan="2" class="schedule-header-month" 
                        data-kor="교육기간" 
                        data-eng="Training Period">
                        ${isKorean ? '교육기간' : 'Training Period'}
                    </th>
                    <th class="schedule-header-week" 
                        data-kor="주차" 
                        data-eng="Week">
                        ${isKorean ? '주차' : 'Week'}
                    </th>
                    <th class="schedule-header-subject" 
                        data-kor="주제" 
                        data-eng="Topic">
                        ${isKorean ? '주제' : 'Topic'}
                    </th>
                    <th class="schedule-header-instructor" 
                        data-kor="담당 강사" 
                        data-eng="Instructor">
                        ${isKorean ? '담당 강사' : 'Instructor'}
                    </th>
                </tr>
            </thead>
        `;
    }

    /**
     * 테이블 바디 생성
     */
    generateTableBody(data) {
        let bodyHTML = '<tbody>';
        
        // 월별로 정렬된 키 생성
        const sortedMonths = this.getSortedMonths(Object.keys(data));
        
        // 양쪽 언어 데이터 모두 가져오기
        const koreanData = this.scheduleData.korean;
        const englishData = this.scheduleData.english;
        
        sortedMonths.forEach(month => {
            const monthData = data[month];
            if (!monthData || monthData.length === 0) return;
            
            // 월별 데이터를 주차순으로 정렬
            const sortedWeeks = monthData.sort((a, b) => a.weekNumber - b.weekNumber);
            
            sortedWeeks.forEach((weekData, index) => {
                const isFirstRow = index === 0;
                const rowspan = sortedWeeks.length;
                
                // 해당 주차의 영어/한국어 데이터 찾기
                const weekNumber = weekData.weekNumber;
                const koreanWeekData = this.findWeekDataByNumber(koreanData, weekNumber);
                const englishWeekData = this.findWeekDataByNumber(englishData, weekNumber);
                
                // 월 이름 매핑
                const monthKor = this.getMonthName(month, 'korean');
                const monthEng = this.getMonthName(month, 'english');
                
                bodyHTML += `
                    <tr class="month-row">
                        ${isFirstRow ? `<td rowspan="${rowspan}" class="month-cell" data-kor="${monthKor}" data-eng="${monthEng}">${month}</td>` : ''}
                        <td class="date-cell" 
                            data-kor="${koreanWeekData?.period || ''}" 
                            data-eng="${englishWeekData?.period || ''}"></td>
                        <td class="week-cell" 
                            data-kor="${koreanWeekData?.week || weekNumber || ''}" 
                            data-eng="${englishWeekData?.week || weekNumber || ''}"></td>
                        <td class="subject-cell" 
                            data-kor="${koreanWeekData?.topic || ''}" 
                            data-eng="${englishWeekData?.topic || ''}"></td>
                        <td class="instructor-cell" 
                            data-kor="${koreanWeekData?.instructor || ''}" 
                            data-eng="${englishWeekData?.instructor || ''}"></td>
                    </tr>
                `;
            });
        });
        
        bodyHTML += '</tbody>';
        return bodyHTML;
    }

    /**
     * 주차 번호로 해당 언어의 데이터 찾기
     */
    findWeekDataByNumber(languageData, weekNumber) {
        if (!languageData) return null;
        
        for (const month in languageData) {
            const weekData = languageData[month].find(item => item.weekNumber === weekNumber);
            if (weekData) return weekData;
        }
        return null;
    }

    /**
     * 월 이름을 지정된 언어로 변환
     */
    getMonthName(currentMonth, targetLanguage) {
        const monthMapping = {
            korean: {
                '9월': '9월', '10월': '10월', '11월': '11월', '12월': '12월',
                'September': '9월', 'October': '10월', 'November': '11월', 'December': '12월'
            },
            english: {
                '9월': 'September', '10월': 'October', '11월': 'November', '12월': 'December',
                'September': 'September', 'October': 'October', 'November': 'November', 'December': 'December'
            }
        };
        
        return monthMapping[targetLanguage]?.[currentMonth] || currentMonth;
    }

    /**
     * 월 정렬 (9월, 10월, 11월, 12월 순서)
     */
    getSortedMonths(months) {
        const monthOrder = this.currentLanguage === 'korean' 
            ? ['9월', '10월', '11월', '12월']
            : ['September', 'October', 'November', 'December'];
        
        return monthOrder.filter(month => months.includes(month));
    }

    /**
     * 빈 테이블 HTML 생성 (데이터가 없는 경우)
     */
    generateEmptyTableHTML() {
        const isKorean = this.currentLanguage === 'korean';
        const message = isKorean ? '교육일정 데이터를 불러오는 중입니다...' : 'Loading schedule data...';
        
        return `
            <table class="psac-schedule-table">
                ${this.generateTableHeader()}
                <tbody>
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
                            ${message}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    /**
     * 에러 메시지 표시
     */
    showErrorMessage() {
        const scheduleContainer = document.querySelector('.psac-schedule-container');
        if (!scheduleContainer) return;

        const isKorean = this.currentLanguage === 'korean';
        const errorMessage = isKorean 
            ? '교육일정을 불러오는 중 오류가 발생했습니다.' 
            : 'An error occurred while loading the schedule.';

        scheduleContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>${errorMessage}</p>
            </div>
        `;
    }

    /**
     * 언어 변경 시 테이블 업데이트
     */
    updateLanguage() {
        this.detectCurrentLanguage();
        this.renderScheduleTable();
    }

    /**
     * 데이터 새로고침
     */
    async refresh() {
        try {
            await this.loadScheduleData();
            this.renderScheduleTable();
        } catch (error) {
            console.error('Failed to refresh schedule data:', error);
        }
    }
}

// 전역 인스턴스 생성
let psacScheduleManager;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    psacScheduleManager = new PSACScheduleManager();
    await psacScheduleManager.init();
});

// 언어 변경 시 테이블 업데이트 (기존 언어 변경 시스템과 연동)
document.addEventListener('languageChanged', () => {
    if (psacScheduleManager) {
        psacScheduleManager.updateLanguage();
    }
});

// 전역 함수로 노출 (필요한 경우)
window.updatePSACSchedule = () => {
    if (psacScheduleManager) {
        psacScheduleManager.refresh();
    }
};