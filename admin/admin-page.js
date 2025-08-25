// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    const clock = new Clock(); // 시계 인스턴스 생성
    clock.start(); // 시계 시작
    const pageManager = new PageManager(); // 페이지 매니저 생성
    window.pageManagerInstance = pageManager; // 전역 변수로 저장
    pageManager.init(); // 페이지 초기화
    
    // ESC 키로 모달 닫기 기능 추가
    setupModalKeyboardEvents();
});

// 시계 클래스
class Clock {
    constructor() {
        this.intervalId = null;
    }
    
    start() {
        this.updateClock(); // 즉시 시계 업데이트
        this.intervalId = setInterval(() => this.updateClock(), 1000); // 1초마다 업데이트
    }
    
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    updateClock() {
        const now = new Date();
        
        // 시간 계산 (12시간 형식)
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        
        // 12시간 형식으로 변환
        if (hours > 12) {
            hours = hours - 12;
        } else if (hours === 0) {
            hours = 12;
        }
        
        // 날짜 계산
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        
        // DOM 업데이트 (한자리수도 그대로 표시)
        document.getElementById('clock-hours').textContent = hours.toString();
        document.getElementById('clock-minutes').textContent = minutes.toString().padStart(2, '0'); // 분은 항상 2자리
        document.getElementById('clock-period').textContent = period;
        document.getElementById('clock-date').textContent = `${year}년 ${month}월 ${date}일`;
    }
}
// ===========================================================================================
// 날짜/시간 유틸리티 함수들
// ===========================================================================================

/**
 * datetime 문자열을 날짜와 시간으로 분리하는 함수
 * @param {string} datetime - "YYYY-MM-DD HH:mm:ss" 또는 "YYYY-MM-DD" 형식의 문자열
 * @returns {Object} {date: "YYYY-MM-DD", time: "HH:mm:ss", dateOnly: "YYYY-MM-DD", timeOnly: "HH:mm"}
 */
function parseDatetime(datetime) {
    if (!datetime || typeof datetime !== 'string') {
        return { date: '-', time: '-', dateOnly: '-', timeOnly: '-' };
    }
    
    try {
        const parts = datetime.split(' ');
        if (parts.length >= 2) {
            // 날짜와 시간이 모두 있는 경우
            const datePart = parts[0]; // YYYY-MM-DD
            const timePart = parts[1]; // HH:mm:ss
            const timeOnly = timePart.substring(0, 5); // HH:mm만 추출
            
            return {
                date: datePart,
                time: timePart,
                dateOnly: datePart,
                timeOnly: timeOnly
            };
        } else if (parts.length === 1 && datetime.includes('-')) {
            // 날짜만 있는 경우 (YYYY-MM-DD)
            const datePart = parts[0];
            return {
                date: datePart,
                time: '-',
                dateOnly: datePart,
                timeOnly: '-' // 시간이 없으면 "-" 대신 빈 문자열로 처리
            };
        }
        
        return { date: datetime, time: '-', dateOnly: datetime, timeOnly: '-' };
        
    } catch (error) {
        console.error('parseDatetime 에러:', error);
        return { date: datetime, time: '-', dateOnly: datetime, timeOnly: '-' };
    }
}

