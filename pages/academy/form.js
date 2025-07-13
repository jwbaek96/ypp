// YPP 아카데미 신청 폼 통합 JavaScript
// PSAC 페이지 초기화
        document.addEventListener('DOMContentLoaded', function() {
            // 첫 번째 수강자 자동 추가
            addPsacStudent();
            
            // 폼 제출 이벤트 연결
            document.getElementById('psac-form').addEventListener('submit', submitPsacForm);
        });
/* ==========================================================================
   공통 설정 및 변수
   ========================================================================== */

// 웹 앱 URL - 실제 Apps Script 웹 앱 URL로 변경해주세요
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbyTKBJcBfl-nctGzu_BTU_2hYUm-pzz71dmLDEMm1Aj3eGCJwtxp1-ZQdl4s6J_CCgh/exec';

// 공통 변수
let studentCount = 0;

// 세부 교육 과정 리스트 (PSAC)
const psacCourses = [
    '1주: 전력계통 개론 및 기초 (9.3 - 5)',
    '2주: 전력계통(설비) 보호기술 (9.9 - 11)',
    '3주: 동기발전기 전문적 기술 (9.24 - 27)',
    '4주: 전력계통 안정도 해석 (10.1 - 3)',
    '5주: 전력계통 운영 및 제어 (10.8 - 10)',
    '6주: 신재생에너지 연계 기술 (10.15 - 17)',
    '7주: 전력품질 및 고조파 (10.22 - 24)',
    '8주: 전력계통 시뮬레이션 (10.29 - 31)',
    '9주: 스마트그리드 기술 (11.5 - 7)',
    '10주: 전력계통 보안 및 사이버보안 (11.12 - 14)',
    '11주: 전력시장 및 경제성 분석 (11.19 - 21)',
    '12주: 종합 프로젝트 발표 (11.26 - 28)'
];

// Relay School 과정별 일정
const relayschoolSchedules = {
    'A과정': {
        name: 'Relay School 2025 A과정 (기초)',
        schedule: '2025년 3월 3일(월) ~ 3월 7일(금)',
        description: '보호계전기 기초 과정'
    },
    'B과정': {
        name: 'Relay School 2025 B과정 (중급)',
        schedule: '2025년 6월 2일(월) ~ 6월 6일(금)',
        description: '보호계전기 중급 과정'
    },
    'C과정': {
        name: 'Relay School 2025 C과정 (고급)',
        schedule: '2025년 9월 1일(월) ~ 9월 5일(금)',
        description: '보호계전기 고급 과정'
    }
};

/* ==========================================================================
   공통 유틸리티 함수
   ========================================================================== */

