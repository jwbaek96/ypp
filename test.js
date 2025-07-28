// 구글 스프레드시트 데이터를 가져올 URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzEh0T2uNb5mnxnxvElSlKhg0oXJ7o7b_Ox2Tnv1fEqxad8eHRLQACQWBMPy2agA56V/exec';

/**
 * 구글 스프레드시트에서 데이터를 가져오는 공통 함수
 * JSONP 방식을 사용해서 외부 API 호출
 */
function fetchGoogleSheetData(sheetType = 'about') {
    return new Promise((resolve, reject) => {
        console.log(`📡 ${sheetType} 데이터 요청 시작...`);
        
        // 고유한 콜백 함수 이름 생성 (현재 시간 기준)
        const callbackName = `jsonp_callback_${sheetType}_` + Date.now();
        console.log(`🔧 콜백 함수명: ${callbackName}`);
        
        // 타임아웃 설정 (30초)
        const timeoutId = setTimeout(() => {
            console.error(`⏰ ${sheetType} 요청 타임아웃 (30초)`);
            if (window[callbackName]) {
                delete window[callbackName];
            }
            reject(new Error(`${sheetType} 데이터 요청 타임아웃`));
        }, 30000);
        
        // 전역 윈도우 객체에 콜백 함수 등록
        window[callbackName] = function(data) {
            console.log(`✅ ${sheetType} 데이터 응답 받음:`, data);
            clearTimeout(timeoutId); // 타임아웃 해제
            
            if (data.error) {
                console.error(`❌ ${sheetType} 응답 에러:`, data.message);
                reject(new Error(data.message)); // 에러가 있으면 거부
            } else {
                console.log(`📦 ${sheetType} 데이터 개수: ${Array.isArray(data) ? data.length : '알 수 없음'}`);
                resolve(data); // 성공하면 데이터 반환
            }
            delete window[callbackName]; // 사용 후 콜백 함수 삭제
        };
        
        // URL 구성 (시트 타입에 따라)
        const url = sheetType === 'media-news' 
            ? `${GOOGLE_SHEET_URL}?sheet=media-news&callback=${callbackName}`
            : `${GOOGLE_SHEET_URL}?callback=${callbackName}`;
        
        console.log(`🔗 요청 URL: ${url}`);
        
        // 동적으로 script 태그 생성해서 데이터 요청
        const script = document.createElement('script');
        script.src = url;
        script.onerror = () => {
            console.error(`❌ ${sheetType} 네트워크 오류 - 스크립트 로드 실패`);
            clearTimeout(timeoutId);
            if (window[callbackName]) {
                delete window[callbackName];
            }
            reject(new Error(`${sheetType} 네트워크 오류`));
        }; // 네트워크 에러 처리
        
        script.onload = () => {
            console.log(`📝 ${sheetType} 스크립트 로드 완료`);
            // 스크립트는 콜백이 호출된 후에 제거됨
            setTimeout(() => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            }, 1000);
        };
        
        document.head.appendChild(script); // 헤드에 스크립트 추가
        console.log(`🚀 ${sheetType} 스크립트 태그 추가 완료`);
    });
}

/**
 * 미디어-뉴스 데이터를 가져오는 함수 (편의 함수)
 */
function fetchMediaNewsData() {
    return fetchGoogleSheetData('media-news');
}

// 전체 갤러리 데이터를 저장할 배열
let galleryData = [];
// 미디어-뉴스 데이터를 저장할 배열
let mediaNewsData = [];
// 현재 모달에서 보고 있는 이미지의 인덱스
let currentImageIndex = 0;
// 현재 모달에서 보여줄 이미지들의 배열
let currentImages = [];
// 페이지네이션 관련 변수들
let currentQualificationPage = 1;
let currentLicensePage = 1;
let currentMediaNewsPage = 1;
const itemsPerPage = 12;

/**
 * 페이지 초기화 함수 - 페이지 로드 시 실행
 */
