// Supabase 설정 (현재 비활성화 - Supabase 문제로 임시 로컬 인증 사용)
// const SUPABASE_URL = 'https://mcdpmkipopgishxjpbvi.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZHBta2lwb3BnaXNoeGpwYnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDM1NDIsImV4cCI6MjA3NjUxOTU0Mn0.UyASY-e556o1qCs4INZOxpLjz1n1DC9erxOowImVkQ8';

// Supabase 클라이언트 초기화
// const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 임시 로컬 비밀번호 (Supabase 복구 후 제거 필요)
const ADMIN_PASSWORD = 'ypp8720';

// DOM 요소들
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('adminPassword');
const loginButton = document.getElementById('loginButton');
const loadingSpinner = document.getElementById('loadingSpinner');
const buttonText = document.getElementById('buttonText');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// 메시지 표시 함수
function showMessage(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// 로딩 상태 관리
function setLoading(isLoading) {
    if (isLoading) {
        loginButton.disabled = true;
        loadingSpinner.style.display = 'inline-block';
        buttonText.textContent = 'Logging in...';
    } else {
        loginButton.disabled = false;
        loadingSpinner.style.display = 'none';
        buttonText.textContent = 'Login';
    }
}

// 패스워드 검증 함수 (임시 로컬 인증)
async function verifyPassword(password) {
    // Supabase 방식 (현재 비활성화)
    /*
    try {
        const { data, error } = await supabase
            .from('env_variables')
            .select('*')
            .eq('name', 'YPP_ADMIN')
            .eq('value', password)
            .single();

        if (error) {
            console.error('Database error:', error);
            return false;
        }

        return data ? true : false;
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
    */
    
    // 임시 로컬 인증 (Supabase 복구 후 위 코드로 복원)
    return password === ADMIN_PASSWORD;
}

// 로그인 처리 함수
async function handleLogin(password) {
    setLoading(true);
    hideMessages();

    try {
        const isValid = await verifyPassword(password);
        
        if (isValid) {
            // 로그인 성공
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminLoginTime', Date.now().toString());
            
            showMessage(successMessage, '로그인 성공! 리다이렉트 중...');
            
            setTimeout(() => {
                window.location.href = '/admin/';
            }, 1000);
        } else {
            // 로그인 실패
            showMessage(errorMessage, '잘못된 패스워드입니다.');
            passwordInput.value = '';
            passwordInput.focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(errorMessage, '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        setLoading(false);
    }
}

// 폼 제출 이벤트 처리
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = passwordInput.value.trim();
    
    if (!password) {
        showMessage(errorMessage, '패스워드를 입력해주세요.');
        passwordInput.focus();
        return;
    }
    
    await handleLogin(password);
});

// 세션 만료 확인 (24시간)
function checkSessionExpiry() {
    const loginTime = localStorage.getItem('adminLoginTime');
    if (loginTime) {
        const currentTime = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24시간
        
        if (currentTime - parseInt(loginTime) > sessionDuration) {
            // 세션 만료
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminLoginTime');
            showMessage(errorMessage, '세션이 만료되었습니다. 다시 로그인해주세요.');
        }
    }
}

// 페이지 로드 시 세션 확인
document.addEventListener('DOMContentLoaded', function() {
    checkSessionExpiry();
    
    // 이미 로그인되어 있으면 어드민 페이지로 리다이렉트
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        window.location.href = '/admin/';
    }
    
    // 패스워드 입력 필드에 포커스
    passwordInput.focus();
});

// 개발자 도구용 유틸리티 함수들 (프로덕션에서는 제거 권장)
window.adminAuth = {
    // 현재 로그인 상태 확인
    isLoggedIn: () => localStorage.getItem('adminLoggedIn') === 'true',
    
    // 로그아웃
    logout: () => {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.reload();
    },
    
    // 세션 정보 확인
    getSessionInfo: () => {
        const loginTime = localStorage.getItem('adminLoginTime');
        if (loginTime) {
            const loginDate = new Date(parseInt(loginTime));
            const now = new Date();
            const diff = now.getTime() - loginDate.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            return {
                loginTime: loginDate.toLocaleString(),
                sessionDuration: `${hours}시간 ${minutes}분`,
                isExpired: diff > (24 * 60 * 60 * 1000)
            };
        }
        return null;
    }
};