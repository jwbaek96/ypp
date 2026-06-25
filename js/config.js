/**
 * YPP 프로젝트 환경설정 관리
 * Supabase에서 환경변수를 동적으로 로드하여 관리
 */

// Supabase 설정
const SUPABASE_CONFIG = {
    url: 'https://mcdpmkipopgishxjpbvi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZHBta2lwb3BnaXNoeGpwYnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NDM1NDIsImV4cCI6MjA3NjUxOTU0Mn0.UyASY-e556o1qCs4INZOxpLjz1n1DC9erxOowImVkQ8'
};

// Admin 비밀번호 (임시 - Supabase 복구 후 제거)
const ADMIN_PASSWORD = 'ypp8720';

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

// 폴백 URL들 (Supabase 로드 실패 시 사용)
const FALLBACK_URLS = {
    ACADEMY1: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY2: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_FORM: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_COURSEDATA: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_PSAC1: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_PSAC2: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    ACADEMY_RS1: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    BUSINESS: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    COMPANY: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    COMPANY_GALLERY: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    MEDIA_ACADEMY: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    MEDIA_INSIDE: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    MEDIA_VIDEO: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    PRESS: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec',
    SUPPORT: 'https://script.google.com/macros/s/AKfycbyoMc0WSMtDwJJc4yARLNDAUAaUgtSyyzetW2sSwmZq91PvWHPUTrPd60x1iwBCzDVx/exec'
};

/**
 * YPP 환경설정 관리 클래스
 */
class YPPConfig {
    constructor() {
        this.supabase = null;
        this.configCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5분 캐시
        this.isInitialized = false;
        this.initPromise = null;
    }

    /**
     * Supabase 클라이언트 초기화
     */
    async init() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._init();
        return this.initPromise;
    }

    async _init() {
        try {
            // Supabase 라이브러리 로드 확인
            if (typeof window === 'undefined' || !window.supabase) {
                throw new Error('Supabase 라이브러리가 로드되지 않았습니다.');
            }

            // Supabase 클라이언트 생성
            this.supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url, 
                SUPABASE_CONFIG.anonKey
            );

            this.isInitialized = true;
            console.log('✅ YPP Config 초기화 완료');
            
            return true;
        } catch (error) {
            console.error('💥 YPP Config 초기화 실패:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * 단일 환경변수 값 가져오기
     * @param {string} key - ENV_VARIABLES의 키 (예: 'ACADEMY1', 'SUPPORT')
     * @returns {Promise<string>} - 환경변수 값
     */
    async getConfig(key) {
        try {
            // 초기화 확인
            if (!this.isInitialized) {
                await this.init();
            }

            // 캐시 확인
            const cached = this.getCachedValue(key);
            if (cached) {
                return cached;
            }

            // Supabase에서 값 가져오기
            if (!this.supabase) {
                throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
            }

            const envKey = ENV_VARIABLES[key];
            if (!envKey) {
                throw new Error(`알 수 없는 설정 키: ${key}`);
            }

            console.log(`📡 환경변수 로드 중: ${envKey}`);

            const { data, error } = await this.supabase
                .from('env_variables')
                .select('value')
                .eq('name', envKey)
                .single();

            if (error) {
                throw new Error(`Supabase 오류: ${error.message}`);
            }

            if (!data || !data.value) {
                throw new Error(`환경변수 값이 없습니다: ${envKey}`);
            }

            // 캐시에 저장
            this.setCachedValue(key, data.value);
            
            console.log(`✅ 환경변수 로드 완료: ${envKey} = ${data.value}`);
            return data.value;

        } catch (error) {
            console.error(`💥 환경변수 로드 실패 (${key}):`, error);
            
            // 폴백 URL 반환
            const fallbackUrl = FALLBACK_URLS[key];
            if (fallbackUrl) {
                console.warn(`⚠️ 폴백 URL 사용: ${key} = ${fallbackUrl}`);
                return fallbackUrl;
            }

            throw error;
        }
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
    // 초기화
    init: () => yppConfig.init(),
    
    // 단일 설정값 가져오기
    get: (key) => yppConfig.getConfig(key),
    
    // 여러 설정값 가져오기
    getMultiple: (keys) => yppConfig.getMultipleConfigs(keys),
    
    // 모든 설정값 가져오기
    getAll: () => yppConfig.getAllConfigs(),
    
    // 페이지별 설정값 가져오기
    getPage: (pageName) => yppConfig.getPageConfigs(pageName),
    
    // 캐시 관리
    clearCache: () => yppConfig.clearCache(),
    
    // 직접 접근 (고급 사용)
    instance: yppConfig,
    
    // 환경변수 키 목록
    keys: ENV_VARIABLES
};

// 전역으로 노출
window.yppConfig = yppConfig;

console.log('📋 YPP Config 모듈 로드됨');

// 자동 초기화 (DOM 로드 후)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async function() {
        // 약간의 지연 후 초기화 (다른 라이브러리 로드 대기)
        setTimeout(async () => {
            try {
                await yppConfig.init();
            } catch (error) {
                console.warn('YPP Config 자동 초기화 실패:', error);
            }
        }, 100);
    });
}