/**
 * RelaySchool 과목 상세 정보 동적 관리 클래스
 * SHEET_RS_B 데이터를 기반으로 커리큘럼 섹션에 통합
 */

class RelaySchoolDetailsManager {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbzVwT_a8MDrI2-GJvicN0aEXzxN2vDjm5Tr6uvNLWOMzss9sC7uRtc98ErZ9fLlNqAybQ/exec';
        this.currentLang = this.detectLanguage();
        this.detailsData = null;
        this.selectedCourseId = null;
        
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
            await this.loadDetailsData();
            this.setupCourseSelector();
            this.setupLanguageObserver();
        } catch (error) {
            console.error('PSAC Details initialization failed:', error);
            this.showErrorMessage();
        }
    }
    
    /**
     * 과목 상세 데이터 로드
     */
    async loadDetailsData() {
        try {
            console.log('Requesting data from:', `${this.apiUrl}?action=get_rs_details`);
            const response = await fetch(`${this.apiUrl}?action=get_rs_details`);
            const result = await response.json();
            
            console.log('Raw API response:', result);
            
            if (result.success) {
                this.detailsData = result.data;
                console.log('RelaySchool Details data loaded:', this.detailsData);
                console.log('Number of courses found:', this.detailsData.courses ? this.detailsData.courses.length : 0);
                
                if (this.detailsData.courses && this.detailsData.courses.length > 0) {
                    console.log('First course data:', this.detailsData.courses[0]);
                } else {
                    console.warn('No courses found in the data');
                }
            } else {
                console.error('API returned error:', result.error || 'Unknown error');
                throw new Error('Failed to load details data');
            }
        } catch (error) {
            console.error('Error loading details data:', error);
            throw error;
        }
    }
    
    /**
     * 과정 선택 및 아코디언 구조 설정
     */
    setupCourseSelector() {
        if (!this.detailsData || !this.detailsData.courses) {
            this.showCurriculumError();
            return;
        }
        
        // 커리큘럼 컨테이너 찾기
        const curriculumContainer = document.querySelector('#rs-curriculum .curriculum-container');
        if (!curriculumContainer) {
            console.error('RelaySchool curriculum container not found');
            return;
        }
        
        // 로딩 상태 제거
        this.removeCurriculumLoading();
        
        // 아코디언 구조 생성
        const curriculumHTML = this.generateCurriculumContainer();
        curriculumContainer.innerHTML = curriculumHTML;
        
        console.log('RelaySchool curriculum accordion generated successfully');
    }
    
    /**
     * 커리큘럼 컨테이너 HTML 생성 (아코디언 형태)
     */
    generateCurriculumContainer() {
        let containerHTML = '';
        
        // 각 과정별로 아코디언 아이템 생성
        this.detailsData.courses.forEach((course, index) => {
            const uniqueId = `course-${course.id || index}`;
            const weekNumber = index + 1;
            
            containerHTML += `
                <div class="curriculum-week">
                    <input type="checkbox" id="${uniqueId}" class="curriculum-checkbox">
                    <label for="${uniqueId}" class="curriculum-header">
                        <div class="week-info">
                            <span class="week-title" 
                                  data-kor="${this.escapeHtml(course.titleKR || course.title)}"
                                  data-eng="${this.escapeHtml(course.titleEN || course.title)}">${course.titleKR || course.title}</span>
                        </div>
                    </label>
                    <div class="curriculum-content">
                        <div class="week-detail-container">
                            ${this.generateCourseDetailsHTML(course)}
                        </div>
                    </div>
                </div>
            `;
        });
        
        return containerHTML;
    }
    
    /**
     * 과정 상세 HTML 생성
     */
    generateCourseDetailsHTML(course) {
        let detailsHTML = `
            <!-- 시간표 섹션 -->
            <div class="psac-schedule-section">
                <div class="daily-schedule-container">
                    ${this.generateScheduleTable(course.schedule)}
                </div>
            </div>
            
            <!-- 강사 소개 섹션 -->
            <div class="psac-instructor-section">
                <h4 data-kor="강사 소개" data-eng="Instructor Introduction">강사 소개</h4>
                ${this.generateInstructorList(course.instructors)}
            </div>
        `;
        
        // 추가 정보가 있다면 포함
        if (course.objective) {
            detailsHTML = `
                <!-- 학습목표 -->
                <div class="course-objective">
                    <h5 class="objective-title" data-kor="학습목표" data-eng="Learning Objectives">학습목표</h5>
                    <p class="objective-content" 
                       data-kor="${this.escapeHtml(course.objective.korean || course.objective)}"
                       data-eng="${this.escapeHtml(course.objective.english || course.objective)}">${course.objective.korean || course.objective}</p>
                </div>
            ` + detailsHTML;
        }
        
        if (course.curriculum) {
            detailsHTML += `
                <!-- 교육내용 -->
                <div class="course-curriculum">
                    <h5 class="curriculum-title" data-kor="교육내용" data-eng="Curriculum">교육내용</h5>
                    <div class="curriculum-content" 
                         data-kor="${this.escapeHtml(this.formatListContent(course.curriculum.korean || course.curriculum))}"
                         data-eng="${this.escapeHtml(this.formatListContent(course.curriculum.english || course.curriculum))}">${this.formatListContent(course.curriculum.korean || course.curriculum)}</div>
                </div>
            `;
        }
        
        return detailsHTML;
    }
    
    /**
     * 시간표 테이블 생성
     */
    generateScheduleTable(schedule) {
        if (!schedule) {
            return '<p data-kor="시간표 정보가 없습니다." data-eng="No schedule information available.">시간표 정보가 없습니다.</p>';
        }

        // 기존 정적 구조와 동일한 시간표 헤더
        let tableHTML = `
            <table class="daily-schedule-table">
                <thead>
                    <tr>
                        <th class="time-header" data-kor="시간<br>요일" data-eng="Time<br>Day">시간<br>요일</th>
                        <th class="period-header" data-kor="1교시<br>09:10-10:00" data-eng="1st Period<br>09:10-10:00">1교시<br>09:10-10:00</th>
                        <th class="period-header" data-kor="2교시<br>10:10-11:00" data-eng="2nd Period<br>10:10-11:00">2교시<br>10:10-11:00</th>
                        <th class="period-header" data-kor="3교시<br>11:10-12:00" data-eng="3rd Period<br>11:10-12:00">3교시<br>11:10-12:00</th>
                        <th class="period-header" data-kor="4교시<br>13:10-14:00" data-eng="4th Period<br>13:10-14:00">4교시<br>13:10-14:00</th>
                        <th class="period-header" data-kor="5교시<br>14:10-15:00" data-eng="5th Period<br>14:10-15:00">5교시<br>14:10-15:00</th>
                        <th class="period-header" data-kor="6교시<br>15:10-16:00" data-eng="6th Period<br>15:10-16:00">6교시<br>15:10-16:00</th>
                        <th class="period-header" data-kor="7교시<br>16:10-17:00" data-eng="7th Period<br>16:10-17:00">7교시<br>16:10-17:00</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // 스케줄 데이터에 따라 동적 생성
        if (schedule.days && Array.isArray(schedule.days)) {
            schedule.days.forEach((dayData, index) => {
                tableHTML += this.generateScheduleRow(dayData, index);
            });
        } else {
            // 기본 형태의 스케줄이 있다면 변환
            tableHTML += this.generateDefaultScheduleRows(schedule);
        }
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        return tableHTML;
    }
    
    /**
     * 스케줄 행 생성
     */
    generateScheduleRow(dayData, index) {
        const dayName = dayData.day || `Day ${index + 1}`;
        const date = dayData.date || '';
        const isOpeningDay = dayData.isOpening || false;
        
        let rowHTML = `<tr class="day-row${isOpeningDay ? ' opening-day' : ''}">`;
        rowHTML += `<td class="day-cell" data-kor="${dayName}<br>${date}" data-eng="${this.translateDay(dayName)}<br>${date}">${dayName}<br>${date}</td>`;
        
        if (isOpeningDay) {
            rowHTML += `<td colspan="7" class="opening-cell" data-kor="${dayData.note}" data-eng="${dayData.noteEng || dayData.note}">${dayData.note}</td>`;
        } else if (dayData.subjects && Array.isArray(dayData.subjects)) {
            dayData.subjects.forEach((subject, subIndex) => {
                const colspan = subject.colspan || 1;
                const cellClass = subject.subject ? 'class-cell' : 'empty-cell';
                const subjectClass = subject.type ? ` ${subject.type}` : '';
                
                if (subject.subject) {
                    const instructorHTML = subject.instructor ? `<p class="instructor-cell">${subject.instructor}</p>` : '';
                    rowHTML += `<td class="${cellClass}${subjectClass}" colspan="${colspan}" 
                                   data-kor="${this.escapeHtml(subject.subject)}${instructorHTML ? `<p class='instructor-cell'>${subject.instructor}</p>` : ''}"
                                   data-eng="${this.escapeHtml(subject.subjectEng || subject.subject)}${instructorHTML ? `<p class='instructor-cell'>${subject.instructorEng || subject.instructor}</p>` : ''}">${subject.subject}${instructorHTML}</td>`;
                } else {
                    rowHTML += `<td class="${cellClass}" colspan="${colspan}"></td>`;
                }
            });
        } else {
            // 빈 셀들로 채우기
            for (let i = 0; i < 7; i++) {
                rowHTML += `<td class="empty-cell"></td>`;
            }
        }
        
        rowHTML += `</tr>`;
        return rowHTML;
    }

    /**
     * 기본 스케줄 행들 생성 (백업용)
     */
    generateDefaultScheduleRows(schedule) {
        let rowsHTML = `
            <tr class="day-row opening-day">
                <td class="day-cell" data-kor="개강일" data-eng="Opening Day">개강일</td>
                <td colspan="7" class="opening-cell" data-kor="스케줄 정보를 불러오는 중입니다..." data-eng="Loading schedule information...">스케줄 정보를 불러오는 중입니다...</td>
            </tr>
        `;
        return rowsHTML;
    }

    /**
     * 강사 리스트 생성
     */
    generateInstructorList(instructors) {
        if (!instructors) {
            return '<ul><li data-kor="강사 정보가 없습니다." data-eng="No instructor information available.">강사 정보가 없습니다.</li></ul>';
        }

        let instructorHTML = '<ul>';
        
        if (Array.isArray(instructors)) {
            instructors.forEach(instructor => {
                const name = instructor.name || instructor;
                const affiliation = instructor.affiliation || '';
                const nameEng = instructor.nameEng || name;
                const affiliationEng = instructor.affiliationEng || affiliation;
                
                instructorHTML += `
                    <li data-kor="${this.escapeHtml(name)} - ${this.escapeHtml(affiliation)}" 
                        data-eng="${this.escapeHtml(nameEng)} - ${this.escapeHtml(affiliationEng)}">
                        <strong>${name}</strong> - ${affiliation}
                    </li>
                `;
            });
        } else if (typeof instructors === 'string') {
            // 문자열인 경우 줄바꿈으로 분리하여 처리
            const instructorLines = instructors.split('\n').filter(line => line.trim());
            instructorLines.forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine) {
                    instructorHTML += `<li>${this.escapeHtml(cleanLine)}</li>`;
                }
            });
        }
        
        instructorHTML += '</ul>';
        return instructorHTML;
    }

    /**
     * 요일 번역
     */
    translateDay(dayKor) {
        const dayMap = {
            '월': 'Mon',
            '화': 'Tue', 
            '수': 'Wed',
            '목': 'Thu',
            '금': 'Fri',
            '토': 'Sat',
            '일': 'Sun'
        };
        return dayMap[dayKor] || dayKor;
    }

    /**
     * 커리큘럼 로딩 제거
     */
    removeCurriculumLoading() {
        const curriculumContainer = document.querySelector('#rs-curriculum .curriculum-container');
        if (curriculumContainer && curriculumContainer.innerHTML.includes('fa-spinner')) {
            curriculumContainer.innerHTML = '';
        }
    }

    /**
     * 커리큘럼 에러 표시
     */
    showCurriculumError() {
        const curriculumContainer = document.querySelector('#rs-curriculum .curriculum-container');
        if (curriculumContainer) {
            curriculumContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 1rem;"></i>
                    <p data-kor="커리큘럼 정보를 불러올 수 없습니다." data-eng="Failed to load curriculum information.">커리큘럼 정보를 불러올 수 없습니다.</p>
                </div>`;
        }
    }
    
    /**
     * 과목 셀 포맷팅
     */
    formatSubjectCell(subject) {
        if (!subject) return '';
        
        // 줄바꿈을 <br>로 변환
        let formatted = subject.replace(/\n/g, '<br>');
        
        // 강사명 스타일링 (마지막 줄이 강사명인 경우)
        const lines = subject.split('\n');
        if (lines.length > 1) {
            const lastLine = lines[lines.length - 1].trim();
            // 한국어 이름 패턴 또는 영어 이름 패턴 감지
            if (lastLine.length <= 15 && (lastLine.match(/^[가-힣\s]+$/) || lastLine.match(/^[A-Za-z\s\-\.]+$/))) {
                // 기존 스타일과 동일하게 <p class="instructor-cell"> 사용
                const subjectText = lines.slice(0, -1).join('<br>');
                formatted = `${subjectText}<p class="instructor-cell">${lastLine}</p>`;
            }
        }
        
        return formatted;
    }
    
    /**
     * 리스트 내용 포맷팅
     */
    formatListContent(content) {
        if (!content) return '';
        
        // content가 문자열이 아닌 경우 처리
        if (typeof content !== 'string') {
            if (typeof content === 'object' && content.korean) {
                content = content.korean;
            } else if (Array.isArray(content)) {
                content = content.join('\n');
            } else {
                content = String(content);
            }
        }
        
        // 불릿 포인트로 시작하는 줄들을 <ul><li>로 변환
        const lines = content.split('\n').filter(line => line.trim());
        let formatted = '';
        let inList = false;
        
        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('•') || line.startsWith('-')) {
                if (!inList) {
                    formatted += '<ul>';
                    inList = true;
                }
                formatted += `<li>${line.substring(1).trim()}</li>`;
            } else {
                if (inList) {
                    formatted += '</ul>';
                    inList = false;
                }
                formatted += `<p>${line}</p>`;
            }
        });
        
        if (inList) {
            formatted += '</ul>';
        }
        
        return formatted;
    }
    
    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        if (!text) return '';
        
        // 문자열이 아닌 경우 처리
        if (typeof text !== 'string') {
            text = String(text);
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 언어 변경 감지
     */
    setupLanguageObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-lang') {
                    this.currentLang = this.detectLanguage();
                    // 언어 변경 시 아코디언 내용 다시 생성
                    this.setupCourseSelector();
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-lang']
        });
    }
    
    /**
     * 에러 메시지 표시 (기존 메서드 유지)
     */
    showErrorMessage() {
        const curriculumSection = document.querySelector('#rs-curriculum .block-content');
        if (curriculumSection) {
            curriculumSection.innerHTML = `
                <div class="curriculum-container">
                    <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; margin-bottom: 1rem;"></i>
                        <p data-kor="RelaySchool 과목 상세 정보를 불러올 수 없습니다." data-eng="Failed to load RelaySchool course details.">RelaySchool 과목 상세 정보를 불러올 수 없습니다.</p>
                    </div>
                </div>`;
        }
    }
}

// DOM이 로드되면 RelaySchoolDetailsManager 초기화
document.addEventListener('DOMContentLoaded', function() {
    // Relay School 탭이 있는 페이지에서만 실행
    if (document.querySelector('#relay-school')) {
        window.relaySchoolDetailsManager = new RelaySchoolDetailsManager();
    }
});