function formatKoreanDate(dateStr) {
    if (!dateStr || dateStr === '-') return '-';
    
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[0]}년 ${parseInt(parts[1])}월 ${parseInt(parts[2])}일`;
        }
        return dateStr;
    } catch (error) {
        return dateStr;
    }
}
// ===========================================================================================

function formatKoreanTime(timeStr) {
    if (!timeStr || timeStr === '-') return '-';
    
    try {
        const timeParts = timeStr.split(':');
        if (timeParts.length >= 2) {
            let hour = parseInt(timeParts[0]);
            const minute = timeParts[1];
            const period = hour >= 12 ? '오후' : '오전';
            
            if (hour > 12) hour -= 12;
            if (hour === 0) hour = 12;
            
            return `${period} ${hour}:${minute}`;
        }
        return timeStr;
    } catch (error) {
        return timeStr;
    }
}

// ===========================================================================================
// 페이지 관리 클래스
class PageManager {
    constructor() {
        // Google Apps Script 웹앱 URL (index.html과 동일)
        this.DASHBOARD_APPS_SCRIPT_ID = 'AKfycbye3yDhu02ftky51LcYHEjcFr1zk71hCpgVlw152tdAbLSoCX2PpM8vesS-tSIgg51T';
        this.appsScriptUrl = `https://script.google.com/macros/s/${this.DASHBOARD_APPS_SCRIPT_ID}/exec`;
        this.pageConfigs = this.initPageConfigs();
        this.isDescending = true; // 기본값: 최신순 (내림차순)
        this.currentData = null; // 현재 로드된 데이터 저장
        this.currentConfig = null; // 현재 설정 저장
        this.currentCategoryFilter = 'all'; // 카테고리 필터 상태 (all, psac, relay)
    }
    
    // 페이지별 설정 데이터 초기화
    initPageConfigs() {
        return {
            '팝업': {
                title: '팝업',
                description: '홈페이지 팝업 관리',
                location: '홈 > 팝업',
                link: '/',
                apiSheet: 'SHEET_DASHBOARD', // 임시
                dataKey: 'popup',
            },
            '인허가': {
                title: '갤러리 인허가',
                description: '인허가 관련 갤러리 이미지 관리',
                location: '회사소개 > 기업현황 > 인허가',
                link: '/pages/company/business.html',
                apiSheet: 'SHEET_GAL_A',
                dataKey: 'galA',
                createlink: 'https://tally.so/r/31e5NQ'
            },
            '유자격': {
                title: '갤러리 유자격',
                description: '유자격 관련 갤러리 이미지 관리',
                location: '회사소개 > 기업현황 > 유자격',
                link: '/pages/company/business.html',
                apiSheet: 'SHEET_GAL_B',
                dataKey: 'galB',
                createlink: 'https://tally.so/r/m6l5WP'
            },
            '인사이드': {
                title: '갤러리 인사이드',
                description: '인사이드 관련 갤러리 컨텐츠 관리',
                location: '홍보 > 갤러리 > 인사이드',
                link: '/pages/media/gallery/inside.html',
                apiSheet: 'SHEET_GAL_C',
                dataKey: 'galC',
                createlink: 'https://tally.so/r/n09LMN'
            },
            '아카데미': {
                title: '갤러리 아카데미',
                description: '아카데미 관련 갤러리 컨텐츠 관리',
                location: '홍보 > 갤러리 > 아카데미 갤러리',
                link: '/pages/media/gallery/academy.html',
                apiSheet: 'SHEET_GAL_F',
                dataKey: 'galD',
                createlink: 'https://tally.so/r/wojrpX'
            },
            '보도자료': {
                title: '보도자료',
                description: '언론 보도자료 및 뉴스 관리',
                location: '홍보 > 게시판 > 보도자료',
                link: '/pages/media/newsroom/press.html',
                apiSheet: 'SHEET_BOARD_NEWS',
                dataKey: 'boardNews',
                createlink: 'https://tally.so/r/3qr11G'
            },
            'PSAC': {
                title: 'PSAC 신청',
                description: 'PSAC 교육과정 신청서 관리',
                location: '아카데미 > PSAC',
                link: '/pages/academy/index.html?tab=psac',
                apiSheet: 'SHEET_APPLY_P',
                dataKey: 'applyPSAC',
                createlink: '/pages/academy/index.html?tab=apply'
            },
            'RelaySchool': {
                title: 'Relay School 신청',
                description: 'Relay School 교육과정 신청서 관리',
                location: '아카데미 > Relay School',
                link: '/pages/academy/index.html?tab=relay-school',
                apiSheet: 'SHEET_APPLY_R',
                dataKey: 'applyRelay',
                createlink: '/pages/academy/index.html?tab=apply'
            },
            '자주묻는질문': {
                title: '자주 묻는 질문',
                description: 'FAQ 관리',
                location: '고객센터 > FAQ',
                link: '/pages/support/index.html',
                apiSheet: 'SHEET_DASHBOARD', // 임시
                dataKey: 'faq',
                createlink: ''
            },
            '고객문의': {
                title: '고객문의',
                description: '고객 문의사항 관리',
                location: '고객센터 > 문의하기',
                link: '/pages/support/index.html#contact',
                apiSheet: 'SHEET_HELP_KR',
                dataKey: 'helpKR'
            },
            '부패및윤리신고': {
                title: '부패 및 윤리 신고',
                description: '부패신고 및 윤리위반 신고 관리',
                location: 'ESG > 지배구조 > 부패 및 윤리 신고',
                link: '/pages/esg/esg.html#governance-report',
                apiSheet: 'SHEET_REPORT',
                dataKey: 'report'
            }
        };
    }
    
    // 페이지 초기화
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        
        if (!pageParam) {
            this.showError('페이지 파라미터가 없습니다.');
            return;
        }
        
        const config = this.pageConfigs[pageParam];
        if (!config) {
            this.showError(`알 수 없는 페이지: ${pageParam}`);
            return;
        }
        
        // 페이지 정보 업데이트
        this.updatePageInfo(config);
        
        // 데이터 카운트 로드
        await this.loadPageCount(config);
        
        
        // 실제 데이터 로드 및 테이블 렌더링
        await this.loadPageData(config);
        
        // 새로 추가 버튼 이벤트 설정
        this.setupAddButton();
        
        // 정렬 토글 버튼 이벤트 설정
        this.setupSortToggle();
        
        // 카테고리 필터 버튼 설정
        this.setupCategoryFilter();
        
        // 교육과정 버튼 설정 (PSAC, RelaySchool 페이지에서만 표시)
        this.setupCurriculumButton(pageParam);
        
        // 삭제 버튼 이벤트 설정
        this.setupDeleteButtons();
    }
    
    // 교육과정 관리 버튼 설정
    setupCurriculumButton(pageType) {
        const curriculumBtn = document.getElementById('btn-curriculum');
        
        // PSAC 또는 RelaySchool 페이지에서만 버튼 표시
        if (['PSAC', 'RelaySchool'].includes(pageType)) {
            curriculumBtn.style.display = 'block';
            
            // 버튼 클릭 이벤트
            curriculumBtn.addEventListener('click', () => {
                alert('준비중입니다.')
                // this.showCurriculumModal(pageType);
            });
        } else {
            curriculumBtn.style.display = 'none';
        }
    }
    
    // 교육과정 관리 모달 표시
    showCurriculumModal(pageType) {
        const title = pageType === 'PSAC' ? 'PSAC 교육과정 관리' : 'Relay School 교육과정 관리';
        
        // 모달 요소 생성
        const modal = document.getElementById('curriculum-modal') || this.createCurriculumModal();
        
        // 모달 제목 설정
        modal.querySelector('.modal-title').textContent = title;
        
        // 페이지 타입에 따라 데이터 로드 및 표시
        this.loadCurriculumData(pageType);
        
        // 모달 표시
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
    
    // 교육과정 관리 모달 생성
    createCurriculumModal() {
        // 이미 존재하면 반환
        if (document.getElementById('curriculum-modal')) {
            return document.getElementById('curriculum-modal');
        }
        
        // 모달 HTML 생성
        const modalHtml = `
            <div id="curriculum-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">교육과정 관리</h2>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div class="curriculum-container">
                            <div class="curriculum-list">
                                <h3>교육과정 목록</h3>
                                <div id="curriculum-items"></div>
                                <button id="add-curriculum" class="btn btn-sm btn-primary">
                                    <i class="fas fa-plus"></i> 과정 추가
                                </button>
                            </div>
                            <div class="curriculum-form">
                                <h3>과정 정보</h3>
                                <div id="curriculum-form">
                                    <div class="form-group">
                                        <label for="curriculum-name">과정명</label>
                                        <input type="text" id="curriculum-name" class="form-control">
                                    </div>
                                    <div class="form-group">
                                        <label for="curriculum-description">설명</label>
                                        <textarea id="curriculum-description" class="form-control" rows="3"></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label for="curriculum-date">일정</label>
                                        <input type="text" id="curriculum-date" class="form-control">
                                    </div>
                                    <div class="form-group">
                                        <label for="curriculum-price">금액</label>
                                        <input type="text" id="curriculum-price" class="form-control">
                                    </div>
                                    <div class="form-actions">
                                        <button id="save-curriculum" class="btn btn-primary">저장</button>
                                        <button id="cancel-curriculum" class="btn btn-secondary">취소</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // DOM에 추가
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // 닫기 이벤트 설정
        const modal = document.getElementById('curriculum-modal');
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            document.body.classList.remove('modal-open');
        });
        
        // 모달 외부 클릭으로 닫기
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('show');
                document.body.classList.remove('modal-open');
            }
        });
        
        // 과정 추가 버튼 이벤트
        const addCurriculumBtn = document.getElementById('add-curriculum');
        addCurriculumBtn.addEventListener('click', () => {
            this.resetCurriculumForm();
            document.getElementById('curriculum-name').focus();
        });
        
        // 저장 버튼 이벤트
        const saveCurriculumBtn = document.getElementById('save-curriculum');
        saveCurriculumBtn.addEventListener('click', () => {
            this.saveCurriculumData();
        });
        
        // 취소 버튼 이벤트
        const cancelCurriculumBtn = document.getElementById('cancel-curriculum');
        cancelCurriculumBtn.addEventListener('click', () => {
            this.resetCurriculumForm();
        });
        
        return modal;
    }
    
    // 교육과정 데이터 로드
    loadCurriculumData(pageType) {
        // TODO: 실제 데이터 로드 구현
        console.log(`Loading curriculum data for ${pageType}...`);
        
        // 테스트 데이터 표시
        const dummyData = [
            { id: 1, name: '과정 1', description: '설명 1', date: '2024-03-01 ~ 2024-03-31', price: '300,000원' },
            { id: 2, name: '과정 2', description: '설명 2', date: '2024-04-01 ~ 2024-04-30', price: '500,000원' }
        ];
        
        this.displayCurriculumList(dummyData);
    }
    
    // 교육과정 목록 표시
    displayCurriculumList(data) {
        const container = document.getElementById('curriculum-items');
        container.innerHTML = '';
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p>등록된 교육과정이 없습니다.</p>';
            return;
        }
        
        const listHtml = data.map(item => `
            <div class="curriculum-item" data-id="${item.id}">
                <div class="curriculum-item-header">
                    <span class="curriculum-item-name">${item.name}</span>
                    <div class="curriculum-item-actions">
                        <button class="btn-edit" title="수정"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" title="삭제"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="curriculum-item-details">
                    <p>${item.description}</p>
                    <p><small>${item.date} | ${item.price}</small></p>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = listHtml;
        
        // 수정/삭제 버튼 이벤트 설정
        container.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.closest('.curriculum-item').dataset.id);
                this.editCurriculumItem(itemId);
            });
        });
        
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.closest('.curriculum-item').dataset.id);
                this.deleteCurriculumItem(itemId);
            });
        });
    }
    
    // 교육과정 항목 수정
    editCurriculumItem(itemId) {
        // TODO: 실제 데이터 로드 및 폼 채우기 구현
        console.log(`Editing curriculum item ${itemId}...`);
        
        // 테스트 데이터
        const dummyItem = { 
            id: itemId, 
            name: `과정 ${itemId}`, 
            description: `설명 ${itemId}`, 
            date: '2024-03-01 ~ 2024-03-31', 
            price: '300,000원' 
        };
        
        document.getElementById('curriculum-name').value = dummyItem.name;
        document.getElementById('curriculum-description').value = dummyItem.description;
        document.getElementById('curriculum-date').value = dummyItem.date;
        document.getElementById('curriculum-price').value = dummyItem.price;
        
        // 폼에 아이디 데이터 추가
        document.getElementById('curriculum-form').dataset.editId = itemId;
    }
    
    // 교육과정 항목 삭제
    deleteCurriculumItem(itemId) {
        if (confirm('이 교육과정을 삭제하시겠습니까?')) {
            // TODO: 실제 삭제 구현
            console.log(`Deleting curriculum item ${itemId}...`);
            
            // UI에서 해당 항목 제거
            const item = document.querySelector(`.curriculum-item[data-id="${itemId}"]`);
            if (item) {
                item.remove();
            }
        }
    }
    
    // 교육과정 폼 초기화
    resetCurriculumForm() {
        document.getElementById('curriculum-name').value = '';
        document.getElementById('curriculum-description').value = '';
        document.getElementById('curriculum-date').value = '';
        document.getElementById('curriculum-price').value = '';
        
        // 수정 모드 해제
        delete document.getElementById('curriculum-form').dataset.editId;
    }
    
    // 교육과정 데이터 저장
    saveCurriculumData() {
        const name = document.getElementById('curriculum-name').value.trim();
        const description = document.getElementById('curriculum-description').value.trim();
        const date = document.getElementById('curriculum-date').value.trim();
        const price = document.getElementById('curriculum-price').value.trim();
        
        if (!name) {
            alert('과정명을 입력해주세요.');
            return;
        }
        
        // 수정 모드 확인
        const editId = document.getElementById('curriculum-form').dataset.editId;
        
        // TODO: 실제 저장 구현
        if (editId) {
            console.log(`Updating curriculum item ${editId}...`, { name, description, date, price });
        } else {
            console.log('Adding new curriculum...', { name, description, date, price });
        }
        
        // 폼 초기화 및 목록 새로고침
        this.resetCurriculumForm();
        this.loadCurriculumData();
    }
    
    // 페이지 정보 업데이트
    updatePageInfo(config) {
        document.querySelector('.page-title').textContent = config.title;
        document.querySelector('.page-descripation').textContent = config.description;
        
        // 페이지 위치에 링크 적용
        const locationElement = document.querySelector('.page-location');
        if (config.link) {
            locationElement.innerHTML = `<a href="${config.link}" target="_blank">${config.location}</a>`;
        } else {
            locationElement.textContent = config.location;
        }
        
        // 페이지 타이틀도 업데이트
        document.title = `YPP Admin - ${config.title}`;
    }
    
    // 페이지별 데이터 카운트 로드
    async loadPageCount(config) {
        try {
            // console.log(`${config.title} 데이터 카운트 로드 중...`);
            
            // 대시보드에서 카운트 정보 가져오기 (index.html과 동일한 URL 형식)
            const url = `${this.appsScriptUrl}?sheet=SHEET_DASHBOARD&action=getData`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            // console.log('=== 디버깅 정보 ===');
            // console.log('config:', config);
            // console.log('config.dataKey:', config.dataKey);
            // console.log('result.data:', result.data);
            // console.log('result.data[config.dataKey]:', result.data[config.dataKey]);
            
            const count = result.data[config.dataKey] || 0;
            document.querySelector('.page-count').textContent = `${count}건`;
            
            // console.log(`${config.title}: ${count}건`);
            // console.log('=== 디버깅 끝 ===');
            
        } catch (error) {
            console.error('데이터 카운트 로드 실패:', error);
            document.querySelector('.page-count').textContent = '0건';
        }
    }
    
    // 에러 표시
    showError(message) {
        document.querySelector('.page-title').textContent = '오류';
        document.querySelector('.page-descripation').textContent = message;
        document.querySelector('.page-location').textContent = '오류 페이지';
        document.querySelector('.page-count').textContent = '0건';
        
        console.error('PageManager 오류:', message);
    }
    
    // 페이지 데이터 로드
    async loadPageData(config) {
        try {
            this.showLoading(true);
            // console.log(`${config.title} 데이터 로드 중...`);
            
            // API에서 실제 데이터 가져오기 (index.html과 동일한 URL 형식)
            const url = `${this.appsScriptUrl}?sheet=${config.apiSheet}&action=getData`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            const data = result.data;
            
            // 🟡 디버깅: 로드된 데이터 확인
            console.group('🔍 [DEBUG] 페이지 데이터 로드됨');
            console.log('📊 데이터 개수:', data ? data.length : 0);
            console.log('📦 첫 번째 데이터:', data && data.length > 0 ? data[0] : 'no data');
            if (data && data.length > 0) {
                console.log('🔑 첫 번째 데이터 키들:', Object.keys(data[0]));
            }
            console.groupEnd();
            
            // 현재 데이터와 설정 저장
            this.currentData = data;
            this.currentConfig = config;
            
            // 데이터가 있으면 테이블 렌더링, 없으면 빈 상태 표시
            if (data && data.length > 0) {
                this.renderDataTable(data, config);
                this.showEmptyState(false);
            } else {
                this.showEmptyState(true);
            }
            
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            this.showError(`데이터 로드 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    // 테이블 렌더링 (데스크톱)
    renderDataTable(data, config) {
        const tbody = document.getElementById('data-table-body');
        const thead = document.querySelector('.data-table thead tr');
        
        // 테이블 헤더 동적 생성
        thead.innerHTML = this.generateTableHeaderHTML(config);
        
        // 데이터 그룹핑 적용 (PSAC, RelaySchool에서만)
        let processedData = this.groupDataByDateAndBusinessNumber(data);
        
        // 카테고리 필터 적용 (아카데미 페이지에서만)
        processedData = this.filterDataByCategory(processedData);
        
        // 데이터 정렬 적용
        processedData = this.sortData(processedData);
        
        // 현재 처리된 데이터 저장 (모달에서 사용)
        this.currentProcessedData = processedData;
        
        // 테이블 바디 초기화 및 데이터 렌더링
        tbody.innerHTML = '';
        
        processedData.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // 그룹핑된 데이터인 경우 CSS 클래스 추가
            if (item.isGrouped && item.groupedEducation && item.groupedEducation.length > 1) {
                row.classList.add('grouped-row');
            }
            
            row.innerHTML = this.generateTableRowHTML(item, config);
            
            // 행 클릭 이벤트 (모달 열기)
            row.addEventListener('click', (e) => {
                // 🟡 디버깅: 행 클릭 이벤트
                console.log('👆 [DEBUG] 행 클릭됨, item:', item);
                
                // 클릭된 요소가 버튼이거나 버튼의 자식 요소인지 확인
                const clickedElement = e.target;
                const isButton = clickedElement.matches('button') || clickedElement.closest('button');
                const isCheckbox = clickedElement.matches('input[type="checkbox"]');
                const isIcon = clickedElement.matches('i') || clickedElement.closest('i');
                
                console.log('🎯 [DEBUG] 클릭된 요소:', clickedElement.tagName);
                console.log('🔘 [DEBUG] 버튼 여부:', isButton);
                console.log('☑️ [DEBUG] 체크박스 여부:', isCheckbox);
                console.log('🎨 [DEBUG] 아이콘 여부:', isIcon);
                
                // 버튼, 체크박스, 아이콘이 아닌 경우에만 모달 열기
                if (!isButton && !isCheckbox && !isIcon) {
                    console.log('✅ [DEBUG] 모달 열기 조건 만족, openEditModal 호출');
                    this.openEditModal(item, config);
                } else {
                    console.log('❌ [DEBUG] 모달 열기 조건 불만족, 이벤트 무시');
                }
            });
            
            tbody.appendChild(row);
        });
        
        // 체크박스 이벤트 설정
        this.setupCheckboxEvents();
    }

    // 테이블 헤더 HTML 생성
    generateTableHeaderHTML(config) {
        const pageType = new URLSearchParams(window.location.search).get('page');
        
        // 페이지 타입별로 다른 헤더 구조
        switch(pageType) {
            case '인허가':
            case '유자격':
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th>제목</th>
                    <th class="col-date">등록일</th>
                    <th class="col-status">상태</th>
                    <th class="col-actions">삭제</th>
                `;
            
            case '인사이드':
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th>제목</th>
                    <th class="col-date">날짜</th>
                    <th class="col-status">상태</th>
                    <th class="col-actions">삭제</th>
                `;

            case '아카데미':
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th class="col-category">카테고리</th>
                    <th>제목</th>
                    <th class="col-date">등록일시</th>
                    <th class="col-status">상태</th>
                    <th class="col-actions">삭제</th>
                `;
                
            case 'PSAC':
            case 'RelaySchool':
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th class="col-number">순번</th>
                    <th>회사/기관</th>
                    <th>신청과목</th>
                    <th class="col-date">신청일시</th>
                    <th class="col-actions">삭제</th>
                `;
                
            case '고객문의':
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th class="col-id">ID</th>
                    <th>제목</th>
                    <th>문의자</th>
                    <th>이메일</th>
                    <th class="col-date">문의일</th>
                    <th class="col-status">처리상태</th>
                    <th class="col-actions">삭제</th>
                `;
                
            case '보도자료':
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th class="col-number">순번</th>
                    <th>제목</th>
                    <th class="col-date">등록일</th>
                    <th class="col-status">상태</th>
                    <th class="col-actions">삭제</th>
                `;
                
            case '부패및윤리신고':
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th class="col-id">ID</th>
                    <th>제목</th>
                    <th>신고자</th>
                    <th class="col-date">신고일</th>
                    <th class="col-status">처리상태</th>
                    <th class="col-actions">삭제</th>
                `;
                
            default: // 팝업, 자주묻는질문 등
                return `
                    <th class="col-checkbox"><input type="checkbox" id="select-all"></th>
                    <th class="col-id">ID</th>
                    <th>제목</th>
                    <th>내용</th>
                    <th class="col-date">등록일</th>
                    <th class="col-status">상태</th>
                    <th class="col-actions">삭제</th>
                `;
        }
    }
    
    // 데이터 그룹핑 함수 (날짜와 사업자등록번호로 그룹핑)
    groupDataByDateAndBusinessNumber(data) {
        const pageType = new URLSearchParams(window.location.search).get('page');
        
        // PSAC, RelaySchool 페이지에서만 그룹핑 적용
        if (!['PSAC', 'RelaySchool'].includes(pageType)) {
            return data;
        }
        
        const grouped = {};
        const result = [];
        
        data.forEach(item => {
            // 날짜 추출 (applicationDate)
            const datetime = parseDatetime(item.applicationDate);
            const date = datetime.dateOnly;
            
            // 사업자등록번호 추출 (여러 필드명 지원)
            const businessNumber = item.businessNumber || item.companyRegistrationNumber || item.businessRegistrationNumber || '';
            
            // 그룹핑 키 생성 (날짜 + 사업자등록번호)
            // 사업자등록번호가 없으면 각각 별도 그룹으로 처리 (고유 ID 사용)
            let groupKey;
            if (businessNumber && businessNumber.trim() !== '') {
                groupKey = `${date}_${businessNumber.trim()}`;
            } else {
                // 사업자등록번호가 없으면 각 항목을 별도로 처리
                groupKey = `${date}_${item.number || item.id || Math.random()}`;
            }
            
            if (!grouped[groupKey]) {
                // 새 그룹 생성
                grouped[groupKey] = {
                    ...item, // 첫 번째 아이템의 기본 정보 사용
                    groupedEducation: [
                        item.studentName ? `(${item.studentName}) ${item.detailedEducation || ''}` : item.detailedEducation || ''
                    ], // 교육 내용들을 배열로 저장
                    groupedItems: [item], // 원본 아이템들 저장
                    isGrouped: true // 그룹핑된 데이터임을 표시
                };
            } else {
                // 기존 그룹에 추가
                const educationWithName = item.studentName ? `(${item.studentName}) ${item.detailedEducation || ''}` : item.detailedEducation || '';
                grouped[groupKey].groupedEducation.push(educationWithName);
                grouped[groupKey].groupedItems.push(item);
            }
        });
        
        // 그룹핑된 결과를 배열로 변환
        Object.values(grouped).forEach(group => {
            result.push(group);
        });
        
        return result;
    }

    // 데이터를 정렬하는 함수
    sortData(data) {
        const pageType = new URLSearchParams(window.location.search).get('page');
        
        // 페이지별로 정렬 기준 설정
        return data.sort((a, b) => {
            let dateA, dateB;
            
            switch(pageType) {
                case 'PSAC':
                case 'RelaySchool':
                    // 신청일 기준으로 정렬
                    dateA = new Date(a.applicationDate || '1970-01-01');
                    dateB = new Date(b.applicationDate || '1970-01-01');
                    break;
                    
                case '고객문의':
                    // 문의일 기준으로 정렬
                    dateA = new Date(a.submittedAt || '1970-01-01');
                    dateB = new Date(b.submittedAt || '1970-01-01');
                    break;
                    
                case '보도자료':
                    // 발행일 기준으로 정렬
                    dateA = new Date(a.submittedAt || '1970-01-01');
                    dateB = new Date(b.submittedAt || '1970-01-01');
                    break;
                    
                case '인허가':
                case '유자격':
                case '아카데미':
                    // 등록일/날짜 기준으로 정렬
                    dateA = new Date(a.date || '1970-01-01');
                    dateB = new Date(b.date || '1970-01-01');
                    break;
                    
                default:
                    // 기본: ID 번호 기준으로 정렬
                    const idA = parseInt(a.id || a.number || 0);
                    const idB = parseInt(b.id || b.number || 0);
                    return this.isDescending ? idB - idA : idA - idB;
            }
            
            // 정렬 방향에 따라 결과 반환
            return this.isDescending ? dateB - dateA : dateA - dateB;
        });
    }
    
    // 정렬 토글 버튼 설정
    setupSortToggle() {
        const sortBtn = document.getElementById('btn-sort-toggle');
        const sortIcon = document.getElementById('sort-icon');
        
        if (!sortBtn) return;
        
        sortBtn.addEventListener('click', () => {
            // 정렬 방향 토글
            this.isDescending = !this.isDescending;
            
            // 버튼 UI 업데이트
            if (this.isDescending) {
                sortIcon.className = 'fas fa-sort-amount-down';
                sortBtn.innerHTML = '<i class="fas fa-sort-amount-down" id="sort-icon"></i> 최신순';
            } else {
                sortIcon.className = 'fas fa-sort-amount-up';
                sortBtn.innerHTML = '<i class="fas fa-sort-amount-up" id="sort-icon"></i> 오래된순';
            }
            
            // 데이터 다시 렌더링
            if (this.currentData && this.currentConfig) {
                this.renderDataTable(this.currentData, this.currentConfig);
            }
        });
    }
    
    // 삭제 버튼들 설정
    setupDeleteButtons() {
        const deleteSelectedBtn = document.getElementById('btn-delete-selected');
        
        if (!deleteSelectedBtn) {
            console.warn('선택 삭제 버튼을 찾을 수 없습니다.');
            return;
        }
        
        // 기존 이벤트 리스너 제거 후 새로 추가
        deleteSelectedBtn.replaceWith(deleteSelectedBtn.cloneNode(true));
        const newDeleteBtn = document.getElementById('btn-delete-selected');
        
        newDeleteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            console.log('선택 삭제 버튼 클릭됨');
            await this.deleteSelectedItems();
        });
        
        console.log('선택 삭제 버튼 이벤트 설정 완료');
    }
    
    // 새로 추가 버튼 이벤트 설정
    setupAddButton() {
        const addBtn = document.getElementById('btn-add');
        
        if (!addBtn) return;
        
        addBtn.addEventListener('click', () => {
            // createlink가 존재하면 새창으로 링크 열기
            if (this.currentConfig && this.currentConfig.createlink) {
                window.open(this.currentConfig.createlink, '_blank');
            } else {
                // createlink가 없으면 기본 동작 (필요시 다른 모달이나 기능 추가)
                alert('새로 추가 기능은 제작중에 있습니다. \n급한 사항은 관리자에게 문의바랍니다. \n jwbaek@gmail.com 혹은 010-3432-4396');
            }
        });
    }
    
    // 카테고리 필터 버튼 설정
    setupCategoryFilter() {
        const pageType = new URLSearchParams(window.location.search).get('page');
        const filterBtn = document.getElementById('btn-category-filter');
        
        // 아카데미 페이지에서만 표시
        if (pageType === '아카데미') {
            filterBtn.style.display = 'inline-block';
            
            filterBtn.addEventListener('click', () => {
                this.toggleCategoryFilter();
            });
        }
    }
    
    // 카테고리 필터 토글
    toggleCategoryFilter() {
        const filterBtn = document.getElementById('btn-category-filter');
        const filterIcon = document.getElementById('filter-icon');
        
        // 필터 상태 순환: all -> psac -> relay -> all
        switch(this.currentCategoryFilter) {
            case 'all':
                this.currentCategoryFilter = 'psac';
                filterBtn.innerHTML = 'PSAC';
                break;
            case 'psac':
                this.currentCategoryFilter = 'relay';
                filterBtn.innerHTML = 'Relay School';
                break;
            case 'relay':
                this.currentCategoryFilter = 'all';
                filterBtn.innerHTML = '모두보기';
                break;
        }
        
        // 데이터 다시 렌더링
        if (this.currentData && this.currentConfig) {
            this.renderDataTable(this.currentData, this.currentConfig);
        }
    }
    
    // 카테고리별 데이터 필터링
    filterDataByCategory(data) {
        const pageType = new URLSearchParams(window.location.search).get('page');
        
        // 아카데미 페이지가 아니거나 "모두보기"인 경우 원본 데이터 반환
        if (pageType !== '아카데미' || this.currentCategoryFilter === 'all') {
            return data;
        }
        
        // 카테고리에 따라 데이터 필터링
        return data.filter(item => {
            if (!item.category) return false;
            
            const category = item.category.toLowerCase();
            
            switch(this.currentCategoryFilter) {
                case 'psac':
                    return category === 'psac';
                case 'relay':
                    return category === 'relay' || category === 'relay school';
                default:
                    return true;
            }
        });
    }
    
    // 선택된 항목들 삭제
    async deleteSelectedItems() {
        const checkedBoxes = document.querySelectorAll('input[type="checkbox"][data-id]:checked');
        const ids = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));
        
        if (ids.length === 0) {
            alert('삭제할 항목을 선택해주세요.');
            return;
        }
        
        if (!confirm(`선택한 ${ids.length}개 항목을 정말로 삭제하시겠습니까?`)) {
            return; // 사용자가 취소를 선택한 경우
        }
        
        try {
            // 개별 삭제 방식으로 변경 (CORS 오류 해결)
            let successCount = 0;
            let failCount = 0;
            
            for (const id of ids) {
                try {
                    const deleteUrl = `${this.appsScriptUrl}?action=delete&sheet=${this.currentConfig.apiSheet}&id=${encodeURIComponent(id)}`;
                    const response = await fetch(deleteUrl, { method: 'GET' });
                    const result = await response.json();
                    
                    if (result.success) {
                        successCount++;
                    } else {
                        failCount++;
                        console.error(`항목 ${id} 삭제 실패:`, result.message);
                    }
                } catch (itemError) {
                    failCount++;
                    console.error(`항목 ${id} 삭제 오류:`, itemError);
                }
            }
            
            // 결과 메시지 표시
            if (failCount === 0) {
                alert(`${successCount}개 항목이 성공적으로 삭제되었습니다.`);
            } else {
                alert(`${successCount}개 항목이 삭제되었습니다.\n${failCount}개 항목 삭제에 실패했습니다.`);
            }
            
            // 페이지 새로고침
            location.reload();
            
        } catch (error) {
            console.error('선택 삭제 오류:', error);
            alert('오류: 삭제에 실패했습니다.');
        }
    }

    // 테이블 행 HTML 생성
    generateTableRowHTML(item, config) {
        const pageType = new URLSearchParams(window.location.search).get('page');
        
        // 페이지 타입별로 다른 컬럼 구조
        switch(pageType) {
            case '인허가':
            case '유자격':
                return `
                    <td class="col-checkbox"><input type="checkbox" data-id="${item.id}"></td>
                    <td>${item.titleKR || '제목 없음'}</td>
                    <td class="col-date">${item.date || '-'}</td>
                    <td class="col-status"><span class="status-badge ${item.state === 'on' ? 'status-active' : 'status-inactive'}">${item.state === 'on' ? 'ON' : 'OFF'}</span></td>
                    <td class="col-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
            
            case '인사이드':
                return `
                    <td class="col-checkbox"><input type="checkbox" data-id="${item.id}"></td>
                    <td>${item.titleKR || '제목 없음'}<br><span style="color: #4747477a; margin-top: 4px;">${item.titleEN || ''}</span></td>
                    <td class="col-date">${item.date || ''}</td>
                    <td class="col-status"><span class="status-badge ${item.state === 'on' ? 'status-active' : 'status-inactive'}">${item.state === 'on' ? 'ON' : 'OFF'}</span></td>
                    <td class="col-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
            case '아카데미':
                return `
                    <td class="col-checkbox"><input type="checkbox" data-id="${item.id}"></td>
                    <td class="col-category">${item.category || ''}</td>
                    <td>${item.titleKR || '제목 없음'}<br><span style="color: #4747477a; margin-top: 4px;">${item.titleEN || ''}</span></td>
                    <td class="col-date">${item.date || ''}</td>
                    <td class="col-status"><span class="status-badge ${item.state === 'on' ? 'status-active' : 'status-inactive'}">${item.state === 'on' ? 'ON' : 'OFF'}</span></td>
                    <td class="col-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
                
            case 'PSAC':
            case 'RelaySchool':
                const datetime = parseDatetime(item.applicationDate);
                // 그룹핑된 데이터인지 확인
                if (item.isGrouped && item.groupedEducation && item.groupedEducation.length > 1) {
                    // 그룹핑된 여러 교육 내용을 표시 - 각 항목별로 잠금 상태 확인
                    const educationList = item.groupedEducation
                        .filter(edu => edu && edu.trim()) // 빈 값 제거
                        .map((edu, index) => {
                            // 각 교육과정 항목에서 세미콜론을 <br>로 변환
                            const formattedEdu = edu.trim().replace(/;\s*/g, '<br>');
                            
                            // 해당 인덱스의 원본 아이템에서 잠금 상태 확인
                            const originalItem = item.groupedItems[index];
                            const isLocked = originalItem && (originalItem.lockStatus === true || originalItem.lockStatus === 'true');
                            const lockIcon = isLocked ? ' <i class="fas fa-lock" style="color: #000;"></i>' : '';
                            
                            return `<span class="group-item" style="color: ${isLocked ? '#777' : '#000'};">${formattedEdu}${lockIcon}</span>`;
                        })
                        .join('');
                        
                    return `
                        <td class="col-checkbox"><input type="checkbox" data-id="${item.number}"></td>
                        <td>${item.number}</td>
                        <td>${item.companyName || '-'}</td>
                        <td class="grouped-cell">
                            <div class="group-header">
                                <i class="fas fa-layer-group group-icon"></i>
                                그룹 (${item.groupedEducation.length}명)
                            </div>
                            <div>
                                ${educationList}
                            </div>
                        </td>
                        <td class="col-date">
                            <div>${datetime.dateOnly}</div>
                            ${datetime.timeOnly !== '-' ? `<small style="color: #666;">${datetime.timeOnly}</small>` : ''}
                        </td>
                        <td class="col-actions">
                            <!-- 그룹 항목은 행 클릭으로 관리 -->
                        </td>
                    `;
                } else {
                    // 단일 데이터
                    const educationWithName = item.studentName ? `(${item.studentName}) ${item.detailedEducation || ''}` : item.detailedEducation || '';
                    
                    // 세미콜론으로 구분된 교육과정을 <br>로 변환
                    const formattedEducation = educationWithName.replace(/;\s*/g, '<br>');
                    
                    return `
                        <td class="col-checkbox"><input type="checkbox" data-id="${item.number}"></td>
                        <td>${item.number}</td>
                        <td>${item.companyName || '-'}</td>
                        <td style="color: ${item.lockStatus === true || item.lockStatus === 'true' ? '#777' : '#000'};">
                            ${formattedEducation}
                            ${item.lockStatus === true || item.lockStatus === 'true' ? ' <i class="fas fa-lock" style="color: #000;"></i>' : ''}
                        </td>
                        <td class="col-date">
                            <div>${datetime.dateOnly}</div>
                            ${datetime.timeOnly !== '-' ? `<small>${datetime.timeOnly}</small>` : ''}
                        </td>
                        <td class="col-actions">
                            <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.number}', event)"><i class="fa-solid fa-trash-can"></i></button>
                        </td>
                    `;
                }
            case '고객문의':
                const inquiryDatetime = parseDatetime(item.submittedAt);
                return `
                    <td class="col-checkbox"><input type="checkbox" data-id="${item.submissionId}"></td>
                    <td>${item.submissionId}</td>
                    <td>${item.subject || '제목 없음'}</td>
                    <td>${item.nameCompany || '-'}</td>
                    <td>${item.emailPhone || '-'}</td>
                    <td>
                        <div>${inquiryDatetime.dateOnly}</div>
                        <small style="color: #666;">${inquiryDatetime.timeOnly}</small>
                    </td>
                    <td><span class="status-badge status-pending">접수</span></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.submissionId}', event)"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
                
            case '보도자료':
                const pressDatetime = parseDatetime(item.submittedAt);
                return `
                    <td class="col-checkbox"><input type="checkbox" data-id="${item.id}"></td>
                    <td class="col-number">${item.number}</td>
                    <td>${item.titleKR || '제목 없음'}<br><span style="color: #4747477a; margin-top: 4px;">${item.titleEN || ''}</span></td>
                    <td class="col-date">
                        <div>${pressDatetime.dateOnly}</div>
                        ${pressDatetime.timeOnly !== '-' ? `<small>${pressDatetime.timeOnly}</small>` : ''}
                    </td>
                    <td><span class="status-badge ${item.state === 'on' ? 'status-active' : 'status-inactive'}">${item.state === 'on' ? 'ON' : 'OFF'}</span></td>
                    <td class="col-actions">
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
                
            case '부패및윤리신고':
                return `
                    <td class="col-checkbox"><input type="checkbox" data-id="${item.id}"></td>
                    <td>${item.id}</td>
                    <td>${item.subject || '제목 없음'}</td>
                    <td>${item.reporterName || '익명'}</td>
                    <td>${item.reportDate || '-'}</td>
                    <td><span class="status-badge ${item.status === '완료' ? 'status-active' : 'status-pending'}">${item.status || '접수'}</span></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
                
            default: // 팝업, 자주묻는질문 등
                return `
                    <td class="col-checkbox"><input type="checkbox" data-id="${item.id}"></td>
                    <td>${item.id}</td>
                    <td>${item.title || item.subject || '제목 없음'}</td>
                    <td>${item.content ? (item.content.length > 30 ? item.content.substring(0, 30) + '...' : item.content) : '내용 없음'}</td>
                    <td class="col-date">${item.date || item.createdDate || '-'}</td>
                    <td><span class="status-badge status-active">활성</span></td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}', event)"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                `;
        }
    }
    
    // 체크박스 이벤트 설정
    setupCheckboxEvents() {
        const selectAll = document.getElementById('select-all');
        const deleteBtn = document.getElementById('btn-delete-selected');
        
        // 전체 선택 체크박스 (기존 이벤트 제거 후 추가)
        if (selectAll) {
            selectAll.replaceWith(selectAll.cloneNode(true)); // 기존 이벤트 리스너 제거
            const newSelectAll = document.getElementById('select-all');
            
            newSelectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
                checkboxes.forEach(cb => cb.checked = e.target.checked);
                this.updateDeleteButton();
            });
        }
        
        // 개별 체크박스 - 이벤트 위임 사용
        const tableBody = document.getElementById('data-table-body');
        if (tableBody) {
            // 기존 이벤트 리스너 제거
            tableBody.removeEventListener('change', this.handleCheckboxChange);
            
            // 새 이벤트 리스너 추가 (이벤트 위임)
            this.handleCheckboxChange = (e) => {
                if (e.target.matches('input[type="checkbox"][data-id]')) {
                    this.updateDeleteButton();
                    
                    // 전체 선택 체크박스 상태 업데이트
                    const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
                    const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"][data-id]:checked');
                    const selectAllBox = document.getElementById('select-all');
                    
                    if (selectAllBox) {
                        if (checkedCheckboxes.length === 0) {
                            selectAllBox.checked = false;
                            selectAllBox.indeterminate = false;
                        } else if (checkedCheckboxes.length === allCheckboxes.length) {
                            selectAllBox.checked = true;
                            selectAllBox.indeterminate = false;
                        } else {
                            selectAllBox.checked = false;
                            selectAllBox.indeterminate = true;
                        }
                    }
                }
            };
            
            tableBody.addEventListener('change', this.handleCheckboxChange);
        }
    }
    
    // 삭제 버튼 상태 업데이트
    updateDeleteButton() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id]:checked');
        const deleteBtn = document.getElementById('btn-delete-selected');
        
        if (!deleteBtn) {
            console.warn('삭제 버튼을 찾을 수 없습니다.');
            return;
        }
        
        if (checkboxes.length > 0) {
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i> 선택 삭제 (${checkboxes.length})`;
        } else {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = `<i class="fas fa-trash"></i> 선택 삭제`;
        }
        
        console.log('삭제 버튼 상태 업데이트:', {
            체크된항목수: checkboxes.length,
            버튼비활성화: deleteBtn.disabled
        });
    }
    
    // 로딩 상태 표시
    showLoading(show) {
        const loading = document.getElementById('loading-indicator');
        const tableContainer = document.querySelector('.data-table-container');
        
        if (show) {
            loading.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            loading.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }
    
    // 빈 상태 표시
    showEmptyState(show) {
        const emptyState = document.getElementById('empty-state');
        const tableContainer = document.querySelector('.data-table-container');
        
        if (show) {
            emptyState.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
        }
    }
    
    // 수정 모달 열기
    openEditModal(item, config) {
        const pageType = new URLSearchParams(window.location.search).get('page');
        
        console.log('🔧 [DEBUG] openEditModal 호출됨, pageType:', pageType);
        
        // 페이지 타입에 따라 적절한 모달 열기
        switch(pageType) {
            case 'PSAC':
            case 'RelaySchool':
                this.openPSACEditModal(item, config, pageType);
                break;
                
            case '인허가':
            case '유자격':
            case '인사이드':
            case '아카데미':
                this.openGalleryEditModal(item, config, pageType);
                break;
                
            case '보도자료':
                this.openPressEditModal(item, config, pageType);
                break;
                
            case '고객문의':
            case '부패및윤리신고':
                // 문의 모달 (필요시 추가)
                alert('해당 항목의 수정 기능은 준비 중입니다.');
                break;
                
            default:
                // 기본 모달 (필요시 추가)
                alert('해당 페이지의 수정 기능은 준비 중입니다.');
                break;
        }
    }
    
    // PSAC/RelaySchool 수정 모달 열기
    openPSACEditModal(item, config, pageType) {
        // 그룹핑된 아이템인지 확인
        if (item.isGrouped && item.groupedItems && item.groupedItems.length > 1) {
            // 그룹인 경우: 먼저 그룹 선택 모달을 열어서 수정할 항목을 선택하게 함
            this.showGroupEditSelectModal(item, config, pageType);
        } else if (item.isGrouped && item.groupedItems && item.groupedItems.length === 1) {
            // 그룹이지만 항목이 하나인 경우: 바로 수정 모달 열기
            const targetItem = item.groupedItems[0];
            this.openDirectEditModal(targetItem, config, pageType);
        } else {
            // 단일 항목인 경우: 바로 수정 모달 열기
            this.openDirectEditModal(item, config, pageType);
        }
    }
    
    // 그룹 선택 모달 열기
    showGroupEditSelectModal(groupItem, config, pageType) {
        const modal = document.getElementById('groupEditSelectModal');
        const list = document.getElementById('groupEditSelectList');
        
        // 리스트 초기화
        list.innerHTML = '';
        
        // 그룹 데이터를 모달에 저장 (삭제 함수에서 사용)
        this.currentGroupData = groupItem;
        this.currentGroupConfig = config;
        this.currentGroupPageType = pageType;
        
        // 그룹 항목들을 리스트로 표시
        groupItem.groupedItems.forEach((item, index) => {
            const educationText = item.detailedEducation || '';
            // 세미콜론을 <br>로 변환
            const formattedEducation = educationText.replace(/;\s*/g, '<br>');
            
            const listItem = document.createElement('li');
            listItem.className = 'group-select-item';
            listItem.innerHTML = `
                <input type="checkbox" class="group-select-checkbox" data-item-id="${item.number || item.id}" onclick="event.stopPropagation()">
                <div class="group-select-item-main">
                    <div class="group-select-item-header">
                        <span class="group-select-item-title">${item.studentName || '수강자명 없음'}</span>
                        </div>
                        <div class="group-select-item-content">
                            <span class="group-select-item-id">신청번호: ${item.number || item.id}</span>
                        </div>
                        <div class="group-select-item-education">
                            <p><strong>[신청과목]</strong></p>${formattedEducation}
                        </div>
                    </div>
                </div>
                <div class="group-select-item-actions">
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteIndividualGroupItem('${item.number || item.id}');">삭제</button>
                </div>
            `;
            
            // 메인 영역 클릭 이벤트 추가 (수정 모달 열기)
            const mainDiv = listItem.querySelector('.group-select-item-main');
            mainDiv.addEventListener('click', () => {
                this.closeGroupEditSelectModal();
                this.openDirectEditModal(item, config, pageType);
            });
            
            list.appendChild(listItem);
        });
        
        // 전체 선택 체크박스 초기화
        document.getElementById('groupSelectAll').checked = false;
        
        // 모달 표시
        modal.style.display = 'flex';
    }
    
    // 그룹 선택 모달 닫기
    closeGroupEditSelectModal() {
        const modal = document.getElementById('groupEditSelectModal');
        modal.style.display = 'none';
    }
    
    // 갤러리 수정 모달 열기
    openGalleryEditModal(item, config, pageType) {
        
        const modal = document.getElementById('galleryEditModal');
        const title = document.getElementById('galleryEditModalTitle');
        const form = document.getElementById('galleryEditForm');

        
        // 모달 제목 설정
        title.textContent = `${pageType} 갤러리 수정`;
        
        // 폼 내용 생성
        const formHTML = this.generateGalleryEditForm(item, pageType);

        form.innerHTML = formHTML;
        
        // 현재 편집 중인 아이템 저장
        window.currentGalleryEditItem = item;
        window.currentGalleryEditConfig = config;
        window.currentGalleryPageType = pageType;
        
        // 토글 버튼 이벤트 설정
        this.setupGalleryToggle();
        
        // 모달 표시
        modal.style.display = 'flex';
    }
    
    // 보도자료 수정 모달 열기
    openPressEditModal(item, config, pageType) {

        const modal = document.getElementById('editModal');
        const title = document.getElementById('editModalTitle');
        const form = document.getElementById('editForm');
        
        if (!modal || !title || !form) {
            console.error('❌ 모달 요소를 찾을 수 없음');
            console.groupEnd();
            return;
        }
        
        // 모달 제목 설정
        title.textContent = `${pageType} 수정`;
        
        // 폼 내용 생성
        const formHTML = this.generatePressEditForm(item, pageType);
        
        form.innerHTML = formHTML;
        
        // 현재 편집 중인 아이템 저장
        window.currentPressEditItem = item;
        window.currentPressEditConfig = config;
        window.currentPressPageType = pageType;
        
        // 토글 버튼 이벤트 설정
        this.setupPressToggle();
        
        // 모달 표시
        modal.style.display = 'flex';
        console.groupEnd();
    }
    
    // 직접 수정 모달 열기 (기존 로직)
    openDirectEditModal(targetItem, config, pageType) {
        const modal = document.getElementById('editModal');
        const title = document.getElementById('editModalTitle');
        const form = document.getElementById('editForm');
        
        // 모달 제목 설정
        title.textContent = `${pageType} 신청서 수정`;
        
        // 폼 내용 생성
        form.innerHTML = this.generatePSACEditForm(targetItem, pageType);
        
        // 현재 편집 중인 아이템 저장
        window.currentEditItem = targetItem;
        window.currentEditConfig = config;
        
        // 잠금 토글 이벤트 설정
        this.setupLockToggle();
        
        // 모달 표시
        modal.style.display = 'flex';
    }
    
    // PSAC/RelaySchool 수정 폼 생성
    generatePSACEditForm(item, pageType) {
        return `
            <div class="edit-form-section-title">신청 정보</div>
            
            <div class="edit-form-group">
                <label>신청번호</label>
                <input type="text" name="number" value="${item.number || ''}" class="edit-form-readonly" readonly>
            </div>
            
            <div class="edit-form-group">
                <label>신청일시</label>
                <input type="text" name="applicationDate" value="${item.applicationDate || ''}" class="edit-form-readonly" readonly>
            </div>
            
            <div class="edit-form-group">
                <label>과정명</label>
                <input type="text" name="courseName" value="${item.courseName || ''}" class="edit-form-readonly" readonly>
            </div>
            
            <div class="edit-form-group">
                <label>교육일정</label>
                <textarea name="educationSchedule" readonly class="edit-form-readonly">${item.educationSchedule || ''}</textarea>
            </div>

            <div class="edit-form-section-title">회사 정보</div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>회사명</label>
                    <input type="text" name="companyName" value="${item.companyName || ''}" >
                </div>
                <div class="edit-form-group">
                    <label>대표자명</label>
                    <input type="text" name="ceoName" value="${item.ceoName || ''}" >
                </div>
            </div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>사업자등록번호</label>
                    <input type="text" name="businessNumber" value="${item.businessNumber || ''}" >
                </div>
                <div class="edit-form-group">
                    <label>종목업태</label>
                    <input type="text" name="businessType" value="${item.businessType || ''}">
                </div>
            </div>
            
            <div class="edit-form-group">
                <label>주소</label>
                <textarea name="companyAddress" >${item.companyAddress || ''}</textarea>
            </div>

            <div class="edit-form-section-title">교육 담당자 정보</div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>교육담당자</label>
                    <input type="text" name="educationManager" value="${item.educationManager || ''}" >
                </div>
                <div class="edit-form-group">
                    <label>담당자 부서</label>
                    <input type="text" name="managerDepartment" value="${item.managerDepartment || ''}">
                </div>
            </div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>담당자 직급</label>
                    <input type="text" name="managerPosition" value="${item.managerPosition || ''}">
                </div>
                <div class="edit-form-group">
                    <label>담당자 전화</label>
                    <input type="tel" name="managerPhone" value="${item.managerPhone || ''}">
                </div>
            </div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>담당자 핸드폰</label>
                    <input type="tel" name="managerMobile" value="${item.managerMobile || ''}">
                </div>
                <div class="edit-form-group">
                    <label>담당자 이메일</label>
                    <input type="email" name="managerEmail" value="${item.managerEmail || ''}" >
                </div>
            </div>

            <div class="edit-form-section-title">수강자 정보</div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>수강자명</label>
                    <input type="text" name="studentName" value="${item.studentName || ''}" >
                </div>
                <div class="edit-form-group">
                    <label>수강자 부서</label>
                    <input type="text" name="studentDepartment" value="${item.studentDepartment || ''}">
                </div>
            </div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>수강자 직급</label>
                    <input type="text" name="studentPosition" value="${item.studentPosition || ''}">
                </div>
                <div class="edit-form-group">
                    <label>수강자 전화</label>
                    <input type="tel" name="studentPhone" value="${item.studentPhone || ''}">
                </div>
            </div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>수강자 핸드폰</label>
                    <input type="tel" name="studentMobile" value="${item.studentMobile || ''}">
                </div>
                <div class="edit-form-group">
                    <label>수강자 이메일</label>
                    <input type="email" name="studentEmail" value="${item.studentEmail || ''}" >
                </div>
            </div>

            <div class="edit-form-section-title">교육 과정</div>
            
            <div class="edit-form-group">
                <label>선택세부교육 *</label>
                <div class="education-checkbox-container">
                    ${this.generateEducationCheckboxes(pageType, item)}
                </div>
            </div>
            
            <div class="edit-form-group">
                <label>비고</label>
                <textarea name="remarks">${item.remarks || ''}</textarea>
            </div>
            
            <div class="edit-form-section-title">관리 설정</div>
            
            <div class="edit-form-group">
                <label>수정 잠금 상태</label>
                <div class="lock-toggle-container" style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                    <div class="lock-toggle ${item.lockStatus === true || item.lockStatus === 'true' ? 'active' : ''}" id="lockStatusToggle">
                        <input type="hidden" name="lockStatus" value="${item.lockStatus === true || item.lockStatus === 'true' ? 'true' : 'false'}">
                    </div>
                    <span id="lockToggleLabel" style="font-size: 0.9rem; color: #666;">
                        ${item.lockStatus === true || item.lockStatus === 'true' ? '잠금됨 (수정 불가)' : '잠금 해제됨 (수정 가능)'}
                    </span>
                </div>
                <small style="color: #666; font-size: 0.8rem; margin-top: 0.25rem; display: block;">
                    잠금 시 수강생이 신청정보를 수정할 수 없습니다.
                </small>
            </div>
        `;
    }
    
    // 교육과정 체크박스 생성
    generateEducationCheckboxes(pageType, item) {
        const currentEducation = item.detailedEducation || '';
        
        // 더 안전한 구분자 처리 - 쉼표+공백 또는 세미콜론으로 구분
        let selectedCourses = [];
        if (currentEducation) {
            // 먼저 세미콜론으로 구분 시도 (더 안전한 구분자)
            if (currentEducation.includes(';')) {
                selectedCourses = currentEducation.split(';').map(course => course.trim()).filter(course => course);
            } else {
                // 쉼표로 구분하되, 연속된 쉼표+공백 패턴을 찾아서 구분
                // 예: "과정1, 과정2" (구분자) vs "HVDC, MVDC" (과정명 내부)
                const parts = currentEducation.split(/,\s*(?=\d+주:)/); // 숫자+주: 패턴 앞의 쉼표+공백으로 구분
                if (parts.length > 1) {
                    selectedCourses = parts.map(course => course.trim()).filter(course => course);
                } else {
                    // 단일 과정인 경우
                    selectedCourses = [currentEducation.trim()];
                }
            }
        }
        
        // 디버깅을 위한 콘솔 로그
        console.log('신청자 이름:', item.applicantName || item.studentName || '이름 없음');
        console.log('신청과목들:', {
            원본데이터: currentEducation,
            파싱된배열: selectedCourses,
            배열길이: selectedCourses.length
        });
        
        if (pageType === 'PSAC') {
            const psacCourses = [
                '1주: 전력계통 해석의 기본 이론',
                '2주: 전력계통(설비) 보호기술',
                '3주: 동기발전기 기술',
                '4주: 무효전력 운영과 전압제어',
                '5주: 전력설비의 동특성(계통안정도)',
                '6주: 분산에너지 시스템 기술',
                '7주: 보호릴레이 정정법과 보호협조기술',
                '8주: HVDC, MVDC, LVDC 및 FACTS기술',
                '9주: 에너지 전환기의 전력계통 계획과 운영/에너지 시장과 신사업 모델',
                '10주: 신재생에너지 계통연계 기술'
            ];
            
            console.log('PSAC 체크박스 생성 중...');
            return psacCourses.map((course, index) => {
                const isChecked = selectedCourses.includes(course);
                const checkedAttr = isChecked ? 'checked="checked"' : '';
                console.log(`${course}: ${isChecked ? '체크됨' : '체크안됨'}`);
                return `
                    <div class="education-checkbox-item">
                        <input type="checkbox" id="psac_week_${index + 1}" name="detailedEducation" value="${course}" ${checkedAttr}>
                        <label for="psac_week_${index + 1}">${course}</label>
                    </div>
                `;
            }).join('');
            
        } else if (pageType === 'RelaySchool') {
            const relayCourses = [
                // 현재 진행 중인 과정들
                '디지털릴레이 기본반 (2025년 9월 17일(수) ~ 9월 19일(금))',
                '디지털릴레이 고급반 (2025년 10월 22일(수) ~ 10월 24일(금))',
                '고장분석반 (2025년 11월 19일(수) ~ 11월 21일(금))',
                // 마감된 과정들
                '디지털릴레이 기본반 (2025년 3월 19일(수) ~ 3월 21일(금))',
                '디지털릴레이 고급반 (2025년 4월 16일(수) ~ 4월 18일(금))',
                '고장분석반 (2025년 5월 21일(수) ~ 5월 23일(금))',
                'ECMS운영반 (2025년 6월 18일(수) ~ 6월 20일(금))',
                '원자력 특성화반 (2025년 7월 16일(수) ~ 7월 20일(일))'
            ];
            
            console.log('RelaySchool 체크박스 생성 중...');
            return relayCourses.map((course, index) => {
                const isChecked = selectedCourses.includes(course);
                const checkedAttr = isChecked ? 'checked="checked"' : '';
                console.log(`${course}: ${isChecked ? '체크됨' : '체크안됨'}`);
                return `
                    <div class="education-checkbox-item">
                        <input type="checkbox" id="relay_course_${index + 1}" name="detailedEducation" value="${course}" ${checkedAttr}>
                        <label for="relay_course_${index + 1}">${course}</label>
                    </div>
                `;
            }).join('');
        }
        
        return `<textarea name="detailedEducation" required>${currentEducation}</textarea>`;
    }
    
    // 갤러리 수정 폼 생성
    generateGalleryEditForm(item, pageType) {
        // 🟡 디버깅: 폼 생성 시작
        console.group('🔍 [DEBUG] generateGalleryEditForm 호출됨');
        console.log('📋 pageType:', pageType);
        console.log('📦 item 데이터:', item);
        
        const isContentType = (pageType === '인사이드' || pageType === '아카데미');
        console.log('📝 컨텐츠 타입 여부:', isContentType);
        
        // 이미지 슬라이드와 링크 처리 - 실제 데이터 구조에 맞게 수정
        const imageArray = item.image || [];
        console.log('🖼️ 이미지 배열:', imageArray);
        console.log('🔢 이미지 개수:', imageArray.length);
        
        // 모든 이미지들을 HTML로 생성
        let allImagesHTML = '';
        if (imageArray && imageArray.length > 0) {
            allImagesHTML = imageArray.map((imgUrl, index) => {
                return `<img src="${imgUrl}" alt="이미지 ${index + 1}" style="max-width: 100%; max-height:350px; margin: 5px; border-radius: 4px; object-fit: contain;">`;
            }).join('');
        } else {
            allImagesHTML = '<span style="color: #6c757d;">이미지가 없습니다</span>';
        }
        
        // 현재 활성화 상태 - 실제 데이터 구조에 맞게 수정
        const isActive = item.active === true || item.active === 'true' || item.active === 'ON' || item.state === 'on';
        console.log('✅ 활성화 상태:', isActive);
        
        // 제목 필드 값들 확인 - 실제 데이터 구조에 맞게 수정
        const titleKor = item.titleKor || item.titleKR || item.title || '';
        const titleEng = item.titleEng || item.titleEN || item.titleEnglish || '';
        console.log('🏷️ 한글 제목:', titleKor);
        console.log('🏷️ 영어 제목:', titleEng);
        
        // 내용 필드 값들 확인 (컨텐츠 타입인 경우만)
        if (isContentType) {
            const contentKor = item.contentKor || item.contentKR || item.content || '';
            const contentEng = item.contentEng || item.contentEN || item.contentEnglish || '';
            console.log('📝 한글 내용:', contentKor);
            console.log('📝 영어 내용:', contentEng);
        }
        
        const formHTML = `
            <div class="gallery-readonly-notice">
                <i class="fas fa-info-circle"></i>
                이미지들은 수정할 수 없습니다. 신규 등록을 통해 추가해주시기 바랍니다. (제목, 내용${isContentType ? ', 상세 내용' : ''} 및 활성화 상태만 수정 가능합니다.)
            </div>
            
            <div class="gallery-image-container">
                <div class="gallery-image-section" style="flex: 1;">
                    <h4>모든 이미지들 (${imageArray.length}개)</h4>
                    <div class="gallery-image-preview" style="height: auto; max-height: 500px;">
                        ${allImagesHTML}
                    </div>
                </div>
            </div>
            
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>한글 제목</label>
                    <input type="text" name="titleKor" value="${titleKor}" required>
                </div>
                <div class="edit-form-group">
                    <label>영어 제목</label>
                    <input type="text" name="titleEng" value="${titleEng}" required>
                </div>
            </div>
            
            ${pageType === '아카데미' ? `
            <div class="edit-form-row">
                <div class="edit-form-group" style="width: 100%;">
                    <label>카테고리</label>
                    <select name="category" required>
                        <option value="psac" ${(item.category || '').toLowerCase() === 'psac' ? 'selected' : ''}>PSAC</option>
                        <option value="relay" ${(item.category || '').toLowerCase() === 'relay' ? 'selected' : ''}>Relay School</option>
                    </select>
                </div>
            </div>
            ` : ''}
            
            ${isContentType ? `
            <div class="edit-form-row">
                <div class="edit-form-group">
                    <label>한글 내용</label>
                    <textarea name="contentKor" rows="4">${item.contentKor || item.contentKR || item.content || ''}</textarea>
                </div>
                <div class="edit-form-group">
                    <label>영문 내용</label>
                    <textarea name="contentEng" rows="4">${item.contentEng || item.contentEN || item.contentEnglish || ''}</textarea>
                </div>
            </div>
            ` : ''}
            
            <div class="gallery-toggle-container">
                <label>활성화 상태:</label>
                <div class="gallery-toggle ${isActive ? 'active' : ''}" id="galleryActiveToggle">
                    <input type="hidden" name="active" value="${isActive ? 'true' : 'false'}">
                </div>
                <span id="toggleLabel">${isActive ? 'ON' : 'OFF'}</span>
            </div>
        `;
        
        console.log('✅ 폼 HTML 생성 완료, 길이:', formHTML.length);
        console.groupEnd();
        
        return formHTML;
    }
    
    // 보도자료 수정 폼 생성
    generatePressEditForm(item, pageType) {
        console.group('🔍 [DEBUG] generatePressEditForm 호출됨');
        console.log('📋 pageType:', pageType);
        console.log('📦 item 데이터:', item);
        
        // 이미지 처리
        const imageArray = item.image || [];
        console.log('🖼️ 이미지 배열:', imageArray);
        
        let allImagesHTML = '';
        if (imageArray && imageArray.length > 0) {
            allImagesHTML = imageArray.map((imgUrl, index) => {
                return `<img src="${imgUrl}" alt="이미지 ${index + 1}" style="max-width: 100%; max-height:350px; margin: 5px; border-radius: 4px; object-fit: contain;">`;
            }).join('');
        } else {
            allImagesHTML = '<span style="color: #6c757d;">이미지가 없습니다</span>';
        }
        
        // 현재 활성화 상태
        const isActive = item.active === true || item.active === 'true' || item.active === 'ON' || item.state === 'on';
        console.log('✅ 활성화 상태:', isActive);
        
        // 제목 필드 값들
        const titleKor = item.titleKor || item.titleKR || item.title || '';
        const titleEng = item.titleEng || item.titleEN || item.titleEnglish || '';
        console.log('🏷️ 한글 제목:', titleKor);
        console.log('🏷️ 영문 제목:', titleEng);
        
        // 내용 필드 값들
        const contentKor = item.contentKor || item.contentKR || item.content || '';
        const contentEng = item.contentEng || item.contentEN || item.contentEnglish || '';
        console.log('📄 한글 내용:', contentKor.substring(0, 50) + '...');
        console.log('📄 영문 내용:', contentEng.substring(0, 50) + '...');
        
        const formHTML = `
            <div class="edit-form-section-title">보도자료 정보</div>
            
            <div class="edit-form-group">
                <label>제목 (한글):</label>
                <input type="text" name="titleKR" value="${titleKor}" required>
            </div>
            
            <div class="edit-form-group">
                <label>제목 (영문):</label>
                <input type="text" name="titleEN" value="${titleEng}">
            </div>
            
            <div class="edit-form-group">
                <label>내용 (한글):</label>
                <textarea name="contentKR" rows="8" required>${contentKor}</textarea>
            </div>
            
            <div class="edit-form-group">
                <label>내용 (영문):</label>
                <textarea name="contentEN" rows="8">${contentEng}</textarea>
            </div>
            
            <div class="edit-form-section-title">이미지</div>
            <div class="edit-form-group">
                <label>현재 이미지:</label>
                <div class="press-image-preview" style="display: flex; flex-wrap: wrap; gap: 10px; max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
                    ${allImagesHTML}
                </div>
                <input type="hidden" name="image" value='${JSON.stringify(imageArray)}'>
                <small style="color: #6c757d; font-size: 0.8em;">이미지 수정은 구글 시트에서 직접 해주세요.</small>
            </div>
            
            <div class="edit-form-section-title">상태</div>
            <div class="press-toggle-container">
                <label>활성화 상태:</label>
                <div class="press-toggle ${isActive ? 'active' : ''}" id="pressActiveToggle">
                    <input type="hidden" name="active" value="${isActive ? 'true' : 'false'}">
                </div>
                <span id="pressToggleLabel">${isActive ? 'ON' : 'OFF'}</span>
            </div>
        `;
        
        console.log('✅ 보도자료 폼 HTML 생성 완료, 길이:', formHTML.length);
        console.groupEnd();
        
        return formHTML;
    }
    
    // 갤러리 토글 버튼 설정
    setupGalleryToggle() {
        const toggle = document.getElementById('galleryActiveToggle');
        const hiddenInput = toggle.querySelector('input[name="active"]');
        const label = document.getElementById('toggleLabel');
        
        if (toggle) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const isActive = toggle.classList.contains('active');
                hiddenInput.value = isActive ? 'true' : 'false';
                label.textContent = isActive ? 'ON' : 'OFF';
            });
        }
    }
    
    // 보도자료 토글 버튼 설정
    setupPressToggle() {
        const toggle = document.getElementById('pressActiveToggle');
        const hiddenInput = toggle.querySelector('input[name="active"]');
        const label = document.getElementById('pressToggleLabel');
        
        if (toggle) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const isActive = toggle.classList.contains('active');
                hiddenInput.value = isActive ? 'true' : 'false';
                label.textContent = isActive ? 'ON' : 'OFF';
            });
        }
    }
    
    // 잠금 상태 토글 버튼 설정
    setupLockToggle() {
        const toggle = document.getElementById('lockStatusToggle');
        const hiddenInput = toggle?.querySelector('input[name="lockStatus"]');
        const label = document.getElementById('lockToggleLabel');
        
        if (toggle && hiddenInput && label) {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('active');
                const isLocked = toggle.classList.contains('active');
                hiddenInput.value = isLocked ? 'true' : 'false';
                label.textContent = isLocked ? '잠금됨 (수정 불가)' : '잠금 해제됨 (수정 가능)';
            });
        }
    }
}

// 전역 함수들 (버튼 onclick에서 사용)
async function deleteItem(id, event) {
    // 이벤트 전파 방지
    if (event) {
        event.stopPropagation();
    }
    
    if (!confirm('정말로 이 항목을 삭제하시겠습니까?')) {
        return; // 사용자가 취소를 선택한 경우
    }
    
    try {
        // 현재 페이지 정보 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const pageParam = urlParams.get('page');
        
        // PageManager 인스턴스에서 설정 정보 가져오기
        const pageManager = window.pageManagerInstance; // 전역 변수로 저장된 인스턴스
        if (!pageManager || !pageManager.pageConfigs[pageParam]) {
            alert('오류: 페이지 설정을 찾을 수 없습니다.');
            return;
        }
        
        const config = pageManager.pageConfigs[pageParam];
        const appsScriptUrl = pageManager.appsScriptUrl;
        
        // 삭제 API 호출 (GET 방식으로 변경 - CORS 문제 해결)
        const deleteUrl = `${appsScriptUrl}?action=delete&sheet=${config.apiSheet}&id=${encodeURIComponent(id)}`;
        const response = await fetch(deleteUrl, {
            method: 'GET'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 성공: 페이지 새로고침
            location.reload();
        } else {
            // 실패: 오류 메시지 표시
            alert(`오류: 삭제에 실패했습니다. (${result.message})`);
        }
        
    } catch (error) {
        console.error('삭제 오류:', error);
        alert('오류: 삭제에 실패했습니다.');
    }
}

// 모달 외부 클릭 시 닫기
window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editModal');
    if (event.target === editModal) {
        closeEditModal();
    }
    
    const groupEditSelectModal = document.getElementById('groupEditSelectModal');
    if (event.target === groupEditSelectModal) {
        closeGroupEditSelectModal();
    }
    
    const galleryEditModal = document.getElementById('galleryEditModal');
    if (event.target === galleryEditModal) {
        closeGalleryEditModal();
    }
});

// 그룹 수정 선택 모달 관련 전역 함수
function closeGroupEditSelectModal() {
    document.getElementById('groupEditSelectModal').style.display = 'none';
}

// 수정 모달 관련 전역 함수들
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    window.currentEditItem = null;
    window.currentEditConfig = null;
}

// 수정된 항목 저장
async function saveEditedItem() {
    // 보도자료 편집인지 확인
    if (window.currentPressEditItem) {
        return savePressEditedItem();
    }
    
    const form = document.getElementById('editForm');
    const formData = new FormData(form);
    
    // 폼 유효성 검사
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // 폼 데이터를 객체로 변환
    const updatedData = {};
    
    // 체크박스 항목들 (선택세부교육) 처리
    const educationCheckboxes = form.querySelectorAll('input[name="detailedEducation"]:checked');
    if (educationCheckboxes.length > 0) {
        // 세미콜론으로 구분하여 저장
        updatedData.detailedEducation = Array.from(educationCheckboxes).map(cb => cb.value).join('; ');
    } else {
        // 체크박스가 아닌 경우 (다른 페이지 타입)
        const educationTextarea = form.querySelector('textarea[name="detailedEducation"]');
        if (educationTextarea) {
            updatedData.detailedEducation = educationTextarea.value;
        }
    }
    
    // 나머지 폼 데이터 처리
    for (let [key, value] of formData.entries()) {
        if (key !== 'detailedEducation') { // 이미 처리한 detailedEducation 제외
            updatedData[key] = value;
        }
    }
    
    // 원본 아이템의 읽기 전용 필드들 유지
    const originalItem = window.currentEditItem;
    // updatedData.number = "=ROW()-1";
    updatedData.applicationDate = originalItem.applicationDate;
    updatedData.courseName = originalItem.courseName;
    updatedData.educationSchedule = originalItem.educationSchedule;
    
    if (!confirm('수정사항을 저장하시겠습니까?')) {
        return;
    }
    
    try {
        const config = window.currentEditConfig;
        const pageManager = window.pageManagerInstance;
        
        if (!config || !pageManager) {
            alert('오류: 설정 정보를 찾을 수 없습니다.');
            return;
        }
        
        // 수정 API 호출 (GET 방식으로 변경 - CORS 문제 해결)
        const updateUrl = `${pageManager.appsScriptUrl}?action=update&sheet=${config.apiSheet}&id=${encodeURIComponent(originalItem.number)}&data=${encodeURIComponent(JSON.stringify(updatedData))}`;
        
        // 디버깅을 위한 로그
        console.log('=== 수정 요청 디버깅 ===');
        console.log('시트:', config.apiSheet);
        console.log('ID:', originalItem.number);
        console.log('수정할 데이터:', updatedData);
        console.log('요청 URL:', updateUrl);
        console.log('========================');
        
        const response = await fetch(updateUrl, {
            method: 'GET'
        });
        
        console.log('응답 상태:', response.status);
        console.log('응답 헤더:', response.headers);
        
        const result = await response.json();
        console.log('Apps Script 응답:', result);
        
        if (result.success) {
            alert('수정이 완료되었습니다.');
            closeEditModal();
            location.reload();
        } else {
            alert(`오류: 수정에 실패했습니다. (${result.message})`);
        }
        
    } catch (error) {
        console.error('수정 오류:', error);
        alert('오류: 수정에 실패했습니다.');
    }
}

// 전체 선택/해제 기능
function toggleGroupSelectAll() {
    const selectAllCheckbox = document.getElementById('groupSelectAll');
    const itemCheckboxes = document.querySelectorAll('.group-select-checkbox');
    
    itemCheckboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
}

// 선택된 그룹 항목들 삭제
async function deleteSelectedGroupItems() {
    const selectedCheckboxes = document.querySelectorAll('.group-select-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('삭제할 항목을 선택해주세요.');
        return;
    }
    
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.itemId);
    const confirmMessage = `선택된 ${selectedIds.length}개 항목을 삭제하시겠습니까?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const pageManager = window.pageManagerInstance;
        const config = pageManager.currentConfig;
        
        if (!config) {
            alert('설정 정보를 찾을 수 없습니다.');
            return;
        }
        
        for (const itemId of selectedIds) {
            const deleteUrl = `${pageManager.appsScriptUrl}?action=delete&sheet=${config.apiSheet}&id=${encodeURIComponent(itemId)}`;
            const response = await fetch(deleteUrl, { method: 'GET' });
            const result = await response.json();
            
            if (!result.success) {
                console.error(`Failed to delete item ${itemId}:`, result.message);
            }
        }
        
        alert(`${selectedIds.length}개 항목이 삭제되었습니다.`);
        closeGroupEditSelectModal();
        location.reload();
        
    } catch (error) {
        console.error('삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

// 개별 그룹 항목 삭제
async function deleteIndividualGroupItem(itemId) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const pageManager = window.pageManagerInstance;
        const config = pageManager.currentConfig;
        
        if (!config) {
            alert('설정 정보를 찾을 수 없습니다.');
            return;
        }
        
        const deleteUrl = `${pageManager.appsScriptUrl}?action=delete&sheet=${config.apiSheet}&id=${encodeURIComponent(itemId)}`;
        const response = await fetch(deleteUrl, { method: 'GET' });
        const result = await response.json();
        
        if (result.success) {
            alert('항목이 삭제되었습니다.');
            closeGroupEditSelectModal();
            location.reload();
        } else {
            alert(`삭제 실패: ${result.message}`);
        }
        
    } catch (error) {
        console.error('삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

// 갤러리 모달 관련 전역 함수들
function closeGalleryEditModal() {
    document.getElementById('galleryEditModal').style.display = 'none';
    window.currentGalleryEditItem = null;
    window.currentGalleryEditConfig = null;
    window.currentGalleryPageType = null;
}

// 갤러리 수정된 항목 저장
async function saveGalleryEditedItem() {
    const form = document.getElementById('galleryEditForm');
    const formData = new FormData(form);
    
    // 폼 유효성 검사
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // 폼 데이터를 객체로 변환
    const updatedData = {};
    for (let [key, value] of formData.entries()) {
        updatedData[key] = value;
    }
    
    // 원본 아이템의 읽기 전용 필드들 유지
    const originalItem = window.currentGalleryEditItem;
    const pageType = window.currentGalleryPageType;
    
    // 🟡 디버깅: 수정할 데이터 확인
    console.log('📝 [DEBUG] 폼에서 가져온 데이터:', updatedData);
    console.log('📦 [DEBUG] 원본 아이템:', originalItem);
    
    // 실제 필드명에 맞게 데이터 매핑
    const finalData = {
        id: originalItem.id,
        date: originalItem.date,
        titleKR: updatedData.titleKor || originalItem.titleKR,
        titleEN: updatedData.titleEng || originalItem.titleEN,
        image: originalItem.image, // 이미지 배열 유지
        state: updatedData.active === 'true' ? 'on' : 'off'
    };
    
    // 아카데미인 경우 카테고리 필드 추가
    if (pageType === '아카데미') {
        finalData.category = updatedData.category || originalItem.category;
    }
    
    // 컨텐츠 타입인 경우 내용 필드 추가
    if (pageType === '인사이드' || pageType === '아카데미') {
        finalData.contentKR = updatedData.contentKor || '';
        finalData.contentEN = updatedData.contentEng || '';
    }
    
    console.log('✅ [DEBUG] 최종 전송 데이터:', finalData);
    
    if (!confirm('수정사항을 저장하시겠습니까?')) {
        return;
    }
    
    try {
        const config = window.currentGalleryEditConfig;
        if (!config) {
            alert('오류: 설정 정보를 찾을 수 없습니다.');
            return;
        }
        
        // 수정 API 호출 - GET 방식 (기존 방식)
        const updateUrl = `${window.pageManagerInstance.appsScriptUrl}?action=update&sheet=${config.apiSheet}&id=${encodeURIComponent(originalItem.id)}&data=${encodeURIComponent(JSON.stringify(finalData))}`;
        
        // 디버깅을 위한 로그
        console.log('=== 갤러리 수정 요청 디버깅 ===');
        console.log('시트:', config.apiSheet);
        console.log('ID:', originalItem.id);
        console.log('수정할 데이터:', finalData);
        console.log('요청 URL:', updateUrl);
        console.log('==========================');
        
        const response = await fetch(updateUrl, {
            method: 'GET'
        });
        console.log('시트:', config.apiSheet);
        console.log('ID:', originalItem.id);
        console.log('수정할 데이터:', finalData);
        console.log('요청 방식: POST');
        console.log('==========================');
        
        const result = await response.json();
        
        if (result.success) {
            alert('수정이 완료되었습니다.');
            closeGalleryEditModal();
            location.reload();
        } else {
            alert(`오류: 수정에 실패했습니다. (${result.message})`);
        }
        
    } catch (error) {
        console.error('갤러리 수정 오류:', error);
        alert('오류: 수정에 실패했습니다.');
    }
}

// 보도자료 수정된 항목 저장
async function savePressEditedItem() {
    const form = document.getElementById('editForm');
    const formData = new FormData(form);
    
    // 폼 유효성 검사
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // 폼 데이터를 객체로 변환
    const updatedData = {};
    for (let [key, value] of formData.entries()) {
        updatedData[key] = value;
    }
    
    console.log('🔍 보도자료 수정 데이터:', updatedData);
    
    // 이미지 데이터 처리 (JSON 문자열을 배열로 변환)
    if (updatedData.image) {
        try {
            updatedData.image = JSON.parse(updatedData.image);
        } catch (e) {
            console.log('이미지 데이터 파싱 실패, 문자열로 유지');
        }
    }
    
    // 활성화 상태를 문자열로 변환 (on/off)
    updatedData.state = updatedData.active === 'true' ? 'on' : 'off';
    delete updatedData.active; // active 필드 제거
    
    const originalItem = window.currentPressEditItem;
    const config = window.currentPressEditConfig;
    
    if (!confirm('수정사항을 저장하시겠습니까?')) {
        return;
    }
    
    try {
        const pageManager = window.pageManagerInstance;
        
        if (!config || !pageManager) {
            alert('오류: 설정 정보를 찾을 수 없습니다.');
            return;
        }
        
        // 수정 API 호출 (GET 방식)
        const updateUrl = `${pageManager.appsScriptUrl}?action=update&sheet=${config.apiSheet}&id=${encodeURIComponent(originalItem.id)}&data=${encodeURIComponent(JSON.stringify(updatedData))}`;
        
        // 디버깅을 위한 로그
        console.log('=== 보도자료 수정 요청 디버깅 ===');
        console.log('시트:', config.apiSheet);
        console.log('ID:', originalItem.id);
        console.log('수정할 데이터:', updatedData);
        console.log('요청 URL:', updateUrl);
        console.log('============================');
        
        const response = await fetch(updateUrl, {
            method: 'GET'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('수정이 완료되었습니다.');
            closeEditModal();
            location.reload();
        } else {
            alert(`오류: 수정에 실패했습니다. (${result.message})`);
        }
        
    } catch (error) {
        console.error('보도자료 수정 오류:', error);
        alert('오류: 수정에 실패했습니다.');
    }
}

// ESC 키로 모달 닫기 기능 설정
function setupModalKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
        // ESC 키가 눌렸을 때
        if (event.key === 'Escape') {
            // 현재 열려있는 모달 찾기
            const groupModal = document.getElementById('groupEditSelectModal');
            const editModal = document.getElementById('editModal');
            const galleryModal = document.getElementById('galleryEditModal');
            
            // 열려있는 모달을 순서대로 확인하여 닫기
            if (groupModal && groupModal.style.display === 'flex') {
                closeGroupEditSelectModal();
                event.preventDefault();
            } else if (editModal && editModal.style.display === 'flex') {
                closeEditModal();
                event.preventDefault();
            } else if (galleryModal && galleryModal.style.display === 'flex') {
                closeGalleryEditModal();
                event.preventDefault();
            }
        }
    });
}
