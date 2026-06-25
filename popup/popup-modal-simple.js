/**
 * 간단한 팝업 시스템 - 구글 시트 이미지만 표시
 */
const SimplePopupModal = {
  popups: [],
  currentPage: 0,
  itemsPerPage: 2, // 데스크톱: 2개, 모바일: 1개 (CSS로 제어)
  historyPushed: false,
  isHandlingHistoryBack: false,
  keydownHandler: null,
  popstateHandler: null,

  /**
   * 초기화
   */
  async init() {
    try {
      console.log('🚀 간단 팝업 시스템 시작...');
      
      // 구글 시트에서 데이터 가져오기
      await this.loadPressPopups();
      
      if (this.popups.length > 0) {
        this.createModal();
        this.showPopup();
      } else {
        console.log('📭 표시할 팝업이 없습니다.');
      }
      
    } catch (error) {
      console.error('💥 팝업 초기화 오류:', error);
    }
  },

  /**
   * 모든 팝업 데이터 로드 (구글 시트 + JSON 통합)
   */
  async loadPressPopups() {
    try {
      console.log('📊 통합 팝업 데이터 로드 중...');
      
      // 현재 언어 감지
      const currentLang = this.getCurrentLanguage();
      console.log('🌐 현재 언어:', currentLang);
      
      // 1. 구글 시트 보도자료 데이터 로드
      const pressPopups = await this.loadGoogleSheetPopups(currentLang);
      
      // 2. JSON 아카데미 공지 데이터 로드
      const academyPopups = await this.loadAcademyPopups(currentLang);
      
      // 3. 두 데이터 통합
      this.popups = [...pressPopups, ...academyPopups];
      
      console.log('✅ 통합 팝업 데이터 로드 완료:', this.popups.length, '개');
      console.log('� 구성:', `보도자료 ${pressPopups.length}개 + 아카데미 ${academyPopups.length}개`);
      
    } catch (error) {
      console.error('� 통합 데이터 로드 오류:', error);
    }
  },

  /**
   * 구글 시트에서 보도자료 팝업 데이터 불러오기
   */
  async loadGoogleSheetPopups(currentLang) {
    try {
      console.log('� 구글 시트에서 데이터 로드 중...');
      
      // YPP Config에서 Apps Script URL 가져오기
      if (!window.YPPConfig) {
        console.error('❌ YPP Config가 로드되지 않았습니다.');
        return [];
      }
      
      const appsScriptUrl = await window.YPPConfig.get('PRESS');
      const url = `${appsScriptUrl}?sheet=SHEET_BOARD_NEWS&action=getData`;
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success && result.data) {
        // 타입만 추가
        const mappedData = result.data.map(item => ({
          ...item,
          type: 'press'
        }));
        
        // 필터링: popup이 'on'이고, state가 'on'이며, 이미지가 있는 것만
        console.log('🔍 필터링 전 전체 데이터:', mappedData.length, '개');
        
        const filtered = mappedData.filter(item => {
          // popup 상태가 'on'인지 확인 (대소문자 무관)
          const popupOn = (item.popup || '').toString().toUpperCase() === 'ON';
          // state가 'on'인지 확인 (대소문자 무관)
          const stateOn = (item.state || '').toString().toLowerCase() === 'on';
          
          // 언어에 따른 이미지 선택 (fallback 방식)
          let popupImage = currentLang === 'ko' ? item.popupImageKR : item.popupImageEN;
          if (!popupImage || !popupImage.trim()) {
            popupImage = currentLang === 'ko' ? item.popupImageEN : item.popupImageKR;
          }
          
          const hasImage = popupImage && popupImage.trim() !== '';
          
          // 디버깅: 각 항목별 필터링 조건 출력
          console.log('📋 항목 체크:', {
            id: item.id,
            titleKR: item.titleKR?.substring(0, 20),
            popup: item.popup,
            popupOn,
            state: item.state,
            stateOn,
            popupImageKR: item.popupImageKR ? '있음' : '없음',
            popupImageEN: item.popupImageEN ? '있음' : '없음',
            hasImage,
            통과: popupOn
          });
          
          return popupOn;
        });
        
        console.log('✅ 구글 시트 데이터 로드 완료:', filtered.length, '개');
        console.log('✅ 필터링된 항목들:', filtered);
        
        return filtered;
      }
      
      return [];
    } catch (error) {
      console.error('💥 구글 시트 데이터 로드 오류:', error);
      return [];
    }
  },

  /**
   * JSON에서 아카데미 공지 데이터 불러오기
   */
  async loadAcademyPopups(currentLang) {
    try {
      console.log('📚 아카데미 공지 JSON 로드 중...');
      
      const response = await fetch('/popup/popup-data.json');
      const data = await response.json();
      
      if (data.popups && data.popups.length > 0) {
        const academyPopups = data.popups.map((popup, index) => ({
          id: `academy_${popup.id || index}`,
          type: 'academy',
          titleKR: popup.title.kor,
          titleEN: popup.title.eng,
          academyData: popup.downloads, // 아카데미 상세 데이터
          popup: 'on',
          state: 'on'
        }));
        
        console.log('✅ 아카데미 데이터 로드 완료:', academyPopups.length, '개');
        return academyPopups;
      }
      
      return [];
    } catch (error) {
      console.error('💥 아카데미 데이터 로드 오류:', error);
      return [];
    }
  },

  /**
   * 모달 HTML 생성 (그리드 방식)
   */
  createModal() {
    const modalHtml = `
      <div id="popup-modal" class="popup-modal">
        <div class="popup-content">
          <button class="popup-close" onclick="SimplePopupModal.closePopup()">&times;</button>
          <div id="popup-grid-container" class="popup-grid-container">
            <!-- 그리드 이미지들이 여기에 동적으로 생성됨 -->
          </div>
          <div class="popup-navigation" style="text-align: center; margin-top: 15px;">
            <button id="prev-btn" onclick="SimplePopupModal.prevPage()" style="display:none;">이전</button>
            <span id="popup-counter">1 / 1</span>
            <button id="next-btn" onclick="SimplePopupModal.nextPage()" style="display:none;">다음</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // CSS 파일 로드
    this.loadCSS();
  },

  /**
   * CSS 파일 로드
   */
  loadCSS() {
    const cssId = 'popup-modal-simple-css';
    
    // 이미 로드된 경우 스킵
    if (document.getElementById(cssId)) {
      return;
    }
    
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = '/popup/popup-modal-simple.css';
    document.head.appendChild(link);
    
    console.log('📄 팝업 CSS 파일 로드됨');
  },

  /**
   * 현재 언어 감지 (로컬스토리지 기반)
   */
  getCurrentLanguage() {
    // 로컬스토리지에서 selectedLanguage 확인
    const selectedLanguage = localStorage.getItem('selectedLanguage');
    
    console.log('🌐 로컬스토리지 selectedLanguage:', selectedLanguage);
    
    // 로컬스토리지 값이 'en'이면 영문, 나머지는 한국어
    if (selectedLanguage === 'en') {
      return 'en';
    }
    
    // 기본값은 한국어 ('ko' 또는 null/undefined인 경우)
    return 'ko';
  },

  /**
   * 그리드 팝업 표시
   */
  showPopup() {
    if (this.popups.length === 0) return;
    
    console.log('📱 그리드 팝업 표시 시작...');
    
    // 현재 언어 확인
    const currentLang = this.getCurrentLanguage();
    
    // 페이지별 아이템 개수 (모바일에서는 CSS로 1개씩 표시)
    const isMobile = window.innerWidth <= 768;
    const itemsPerPage = isMobile ? 1 : 2;
    const totalPages = Math.ceil(this.popups.length / itemsPerPage);
    
    // 현재 페이지의 팝업들 가져오기
    const startIndex = this.currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, this.popups.length);
    const currentPagePopups = this.popups.slice(startIndex, endIndex);
    
    // 그리드 컨테이너에 이미지들 표시
    const gridContainer = document.getElementById('popup-grid-container');
    const counterEl = document.getElementById('popup-counter');
    
    if (gridContainer) {
      gridContainer.innerHTML = '';
      
      currentPagePopups.forEach((popup, index) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'popup-grid-item';
        
        if (popup.type === 'press') {
          // 보도자료 타입: 이미지로 표시
          this.renderPressItem(gridItem, popup, currentLang);
        } else if (popup.type === 'academy') {
          // 아카데미 타입: 카드로 표시
          this.renderAcademyItem(gridItem, popup, currentLang);
        }
        
        gridContainer.appendChild(gridItem);
      });
    }
    
    // 페이지 카운터 업데이트
    if (counterEl) {
      counterEl.textContent = `${this.currentPage + 1} / ${totalPages}`;
    }
    
    // 네비게이션 버튼 표시/숨김
    this.updateNavigationButtons(totalPages);

    // ESC/뒤로가기 닫기 동작 활성화
    this.bindModalCloseEvents();
    this.pushHistoryStateForModal();
    
    console.log(`📱 그리드 팝업 표시 완료 (${currentLang}): 페이지 ${this.currentPage + 1}/${totalPages}, ${currentPagePopups.length}개 아이템`);
  },

  /**
   * 모달 닫기 이벤트 바인딩 (ESC / 뒤로가기)
   */
  bindModalCloseEvents() {
    if (!this.keydownHandler) {
      this.keydownHandler = (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
          const modal = document.getElementById('popup-modal');
          if (modal) {
            this.closePopup();
          }
        }
      };
      document.addEventListener('keydown', this.keydownHandler);
    }

    if (!this.popstateHandler) {
      this.popstateHandler = () => {
        const modal = document.getElementById('popup-modal');
        if (modal) {
          this.closePopup({ fromPopstate: true });
        }
      };
      window.addEventListener('popstate', this.popstateHandler);
    }
  },

  /**
   * 팝업 전용 히스토리 상태 추가
   */
  pushHistoryStateForModal() {
    if (this.historyPushed) return;

    history.pushState({ simplePopupModalOpen: true }, '', window.location.href);
    this.historyPushed = true;
  },

  /**
   * 모달 닫기 이벤트 해제
   */
  unbindModalCloseEvents() {
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }

    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }
  },

  /**
   * 보도자료 아이템 렌더링
   */
  renderPressItem(gridItem, popup, currentLang) {
    // 언어에 맞는 이미지와 제목 선택 (fallback 방식)
    let popupImage = currentLang === 'en' ? popup.popupImageEN : popup.popupImageKR;
    
    // 현재 언어 이미지가 없으면 다른 언어 이미지 사용 (fallback)
    if (!popupImage || !popupImage.trim()) {
      popupImage = currentLang === 'en' ? popup.popupImageKR : popup.popupImageEN;
    }
    
    const popupTitle = currentLang === 'en' ? popup.titleEN : popup.titleKR;
    
    if (popupImage) {
      gridItem.innerHTML = `
        <img src="${popupImage}" alt="${popupTitle || ''}" />
      `;
      
      // 클릭 이벤트 추가 (보도자료로 이동)
      if (popup.id) {
        gridItem.onclick = () => {
          const pressUrl = `/pages/media/newsroom/press.html?id=${popup.id}`;
          console.log('🔗 보도자료로 이동:', pressUrl);
          window.open(pressUrl, '_blank');
        };
      }
    }
  },

  /**
   * 아카데미 공지 아이템 렌더링 (카드 형태)
   */
  renderAcademyItem(gridItem, popup, currentLang) {
    const title = currentLang === 'en' ? popup.titleEN : popup.titleKR;
    const academyData = popup.academyData;
    
    // 아카데미 공지 카드 HTML 생성
    gridItem.innerHTML = `
      <div class="academy-card">
        <div class="academy-header">
          <h3 class="academy-title">${title}</h3>
        </div>
        <div class="academy-content">
          ${this.renderAcademyContent(academyData, currentLang)}
        </div>
      </div>
    `;
    
    // 클릭 이벤트는 개별 링크에 적용
    this.addAcademyClickEvents(gridItem, academyData);
  },

  /**
   * 아카데미 내용 렌더링 (전체 내용)
   */
  renderAcademyContent(academyData, currentLang) {
    if (!academyData || !academyData.categories) return '';
    
    return academyData.categories.map(category => {
      const categoryName = currentLang === 'en' ? category.name.eng : category.name.kor;
      
      // items가 없거나 빈 배열인 경우 처리
      if (!category.items || category.items.length === 0) {
        return `
          <div class="academy-section">
            <div class="academy-category-title">${categoryName}</div>
          </div>
        `;
      }
      
      const items = category.items.map(item => {
        const itemName = currentLang === 'en' ? item.name.eng : item.name.kor;
        
        if (item.link) {
          return `<a href="${item.link}" class="academy-link" target="_blank">${itemName}</a>`;
        } else if (item.filename) {
          return `<a href="./documents/${item.filename}" class="academy-link" target="_blank" download="${item.filename}">${itemName}</a>`;
        } else {
          return `<span class="academy-item">${itemName}</span>`;
        }
      }).join('');
      
      return `
        <div class="academy-section">
          <div class="academy-category-title">${categoryName}</div>
          <div class="academy-items">${items}</div>
        </div>
      `;
    }).join('');
  },

  /**
   * 아카데미 클릭 이벤트 추가
   */
  addAcademyClickEvents(gridItem, academyData) {
    // 각 링크에 대한 클릭 이벤트는 이미 HTML에서 처리됨
    // 추가 로직이 필요하면 여기에 구현
  },

  /**
   * 네비게이션 버튼 업데이트
   */
  updateNavigationButtons(totalPages) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) {
      prevBtn.style.display = this.currentPage > 0 ? 'inline-block' : 'none';
    }
    
    if (nextBtn) {
      nextBtn.style.display = this.currentPage < totalPages - 1 ? 'inline-block' : 'none';
    }
  },

  /**
   * 다음 페이지
   */
  nextPage() {
    const isMobile = window.innerWidth <= 768;
    const itemsPerPage = isMobile ? 1 : 2;
    const totalPages = Math.ceil(this.popups.length / itemsPerPage);
    
    if (this.currentPage < totalPages - 1) {
      this.currentPage++;
      this.showPopup();
    }
  },

  /**
   * 이전 페이지
   */
  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.showPopup();
    }
  },



  /**
   * 팝업 닫기
   */
  closePopup(options = {}) {
    const { fromPopstate = false } = options;
    const modal = document.getElementById('popup-modal');
    if (modal) {
      modal.remove();
    }

    this.unbindModalCloseEvents();

    // ESC/X 버튼 등으로 닫을 때는 history를 한 단계 되돌려 URL 히스토리 정리
    if (this.historyPushed && !fromPopstate && !this.isHandlingHistoryBack) {
      this.isHandlingHistoryBack = true;
      history.back();
      this.isHandlingHistoryBack = false;
    }

    this.historyPushed = false;
  }
};

// 페이지 로드 시 자동 실행
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    SimplePopupModal.init();
  }, 1000);
});