async function init() {
    console.log('🚀 초기화 시작...');
    
    // 로딩 메시지 표시
    const qualificationGallery = document.getElementById('qualification-gallery');
    const licenseGallery = document.getElementById('license-gallery');
    const mediaNewsContainer = document.getElementById('media-news-container');
    
    if (qualificationGallery) {
        qualificationGallery.innerText = '데이터를 불러오는 중...';
        console.log('✅ Qualification gallery element found');
    } else {
        console.log('❌ Qualification gallery element not found');
    }
    
    if (licenseGallery) {
        licenseGallery.innerText = '데이터를 불러오는 중...';
        console.log('✅ License gallery element found');
    } else {
        console.log('❌ License gallery element not found');
    }
    
    if (mediaNewsContainer) {
        mediaNewsContainer.innerHTML = '<p>뉴스 데이터를 불러오는 중...</p>';
        console.log('✅ Media news container element found');
    } else {
        console.log('❌ Media news container element not found');
    }
    
    try {
        console.log('📡 데이터 요청 시작...');
        
        // About 데이터와 Media-News 데이터를 병렬로 가져오기
        const [aboutData, newsData] = await Promise.allSettled([
            fetchGoogleSheetData('about'),
            fetchMediaNewsData()
        ]);

        console.log('📊 데이터 요청 결과:', {
            aboutStatus: aboutData.status,
            newsStatus: newsData.status
        });

        // About 데이터 처리
        if (aboutData.status === 'fulfilled') {
            console.log('✅ About 데이터 로드 성공:', aboutData.value);
            
            // statu가 on인 항목들만 필터링 (게시 승인된 항목만)
            galleryData = aboutData.value.filter(item => {
                if (!item.statu) return false;
                const val = String(item.statu).toLowerCase();
                return val === 'on' || val === '1' || val === 'yes';
            });
            
            console.log(`🔍 필터링된 About 데이터: ${galleryData.length}개`);
            
            // 카테고리별로 데이터 분리
            const qualificationData = galleryData.filter(item => item.category === '유자격');
            const licenseData = galleryData.filter(item => item.category === '인허가');
            
            console.log(`📋 유자격: ${qualificationData.length}개, 인허가: ${licenseData.length}개`);
            
            // 각 갤러리에 데이터 렌더링
            if (qualificationGallery) {
                if (qualificationData.length === 0) {
                    qualificationGallery.innerText = '유자격 데이터가 없습니다.';
                } else {
                    renderGalleryWithPagination(qualificationData, 'qualification-gallery');
                    console.log('✅ 유자격 갤러리 렌더링 완료');
                }
            }
            
            if (licenseGallery) {
                if (licenseData.length === 0) {
                    licenseGallery.innerText = '인허가 데이터가 없습니다.';
                } else {
                    renderGalleryWithPagination(licenseData, 'license-gallery');
                    console.log('✅ 인허가 갤러리 렌더링 완료');
                }
            }
        } else {
            // About 데이터 로드 실패
            console.error('❌ About 데이터 로드 실패:', aboutData.reason);
            if (qualificationGallery) qualificationGallery.innerText = '유자격 데이터를 불러올 수 없습니다.';
            if (licenseGallery) licenseGallery.innerText = '인허가 데이터를 불러올 수 없습니다.';
        }

        // Media-News 데이터 처리
        if (newsData.status === 'fulfilled') {
            console.log('✅ Media-News 데이터 로드 성공:', newsData.value);
            mediaNewsData = newsData.value; // 이미 필터링된 데이터가 옴 (statu가 'on'인 것만)
            
            console.log(`📰 미디어 뉴스 데이터: ${mediaNewsData.length}개`);
            
            if (mediaNewsContainer) {
                if (mediaNewsData.length === 0) {
                    mediaNewsContainer.innerHTML = '<p>뉴스 데이터가 없습니다.</p>';
                } else {
                    renderMediaNewsWithPagination(mediaNewsData, 'media-news-container');
                    console.log('✅ 미디어 뉴스 렌더링 완료');
                }
            }
        } else {
            // Media-News 데이터 로드 실패
            console.error('❌ 미디어 뉴스 데이터 로드 실패:', newsData.reason);
            if (mediaNewsContainer) mediaNewsContainer.innerHTML = '<p>뉴스 데이터를 불러올 수 없습니다.</p>';
        }
        
        console.log('🎉 초기화 완료!');
        
    } catch (e) {
        // 전체 에러 처리
        console.error('💥 전체 초기화 에러:', e);
        if (qualificationGallery) qualificationGallery.innerText = '데이터를 불러올 수 없습니다.';
        if (licenseGallery) licenseGallery.innerText = '데이터를 불러올 수 없습니다.';
        if (mediaNewsContainer) mediaNewsContainer.innerHTML = '<p>데이터를 불러올 수 없습니다.</p>';
    }
}

