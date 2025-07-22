// 구글 스프레드시트 데이터를 가져올 URL
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzQGvamyKJBy-zhoD_Ho-5ulbY7me2azs0FlUyBlMRVguKb3VLZmE3GdNebHk3xN6s_/exec';

/**
 * 구글 스프레드시트에서 데이터를 가져오는 함수
 * JSONP 방식을 사용해서 외부 API 호출
 */
function fetchGoogleSheetData() {
    return new Promise((resolve, reject) => {
        // 고유한 콜백 함수 이름 생성 (현재 시간 기준)
        const callbackName = 'jsonp_callback_' + Date.now();
        
        // 전역 윈도우 객체에 콜백 함수 등록
        window[callbackName] = function(data) {
            if (data.error) reject(new Error(data.message)); // 에러가 있으면 거부
            else resolve(data); // 성공하면 데이터 반환
            delete window[callbackName]; // 사용 후 콜백 함수 삭제
        };
        
        // 동적으로 script 태그 생성해서 데이터 요청
        const script = document.createElement('script');
        script.src = `${GOOGLE_SHEET_URL}?callback=${callbackName}`;
        script.onerror = () => reject(new Error('네트워크 오류')); // 네트워크 에러 처리
        document.head.appendChild(script); // 헤드에 스크립트 추가
        script.onload = () => document.head.removeChild(script); // 로드 완료 후 스크립트 제거
    });
}

// 전체 갤러리 데이터를 저장할 배열
let galleryData = [];
// 현재 모달에서 보고 있는 이미지의 인덱스
let currentImageIndex = 0;
// 현재 모달에서 보여줄 이미지들의 배열
let currentImages = [];

/**
 * 페이지 초기화 함수 - 페이지 로드 시 실행
 */
async function init() {
    // 로딩 메시지 표시
    document.getElementById('license-gallery').innerText = '데이터를 불러오는 중...';
    
    try {
        // 구글 스프레드시트에서 데이터 가져오기
        const rawData = await fetchGoogleSheetData();
        console.log('rawData:', rawData); // 데이터 구조 확인용 로그
        
        // statu가 on인 항목들만 필터링 (게시 승인된 항목만)
        galleryData = rawData.filter(item => {
            if (!item.statu) return false;
            const val = String(item.statu).toLowerCase();
            return val === 'on' || val === '1' || val === 'yes';
        });
        console.log('galleryData:', galleryData); // 데이터 구조 확인용 로그
        
        // 게시된 데이터가 없으면 메시지 표시
        if (galleryData.length === 0) {
            document.getElementById('license-gallery').innerText = '게시된 데이터가 없습니다.';
            return;
        }
        
        // 필터 옵션 설정
        // setupFilters();
        // 갤러리 화면에 렌더링
        renderGallery(galleryData);
    } catch (e) {
        // 에러 발생 시 에러 메시지 표시
        document.getElementById('license-gallery').innerText = '데이터를 불러올 수 없습니다.';
        console.error(e);
    }
}

/**
 * 필터 옵션들을 설정하는 함수 (카테고리, 연도 드롭다운)
 */
// function setupFilters() {
//     const categoryFilter = document.getElementById('categoryFilter');
//     const yearFilter = document.getElementById('yearFilter');
    
//     // 카테고리 필터 옵션 생성
//     // 중복 제거해서 고유한 카테고리만 추출
//     const categories = [...new Set(galleryData.map(item => item.category))].filter(Boolean);
//     categories.forEach(category => {
//         const option = document.createElement('option');
//         option.value = category;
//         option.textContent = category;
//         categoryFilter.appendChild(option);
//     });
    
//     // 연도 필터 옵션 생성
//     // 날짜에서 연도만 추출하고 중복 제거, 최신순 정렬
//     const years = [...new Set(galleryData.map(item => {
//         const date = new Date(item.date);
//         return date.getFullYear();
//     }))].filter(year => !isNaN(year));
//     years.sort((a, b) => b - a); // 내림차순 정렬 (최신년도 먼저)
    
//     years.forEach(year => {
//         const option = document.createElement('option');
//         option.value = year;
//         option.textContent = year + '년';
//         yearFilter.appendChild(option);
//     });
    
//     // 필터 이벤트 리스너 등록
//     categoryFilter.addEventListener('change', applyFilters);
//     yearFilter.addEventListener('change', applyFilters);
//     document.getElementById('searchInput').addEventListener('input', applyFilters);
// }

