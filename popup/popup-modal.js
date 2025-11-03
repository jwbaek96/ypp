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
   * JSON 데이터와 구글 시트 데이터를 불러와서 팝업을 생성합니다.
   */
  async init() {
    try {
      console.log('🚀 팝업 시스템 초기화 시작...');
      
      // 구글 시트에서 보도자료 팝업 데이터만 불러오기
      console.log('📊 구글 시트에서 보도자료 팝업 로드 중...');
      const pressPopups = await this.loadPressPopups();
      console.log('✅ 보도자료 팝업 로드 완료:', pressPopups.length, '개');
      
      // 보도자료 팝업만 사용
      this.data = {
        popups: pressPopups
      };
      
      this.totalSlides = this.data.popups.length;
      
      console.log('🎯 최종 팝업 데이터:', {
        보도자료: pressPopups.length,
        총합: this.totalSlides
      });
      
      console.log('📋 최종 팝업 목록:');
      this.data.popups.forEach((popup, index) => {
        console.log(`  ${index + 1}. [${popup.type}] ${popup.title?.kor || popup.title || 'No Title'}`);
      });
      
      // 팝업이 있을 때만 생성 및 표시
      if (this.totalSlides > 0) {
        console.log('🎪 팝업 생성 및 표시 중...');
        this.createPopup();
        this.showPopup();
        console.log('✅ 팝업 표시 완료!');
      } else {
        console.log('⚠️ 표시할 팝업이 없습니다.');
      }
      
    } catch (error) {
      console.error('💥 팝업 데이터 로드 실패:', error);
    }
  },

  /**
   * 구글 시트에서 보도자료 팝업 데이터 불러오기
   */
  async loadPressPopups() {
    try {
      console.log('🔍 보도자료 팝업 로드 시작...');
      
      // YPP Config에서 Apps Script URL 가져오기
      if (!window.YPPConfig) {
        console.warn('❌ YPP Config가 로드되지 않았습니다.');
        return [];
      }

      console.log('✅ YPP Config 로드 확인됨');
      
      // press.html에서 작동하는 실제 Apps Script URL 직접 사용 (하드코딩)
      const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbzys_Wtyki3iTakXqwDL4VJkBP-oUC482jUiWyZuzNzglmVfar1_EUC_ym91NMIrrFH/exec';
      console.log('📡 Apps Script URL (하드코딩):', appsScriptUrl);
      
      const url = `${appsScriptUrl}?sheet=SHEET_BOARD_NEWS&action=getData`;
      console.log('🌐 요청 URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log('📥 응답 상태:', response.status, response.statusText);
      console.log('📥 응답 헤더들:', [...response.headers.entries()]);
      
      if (!response.ok) {
        console.error(`❌ HTTP 오류: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 전체 응답 데이터:', result);
      
      if (!result.success) {
        console.error('❌ 보도자료 데이터 로드 실패:', result.message);
        return [];
      }

      console.log('📝 전체 보도자료 항목 수:', result.data?.length || 0);
      
      // 🔍 모든 프레스 데이터를 콘솔에 자세히 출력
      console.log('=== 전체 프레스 데이터 상세 정보 ===');
      if (result.data && result.data.length > 0) {
        result.data.forEach((item, index) => {
          console.log(`\n📰 항목 ${index + 1}:`, {
            id: item.id || item.number || 'ID없음',
            순번: item.number || 'N/A',
            분류: item.category || 'N/A', 
            상태: item.state || 'N/A',
            제목한글: item.titleKR || 'N/A',
            제목영문: item.titleEN || 'N/A',
            이미지: item.image ? '있음' : '없음',
            내용한글: item.contentKR ? `${item.contentKR.substring(0, 50)}...` : 'N/A',
            내용영문: item.contentEN ? `${item.contentEN.substring(0, 50)}...` : 'N/A',
            출처링크: item.sourceLink || 'N/A',
            파일업로드: item.fileUpload || 'N/A',
            팝업: item.popup || 'N/A',
            팝업이미지한글: item.popupImageKR ? '있음' : '없음',
            팝업이미지영문: item.popupImageEN ? '있음' : '없음',
            날짜: item.submittedAt || item.date || 'N/A'
          });
          
          // 각 필드별 실제 값도 보여주기
          console.log(`   실제값 - popup: "${item.popup}", state: "${item.state}"`);
          if (item.popupImageKR) {
            console.log(`   팝업이미지 URL: ${item.popupImageKR}`);
          }
        });
      } else {
        console.log('❌ 데이터가 비어있습니다.');
      }
      
      // 각 항목의 popup과 state 필드 확인
      if (result.data && result.data.length > 0) {
        result.data.forEach((item, index) => {
          console.log(`📰 항목 ${index + 1}:`, {
            id: item.id || item.number,
            title: item.titleKR,
            popup: item.popup,
            state: item.state,
            popupImageKR: item.popupImageKR ? '있음' : '없음',
            popupImageEN: item.popupImageEN ? '있음' : '없음'
          });
        });
      }

      // 팝업 필드가 'on'이고 state가 'on'인 항목들만 필터링
      const filteredItems = (result.data || [])
        .filter(item => {
          const popupValue = (item.popup || '').toString().toLowerCase();
          const stateValue = (item.state || '').toString().toLowerCase();
          const isPopupOn = popupValue === 'on';
          const isStateOn = stateValue === 'on';
          
          console.log(`🔍 필터링 검사 - ${item.titleKR || 'No Title'}:`, {
            popup: `"${item.popup}" -> ${popupValue} -> ${isPopupOn}`,
            state: `"${item.state}" -> ${stateValue} -> ${isStateOn}`,
            통과: isPopupOn && isStateOn
          });
          
          return isPopupOn && isStateOn;
        });
      
      console.log('✅ 필터링된 항목 수:', filteredItems.length);
      
      const pressPopups = filteredItems.map(item => this.convertPressToPopup(item));
      
      console.log('🎉 변환된 보도자료 팝업:', pressPopups.length, '개');
      pressPopups.forEach((popup, index) => {
        console.log(`팝업 ${index + 1}:`, {
          id: popup.id,
          title: popup.title.kor,
          image: popup.image ? '있음' : '없음',
          link: popup.link
        });
      });
      
      return pressPopups;
      
    } catch (error) {
      console.error('💥 보도자료 팝업 로드 오류:', error);
      
      // CORS 오류인 경우 폴백 URL로 시도
      console.log('🔄 폴백 URL로 재시도...');
      
      try {
        // 실제 작동하는 Apps Script URL로 시도 (SUPPORT URL 구조 참고)
        const fallbackUrl = 'https://script.google.com/macros/s/AKfycbxrBjwJRbcaOWXk3Vrnv8GySyiSfeYSKLLzYvZxmHmsZ_AqUZwxDKMmOW53lRXliQgdRg/exec';
        const testUrl = `${fallbackUrl}?sheet=SHEET_BOARD_NEWS&action=getData`;
        console.log('🌐 폴백 테스트 URL:', testUrl);
        
        const fallbackResponse = await fetch(testUrl, {
          method: 'GET',
          mode: 'cors'
        });
        
        console.log('📥 폴백 응답 상태:', fallbackResponse.status);
        
        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json();
          console.log('📊 폴백 응답 데이터:', fallbackResult);
          
          if (fallbackResult.success && fallbackResult.data) {
            // 🔍 폴백 데이터도 상세히 출력
            console.log('=== 폴백 프레스 데이터 상세 정보 ===');
            fallbackResult.data.forEach((item, index) => {
              console.log(`\n📰 항목 ${index + 1}:`, {
                id: item.id || item.number || 'ID없음',
                순번: item.number || 'N/A',
                분류: item.category || 'N/A', 
                상태: item.state || 'N/A',
                제목한글: item.titleKR || 'N/A',
                제목영문: item.titleEN || 'N/A',
                이미지: item.image ? '있음' : '없음',
                출처링크: item.sourceLink || 'N/A',
                파일업로드: item.fileUpload || 'N/A',
                팝업: item.popup || 'N/A',
                팝업이미지한글: item.popupImageKR ? '있음' : '없음',
                팝업이미지영문: item.popupImageEN ? '있음' : '없음',
                날짜: item.submittedAt || item.date || 'N/A'
              });
              
              // 각 필드별 실제 값도 보여주기
              console.log(`   실제값 - popup: "${item.popup}", state: "${item.state}"`);
              if (item.popupImageKR) {
                console.log(`   팝업이미지 URL: ${item.popupImageKR}`);
              }
            });
            
            const filteredItems = (fallbackResult.data || [])
              .filter(item => {
                const popupValue = (item.popup || '').toString().toLowerCase();
                const stateValue = (item.state || '').toString().toLowerCase();
                const isPopupOn = popupValue === 'on';
                const isStateOn = stateValue === 'on';
                
                console.log(`🔍 필터링 검사 - ${item.titleKR || 'No Title'}:`, {
                  popup: `"${item.popup}" -> ${popupValue} -> ${isPopupOn}`,
                  state: `"${item.state}" -> ${stateValue} -> ${isStateOn}`,
                  통과: isPopupOn && isStateOn
                });
                
                return isPopupOn && isStateOn;
              });
            
            console.log('✅ 폴백으로 보도자료 팝업 로드 성공:', filteredItems.length, '개');
            return filteredItems.map(item => this.convertPressToPopup(item));
          }
        }
      } catch (fallbackError) {
        console.error('💥 폴백도 실패:', fallbackError);
      }
      
      return [];
    }
  },

  /**
   * 보도자료 데이터를 팝업 형식으로 변환
   */
  convertPressToPopup(pressItem) {
    // 현재 언어 설정 확인
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'kr';
    
    // 분류 처리
    const category = pressItem.category || '보도자료';
    const categoryKR = category === '공지사항' ? '공지사항' : '보도자료';
    const categoryEN = category === '공지사항' ? 'Notice' : 'Press Release';
    
    // 팝업 이미지 선택 (한글/영문)
    const popupImage = selectedLanguage === 'en' ? 
      (pressItem.popupImageEN || pressItem.popupImageKR || '') : 
      (pressItem.popupImageKR || pressItem.popupImageEN || '');
    
    return {
      type: 'press',
      id: pressItem.id || pressItem.number,
      title: {
        kor: pressItem.titleKR || '제목 없음',
        eng: pressItem.titleEN || pressItem.titleKR || 'No Title'
      },
      category: {
        kor: categoryKR,
        eng: categoryEN
      },
      image: popupImage,
      link: `/pages/media/newsroom/press.html?id=${pressItem.id || pressItem.number}`,
      date: pressItem.submittedAt || pressItem.date || ''
    };
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
   * 슬라이드 HTML 생성 (간단하게 이미지만)
   */
  generateSlides() {
    return this.data.popups.map((popup, index) => {
      const imageUrl = popup.popupImageKR || '';
      
      return `
        <div class="popup-slide ${index === 0 ? 'active' : ''}" data-slide="${index}">
          <div class="slide-content">
            <img src="${imageUrl}" alt="${popup.titleKR || ''}" style="max-width: 100%; height: auto;">
          </div>
        </div>
      `;
    }).join('');
  },

  // 복잡한 슬라이드 생성 함수들 제거됨 (간단화)

  /**
   * 팝업용 날짜 포맷팅
   */



  /**
   * 팝업용 날짜 포맷팅
   */
  formatPopupDate(dateString) {
    if (!dateString) return '';
    
    try {
      // "YYYY-MM-DD HH:MM:SS" 형식인 경우 날짜 부분만 추출
      if (typeof dateString === 'string' && dateString.includes(' ')) {
        const datePart = dateString.split(' ')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          return datePart.replace(/-/g, '.');
        }
      }
      
      // 'YYYY-MM-DD' 형식인 경우
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString.replace(/-/g, '.');
      }
      
      // 다른 형식인 경우 Date 객체로 변환
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return dateString;
    }
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
    
    // 보도자료 팝업의 이미지 alt 태그 업데이트
    this.updatePressPopupLanguage();
  },

  /**
   * 보도자료 팝업의 언어별 요소 업데이트
   */
  updatePressPopupLanguage() {
    const selectedLanguage = localStorage.getItem('selectedLanguage') || 'kr';
    const pressSlides = this.elements.modal.querySelectorAll('.press-popup-slide');
    
    pressSlides.forEach(slide => {
      // 이미지 alt 태그 업데이트
      const img = slide.querySelector('.press-popup-image');
      if (img) {
        const altKor = img.getAttribute('data-alt-kor');
        const altEng = img.getAttribute('data-alt-eng');
        img.alt = selectedLanguage === 'en' ? altEng : altKor;
      }
      
      // 폴백 콘텐츠의 언어별 요소들은 기존 data-kor, data-eng 속성으로 처리
    });
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
  prev: () => YppPopupSlider.prevSlide(),
  updateLanguage: () => YppPopupSlider.updatePressPopupLanguage()
};