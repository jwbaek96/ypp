// YPP Website - Main JavaScript

// ===== LOADING SCREEN =====
document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loading-screen');
    
    // 페이지 로드 완료 후 2초 뒤 페이드아웃
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 2000);
    });
});

// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== HEADER SCROLL EFFECT =====
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (window.scrollY > 100) {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'none';
    }
});

// ===== LANGUAGE SWITCH =====
document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        
        const lang = this.getAttribute('data-lang');
        console.log(`Language switched to: ${lang}`);
        // TODO: Implement language switching logic
    });
});

// ===== YPP ACADEMY POPUP =====
function openAcademyPopup() {
    document.getElementById('academy-popup').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAcademyPopup() {
    document.getElementById('academy-popup').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ===== PDF DOWNLOAD FUNCTION =====
function downloadFile(filename) {
    // Create download link
    const link = document.createElement('a');
    link.href = `./downloads/${filename}`;
    link.download = filename;
    
    // Track download with console log (can be replaced with analytics)
    console.log(`Downloading: ${filename}`);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll(
        '.overview-card, .business-card, .product-card, .academy-card, .contact-item'
    );
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
});

// ===== COUNTER ANIMATION =====
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        element.textContent = Math.floor(start);
        
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        }
    }, 16);
}

// Animate counters when they come into view
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const element = entry.target;
            const target = parseInt(element.getAttribute('data-target'));
            if (!isNaN(target)) {
                animateCounter(element, target);
                counterObserver.unobserve(element);
            }
        }
    });
}, { threshold: 0.5 });

// ===== MOBILE MENU TOGGLE =====
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');

    function openMobileSidebar() {
        if (mobileSidebar && sidebarOverlay) {
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Animate hamburger to X
            if (hamburgerBtn) {
                const lines = hamburgerBtn.querySelectorAll('.hamburger-line');
                if (lines.length >= 3) {
                    lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                    lines[1].style.opacity = '0';
                    lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
                }
            }
        }
    }

    function closeMobileSidebar() {
        if (mobileSidebar && sidebarOverlay) {
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Reset hamburger animation
            if (hamburgerBtn) {
                const lines = hamburgerBtn.querySelectorAll('.hamburger-line');
                if (lines.length >= 3) {
                    lines[0].style.transform = 'none';
                    lines[1].style.opacity = '1';
                    lines[2].style.transform = 'none';
                }
            }
        }
    }

    // Event listeners for mobile menu
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', openMobileSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeMobileSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }

    // Close sidebar when clicking on navigation links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function() {
            if (this.getAttribute('href').startsWith('#')) {
                closeMobileSidebar();
            }
        });
    });

    // ===== DROPDOWN MENU MOBILE HANDLING =====
    document.querySelectorAll('.sidebar-item').forEach(item => {
        const link = item.querySelector('.sidebar-link');
        const submenu = item.querySelector('.sidebar-submenu');
        
        if (submenu && link) {
            link.addEventListener('click', function(e) {
                if (this.getAttribute('href').startsWith('#')) {
                    e.preventDefault();
                    
                    // Toggle submenu
                    const isOpen = submenu.style.maxHeight && submenu.style.maxHeight !== '0px';
                    
                    // Close all other submenus
                    document.querySelectorAll('.sidebar-submenu').forEach(menu => {
                        menu.style.maxHeight = '0px';
                        menu.style.opacity = '0';
                    });
                    
                    // Toggle current submenu
                    if (!isOpen) {
                        submenu.style.maxHeight = submenu.scrollHeight + 'px';
                        submenu.style.opacity = '1';
                    }
                }
            });
        }
    });

    // Initialize counter observer
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        if (counter.hasAttribute('data-target')) {
            counterObserver.observe(counter);
        }
    });

    // Make functions globally available
    window.openMobileSidebar = openMobileSidebar;
    window.closeMobileSidebar = closeMobileSidebar;
});

// ===== FORM VALIDATION =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== KEYBOARD ACCESSIBILITY =====
document.addEventListener('keydown', function(e) {
    // Close popups/sidebars with Escape key
    if (e.key === 'Escape') {
        closeAcademyPopup();
        if (window.closeMobileSidebar) {
            window.closeMobileSidebar();
        }
    }
});

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c🏢 YPP Website', 'color: #0066CC; font-size: 24px; font-weight: bold;');
console.log('%cBuilt with ❤️ using Vanilla JavaScript', 'color: #666; font-size: 14px;');
console.log('%cContact: yppedu@ypp.co.kr', 'color: #CC0033; font-size: 12px;');

// *********************************************************