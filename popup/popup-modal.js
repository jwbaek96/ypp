// 팝업 슬라이더 관리 객체
const YppPopupSlider = {
  // 팝업 데이터를 저장할 변수
  data: null,
  
  // 현재 슬라이드 인덱스
  currentSlide: 0,
  totalSlides: 0,
  
  // 팝업 요소들을 저장할 변수
  elements: {
    overlay: null,
    modal: null,
    closeBtn: null,
    slider: null,
    slides: [],
    prevBtn: null,
    nextBtn: null,
    counter: null,
    todayCloseCheck: null,
    footerCloseBtn: null
  },

  /**
   * 현재 화면 크기에 따른 슬라이드 개수 반환
   */
  getSlidesPerView() {
    return window.innerWidth <= 1042 ? 1 : 2; // 모바일: 1개, 데스크탑: 2개
  },

  /**
   * 총 슬라이드 페이지 수 계산
   */
  getTotalPages() {
    const slidesPerView = this.getSlidesPerView();
    return Math.ceil(this.totalSlides / slidesPerView);
  },

  /**
   * 현재 페이지 번호 계산
   */
  getCurrentPage() {
    const slidesPerView = this.getSlidesPerView();
    return Math.floor(this.currentSlide / slidesPerView) + 1;
  },

  /**
   * 팝업 초기화 함수
   * JSON 데이터를 불러와서 팝업을 생성합니다.
   */
  async init() {
    try {
      // JSON 파일에서 팝업 데이터 불러오기
      const response = await fetch('/popup/popup-data.json');
      
      this.data = await response.json();
      
      this.totalSlides = this.data.popups.length;
      
      // 팝업 생성 및 표시
      this.createPopup();
      this.showPopup();
      
    } catch (error) {
      console.error('팝업 데이터 로드 실패:', error);
    }
  },

  /**
   * 팝업 HTML 요소 생성
   * JSON 데이터를 기반으로 팝업의 모든 요소를 생성합니다.
   */
  // .ypp-popup-overlay > .ypp-popup-modal > .ypp-popup-header + .ypp-popup-content + .ypp-popup-footer
  createPopup() {
    // 오버레이 (배경) 생성
    this.elements.overlay = document.createElement('div');
    this.elements.overlay.className = 'ypp-popup-overlay';
    
    // 모달 컨테이너 생성
    this.elements.modal = document.createElement('div');
    this.elements.modal.className = 'ypp-popup-modal';
    
    // 모달 내용 HTML 생성
    this.elements.modal.innerHTML = `
      <div class="ypp-popup-top">
        <div class="popup-counter">
          <span class="current-slide">1</span>
          <span class="slide-separator"> / </span>
          <span class="total-slides">${this.getTotalPages()}</span>
        </div>
        <div class="popup-nav">
          <button class="nav-btn prev-btn" title="이전 슬라이드" aria-label="Previous slide">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height="1em" fill="#fff">
              <path d="M15 239c-9.4 9.4-9.4 24.6 0 33.9L207 465c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L65.9 256 241 81c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L15 239z"/>
            </svg>
          </button>
          <button class="nav-btn next-btn" title="다음 슬라이드" aria-label="Next slide">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height="1em" fill="#fff">
              <path d="M305 239c9.4 9.4 9.4 24.6 0 33.9L113 465c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l175-175L79 81c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L305 239z"/>
            </svg>
          </button>
        </div>
      </div>
      

      <div class="ypp-popup-mid">
        <div class="popup-slider">
          <div class="popup-slides-container">
            ${this.generateSlides()}
          </div>
        </div>
      </div>
      

      <div class="ypp-popup-btm">
        <div class="popup-close-options">
          <button class="popup-close-btn" data-kor="닫기 ×" data-eng="Close ×">닫기 ×</button>
        </div>
      </div>
      `;

    // 요소들 저장
    this.elements.slider = this.elements.modal.querySelector('.popup-slides-container');
    this.elements.slides = this.elements.modal.querySelectorAll('.popup-slide');
    this.elements.prevBtn = this.elements.modal.querySelector('.prev-btn');
    this.elements.nextBtn = this.elements.modal.querySelector('.next-btn');
    this.elements.counter = this.elements.modal.querySelector('.current-slide');
    this.elements.closeBtn = this.elements.modal.querySelector('.ypp-popup-close');
    // this.elements.todayCloseCheck = this.elements.modal.querySelector('.today-close-check');
    this.elements.footerCloseBtn = this.elements.modal.querySelector('.popup-close-btn');
    
    // 디버깅용 로그
    console.log('팝업 요소들:', {
      slider: this.elements.slider,
      footerCloseBtn: this.elements.footerCloseBtn,
      closeBtn: this.elements.closeBtn
    });
    
    // 오버레이에 모달 추가
    this.elements.overlay.appendChild(this.elements.modal);
    
    // DOM에 추가
    document.body.appendChild(this.elements.overlay);
    
    // 이벤트 리스너 추가
    this.addEventListeners();
  },

  /**
   * 슬라이드 HTML 생성
   */
  generateSlides() {
    return this.data.popups.map((popup, index) => {
      if (popup.type === 'education') {
        return this.generateEducationSlide(popup, index);
      } else if (popup.type === 'renewal') {
        return this.generateRenewalSlide(popup, index);
      } else if (popup.type === 'celebration') {
        return this.generateCelebrationSlide(popup, index);
      }
    }).join('');
  },

  /**
   * 교육 공지 슬라이드 생성
   */
  generateEducationSlide(popup, index) {
    const detailsHtml = popup.content.details.map(detail => `
      <div class="detail-item">
        <strong class="detail-label" data-kor="${detail.label.kor}" data-eng="${detail.label.eng}"></strong>
        <span class="detail-value" data-kor="${detail.value.kor}" data-eng="${detail.value.eng}"></span>
      </div>
    `).join('');

    return `
      <div class="popup-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
        <div class="slide-content">
          <h2 class="slide-title" data-kor="${popup.title.kor}" data-eng="${popup.title.eng}">${popup.title.kor}</h2>
          
          <div class="education-content">
            <p class="greeting" data-kor="${popup.content.greeting.kor}" data-eng="${popup.content.greeting.eng}">${popup.content.greeting.kor}</p>
            <p class="main-message" data-kor="${popup.content.main.kor}" data-eng="${popup.content.main.eng}">${popup.content.main.kor}</p>
            
            <div class="education-details">
              ${detailsHtml}
            </div>
            
            <p class="closing-message" data-kor="${popup.content.closing.kor}" data-eng="${popup.content.closing.eng}">${popup.content.closing.kor}</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 리뉴얼 공지 슬라이드 생성
   */
  generateRenewalSlide(popup, index) {
    const downloadsHtml = popup.downloads.categories.map(category => `
      <div class="download-category">
        <h4 class="category-title" data-kor="${category.name.kor}" data-eng="${category.name.eng}">${category.name.kor}</h4>
        <ul class="download-list">
          ${category.items.map(item => `
            <li>
              <a href="${item.filename ?  `/documents/${item.filename}` : item.link}" 
                 class="download-link" ${item.filename ? 'download=""' : ''}>
                <span class="download-name" data-kor="${item.name.kor}" data-eng="${item.name.eng}">${item.name.kor}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    return `
      <div class="popup-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
        <div class="slide-content">
          <h2 class="slide-title" data-kor="${popup.title.kor}" data-eng="${popup.title.eng}">${popup.title.kor}</h2>
            <div class="downloads-section">
              <h3 class="downloads-title" data-kor="${popup.downloads.title.kor}" data-eng="${popup.downloads.title.eng}">${popup.downloads.title.kor}</h3>
              ${downloadsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 축하/경축 슬라이드 생성 (교육 스타일과 동일)
   */
  generateCelebrationSlide(popup, index) {
    const detailsHtml = popup.content.details.map(detail => `
      <div class="detail-item">
        <strong class="detail-label" data-kor="${detail.label.kor}" data-eng="${detail.label.eng}">${detail.label.kor}</strong>
        <span class="detail-value" data-kor="${detail.value.kor}" data-eng="${detail.value.eng}">${detail.value.kor}</span>
      </div>
    `).join('');

    return `
      <div class="popup-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
        <div class="slide-content">
          <h2 class="slide-title" data-kor="${popup.title.kor}" data-eng="${popup.title.eng}">${popup.title.kor}</h2>
          
          <div class="education-content">
            <p class="greeting" data-kor="${popup.content.greeting.kor}" data-eng="${popup.content.greeting.eng}">${popup.content.greeting.kor}</p>
            <p class="main-message" data-kor="${popup.content.main.kor}" data-eng="${popup.content.main.eng}">${popup.content.main.kor}</p>
            
            <div class="education-details">
              ${detailsHtml}
            </div>
            
            <p class="closing-message" data-kor="${popup.content.closing.kor}" data-eng="${popup.content.closing.eng}">${popup.content.closing.kor}</p>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 이벤트 리스너 추가
   */
  addEventListeners() {
    // 닫기 버튼들
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => this.closePopup());
    }
    if (this.elements.footerCloseBtn) {
      this.elements.footerCloseBtn.addEventListener('click', () => this.closePopup());
    }
    
    // 오버레이 클릭으로 닫기
    this.elements.overlay.addEventListener('click', (e) => {
      if (e.target === this.elements.overlay) {
        this.closePopup();
      }
    });

    // 네비게이션 버튼들
    this.elements.prevBtn.addEventListener('click', () => this.prevSlide());
    this.elements.nextBtn.addEventListener('click', () => this.nextSlide());

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.overlay.style.display === 'flex') {
        this.closePopup();
      }
      // 좌우 화살표 키로 슬라이드 이동
      if (e.key === 'ArrowLeft') this.prevSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
    });

    // 화면 크기 변경 시 카운터 업데이트
    window.addEventListener('resize', () => {
      this.updateCounter();
      this.updateSlider();
    });
  },

  /**
   * 다음 슬라이드로 이동 (페이지 단위)
   */
  nextSlide() {
    const slidesPerView = this.getSlidesPerView();
    const totalPages = this.getTotalPages();
    const currentPage = this.getCurrentPage();
    
    if (currentPage < totalPages) {
      this.currentSlide = Math.min(this.currentSlide + slidesPerView, this.totalSlides - 1);
    } else {
      // 마지막 페이지에서 첫 페이지로
      this.currentSlide = 0;
    }
    
    this.updateSlider();
  },

  /**
   * 이전 슬라이드로 이동 (페이지 단위)
   */
  prevSlide() {
    const slidesPerView = this.getSlidesPerView();
    const currentPage = this.getCurrentPage();
    
    if (currentPage > 1) {
      this.currentSlide = Math.max(this.currentSlide - slidesPerView, 0);
    } else {
      // 첫 페이지에서 마지막 페이지로
      const totalPages = this.getTotalPages();
      this.currentSlide = (totalPages - 1) * slidesPerView;
    }
    
    this.updateSlider();
  },

  /**
   * 슬라이더 업데이트
   */
  updateSlider() {
    const slidesPerView = this.getSlidesPerView();
    
    // 슬라이드 이동 (데스크탑과 모바일에서 다른 이동량)
    if (slidesPerView === 1) {
      // 모바일: 개별 슬라이드 단위로 이동
      const translateX = -this.currentSlide * 100;
      this.elements.slider.style.transform = `translateX(${translateX}%)`;
    } else {
      // 데스크탑: 페이지 단위로 이동 (두 개씩)
      const pageIndex = Math.floor(this.currentSlide / slidesPerView);
      const translateX = -pageIndex * 100;
      this.elements.slider.style.transform = `translateX(${translateX}%)`;
    }
    
    // 카운터 업데이트
    this.updateCounter();
    
    // 활성 슬라이드 클래스 업데이트
    this.updateActiveSlides();
  },

  /**
   * 카운터 업데이트
   */
  updateCounter() {
    const currentPage = this.getCurrentPage();
    const totalPages = this.getTotalPages();
    
    this.elements.counter.textContent = currentPage;
    
    // 총 페이지 수도 업데이트 (화면 크기 변경 시)
    const totalSlidesElement = this.elements.modal.querySelector('.total-slides');
    if (totalSlidesElement) {
      totalSlidesElement.textContent = totalPages;
    }
  },

  /**
   * 활성 슬라이드 클래스 업데이트
   */
  updateActiveSlides() {
    const slidesPerView = this.getSlidesPerView();
    
    this.elements.slides.forEach((slide, index) => {
      if (slidesPerView === 1) {
        // 모바일: 현재 슬라이드만 활성화
        slide.classList.toggle('active', index === this.currentSlide);
      } else {
        // 데스크탑: 현재 페이지의 두 슬라이드 모두 활성화
        const pageIndex = Math.floor(this.currentSlide / slidesPerView);
        const startIndex = pageIndex * slidesPerView;
        const endIndex = startIndex + slidesPerView - 1;
        slide.classList.toggle('active', index >= startIndex && index <= endIndex);
      }
    });
  },

  /**
   * 팝업 표시
   */
  showPopup() {
    this.elements.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // 초기 카운터 설정
    this.updateCounter();
    this.updateActiveSlides();
    
    // 언어 설정 적용
    if (window.updateLanguageDisplay) {
      window.updateLanguageDisplay();
    }
  },

  /**
   * 팝업 닫기
   */
  closePopup() {
    // 오늘하루 그만보기 체크 확인 (요소가 존재할 때만)
    if (this.elements.todayCloseCheck && this.elements.todayCloseCheck.checked) {
      this.setTodayClose();
    }
    
    this.hidePopup();
  },

  /**
   * 팝업 숨기기
   */
  hidePopup() {
    this.elements.overlay.style.display = 'none';
    document.body.style.overflow = '';
  },

  /**
   * 오늘하루 그만보기 설정
   */
  setTodayClose() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    localStorage.setItem('ypp-popup-hide-until', tomorrow.getTime().toString());
  },

  /**
   * 오늘하루 그만보기 체크
   */
  shouldShowPopup() {
    const hideUntil = localStorage.getItem('ypp-popup-hide-until');
    if (!hideUntil) return true;
    
    const now = new Date().getTime();
    const hideUntilTime = parseInt(hideUntil);
    
    return now > hideUntilTime;
  }
};

/**
 * 페이지 로드 완료 시 팝업 초기화
 */
document.addEventListener('DOMContentLoaded', () => {
  // 오늘하루 그만보기 체크
  if (YppPopupSlider.shouldShowPopup()) {
    YppPopupSlider.init();
  }
});

// 전역 함수로 팝업 제어 (필요시 외부에서 호출)
window.YppPopup = {
  show: () => YppPopupSlider.showPopup(),
  hide: () => YppPopupSlider.hidePopup(),
  next: () => YppPopupSlider.nextSlide(),
  prev: () => YppPopupSlider.prevSlide()
};