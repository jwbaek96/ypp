// scrolltotop.js - 컴포넌트 로딩 완료 후 실행

function initScrollToTop() {
    const scrollBtn = document.getElementById('scrollToTop');
    
    // 요소가 존재하지 않으면 종료
    if (!scrollBtn) {
        console.log('scrollToTop 버튼을 찾을 수 없습니다.');
        return;
    }

    window.onscroll = function() {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    };

    scrollBtn.onclick = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
}

// 컴포넌트 로딩 완료를 기다린 후 실행
document.addEventListener('componentsLoaded', initScrollToTop);

// 혹시 이미 로드되었을 경우를 대비해 즉시 실행도 시도
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연 후 실행 (컴포넌트 로딩 시간 확보)
    setTimeout(initScrollToTop, 100);
});