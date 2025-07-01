// redirect.js
function fileRedirect() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    console.log('현재 hostname:', hostname);
    console.log('현재 pathname:', pathname);
    
    // 배포 도메인 체크 (로컬 테스트용으로 5500 포트 포함)
    const isGitHubPages = hostname.includes('github.io');
    const isProductionDomain = hostname.includes('ypp.co.kr');
    const isLocalTest = hostname.includes('127.0.0.1') && window.location.port === '5500'; // 로컬 테스트용

    // 배포 환경이면서 lockwebsite가 아닌 경우 리다이렉션
    if (isGitHubPages) {

    } else if (isProductionDomain){

    } else{
        
    }
}

// 즉시 실행
fileRedirect();