/**
 * 구글 드라이브 공유 링크를 썸네일 URL로 변환하는 함수
 */
function convertGoogleDriveUrl(url) {
    if (!url) return '';
    
    // 구글 드라이브 공유 링크 패턴 확인
    const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
        const fileId = match[1];
        // 썸네일 URL로 변환 (w1000 크기)
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
    
    // 이미 변환된 형태이거나 다른 URL인 경우 그대로 반환
    return url;
}

/**
 * 페이지네이션을 포함한 갤러리 렌더링 함수
 */
function renderGalleryWithPagination(data, targetId) {
    const grid = document.getElementById(targetId);
    if (!grid) return;
    
    // 페이지네이션 HTML 구조 생성
    if (!grid.querySelector('.gallery-content')) {
        grid.innerHTML = `
            <div class="gallery-content"></div>
            <div class="gallery-pagination" style="display: none;">
                <button class="pagination-btn prev-btn" data-action="prev">
                    <span>이전</span>
                </button>
                <div class="page-numbers"></div>
                <button class="pagination-btn next-btn" data-action="next">
                    <span>다음</span>
                </button>
            </div>
        `;
        
        // 페이지네이션 이벤트 리스너 설정
        setupPaginationEvents(targetId);
    }
    
    // 현재 페이지에 해당하는 데이터 계산
    const currentPage = targetId === 'qualification-gallery' ? currentQualificationPage : currentLicensePage;
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = data.slice(startIndex, endIndex);
    
    // 갤러리 아이템 렌더링
    const galleryContent = grid.querySelector('.gallery-content');
    galleryContent.innerHTML = '';
    
    currentItems.forEach(item => {
        const div = document.createElement('div');
        const images = item.images || [];
        
        // 첫 번째 이미지를 대표 이미지로 사용하고 URL 변환
        const mainImageUrl = convertGoogleDriveUrl(images[0] || '');
        
        div.innerHTML = `
            <img src="${mainImageUrl}" 
                 alt="${item.titleKR||''}" 
                 loading="lazy" 
                 style="width:200px; height:150px; object-fit:cover; cursor:pointer;" 
                 onclick="openModal('${item.id}')"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+PC9zdmc+'">
            <div class="gallery-item-overlay">
                <div class="gallery-item-title" data-kor="${item.titleKR}" data-eng="${item.titleEN}">${item.titleKR}</div>
            </div>
        `;
        
        galleryContent.appendChild(div);
    });
    
    // 페이지네이션 업데이트
    updatePagination(targetId, currentPage, totalPages, data.length);
}

/**
 * 페이지네이션 업데이트 함수
 */
function updatePagination(targetId, currentPage, totalPages, totalItems) {
    const grid = document.getElementById(targetId);
    const pagination = grid.querySelector('.gallery-pagination');
    const prevBtn = pagination.querySelector('.prev-btn');
    const nextBtn = pagination.querySelector('.next-btn');
    const pageNumbers = pagination.querySelector('.page-numbers');
    
    // 페이지가 1개보다 많을 때만 페이지네이션 표시
    if (totalPages > 1) {
        pagination.style.display = 'flex';
        
        // 이전/다음 버튼 상태
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        
        // 페이지 번호 생성
        pageNumbers.innerHTML = '';
        const maxVisiblePages = 5;
        let startPage, endPage;
        
        if (totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            startPage = Math.max(1, currentPage - halfVisible);
            endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;
            pageBtn.dataset.target = targetId;
            pageNumbers.appendChild(pageBtn);
        }
    } else {
        pagination.style.display = 'none';
    }
}

