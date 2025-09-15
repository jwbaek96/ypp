// YPP 아카데미 신청 폼 통합 JavaScript
document.addEventListener('DOMContentLoaded', async function() {
    // 로딩 상태 표시
    showLoadingState();
    
    // 먼저 과정 데이터 로드
    console.log('Starting course data load...');
    const dataLoaded = await loadCourseData();
    
    // 로딩 상태 숨김
    hideLoadingState();
    
    if (!dataLoaded) {
        console.error('Failed to load course data');
        alert('교육과정 데이터를 불러오는데 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.');
        // 데이터 로드 실패 시 수강자 추가를 하지 않음
        return;
    }
    
    console.log('Course data loaded successfully, initializing forms...');
    
    // Relay School 폼이 있을 경우 첫 번째 수강자 자동 추가
    if (document.getElementById('relayschool-students-container')) {
        addRelayschoolStudent();
    }

    // PSAC 폼이 있을 경우 첫 번째 수강자 자동 추가
    if (document.getElementById('psac-students-container')) {
        addPsacStudent();
    }

    // 폼 제출 이벤트 연결
    const psacForm = document.getElementById('psac-form');
    if (psacForm) {
        psacForm.addEventListener('submit', submitPsacForm);
    }

    const relayForm = document.getElementById('relayschool-form');
    if (relayForm) {
        relayForm.addEventListener('submit', submitRelayschoolForm);
    }

    // 사업자등록번호 포맷팅 (각 폼별로 id가 다르면 각각 처리)
    const psacBusinessNumberInput = document.getElementById('psac-businessNumber');
    if (psacBusinessNumberInput) {
        psacBusinessNumberInput.addEventListener('input', function(e) {
            e.target.value = formatBusinessNumber(e.target.value);
        });
    }
    const relayBusinessNumberInput = document.getElementById('relayschool-businessNumber');
    if (relayBusinessNumberInput) {
        relayBusinessNumberInput.addEventListener('input', function(e) {
            e.target.value = formatBusinessNumber(e.target.value);
        });
    }

    // 전화번호 포맷팅 (담당자, 각 폼별로 id가 다르면 각각 처리)
    const psacManagerPhoneInputs = ['psac-managerPhone', 'psac-managerMobile'];
    psacManagerPhoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function(e) {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
    });
    const relayManagerPhoneInputs = ['relayschool-managerPhone', 'relayschool-managerMobile'];
    relayManagerPhoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function(e) {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
    });
});
/* ==========================================================================
   공통 설정 및 변수
   ========================================================================== */

// 웹 앱 URL - 실제 Apps Script 웹 앱 URL로 변경해주세요
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyHhQzzGXZGkxenE8g7-0Y9-wfxPFSsSax0WSHW1_7DWbwyoxOM75-FKCeVLakazJdo/exec';

// 공통 변수
let psacStudentCount = 0;
let relayStudentCount = 0;

// 현재 언어 감지 함수
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'kor';
}

// 동적으로 로드될 과정 데이터 저장소
let psacCoursesData = null;
let relayCoursesData = null;

// 과정 데이터 로드 함수들
async function loadCourseData() {
    try {
        console.log('Loading course data from Google Sheets...');
        
        // 병렬로 데이터 로드
        const [psacData, relayData] = await Promise.all([
            fetchPsacCourses(),
            fetchRelayCourses()
        ]);
        
        psacCoursesData = psacData;
        relayCoursesData = relayData;
        
        console.log('Course data loaded successfully');
        return true;
    } catch (error) {
        console.error('Error loading course data:', error);
        return false;
    }
}

/* ==========================================================================
   공통 유틸리티 함수
   ========================================================================== */

// 페이지 로딩 상태 표시
function showLoadingState() {
    const body = document.body;
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'course-data-loading';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-size: 18px;
        color: #333;
    `;
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 10px; font-size: 24px;"><i class="fas fa-spinner fa-spin"></i></div>
        </div>
    `;
    body.appendChild(loadingDiv);
}

