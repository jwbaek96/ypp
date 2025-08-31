// YPP 아카데미 신청 폼 통합 JavaScript
document.addEventListener('DOMContentLoaded', function() {
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

// 세부 교육 과정 리스트 (PSAC)
const psacCourses = {
    1:{kor:"1주: 전력계통 해석의 기본 이론", eng:"Week 1: Basic Theory of Power System Analysis", tooltipKR: "", tooltipEN: ""},
    2:{kor:"2주: 전력계통(설비) 보호기술", eng:"Week 2: Power System (Facility) Protection Technology", tooltipKR: "<br><span style='color:blue'>(*almost full)</span>", tooltipEN: "<br><span style='color:blue'>(*)</span>"},
    3:{kor:"3주: 동기발전기 기술", eng:"Week 3: Synchronous Generator Technology", tooltipKR: "<br><span style='color:blue'>(*almost full)</span>", tooltipEN: "<br><span style='color:blue'>(*)</span>"},
    4:{kor:"4주: 무효전력 운영과 전압제어", eng:"Week 4: Reactive Power Operation and Voltage Control", tooltipKR: "", tooltipEN: ""},
    5:{kor:"5주: 전력설비의 동특성(계통안정도)", eng:"Week 5: Dynamic Characteristics of Power Facilities (System Stability)", tooltipKR: "<br><span style='color:red'>(*마감)</span>", tooltipEN: "<br><span style='color:red'>(*closed)</span>"},
    6:{kor:"6주: 분산에너지 시스템 기술", eng:"Week 6: Distributed Energy System Technology", tooltipKR: "", tooltipEN: ""},
    7:{kor:"7주: 보호릴레이 정정법과 보호협조기술", eng:"Week 7: Protection Relay Setting and Coordination Technology", tooltipKR: "", tooltipEN: ""},
    8:{kor:"8주: HVDC, MVDC, LVDC 및 FACTS기술", eng:"Week 8: HVDC, MVDC, LVDC and FACTS Technology", tooltipKR: "", tooltipEN: ""},
    9:{kor:"9주: 에너지 전환기의 전력계통 계획과 운영/에너지 시장과 신사업 모델", eng:"Week 9: Power System Planning and Operation in Energy Transition / Energy Market and New Business Models", tooltipKR: "에너지 전환기 전력계통 계획", tooltipEN: ""},
    10:{kor:"10주: 신재생에너지 계통연계 기술", eng:"Week 10: Renewable Energy Grid Connection Technology", tooltipKR: "", tooltipEN: ""}
};

// PSAC 마감된 과정들 (정원 초과)
const psacCoursesClosed = {
    // 2: {tooltip: "해당 항목은 정원 초과로 접수 마감되었습니다. \n(This course is closed due to exceeding capacity.)"},
    5: {tooltip: "해당 항목은 정원 초과로 접수 마감되었습니다. \n(This course is closed due to exceeding capacity.)"}
};

// 현재 언어 감지 함수
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'kor';
}


// Relay School 과정별 일정
const relayCoursesData = {
    1:{kor: '디지털릴레이 기본반 (2025년 9월 17일(수) ~ 9월 19일(금))', eng: 'Digital Relay Basic Course (September 17-19, 2025)'},
    2:{kor: '디지털릴레이 고급반 (2025년 10월 22일(수) ~ 10월 24일(금))', eng: 'Digital Relay Advanced Course (October 22-24, 2025)'},
    3:{kor: '고장분석반 (2025년 11월 19일(수) ~ 11월 21일(금))', eng: 'Fault Analysis Course (November 19-21, 2025)'}
};
// Relay School 마감된 과정들
const relayCoursesDataPassed = {
    1:{kor: '디지털릴레이 기본반 (2025년 3월 19일(수) ~ 3월 21일(금))', eng: 'Digital Relay Basic Course (March 19-21, 2025)'},
    2:{kor: '디지털릴레이 고급반 (2025년 4월 16일(수) ~ 4월 18일(금))', eng: 'Digital Relay Advanced Course (April 16-18, 2025)'},
    3:{kor: '고장분석반 (2025년 5월 21일(수) ~ 5월 23일(금))', eng: 'Fault Analysis Course (May 21-23, 2025)'},
    4:{kor: 'ECMS운영반 (2025년 6월 18일(수) ~ 6월 20일(금))', eng: 'ECMS Operation Course (June 18-20, 2025)'},
    5:{kor: '원자력 특성화반 (2025년 7월 16일(수) ~ 7월 20일(일))', eng: 'Nuclear Specialization Course (July 16-20, 2025)'},
};

/* ==========================================================================
   공통 유틸리티 함수
   ========================================================================== */

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
    psacStudentCount++;
    const container = document.getElementById('psac-students-container');
    
    const studentDiv = document.createElement('div');
    studentDiv.className = 'ac-form-student-section';
    studentDiv.id = `psac-student-${psacStudentCount}`;
    // 
    const currentLang = getCurrentLanguage();
    const courseCheckboxes = Object.keys(psacCourses).map((courseKey) => {
        const course = psacCourses[courseKey];
        const courseText = course[currentLang];
        const isClosed = psacCoursesClosed.hasOwnProperty(courseKey);
        const closedTooltip = isClosed ? psacCoursesClosed[courseKey].tooltip : '';
        
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
                   data-kor="${course.kor} ${course.tooltip}" 
                   data-eng="${course.eng}"
                   ${titleTooltip ? `title="${titleTooltip}"` : ''}>${courseText}</label>
        </div>
    `;
    }).join('');
    
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
    
    toggleLoading(true, 'psac-loading');
    
    try {
        const formData = collectPsacFormData();
        
        if (!validatePsacForm(formData)) {
            return;
        }
        
        // CORS 우회를 위한 iframe 방식 사용
        await submitFormData(formData);
        
        alert(`신청이 완료되었습니다. (수강자 ${formData.students.length}명) \nYour application has been completed. (Number of participants: ${formData.students.length})`, 'success','psac-message');
        
        // alert 확인 후 페이지 리로드
        location.reload();
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'error');
    } finally {
        toggleLoading(false, 'psac-loading');
    }
}

/* ==========================================================================
   Relay School 전용 함수
   ========================================================================== */

// Relay School 수강자 추가
function addRelayschoolStudent() {
    relayStudentCount++;
    const container = document.getElementById('relayschool-students-container');
    
    const studentDiv = document.createElement('div');
    studentDiv.className = 'ac-form-student-section';
    studentDiv.id = `relayschool-student-${relayStudentCount}`;
    
    const currentLang = getCurrentLanguage();
    
    // Relay School 과정 체크박스 생성 (선택 가능한 과정)
    const courseCheckboxes = Object.keys(relayCoursesData).map((courseKey) => {
        const course = relayCoursesData[courseKey];
        const courseText = course[currentLang];
        return `
        <div class="psac-checkbox-item">
            <input type="checkbox" id="relayschool-course-${relayStudentCount}-${courseKey}" name="relayschool-student-${relayStudentCount}-courses" value="${courseText}">
            <label for="relayschool-course-${relayStudentCount}-${courseKey}" data-kor="${course.kor}" data-eng="${course.eng}">${courseText}</label>
        </div>
    `;
    }).join('');
    
    // Relay School 마감 과정 표시 (선택 불가)
    const passedCourseItems = Object.keys(relayCoursesDataPassed).map((courseKey) => {
        const course = relayCoursesDataPassed[courseKey];
        const courseText = course[currentLang];
        return `
        <div class="psac-checkbox-item psac-checkbox-disabled">
            <input type="checkbox" id="relayschool-passed-${relayStudentCount}-${courseKey}" disabled>
            <label for="relayschool-passed-${relayStudentCount}-${courseKey}" class="disabled-label" data-kor="${course.kor}" data-eng="${course.eng}">${courseText}</label>
        </div>
    `;
    }).join('');
    
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
        
        <div class="ac-form-group">
            <label class="ac-form-label" data-kor='마감 과정' data-eng='Passed Courses'>마감 과정</label>
            <div class="psac-checkbox-group">
                ${passedCourseItems}
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
    // alert('1. 함수 진입');
    toggleLoading(true, 'rs-loading');

    try {
        const formData = collectRelayschoolFormData();
            if (formData.students.length > 0) {
                console.log('첫번째 수강자:', formData.students[0]);
            }

        await submitFormData(formData);

        alert(`신청이 완료되었습니다. (수강자 ${formData.students.length}명) \nYour application has been completed. (Number of participants: ${formData.students.length})`, 'success','rs-message');
        
        // alert 확인 후 페이지 리로드
        location.reload();

    } catch (error) {
        showMessage('신청 처리 중 오류가 발생했습니다.', 'error', 'rs-message');
        console.error('Form submission error:', error);
    } finally {
        toggleLoading(false, 'rs-loading');
    }
}

// 언어 전환 시 PSAC 체크박스 라벨 업데이트 함수
function updatePsacCourseLabels() {
    const currentLang = getCurrentLanguage();
    
    // 모든 PSAC 과정 체크박스 라벨 업데이트
    Object.keys(psacCourses).forEach(courseKey => {
        const course = psacCourses[courseKey];
        const labels = document.querySelectorAll(`label[for*="psac-course"][for*="-${courseKey}"]`);
        
        labels.forEach(label => {
            label.textContent = course[currentLang];
        });
    });
}

// 언어 전환 시 Relay School 체크박스 라벨 업데이트 함수
function updateRelayCoursesLabels() {
    const currentLang = getCurrentLanguage();
    
    // 모든 Relay School 과정 체크박스 라벨 업데이트 (선택 가능한 과정)
    Object.keys(relayCoursesData).forEach(courseKey => {
        const course = relayCoursesData[courseKey];
        const labels = document.querySelectorAll(`label[for*="relayschool-course"][for*="-${courseKey}"]`);
        
        labels.forEach(label => {
            label.textContent = course[currentLang];
        });
    });
    
    // 모든 Relay School 마감 과정 체크박스 라벨 업데이트
    Object.keys(relayCoursesDataPassed).forEach(courseKey => {
        const course = relayCoursesDataPassed[courseKey];
        const labels = document.querySelectorAll(`label[for*="relayschool-passed"][for*="-${courseKey}"]`);
        
        labels.forEach(label => {
            label.textContent = course[currentLang];
        });
    });
}

// 언어 변경 이벤트 리스너 추가
document.addEventListener('languageChanged', function() {
    updatePsacCourseLabels();
    updateRelayCoursesLabels();
});