/**
 * 페이지네이션 이벤트 설정
 */
function setupPaginationEvents(targetId) {
    const grid = document.getElementById(targetId);
    const pagination = grid.querySelector('.gallery-pagination');
    
    pagination.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const page = e.target.dataset.page;
        const target = e.target.dataset.target || targetId;
        
        if (action === 'prev') {
            goToPage(target, getCurrentPage(target) - 1);
        } else if (action === 'next') {
            goToPage(target, getCurrentPage(target) + 1);
        } else if (page) {
            goToPage(target, parseInt(page));
        }
    });
}

/**
 * 현재 페이지 가져오기
 */
function getCurrentPage(targetId) {
    if (targetId === 'qualification-gallery') {
        return currentQualificationPage;
    } else if (targetId === 'license-gallery') {
        return currentLicensePage;
    } else if (targetId === 'media-news-container') {
        return currentMediaNewsPage;
    }
    return 1;
}

/**
 * 페이지 이동 함수
 */
function goToPage(targetId, page) {
    const data = targetId === 'qualification-gallery' 
        ? galleryData.filter(item => item.category === '유자격')
        : galleryData.filter(item => item.category === '인허가');
    
    const totalPages = Math.ceil(data.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    // 현재 페이지 업데이트
    if (targetId === 'qualification-gallery') {
        currentQualificationPage = page;
    } else {
        currentLicensePage = page;
    }
    
    // 갤러리 다시 렌더링
    renderGalleryWithPagination(data, targetId);
    
    // 스크롤을 갤러리 상단으로 이동
    document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 이미지 모달을 여는 함수 (이미지 클릭 시 호출)
 */
window.openModal = function(itemId) {
    // 클릭한 항목의 데이터 찾기
    const item = galleryData.find(data => data.id === itemId);
    if (!item) return;
    
    // 해당 항목의 이미지들을 현재 이미지 배열에 설정하고 URL 변환
    currentImages = (item.images || []).map(url => convertGoogleDriveUrl(url));
    currentImageIndex = 0; // 첫 번째 이미지부터 시작
    
    if (currentImages.length === 0) return;
    
    // 모달에 첫 번째 이미지 표시
    const modalImage = document.getElementById('modalImage');
    const downloadBtn = document.getElementById('downloadBtn');
    
    if (modalImage) {
        modalImage.src = currentImages[currentImageIndex];
        document.getElementById('imageModal').style.display = 'flex';
    }
    
    // 다운로드 버튼에 파일 링크 설정
    if (downloadBtn && item.file) {
        downloadBtn.onclick = function() {
            window.open(item.file, '_blank');
        };
        downloadBtn.style.display = 'block';
    } else if (downloadBtn) {
        downloadBtn.style.display = 'none';
    }
};

/**
 * 모달 닫기 함수
 */
function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

/**
 * 이전 이미지로 이동
 */
function prevImage() {
    if (currentImages.length > 1) {
        // 현재 인덱스에서 1 빼고, 0보다 작으면 마지막 이미지로
        currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
        document.getElementById('modalImage').src = currentImages[currentImageIndex];
    }
}

/**
 * 다음 이미지로 이동
 */
function nextImage() {
    if (currentImages.length > 1) {
        // 현재 인덱스에서 1 더하고, 마지막을 넘으면 첫 번째 이미지로
        currentImageIndex = (currentImageIndex + 1) % currentImages.length;
        document.getElementById('modalImage').src = currentImages[currentImageIndex];
    }
}

/**
 * 미디어-뉴스 페이지네이션을 포함한 렌더링 함수
 */
function renderMediaNewsWithPagination(data, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    
    // 페이지네이션 HTML 구조 생성
    if (!container.querySelector('.news-content')) {
        container.innerHTML = `
            <div class="news-content"></div>
            <div class="news-pagination" style="display: none;">
                <button class="pagination-btn prev-btn" data-action="prev">
                    <span>이전</span>
                </button>
                <div class="page-numbers"></div>
                <button class="pagination-btn next-btn" data-action="next">
                    <span>다음</span>
                </button>
            </div>
        `;
        
        // 페이지네이션 이벤트 리스너 설정
        setupMediaNewsPaginationEvents(targetId);
    }
    
    // 현재 페이지에 해당하는 데이터 계산
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentMediaNewsPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = data.slice(startIndex, endIndex);
    
    // 뉴스 아이템 렌더링
    const newsContent = container.querySelector('.news-content');
    newsContent.innerHTML = '';
    
    currentItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'news-item';
        
        // 날짜 포맷팅
        const formattedDate = formatDate(item.uploadDate);
        
        div.innerHTML = `
            <div class="news-header">
                <span class="news-date">${formattedDate}</span>
                <span class="news-number">No. ${item.no}</span>
            </div>
            <h3 class="news-title" data-kor="${item.titleKR}" data-eng="${item.titleEN}">${item.titleKR}</h3>
            <div class="news-actions">
                ${item.docKR ? `<button onclick="openDocument('${item.docKR}')" class="doc-btn kr-doc">한국어 문서</button>` : ''}
                ${item.docEN ? `<button onclick="openDocument('${item.docEN}')" class="doc-btn en-doc">English Doc</button>` : ''}
                ${item.link ? `<button onclick="openOriginalLink('${item.link}')" class="link-btn">원본 기사</button>` : ''}
            </div>
        `;
        
        newsContent.appendChild(div);
    });
    
    // 페이지네이션 업데이트
    updateMediaNewsPagination(targetId, currentMediaNewsPage, totalPages, data.length);
}

