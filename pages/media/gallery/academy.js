// 앱스크립트 웹 앱 URL
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDCS1nljq9qNl6NzAQ8SSunk5u1vYS3WC0FB6IeSFdfX2Lkz3-qOUJ7qhXlXIninih/exec';

// 데이터 가져오기
async function getGalleryList() {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();
        
        return data.map(item => ({
            ...item,
            thumbnail: item.images[0] || '',
            year: item.date.split('-')[0]
        }));
    } catch (error) {
        console.error('데이터 로드 오류:', error);
        throw error;
    }
}