/**
 * YPP 프로젝트 환경설정 관리
 * Apps Script URL을 로컬 설정에서 직접 관리합니다.
 */

// 환경변수 키 목록
const ENV_VARIABLES = {
    // Academy 관련
    ACADEMY1: 'YPP_APPSURL_ACADEMY1',
    ACADEMY2: 'YPP_APPSURL_ACADEMY2', 
    ACADEMY_FORM: 'YPP_APPSURL_ACADEMY_FORM',
    ACADEMY_COURSEDATA: 'YPP_APPSURL_ACADEMY_COURSEDATA',
    ACADEMY_PSAC1: 'YPP_APPSURL_ACADEMY_PSAC1',
    ACADEMY_PSAC2: 'YPP_APPSURL_ACADEMY_PSAC2',
    ACADEMY_RS1: 'YPP_APPSURL_ACADEMY_RS1',
    
    // Business 관련
    BUSINESS: 'YPP_APPSURL_BUSINESS',
    
    // Company 관련
    COMPANY: 'YPP_APPSURL_COMPANY',
    COMPANY_GALLERY: 'YPP_APPSURL_COMPANY_GALLERY',
    
    // Media 관련
    MEDIA_ACADEMY: 'YPP_APPSURL_MEDIA_ACADEMY',
    MEDIA_INSIDE: 'YPP_APPSURL_MEDIA_INSIDE',
    MEDIA_VIDEO: 'YPP_APPSURL_MIDEA_VIDEO', // 오타 유지 (원본과 동일)
    
    // Press & Support
    PRESS: 'YPP_APPSURL_PRESS',
    SUPPORT: 'YPP_APPSURL_SUPPORT'
};

// 페이지별 Apps Script URL 설정
const FALLBACK_URLS = {
    ACADEMY1: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY2: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_FORM: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_COURSEDATA: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_PSAC1: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_PSAC2: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_RS1: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    //Read Only for Web ✅
    BUSINESS: 'https://script.google.com/macros/s/AKfycbwVzRfzyNn2Q-bYUbZWNw3A5Q-gFxLRs3tzYwXn5B2zCOrsTdQ9YALg1JFh4pqT4OEI-g/exec',
    //Read Only for Web ✅
    COMPANY: 'https://script.google.com/macros/s/AKfycbwVzRfzyNn2Q-bYUbZWNw3A5Q-gFxLRs3tzYwXn5B2zCOrsTdQ9YALg1JFh4pqT4OEI-g/exec',
    //YPP DATA ✅
    COMPANY_GALLERY: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    //YPP DATA ✅
    MEDIA_ACADEMY: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',//YPP DATA
    //YPP DATA 
    MEDIA_INSIDE: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',//YPP DATA
    //YPP DATA ✅
    MEDIA_VIDEO: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',//YPP DATA
    //YPP DATA ✅
    PRESS: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',//YPP DATA
    //YPP DATA
    SUPPORT: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec'//YPP DATA
};

/**
 * YPP 환경설정 관리 클래스
 */
class YPPConfig {
    constructor() {
        this.configCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5분 캐시
        this.isInitialized = true;
    }

    /**
     * 초기화
     */
    async init() {
        this.isInitialized = true;
        return true;
    }

    /**
     * 단일 설정값 가져오기
     * @param {string} key - ENV_VARIABLES의 키 (예: 'ACADEMY1', 'SUPPORT')
     * @returns {Promise<string>} - 설정값
     */
    async getConfig(key) {
        const cached = this.getCachedValue(key);
        if (cached) {
            return cached;
        }

        const envKey = ENV_VARIABLES[key];
        if (!envKey) {
            throw new Error(`알 수 없는 설정 키: ${key}`);
        }

        const fallbackUrl = FALLBACK_URLS[key];
        if (!fallbackUrl) {
            throw new Error(`설정값이 없습니다: ${key}`);
        }

        this.setCachedValue(key, fallbackUrl);
        console.log(`✅ 설정 로드 완료: ${envKey} = ${fallbackUrl}`);
        return fallbackUrl;
    }

    /**
     * 여러 환경변수 값을 한번에 가져오기
     * @param {string[]} keys - 가져올 환경변수 키 배열
     * @returns {Promise<Object>} - {key: value} 형태의 객체
     */
    async getMultipleConfigs(keys) {
        const results = {};
        
        // 병렬로 모든 설정값 가져오기
        const promises = keys.map(async (key) => {
            try {
                const value = await this.getConfig(key);
                return { key, value, success: true };
            } catch (error) {
                console.error(`환경변수 로드 실패: ${key}`, error);
                return { key, value: null, success: false, error };
            }
        });

        const responses = await Promise.all(promises);

        // 결과 정리
        responses.forEach(({ key, value, success }) => {
            if (success && value) {
                results[key] = value;
            }
        });

        return results;
    }

    /**
     * 모든 환경변수 값 가져오기
     * @returns {Promise<Object>} - 모든 환경변수 값
     */
    async getAllConfigs() {
        const allKeys = Object.keys(ENV_VARIABLES);
        return await this.getMultipleConfigs(allKeys);
    }

    /**
     * 캐시에서 값 가져오기
     */
    getCachedValue(key) {
        const cached = this.configCache.get(key);
        if (cached && Date.now() < cached.expiry) {
            console.log(`📦 캐시에서 로드: ${key}`);
            return cached.value;
        }
        return null;
    }

    /**
     * 캐시에 값 저장
     */
    setCachedValue(key, value) {
        this.configCache.set(key, {
            value,
            expiry: Date.now() + this.cacheExpiry
        });
    }

    /**
     * 캐시 초기화
     */
    clearCache() {
        this.configCache.clear();
        console.log('🗑️ 설정 캐시 초기화됨');
    }

    /**
     * 특정 페이지에 필요한 설정들만 가져오기
     */
    async getPageConfigs(pageName) {
        const pageConfigMap = {
            'academy': ['ACADEMY1', 'ACADEMY2', 'ACADEMY_FORM', 'ACADEMY_COURSEDATA', 'ACADEMY_PSAC1', 'ACADEMY_PSAC2', 'ACADEMY_RS1'],
            'business': ['BUSINESS'],
            'company': ['COMPANY', 'COMPANY_GALLERY'],
            'media': ['MEDIA_ACADEMY', 'MEDIA_INSIDE', 'MEDIA_VIDEO'],
            'support': ['SUPPORT'],
            'press': ['PRESS']
        };

        const keys = pageConfigMap[pageName];
        if (!keys) {
            throw new Error(`알 수 없는 페이지: ${pageName}`);
        }

        return await this.getMultipleConfigs(keys);
    }
}

// 전역 인스턴스 생성
const yppConfig = new YPPConfig();

// 편의 함수들
window.YPPConfig = {
    initialized: true,

    init: () => yppConfig.init(),
    
    get: (key) => yppConfig.getConfig(key),
    getConfig: (key) => yppConfig.getConfig(key),
    
    getMultiple: (keys) => yppConfig.getMultipleConfigs(keys),
    
    getAll: () => yppConfig.getAllConfigs(),
    
    getPage: (pageName) => yppConfig.getPageConfigs(pageName),
    
    clearCache: () => yppConfig.clearCache(),
    
    instance: yppConfig,
    
    keys: ENV_VARIABLES
};

// 전역으로 노출
window.yppConfig = yppConfig;

console.log('📋 YPP Config 모듈 로드됨 (fallback only)');

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        yppConfig.init();
    });
}