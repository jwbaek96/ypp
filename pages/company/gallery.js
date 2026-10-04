// ===== 갤러리 초기화 스크립트 =====
// about.html의 하단에 추가할 스크립트

document.addEventListener('DOMContentLoaded', function() {
    // 갤러리 초기화를 위한 함수
    function initBusinessGalleries() {
        // 인허가 갤러리 초기화
        if (document.getElementById('license-gallery')) {
            window.galleryInstances.licenseGallery = initGallery(
                'license-gallery',
                'SHEET_GAL_A', // Google Sheets에서 인허가 데이터
                12 // 페이지당 12개 아이템
            );
        }
        
        // 유자격 갤러리 초기화
        if (document.getElementById('qualification-gallery')) {
            window.galleryInstances.qualificationGallery = initGallery(
                'qualification-gallery',
                'SHEET_GAL_B', // Google Sheets에서 유자격 데이터
                12 // 페이지당 12개 아이템
            );
        }
    }
    
    // About 페이지 컨트롤러가 초기화된 후 갤러리 초기화
    if (typeof aboutPageController !== 'undefined' && aboutPageController) {
        initBusinessGalleries();
    } else {
        // about.js가 아직 로드되지 않은 경우 이벤트 리스너 등록
        document.addEventListener('aboutPageReady', initBusinessGalleries);
        
        // 백업으로 일정 시간 후 초기화 시도
        setTimeout(initBusinessGalleries, 1000);
    }
    
    // 탭 전환 시 갤러리 새로고침 (필요한 경우)
    document.addEventListener('tabChanged', function(e) {
        if (e.detail.tabId === 'aboutus-mainbusiness') {
            // aboutus-mainbusiness 탭으로 전환될 때 갤러리 새로고침
            setTimeout(() => {
                if (window.galleryInstances.licenseGallery) {
                    window.galleryInstances.licenseGallery.refresh();
                }
                if (window.galleryInstances.qualificationGallery) {
                    window.galleryInstances.qualificationGallery.refresh();
                }
            }, 100);
        }
    });
});

// ===== 갤러리 관련 유틸리티 함수들 =====

// 특정 갤러리 새로고침
function refreshGallery(galleryType) {
    const gallery = window.galleryInstances[galleryType + 'Gallery'];
    if (gallery) {
        gallery.refresh();
    }
}

// 모든 갤러리 새로고침
function refreshAllGalleries() {
    Object.values(window.galleryInstances).forEach(gallery => {
        if (gallery && typeof gallery.refresh === 'function') {
            gallery.refresh();
        }
    });
}

// 갤러리 상태 확인
function getGalleryStatus() {
    const status = {};
    Object.keys(window.galleryInstances).forEach(key => {
        const gallery = window.galleryInstances[key];
        if (gallery) {
            status[key] = {
                currentPage: gallery.getCurrentPage(),
                totalPages: gallery.getTotalPages(),
                totalItems: gallery.getGalleryData().length
            };
        }
    });
    return status;
}

// 전역 함수로 등록
window.refreshGallery = refreshGallery;
window.refreshAllGalleries = refreshAllGalleries;
window.getGalleryStatus = getGalleryStatus;



// ===== 갤러리 시스템 JavaScript =====

class GallerySystem {
    constructor(containerId, sheetType, itemsPerPage = 12) {
        this.container = document.getElementById(containerId);
        this.sheetType = sheetType; // 'SHEET_GAL_A', 'SHEET_GAL_B' 등
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalPages = 1;
        this.galleryData = [];
        this.filteredData = []; // 검색 결과 데이터
        this.currentItems = [];
        this.searchKeyword = '';
        
        // Apps Script 설정 - 동적으로 로드
        this.appsScriptUrl = null;
        
        this.init();
    }