/**
 * 미디어-뉴스 페이지네이션 업데이트 함수
 */
function updateMediaNewsPagination(targetId, currentPage, totalPages, totalItems) {
    const container = document.getElementById(targetId);
    const pagination = container.querySelector('.news-pagination');
    const prevBtn = pagination.querySelector('.prev-btn');
    const nextBtn = pagination.querySelector('.next-btn');
    const pageNumbers = pagination.querySelector('.page-numbers');
    
    // 페이지가 1개보다 많을 때만 페이지네이션 표시
    if (totalPages > 1) {
        pagination.style.display = 'flex';
        
        // 이전/다음 버튼 상태
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;
        
        // 페이지 번호 생성
        pageNumbers.innerHTML = '';
        const maxVisiblePages = 5;
        let startPage, endPage;
        
        if (totalPages <= maxVisiblePages) {
            startPage = 1;
            endPage = totalPages;
        } else {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            startPage = Math.max(1, currentPage - halfVisible);
            endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.dataset.page = i;
            pageBtn.dataset.target = targetId;
            pageNumbers.appendChild(pageBtn);
        }
    } else {
        pagination.style.display = 'none';
    }
}

/**
 * 미디어-뉴스 페이지네이션 이벤트 설정
 */
function setupMediaNewsPaginationEvents(targetId) {
    const container = document.getElementById(targetId);
    const pagination = container.querySelector('.news-pagination');
    
    pagination.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const page = e.target.dataset.page;
        
        if (action === 'prev') {
            goToMediaNewsPage(currentMediaNewsPage - 1);
        } else if (action === 'next') {
            goToMediaNewsPage(currentMediaNewsPage + 1);
        } else if (page) {
            goToMediaNewsPage(parseInt(page));
        }
    });
}

/**
 * 미디어-뉴스 페이지 이동 함수
 */
