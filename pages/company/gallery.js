// ===== 갤러리 초기화 스크립트 =====
// about.html의 하단에 추가할 스크립트

document.addEventListener('DOMContentLoaded', function() {
    // 갤러리 초기화를 위한 함수
    function initBusinessGalleries() {
        // 인허가 갤러리 초기화
        if (document.getElementById('license-gallery')) {
            window.galleryInstances.licenseGallery = initGallery(
                'license-gallery',
                './data/licenses.json',
                16 // 페이지당 16개 아이템
            );
        }
        
        // 유자격 갤러리 초기화
        if (document.getElementById('qualification-gallery')) {
            window.galleryInstances.qualificationGallery = initGallery(
                'qualification-gallery',
                './data/qualifications.json',
                16 // 페이지당 16개 아이템
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
        if (e.detail.tabId === 'business') {
            // business 탭으로 전환될 때 갤러리 새로고침
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
    constructor(containerId, jsonUrl, itemsPerPage = 16) {
        this.container = document.getElementById(containerId);
        this.jsonUrl = jsonUrl;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.totalPages = 1;
        this.galleryData = [];
        this.currentItems = [];
        
        this.init();
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
                    <div class="gallery-loading">갤러리를 불러오는 중...</div>
                </div>
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
                            <button class="popup-btn download-btn" data-action="download" title="다운로드">
                                ⬇
                            </button>
                            <button class="popup-btn download-all-btn" data-action="download-all" title="전체 다운로드" style="display: none;">
                                📦
                            </button>
                            <button class="popup-btn close-btn" data-action="close" title="닫기">
                                ✕
                            </button>
                        </div>
                    </div>
                    <div class="gallery-popup-image-container">
                        <button class="image-nav-btn prev-image-btn" data-action="prev-image" style="display: none;">
                            ◀
                        </button>
                        <div class="popup-image-wrapper">
                            <img class="gallery-popup-image" src="" alt="">
                        </div>
                        <button class="image-nav-btn next-image-btn" data-action="next-image" style="display: none;">
                            ▶
                        </button>
                    </div>
                    <div class="popup-image-info" style="display: none;">
                        <div class="image-counter">
                            <span class="current-image">1</span> / <span class="total-images">1</span>
                        </div>
                        <div class="image-description"></div>
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
        this.downloadAllBtn = this.container.querySelector('.download-all-btn');
        this.closeBtn = this.container.querySelector('.close-btn');
        
        // 이미지 슬라이더 관련 요소들
        this.prevImageBtn = this.container.querySelector('.prev-image-btn');
        this.nextImageBtn = this.container.querySelector('.next-image-btn');
        this.popupImageInfo = this.container.querySelector('.popup-image-info');
        this.currentImageSpan = this.container.querySelector('.current-image');
        this.totalImagesSpan = this.container.querySelector('.total-images');
        this.imageDescription = this.container.querySelector('.image-description');
        
        // 슬라이더 상태 초기화
        this.currentImageIndex = 0;
        this.currentItemImages = [];
    }
    
    // 갤러리 데이터 로드
    async loadGalleryData() {
        try {
            const response = await fetch(this.jsonUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.galleryData = await response.json();
            
            if (!Array.isArray(this.galleryData) || this.galleryData.length === 0) {
                this.showEmptyState();
                return;
            }
            
            this.calculatePagination();
            this.updateGalleryDescription();
            this.renderCurrentPage();
            this.updatePagination();
            
        } catch (error) {
            console.error('갤러리 데이터 로드 실패:', error);
            this.showErrorState();
        }
    }
    
    // 페이지네이션 계산
    calculatePagination() {
        this.totalPages = Math.ceil(this.galleryData.length / this.itemsPerPage);
        this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));
    }
    
    // 갤러리 설명 업데이트 (전체 건수만 표시)
    updateGalleryDescription() {
        const descriptionElement = this.container.closest('.content-block').querySelector('.gallery-description');
        if (!descriptionElement) return;
        
        const totalCount = this.galleryData.length;
        const isKorean = document.documentElement.lang === 'ko' || !document.documentElement.lang;
        
        // 건수만 표시
        if (isKorean) {
            descriptionElement.textContent = `총 ${totalCount}건`;
            descriptionElement.setAttribute('data-eng', `Total: ${totalCount} items`);
        } else {
            descriptionElement.textContent = `Total: ${totalCount} items`;
        }
        
        // 갤러리 카운트 클래스 추가
        descriptionElement.classList.add('with-count');
    }
    
    // 현재 페이지 렌더링
    renderCurrentPage() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.currentItems = this.galleryData.slice(startIndex, endIndex);
        
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
        
        // 페이지네이션 표시
        if (this.totalPages > 1) {
            this.pagination.style.display = 'flex';
        }
    }
    
    // 갤러리 아이템 생성
    createGalleryItem(item, globalIndex) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.dataset.index = globalIndex;
        
        // 단일 이미지 또는 다중 이미지 처리
        const thumbnail = item.thumbnail || (item.images ? item.images[0].url : item.image);
        const isMultipleImages = item.images && item.images.length > 1;
        
        galleryItem.innerHTML = `
            <img src="${thumbnail}" alt="${item.title}" loading="lazy">
            <div class="gallery-item-overlay">
                <div class="gallery-item-title">${item.title}</div>
                <div class="gallery-item-date">${item.date || ''}</div>
                ${isMultipleImages ? `<div class="gallery-item-count">${item.images.length}장</div>` : ''}
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
        
        this.popupTitle.textContent = item.title;
        this.popupDate.textContent = item.date || '';
        
        // 다중 이미지 또는 단일 이미지 처리
        if (item.images && item.images.length > 0) {
            this.currentItemImages = item.images;
            this.currentImageIndex = 0;
            this.setupMultipleImages();
        } else {
            this.currentItemImages = [{
                url: item.image,
                fileName: item.fileName || item.title,
                description: item.description || ''
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
    }
    
    // 다중 이미지 설정
    setupMultipleImages() {
        this.prevImageBtn.style.display = 'block';
        this.nextImageBtn.style.display = 'block';
        this.popupImageInfo.style.display = 'block';
        this.downloadAllBtn.style.display = 'block';
        
        this.totalImagesSpan.textContent = this.currentItemImages.length;
        this.updateImageNavigation();
    }
    
    // 단일 이미지 설정
    setupSingleImage() {
        this.prevImageBtn.style.display = 'none';
        this.nextImageBtn.style.display = 'none';
        this.popupImageInfo.style.display = 'none';
        this.downloadAllBtn.style.display = 'none';
    }
    
    // 팝업 이미지 업데이트
    updatePopupImage() {
        const currentImage = this.currentItemImages[this.currentImageIndex];
        if (!currentImage) return;
        
        this.popupImage.src = currentImage.url;
        this.popupImage.alt = currentImage.description || this.popupTitle.textContent;
        
        // 다운로드 버튼에 현재 이미지 정보 저장
        this.downloadBtn.dataset.imageUrl = currentImage.url;
        this.downloadBtn.dataset.fileName = currentImage.fileName;
        
        // 이미지 정보 업데이트
        if (this.currentItemImages.length > 1) {
            this.currentImageSpan.textContent = this.currentImageIndex + 1;
            this.imageDescription.textContent = currentImage.description || '';
            this.updateImageNavigation();
        }
    }
    
    // 이미지 네비게이션 업데이트
    updateImageNavigation() {
        this.prevImageBtn.disabled = this.currentImageIndex <= 0;
        this.nextImageBtn.disabled = this.currentImageIndex >= this.currentItemImages.length - 1;
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
    
    // 전체 이미지 다운로드 (ZIP)
    async downloadAllImages() {
        if (this.currentItemImages.length <= 1) return;
        
        try {
            this.downloadAllBtn.classList.add('downloading');
            this.downloadAllBtn.disabled = true;
            
            // 간단한 ZIP 다운로드 구현 (실제로는 서버 API 호출 필요)
            const urls = this.currentItemImages.map(img => img.url);
            const title = this.popupTitle.textContent;
            
            // 각 이미지를 개별적으로 다운로드하는 방식
            for (let i = 0; i < this.currentItemImages.length; i++) {
                const image = this.currentItemImages[i];
                setTimeout(() => {
                    this.downloadImage(image.url, image.fileName);
                }, i * 500); // 500ms 간격으로 다운로드
            }
            
        } catch (error) {
            console.error('전체 다운로드 실패:', error);
            alert('전체 다운로드에 실패했습니다.');
        } finally {
            setTimeout(() => {
                this.downloadAllBtn.classList.remove('downloading');
                this.downloadAllBtn.disabled = false;
            }, 2000);
        }
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
            } else if (action === 'download-all') {
                this.downloadAllImages();
            } else if (action === 'prev-image') {
                this.gotoPrevImage();
            } else if (action === 'next-image') {
                this.gotoNextImage();
            } else if (e.target === this.popupOverlay) {
                // 배경 클릭으로 닫기
                this.closePopup();
            }
        });
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
function initGallery(containerId, jsonUrl, itemsPerPage = 16) {
    return new GallerySystem(containerId, jsonUrl, itemsPerPage);
}

// ===== 전역 변수로 갤러리 인스턴스 저장 =====
window.galleryInstances = window.galleryInstances || {};

// ===== 전역 함수들 =====
window.initGallery = initGallery;
window.GallerySystem = GallerySystem;