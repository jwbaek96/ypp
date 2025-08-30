/**
 * 3D 회전 슬라이더 JavaScript
 * 4개의 이미지가 360도로 배치되어 회전하는 슬라이더
 */

document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel-3d');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const items = document.querySelectorAll('.carousel-item');
    const sliderTitle = document.querySelector('.slider-title');
    const sliderSubtitle = document.getElementById('dynamic-subtitle');
    
    // 슬라이더가 존재하지 않으면 종료
    if (!carousel || !prevBtn || !nextBtn || items.length === 0) {
        console.warn('3D 슬라이더 요소를 찾을 수 없습니다.');
        return;
    }
    
    let currentRotation = 0;
    const rotationStep = 90; // 4개 아이템이므로 90도씩 회전
    
    /**
     * 현재 언어 감지 함수
     */
    function getCurrentLanguage() {
        return document.documentElement.lang === 'en' ? 'eng' : 'kor';
    }
    
    /**
     * 현재 앞면에 있는 아이템의 인덱스 계산
     */
    function getCurrentActiveIndex() {
        const normalizedRotation = ((currentRotation % 360) + 360) % 360;
        return (360 - normalizedRotation) / 90 % 4;
    }
    
    /**
     * 텍스트 업데이트 함수
     */
    function updateTexts() {
        const activeIndex = getCurrentActiveIndex();
        const activeItem = items[activeIndex];
        const currentLang = getCurrentLanguage();
        
        if (activeItem && sliderTitle && sliderSubtitle) {
            const titleAttr = `data-title-${currentLang}`;
            const descAttr = `data-desc-${currentLang}`;
            
            const newTitle = activeItem.getAttribute(titleAttr);
            const newDesc = activeItem.getAttribute(descAttr);
            
            if (newTitle) {
                sliderTitle.textContent = newTitle;
            }
            
            if (newDesc) {
                sliderSubtitle.innerHTML = newDesc;
            }
        }
    }
    
    /**
     * 캐러셀 업데이트 함수
     * 회전 상태에 따라 blur 효과 적용 및 텍스트 업데이트
     */
    function updateCarousel() {
        carousel.style.transform = `rotateY(${currentRotation}deg)`;
        
        // 모든 아이템에서 blur 클래스 제거
        items.forEach(item => item.classList.remove('blur'));
        
        // 현재 앞면에 있지 않은 아이템들에 blur 효과 추가
        items.forEach((item, index) => {
            const itemRotation = (index * 90 - currentRotation) % 360;
            const normalizedRotation = itemRotation < 0 ? itemRotation + 360 : itemRotation;
            
            // 앞면(0도)이 아닌 경우 blur 처리
            if (normalizedRotation !== 0) {
                item.classList.add('blur');
            }
        });
        
        // 텍스트 업데이트
        updateTexts();
    }
    
    /**
     * 다음 슬라이드로 회전
     */
    function rotateNext() {
        currentRotation -= rotationStep;
        updateCarousel();
    }
    
    /**
     * 이전 슬라이드로 회전
     */
    function rotatePrev() {
        currentRotation += rotationStep;
        updateCarousel();
    }
    
    // 버튼 이벤트 리스너
    nextBtn.addEventListener('click', rotateNext);
    prevBtn.addEventListener('click', rotatePrev);
    
    // 아이템 클릭 이벤트
    items.forEach(item => {
        item.addEventListener('click', function() {
            const link = this.getAttribute('data-link');
            // blur 처리되지 않은 아이템(앞면에 있는 아이템)만 클릭 가능
            if (link && !this.classList.contains('blur')) {
                window.location.href = link;
            }
        });
    });
    
    // 초기 상태 설정
    updateCarousel();
    
    // 자동 회전 관련 변수
    let autoRotateInterval;
    
    /**
     * 자동 회전 시작
     */
    function startAutoRotate() {
        autoRotateInterval = setInterval(rotateNext, 4000);
    }
    
    /**
     * 자동 회전 정지
     */
    function stopAutoRotate() {
        clearInterval(autoRotateInterval);
    }
    
    // 마우스가 슬라이더 위에 있을 때 자동 회전 정지
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoRotate);
        sliderContainer.addEventListener('mouseleave', startAutoRotate);
        
        // 자동 회전 시작
        startAutoRotate();
    }
    
    // 언어 변경 이벤트 리스너 (lang-switch.js에서 발생하는 커스텀 이벤트)
    document.addEventListener('languageChanged', function() {
        updateTexts();
    });
    
    // MutationObserver로 lang 속성 변경 감지
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
                updateTexts();
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang']
    });
    
    // 키보드 네비게이션 지원
    document.addEventListener('keydown', function(e) {
        // 슬라이더가 화면에 보이는 상태일 때만 키보드 조작 허용
        const sliderRect = carousel.getBoundingClientRect();
        const isVisible = sliderRect.top < window.innerHeight && sliderRect.bottom > 0;
        
        if (isVisible) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                rotatePrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                rotateNext();
            }
        }
    });
    
    // 터치 스와이프 지원
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    carousel.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > swipeThreshold) {
            if (swipeDistance > 0) {
                rotatePrev(); // 오른쪽 스와이프 (이전)
            } else {
                rotateNext(); // 왼쪽 스와이프 (다음)
            }
        }
    }
});
