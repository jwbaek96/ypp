
// 팝업 관리 객체
const YppPopupModal = {
  // 팝업 데이터를 저장할 변수
  data: null,
  
  // 팝업 요소들을 저장할 변수
  elements: {
    overlay: null,
    modal: null,
    closeBtn: null
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
  createPopup() {
    const popup = this.data.popup;
    console.log(popup.downloads.files[0]);
    
    // 오버레이 (배경) 생성
    this.elements.overlay = document.createElement('div');
    this.elements.overlay.className = 'ypp-popup-overlay';
    
    // 모달 컨테이너 생성
    this.elements.modal = document.createElement('div');
    this.elements.modal.className = 'ypp-popup-modal';
    
    // 모달 내용 HTML 생성
    this.elements.modal.innerHTML = `
      <div class="ypp-popup-header">
        <h2 class="ypp-popup-title" data-kor='${popup.title.kor}' data-eng='${popup.title.eng}'></h2>
        <button class="ypp-popup-close" aria-label="팝업 닫기">×</button>
      </div>
      
      <div class="ypp-popup-content">
        <!-- 리뉴얼 안내 메시지 -->
        <div class="ypp-popup-message">
          <p class="message-main" data-kor='${popup.message.main.kor}' data-eng='${popup.message.main.eng}'></p>
          <p class="message-sub" data-kor='${popup.message.sub.kor}' data-eng='${popup.message.sub.eng}'></p>
          <p class="message-thanks" data-kor='${popup.message.thanks.kor}' data-eng='${popup.message.thanks.eng}'></p>
          <!--<p class="completion-date">
            <strong data-kor='리뉴얼 완료 예정일: ${popup.message.completion_date.kor}' data-eng='Expected Completion: ${popup.message.completion_date.eng}'></strong>
          </p>-->
        </div>
        
        <!-- 자료 다운로드 섹션 -->
        <div class="ypp-popup-downloads">
          <div class="download-category"><h4 data-kor="${popup.downloads.files[0].category.kor}" data-eng="${popup.downloads.files[0].category.eng}"></h4>
            <ul class="download-list">
              <li>
                <a href="/documents/${popup.downloads.files[0].category.items[0].filename}" download="" class="download-link">
                  <span class="download-name" data-kor="${popup.downloads.files[0].category.items[0].name.kor}" data-eng="${popup.downloads.files[0].category.items[0].name.eng}"></span>
                </a>
              </li>
            
              <li>
                <a href="${popup.downloads.files[0].category.items[1].link}" class="download-link">
                  <span class="download-name" data-kor="${popup.downloads.files[0].category.items[1].name.kor}" data-eng="${popup.downloads.files[0].category.items[1].name.eng}"></span>
                </a>
              </li>
            </ul>
          </div>
          <div class="download-category"><h4 data-kor="${popup.downloads.files[1].category.kor}" data-eng="${popup.downloads.files[1].category.eng}"></h4>
            <ul class="download-list">
              <li>
                <a href="/documents/${popup.downloads.files[1].category.items[0].filename}" download="" class="download-link">
                  <span class="download-name" data-kor="${popup.downloads.files[1].category.items[0].name.kor}" data-eng="${popup.downloads.files[1].category.items[0].name.eng}"></span>
                </a>
              </li>
            
              <li>
                <a href="${popup.downloads.files[1].category.items[1].link}" class="download-link">
                  <span class="download-name" data-kor="${popup.downloads.files[1].category.items[1].name.kor}" data-eng="${popup.downloads.files[1].category.items[1].name.eng}"></span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 연락처 정보 -->
        <div class="ypp-popup-contact">
          <h3 data-kor='${popup.contact.title.kor}' data-eng='${popup.contact.title.eng}'></h3>
          <div class="contact-info">
            <div class="contact-item">
              <strong data-kor='${popup.contact.general.label.kor}' data-eng='${popup.contact.general.label.eng}'></strong>
              <a href="tel:${popup.contact.general.phone.replace(/[^0-9]/g, '')}">${popup.contact.general.phone}</a>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // 오버레이에 모달 추가
    this.elements.overlay.appendChild(this.elements.modal);
    
    // 페이지에 오버레이 추가
    document.body.appendChild(this.elements.overlay);
    
    // 닫기 버튼 요소 저장
    this.elements.closeBtn = this.elements.modal.querySelector('.ypp-popup-close');
    
    // 이벤트 리스너 등록
    this.attachEventListeners();
  },

  /**
   * 다운로드 섹션 HTML 생성
   * @param {Array} files - 다운로드 파일 데이터 배열
   * @returns {string} 다운로드 섹션 HTML 문자열
   */

  /**
   * 이벤트 리스너 등록
   * 팝업 닫기 관련 이벤트들을 등록합니다.
   */
  attachEventListeners() {
    // 닫기 버튼 클릭 이벤트
    this.elements.closeBtn.addEventListener('click', () => {
      this.hidePopup();
    });
    
    // 오버레이 클릭 시 팝업 닫기 (모달 외부 클릭)
    this.elements.overlay.addEventListener('click', (e) => {
      if (e.target === this.elements.overlay) {
        this.hidePopup();
      }
    });
    
    // ESC 키 누르면 팝업 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.overlay.style.display === 'flex') {
        this.hidePopup();
      }
    });
  },

  /**
   * 팝업 표시
   * 팝업을 화면에 보여줍니다.
   */
  showPopup() {
    this.elements.overlay.style.display = 'flex';
    
    // 스크롤 방지
    document.body.style.overflow = 'hidden';
  },

  /**
   * 팝업 숨기기
   * 팝업을 화면에서 숨깁니다.
   */
  hidePopup() {
    this.elements.overlay.style.display = 'none';
    
    // 스크롤 복구
    document.body.style.overflow = '';
  }
};

/**
 * 페이지 로드 완료 시 팝업 초기화
 * DOM이 완전히 로드된 후 팝업을 표시합니다.
 */
document.addEventListener('DOMContentLoaded', () => {
  // 팝업 초기화 및 표시
  YppPopupModal.init();
});