const items = [
    { href: '/pages/business/index.html?tab=nuclear-power', imgSrc: './imgs/원자력발전소-bgx.png', titleKR: '원자력', titleEN:'Nuclear Power', desc: '원자력 설명' },
    { href: '/pages/business/index.html?tab=thermal-power', imgSrc: './imgs/화력-bgx.png', titleKR: '복합화력', titleEN:'Thermal Power', desc: '복합화력 설명' },
    { href: '/pages/business/index.html?tab=renewable-energy', imgSrc: './imgs/신재생에너지-bgx.png', titleKR: '신재생에너지', titleEN:'Renewable Energy', desc: '신재생 설명' },
    { href: '/pages/business/index.html?tab=green-hydrogen', imgSrc: './imgs/green-bgx.png', titleKR: '그린수소/암모니아', titleEN:'Green Hydrogen & Ammonia', desc: '그린수소/암모니아 설명' },
    { href: '/pages/business/index.html?tab=substation', imgSrc: './imgs/변전소-bgx.png', titleKR: '변전소', titleEN:'Substation', desc: '변전소 설명' },
    { href: '/pages/business/index.html?tab=bess', imgSrc: './imgs/bess-bgx.png', titleKR: '에너지저장장치', titleEN:'BESS', desc: 'BESS 설명' },
    { href: '/pages/business/index.html?tab=control-valve', imgSrc: './imgs/컨트롤밸브-bgx.png', titleKR: '컨트롤 밸브', titleEN:'Control Valve', desc: '컨트롤 밸브 설명' },
    { href: '/pages/business/index.html?tab=water-purification', imgSrc: './imgs/water-bgx.png', titleKR: '수질환경정화설비', titleEN:'Water Quality & Environmental Purification', desc: '수질환경정화설비 설명' },
    { href: '/pages/business/index.html?tab=us-military', imgSrc: './imgs/usbase-bgx.png', titleKR: '미군기지', titleEN:'U.S. Military Base', desc: '미군기지 설명' },
    { href: '/pages/business/index.html?tab=data-center', imgSrc: './imgs/data-bgx.png', titleKR: '데이터센터', titleEN:'Data Center', desc: '데이터센터 설명' },
    { href: '/pages/business/index.html?tab=smr', imgSrc: './imgs/smr-bgx.png', titleKR: 'SMR', titleEN:'SMR', desc: 'SMR 설명' },
];

let currentRotation = 0;
let currentIndex = 0;
const itemCount = items.length;
const angleStep = 360 / itemCount;

const carousel = document.getElementById('carousel');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const titleElement = document.getElementById('slider-title');
// const descriptionElement = document.getElementById('slider-description');

// 아이템 생성
items.forEach((item, i) => {
    const carouselItem = document.createElement('a');
    carouselItem.className = 'carousel-item';
    carouselItem.href = item.href;
    carouselItem.setAttribute('data-title-kr', item.titleKR);
    carouselItem.setAttribute('data-title-en', item.titleEN);
    carouselItem.setAttribute('data-desc', item.desc);
    carouselItem.innerHTML = `<img src="${item.imgSrc}" alt="${item.titleKR}">`;
    carousel.appendChild(carouselItem);
});

// 초기 배치
updateCarousel();

// 회전 및 업데이트 함수
function updateCarousel() {
    const carouselItems = document.querySelectorAll('.carousel-item');
    const containerWidth = carousel.offsetWidth;
    const radius = containerWidth * 0.5; // 컨테이너 크기에 비례
    
    let maxZ = -Infinity;
    let activeItemIndex = 0;
    
    carouselItems.forEach((item, i) => {
        const angle = angleStep * i + currentRotation;
        const x = Math.sin(angle * Math.PI / 180) * radius;
        const z = Math.cos(angle * Math.PI / 180) * radius;
        
        // 디버깅 출력
        // console.log(`Item ${i}: angle=${angle.toFixed(1)}°, z=${z.toFixed(1)}`);
        
        // 가장 큰 Z값을 가진 아이템 찾기
        if (z > maxZ) {
            maxZ = z;
            activeItemIndex = i;
        }
        
        // 활성 아이템 클래스 제거
        item.classList.remove('active');
        
        // Z축 거리에 따른 스케일/블러/투명도 조정 (Z값이 클수록 크고 선명하게)
        const normalizedZ = (z + radius) / (2 * radius); // 0~1 범위로 정규화
        const scale = 0.4 + (normalizedZ * 0.8); // 0.4~1.2 범위로 확장
        const blurAmount = Math.max(0, (1 - normalizedZ) * 4); // 블러도 더 강하게
        const opacity = 0.3 + (normalizedZ * 0.7); // 0.3~1.0 범위
        
        // console.log(`Item ${i}: normalizedZ=${normalizedZ.toFixed(2)}, scale=${scale.toFixed(2)}`);
        
        item.style.transform = `translateX(${x}px) translateZ(${z}px) scale(${scale})`;
        item.style.filter = `blur(${blurAmount}px)`;
        item.style.opacity = opacity;
    });
    
    // 실제로 Z값이 가장 큰 아이템에 active 클래스 추가
    carouselItems[activeItemIndex].classList.add('active');
    currentIndex = activeItemIndex;
    
    // console.log(`Active item: ${activeItemIndex}, maxZ: ${maxZ.toFixed(1)}`);
    
    // 텍스트 업데이트
    updateText();
}

// 텍스트 업데이트 함수
function updateText() {
    const carouselItems = document.querySelectorAll('.carousel-item');
    const activeItem = carouselItems[currentIndex];
    
    // 현재 언어 감지 (html lang 속성 기준)
    const currentLang = document.documentElement.lang === 'en' ? 'en' : 'kr';
    
    // 어트리뷰트에서 해당 언어의 타이틀 가져오기
    const title = activeItem.getAttribute(`data-title-${currentLang}`);
    titleElement.textContent = title;
}
// descriptionElement.textContent = currentItem.desc;

// 다음 버튼
nextBtn.addEventListener('click', () => {
    currentRotation -= angleStep;
    updateCarousel();
});

// 이전 버튼
prevBtn.addEventListener('click', () => {
    currentRotation += angleStep;
    updateCarousel();
});

// 키보드 조작
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        currentRotation += angleStep;
        updateCarousel();
    } else if (e.key === 'ArrowRight') {
        currentRotation -= angleStep;
        updateCarousel();
    }
});

// 마우스 휠
carousel.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY > 0) {
        currentRotation -= angleStep;
    } else {
        currentRotation += angleStep;
    }
    updateCarousel();
});

// 자동 슬라이드
let autoSlide = setInterval(() => {
    currentRotation -= angleStep;
    updateCarousel();
}, 4000);

// 마우스 호버 시 자동 슬라이드 정지
carousel.addEventListener('mouseenter', () => {
    clearInterval(autoSlide);
});

carousel.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => {
        currentRotation -= angleStep;
        updateCarousel();
    }, 4000);
});

console.log('3D 캐러셀 초기화 완료');