    // Apps Script URL을 동적으로 가져오기
    async getAppsScriptUrl() {
        if (this.appsScriptUrl) {
            return this.appsScriptUrl; // 이미 로드된 경우 캐시된 값 사용
        }

        try {
            // YPP Config가 로드되어 있는지 확인
            if (!window.YPPConfig) {
                throw new Error('YPP Config가 로드되지 않았습니다.');
            }

            // Company Gallery Apps Script URL 가져오기
            this.appsScriptUrl = await window.YPPConfig.get('COMPANY_GALLERY');
            console.log('✅ Company Gallery Apps Script URL 로드 완료:', this.appsScriptUrl);
            return this.appsScriptUrl;
        } catch (error) {
            console.error('💥 Company Gallery Apps Script URL 로드 실패:', error);
            throw error; // 에러를 상위로 전파
        }
    }

    // 초기화
    async init() {
        if (!this.container) {
            console.error('Gallery container not found:', this.containerId);
            return;
        }
        this.createGalleryStructure();
        await this.loadGalleryData();
        this.setupEventListeners();
    }

    // 갤러리 구조 생성
    createGalleryStructure() {
        this.container.innerHTML = `
            
            <div class="gallery-container">
                <div class="gallery-content">
                    <div class="gallery-loading"></div>
                </div>
                <!--
                <div class="gallery-search-wrap">
                    <input type="text" class="gallery-search-input" placeholder="검색어를 입력하세요" />
                    <button class="gallery-search-btn" type="button">검색</button>
                </div>
                -->
                <div class="gallery-pagination" style="display: none;">
                    <button class="pagination-btn prev-btn" data-action="prev">
                        ◀
                    </button>
                    <div class="page-numbers"></div>
                    <button class="pagination-btn next-btn" data-action="next">
                        ▶
                    </button>
                </div>
            </div>
            <!-- 팝업 오버레이 -->
            <div class="gallery-popup-overlay">
                <div class="gallery-popup-container">
                    <div class="gallery-popup-header">
                        <div class="gallery-popup-info">
                            <h4 class="gallery-popup-title"></h4>
                            <div class="gallery-popup-date"></div>
                        </div>
                        <div class="gallery-popup-controls">
                            <button class="popup-btn close-btn" data-action="close" title="닫기">
                                ✕
                            </button>
                        </div>
                    </div>
                    <div class="gallery-popup-image-container">
                        <div class="popup-image-wrapper">
                            <img class="gallery-popup-image" src="" alt="">
                        </div>
                    </div>
                    <div class="popup-image-info" style="display: none; justify-content: space-between; align-items: center; padding: 8px 20px; background: rgba(0,0,0,0.1); border-top: 1px solid #eee;">
                        <div class="image-counter" style="font-size: 14px; color: #666;">
                            <span class="current-image">1</span> / <span class="total-images">1</span>
                        </div>
                        <div class="popup-image-nav" style="display: flex; gap: 8px; padding: 5;">
                            <button class="popup-nav-btn prev-image-btn" data-action="prev-image" title="이전 이미지" style="
                                padding: 4px 6px; 
                                background: #fff; 
                                border: 1px solid #ddd; 
                                border-radius: 4px; 
                                cursor: pointer; 
                                font-size: 14px; 
                                color: #333;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#999';" onmouseout="this.style.background='#fff'; this.style.borderColor='#ddd';">
                                ◀
                            </button>
                            <button class="popup-nav-btn next-image-btn" data-action="next-image" title="다음 이미지" style="
                                padding: 4px 6px; 
                                background: #fff; 
                                border: 1px solid #ddd; 
                                border-radius: 4px; 
                                cursor: pointer; 
                                font-size: 14px; 
                                color: #333;
                                transition: all 0.2s ease;
                            " onmouseover="this.style.background='#f5f5f5'; this.style.borderColor='#999';" onmouseout="this.style.background='#fff'; this.style.borderColor='#ddd';">
                                ▶
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // DOM 요소들 캐시
        this.galleryContent = this.container.querySelector('.gallery-content');
        this.pagination = this.container.querySelector('.gallery-pagination');
        this.prevBtn = this.container.querySelector('.prev-btn');
        this.nextBtn = this.container.querySelector('.next-btn');
        this.pageNumbers = this.container.querySelector('.page-numbers');
        
        this.popupOverlay = this.container.querySelector('.gallery-popup-overlay');
        this.popupTitle = this.container.querySelector('.gallery-popup-title');
        this.popupDate = this.container.querySelector('.gallery-popup-date');
        this.popupImage = this.container.querySelector('.gallery-popup-image');
        this.downloadBtn = this.container.querySelector('.download-btn');
        this.downloadAllBtn = null; // 전체 다운로드 버튼 없음
        this.closeBtn = this.container.querySelector('.close-btn');
        
        // 이미지 슬라이더 관련 요소들
        this.prevImageBtn = this.container.querySelector('.prev-image-btn');
        this.nextImageBtn = this.container.querySelector('.next-image-btn');
        this.popupImageInfo = this.container.querySelector('.popup-image-info');
        this.currentImageSpan = this.container.querySelector('.current-image');
        this.totalImagesSpan = this.container.querySelector('.total-images');
        
        // 슬라이더 상태 초기화
        this.currentImageIndex = 0;
        this.currentItemImages = [];
        
        // 이미지 프리로딩을 위한 캐시
        this.imageCache = new Map();
        this.preloadingImages = new Set();
        
        // 검색 관련 요소들
        this.searchInput = this.container.querySelector('.gallery-search-input');
        this.searchBtn = this.container.querySelector('.gallery-search-btn');
    }
    
    // 이미지 프리로딩 함수
    preloadImage(url) {
        return new Promise((resolve, reject) => {
            // 이미 캐시에 있거나 로딩 중이면 스킵
            if (this.imageCache.has(url) || this.preloadingImages.has(url)) {
                resolve(this.imageCache.get(url));
                return;
            }
            
            this.preloadingImages.add(url);
            const img = new Image();
            
            img.onload = () => {
                this.imageCache.set(url, img);
                this.preloadingImages.delete(url);
                resolve(img);
            };
            
            img.onerror = () => {
                this.preloadingImages.delete(url);
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            img.src = url;
        });
    }
    
    // 다중 이미지 프리로딩
    async preloadImages(imageUrls) {
        const preloadPromises = imageUrls.map(url => 
            this.preloadImage(url).catch(error => {
                console.warn('이미지 프리로딩 실패:', error);
                return null;
            })
        );
        
        try {
            await Promise.allSettled(preloadPromises);
            console.log(`✅ ${imageUrls.length}개 이미지 프리로딩 완료`);
        } catch (error) {
            console.error('이미지 프리로딩 중 오류:', error);
        }
    }
    
    // 현재 페이지 썸네일들 프리로딩
    async preloadCurrentPageThumbnails() {
        const thumbnailUrls = [];
        
        this.currentItems.forEach(item => {
            // 썸네일 URL 수집
            const thumbnail = item.images ? item.images[0].url : item.image;
            if (thumbnail) {
                thumbnailUrls.push(thumbnail);
            }
            
            // 해당 아이템의 모든 이미지도 백그라운드에서 미리 로드 (지연 로딩)
            if (item.images && item.images.length > 1) {
                const allImageUrls = item.images.map(img => img.url);
                setTimeout(() => {
                    this.preloadImages(allImageUrls);
                }, 1000); // 1초 후에 백그라운드로 로드
            }
        });
        
        if (thumbnailUrls.length > 0) {
            this.preloadImages(thumbnailUrls);
        }
    }
    
    // 갤러리 데이터 로드
    async loadGalleryData() {
        try {
            // 동적으로 Apps Script URL 가져오기
            const baseUrl = await this.getAppsScriptUrl();
            const url = `${baseUrl}?sheet=${this.sheetType}&action=getData`;
            console.log('갤러리 데이터 요청:', url);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('갤러리 API 응답:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'API 요청 실패');
            }
            
            // Apps Script에서 받은 데이터를 갤러리 형식에 맞게 변환
            this.galleryData = this.transformDataForGallery(result.data);
            
            if (!Array.isArray(this.galleryData) || this.galleryData.length === 0) {
                this.showEmptyState();
                return;
            }
            
            this.galleryData.reverse();
            this.filteredData = this.galleryData; // 검색 미적용시 전체 데이터
            this.calculatePagination();
            this.updateGalleryDescription();
            this.renderCurrentPage();
            this.updatePagination();
            
        } catch (error) {
            console.error('갤러리 데이터 로드 실패:', error);
            this.showErrorState();
        }
    }
    
    // Apps Script 데이터를 갤러리 형식에 맞게 변환
    transformDataForGallery(apiData) {
        if (!Array.isArray(apiData)) {
            console.error('API 데이터가 배열이 아닙니다:', apiData);
            return [];
        }
        
        return apiData.map(item => {
            // 이미지 배열 처리
            let images = [];
            if (item.image && Array.isArray(item.image) && item.image.length > 0) {
                images = item.image.map((url, index) => ({
                    url: url,
                    fileName: `${item.titleKR || item.titleEN || 'image'}_${index + 1}`
                }));
            }
            
            // 갤러리 형식으로 변환
            return {
                id: item.id,
                title: item.titleKR || item.titleEN || '', // 한글 제목 우선
                title_eng: item.titleEN || item.titleKR || '', // 영문 제목
                titleEng: item.titleEN || item.titleKR || '', // 영문 제목 (호환성)
                date: this.formatDate(item.date),
                image: images.length > 0 ? images[0].url : '', // 첫 번째 이미지 (하위 호환성)
                images: images, // 전체 이미지 배열
                state: item.state || 'off',
                originalData: item // 원본 데이터 보존
            };
        }).filter(item => item.state === 'on'); // 활성화된 항목만 표시
    }
    
    // 날짜 포맷팅
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return dateString;
        }
    }
    
    // 페이지네이션 계산
    calculatePagination() {
        const data = this.getActiveData();
        this.totalPages = Math.ceil(data.length / this.itemsPerPage);
        this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
    }

    // 현재 적용 데이터 반환 (검색 적용시 검색 결과)
    getActiveData() {
        return this.filteredData || this.galleryData;
    }
    
    // 갤러리 설명 업데이트 (전체 건수만 표시)
    updateGalleryDescription() {
        const descriptionElement = this.container.closest('.content-block').querySelector('.gallery-description');
        if (!descriptionElement) return;
        
        const totalCount = this.galleryData.length;
        
        // 한영 전환 지원
        const koreanText = `총 ${totalCount}건`;
        const englishText = `Total: ${totalCount} items`;
        
        // descriptionElement.textContent = koreanText;
        descriptionElement.setAttribute('data-kor', koreanText);
        descriptionElement.setAttribute('data-eng', englishText);
        
        // 갤러리 카운트 클래스 추가
        descriptionElement.classList.add('with-count');
        
        // 한영 전환 이벤트 리스너 추가
        this.setupLanguageToggle(descriptionElement);
    }
    
    // 한영 전환 기능 설정 (로컬스토리지 기반)
    setupLanguageToggle(element) {
        // 기존 이벤트 리스너 제거 (중복 방지)
        element.removeEventListener('languageChanged', this.handleLanguageChange);
        
        const updateLanguage = () => {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'kr';
            const isEnglish = selectedLanguage === 'en';
            const korText = element.getAttribute('data-kor');
            const engText = element.getAttribute('data-eng');
            
            if (isEnglish && engText) {
                element.textContent = engText;
            } else if (korText) {
                element.textContent = korText;
            }
        };
        
        // 초기 언어 설정 적용
        updateLanguage();
        
        // 새 이벤트 리스너 추가
        this.handleLanguageChange = () => {
            updateLanguage();
        };
        
        element.addEventListener('languageChanged', this.handleLanguageChange);
        document.addEventListener('languageChanged', this.handleLanguageChange);
        
        // 로컬스토리지 변경 감지
        window.addEventListener('storage', (e) => {
            if (e.key === 'selectedLanguage') {
                updateLanguage();
            }
        });
    }
    
    // 현재 페이지 렌더링
    renderCurrentPage() {
        const data = this.getActiveData();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.currentItems = data.slice(startIndex, endIndex);

        if (this.currentItems.length === 0) {
            this.showEmptyState();
            return;
        }

        const galleryGrid = document.createElement('div');
        galleryGrid.className = 'gallery-grid';

        this.currentItems.forEach((item, index) => {
            const galleryItem = this.createGalleryItem(item, startIndex + index);
            galleryGrid.appendChild(galleryItem);
        });

        this.galleryContent.innerHTML = '';
        this.galleryContent.appendChild(galleryGrid);
        
        // 🚀 현재 페이지의 썸네일들 미리 로드 (백그라운드)
        this.preloadCurrentPageThumbnails();

        // 페이지네이션 표시
        if (this.totalPages > 1) {
            this.pagination.style.display = 'flex';
        } else {
            this.pagination.style.display = 'none';
        }

        // 갤러리 아이템들에 한영 전환 이벤트 리스너 추가
        this.setupGalleryItemsLanguageToggle();
    }
    
    // 갤러리 아이템들의 한영 전환 설정 (로컬스토리지 기반)
    setupGalleryItemsLanguageToggle() {
        const galleryItems = this.galleryContent.querySelectorAll('.gallery-item-title');
        
        const updateItemsLanguage = () => {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'kr';
            const isEnglish = selectedLanguage === 'en';
            
            galleryItems.forEach(titleElement => {
                const korText = titleElement.getAttribute('data-kor');
                const engText = titleElement.getAttribute('data-eng');
                
                if (isEnglish && engText) {
                    titleElement.textContent = engText;
                } else if (korText) {
                    titleElement.textContent = korText;
                }
            });
        };
        
        // 초기 언어 설정 적용
        updateItemsLanguage();
        
        const handleItemLanguageChange = () => {
            updateItemsLanguage();
        };
        
        // 언어 전환 이벤트 리스너 추가
        document.addEventListener('languageChanged', handleItemLanguageChange);
        
        // 로컬스토리지 변경 감지
        window.addEventListener('storage', (e) => {
            if (e.key === 'selectedLanguage') {
                updateItemsLanguage();
            }
        });
        
        // 갤러리가 새로 렌더링될 때마다 기존 리스너 제거하고 새로 추가하기 위해 저장
        this.galleryItemsLanguageHandler = handleItemLanguageChange;
    }
    
    // 갤러리 아이템 생성
    createGalleryItem(item, globalIndex) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.dataset.index = globalIndex;
        
        // 썸네일: 첫 번째 이미지 자동 사용
        const thumbnail = item.images ? item.images[0].url : item.image;
        const isMultipleImages = item.images && item.images.length > 1;
        
        // 제목과 날짜 (한영 전환 지원)
        const title = item.title || '';
        const titleEng = item.title_eng || item.titleEng || title;
        const date = item.date || '';
        
        galleryItem.innerHTML = `
        <img src="${thumbnail}" alt="${title}" loading="lazy">
        <div class="gallery-item-overlay">
            <div class="gallery-item-title" data-kor="${title}" data-eng="${titleEng}">${title}</div>
        </div>
        `;
        
        return galleryItem;
    }
    
    // 페이지네이션 업데이트
    updatePagination() {
        // 이전/다음 버튼 상태
        this.prevBtn.disabled = this.currentPage <= 1;
        this.nextBtn.disabled = this.currentPage >= this.totalPages;
        
        // 페이지 번호 생성
        this.renderPageNumbers();
    }
    
    // 페이지 번호 렌더링
    renderPageNumbers() {
        this.pageNumbers.innerHTML = '';
        
        let startPage, endPage;
        const maxVisiblePages = 5;
        
        if (this.totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = this.totalPages;
        } else {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            startPage = Math.max(1, this.currentPage - halfVisible);
            endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === this.currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;
            this.pageNumbers.appendChild(pageBtn);
        }
    }
    
    // 페이지 이동
    goToPage(page) {
        page = parseInt(page);
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        
        this.currentPage = page;
        this.renderCurrentPage();
        this.updatePagination();
        
        // 스크롤을 갤러리 상단으로 이동
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // 팝업 열기
    openPopup(index) {
        const item = this.galleryData[index];
        if (!item) return;
        
        // 제목과 날짜 설정 (한영 전환 지원)
        this.updatePopupTexts(item);
        
        // 다중 이미지 또는 단일 이미지 처리
        if (item.images && item.images.length > 0) {
            this.currentItemImages = item.images;
            this.currentImageIndex = 0;
            this.setupMultipleImages();
            
            // 🚀 모든 이미지 프리로딩 (백그라운드에서)
            const imageUrls = item.images.map(img => img.url);
            this.preloadImages(imageUrls);
        } else {
            this.currentItemImages = [{
                url: item.image,
                fileName: item.title
            }];
            this.currentImageIndex = 0;
            this.setupSingleImage();
        }
        
        this.updatePopupImage();
        
        this.popupOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // ESC 키로 닫기 이벤트 추가
        document.addEventListener('keydown', this.handleEscKey.bind(this));
        // 키보드 네비게이션 이벤트 추가
        document.addEventListener('keydown', this.handleKeyNavigation.bind(this));
        
        // 팝업에서 한영 전환 이벤트 리스너 추가
        this.setupPopupLanguageToggle(item);
    }
    
    // 팝업 텍스트 업데이트 (한영 전환 지원)
    updatePopupTexts(item) {
        // 제목 설정
        const title = item.title || '';
        const titleEng = item.title_eng || item.titleEng || title;
        
        this.popupTitle.setAttribute('data-kor', title);
        this.popupTitle.setAttribute('data-eng', titleEng);
        this.popupTitle.textContent = title;
        
        // 날짜는 그대로 (날짜는 보통 언어 상관없이 동일)
        this.popupDate.textContent = item.date || '';
    }
    
    // 팝업에서 한영 전환 설정 (로컬스토리지 기반)
    setupPopupLanguageToggle(item) {
        const updatePopupLanguage = () => {
            const selectedLanguage = localStorage.getItem('selectedLanguage') || 'kr';
            const isEnglish = selectedLanguage === 'en';
            
            // 제목 변경
            const titleKor = this.popupTitle.getAttribute('data-kor');
            const titleEng = this.popupTitle.getAttribute('data-eng');
            
            if (isEnglish && titleEng) {
                this.popupTitle.textContent = titleEng;
            } else if (titleKor) {
                this.popupTitle.textContent = titleKor;
            }
        };
        
        // 초기 언어 설정 적용
        updatePopupLanguage();
        
        // 언어 변경 이벤트 리스너 추가
        const handlePopupLanguageChange = () => {
            updatePopupLanguage();
        };
        
        document.addEventListener('languageChanged', handlePopupLanguageChange);
        
        // 로컬스토리지 변경 감지 (다른 탭에서 언어 변경시)
        const handleStorageChange = (e) => {
            if (e.key === 'selectedLanguage') {
                updatePopupLanguage();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        // 팝업 닫을 때 이벤트 리스너 제거를 위해 저장
        this.popupLanguageHandler = handlePopupLanguageChange;
        this.popupStorageHandler = handleStorageChange;
    }
    
    // 다중 이미지 설정
    setupMultipleImages() {
        this.popupImageInfo.style.display = 'flex'; // flex로 표시
        this.totalImagesSpan.textContent = this.currentItemImages.length;
        this.updateImageNavigation();
    }
    
    // 단일 이미지 설정
    setupSingleImage() {
        this.popupImageInfo.style.display = 'none'; // 숨김
    }
    
    // 팝업 이미지 업데이트 (성능 개선)
    updatePopupImage() {
        const currentImage = this.currentItemImages[this.currentImageIndex];
        if (!currentImage) return;
        
        // 🚀 캐시된 이미지가 있으면 즉시 사용, 없으면 기본 로딩
        const cachedImage = this.imageCache.get(currentImage.url);
        if (cachedImage) {
            // 캐시된 이미지 즉시 표시
            this.popupImage.src = cachedImage.src;
            console.log('✅ 캐시된 이미지 사용:', currentImage.url);
        } else {
            // 캐시에 없으면 일반 로딩
            this.popupImage.src = currentImage.url;
            console.log('⏳ 이미지 로딩 중:', currentImage.url);
        }
        
        this.popupImage.alt = this.popupTitle.textContent;
        
        // 다운로드 버튼에 현재 이미지 정보 저장
        // this.downloadBtn.dataset.imageUrl = currentImage.url;
        // this.downloadBtn.dataset.fileName = currentImage.fileName;
        
        // 이미지 정보 업데이트
        if (this.currentItemImages.length > 1) {
            this.currentImageSpan.textContent = this.currentImageIndex + 1;
            this.updateImageNavigation();
        }
    }
    
    // 이미지 네비게이션 업데이트
    updateImageNavigation() {
        // 이전 버튼 상태
        this.prevImageBtn.disabled = this.currentImageIndex <= 0;
        if (this.prevImageBtn.disabled) {
            this.prevImageBtn.style.opacity = '0.5';
            this.prevImageBtn.style.cursor = 'not-allowed';
        } else {
            this.prevImageBtn.style.opacity = '1';
            this.prevImageBtn.style.cursor = 'pointer';
        }
        
        // 다음 버튼 상태
        this.nextImageBtn.disabled = this.currentImageIndex >= this.currentItemImages.length - 1;
        if (this.nextImageBtn.disabled) {
            this.nextImageBtn.style.opacity = '0.5';
            this.nextImageBtn.style.cursor = 'not-allowed';
        } else {
            this.nextImageBtn.style.opacity = '1';
            this.nextImageBtn.style.cursor = 'pointer';
        }
    }
    
    // 이전 이미지로 이동
    gotoPrevImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            this.updatePopupImage();
        }
    }
    
    // 다음 이미지로 이동
    gotoNextImage() {
        if (this.currentImageIndex < this.currentItemImages.length - 1) {
            this.currentImageIndex++;
            this.updatePopupImage();
        }
    }
    
    // 팝업 닫기
    closePopup() {
        this.popupOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // 이벤트 제거
        document.removeEventListener('keydown', this.handleEscKey.bind(this));
        document.removeEventListener('keydown', this.handleKeyNavigation.bind(this));
        
        // 팝업 언어 전환 이벤트 리스너 제거
        if (this.popupLanguageHandler) {
            document.removeEventListener('languageChanged', this.popupLanguageHandler);
            window.removeEventListener('storage', this.popupStorageHandler);
            this.popupLanguageHandler = null;
            this.popupStorageHandler = null;
        }
        
        // 슬라이더 상태 초기화
        this.currentImageIndex = 0;
        this.currentItemImages = [];
    }
    
    // ESC 키 처리
    handleEscKey(e) {
        if (e.key === 'Escape') {
            this.closePopup();
        }
    }
    
    // 키보드 네비게이션 처리
    handleKeyNavigation(e) {
        if (this.currentItemImages.length <= 1) return;
        
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.gotoPrevImage();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.gotoNextImage();
        }
    }
    
    // 이미지 다운로드
    downloadImage(imageUrl, fileName) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName || 'image';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // 빈 상태 표시
    showEmptyState() {
        this.galleryContent.innerHTML = `
            <div class="gallery-empty">
                <div>표시할 이미지가 없습니다.</div>
            </div>
        `;
        this.pagination.style.display = 'none';
    }
    
    // 에러 상태 표시
    showErrorState() {
        this.galleryContent.innerHTML = `
            <div class="gallery-error">
                <div>갤러리를 불러올 수 없습니다.<br>잠시 후 다시 시도해주세요.</div>
            </div>
        `;
        this.pagination.style.display = 'none';
    }
    
    // 검색 기능
    search(keyword) {
        this.searchKeyword = keyword.trim();
        if (!this.searchKeyword) {
            this.filteredData = this.galleryData;
            this.searchResetBtn.style.display = 'none';
        } else {
            const lower = this.searchKeyword.toLowerCase();
            this.filteredData = this.galleryData.filter(item =>
                (item.title && item.title.toLowerCase().includes(lower)) ||
                (item.title_eng && item.title_eng.toLowerCase().includes(lower)) ||
                (item.date && item.date.toLowerCase().includes(lower))
            );
            this.searchResetBtn.style.display = 'inline-block';
        }
        this.currentPage = 1;
        this.calculatePagination();
        this.renderCurrentPage();
        this.updatePagination();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 갤러리 아이템 클릭
        this.galleryContent.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('.gallery-item');
            if (galleryItem) {
                const index = parseInt(galleryItem.dataset.index);
                this.openPopup(index);
            }
        });
        
        // 페이지네이션 클릭
        this.pagination.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const page = e.target.dataset.page;
            
            if (action === 'prev') {
                this.goToPage(this.currentPage - 1);
            } else if (action === 'next') {
                this.goToPage(this.currentPage + 1);
            } else if (page) {
                this.goToPage(parseInt(page));
            }
        });
        
        // 팝업 제어 버튼들
        this.popupOverlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action === 'close') {
                this.closePopup();
            } else if (action === 'download') {
                const imageUrl = e.target.dataset.imageUrl;
                const fileName = e.target.dataset.fileName;
                this.downloadImage(imageUrl, fileName);
            // 전체 다운로드 관련 코드 제거
            // } else if (action === 'download-all') {
            //     this.downloadAllImages();
            } else if (action === 'prev-image') {
                this.gotoPrevImage();
            } else if (action === 'next-image') {
                this.gotoNextImage();
            } else if (e.target === this.popupOverlay) {
                // 배경 클릭으로 닫기
                this.closePopup();
            }
        });
        
        // 검색 이벤트
        if (this.searchBtn && this.searchInput) {
            this.searchBtn.addEventListener('click', () => {
                this.search(this.searchInput.value);
            });
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.search(this.searchInput.value);
                }
            });
        }
        if (this.searchResetBtn) {
            this.searchResetBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                this.search('');
            });
        }
    }
    
    // 갤러리 새로고침
    async refresh() {
        this.currentPage = 1;
        this.galleryContent.innerHTML = '<div class="gallery-loading">갤러리를 불러오는 중...</div>';
        this.pagination.style.display = 'none';
        
        // 기존 설명 텍스트 복원 (건수 제거)
        this.restoreOriginalDescription();
        
        await this.loadGalleryData();
    }
    
    // 원래 설명 텍스트 복원
    restoreOriginalDescription() {
        const descriptionElement = this.container.closest('.content-block').querySelector('.gallery-description');
        if (!descriptionElement || !descriptionElement.classList.contains('with-count')) return;
        
        // 빈 텍스트로 복원
        descriptionElement.textContent = '';
        descriptionElement.setAttribute('data-eng', '');
        descriptionElement.classList.remove('with-count');
    }
    
    // 외부에서 호출 가능한 메서드들
    getCurrentPage() {
        return this.currentPage;
    }
    
    getTotalPages() {
        return this.totalPages;
    }
    
    getGalleryData() {
        return this.galleryData;
    }
}

// ===== 갤러리 초기화 함수 =====
function initGallery(containerId, sheetType, itemsPerPage = 12) {
    return new GallerySystem(containerId, sheetType, itemsPerPage);
}

// ===== 전역 변수로 갤러리 인스턴스 저장 =====
window.galleryInstances = window.galleryInstances || {};

// ===== 전역 함수들 =====
window.initGallery = initGallery;
window.GallerySystem = GallerySystem;