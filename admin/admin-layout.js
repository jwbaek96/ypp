(function () {
    const currentPath = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
    const sidebarStateKey = 'ypp_admin_sidebar_collapsed';
    const navGroups = [
        {
            icon: 'fa-globe',
            label: '웹사이트 관리',
            links: [{ label: '웹사이트 콘텐츠', icon: 'fa-pen-to-square', sheetUrl: 'https://docs.google.com/spreadsheets/d/1YZKUJNqCf63gxzfnoBnWugUEi04dYUZ8LeTdtENfg4k/edit?usp=sharing' }]
        },
        {
            icon: 'fa-graduation-cap',
            label: '아카데미',
            links: [
                { label: 'PSAC', href: '/admin/page.html?page=PSAC', icon: 'fa-book-open' },
                { label: 'Relay School', href: '/admin/page.html?page=RelaySchool', icon: 'fa-school' },
                { label: 'Relay School Special', href: '/admin/page.html?page=RelaySchoolSpecial', icon: 'fa-star' }
            ]
        },
        {
            icon: 'fa-images',
            label: '미디어',
            links: [
                { label: '인허가', href: '/admin/page.html?page=%EC%9D%B8%ED%97%88%EA%B0%80', icon: 'fa-file-signature' },
                { label: '유자격·수상', href: '/admin/page.html?page=%EC%9C%A0%EC%9E%90%EA%B2%A9', icon: 'fa-award' },
                { label: '인사이드', icon: 'fa-images', sheetUrl: 'https://docs.google.com/spreadsheets/d/1883SgdNBFGLDyGXs5zITslHQPV-Oa90ilt9eG7af70c/edit?usp=sharing' },
                { label: '아카데미 갤러리', icon: 'fa-camera', sheetUrl: 'https://docs.google.com/spreadsheets/d/1gY5o_fHrXxAShXdSzqhyZBdLskbsAEwIdihci0UeU8c/edit?usp=sharing' },
                { label: '비디오', icon: 'fa-video', sheetUrl: 'https://docs.google.com/spreadsheets/d/1BopJLpq_yYbpJDTFtUxPRQKW2p5A1S9FE-wuXN32ph4/edit?usp=sharing' }
            ]
        },
        {
            icon: 'fa-bullhorn',
            label: '게시판 및 팝업',
            links: [{ label: '보도자료 및 팝업', icon: 'fa-bullhorn', sheetUrl: 'https://docs.google.com/spreadsheets/d/1ZEtN7--25jDh_fY4l_KLNs18mNJx3vmQEsgunvD69jo/edit?usp=sharing', createUrl: 'https://tally.so/r/3qr11G' }]
        },
        {
            icon: 'fa-headset',
            label: '고객센터',
            links: [
                { label: '고객문의 (KOR)', href: '/admin/page.html?page=%EA%B3%A0%EA%B0%9D%EB%AC%B8%EC%9D%98(KOR)', icon: 'fa-comments' },
                { label: '고객문의 (ENG)', href: '/admin/page.html?page=%EA%B3%A0%EA%B0%9D%EB%AC%B8%EC%9D%98(ENG)', icon: 'fa-comment-dots' },
                { label: '부패 및 윤리 신고', href: '/admin/page.html?page=%EB%B6%80%ED%8C%A8%EB%B0%8F%EC%9C%A4%EB%A6%AC%EC%8B%A0%EA%B3%A0', icon: 'fa-shield-halved' }
            ]
        }
    ];

    function isActive(link) {
        if (link.activePath) {
            return currentPath === link.activePath;
        }
        if (!link.href) {
            return false;
        }
        const linkUrl = new URL(link.href, window.location.origin);
        return currentPath === linkUrl.pathname.replace(/\/index\.html$/, '').replace(/\/$/, '')
            && (!linkUrl.search || linkUrl.search === window.location.search);
    }

    function renderLink(link) {
        const className = `admin-sidebar-link${isActive(link) ? ' is-active' : ''}`;
        const content = `<i class="fas ${link.icon}" aria-hidden="true"></i><span>${link.label}</span>`;

        if (link.sheetUrl) {
            return `<button class="${className}" type="button" data-sheet-url="${link.sheetUrl}" data-sheet-title="${link.label}" data-create-url="${link.createUrl || ''}" title="${link.label}">${content}</button>`;
        }

        return `<a class="${className}" href="${link.href}" title="${link.label}">${content}</a>`;
    }

    function renderGroup(group) {
        const links = group.links.map(renderLink).join('');
        return `
            <section class="admin-sidebar-group">
                <button class="admin-sidebar-group-title" type="button" aria-expanded="true">
                    <i class="fas ${group.icon}" aria-hidden="true"></i><span>${group.label}</span>
                    <span class="admin-sidebar-group-toggle" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>
                </button>
                <div class="admin-sidebar-group-links">${links}</div>
            </section>`;
    }

    function logout() {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        window.location.href = '/admin/login.html';
    }

    function createSheetModal() {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="admin-sheet-modal" id="adminSheetModal" role="dialog" aria-modal="true" aria-labelledby="adminSheetModalTitle">
                <div class="admin-sheet-modal-dialog">
                    <header class="admin-sheet-modal-header">
                        <h2 class="admin-sheet-modal-title" id="adminSheetModalTitle">스프레드시트 관리</h2>
                        <div class="admin-sheet-modal-actions">
                            <a class="admin-sheet-modal-create" href="#" target="_blank" rel="noopener noreferrer" aria-label="신규 등록" title="신규 등록" hidden><i class="fas fa-plus" aria-hidden="true"></i><span>신규 등록</span></a>
                            <a class="admin-sheet-modal-open" href="#" target="_blank" rel="noopener noreferrer" aria-label="원본 Google Sheets에서 열기" title="원본 Google Sheets에서 열기"><i class="fas fa-external-link-alt" aria-hidden="true"></i></a>
                            <button class="admin-sheet-modal-close" type="button" aria-label="모달 닫기" title="닫기"><i class="fas fa-xmark" aria-hidden="true"></i></button>
                        </div>
                    </header>
                    <iframe class="admin-sheet-modal-frame" title="스프레드시트 관리"></iframe>
                </div>
            </div>`);

        const modal = document.getElementById('adminSheetModal');
        const title = modal.querySelector('.admin-sheet-modal-title');
        const frame = modal.querySelector('.admin-sheet-modal-frame');
        const createButton = modal.querySelector('.admin-sheet-modal-create');
        const openButton = modal.querySelector('.admin-sheet-modal-open');
        const closeButton = modal.querySelector('.admin-sheet-modal-close');
        let trigger = null;

        function closeModal() {
            modal.classList.remove('is-open');
            frame.src = 'about:blank';
            createButton.hidden = true;
            trigger?.focus();
        }

        function openModal({ sheetUrl, title: sheetTitle, createUrl = '', trigger: modalTrigger = null }) {
            trigger = modalTrigger;
            title.textContent = sheetTitle;
            frame.title = `${sheetTitle} 스프레드시트`;
            frame.src = sheetUrl;
            openButton.href = sheetUrl;
            createButton.href = createUrl || '#';
            createButton.hidden = !createUrl;
            modal.classList.add('is-open');
            closeButton.focus();
        }

        document.querySelectorAll('[data-sheet-url]').forEach((button) => {
            button.addEventListener('click', () => openModal({
                sheetUrl: button.dataset.sheetUrl,
                title: button.dataset.sheetTitle,
                createUrl: button.dataset.createUrl,
                trigger: button
            }));
        });

        closeButton.addEventListener('click', closeModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal();
            }
        });

        window.adminSheetModal = { open: openModal, close: closeModal };
        return closeModal;
    }

    function initialize() {
        document.body.classList.add('admin-layout-enabled');
        document.body.insertAdjacentHTML('afterbegin', `
            <button class="admin-sidebar-mobile-toggle" type="button" aria-label="메뉴 열기" aria-expanded="false"><i class="fas fa-bars" aria-hidden="true"></i></button>
            <div class="admin-sidebar-backdrop"></div>
            <aside class="admin-sidebar" aria-label="관리자 메뉴">
                <header class="admin-sidebar-header">
                    <a class="admin-sidebar-brand" href="/admin/">YPP ADMIN</a>
                    <button class="admin-sidebar-toggle" type="button" aria-label="사이드바 접기"><i class="fas fa-angles-left" aria-hidden="true"></i></button>
                </header>
                <nav class="admin-sidebar-nav">
                    <a class="admin-sidebar-link${currentPath === '/admin' ? ' is-active' : ''}" href="/admin/" title="관리자 홈"><i class="fas fa-house" aria-hidden="true"></i><span>관리자 홈</span></a>
                    ${navGroups.map(renderGroup).join('')}
                </nav>
                <footer class="admin-sidebar-footer">
                    <button class="admin-sidebar-link admin-sidebar-logout" type="button" title="로그아웃"><i class="fas fa-arrow-right-from-bracket" aria-hidden="true"></i><span>로그아웃</span></button>
                </footer>
            </aside>`);

        const sidebarToggle = document.querySelector('.admin-sidebar-toggle');
        const mobileToggle = document.querySelector('.admin-sidebar-mobile-toggle');
        const backdrop = document.querySelector('.admin-sidebar-backdrop');
        const sidebar = document.querySelector('.admin-sidebar');
        const closeSheetModal = createSheetModal();

        function setMobileMenu(isOpen) {
            document.body.classList.toggle('admin-sidebar-open', isOpen);
            mobileToggle.setAttribute('aria-expanded', String(isOpen));
        }

        if (localStorage.getItem(sidebarStateKey) === 'true') {
            document.body.classList.add('admin-sidebar-collapsed');
            sidebarToggle.setAttribute('aria-label', '사이드바 펼치기');
            sidebarToggle.innerHTML = '<i class="fas fa-angles-right" aria-hidden="true"></i>';
        }

        sidebarToggle.addEventListener('click', () => {
            const isCollapsed = document.body.classList.toggle('admin-sidebar-collapsed');
            localStorage.setItem(sidebarStateKey, String(isCollapsed));
            sidebarToggle.setAttribute('aria-label', isCollapsed ? '사이드바 펼치기' : '사이드바 접기');
            sidebarToggle.innerHTML = `<i class="fas fa-angles-${isCollapsed ? 'right' : 'left'}" aria-hidden="true"></i>`;
        });

        mobileToggle.addEventListener('click', () => setMobileMenu(!document.body.classList.contains('admin-sidebar-open')));
        backdrop.addEventListener('click', () => setMobileMenu(false));
        sidebar.querySelectorAll('.admin-sidebar-link').forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));
        sidebar.querySelectorAll('.admin-sidebar-group-title').forEach((button) => {
            button.addEventListener('click', () => {
                const group = button.closest('.admin-sidebar-group');
                const isCollapsed = group.classList.toggle('is-collapsed');
                button.setAttribute('aria-expanded', String(!isCollapsed));
            });
        });
        sidebar.querySelector('.admin-sidebar-logout').addEventListener('click', logout);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                setMobileMenu(false);
                closeSheetModal();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
}());