// 메시지 표시 함수
function showMessage(message, type, containerId = 'message') {
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
function toggleLoading(show, containerId = 'loading') {
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
    if (value.length >= 3 && value.length <= 7) {
        value = value.substring(0, 3) + '-' + value.substring(3);
    } else if (value.length >= 8) {
        value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7, 11);
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

// 페이지 로드 시 공통 이벤트 설정
document.addEventListener('DOMContentLoaded', function() {
    // 사업자등록번호 포맷팅
    const businessNumberInput = document.getElementById('businessNumber');
    if (businessNumberInput) {
        businessNumberInput.addEventListener('input', function(e) {
            e.target.value = formatBusinessNumber(e.target.value);
        });
    }
    
    // 전화번호 포맷팅 (담당자)
    const managerPhoneInputs = ['managerPhone', 'managerMobile'];
    managerPhoneInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function(e) {
                e.target.value = formatPhoneNumber(e.target.value);
            });
        }
    });
});

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
    studentCount++;
    const container = document.getElementById('psac-students-container');
    
    const studentDiv = document.createElement('div');
    studentDiv.className = 'ac-form-student-section';
    studentDiv.id = `psac-student-${studentCount}`;
    
    const courseCheckboxes = psacCourses.map((course, index) => `
        <div class="psac-checkbox-item">
            <input type="checkbox" id="psac-course-${studentCount}-${index}" name="psac-student-${studentCount}-courses" value="${course}">
            <label for="psac-course-${studentCount}-${index}">${course}</label>
        </div>
    `).join('');
    
    studentDiv.innerHTML = `
        <div class="ac-form-student-header">
            <div class="ac-form-student-title">수강자 ${studentCount}</div>
            ${studentCount > 1 ? `<button type="button" class="ac-form-btn ac-form-btn-danger" onclick="removePsacStudent(${studentCount})">삭제</button>` : ''}
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="psac-studentName-${studentCount}" class="ac-form-label ac-form-required">수강자명</label>
                <input type="text" id="psac-studentName-${studentCount}" name="studentName-${studentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="psac-studentDepartment-${studentCount}" class="ac-form-label ac-form-required">부서</label>
                <input type="text" id="psac-studentDepartment-${studentCount}" name="studentDepartment-${studentCount}" class="ac-form-input" required>
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="psac-studentPosition-${studentCount}" class="ac-form-label ac-form-required">직급</label>
                <input type="text" id="psac-studentPosition-${studentCount}" name="studentPosition-${studentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="psac-studentPhone-${studentCount}" class="ac-form-label">전화번호</label>
                <input type="tel" id="psac-studentPhone-${studentCount}" name="studentPhone-${studentCount}" class="ac-form-input" placeholder="000-0000-0000">
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="psac-studentMobile-${studentCount}" class="ac-form-label ac-form-required">핸드폰</label>
                <input type="tel" id="psac-studentMobile-${studentCount}" name="studentMobile-${studentCount}" class="ac-form-input" placeholder="010-0000-0000" required>
            </div>
            <div class="ac-form-group">
                <label for="psac-studentEmail-${studentCount}" class="ac-form-label ac-form-required">이메일</label>
                <input type="email" id="psac-studentEmail-${studentCount}" name="studentEmail-${studentCount}" class="ac-form-input" required>
            </div>
        </div>
        
        <div class="ac-form-group">
            <label class="ac-form-label ac-form-required">선택 세부교육 (최소 1개 이상 선택)</label>
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
            name: document.getElementById(`psac-studentName-${studentId}`).value,
            department: document.getElementById(`psac-studentDepartment-${studentId}`).value,
            position: document.getElementById(`psac-studentPosition-${studentId}`).value,
            phone: document.getElementById(`psac-studentPhone-${studentId}`).value,
            mobile: document.getElementById(`psac-studentMobile-${studentId}`).value,
            email: document.getElementById(`psac-studentEmail-${studentId}`).value,
            selectedCourses: selectedCourses
        });
    });
    
    return {
        formType: 'psac',
        companyInfo: {
            companyName: document.getElementById('companyName').value,
            representative: document.getElementById('representative').value,
            businessNumber: document.getElementById('businessNumber').value,
            businessType: document.getElementById('businessType').value,
            address: document.getElementById('address').value
        },
        managerInfo: {
            name: document.getElementById('managerName').value,
            department: document.getElementById('managerDepartment').value,
            position: document.getElementById('managerPosition').value,
            phone: document.getElementById('managerPhone').value,
            mobile: document.getElementById('managerMobile').value,
            email: document.getElementById('managerEmail').value
        },
        students: students
    };
}

// PSAC 폼 유효성 검사
function validatePsacForm(formData) {
    // 기본 정보 유효성 검사
    if (!formData.companyInfo.companyName.trim()) {
        showMessage('회사명을 입력해 주세요.', 'error');
        return false;
    }
    
    if (!validateBusinessNumber(formData.companyInfo.businessNumber)) {
        showMessage('올바른 사업자등록번호를 입력해 주세요. (000-00-00000)', 'error');
        return false;
    }
    
    if (!validateEmail(formData.managerInfo.email)) {
        showMessage('올바른 담당자 이메일을 입력해 주세요.', 'error');
        return false;
    }
    
    if (!validatePhoneNumber(formData.managerInfo.mobile)) {
        showMessage('올바른 담당자 핸드폰 번호를 입력해 주세요.', 'error');
        return false;
    }
    
    // 수강자 정보 유효성 검사
    if (formData.students.length === 0) {
        showMessage('최소 1명의 수강자를 등록해 주세요.', 'error');
        return false;
    }
    
    for (let i = 0; i < formData.students.length; i++) {
        const student = formData.students[i];
        
        if (!student.name.trim()) {
            showMessage(`수강자 ${i + 1}의 이름을 입력해 주세요.`, 'error');
            return false;
        }
        
        if (!validateEmail(student.email)) {
            showMessage(`수강자 ${i + 1}의 올바른 이메일을 입력해 주세요.`, 'error');
            return false;
        }
        
        if (!validatePhoneNumber(student.mobile)) {
            showMessage(`수강자 ${i + 1}의 올바른 핸드폰 번호를 입력해 주세요.`, 'error');
            return false;
        }
        
        if (student.selectedCourses.length === 0) {
            showMessage(`수강자 ${i + 1}의 세부교육을 최소 1개 이상 선택해 주세요.`, 'error');
            return false;
        }
    }
    
    return true;
}

// PSAC 폼 제출 처리
async function submitPsacForm(e) {
    e.preventDefault();
    
    toggleLoading(true);
    
    try {
        const formData = collectPsacFormData();
        
        if (!validatePsacForm(formData)) {
            return;
        }
        
        // CORS 우회를 위한 iframe 방식 사용
        await submitFormData(formData);
        
        showMessage(`PSAC 신청이 완료되었습니다. (수강자 ${formData.students.length}명)`, 'success');
        document.getElementById('psac-form').reset();
        // 수강자 목록 초기화
        document.getElementById('psac-students-container').innerHTML = '';
        studentCount = 0;
        addPsacStudent();
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
        toggleLoading(false);
    }
}

/* ==========================================================================
   Relay School 전용 함수
   ========================================================================== */

// Relay School 수강자 추가
function addRelayschoolStudent() {
    studentCount++;
    const container = document.getElementById('relayschool-students-container');
    
    const studentDiv = document.createElement('div');
    studentDiv.className = 'ac-form-student-section';
    studentDiv.id = `relayschool-student-${studentCount}`;
    
    studentDiv.innerHTML = `
        <div class="ac-form-student-header">
            <div class="ac-form-student-title">수강자 ${studentCount}</div>
            ${studentCount > 1 ? `<button type="button" class="ac-form-btn ac-form-btn-danger" onclick="removeRelayschoolStudent(${studentCount})">삭제</button>` : ''}
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="relayschool-studentName-${studentCount}" class="ac-form-label ac-form-required">수강자명</label>
                <input type="text" id="relayschool-studentName-${studentCount}" name="studentName-${studentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="relayschool-studentDepartment-${studentCount}" class="ac-form-label ac-form-required">부서</label>
                <input type="text" id="relayschool-studentDepartment-${studentCount}" name="studentDepartment-${studentCount}" class="ac-form-input" required>
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="relayschool-studentPosition-${studentCount}" class="ac-form-label ac-form-required">직급</label>
                <input type="text" id="relayschool-studentPosition-${studentCount}" name="studentPosition-${studentCount}" class="ac-form-input" required>
            </div>
            <div class="ac-form-group">
                <label for="relayschool-studentPhone-${studentCount}" class="ac-form-label">전화번호</label>
                <input type="tel" id="relayschool-studentPhone-${studentCount}" name="studentPhone-${studentCount}" class="ac-form-input" placeholder="000-0000-0000">
            </div>
        </div>
        
        <div class="ac-form-row">
            <div class="ac-form-group">
                <label for="relayschool-studentMobile-${studentCount}" class="ac-form-label ac-form-required">핸드폰</label>
                <input type="tel" id="relayschool-studentMobile-${studentCount}" name="studentMobile-${studentCount}" class="ac-form-input" placeholder="010-0000-0000" required>
            </div>
            <div class="ac-form-group">
                <label for="relayschool-studentEmail-${studentCount}" class="ac-form-label ac-form-required">이메일</label>
                <input type="email" id="relayschool-studentEmail-${studentCount}" name="studentEmail-${studentCount}" class="ac-form-input" required>
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

