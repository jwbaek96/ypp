// YPP Website - Extended JavaScript (빠진 부분들)

// ===== SCROLL TO TOP BUTTON =====
document.addEventListener('DOMContentLoaded', function() {
    // Create scroll to top button if it doesn't exist
    let scrollToTopBtn = document.querySelector('.scroll-to-top');
    if (!scrollToTopBtn) {
        scrollToTopBtn = document.createElement('button');
        scrollToTopBtn.className = 'scroll-to-top';
        scrollToTopBtn.innerHTML = '↑';
        scrollToTopBtn.setAttribute('aria-label', '맨 위로 가기');
        document.body.appendChild(scrollToTopBtn);
    }

    // Show/hide scroll to top button
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    // Scroll to top functionality
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

// ===== FAQ ACCORDION FUNCTIONALITY =====
function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            const content = item.querySelector('.accordion-content');
            const icon = this.querySelector('.accordion-icon');
            
            // Close all other accordions
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.querySelector('.accordion-header').classList.remove('active');
                    otherItem.querySelector('.accordion-content').classList.remove('active');
                    const otherIcon = otherItem.querySelector('.accordion-icon');
                    if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle current accordion
            this.classList.toggle('active');
            content.classList.toggle('active');
            
            if (icon) {
                icon.style.transform = this.classList.contains('active') 
                    ? 'rotate(180deg)' 
                    : 'rotate(0deg)';
            }
        });
    });
}

// ===== TAB FUNCTIONALITY =====
function initTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabGroup = this.closest('.tabs');
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabGroup.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            tabGroup.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const targetContent = tabGroup.querySelector(`[data-tab-content="${tabId}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// ===== SEARCH FUNCTIONALITY =====
function initSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        const container = input.closest('.search-container');
        const clearBtn = container?.querySelector('.search-clear');
        
        // Show/hide clear button
        input.addEventListener('input', function() {
            if (clearBtn) {
                clearBtn.style.display = this.value ? 'block' : 'none';
            }
        });
        
        // Clear search
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                input.value = '';
                this.style.display = 'none';
                input.focus();
                // Trigger search event
                input.dispatchEvent(new Event('input'));
            });
        }
        
        // Search on Enter key
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(this.value);
            }
        });
    });
}

function performSearch(query) {
    console.log(`Searching for: ${query}`);
    // TODO: Implement actual search functionality
}

// ===== FORM VALIDATION ENHANCED =====
function initFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    let isValid = true;
    let errorMessage = '';
    
    // Remove existing error
    const existingError = field.parentElement.querySelector('.form-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Required field check
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = '이 필드는 필수입니다.';
    }
    
    // Email validation
    if (type === 'email' && value && !validateEmail(value)) {
        isValid = false;
        errorMessage = '올바른 이메일 주소를 입력해주세요.';
    }
    
    // Phone validation
    if (type === 'tel' && value && !validatePhone(value)) {
        isValid = false;
        errorMessage = '올바른 전화번호를 입력해주세요.';
    }
    
    // Show error message
    if (!isValid && errorMessage) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = errorMessage;
        field.parentElement.appendChild(errorDiv);
        field.style.borderColor = 'var(--primary-red)';
    } else {
        field.style.borderColor = '';
    }
    
    return isValid;
}

// ===== MODAL FUNCTIONALITY =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ===== TOOLTIP FUNCTIONALITY =====
function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', function() {
            showTooltip(this, this.getAttribute('data-tooltip'));
        });
        
        element.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });
}

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-popup';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: var(--dark-gray);
        color: var(--white);
        padding: 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
    
    setTimeout(() => tooltip.style.opacity = '1', 10);
    
    // Store reference for cleanup
    element._tooltip = tooltip;
}

function hideTooltip() {
    document.querySelectorAll('.tooltip-popup').forEach(tooltip => {
        tooltip.style.opacity = '0';
        setTimeout(() => tooltip.remove(), 300);
    });
}

// ===== LAZY LOADING IMAGES =====
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ===== PROGRESS BAR ANIMATION =====
function animateProgressBar(element, targetPercent) {
    const progressFill = element.querySelector('.progress-fill');
    if (progressFill) {
        let currentPercent = 0;
        const increment = targetPercent / 50; // 50 frames for smooth animation
        
        const timer = setInterval(() => {
            currentPercent += increment;
            progressFill.style.width = Math.min(currentPercent, targetPercent) + '%';
            
            if (currentPercent >= targetPercent) {
                clearInterval(timer);
            }
        }, 20);
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        color: white;
        z-index: 9999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
        info: 'var(--primary-blue)',
        success: '#28a745',
        warning: '#ffc107',
        error: 'var(--primary-red)'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.style.transform = 'translateX(0)', 10);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// ===== INITIALIZE ALL COMPONENTS =====
document.addEventListener('DOMContentLoaded', function() {
    initAccordion();
    initTabs();
    initSearch();
    initFormValidation();
    initTooltips();
    initLazyLoading();
    
    // Initialize modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-backdrop');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Close modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });
});

// Make functions globally available
window.openModal = openModal;
window.closeModal = closeModal;
window.showNotification = showNotification;
window.animateProgressBar = animateProgressBar;