function goToMediaNewsPage(page) {
    const totalPages = Math.ceil(mediaNewsData.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    // 현재 페이지 업데이트
    currentMediaNewsPage = page;
    
    // 뉴스 목록 다시 렌더링
    renderMediaNewsWithPagination(mediaNewsData, 'media-news-container');
    
    // 스크롤을 컨테이너 상단으로 이동
    document.getElementById('media-news-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Google Docs 문서 열기 함수
 */
window.openDocument = function(docIdOrUrl) {
    if (!docIdOrUrl) return;
    
    let docUrl = docIdOrUrl;
    
    // 만약 ID만 있다면 전체 URL 생성
    if (!docIdOrUrl.includes('docs.google.com')) {
        docUrl = `https://docs.google.com/document/d/${docIdOrUrl}/edit?usp=sharing`;
    }
    
    window.open(docUrl, '_blank');
};

/**
 * 원본 기사 링크 열기 함수
 */
window.openOriginalLink = function(url) {
    if (!url) return;
    window.open(url, '_blank');
};

/**
 * 날짜 포맷팅 함수 (YYYY-MM-DD -> YYYY년 MM월 DD일)
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        return `${year}년 ${month.toString().padStart(2, '0')}월 ${day.toString().padStart(2, '0')}일`;
    } catch (e) {
        return dateString; // 포맷팅 실패 시 원본 반환
    }
}

// 이벤트 리스너 등록 (요소 존재 확인)
document.addEventListener('DOMContentLoaded', function() {
    const closeModalBtn = document.getElementById('closeModal');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const imageModal = document.getElementById('imageModal');
    
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    if (prevBtn) prevBtn.onclick = prevImage;
    if (nextBtn) nextBtn.onclick = nextImage;
    
    // 다운로드 버튼은 openModal에서 동적으로 설정되므로 여기서는 스타일만 설정
    if (downloadBtn) {
        downloadBtn.style.display = 'none'; // 초기에는 숨김
    }
    
    // 모달 배경 클릭 시 닫기
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    
    // 페이지 로드 시 초기화 함수 실행
    init();
});

/**
 * 기존 갤러리 그리드에 데이터를 렌더링하는 함수 (백업용)
 */
function renderGallery(data, targetId) {
    const grid = document.getElementById(targetId);
    if (!grid) return;
    
    grid.innerHTML = ''; // 기존 내용 초기화
    
    // 각 데이터 항목을 갤러리 카드로 생성
    data.forEach(item => {
        const div = document.createElement('div');
        const images = item.images || [];
        
        // 첫 번째 이미지를 대표 이미지로 사용하고 URL 변환
        const mainImageUrl = convertGoogleDriveUrl(images[0] || '');
        
        // 갤러리 카드 HTML 생성 (onclick 속성 위치 수정)
        div.innerHTML = `
            <img src="${mainImageUrl}" 
                 alt="${item.titleKR||''}" 
                 loading="lazy" 
                 style="width:200px; height:150px; object-fit:cover; cursor:pointer;" 
                 onclick="openModal('${item.id}')"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngCDsl4bsnYw8L3RleHQ+PC9zdmc+'">
            <div class="gallery-item-overlay">
                <div class="gallery-item-title" data-kor="${item.titleKR}" data-eng="${item.titleEN}">${item.titleKR}</div>
            </div>
        `;
        
        grid.appendChild(div);
    });
}

/**
 * 디버깅 헬퍼 함수들
 */
window.debugFunctions = {
    // 현재 로드된 데이터 확인
    showData: function() {
        console.log('Gallery Data:', galleryData);
        console.log('Media News Data:', mediaNewsData);
        console.log('Current Pages:', {
            qualification: currentQualificationPage,
            license: currentLicensePage,
            mediaNews: currentMediaNewsPage
        });
    },
    
    // 데이터 다시 로드
    reloadData: async function() {
        console.log('데이터 다시 로드 중...');
        await init();
        console.log('데이터 로드 완료');
    },
    
    // 특정 아이템 찾기
    findItem: function(id) {
        const item = galleryData.find(item => item.id === id);
        console.log('Found item:', item);
        return item;
    },
    
    // 미디어 뉴스 아이템 찾기
    findNewsItem: function(id) {
        const item = mediaNewsData.find(item => item.id === id);
        console.log('Found news item:', item);
        return item;
    },
    
    // URL 테스트
    testUrls: function() {
        console.log('Testing URLs...');
        console.log('About URL:', GOOGLE_SHEET_URL);
        console.log('Media News URL:', GOOGLE_SHEET_URL + '?sheet=media-news');
        
        // URL을 직접 브라우저에서 열어보기
        console.log('브라우저에서 URL 테스트:');
        console.log('About:', `${GOOGLE_SHEET_URL}?callback=test`);
        console.log('Media News:', `${GOOGLE_SHEET_URL}?sheet=media-news&callback=test`);
    },
    
    // 수동으로 단일 요청 테스트
    testSingleRequest: async function(sheetType = 'about') {
        console.log(`🧪 ${sheetType} 단일 요청 테스트...`);
        try {
            const data = await fetchGoogleSheetData(sheetType);
            console.log(`✅ ${sheetType} 테스트 성공:`, data);
            return data;
        } catch (error) {
            console.error(`❌ ${sheetType} 테스트 실패:`, error);
            return null;
        }
    },
    
    // 브라우저에서 직접 URL 열기
    openUrlInBrowser: function(sheetType = 'about') {
        const url = sheetType === 'media-news' 
            ? `${GOOGLE_SHEET_URL}?sheet=media-news&callback=console.log`
            : `${GOOGLE_SHEET_URL}?callback=console.log`;
        
        console.log(`브라우저에서 열기: ${url}`);
        window.open(url, '_blank');
    },
    
    // CORS 문제 확인
    checkCORS: function() {
        console.log('CORS 문제 확인 중...');
        fetch(GOOGLE_SHEET_URL)
            .then(response => {
                console.log('✅ Fetch 성공 - CORS 문제 없음');
                return response.text();
            })
            .then(data => {
                console.log('응답 데이터:', data);
            })
            .catch(error => {
                console.error('❌ CORS 문제 또는 네트워크 오류:', error);
                console.log('💡 JSONP 방식을 사용해야 합니다.');
            });
    },
    
    // 페이지네이션 상태 확인
    checkPagination: function() {
        const qualGallery = document.getElementById('qualification-gallery');
        const licenseGallery = document.getElementById('license-gallery');
        const mediaContainer = document.getElementById('media-news-container');
        
        console.log('Pagination Elements:');
        console.log('Qualification:', qualGallery?.querySelector('.gallery-pagination'));
        console.log('License:', licenseGallery?.querySelector('.gallery-pagination'));
        console.log('Media News:', mediaContainer?.querySelector('.news-pagination'));
    },
    
    // 전역 콜백 함수들 확인
    checkCallbacks: function() {
        const callbacks = Object.keys(window).filter(key => key.startsWith('jsonp_callback_'));
        console.log('현재 등록된 JSONP 콜백들:', callbacks);
        return callbacks;
    },
    
    // 수동 JSONP 테스트
    manualJsonpTest: function() {
        console.log('🧪 수동 JSONP 테스트 시작...');
        
        // 테스트용 전역 콜백 함수
        window.manualTestCallback = function(data) {
            console.log('✅ 수동 테스트 성공! 받은 데이터:', data);
            console.log('📊 데이터 타입:', typeof data);
            console.log('📋 데이터 길이:', Array.isArray(data) ? data.length : 'Not an array');
            
            if (Array.isArray(data) && data.length > 0) {
                console.log('📝 첫 번째 아이템:', data[0]);
            }
        };
        
        // 스크립트 태그로 요청
        const script = document.createElement('script');
        script.src = GOOGLE_SHEET_URL + '?callback=manualTestCallback';
        script.onerror = () => console.error('❌ 수동 테스트 실패');
        document.head.appendChild(script);
        
        console.log('🚀 수동 테스트 요청 전송:', script.src);
    }
};

// 디버깅 메시지
console.log('🔧 Debug functions available: window.debugFunctions');
console.log('📋 Usage examples:');
console.log('- debugFunctions.showData() : 현재 데이터 확인');
console.log('- debugFunctions.reloadData() : 데이터 다시 로드');
console.log('- debugFunctions.testUrls() : URL 확인');
console.log('- debugFunctions.testSingleRequest("about") : About 데이터만 테스트');
console.log('- debugFunctions.testSingleRequest("media-news") : 미디어 뉴스만 테스트');
console.log('- debugFunctions.openUrlInBrowser("about") : 브라우저에서 URL 직접 열기');
console.log('- debugFunctions.checkCORS() : CORS 문제 확인');
console.log('- debugFunctions.checkCallbacks() : 등록된 콜백 함수 확인');
console.log('- debugFunctions.checkPagination() : 페이지네이션 상태 확인');
console.log('🚨 문제 발생 시 먼저 debugFunctions.testUrls() 실행해보세요!');