/**
 * 필터 조건에 따라 데이터를 필터링하고 갤러리를 다시 렌더링
 */
// function applyFilters() {
//     // 현재 선택된 필터 값들 가져오기
//     const category = document.getElementById('categoryFilter').value;
//     const year = document.getElementById('yearFilter').value;
//     const search = document.getElementById('searchInput').value.toLowerCase();
    
//     let filtered = galleryData;
    
//     // 카테고리 필터 적용
//     if (category) filtered = filtered.filter(item => item.category === category);
    
//     // 연도 필터 적용
//     if (year) filtered = filtered.filter(item => new Date(item.date).getFullYear().toString() === year);
    
//     // 검색어 필터 적용 (제목에서 검색)
//     if (search) filtered = filtered.filter(item => item.title && item.title.toLowerCase().includes(search));
    
//     // 필터링된 결과로 갤러리 다시 렌더링
//     renderGallery(filtered);
// }

/**
 * 구글 드라이브 공유 링크를 직접 이미지 URL로 변환하는 함수
 */
// function convertGoogleDriveUrl(url) {
//     if (!url) return '';
    
//     // 구글 드라이브 공유 링크 패턴 확인
//     const match = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
//     if (match) {
//         const fileId = match[1];
//         // 직접 이미지를 표시할 수 있는 URL로 변환
//         return `https://drive.google.com/uc?export=view&id=${fileId}`;
//     }
    
//     // 이미 변환된 형태이거나 다른 URL인 경우 그대로 반환
//     return url;
// }

/**
 * 갤러리 그리드에 데이터를 렌더링하는 함수
 */
function renderGallery(data) {
    const grid = document.getElementById('license-gallery');
    
    grid.innerHTML = ''; // 기존 내용 초기화
    
    // 각 데이터 항목을 갤러리 카드로 생성
    data.forEach(item => {
        const div = document.createElement('div');
        const images = item.images || [];
        
        // 첫 번째 이미지를 대표 이미지로 사용하고 URL 변환
        // const mainImageUrl = convertGoogleDriveUrl(images[0] || '');
        const mainImageUrl = images[0] || '';
        
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
 * 이미지 모달을 여는 함수 (이미지 클릭 시 호출)
 */
window.openModal = function(itemId) {
    // 클릭한 항목의 데이터 찾기
    const item = galleryData.find(data => data.id === itemId);
    if (!item) return;
    
    // 해당 항목의 이미지들을 현재 이미지 배열에 설정하고 URL 변환
    // currentImages = (item.images || []).map(url => convertGoogleDriveUrl(url));
    currentImageIndex = 0; // 첫 번째 이미지부터 시작
    
    if (currentImages.length === 0) return;
    
    // 모달에 첫 번째 이미지 표시
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.src = currentImages[currentImageIndex];
        document.getElementById('imageModal').style.display = 'flex';
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
 * 키보드 입력 처리 함수
 */
// function handleKeyPress(e) {
//     if (e.key === 'Escape') closeModal();           // ESC키로 모달 닫기
//     else if (e.key === 'ArrowLeft') prevImage();    // 왼쪽 화살표로 이전 이미지
//     else if (e.key === 'ArrowRight') nextImage();   // 오른쪽 화살표로 다음 이미지
// }

// // 이벤트 리스너 등록
// document.getElementById('closeModal').onclick = closeModal;     // 닫기 버튼
// document.getElementById('prevBtn').onclick = prevImage;         // 이전 버튼
// document.getElementById('nextBtn').onclick = nextImage;         // 다음 버튼

// // 모달 배경 클릭 시 닫기
// document.getElementById('imageModal').addEventListener('click', function(e) {
//     if (e.target === this) closeModal(); // 모달 배경을 클릭했을 때만 닫기
// });

// 이벤트 리스너 등록 (요소 존재 확인)
document.addEventListener('DOMContentLoaded', function() {
    const closeModalBtn = document.getElementById('closeModal');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const imageModal = document.getElementById('imageModal');
    
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    if (prevBtn) prevBtn.onclick = prevImage;
    if (nextBtn) nextBtn.onclick = nextImage;
    
    // 모달 배경 클릭 시 닫기
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
});

// 키보드 이벤트 리스너 등록
// document.addEventListener('keydown', handleKeyPress);

// 페이지 로드 시 초기화 함수 실행
init();