// Relay School 과정 선택 처리
function selectRelaysschoolCourse(courseType) {
    const courseInfo = relayschoolSchedules[courseType];
    const selectedCourseDiv = document.getElementById('relayschool-selected-course');
    
    if (courseInfo && selectedCourseDiv) {
        selectedCourseDiv.innerHTML = `
            <h4>${courseInfo.name}</h4>
            <p><strong>교육일정:</strong> ${courseInfo.schedule}</p>
            <p><strong>과정 설명:</strong> ${courseInfo.description}</p>
        `;
        selectedCourseDiv.classList.add('show');
    }
    
    // 라디오 버튼 시각적 선택 효과
    const allOptions = document.querySelectorAll('.relayschool-course-option');
    allOptions.forEach(option => option.classList.remove('selected'));
    
    const selectedOption = document.querySelector(`input[value="${courseType}"]`).closest('.relayschool-course-option');
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// Relay School 폼 데이터 수집
function collectRelayschoolFormData() {
    const students = [];
    const studentSections = document.querySelectorAll('#relayschool-students-container .ac-form-student-section');
    
    studentSections.forEach(section => {
        const studentId = section.id.split('-')[2];
        
        students.push({
            name: document.getElementById(`relayschool-studentName-${studentId}`).value,
            department: document.getElementById(`relayschool-studentDepartment-${studentId}`).value,
            position: document.getElementById(`relayschool-studentPosition-${studentId}`).value,
            phone: document.getElementById(`relayschool-studentPhone-${studentId}`).value,
            mobile: document.getElementById(`relayschool-studentMobile-${studentId}`).value,
            email: document.getElementById(`relayschool-studentEmail-${studentId}`).value
        });
    });
    
    const selectedCourse = document.querySelector('input[name="selectedCourse"]:checked');
    
    return {
        formType: 'relay',
        courseInfo: {
            selectedCourse: selectedCourse ? selectedCourse.value : '',
            schedule: selectedCourse ? relayschoolSchedules[selectedCourse.value].schedule : ''
        },
        companyInfo: {
            companyName: document.getElementById('companyName').value,
            representative: document.getElementById('representative').value,
            businessNumber: document.getElementById('businessNumber').value,
            businessType: document.getElementById('businessType').value,
            address: document.getElementById('address').value
        },
        managerInfo: {
            name: document.getElementById('managerName').value,
            department: document.getElementById('managerDepartment').value,
            position: document.getElementById('managerPosition').value,
            phone: document.getElementById('managerPhone').value,
            mobile: document.getElementById('managerMobile').value,
            email: document.getElementById('managerEmail').value
        },
        students: students
    };
}

// Relay School 폼 유효성 검사
function validateRelayschoolForm(formData) {
    // 과정 선택 확인
    if (!formData.courseInfo.selectedCourse) {
        showMessage('교육 과정을 선택해 주세요.', 'error');
        return false;
    }
    
    // 기본 정보 유효성 검사 (PSAC와 동일)
    if (!formData.companyInfo.companyName.trim()) {
        showMessage('회사명을 입력해 주세요.', 'error');
        return false;
    }
    
    if (!validateBusinessNumber(formData.companyInfo.businessNumber)) {
        showMessage('올바른 사업자등록번호를 입력해 주세요. (000-00-00000)', 'error');
        return false;
    }
    
    if (!validateEmail(formData.managerInfo.email)) {
        showMessage('올바른 담당자 이메일을 입력해 주세요.', 'error');
        return false;
    }
    
    if (!validatePhoneNumber(formData.managerInfo.mobile)) {
        showMessage('올바른 담당자 핸드폰 번호를 입력해 주세요.', 'error');
        return false;
    }
    
    // 수강자 정보 유효성 검사
    if (formData.students.length === 0) {
        showMessage('최소 1명의 수강자를 등록해 주세요.', 'error');
        return false;
    }
    
    for (let i = 0; i < formData.students.length; i++) {
        const student = formData.students[i];
        
        if (!student.name.trim()) {
            showMessage(`수강자 ${i + 1}의 이름을 입력해 주세요.`, 'error');
            return false;
        }
        
        if (!validateEmail(student.email)) {
            showMessage(`수강자 ${i + 1}의 올바른 이메일을 입력해 주세요.`, 'error');
            return false;
        }
        
        if (!validatePhoneNumber(student.mobile)) {
            showMessage(`수강자 ${i + 1}의 올바른 핸드폰 번호를 입력해 주세요.`, 'error');
            return false;
        }
    }
    
    return true;
}

// Relay School 폼 제출 처리
async function submitRelayschoolForm(e) {
    e.preventDefault();
    
    toggleLoading(true);
    
    try {
        const formData = collectRelayschoolFormData();
        
        if (!validateRelayschoolForm(formData)) {
            return;
        }
        
        // CORS 우회를 위한 iframe 방식 사용
        await submitFormData(formData);
        
        showMessage(`Relay School 신청이 완료되었습니다. (수강자 ${formData.students.length}명)`, 'success');
        document.getElementById('relayschool-form').reset();
        // 수강자 목록 초기화
        document.getElementById('relayschool-students-container').innerHTML = '';
        document.getElementById('relayschool-selected-course').classList.remove('show');
        studentCount = 0;
        addRelayschoolStudent();
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
        toggleLoading(false);
    }
}