// 페이지 로딩 상태 숨김
function hideLoadingState() {
    const loadingDiv = document.getElementById('course-data-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 폼 제출 로딩 상태 표시
function showSubmitLoadingState(message = '신청서를 제출하는 중입니다...') {
    const body = document.body;
    
    // 모든 제출 버튼 비활성화
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    submitButtons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
    });
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'form-submit-loading';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-size: 18px;
        color: #333;
    `;
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <div style="margin-bottom: 10px; font-size: 24px;"><i class="fas fa-spinner fa-spin"></i></div>
            <div>${message}</div>
            <div style="margin-top: 10px; font-size: 14px; color: #666;">잠시만 기다려주세요...</div>
        </div>
    `;
    body.appendChild(loadingDiv);
}

// 폼 제출 로딩 상태 숨김
function hideSubmitLoadingState() {
    const loadingDiv = document.getElementById('form-submit-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
    
    // 모든 제출 버튼 다시 활성화
    const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    submitButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
}

// 메시지 표시 함수
function showMessage(message, type, containerId) {
    const messageDiv = document.getElementById(containerId);
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `ac-form-message ${type}`;
        messageDiv.style.display = 'block';
        
        // 성공 메시지는 5초, 오류 메시지는 10초 후 숨김
        const hideDelay = type === 'success' ? 5000 : 10000;
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, hideDelay);
    }
}

// 로딩 상태 표시/숨김
function toggleLoading(show, containerId) {
    const loadingDiv = document.getElementById(containerId);
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
}

// 사업자등록번호 포맷팅
function formatBusinessNumber(value) {
    value = value.replace(/[^0-9]/g, '');
    if (value.length >= 3) {
        value = value.substring(0, 3) + '-' + value.substring(3);
    }
    if (value.length >= 6) {
        value = value.substring(0, 6) + '-' + value.substring(6, 11);
    }
    return value;
}

// 전화번호 포맷팅
function formatPhoneNumber(value) {
    value = value.replace(/[^0-9]/g, '');

    // 02 지역번호 (서울)
    if (value.startsWith('02')) {
        if (value.length > 2 && value.length <= 5) {
            value = value.slice(0, 2) + '-' + value.slice(2);
        } else if (value.length > 5 && value.length <= 9) {
            value = value.slice(0, 2) + '-' + value.slice(2, value.length - 4) + '-' + value.slice(-4);
        } else if (value.length > 9) {
            value = value.slice(0, 2) + '-' + value.slice(2, value.length - 4) + '-' + value.slice(-4);
        }
    }
    // 그 외 지역번호 (3자리)
    else if (value.length >= 9 && value.length <= 11) {
        if (value.length === 9) { // 3-3-3
            value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6);
        } else if (value.length === 10) { // 3-3-4 or 3-4-3
            value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6);
        } else if (value.length === 11) { // 3-4-4 (휴대폰)
            value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
        }
    }
    // 8자리(옛날번호 등)
    else if (value.length === 8) {
        value = value.slice(0, 4) + '-' + value.slice(4);
    }

    return value;
}

// 이메일 유효성 검사
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 사업자등록번호 유효성 검사
function validateBusinessNumber(number) {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    return cleanNumber.length === 10;
}

// 전화번호 유효성 검사
function validatePhoneNumber(number) {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 11;
}

// CORS 우회 데이터 제출 함수 (iframe 방식)
function submitFormData(formData) {
    return new Promise((resolve, reject) => {
        // 숨겨진 iframe 생성
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = 'hidden_iframe';
        document.body.appendChild(iframe);
        
        // 폼 생성
        const form = document.createElement('form');
        form.action = WEBAPP_URL;
        form.method = 'POST';
        form.target = 'hidden_iframe';
        
        // 데이터를 JSON 문자열로 변환하여 hidden input에 저장
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(formData);
        
        form.appendChild(input);
        document.body.appendChild(form);
        
        // iframe 로드 완료 시 처리
        iframe.onload = function() {
            setTimeout(() => {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                resolve();
            }, 1000);
        };
        
        // 폼 제출
        form.submit();
    });
}

