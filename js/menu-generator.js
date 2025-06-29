// menu-generator.js - JSON 기반 네비게이션 생성기

class MenuGenerator {
    constructor() {
        this.menuData = null;
        this.quickLinks = null;
        this.isLoaded = false;
    }
    
    // JSON 메뉴 데이터 로딩
    async loadMenuData() {
        try {
            console.log('🔄 메뉴 데이터 로딩 중...');
            const response = await fetch('./json/menu-data.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.menuData = data.navigation;
            this.quickLinks = data.quick_links;
            this.isLoaded = true;
            
            console.log('✅ 메뉴 데이터 로딩 완료');
            return data;
        } catch (error) {
            console.error('❌ 메뉴 데이터 로딩 실패:', error);
            this.isLoaded = false;
            return null;
        }
    }
    
    // 경로 계산 (현재 페이지 위치에 따라)
    getBasePath() {
        const currentPath = window.location.pathname;
        const isSubPage = currentPath.includes('/pages/');
        
        if (isSubPage) {
            const depth = (currentPath.match(/\//g) || []).length;
            return depth === 3 ? '../../' : '../';
        }
        return './';
    }
    
    // URL 경로 정규화
    normalizeUrl(url) {
        const basePath = this.getBasePath();
        if (url.startsWith('/')) {
            return basePath + url.substring(2); // '/pages/' -> '../pages/' or './pages/'
        }
        return url;
    }
    
    // 데스크톱 네비게이션 생성
    generateDesktopNav() {
        if (!this.isLoaded) {
            console.warn('⚠️ 메뉴 데이터가 로딩되지 않음');
            return '';
        }
        
        let html = '<nav class="desktop-nav"><ul class="nav-menu">';
        
        Object.entries(this.menuData).forEach(([key, menu]) => {
            const hasChildren = menu.children && Object.keys(menu.children).length > 0;
            
            html += `<li class="nav-item ${hasChildren ? 'has-dropdown' : ''}">`;
            html += `<a href="${this.normalizeUrl(menu.url)}" class="nav-link">${menu.title}</a>`;
            
            if (hasChildren) {
                html += `<ul class="dropdown-menu">`;
                Object.entries(menu.children).forEach(([childKey, child]) => {
                    html += `<li class="dropdown-item">`;
                    html += `<a href="${this.normalizeUrl(child.url)}" class="dropdown-link">${child.title}</a>`;
                    html += `</li>`;
                });
                html += `</ul>`;
            }
            
            html += `</li>`;
        });
        
        html += '</ul></nav>';
        return html;
    }
    
    // 모바일 사이드바 생성
    generateMobileSidebar() {
        if (!this.isLoaded) {
            console.warn('⚠️ 메뉴 데이터가 로딩되지 않음');
            return '';
        }
        
        let html = '<ul class="sidebar-menu">';
        
        Object.entries(this.menuData).forEach(([key, menu]) => {
            html += this.generateSidebarItem(menu, 'sidebar-item', 'sidebar-link');
        });
        
        // 퀵링크 추가
        if (this.quickLinks && this.quickLinks.length > 0) {
            html += '<li class="sidebar-divider"></li>';
            this.quickLinks.forEach(link => {
                html += `<li class="sidebar-item">`;
                html += `<a href="${this.normalizeUrl(link.url)}" class="sidebar-link">`;
                html += `<span>${link.title}</span></a></li>`;
            });
        }
        
        html += '</ul>';
        return html;
    }
    
    // 사이드바 아이템 재귀 생성
    generateSidebarItem(menu, itemClass, linkClass) {
        const hasChildren = menu.children && Object.keys(menu.children).length > 0;
        const isDirectLink = menu.type === 'section-page' || !hasChildren;
        
        let html = `<li class="${itemClass} ${hasChildren ? 'has-submenu' : ''}">`;
        
        if (isDirectLink) {
            // 직접 링크 (YPP아카데미, 고객지원 등)
            html += `<a href="${this.normalizeUrl(menu.url)}" class="${linkClass}">`;
            html += `<span>${menu.title}</span></a>`;
        } else {
            // 드롭다운 토글
            html += `<a class="${linkClass}" data-toggle="submenu">`;
            html += `<span>${menu.title}</span><span class="sidebar-arrow">›</span></a>`;
            
            if (hasChildren) {
                html += this.generateSubmenu(menu.children, 1);
            }
        }
        
        html += `</li>`;
        return html;
    }
    
    // 서브메뉴 재귀 생성 (깊이별 클래스 적용)
    generateSubmenu(children, depth) {
        const submenuClass = depth === 1 ? 'sidebar-submenu' : 'sidebar-sub-submenu';
        const itemClass = depth === 1 ? 'sidebar-subitem' : 'sidebar-sub-subitem';
        const linkClass = depth === 1 ? 'sidebar-sublink' : 'sidebar-sub-sublink';
        
        let html = `<ul class="${submenuClass}">`;
        
        Object.entries(children).forEach(([key, child]) => {
            const hasGrandChildren = child.children && Object.keys(child.children).length > 0;
            
            html += `<li class="${itemClass} ${hasGrandChildren ? 'has-submenu' : ''}">`;
            
            if (hasGrandChildren) {
                // 더 깊은 레벨 드롭다운
                html += `<a class="${linkClass}" data-toggle="submenu">`;
                html += `<span>${child.title}</span><span class="sidebar-arrow">›</span></a>`;
                html += this.generateSubmenu(child.children, depth + 1);
            } else {
                // 최종 링크
                html += `<a href="${this.normalizeUrl(child.url)}" class="${linkClass}">`;
                html += `<span>${child.title}</span></a>`;
            }
            
            html += `</li>`;
        });
        
        html += '</ul>';
        return html;
    }
    
    // 브레드크럼 생성
    generateBreadcrumb(currentUrl) {
        if (!this.isLoaded) return '';
        
        const breadcrumbs = this.findBreadcrumbPath(currentUrl);
        if (breadcrumbs.length === 0) return '';
        
        let html = '<nav class="breadcrumb"><ol class="breadcrumb-list">';
        html += '<li class="breadcrumb-item"><a href="/">홈</a></li>';
        
        breadcrumbs.forEach((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            html += `<li class="breadcrumb-item ${isLast ? 'active' : ''}">`;
            
            if (isLast) {
                html += `<span>${crumb.title}</span>`;
            } else {
                html += `<a href="${this.normalizeUrl(crumb.url)}">${crumb.title}</a>`;
            }
            
            html += '</li>';
        });
        
        html += '</ol></nav>';
        return html;
    }
    
    // 브레드크럼 경로 찾기
    findBreadcrumbPath(targetUrl, menuItems = null, path = []) {
        if (!menuItems) menuItems = this.menuData;
        
        for (const [key, menu] of Object.entries(menuItems)) {
            const currentPath = [...path, { title: menu.title, url: menu.url }];
            
            if (menu.url === targetUrl) {
                return currentPath;
            }
            
            if (menu.children) {
                const result = this.findBreadcrumbPath(targetUrl, menu.children, currentPath);
                if (result.length > 0) return result;
            }
        }
        
        return [];
    }
    
    // 사이트맵 생성
    generateSitemap() {
        if (!this.isLoaded) return '';
        
        let html = '<div class="sitemap"><h2>사이트맵</h2>';
        
        Object.entries(this.menuData).forEach(([key, menu]) => {
            html += `<div class="sitemap-section">`;
            html += `<h3><a href="${this.normalizeUrl(menu.url)}">${menu.title}</a></h3>`;
            
            if (menu.children) {
                html += `<ul class="sitemap-list">`;
                html += this.generateSitemapList(menu.children);
                html += `</ul>`;
            }
            
            html += `</div>`;
        });
        
        html += '</div>';
        return html;
    }
    
    // 사이트맵 리스트 재귀 생성
    generateSitemapList(children) {
        let html = '';
        
        Object.entries(children).forEach(([key, child]) => {
            html += `<li>`;
            html += `<a href="${this.normalizeUrl(child.url)}">${child.title}</a>`;
            
            if (child.children) {
                html += `<ul>`;
                html += this.generateSitemapList(child.children);
                html += `</ul>`;
            }
            
            html += `</li>`;
        });
        
        return html;
    }
    
    // 메뉴 데이터 검색
    findMenuByUrl(targetUrl, menuItems = null) {
        if (!menuItems) menuItems = this.menuData;
        
        for (const [key, menu] of Object.entries(menuItems)) {
            if (menu.url === targetUrl) {
                return menu;
            }
            
            if (menu.children) {
                const result = this.findMenuByUrl(targetUrl, menu.children);
                if (result) return result;
            }
        }
        
        return null;
    }
    
    // 현재 페이지의 메뉴 정보 가져오기
    getCurrentPageInfo() {
        const currentUrl = window.location.pathname;
        return this.findMenuByUrl(currentUrl);
    }
    
    // 전체 초기화
    async init() {
        console.log('🚀 MenuGenerator 초기화 시작');
        
        const success = await this.loadMenuData();
        if (!success) {
            console.error('❌ MenuGenerator 초기화 실패');
            return false;
        }
        
        this.generateAllMenus();
        console.log('✅ MenuGenerator 초기화 완료');
        return true;
    }
    
    // 모든 메뉴 생성 및 삽입
    generateAllMenus() {
        // 데스크톱 네비게이션
        const desktopNavContainer = document.querySelector('#desktop-nav-container');
        if (desktopNavContainer) {
            desktopNavContainer.innerHTML = this.generateDesktopNav();
            console.log('✅ 데스크톱 네비게이션 생성됨');
        }
        
        // 모바일 사이드바
        const mobileNavContainer = document.querySelector('#mobile-nav-container');
        if (mobileNavContainer) {
            mobileNavContainer.innerHTML = this.generateMobileSidebar();
            console.log('✅ 모바일 사이드바 생성됨');
        }
        
        // 브레드크럼 (선택적)
        const breadcrumbContainer = document.querySelector('#breadcrumb-container');
        if (breadcrumbContainer) {
            const currentUrl = window.location.pathname;
            breadcrumbContainer.innerHTML = this.generateBreadcrumb(currentUrl);
            console.log('✅ 브레드크럼 생성됨');
        }
        
        // 사이트맵 (선택적)
        const sitemapContainer = document.querySelector('#sitemap-container');
        if (sitemapContainer) {
            sitemapContainer.innerHTML = this.generateSitemap();
            console.log('✅ 사이트맵 생성됨');
        }
    }
    
    // 메뉴 데이터 새로고침
    async refresh() {
        console.log('🔄 메뉴 데이터 새로고침');
        await this.loadMenuData();
        this.generateAllMenus();
    }
    
    // 디버깅용 메서드
    debug() {
        console.log('📊 MenuGenerator 디버그 정보:');
        console.log('- 로딩 상태:', this.isLoaded);
        console.log('- 메뉴 개수:', Object.keys(this.menuData || {}).length);
        console.log('- 퀵링크 개수:', (this.quickLinks || []).length);
        console.log('- 현재 페이지:', this.getCurrentPageInfo());
    }
}

// 전역 인스턴스 생성
const menuGenerator = new MenuGenerator();

// 전역 함수로 내보내기
window.MenuGenerator = MenuGenerator;
window.menuGenerator = menuGenerator;

// 자동 초기화 (DOM 로딩 완료 후)
document.addEventListener('DOMContentLoaded', async function() {
    await menuGenerator.init();
});

// 컴포넌트 로딩 완료 후에도 초기화
document.addEventListener('sectionsLoaded', function() {
    setTimeout(() => {
        menuGenerator.generateAllMenus();
    }, 100);
});

// 내보내기
export default MenuGenerator;