/* ==========================================================================
   공통 이벤트 리스너
   ========================================================================== */

// 동적으로 추가되는 수강자 전화번호 포맷팅
document.addEventListener('input', function(e) {
    if (e.target.type === 'tel' && (e.target.id.includes('studentPhone') || e.target.id.includes('studentMobile'))) {
        e.target.value = formatPhoneNumber(e.target.value);
    }
});

/* ==========================================================================
   PSAC 전용 함수
   ========================================================================== */

// PSAC 수강자 추가
function addPsacStudent() {
    // 데이터가 로드되지 않았으면 추가하지 않음
    if (!psacCoursesData || !psacCoursesData.courses) {
        console.error('PSAC course data not loaded, cannot add student');
        alert('교육과정 데이터가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    psacStudentCount++;
    const container = document.getElementById('psac-students-container');
    
    const studentDiv = document.createElement('div');
    studentDiv.className = 'ac-form-student-section';
    studentDiv.id = `psac-student-${psacStudentCount}`;
    
    const currentLang = getCurrentLanguage();
    
    // 동적으로 로드된 PSAC 과정 데이터 사용
    let courseCheckboxes = '';
    
    if (psacCoursesData && psacCoursesData.courses) {
        courseCheckboxes = Object.keys(psacCoursesData.courses).map((courseKey) => {
            const course = psacCoursesData.courses[courseKey];
            const courseText = course[currentLang];
            const isClosed = psacCoursesData.closedCourses && psacCoursesData.closedCourses.hasOwnProperty(courseKey);
            const closedTooltip = isClosed ? psacCoursesData.closedCourses[courseKey].tooltip : '';
            
            // 코스 자체의 툴팁 가져오기
            const courseTooltip = course.tooltip || '';
            
            // title 속성용 툴팁 (닫힌 과정은 closedTooltip, 아니면 courseTooltip)
            const titleTooltip = isClosed ? closedTooltip : courseTooltip;

            return `
            <div class="psac-checkbox-item ${isClosed ? 'psac-checkbox-disabled' : ''}">
                <input type="checkbox" 
                       id="psac-course-${psacStudentCount}-${courseKey}" 
                       name="psac-student-${psacStudentCount}-courses" 
                       value="${courseText}"
                       ${isClosed ? 'disabled' : ''}>
                <label for="psac-course-${psacStudentCount}-${courseKey}" 
                       data-kor="${course.kor} ${course.tooltipKR || ''}" 
                       data-eng="${course.eng} ${course.tooltipEN || ''}"
                       ${titleTooltip ? `title="${titleTooltip}"` : ''}>${courseText}</label>
            </div>
        `;
        }).join('');
    }
    
    studentDiv.innerHTML = `
        <div class="ac-form-student-header">
            <div class="ac-form-student-title" data-kor='수강자 ${psacStudentCount}' data-eng='Participant ${psacStudentCount}'></div>
            ${psacStudentCount > 1 ? `<button type="button" class="ac-form-btn ac-form-btn-danger" onclick="removePsacStudent(${psacStudentCount})"><i class="fas fa-trash"></i></button>` : ''}
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="psac-studentName-${psacStudentCount}" class="ac-form-label ac-form-required" data-kor='수강자명' data-eng='Name'>수강자명</label>
                <input type="text" id="psac-studentName-${psacStudentCount}" name="studentName-${psacStudentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="psac-studentDepartment-${psacStudentCount}" class="ac-form-label ac-form-required" data-kor='부서' data-eng='Department'>부서</label>
                <input type="text" id="psac-studentDepartment-${psacStudentCount}" name="studentDepartment-${psacStudentCount}" class="ac-form-input" required>
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="psac-studentPosition-${psacStudentCount}" class="ac-form-label ac-form-required" data-kor='직급' data-eng='Position'>직급</label>
                <input type="text" id="psac-studentPosition-${psacStudentCount}" name="studentPosition-${psacStudentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="psac-studentPhone-${psacStudentCount}" class="ac-form-label" data-kor='전화번호' data-eng='Phone'>전화번호</label>
                <input type="tel" id="psac-studentPhone-${psacStudentCount}" name="studentPhone-${psacStudentCount}" class="ac-form-input" placeholder="000-0000-0000">
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="psac-studentMobile-${psacStudentCount}" class="ac-form-label ac-form-required" data-kor='핸드폰' data-eng='Mobile'>핸드폰</label>
                <input type="tel" id="psac-studentMobile-${psacStudentCount}" name="studentMobile-${psacStudentCount}" class="ac-form-input" placeholder="010-0000-0000" required>
            </div>
            <div class="ac-form-group">
                <label for="psac-studentEmail-${psacStudentCount}" class="ac-form-label ac-form-required" data-kor='이메일' data-eng='E-mail'>이메일</label>
                <input type="email" id="psac-studentEmail-${psacStudentCount}" name="studentEmail-${psacStudentCount}" class="ac-form-input" required>
            </div>
        </div>
        
        <div class="ac-form-group">
            <label class="ac-form-label ac-form-required" data-kor='선택 세부교육 (최소 1개 이상 선택)' data-eng='Select Detailed Training (At least 1 required)'>선택 세부교육 (최소 1개 이상 선택)</label>
            <div class="psac-checkbox-group">
                ${courseCheckboxes}
            </div>
        </div>
    `;
    
    container.appendChild(studentDiv);
}

// PSAC 수강자 삭제
function removePsacStudent(studentId) {
    const studentDiv = document.getElementById(`psac-student-${studentId}`);
    if (studentDiv) {
        studentDiv.remove();
    }
}

// PSAC 폼 데이터 수집
function collectPsacFormData() {
    const students = [];
    const studentSections = document.querySelectorAll('#psac-students-container .ac-form-student-section');
    
    studentSections.forEach(section => {
        const studentId = section.id.split('-')[2];
        const selectedCourses = [];
        
        // 선택된 세부교육 수집
        const checkboxes = section.querySelectorAll(`input[name="psac-student-${studentId}-courses"]:checked`);
        checkboxes.forEach(checkbox => {
            selectedCourses.push(checkbox.value);
        });
        
        students.push({
            name: document.getElementById(`psac-studentName-${studentId}`)?.value || '',
            department: document.getElementById(`psac-studentDepartment-${studentId}`)?.value || '',
            position: document.getElementById(`psac-studentPosition-${studentId}`)?.value || '',
            phone: document.getElementById(`psac-studentPhone-${studentId}`)?.value || '',
            mobile: document.getElementById(`psac-studentMobile-${studentId}`)?.value || '',
            email: document.getElementById(`psac-studentEmail-${studentId}`)?.value || '',
            selectedCourses: selectedCourses // 원래대로 배열로 전송
        });
    });
    
    return {
        formType: 'psac',
        companyInfo: {
            companyName: document.getElementById('psac-companyName')?.value || '',
            representative: document.getElementById('psac-representative')?.value || '',
            businessNumber: document.getElementById('psac-businessNumber')?.value || '',
            businessType: document.getElementById('psac-businessType')?.value || '',
            address: document.getElementById('psac-address')?.value || ''
        },
        managerInfo: {
            name: document.getElementById('psac-managerName')?.value || '',
            department: document.getElementById('psac-managerDepartment')?.value || '',
            position: document.getElementById('psac-managerPosition')?.value || '',
            phone: document.getElementById('psac-managerPhone')?.value || '',
            mobile: document.getElementById('psac-managerMobile')?.value || '',
            email: document.getElementById('psac-managerEmail')?.value || ''
        },
        students: students
    };
}

// PSAC 폼 유효성 검사
function validatePsacForm(formData) {
    // 기본 정보 유효성 검사
    if (!formData.companyInfo.companyName.trim()) {
        showMessage('회사명을 입력해 주세요.', 'error');
        alert('회사명을 입력해주세요.');
        return false;
    }
    
    if (!validateBusinessNumber(formData.companyInfo.businessNumber)) {
        showMessage('올바른 사업자등록번호를 입력해 주세요. (000-00-00000)', 'error');
        alert('올바른 사업자등록번호를 입력해주세요. (000-00-00000)');
        return false;
    }
    // 수강자 정보 유효성 검사
    if (formData.students.length === 0) {
        showMessage('최소 1명의 수강자를 등록해 주세요.', 'error');
        alert('최소 1명의 수강자를 등록해주세요.');
        return false;
    }
    
    for (let i = 0; i < formData.students.length; i++) {
        const student = formData.students[i];
        
        if (!student.name.trim()) {
            showMessage(`수강자 ${i + 1}의 이름을 입력해 주세요.`, 'error');
            alert('수강자 이름을 입력해주세요.');
            return false;
        }
        
        if (!validateEmail(student.email)) {
            showMessage(`수강자 ${i + 1}의 올바른 이메일을 입력해 주세요.`, 'error');
            alert('올바른 이메일을 입력해주세요.');
            return false;
        }
        
        if (!validatePhoneNumber(student.mobile)) {
            showMessage(`수강자 ${i + 1}의 올바른 핸드폰 번호를 입력해 주세요.`, 'error');
            alert('올바른 핸드폰 번호를 입력해주세요. (010-0000-0000)');
            return false;
        }
        
        if (student.selectedCourses.length === 0) {
            showMessage(`수강자 ${i + 1}의 세부교육을 최소 1개 이상 선택해 주세요.`, 'error');
            alert('세부교육을 최소 1개 이상 선택해주세요.');
            return false;
        }
    }
    
    return true;
}

// PSAC 폼 제출 처리
async function submitPsacForm(e) {
    e.preventDefault();
    
    // 폼 제출 로딩 상태 표시 (중복 제출 방지)
    showSubmitLoadingState('Processing...');
    
    try {
        const formData = collectPsacFormData();
        
        if (!validatePsacForm(formData)) {
            hideSubmitLoadingState();
            return;
        }
        
        // CORS 우회를 위한 iframe 방식 사용
        await submitFormData(formData);
        
        // 로딩 상태를 유지한 채로 성공 메시지 표시
        hideSubmitLoadingState();
        alert(`신청이 완료되었습니다. (수강자 ${formData.students.length}명) \nYour application has been completed. (Number of participants: ${formData.students.length})`);
        
        // alert 확인 후 페이지 리로드
        location.reload();
        
    } catch (error) {
        console.error('Error:', error);
        hideSubmitLoadingState();
        showMessage('서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    }
}

/* ==========================================================================
   Relay School 전용 함수
   ========================================================================== */

// Relay School 수강자 추가
function addRelayschoolStudent() {
    // 데이터가 로드되지 않았으면 추가하지 않음
    if (!relayCoursesData) {
        console.error('Relay course data not loaded, cannot add student');
        alert('교육과정 데이터가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    relayStudentCount++;
    const container = document.getElementById('relayschool-students-container');
    
    const studentDiv = document.createElement('div');
    studentDiv.className = 'ac-form-student-section';
    studentDiv.id = `relayschool-student-${relayStudentCount}`;
    
    const currentLang = getCurrentLanguage();
    
    // 동적으로 로드된 Relay School 과정 데이터 사용 - 모든 과정을 함께 표시
    let courseCheckboxes = '';
    
    if (relayCoursesData) {
        // relayCoursesData는 {1: {kor: '...', eng: '...', status: 'ON/OFF'}, ...} 형태
        const courseKeys = Object.keys(relayCoursesData);
        
        if (courseKeys.length === 0) {
            courseCheckboxes = '<p>사용 가능한 교육과정이 없습니다.</p>';
        } else {
            courseCheckboxes = courseKeys.map((courseKey) => {
                const course = relayCoursesData[courseKey];
                const courseText = currentLang === 'kor' ? 
                    `${course.kor}${course.tooltipKR || ''}` : 
                    `${course.eng}${course.tooltipEN || ''}`;
                const isClosed = course.status === 'OFF' || course.status === '접수마감';
                
                // 코스 자체의 툴팁 가져오기 (상태에 따른 스타일링 포함)
                const courseTooltip = course.tooltip || '';
                
                // title 속성용 툴팁
                let titleTooltip = '';
                if (isClosed) {
                    titleTooltip = currentLang === 'kor' ? '해당 항목은 접수 마감되었습니다.' : 'This course is closed due to exceeding capacity.';
                } else if (course.status === '마감임박') {
                    titleTooltip = currentLang === 'kor' ? '마감임박 - 빠른 신청 바랍니다.' : 'Almost full - Please apply quickly.';
                } else if (course.status === '마감주의') {
                    titleTooltip = currentLang === 'kor' ? '마감주의 - 신청을 서둘러 주세요.' : 'Almost full - Please hurry up with your application.';
                }
                
                return `
            <div class="psac-checkbox-item ${isClosed ? 'psac-checkbox-disabled' : ''}">
                <input type="checkbox" 
                       id="relayschool-course-${relayStudentCount}-${courseKey}" 
                       name="relayschool-student-${relayStudentCount}-courses" 
                       value="${courseText}"
                       ${isClosed ? 'disabled' : ''}>
                <label for="relayschool-course-${relayStudentCount}-${courseKey}" 
                       data-kor="${course.kor}${course.tooltipKR || ''}" 
                       data-eng="${course.eng}${course.tooltipEN || ''}"
                       ${titleTooltip ? `title="${titleTooltip}"` : ''}>${courseText}</label>
            </div>
        `;
            }).join('');
        }
    } else {
        courseCheckboxes = '<p>교육과정 데이터를 불러오는 중입니다...</p>';
    }
    
    studentDiv.innerHTML = `
        <div class="ac-form-student-header">
            <div class="ac-form-student-title" data-kor="수강자 ${relayStudentCount}" data-eng="Trainee ${relayStudentCount}"></div>
            ${relayStudentCount > 1 ? `<button type="button" class="ac-form-btn ac-form-btn-danger" onclick="removeRelayschoolStudent(${relayStudentCount})"><i class="fas fa-trash"></i></button>` : ''}
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="relayschool-studentName-${relayStudentCount}" class="ac-form-label ac-form-required" data-kor='수강자명' data-eng='Name'>수강자명</label>
                <input type="text" id="relayschool-studentName-${relayStudentCount}" name="studentName-${relayStudentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="relayschool-studentDepartment-${relayStudentCount}" class="ac-form-label ac-form-required" data-kor='부서' data-eng='Department'>부서</label>
                <input type="text" id="relayschool-studentDepartment-${relayStudentCount}" name="studentDepartment-${relayStudentCount}" class="ac-form-input" required>
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="relayschool-studentPosition-${relayStudentCount}" class="ac-form-label ac-form-required" data-kor='직급' data-eng='Position'>직급</label>
                <input type="text" id="relayschool-studentPosition-${relayStudentCount}" name="studentPosition-${relayStudentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="relayschool-studentPhone-${relayStudentCount}" class="ac-form-label" data-kor='전화번호' data-eng='Phone'>전화번호</label>
                <input type="tel" id="relayschool-studentPhone-${relayStudentCount}" name="studentPhone-${relayStudentCount}" class="ac-form-input" placeholder="000-0000-0000">
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="relayschool-studentMobile-${relayStudentCount}" class="ac-form-label ac-form-required" data-kor='핸드폰' data-eng='Mobile'>핸드폰</label>
                <input type="tel" id="relayschool-studentMobile-${relayStudentCount}" name="studentMobile-${relayStudentCount}" class="ac-form-input" placeholder="010-0000-0000" required>
            </div>
            <div class="ac-form-group">
                <label for="relayschool-studentEmail-${relayStudentCount}" class="ac-form-label ac-form-required" data-kor='이메일' data-eng='E-mail'>이메일</label>
                <input type="email" id="relayschool-studentEmail-${relayStudentCount}" name="studentEmail-${relayStudentCount}" class="ac-form-input" required>
            </div>
        </div>
        
        <div class="ac-form-group">
            <label class="ac-form-label ac-form-required" data-kor='선택 과정 (최소 1개 이상 선택)' data-eng='Selected Courses (At least 1 required)'>선택 과정 (최소 1개 이상 선택)</label>
            <div class="psac-checkbox-group">
                ${courseCheckboxes}
            </div>
        </div>
    `;
    
    container.appendChild(studentDiv);
}


// Relay School 수강자 삭제
function removeRelayschoolStudent(studentId) {
    const studentDiv = document.getElementById(`relayschool-student-${studentId}`);
    if (studentDiv) {
        studentDiv.remove();
    }
}


// Relay School 폼 데이터 수집
function collectRelayschoolFormData() {
    const students = [];
    const studentSections = document.querySelectorAll('#relayschool-students-container .ac-form-student-section');
    
    studentSections.forEach(section => {
        const studentId = section.id.split('-')[2];
        const selectedCourses = [];
        
        // 선택된 과정 수집
        const checkboxes = section.querySelectorAll(`input[name="relayschool-student-${studentId}-courses"]:checked`);
        checkboxes.forEach(checkbox => {
            selectedCourses.push(checkbox.value);
        });
        
        students.push({
            name: document.getElementById(`relayschool-studentName-${studentId}`)?.value || '',
            department: document.getElementById(`relayschool-studentDepartment-${studentId}`)?.value || '',
            position: document.getElementById(`relayschool-studentPosition-${studentId}`)?.value || '',
            phone: document.getElementById(`relayschool-studentPhone-${studentId}`)?.value || '',
            mobile: document.getElementById(`relayschool-studentMobile-${studentId}`)?.value || '',
            email: document.getElementById(`relayschool-studentEmail-${studentId}`)?.value || '',
            selectedCourses: selectedCourses // 원래대로 배열로 전송
        });
    });

    return {
        formType: 'relay',
        companyInfo: {
            companyName: document.getElementById('relayschool-companyName')?.value || '',
            representative: document.getElementById('relayschool-representative')?.value || '',
            businessNumber: document.getElementById('relayschool-businessNumber')?.value || '',
            businessType: document.getElementById('relayschool-businessType')?.value || '',
            address: document.getElementById('relayschool-address')?.value || ''
        },
        managerInfo: {
            name: document.getElementById('relayschool-managerName')?.value || '',
            department: document.getElementById('relayschool-managerDepartment')?.value || '',
            position: document.getElementById('relayschool-managerPosition')?.value || '',
            phone: document.getElementById('relayschool-managerPhone')?.value || '',
            mobile: document.getElementById('relayschool-managerMobile')?.value || '',
            email: document.getElementById('relayschool-managerEmail')?.value || ''
        },
        students: students
    };
}

// Relay School 폼 유효성 검사
function validateRelayschoolForm(formData) {
    // 기본 정보 유효성 검사
    if (!formData.companyInfo.companyName.trim()) {
        showMessage('회사명을 입력해 주세요.', 'error', 'rs-message');
        alert('회사명을 입력해주세요.');
        return false;
    }
    
    if (!validateBusinessNumber(formData.companyInfo.businessNumber)) {
        showMessage('올바른 사업자등록번호를 입력해주세요. (000-00-00000)', 'error', 'rs-message');
        alert('올바른 사업자등록번호를 입력해주세요. (000-00-00000)');
        return false;
    }
    
    // 수강자 정보 유효성 검사
    if (formData.students.length === 0) {
        showMessage('최소 1명의 수강자를 등록해주세요.', 'error', 'rs-message');
        alert('최소 1명의 수강자를 등록해주세요.');
        return false;
    }
    
    for (let i = 0; i < formData.students.length; i++) {
        const student = formData.students[i];
        
        if (!student.name.trim()) {
            showMessage(`수강자 ${i + 1}의 이름을 입력해주세요.`, 'error', 'rs-message');
            alert('수강자 이름을 입력해주세요.');
            return false;
        }
        
        if (!validateEmail(student.email)) {
            showMessage(`수강자 ${i + 1}의 올바른 이메일을 입력해주세요.`, 'error', 'rs-message');
            alert('올바른 이메일을 입력해주세요.');
            return false;
        }
        
        if (!validatePhoneNumber(student.mobile)) {
            showMessage(`수강자 ${i + 1}의 올바른 핸드폰 번호를 입력해주세요.`, 'error', 'rs-message');
            alert('올바른 핸드폰 번호를 입력해주세요. (010-0000-0000)');
            return false;
        }
        
        if (student.selectedCourses.length === 0) {
            showMessage(`수강자 ${i + 1}의 과정을 최소 1개 이상 선택해주세요.`, 'error', 'rs-message');
            alert('과정을 최소 1개 이상 선택해주세요.');
            return false;
        }
    }
    
    return true;
}

// Relay School 폼 제출 처리
async function submitRelayschoolForm(e) {
    e.preventDefault();
    
    // 폼 제출 로딩 상태 표시 (중복 제출 방지)
    showSubmitLoadingState('Processing...');

    try {
        const formData = collectRelayschoolFormData();
        
        if (!validateRelayschoolForm(formData)) {
            hideSubmitLoadingState();
            return;
        }
        
        if (formData.students.length > 0) {
            console.log('첫번째 수강자:', formData.students[0]);
        }

        await submitFormData(formData);

        // 로딩 상태를 유지한 채로 성공 메시지 표시
        hideSubmitLoadingState();
        alert(`신청이 완료되었습니다. (수강자 ${formData.students.length}명) \nYour application has been completed. (Number of participants: ${formData.students.length})`);
        
        // alert 확인 후 페이지 리로드
        location.reload();

    } catch (error) {
        hideSubmitLoadingState();
        showMessage('신청 처리 중 오류가 발생했습니다.', 'error', 'rs-message');
        console.error('Form submission error:', error);
    }
}

// 언어 전환 시 PSAC 체크박스 라벨 업데이트 함수
function updatePsacCourseLabels() {
    const currentLang = getCurrentLanguage();
    
    if (!psacCoursesData || !psacCoursesData.courses) {
        return;
    }
    
    // 모든 PSAC 과정 체크박스 라벨 업데이트
    Object.keys(psacCoursesData.courses).forEach(courseKey => {
        const course = psacCoursesData.courses[courseKey];
        const labels = document.querySelectorAll(`label[for*="psac-course"][for*="-${courseKey}"]`);
        
        labels.forEach(label => {
            const tooltipText = course[`tooltip${currentLang === 'kor' ? 'KR' : 'EN'}`] || '';
            label.textContent = course[currentLang] + tooltipText;
        });
    });
}

// 언어 전환 시 Relay School 체크박스 라벨 업데이트 함수
function updateRelayCoursesLabels() {
    const currentLang = getCurrentLanguage();
    
    if (!relayCoursesData) {
        return;
    }
    
    // 모든 Relay School 과정 체크박스 라벨 업데이트
    Object.keys(relayCoursesData).forEach(courseKey => {
        const course = relayCoursesData[courseKey];
        
        // 상태에 따른 표시 텍스트 추가
        let statusDisplay = '';
        
        switch(course.status) {
            case 'OFF':
                statusDisplay = currentLang === 'kor' ? ' (마감)' : ' (Closed)';
                break;
            case '접수마감':
                statusDisplay = currentLang === 'kor' ? ' (접수마감)' : ' (Closed)';
                break;
            case '마감임박':
                statusDisplay = currentLang === 'kor' ? ' (마감임박)' : ' (Almost Full)';
                break;
            case '마감주의':
                statusDisplay = currentLang === 'kor' ? ' (마감주의)' : ' (Almost Full)';
                break;
            default:
                statusDisplay = '';
        }
        
        // 모든 릴레이스쿨 과정 라벨 업데이트 (통합된 형태)
        const labels = document.querySelectorAll(`label[for*="relayschool-course"][for*="-${courseKey}"]`);
        labels.forEach(label => {
            label.textContent = course[currentLang] + statusDisplay;
        });
    });
}

// 언어 변경 이벤트 리스너 추가
document.addEventListener('languageChanged', function() {
    updatePsacCourseLabels();
    updateRelayCoursesLabels();
});
