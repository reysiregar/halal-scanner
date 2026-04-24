// Show the existing welcome modal on first visit per session
document.addEventListener('DOMContentLoaded', function() {
    var welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal && !sessionStorage.getItem('welcomeModalShown')) {
        welcomeModal.classList.remove('hidden');
        sessionStorage.setItem('welcomeModalShown', 'true');
    }
});
// Import configuration
import { getApiUrl, API_ENDPOINTS } from './config.js';

const NOTIFICATION_ICON_MAP = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
    question: 'fa-circle-question'
};

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getHalalAuthenticityTipsHtml() {
    return `
        <div class="halal-authenticity-tips mt-3">
            <h4 class="font-medium mb-2">Quick Halal Checks</h4>
            <ul class="quick-halal-checks text-sm">
                <li><strong>Logo:</strong> look for an official halal mark.</li>
                <li><strong>Ingredients:</strong> avoid unclear animal-based sources.</li>
                <li><strong>Plant-based:</strong> prefer botanical or vegetable ingredients.</li>
            </ul>
        </div>
    `;
}

function getOrCreateToastRoot() {
    let root = document.getElementById('hsToastRoot');
    if (!root) {
        root = document.createElement('div');
        root.id = 'hsToastRoot';
        root.className = 'hs-toast-root';
        document.body.appendChild(root);
    }
    return root;
}

function showToast(options = {}) {
    const {
        type = 'info',
        title = 'Notice',
        text = '',
        timer = 3200
    } = options;

    const root = getOrCreateToastRoot();
    const iconClass = NOTIFICATION_ICON_MAP[type] || NOTIFICATION_ICON_MAP.info;
    const safeTitle = escapeHtml(title);
    const safeText = escapeHtml(text);
    const toast = document.createElement('div');
    toast.className = `hs-toast hs-toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${iconClass}" aria-hidden="true"></i>
        <div class="hs-toast-content">
            <p class="hs-toast-title">${safeTitle}</p>
            ${text ? `<p class="hs-toast-text">${safeText}</p>` : ''}
        </div>
        <button type="button" class="hs-toast-close" aria-label="Close notification">
            <i class="fas fa-xmark" aria-hidden="true"></i>
        </button>
    `;

    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const closeToast = () => {
        toast.classList.remove('is-visible');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 180);
    };

    const closeBtn = toast.querySelector('.hs-toast-close');
    if (closeBtn) closeBtn.addEventListener('click', closeToast);
    if (timer > 0) setTimeout(closeToast, timer);
}

function showAlert(options = {}) {
    const {
        icon = 'info',
        title = 'Notice',
        text = '',
        html = '',
        confirmButtonText = 'OK',
        cancelButtonText = 'Cancel',
        showCancelButton = false,
        showConfirmButton = true,
        allowOutsideClick = true,
        timer
    } = options;

    return new Promise((resolve) => {
        const safeTitle = escapeHtml(title);
        const safeText = escapeHtml(text);
        const safeConfirmText = escapeHtml(confirmButtonText);
        const safeCancelText = escapeHtml(cancelButtonText);
        const overlay = document.createElement('div');
        overlay.className = 'hs-alert-overlay';
        overlay.innerHTML = `
            <div class="hs-alert-card" role="dialog" aria-modal="true" aria-live="polite">
                <h3 class="hs-alert-title">${safeTitle}</h3>
                <div class="hs-alert-body">${html || `<p>${safeText}</p>`}</div>
                <div class="hs-alert-actions">
                    ${showCancelButton ? `<button type="button" class="hs-alert-btn hs-alert-cancel">${safeCancelText}</button>` : ''}
                    ${showConfirmButton ? `<button type="button" class="hs-alert-btn hs-alert-confirm">${safeConfirmText}</button>` : ''}
                </div>
            </div>
        `;

        let isClosed = false;
        const close = (result) => {
            if (isClosed) return;
            isClosed = true;
            document.removeEventListener('keydown', onEsc);
            overlay.classList.remove('is-visible');
            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                resolve(result);
            }, 140);
        };

        const onEsc = (event) => {
            if (event.key === 'Escape') {
                close({ isConfirmed: false, isDismissed: true });
            }
        };

        const confirmBtn = overlay.querySelector('.hs-alert-confirm');
        const cancelBtn = overlay.querySelector('.hs-alert-cancel');

        if (confirmBtn) confirmBtn.addEventListener('click', () => close({ isConfirmed: true, isDismissed: false }));
        if (cancelBtn) cancelBtn.addEventListener('click', () => close({ isConfirmed: false, isDismissed: true }));

        if (allowOutsideClick) {
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    close({ isConfirmed: false, isDismissed: true });
                }
            });
        }

        document.addEventListener('keydown', onEsc);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('is-visible'));

        if (typeof timer === 'number' && timer > 0) {
            setTimeout(() => close({ isConfirmed: false, isDismissed: true, isTimedOut: true }), timer);
        }
    });
}

// Modal handling with null checks
const signInModal = document.getElementById('signInModal');
const signUpModal = document.getElementById('signUpModal');
const disclaimerModal = document.getElementById('disclaimerModal');
const closeDisclaimer = document.getElementById('closeDisclaimer');
const acceptDisclaimer = document.getElementById('acceptDisclaimer');
const welcomeModal = document.getElementById('welcomeModal');
const closeWelcome = document.getElementById('closeWelcome');
const acceptWelcome = document.getElementById('acceptWelcome');
const declineWelcome = document.getElementById('declineWelcome');
const closeSignIn = document.getElementById('closeSignIn');
const closeSignUp = document.getElementById('closeSignUp');
const showSignUp = document.getElementById('showSignUp');
const showSignIn = document.getElementById('showSignIn');
const signInButton = document.getElementById('signInBtn');
const mobileSignInButton = document.getElementById('mobileSignInBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
const backToTopBtn = document.getElementById('backToTopBtn');

if (backToTopBtn) {
    const updateBackToTopVisibility = () => {
        const shouldShow = window.innerWidth < 768 && window.scrollY > 360 && !(mobileMenu && mobileMenu.classList.contains('open'));
        backToTopBtn.classList.toggle('is-visible', shouldShow);
    };

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    window.addEventListener('resize', updateBackToTopVisibility);
    updateBackToTopVisibility();
}

if (mobileMenuBtn && mobileMenu) {
    const MOBILE_BREAKPOINT = 768;

    const isMobileViewport = () => window.innerWidth <= MOBILE_BREAKPOINT;

    const closeMobileMenu = () => {
        mobileMenuBtn.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        if (mobileMenuBackdrop) mobileMenuBackdrop.classList.remove('open');
        document.body.classList.remove('mobile-menu-open');
    };

    const openMobileMenu = () => {
        mobileMenuBtn.classList.add('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenu.classList.add('open');
        if (mobileMenuBackdrop) mobileMenuBackdrop.classList.add('open');
        document.body.classList.add('mobile-menu-open');
    };

    mobileMenuBtn.addEventListener('click', () => {
        if (isMobileViewport()) {
            if (mobileMenu.classList.contains('open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }
    });

    if (mobileMenuBackdrop) {
        mobileMenuBackdrop.addEventListener('click', closeMobileMenu);
    }

    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a, .mobile-menu-action').forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        }
    });

    // Close menu on window resize if it's open
    window.addEventListener('resize', () => {
        if (!isMobileViewport()) {
            closeMobileMenu();
        }
    });
}

if (closeSignIn) {
    closeSignIn.addEventListener('click', (e) => {
        // Prevent default to avoid accidental reload if inside a form
        e.preventDefault();
        if (signInModal) signInModal.classList.add('hidden');
    });
}

if (closeSignUp) {
    closeSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        if (signUpModal) signUpModal.classList.add('hidden');
    });
}

if (showSignUp) {
    showSignUp.addEventListener('click', (e) => {
        e.preventDefault();
        if (signInModal) signInModal.classList.add('hidden');
        if (signUpModal) signUpModal.classList.remove('hidden');
    });
}

if (showSignIn) {
    showSignIn.addEventListener('click', (e) => {
        e.preventDefault();
        if (signUpModal) signUpModal.classList.add('hidden');
        if (signInModal) signInModal.classList.remove('hidden');
    });
}

if (!localStorage.getItem('disclaimerAccepted') && disclaimerModal) {
    disclaimerModal.classList.remove('hidden');
}

// Close disclaimer
if (closeDisclaimer) {
    closeDisclaimer.addEventListener('click', function(e) {
        e.preventDefault();
        if (disclaimerModal) disclaimerModal.classList.add('hidden');
        // Optionally show welcome after closing disclaimer without accepting
        if (welcomeModal) welcomeModal.classList.remove('hidden');
    });
}

// Accept disclaimer
if (acceptDisclaimer) {
    acceptDisclaimer.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.setItem('disclaimerAccepted', 'true');
        if (disclaimerModal) disclaimerModal.classList.add('hidden');
        // Show welcome modal after accepting disclaimer
        if (welcomeModal) welcomeModal.classList.remove('hidden');
    });
}

// Welcome modal handlers
function closeWelcomeModal() {
    if (welcomeModal) {
        welcomeModal.classList.add('hidden');
        sessionStorage.setItem('welcomeShown', 'true');
    }
}

if (closeWelcome) {
    closeWelcome.addEventListener('click', function(e) {
        e.preventDefault();
        closeWelcomeModal();
    });
}

if (acceptWelcome) {
    acceptWelcome.addEventListener('click', function(e) {
        e.preventDefault();
        closeWelcomeModal();
    });
}

if (declineWelcome) {
    declineWelcome.addEventListener('click', function(e) {
        e.preventDefault();
        closeWelcomeModal();
    });
}

// Toggle FAQ answers — uses CSS-driven max-height animation via .faq-open class
const faqButtons = document.querySelectorAll('.faq-question');
if (faqButtons.length > 0) {
    faqButtons.forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            if (!answer || !answer.classList.contains('faq-answer')) return;

            const isOpen = answer.classList.contains('faq-open');

            // Close any other open answer
            document.querySelectorAll('.faq-answer.faq-open').forEach(openAns => {
                if (openAns !== answer) {
                    openAns.classList.remove('faq-open');
                    const openBtn = openAns.previousElementSibling;
                    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle this one
            answer.classList.toggle('faq-open', !isOpen);
            this.setAttribute('aria-expanded', String(!isOpen));
        });
    });
}

// Utility function to detect mobile
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// Open live scanner
const startLiveScan = document.getElementById('startLiveScan');
if (startLiveScan) {
    startLiveScan.addEventListener('click', function(e) {
        e.preventDefault();
        if (!isMobileDevice()) {
            showAlert({
                icon: 'info',
                title: 'Mobile Only Feature',
                text: 'This feature can only be used in Mobile phone.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        const scannerSection = document.getElementById('scannerSection');
        const uploadAnalysisSection = document.getElementById('uploadAnalysisSection');
        if (scannerSection) scannerSection.classList.remove('hidden');
        if (uploadAnalysisSection) uploadAnalysisSection.classList.add('hidden');
        startCamera();
    });
}

// Close scanner
const closeScanner = document.getElementById('closeScanner');
if (closeScanner) {
    closeScanner.addEventListener('click', function(e) {
        e.preventDefault();
        const scannerSection = document.getElementById('scannerSection');
        if (scannerSection) scannerSection.classList.add('hidden');
        stopCamera();
    });
}

// Open upload analysis
const uploadImageBtn = document.getElementById('uploadImageBtn');
if (uploadImageBtn) {
    uploadImageBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const uploadAnalysisSection = document.getElementById('uploadAnalysisSection');
        const scannerSection = document.getElementById('scannerSection');
        const imageUpload = document.getElementById('imageUpload');
        if (uploadAnalysisSection) uploadAnalysisSection.classList.remove('hidden');
        if (scannerSection) scannerSection.classList.add('hidden');
        if (imageUpload) imageUpload.click();
    });
}

const uploadImageBtn2 = document.getElementById('uploadImageBtn2');
if (uploadImageBtn2) {
    uploadImageBtn2.addEventListener('click', function(e) {
        e.preventDefault();
        const imageUpload = document.getElementById('imageUpload');
        if (imageUpload) imageUpload.click();
    });
}

// Close upload analysis
const closeUploadAnalysis = document.getElementById('closeUploadAnalysis');
if (closeUploadAnalysis) {
    closeUploadAnalysis.addEventListener('click', function(e) {
        e.preventDefault();
        const uploadAnalysisSection = document.getElementById('uploadAnalysisSection');
        if (uploadAnalysisSection) uploadAnalysisSection.classList.add('hidden');
    });
}

// Handle image upload
const imageUpload = document.getElementById('imageUpload');
if (imageUpload) {
    imageUpload.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showAlert({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please select a valid image file.',
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showAlert({
                    icon: 'error',
                    title: 'File Too Large',
                    text: 'File size must be less than 5MB.',
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const uploadedImagePreview = document.getElementById('uploadedImagePreview');
                const uploadPlaceholder = document.getElementById('uploadPlaceholder');
                const uploadLoadingIndicator = document.getElementById('uploadLoadingIndicator');
                const uploadResultsContainer = document.getElementById('uploadResultsContainer');
                
                if (uploadedImagePreview) uploadedImagePreview.src = event.target.result;
                if (uploadedImagePreview) uploadedImagePreview.classList.remove('hidden');
                if (uploadPlaceholder) uploadPlaceholder.classList.add('hidden');
                
                // Show loading indicator
                if (uploadLoadingIndicator) uploadLoadingIndicator.classList.remove('hidden');
                if (uploadResultsContainer) uploadResultsContainer.classList.add('hidden');
                
                // Scroll to Image Analysis section
                const analysisSection = document.getElementById('uploadAnalysisSection');
                if (analysisSection) analysisSection.scrollIntoView({ behavior: 'smooth' });
                // Immediately start analysis
                analyzeUploadedImage();
            };
            
            reader.readAsDataURL(file);
        }
    });
}

// Handle manual test analysis
const testAnalysisBtn = document.getElementById('testAnalysisBtn');
if (testAnalysisBtn) {
    testAnalysisBtn.addEventListener('click', async function() {
        const manualIngredients = document.getElementById('manualIngredients');
        if (!manualIngredients || !manualIngredients.value.trim()) {
            showAlert({
                icon: 'warning',
                title: 'No Ingredients Entered',
                text: 'Please enter some ingredients to analyze.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#4f46e5'
            });
            return;
        }
        
        const ingredients = manualIngredients.value.trim();
        
        // Show loading indicator
        const uploadLoadingIndicator = document.getElementById('uploadLoadingIndicator');
        const uploadResultsContainer = document.getElementById('uploadResultsContainer');
        
        if (uploadLoadingIndicator) uploadLoadingIndicator.classList.remove('hidden');
        if (uploadResultsContainer) uploadResultsContainer.classList.add('hidden');
        
        try {
            const response = await fetch(getApiUrl(API_ENDPOINTS.ANALYZE_INGREDIENTS), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ingredients: ingredients
                })
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            const analysis = data.analysis;
            
            if (uploadLoadingIndicator) uploadLoadingIndicator.classList.add('hidden');
            
            // Generate results HTML based on analysis
            let resultsHTML = `
                <div>
                    <h3 class="text-xl font-bold mb-4">Analysis Results</h3>
                    <div class="space-y-3 mb-6">
            `;
            
            // Add halal ingredients
            analysis.halal.forEach(item => {
                resultsHTML += `
                    <div class="flex items-start p-4 bg-green-50 rounded-lg">
                        <div class="halal-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Halal</div>
                        <div>
                            <h4 class="font-medium">${item.ingredient}</h4>
                            <p class="text-sm text-gray-600">${item.explanation}</p>
                        </div>
                    </div>
                `;
            });
            
            // Add haram ingredients
            analysis.haram.forEach(item => {
                resultsHTML += `
                    <div class="flex items-start p-4 bg-red-50 rounded-lg">
                        <div class="haram-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Haram</div>
                        <div>
                            <h4 class="font-medium">${item.ingredient}</h4>
                            <p class="text-sm text-gray-600">${item.explanation}</p>
                        </div>
                    </div>
                `;
            });
            
            // Add mashbooh ingredients
            analysis.mashbooh.forEach(item => {
                resultsHTML += `
                    <div class="flex items-start p-4 bg-yellow-50 rounded-lg">
                        <div class="mashbooh-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Mashbooh</div>
                        <div>
                            <h4 class="font-medium">${item.ingredient}</h4>
                            <p class="text-sm text-gray-600">${item.explanation}</p>
                        </div>
                    </div>
                `;
            });
            
            // Add unknown ingredients
            analysis.unknown.forEach(item => {
                resultsHTML += `
                    <div class="flex items-start p-4 bg-gray-50 rounded-lg">
                        <div class="unknown-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Unknown</div>
                        <div>
                            <h4 class="font-medium">${item.ingredient}</h4>
                            <p class="text-sm text-gray-600">${item.explanation}</p>
                        </div>
                    </div>
                `;
            });
            
            // Add overall status
            let statusText = '';
            let statusColor = '';
            let statusDescription = '';
            
            switch(analysis.overallStatus) {
                case 'haram':
                    statusText = 'Contains Haram Ingredients';
                    statusColor = 'text-red-600';
                    statusDescription = 'The ingredients that you entered are considered haram. We recommend looking for halal-certified alternatives.';
                    break;
                case 'mashbooh':
                    statusText = 'Contains Mashbooh Ingredients';
                    statusColor = 'text-yellow-600';
                    statusDescription = 'This product contains ingredients that require further verification. We recommend checking for halal certification or contacting the manufacturer.';
                    break;
                case 'unknown':
                    statusText = 'Contains Unknown Ingredients';
                    statusColor = 'text-gray-600';
                    statusDescription = 'Some ingredients could not be classified. We recommend further research or consultation with a scholar.';
                    break;
                default:
                    statusText = 'Halal Product';
                    statusColor = 'text-green-600';
                    statusDescription = 'All analyzed ingredients appear to be halal.';
            }
            
            resultsHTML += `
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-medium mb-2">Ingredients Status: <span class="${statusColor}">${statusText}</span></h4>
                        <p class="text-sm text-gray-600">${statusDescription}</p>
                        ${getHalalAuthenticityTipsHtml()}
                    </div>
                    <div class="scan-result-actions scan-result-actions--two mt-6">
                        <button type="button" data-action="report-inaccuracy" class="scan-result-action scan-result-action-report px-4 py-2 rounded-lg text-sm font-medium">
                            <i class="fas fa-flag mr-1"></i> Report Inaccuracy
                        </button>
                        <button type="button" class="scan-result-action scan-result-action-save bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                            <i class="fas fa-save mr-1"></i> Save Results
                        </button>
                    </div>
                </div>
            `;
            
            if (uploadResultsContainer) {
                uploadResultsContainer.innerHTML = resultsHTML;
                uploadResultsContainer.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
            if (uploadLoadingIndicator) uploadLoadingIndicator.classList.add('hidden');
            
            // Show error message
            const errorHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-700">Analysis Failed</h3>
                    <p class="text-gray-500 mt-2">Unable to analyze ingredients. Please try again.</p>
                </div>
            `;
            
            if (uploadResultsContainer) {
                uploadResultsContainer.innerHTML = errorHTML;
                uploadResultsContainer.classList.remove('hidden');
            }
        }
    });
}

// Camera functionality
let stream = null;
let usingFrontCamera = false; // Track which camera is in use

// Cleanup function for camera
function cleanupCamera() {
    if (stream) {
        stream.getTracks().forEach(track => {
            track.stop();
        });
        stream = null;
    }
    
    // Reset enhanced camera state
    currentMediaTrack = null;
    isFlashlightOn = false;
    updateFlashlightButtonState();
}

// Cleanup on page unload and page hide
window.addEventListener('beforeunload', cleanupCamera);
window.addEventListener('pagehide', cleanupCamera);

// Function to setup video element for mobile
function setupVideoElement() {
    const video = document.getElementById('cameraFeed');
    if (!video) return null;
    
    // Add required attributes for mobile browsers
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    
    // Ensure the video element is properly sized
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.display = 'block';
    
    return video;
}

// Start camera with error handling
async function startCamera() {
    // Check if we're on HTTPS (required for camera access on most browsers)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && !window.location.hostname.endsWith('.local')) {
        showCameraError('Camera access requires a secure connection (HTTPS) or localhost.');
        return;
    }

    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showCameraError('Camera access is not supported by your browser.');
        return;
    }

    const video = setupVideoElement();
    if (!video) {
        showCameraError('Camera feed element not found.');
        return;
    }

    // Optional fullscreen overlay used by autoplay fallback paths.
    const loadingIndicator = document.querySelector('.fixed.inset-0.bg-black');

    try {
        cleanupCamera();
        
        // Request camera access with improved error handling
        stream = await navigator.mediaDevices.getUserMedia(
            getCameraConstraints(usingFrontCamera)
        ).catch(error => {
            console.error('Camera access error:', error);
            throw error;
        });
        
        // Set the video source
        video.srcObject = stream;
        
        // Track the video track for advanced controls
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
            currentMediaTrack = videoTracks[0];
        }
        
        // Handle different browser implementations
        if ('srcObject' in video) {
            video.srcObject = stream;
        } else {
            // For older browsers
            video.src = window.URL.createObjectURL(stream);
        }
        
        // iOS specific handling
        video.setAttribute('playsinline', true);
        video.setAttribute('webkit-playsinline', true);
        video.setAttribute('muted', true);
        video.setAttribute('autoplay', true);
        
        // Play the video with improved error handling
        const playPromise = video.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Video play error:', error);
                // If autoplay fails, show a play button
                showPlayButton(video);
            });
        }
        
        // Hide loading indicator when video is playing and scroll to scanner section
        video.onplaying = () => {
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.remove();
            }
            video.onplaying = null; // Clean up
            
            // Set up enhanced camera features
            setupTapToFocus();
            setupScanningTips();
            
            // Smooth scroll to the scanner section
            const scannerSection = document.getElementById('scannerSection');
            if (scannerSection) {
                setTimeout(() => {
                    scannerSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100); // Small delay to ensure the UI is ready
            }
        };
        
        // Fallback in case onplaying doesn't fire
        setTimeout(() => {
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.remove();
            }
        }, 3000);
        
    } catch (error) {
        // Remove loading indicator if it exists
        const loadingIndicator = document.querySelector('.fixed.inset-0.bg-black');
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.remove();
        }
        
        handleCameraError(error);
    }
}

// Function to get camera constraints
function getCameraConstraints(useFrontCamera = false) {
    // For mobile devices, prefer the environment (back) camera by default
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    return {
        video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            // On mobile, prefer the environment (back) camera by default
            facingMode: isMobile && !useFrontCamera ? 'environment' : 'user',
            frameRate: { ideal: 24, max: 30 },
            // Add these for better mobile compatibility
            resizeMode: 'cover',
            aspectRatio: { ideal: 16/9 }
        },
        audio: false
    };
}

// ...

// Show play button when autoplay is blocked
function showPlayButton(video) {
    // Remove any existing play buttons first
    const existingButton = document.querySelector('.camera-play-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const playButton = document.createElement('button');
    playButton.className = 'camera-play-button fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
    playButton.innerHTML = `
        <div class="bg-white p-6 rounded-lg text-center max-w-xs mx-4">
            <i class="fas fa-camera text-4xl text-indigo-600 mb-3"></i>
            <h3 class="font-bold text-lg mb-2">Camera Access Needed</h3>
            <p class="text-gray-600 text-sm mb-4">Tap to allow camera access and start scanning ingredients.</p>
            <div class="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium">
                Enable Camera
            </div>
        </div>
    `;
    
    // Add a small delay before showing the button to prevent immediate dismissal
    setTimeout(() => {
        document.body.appendChild(playButton);
        
        // Add click handler with error handling
        const clickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Show a loading indicator
            playButton.innerHTML = `
                <div class="flex flex-col items-center">
                    <div class="scanner-animation mb-3">
                        <div class="scanner-line"></div>
                    </div>
                    <p class="text-gray-700">Starting camera...</p>
                </div>
            `;
            
            video.play()
                .then(() => {
                    playButton.remove();
                })
                .catch(error => {
                    console.error('Error starting video:', error);
                    showCameraError('Failed to start camera. Please check permissions and try again.');
                    playButton.remove();
                });
            
            // Remove the click handler to prevent multiple clicks
            playButton.onclick = null;
        };
        
        playButton.onclick = clickHandler;
        
        // Also allow tapping anywhere on the screen to start
        document.addEventListener('click', clickHandler, { once: true });
    }, 300);
}

// Show camera error message
function showCameraError(message) {
    showAlert({
        icon: 'error',
        title: 'Camera Access Error',
        text: message,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'OK'
    });
}

// Stop camera and clean up
function stopCamera() {
    cleanupCamera();
    const video = document.getElementById('cameraFeed');
    if (video) {
        video.srcObject = null;
    }
}

// Camera switch functionality is disabled to ensure only rear camera is used
const switchCamera = document.getElementById('switchCamera');
if (switchCamera) {
    // Hide the switch camera button
    switchCamera.style.display = 'none';
}

// Enhanced camera controls
let isFlashlightOn = false;
let currentMediaTrack = null;

function updateFlashlightButtonState() {
    const flashlightBtn = document.getElementById('flashlightBtn');
    if (!flashlightBtn) return;

    flashlightBtn.classList.toggle('flashlight-on', isFlashlightOn);
    flashlightBtn.setAttribute('aria-pressed', String(isFlashlightOn));
    flashlightBtn.title = isFlashlightOn ? 'Turn flashlight off' : 'Turn flashlight on';
    flashlightBtn.innerHTML = isFlashlightOn
        ? '<i class="fas fa-bolt-lightning" aria-hidden="true"></i><span>Flash Off</span>'
        : '<i class="fas fa-bolt" aria-hidden="true"></i><span>Flash On</span>';
}

// Flashlight toggle functionality
const flashlightBtn = document.getElementById('flashlightBtn');
if (flashlightBtn) {
    flashlightBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        await toggleFlashlight();
    });
}

async function toggleFlashlight() {
    try {
        if (currentMediaTrack && currentMediaTrack.getCapabilities) {
            const capabilities = currentMediaTrack.getCapabilities();
            if (capabilities.torch) {
                isFlashlightOn = !isFlashlightOn;
                await currentMediaTrack.applyConstraints({
                    advanced: [{ torch: isFlashlightOn }]
                });

                updateFlashlightButtonState();
            } else {
                console.log('Flashlight not supported on this device');
            }
        }
    } catch (error) {
        console.error('Error toggling flashlight:', error);
    }
}

// Tap-to-focus functionality
function setupTapToFocus() {
    const video = document.getElementById('cameraFeed');
    if (!video) return;

    video.addEventListener('click', async function(e) {
        if (!currentMediaTrack) return;

        const rect = video.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Show focus ring animation
        showFocusRing(e.clientX - rect.left, e.clientY - rect.top);

        try {
            const capabilities = currentMediaTrack.getCapabilities();
            if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
                await currentMediaTrack.applyConstraints({
                    advanced: [{
                        focusMode: 'manual',
                        pointsOfInterest: [{ x: x, y: y }]
                    }]
                });
            }
        } catch (error) {
            console.log('Tap-to-focus not supported:', error);
        }
    });
}

function showFocusRing(x, y) {
    const video = document.getElementById('cameraFeed');
    if (!video) return;

    // Remove any existing focus rings
    const existingRings = video.parentNode.querySelectorAll('.focus-ring');
    existingRings.forEach(ring => ring.remove());

    // Create new focus ring
    const focusRing = document.createElement('div');
    focusRing.className = 'focus-ring';
    focusRing.style.left = (x - 40) + 'px';
    focusRing.style.top = (y - 40) + 'px';
    
    video.parentNode.appendChild(focusRing);
    
    // Remove focus ring after animation
    setTimeout(() => {
        focusRing.remove();
    }, 1000);
}

// Auto-hide scanning tips after 4 seconds
function setupScanningTips() {
    const tips = document.getElementById('scanningTips');
    if (tips) {
        setTimeout(() => {
            tips.classList.add('scanning-tips-fade');
            setTimeout(() => {
                tips.style.display = 'none';
            }, 1000);
        }, 4000);
    }
}

// Capture image from camera
const captureBtn = document.getElementById('captureBtn');
if (captureBtn) {
    captureBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const video = document.getElementById('cameraFeed');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const resultsContainer = document.getElementById('resultsContainer');
        if (!video || !video.srcObject) {
            showAlert({
                icon: 'error',
                title: 'Camera Not Ready',
                text: 'Camera is not ready. Please wait a moment and try again.',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
        if (resultsContainer) {
            resultsContainer.classList.add('hidden');
        }
        updateProgress(0, 'Starting scan...');

        // Hide the camera card (which includes camera preview and Capture/Switch buttons)
        const cameraCard = document.getElementById('cameraCard');
        if (cameraCard) cameraCard.classList.add('hidden');

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        stopCamera();
        
        // Call analysis immediately without delay
        analyzeCapturedImage(canvas.toDataURL('image/jpeg'));
    });
}

// Add Tesseract.js import for browser usage
// <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.0.1/dist/tesseract.min.js"></script>
// If using npm, Tesseract will be available as window.Tesseract

// Utility: Detect if text contains an ingredient list
function extractIngredientList(text) {
    const lines = text.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    let startIdx = -1;
    // Find the line with 'ingredient'
    for (let i = 0; i < lines.length; i++) {
        if (/ingredient/i.test(lines[i])) {
            startIdx = i;
            break;
        }
    }
    // If found, collect lines after 'ingredient' line
    if (startIdx !== -1) {
        let collected = [];
        for (let i = startIdx; i < lines.length; i++) {
            let line = lines[i];
            // Remove the 'ingredients' label from the first line
            if (i === startIdx) {
                line = line.replace(/.*ingredient[s]?:?/i, '').trim();
            }
            // Stop if line is a clear non-ingredient section
            if (/^(CONTAINS|PRODUCED|MAY CONTAIN|ALLERGEN|PRODUCTS THAT|FRIED|NOODLES|SEASONING|SWEET|CHILI|OIL|SAUCE|SHALLOT|\s*[A-Z\s]{4,}\s*\:)/.test(line) && i !== startIdx) break;
            // Skip section headers but keep their contents
            if (/^[A-Z\s]+:$/.test(line)) continue;
            if (line) collected.push(line);
        }
        // Join all collected lines
        let result = collected.join(' ')
            .replace(/(NOODLES|SEASONING POWDER|SEASONING OIL|SWEET SOY SAUCE|CHILI SAUCE|FRIED SHALLOT)\:?/gi, '')
            .replace(/\s+/g, ' ')
            .replace(/\(.*?\)/g, '') // remove parenthesis content
            .replace(/\s+,/g, ',')
            .replace(/,+/g, ',')
            .replace(/\b(and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that)\b/gi, '') // remove non-ingredient words
            .replace(/\s{2,}/g, ' ')
            .trim();
        // Remove trailing section headers
        result = result.replace(/(CONTAINS|PRODUCED|MAY CONTAIN|ALLERGEN|PRODUCTS THAT|FRIED|NOODLES|SEASONING|SWEET|CHILI|OIL|SAUCE|SHALLOT).*/i, '').trim();
        if (result.length > 0) return result;
    }
    // Fallback: join all lines with commas and not all uppercase
    let fallback = lines.filter(line => line.split(',').length > 1 && !/^[A-Z\s]+$/.test(line)).join(' ');
    return fallback.length > 0 ? fallback : null;
}

// Heuristic: Detect if a line is likely an ingredient
function isLikelyIngredient(line) {
    const foodKeywords = [
        'salt', 'oil', 'sugar', 'flour', 'extract', 'gum', 'acid', 'starch', 'protein', 'spice', 'herb', 'flavour', 'flavor', 'color', 'colour', 'preservative', 'emulsifier', 'thickener', 'lecithin', 'yeast', 'enzyme', 'vitamin', 'whey', 'milk', 'egg', 'soy', 'bean', 'corn', 'wheat', 'gluten', 'dextrose', 'malt', 'monosodium', 'glutamate', 'e', 'powder', 'onion', 'garlic', 'pepper', 'seasoning', 'shallot', 'caramel', 'citrate', 'benzoate', 'sorbate', 'carbonate', 'phosphate', 'lactate', 'pectin', 'pectins', 'casein', 'caseinate', 'carrageenan', 'agar', 'xanthan', 'pectin', 'sorbitol', 'mannitol', 'aspartame', 'sucralose', 'saccharin', 'maltodextrin', 'fructose', 'glucose', 'honey', 'molasses', 'syrup', 'vinegar', 'mustard', 'celery', 'cocoa', 'chocolate', 'fruit', 'vegetable', 'juice', 'concentrate', 'fiber', 'fibre', 'seed', 'nut', 'sesame', 'sunflower', 'canola', 'rapeseed', 'palm', 'coconut', 'olive', 'soybean', 'peanut', 'almond', 'cashew', 'hazelnut', 'walnut', 'pistachio', 'macadamia', 'brazil', 'pecan', 'pine', 'chestnut', 'date', 'raisin', 'apricot', 'fig', 'prune', 'plum', 'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'berry', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry', 'melon', 'watermelon', 'cantaloupe', 'honeydew', 'mango', 'papaya', 'pineapple', 'kiwi', 'guava', 'passion', 'dragon', 'lychee', 'longan', 'rambutan', 'durian', 'jackfruit', 'soursop', 'starfruit', 'carambola', 'tamarind', 'avocado', 'olive', 'artichoke', 'asparagus', 'beet', 'broccoli', 'brussels', 'cabbage', 'carrot', 'cauliflower', 'celery', 'chard', 'chicory', 'collard', 'corn', 'cress', 'cucumber', 'dandelion', 'edamame', 'eggplant', 'endive', 'fennel', 'garlic', 'ginger', 'horseradish', 'jicama', 'kale', 'kohlrabi', 'leek', 'lettuce', 'mushroom', 'okra', 'onion', 'parsnip', 'pea', 'pepper', 'potato', 'pumpkin', 'radish', 'rutabaga', 'shallot', 'spinach', 'squash', 'sweet', 'tomato', 'turnip', 'yam', 'zucchini'
    ];
    if (!line || typeof line !== 'string') return false;
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 200) return false;
    if (/^[A-Z\s]+:?$/.test(trimmed)) return false; // all uppercase or section header
    if (/:$/.test(trimmed)) return false; // ends with colon
    if (!/[,;]/.test(trimmed)) return false; // must have comma or semicolon
    const lower = trimmed.toLowerCase();
    // Must contain at least one food keyword
    if (!foodKeywords.some(word => lower.includes(word))) return false;
    return true;
}

// Add this utility function for improved ingredient extraction and deduplication
function getCleanedIngredientListFromOCR(ocrText) {
    // Try to extract using the section-based method first
    let extracted = extractIngredientList(ocrText);
    if (!extracted) {
        // Fallback: use all lines that look like ingredients
        const lines = ocrText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
        extracted = lines.filter(isLikelyIngredient).join(', ');
    }
    // Split by comma/semicolon, trim, dedupe, filter out empty, and remove non-ingredient words/symbols
    const ingredients = Array.from(
        new Set(
            extracted
                .split(/[,;]/)
                .map(i => i.trim())
                .filter(i => i.length > 0)
                .map(i => i.replace(/\(.*?\)/g, '')) // remove parenthesis content
                .map(i => i.replace(/\b(and|or|with|from|of|the|a|an|may contain|contains|produced|allergen|products that)\b/gi, '')) // remove non-ingredient words
                .map(i => i.replace(/[^a-zA-Z0-9\-\s]/g, '')) // remove most symbols except dash
                .map(i => i.replace(/\s{2,}/g, ' '))
                .map(i => i.trim())
        )
    );
    return ingredients.join(', ');
}

function isPlausibleIngredientList(ingredientText) {
    if (!ingredientText || typeof ingredientText !== 'string') return false;

    const items = ingredientText
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    if (items.length >= 2) return true;
    if (items.length === 1) return items[0].split(/\s+/).length >= 2;
    return false;
}

// Utility to check if OCR text is likely an ingredient list
function isLikelyIngredientList(text) {
    if (!text || typeof text !== 'string') return false;
    
    // Clean the text for better matching
    const cleanText = text.replace(/[^\w\s,.-]/g, ' ').replace(/\s+/g, ' ').toLowerCase();
    
    // Check for common ingredient list indicators
    const indicators = [
        'ingredient', 'bahan', 'mengandung', 'mengandungi', 'contains',
        'materials', 'komposisi', 'komposition', 'zusammensetzung', 'ingrédients',
        'ingredientes', 'ingredienti', 'ingredienser', 'ingredienser', 'ingredienser',
        'ingredienser', 'ingredienser', 'ingredienser', 'ingredienser', 'ingredienser'
    ];
    
    // Check for indicators in the first few lines
    const firstLines = cleanText.split('\n').slice(0, 5).join(' ');
    const hasIndicator = indicators.some(indicator => firstLines.includes(indicator));
    
    // Common food-related keywords
    const foodKeywords = [
        'salt', 'oil', 'sugar', 'flour', 'extract', 'gum', 'acid', 'starch', 'protein',
        'spice', 'herb', 'flavour', 'flavor', 'color', 'colour', 'preservative', 'emulsifier',
        'thickener', 'lecithin', 'yeast', 'enzyme', 'vitamin', 'whey', 'milk', 'egg', 'soy',
        'bean', 'corn', 'wheat', 'gluten', 'dextrose', 'malt', 'monosodium', 'glutamate',
        'powder', 'onion', 'garlic', 'pepper', 'seasoning', 'shallot', 'caramel', 'citrate',
        'benzoate', 'sorbate', 'carbonate', 'phosphate', 'lactate', 'pectin', 'casein',
        'carrageenan', 'agar', 'xanthan', 'sorbitol', 'mannitol', 'aspartame', 'sucralose',
        'saccharin', 'maltodextrin', 'fructose', 'glucose', 'honey', 'molasses', 'syrup',
        'vinegar', 'mustard', 'cocoa', 'chocolate', 'fruit', 'vegetable', 'juice', 'concentrate'
    ];
    
    // Count food keywords and separators
    const keywordCount = foodKeywords.reduce((count, word) => 
        count + (cleanText.includes(word) ? 1 : 0), 0);
    const separatorCount = (cleanText.match(/[,;]|\band\b/gi) || []).length;
    
    // Check for E-numbers (common in ingredients)
    const eNumberCount = (cleanText.match(/\be\d{3}[a-z]?\b/gi) || []).length;
    
    // More lenient conditions
    if (hasIndicator) return true;  // If we see an indicator, trust it
    if (keywordCount >= 1 && separatorCount >= 1) return true;  // More lenient threshold
    if (eNumberCount > 0) return true;  // E-numbers are strong indicators
    if (keywordCount >= 2) return true;  // Multiple food keywords
    
    // Check for common patterns like percentages or quantity indicators
    const hasQuantityIndicators = /(\d+%|\d+\s*(g|mg|ml|oz|kg|l)\b)/i.test(cleanText);
    if (hasQuantityIndicators && keywordCount >= 1) return true;
    
    // If we have a decent amount of text with some structure, it might be an ingredient list
    const wordCount = cleanText.split(/\s+/).length;
    if (wordCount >= 5 && (separatorCount >= 2 || keywordCount >= 1)) return true;
    
    return false;
}

// Override analyzeUploadedImage to use OCR and filter for likely ingredients
async function analyzeUploadedImage() {
    const uploadLoadingIndicator = document.getElementById('uploadLoadingIndicator');
    const uploadResultsContainer = document.getElementById('uploadResultsContainer');
    const uploadedImagePreview = document.getElementById('uploadedImagePreview');

    if (!uploadedImagePreview || !uploadedImagePreview.src) {
        return;
    }

    if (uploadLoadingIndicator) uploadLoadingIndicator.classList.remove('hidden');
    if (uploadResultsContainer) uploadResultsContainer.classList.add('hidden');

    try {
        const ocrResult = await runOCRWithEnhancements(uploadedImagePreview.src);
        const ocrText = ocrResult.text;
        // --- NEW: Check for empty OCR result ---
        if (!ocrText || ocrText.trim().length === 0) {
            if (uploadLoadingIndicator) uploadLoadingIndicator.classList.add('hidden');
            if (uploadResultsContainer) {
                uploadResultsContainer.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-triangle text-4xl text-yellow-300 mb-4"></i>
                        <h3 class="text-xl font-medium text-gray-700">No Text Detected</h3>
                        <p class="text-gray-500 mt-2">No text was found in the image. Please upload a clear image of the product's ingredient list.</p>
                    </div>
                `;
                uploadResultsContainer.classList.remove('hidden');
            }
            return;
        }
        // --- Ingredient list detection ---
        if (!isLikelyIngredientList(ocrText)) {
            if (uploadLoadingIndicator) uploadLoadingIndicator.classList.add('hidden');
            if (uploadResultsContainer) {
                uploadResultsContainer.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-triangle text-4xl text-yellow-300 mb-4"></i>
                        <h3 class="text-xl font-medium text-gray-700">No Ingredient List Detected</h3>
                        <p class="text-gray-500 mt-2">Please upload a clear image of the product's ingredient list.</p>
                    </div>
                `;
                uploadResultsContainer.classList.remove('hidden');
            }
            return;
        }
        // Use Cohere AI to extract/clean ingredients
        let ingredientList = '';
        try {
            const aiRes = await fetch(getApiUrl(API_ENDPOINTS.EXTRACT_INGREDIENTS_AI), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ocrText })
            });
            if (aiRes.ok) {
                const aiData = await aiRes.json();
                ingredientList = aiData.ingredients;
            }
        } catch (err) {
            console.warn('Cohere AI extraction failed, falling back to rules:', err);
        }
        // Fallback to rules if AI fails or returns nothing
        if (!ingredientList || ingredientList.length === 0) {
            ingredientList = getCleanedIngredientListFromOCR(ocrText);
        }
        if (!ingredientList || ingredientList.length === 0) {
            if (uploadLoadingIndicator) uploadLoadingIndicator.classList.add('hidden');
            if (uploadResultsContainer) {
                uploadResultsContainer.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-exclamation-triangle text-4xl text-yellow-300 mb-4"></i>
                        <h3 class="text-xl font-medium text-gray-700">No Ingredient List Detected</h3>
                        <p class="text-gray-500 mt-2">Please upload a clear image of the product's ingredient list.</p>
                    </div>
                `;
                uploadResultsContainer.classList.remove('hidden');
            }
            return;
        }
        // Call backend for analysis
        const response = await fetch(getApiUrl(API_ENDPOINTS.ANALYZE_INGREDIENTS), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients: ingredientList
            })
        });
        if (!response.ok) {
            throw new Error('Analysis failed');
        }
        const data = await response.json();
        const analysis = data.analysis;
        if (uploadLoadingIndicator) uploadLoadingIndicator.classList.add('hidden');
        const confidenceScore = Number.isFinite(ocrResult.confidence) ? Math.round(ocrResult.confidence) : null;
        const confidenceLabel = confidenceScore === null ? 'N/A' : `${confidenceScore}%`;
        const confidenceClass = confidenceScore === null
            ? 'text-gray-500'
            : (confidenceScore >= 75 ? 'text-green-600' : (confidenceScore >= 60 ? 'text-yellow-600' : 'text-red-600'));
        const extractionHint = `OCR variant: ${ocrResult.variant}, mode: ${ocrResult.config}`;
        // Generate results HTML based on analysis (reuse previous logic)
        let resultsHTML = `
            <div>
                <h3 class="text-xl font-bold mb-4">Analysis Results</h3>
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <p class="text-xs ${confidenceClass}"><strong>OCR Confidence:</strong> ${confidenceLabel}</p>
                    <p class="text-xs text-gray-500 mt-1">${extractionHint}</p>
                </div>
                <div class="scan-results-list space-y-3 mb-6">
        `;
        analysis.halal.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-green-50 rounded-lg">
                    <div class="halal-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Halal</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        analysis.haram.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-red-50 rounded-lg">
                    <div class="haram-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Haram</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        analysis.mashbooh.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-yellow-50 rounded-lg">
                    <div class="mashbooh-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Mashbooh</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        analysis.unknown.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-gray-50 rounded-lg">
                    <div class="unknown-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Unknown</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        // Improved status message logic
        let hasHaram = analysis.haram && analysis.haram.length > 0;
        let hasMashbooh = analysis.mashbooh && analysis.mashbooh.length > 0;
        let hasUnknown = analysis.unknown && analysis.unknown.length > 0;
        let statusText = '';
        let statusColor = '';
        let statusDescription = '';
        if (!hasHaram && !hasMashbooh) {
            if (hasUnknown) {
                statusText = 'No haram or mashbooh ingredients detected';
                statusColor = 'text-green-600';
                statusDescription = 'Some ingredients could not be identified (see Unknown section below).';
            } else {
                statusText = 'No haram or mashbooh ingredients detected';
                statusColor = 'text-green-600';
                statusDescription = 'All listed ingredients appear to be halal.';
            }
        } else if (hasHaram) {
            statusText = 'Contains Haram Ingredients';
            statusColor = 'text-red-600';
            statusDescription = 'This product contains ingredients that are considered haram. We recommend looking for halal-certified alternatives.';
        } else if (hasMashbooh) {
            statusText = 'Contains Mashbooh Ingredients';
            statusColor = 'text-yellow-600';
            statusDescription = 'This product contains ingredients that require further verification. We recommend checking for halal certification or contacting the manufacturer.';
        }
        resultsHTML += `
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-medium mb-2">Overall Product Status: <span class="${statusColor}">${statusText}</span></h4>
                    <p class="text-sm text-gray-600">${statusDescription}</p>
                    ${getHalalAuthenticityTipsHtml()}
                </div>
                <div class="scan-result-actions scan-result-actions--two mt-6">
                        <button type="button" data-action="report-inaccuracy" class="scan-result-action scan-result-action-report px-4 py-2 rounded-lg text-sm font-medium">
                        <i class="fas fa-flag mr-1"></i> Report Inaccuracy
                    </button>
                    <button type="button" class="scan-result-action scan-result-action-save bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                        <i class="fas fa-save mr-1"></i> Save Results
                    </button>
                </div>
            </div>
        `;
        if (uploadResultsContainer) {
            uploadResultsContainer.innerHTML = resultsHTML;
            uploadResultsContainer.classList.remove('hidden');
        }
        // Store the latest analysis globally for saving
        window.latestScanAnalysis = analysis;
    } catch (error) {
        console.error('Analysis error:', error);
        if (uploadLoadingIndicator) uploadLoadingIndicator.classList.add('hidden');
        if (uploadResultsContainer) {
            uploadResultsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-700">Analysis Failed</h3>
                    <p class="text-gray-500 mt-2">Unable to analyze ingredients. Please try again.</p>
                </div>
            `;
            uploadResultsContainer.classList.remove('hidden');
        }
    }
}

// Progress tracking for OCR analysis
function updateProgress(percent, status) {
    const progressPercent = document.getElementById('progressPercent');
    const progressStatus = document.getElementById('progressStatus');
    
    if (progressPercent) {
        progressPercent.textContent = `${percent}%`;
    }
    
    if (progressStatus) {
        progressStatus.textContent = status;
    }
}

const OCR_CHAR_WHITELIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.:;()/%&-\\n\\r ';
const OCR_CONFIGS = [
    {
        name: 'block-text',
        tessedit_pageseg_mode: 6,
        tessedit_ocr_engine_mode: 1,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: OCR_CHAR_WHITELIST
    },
    {
        name: 'sparse-text',
        tessedit_pageseg_mode: 11,
        tessedit_ocr_engine_mode: 1,
        preserve_interword_spaces: '1',
        tessedit_char_whitelist: OCR_CHAR_WHITELIST
    }
];

function getSafeImageScale(width, height) {
    const largestSide = Math.max(width, height);
    if (largestSide <= 1600) return 1.7;
    if (largestSide <= 2200) return 1.3;
    return 1;
}

function scoreOcrCandidate(text, confidence) {
    const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return -1000;

    const separators = (cleaned.match(/[,;:]/g) || []).length;
    const words = cleaned.split(/\s+/).filter(Boolean).length;
    let score = Number(confidence || 0);

    if (isLikelyIngredientList(text)) score += 22;
    score += Math.min(separators, 14);
    score += Math.min(Math.floor(words / 3), 12);

    if (words < 4) score -= 16;
    if (cleaned.length < 18) score -= 12;

    return score;
}

// Enhanced preprocess image before OCR
async function preprocessImageForOCR(imageData, mode = 'threshold') {
    return new Promise((resolve, reject) => {
        const img = new Image();

        const timeout = setTimeout(() => {
            reject(new Error('Image preprocessing timed out'));
        }, 12000);

        img.onload = function() {
            clearTimeout(timeout);

            const scale = getSafeImageScale(img.width, img.height);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            if (mode === 'original') {
                resolve(canvas.toDataURL('image/jpeg', 0.98));
                return;
            }

            const bitmap = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = bitmap.data;

            for (let i = 0; i < data.length; i += 4) {
                const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                let pixel = gray;

                if (mode === 'contrast') {
                    pixel = (gray - 128) * 1.7 + 128;
                } else if (mode === 'threshold') {
                    const boosted = (gray - 128) * 1.45 + 128;
                    pixel = boosted > 150 ? 255 : 0;
                }

                const normalized = Math.max(0, Math.min(255, pixel));
                data[i] = normalized;
                data[i + 1] = normalized;
                data[i + 2] = normalized;
            }

            ctx.putImageData(bitmap, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.98));
        };

        img.onerror = function() {
            clearTimeout(timeout);
            reject(new Error('Failed to load image for OCR preprocessing'));
        };

        img.src = imageData;
    });
}

async function buildOcrImageVariants(imageData) {
    const variants = [
        { name: 'threshold', mode: 'threshold' },
        { name: 'contrast', mode: 'contrast' },
        { name: 'original', mode: 'original' }
    ];

    const processed = [];
    for (const variant of variants) {
        try {
            const src = await preprocessImageForOCR(imageData, variant.mode);
            processed.push({ name: variant.name, src });
        } catch (error) {
            console.warn(`Preprocessing failed for ${variant.name}:`, error);
        }
    }

    if (processed.length === 0) {
        throw new Error('Unable to preprocess image for OCR');
    }

    return processed;
}

async function runOCRWithEnhancements(imageData, options = {}) {
    const {
        language = 'eng',
        timeoutMs = 25000,
        onProgress
    } = options;

    const variants = await buildOcrImageVariants(imageData);
    const totalAttempts = variants.length * OCR_CONFIGS.length;
    let attemptIndex = 0;
    let bestResult = null;

    for (const variant of variants) {
        for (const config of OCR_CONFIGS) {
            attemptIndex += 1;

            if (typeof onProgress === 'function') {
                onProgress({ phase: 'attempt', attemptIndex, totalAttempts, variant: variant.name, config: config.name });
            }

            try {
                const recognizePromise = window.Tesseract.recognize(variant.src, language, {
                    ...config,
                    logger: message => {
                        if (typeof onProgress === 'function' && message.status === 'recognizing text' && typeof message.progress === 'number') {
                            onProgress({
                                phase: 'recognizing',
                                attemptIndex,
                                totalAttempts,
                                variant: variant.name,
                                config: config.name,
                                progress: message.progress
                            });
                        }
                    }
                });

                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('OCR operation timed out')), timeoutMs);
                });

                const result = await Promise.race([recognizePromise, timeoutPromise]);
                const text = (result.data && result.data.text) ? result.data.text : '';
                const confidence = Number(result.data && result.data.confidence ? result.data.confidence : 0);
                const score = scoreOcrCandidate(text, confidence);

                if (!bestResult || score > bestResult.score) {
                    bestResult = {
                        text,
                        confidence,
                        score,
                        variant: variant.name,
                        config: config.name
                    };
                }

                if (confidence >= 88 && isLikelyIngredientList(text)) {
                    return bestResult;
                }
            } catch (attemptError) {
                console.warn(`OCR failed for ${variant.name}/${config.name}:`, attemptError);
            }
        }
    }

    if (!bestResult) {
        throw new Error('OCR could not recognize text from this image');
    }

    return bestResult;
}

// Real AI analysis for captured image
async function analyzeCapturedImage(imageData) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');

    // Ensure loading indicator is shown immediately
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }

    // --- Run OCR on the captured image with preprocessing ---
    let ocrText = '';
    let ocrConfidence = null;
    
    // Function to clean up and hide loading indicator
    const hideLoadingIndicator = () => {
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
    };
    
    // Update progress indicator
    updateProgress(0, "Starting analysis...");
    
    try {
        updateProgress(10, "Preprocessing image...");
        updateProgress(12, "Preparing OCR image variants...");

        const result = await runOCRWithEnhancements(imageData, {
            timeoutMs: 25000,
            onProgress: ({ phase, attemptIndex, totalAttempts, progress, variant }) => {
                const base = 24;
                const span = 54;
                if (phase === 'attempt') {
                    const pct = Math.round(base + ((attemptIndex - 1) / Math.max(1, totalAttempts)) * span);
                    updateProgress(pct, `OCR attempt ${attemptIndex}/${totalAttempts} (${variant})...`);
                } else if (phase === 'recognizing' && typeof progress === 'number') {
                    const eachAttemptSpan = span / Math.max(1, totalAttempts);
                    const pct = Math.round(base + ((attemptIndex - 1) * eachAttemptSpan) + (progress * eachAttemptSpan));
                    updateProgress(Math.min(82, pct), `Recognizing text (${variant})...`);
                }
            }
        });

        ocrText = result.text;

        // Check OCR confidence level for better user feedback
        const confidence = Number(result.confidence || 0);
        ocrConfidence = confidence;
        if (confidence < 60) {
            console.warn(`Low OCR confidence: ${confidence}%. Text may need verification.`);
            updateProgress(84, "Low confidence detected, verifying...");
        } else {
            updateProgress(84, "High confidence text detected!");
        }
        
        updateProgress(88, "Analyzing ingredients...");

    } catch (err) {
        console.error('OCR Error:', err);
        hideLoadingIndicator();
        
        // Show preprocessing/OCR error message
        const errorHTML = `
            <div class="text-center py-8 px-4">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <h3 class="text-xl font-medium text-gray-800 mb-3">Processing Failed</h3>
                <div class="max-w-md mx-auto bg-red-50 p-4 rounded-lg text-left mb-4">
                    <p class="text-gray-700 mb-2"><i class="fas fa-info-circle text-red-500 mr-2"></i> ${err.message.includes('timeout') ? 'The image processing took too long.' : 'Unable to process the image.'}</p>
                    <p class="text-sm text-gray-600">Please try again with:</p>
                    <ul class="list-disc pl-5 space-y-1 text-sm text-gray-600 mt-2">
                        <li>Better lighting conditions</li>
                        <li>A clearer image of the text</li>
                        <li>Steadier camera position</li>
                    </ul>
                </div>
                <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button id="tryAgainBtn" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center">
                        <i class="fas fa-camera mr-2"></i> Try Again
                    </button>
                    <button id="manualInputBtn" class="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center justify-center">
                        <i class="fas fa-keyboard mr-2"></i> Enter Manually
                    </button>
                </div>
            </div>
        `;
        
        if (resultsContainer) {
            resultsContainer.innerHTML = errorHTML;
            resultsContainer.classList.remove('hidden');
            setTimeout(() => {
                const tryAgainBtn = document.getElementById('tryAgainBtn');
                const manualInputBtn = document.getElementById('manualInputBtn');
                
                if (tryAgainBtn) {
                    tryAgainBtn.onclick = function() {
                        // Show the camera card again
                        const cameraCard = document.getElementById('cameraCard');
                        if (cameraCard) cameraCard.classList.remove('hidden');
                        startCamera();
                        resultsContainer.classList.add('hidden');
                    };
                }
                
                if (manualInputBtn) {
                    manualInputBtn.onclick = function() {
                        // Hide scanner and show manual input
                        const scannerSection = document.getElementById('scannerSection');
                        if (scannerSection) {
                            scannerSection.classList.add('hidden');
                        }
                        const manualInputSection = document.getElementById('manualInputSection');
                        if (manualInputSection) {
                            manualInputSection.classList.remove('hidden');
                            const inputField = manualInputSection.querySelector('textarea');
                            if (inputField) inputField.focus();
                        }
                        resultsContainer.classList.add('hidden');
                    };
                }
            }, 100);
        }
        return;
    }
    // --- NEW: Check for empty OCR result ---
    if (!ocrText || ocrText.trim().length === 0) {
        hideLoadingIndicator();
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8 px-4">
                    <i class="fas fa-exclamation-circle text-4xl text-red-400 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-800 mb-3">No Text Detected</h3>
                    <div class="max-w-md mx-auto bg-red-50 p-4 rounded-lg text-left mb-4">
                        <p class="text-gray-700 mb-2"><i class="fas fa-lightbulb text-red-500 mr-2"></i> We couldn't find any text in your image. Here's how to improve your scan:</p>
                        <ul class="list-disc pl-5 space-y-1 text-sm text-gray-600">
                            <li>Make sure there's enough light on the package</li>
                            <li>Hold your device steady and straight</li>
                            <li>Get closer to the text</li>
                            <li>Check for glare or reflections</li>
                            <li>Try a different angle if the text is shiny</li>
                        </ul>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                        <button id="tryAgainBtn" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center">
                            <i class="fas fa-camera mr-2"></i> Try Again
                        </button>
                        <button id="manualInputBtn" class="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center justify-center">
                            <i class="fas fa-keyboard mr-2"></i> Enter Ingredients Manually
                        </button>
                    </div>
                </div>
            `;
            resultsContainer.classList.remove('hidden');
            setTimeout(() => {
                const tryAgainBtn = document.getElementById('tryAgainBtn');
                const manualInputBtn = document.getElementById('manualInputBtn');
                const scannerSection = document.getElementById('scannerSection');
                
                if (tryAgainBtn) {
                    tryAgainBtn.onclick = function() {
                        // Show the camera card again
                        const cameraCard = document.getElementById('cameraCard');
                        if (cameraCard) cameraCard.classList.remove('hidden');
                        startCamera();
                        resultsContainer.classList.add('hidden');
                    };
                }
                
                if (manualInputBtn) {
                    manualInputBtn.onclick = function() {
                        // Hide scanner and show manual input
                        const scannerSection = document.getElementById('scannerSection');
                        if (scannerSection) {
                            scannerSection.classList.add('hidden');
                        }
                        const manualInputSection = document.getElementById('manualInputSection');
                        if (manualInputSection) {
                            manualInputSection.classList.remove('hidden');
                            const inputField = manualInputSection.querySelector('textarea');
                            if (inputField) {
                                inputField.focus();
                                manualInputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        } else {
                            showAlert({
                                icon: 'warning',
                                title: 'Manual Input Unavailable',
                                text: 'Manual input section not found. Please refresh the page and try again.'
                            });
                        }
                        resultsContainer.classList.add('hidden');
                    };
                }
            }, 100);
        }
        return;
    }

    const ocrLikelyIngredients = isLikelyIngredientList(ocrText);
    
    try {
        updateProgress(88, "Cleaning ingredients...");

        // Improve live scan accuracy by normalizing OCR output with AI first,
        // then falling back to local rules when AI is unavailable.
        let ingredientList = '';
        let usedAiCleanup = false;
        try {
            const aiRes = await fetch(getApiUrl(API_ENDPOINTS.EXTRACT_INGREDIENTS_AI), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ocrText })
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();
                if (aiData && typeof aiData.ingredients === 'string') {
                    ingredientList = aiData.ingredients.trim();
                    usedAiCleanup = ingredientList.length > 0;
                }
            }
        } catch (err) {
            console.warn('Live scan AI extraction failed, using OCR cleanup fallback:', err);
        }

        if (!ingredientList) {
            ingredientList = getCleanedIngredientListFromOCR(ocrText);
        }

        if (!ingredientList || !isPlausibleIngredientList(ingredientList)) {
            hideLoadingIndicator();
            if (resultsContainer) {
                resultsContainer.innerHTML = `
                    <div class="text-center py-8 px-4">
                        <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                        <h3 class="text-xl font-medium text-gray-800 mb-3">No Ingredient List Detected</h3>
                        <div class="max-w-md mx-auto bg-yellow-50 p-4 rounded-lg text-left mb-4">
                            <p class="text-gray-700 mb-2"><i class="fas fa-lightbulb text-yellow-500 mr-2"></i> Tips for better results:</p>
                            <ul class="list-disc pl-5 space-y-1 text-sm text-gray-600">
                                <li>Ensure good lighting and avoid glare</li>
                                <li>Keep camera parallel and text fully visible</li>
                                <li>Hold steady and tap to focus before capture</li>
                            </ul>
                        </div>
                        <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                            <button id="tryAgainBtn" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center">
                                <i class="fas fa-camera mr-2"></i> Try Again
                            </button>
                            <button id="manualInputBtn" class="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center justify-center">
                                <i class="fas fa-keyboard mr-2"></i> Enter Manually
                            </button>
                        </div>
                    </div>
                `;
                resultsContainer.classList.remove('hidden');
                setTimeout(() => {
                    const tryAgainBtn = document.getElementById('tryAgainBtn');
                    const manualInputBtn = document.getElementById('manualInputBtn');
                    const scannerSection = document.getElementById('scannerSection');

                    if (tryAgainBtn) {
                        tryAgainBtn.onclick = function() {
                            const cameraCard = document.getElementById('cameraCard');
                            if (cameraCard) cameraCard.classList.remove('hidden');
                            startCamera();
                            resultsContainer.classList.add('hidden');
                        };
                    }

                    if (manualInputBtn) {
                        manualInputBtn.onclick = function() {
                            if (scannerSection) scannerSection.classList.add('hidden');
                            const manualInputSection = document.getElementById('manualInputSection');
                            if (manualInputSection) {
                                manualInputSection.classList.remove('hidden');
                                const inputField = manualInputSection.querySelector('textarea');
                                if (inputField) inputField.focus();
                            }
                            resultsContainer.classList.add('hidden');
                        };
                    }
                }, 100);
            }
            return;
        }

        const cleanedIngredientsForAnalysis = ingredientList;
        const confidenceScore = Number.isFinite(ocrConfidence) ? Math.round(ocrConfidence) : null;
        const confidenceClass = confidenceScore === null
            ? 'text-gray-600'
            : (confidenceScore >= 75 ? 'text-green-600' : (confidenceScore >= 60 ? 'text-yellow-600' : 'text-red-600'));
        const confidenceLabel = confidenceScore === null ? 'N/A' : `${confidenceScore}%`;
        const confidenceHint = confidenceScore !== null && confidenceScore < 60
            ? 'Low OCR confidence. Review results and consider recapturing for better accuracy.'
            : 'OCR confidence is acceptable.';
        const cleanupMethod = usedAiCleanup ? 'AI-assisted cleanup' : 'Rule-based cleanup';

        updateProgress(90, "Sending to analysis server...");
        
        const response = await fetch(getApiUrl(API_ENDPOINTS.ANALYZE_INGREDIENTS), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients: ingredientList
            })
        });

        if (!response.ok) {
            throw new Error('Analysis failed');
        }

        const data = await response.json();
        const analysis = data.analysis;
        
        updateProgress(100, "Analysis complete!");
        
        // Hide loading indicator after short delay to show completion
        setTimeout(() => {
            hideLoadingIndicator();
        }, 500);
        
        // Generate results HTML based on analysis
        let resultsHTML = `
            <div>
                <h3 class="text-xl font-bold mb-4">Analysis Results</h3>
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                    <div class="text-sm text-gray-700 mb-2">
                        <p class="font-semibold mb-1">Analyzed Ingredients:</p>
                        <div class="scanned-ingredients-box">${escapeHtml(cleanedIngredientsForAnalysis)}</div>
                    </div>
                    <p class="text-xs text-gray-500">Cleanup: ${cleanupMethod}</p>
                    <p class="text-xs ${confidenceClass}"><strong>OCR Confidence:</strong> ${confidenceLabel}</p>
                    <p class="text-xs text-gray-500 mt-1">${confidenceHint}</p>
                </div>
                <div class="scan-results-list space-y-3 mb-6">
        `;
        
        // Add halal ingredients
        analysis.halal.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-green-50 rounded-lg">
                    <div class="halal-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Halal</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        
        // Add haram ingredients
        analysis.haram.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-red-50 rounded-lg">
                    <div class="haram-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Haram</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        
        // Add mashbooh ingredients
        analysis.mashbooh.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-yellow-50 rounded-lg">
                    <div class="mashbooh-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Mashbooh</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        
        // Add unknown ingredients
        analysis.unknown.forEach(item => {
            resultsHTML += `
                <div class="flex items-start p-4 bg-gray-50 rounded-lg">
                    <div class="unknown-badge text-white text-xs px-2 py-1 rounded-full mr-3 mt-1">Unknown</div>
                    <div>
                        <h4 class="font-medium">${item.ingredient}</h4>
                        ${item.matched_name ? `<div class='text-xs text-gray-500 mb-1'>Matched: <span class='font-semibold'>${item.matched_name}</span></div>` : ''}
                        ${item.category ? `<div class='text-xs text-gray-400 mb-1'>Category: ${item.category}</div>` : ''}
                        <p class="text-sm text-gray-600">${item.explanation || ''}</p>
                    </div>
                </div>
            `;
        });
        
        // Add overall status
        let statusText = '';
        let statusColor = '';
        let statusDescription = '';
        
        switch(analysis.overallStatus) {
            case 'haram':
                statusText = 'Contains Haram Ingredients';
                statusColor = 'text-red-600';
                statusDescription = 'This product contains ingredients that are considered haram. We recommend looking for halal-certified alternatives.';
                break;
            case 'mashbooh':
                statusText = 'Contains Mashbooh Ingredients';
                statusColor = 'text-yellow-600';
                statusDescription = 'This product contains ingredients that require further verification. We recommend checking for halal certification or contacting the manufacturer.';
                break;
            case 'unknown':
                statusText = 'Contains Unknown Ingredients';
                statusColor = 'text-gray-600';
                statusDescription = 'Some ingredients could not be classified. We recommend further research or consultation with a scholar.';
                break;
            default:
                statusText = 'Halal Product';
                statusColor = 'text-green-600';
                statusDescription = 'All analyzed ingredients appear to be halal.';
        }
        
        resultsHTML += `
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-medium mb-2">Overall Product Status: <span class="${statusColor}">${statusText}</span></h4>
                    <p class="text-sm text-gray-600">${statusDescription}</p>
                    ${getHalalAuthenticityTipsHtml()}
                </div>
                <div class="scan-result-actions scan-result-actions--three mt-6">
                        <button type="button" data-action="report-inaccuracy" class="scan-result-action scan-result-action-report px-4 py-2 rounded-lg text-sm font-medium">
                        <i class="fas fa-flag mr-1"></i> Report Inaccuracy
                    </button>
                    <button type="button" id="scanAgainBtn" class="scan-result-action border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50">
                        <i class="fas fa-camera mr-1"></i> Scan Again
                    </button>
                    <button type="button" class="scan-result-action scan-result-action-save bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                        <i class="fas fa-save mr-1"></i> Save Results
                    </button>
                </div>
            </div>
        `;
        
        if (resultsContainer) {
            resultsContainer.innerHTML = resultsHTML;
            resultsContainer.classList.remove('hidden');

            const scanAgainBtn = document.getElementById('scanAgainBtn');
            if (scanAgainBtn) {
                scanAgainBtn.addEventListener('click', () => {
                    const cameraCard = document.getElementById('cameraCard');
                    if (cameraCard) cameraCard.classList.remove('hidden');
                    resultsContainer.classList.add('hidden');
                    startCamera();
                });
            }
        }

        // Keep behavior consistent with upload mode so save/report actions work.
        window.latestScanAnalysis = analysis;
        
    } catch (error) {
        console.error('Analysis error:', error);
        hideLoadingIndicator();
        // Show error message with Try Again button
        const errorHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                <h3 class="text-xl font-medium text-gray-700">Analysis Failed</h3>
                <p class="text-gray-500 mt-2">Unable to analyze ingredients. Please check your connection and try again.</p>
                <div class="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button id="tryAgainBtn" class="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center justify-center">
                        <i class="fas fa-redo mr-2"></i> Try Again
                    </button>
                    <button id="manualInputBtn" class="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-indigo-50 transition flex items-center justify-center">
                        <i class="fas fa-keyboard mr-2"></i> Enter Manually
                    </button>
                </div>
            </div>
        `;
        if (resultsContainer) {
            resultsContainer.innerHTML = errorHTML;
            resultsContainer.classList.remove('hidden');
            setTimeout(() => {
                const tryAgainBtn = document.getElementById('tryAgainBtn');
                const manualInputBtn = document.getElementById('manualInputBtn');
                const scannerSection = document.getElementById('scannerSection');
                
                if (tryAgainBtn) {
                    tryAgainBtn.onclick = function() {
                        // Show the camera card again
                        const cameraCard = document.getElementById('cameraCard');
                        if (cameraCard) cameraCard.classList.remove('hidden');
                        startCamera();
                        resultsContainer.classList.add('hidden');
                    };
                }
                
                if (manualInputBtn) {
                    manualInputBtn.onclick = function() {
                        // Hide scanner and show manual input
                        if (scannerSection) {
                            scannerSection.classList.add('hidden');
                        }
                        const manualInputSection = document.getElementById('manualInputSection');
                        if (manualInputSection) {
                            manualInputSection.classList.remove('hidden');
                            const inputField = manualInputSection.querySelector('textarea');
                            if (inputField) inputField.focus();
                        }
                        resultsContainer.classList.add('hidden');
                    };
                }
            }, 100);
        }
    }
}

// Input validation function
function validateInput(input, type) {
    const value = input.value.trim();
    
    switch(type) {
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        case 'password':
            return value.length >= 6;
        case 'name':
            return value.length >= 2 && /^[A-Za-z\s]+$/.test(value);
        default:
            return value.length > 0;
    }
}

function getSubmitButton(form) {
    return form ? form.querySelector('button[type="submit"]') : null;
}

function setSubmitButtonLoading(form, isLoading, loadingText) {
    const submitBtn = getSubmitButton(form);
    if (!submitBtn) return;

    if (!submitBtn.dataset.originalHtml) {
        submitBtn.dataset.originalHtml = submitBtn.innerHTML;
    }

    if (isLoading) {
        submitBtn.dataset.loading = 'true';
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin" aria-hidden="true" style="margin-right:0.45rem;"></i>${loadingText}`;
    } else {
        submitBtn.dataset.loading = 'false';
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = submitBtn.dataset.originalHtml;
    }
}

// Helper to save user to localStorage
function saveUserToLocal(email, name) {
    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('users')) || [];
    } catch (e) { users = []; }
    // Remove any existing user with the same email
    users = users.filter(u => u.email !== email);
    users.push({ email, name });
    localStorage.setItem('users', JSON.stringify(users));
}

// Helper to get user name by email
function getUserNameByEmail(email) {
    try {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);
        return user ? user.name : '';
    } catch (e) { return ''; }
}

// --- SIGN UP LOGIC ---
const signUpForm = document.getElementById('signUpForm');
if (signUpForm) {
    signUpForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = getSubmitButton(signUpForm);
        if (submitBtn && submitBtn.dataset.loading === 'true') return;
        
        const nameInput = document.getElementById('signUpName');
        const emailInput = document.getElementById('signUpEmail');
        const passwordInput = document.getElementById('signUpPassword');
        
        // Clear previous error states
        [nameInput, emailInput, passwordInput].forEach(input => {
            if (input) input.classList.remove('input-error');
        });
        
        // Validate inputs
        let hasError = false;
        
        if (!validateInput(nameInput, 'name')) {
            nameInput.classList.add('input-error');
            hasError = true;
        }
        
        if (!validateInput(emailInput, 'email')) {
            emailInput.classList.add('input-error');
            hasError = true;
        }
        
        if (!validateInput(passwordInput, 'password')) {
            passwordInput.classList.add('input-error');
            hasError = true;
        }
        
        if (hasError) {
            showAlert({
                icon: 'error',
                title: 'Form Validation Error',
                text: 'Please fix the errors in the form before submitting.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
            return;
        }
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        setSubmitButtonLoading(signUpForm, true, 'Creating Account...');

        // Use backend API for sign-up
        fetch(getApiUrl(API_ENDPOINTS.SIGN_UP), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert({
                    icon: 'error',
                    title: 'Sign Up Failed',
                    text: data.error,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444'
                });
            } else {
                showToast({
                    type: 'success',
                    title: 'Account Created',
                    text: 'Your account has been created. Please sign in.'
                });
                if (signUpModal) signUpModal.classList.add('hidden');
                if (signInModal) signInModal.classList.remove('hidden');
                signUpForm.reset();
            }
        })
        .catch(error => {
            showAlert({
                icon: 'error',
                title: 'Sign Up Error',
                text: 'An error occurred during sign up. Please try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
        })
        .finally(() => {
            setSubmitButtonLoading(signUpForm, false);
        });
    });
}

// --- SIGN IN LOGIC ---
const signInForm = document.getElementById('signInForm');
if (signInForm) {
    signInForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = getSubmitButton(signInForm);
        if (submitBtn && submitBtn.dataset.loading === 'true') return;
        
        const emailInput = document.getElementById('signInEmail');
        const passwordInput = document.getElementById('signInPassword');
        
        // Clear previous error states
        [emailInput, passwordInput].forEach(input => {
            if (input) input.classList.remove('input-error');
        });
        
        // Validate inputs
        let hasError = false;
        
        if (!validateInput(emailInput, 'email')) {
            emailInput.classList.add('input-error');
            hasError = true;
        }
        
        if (!validateInput(passwordInput, 'password')) {
            passwordInput.classList.add('input-error');
            hasError = true;
        }
        
        if (hasError) {
            showAlert({
                icon: 'error',
                title: 'Form Validation Error',
                text: 'Please fix the errors in the form before submitting.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        setSubmitButtonLoading(signInForm, true, 'Signing In...');

        // Use backend API for sign-in
        fetch(getApiUrl(API_ENDPOINTS.SIGN_IN), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert({
                    icon: 'error',
                    title: 'Sign In Failed',
                    text: data.error,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444'
                });
            } else {
                const user = data.user;
                const token = data.token;
                setStoredAuth(user, token);
                showToast({
                    type: 'success',
                    title: `Welcome back, ${user.name}`,
                    text: 'Signed in successfully.'
                });
                if (signInModal) signInModal.classList.add('hidden');
                updateUIAfterLogin(user);
                signInForm.reset();
            }
        })
        .catch(error => {
            showAlert({
                icon: 'error',
                title: 'Sign In Error',
                text: 'An error occurred during sign in. Please try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
        })
        .finally(() => {
            setSubmitButtonLoading(signInForm, false);
        });
    });
}

// --- USER AUTHENTICATION STATE MANAGEMENT ---
let currentUser = null;
const AUTH_USER_KEY = 'currentUser';
const AUTH_TOKEN_KEY = 'jwtToken';

function getStoredAuth() {
    return {
        userData: sessionStorage.getItem(AUTH_USER_KEY),
        token: sessionStorage.getItem(AUTH_TOKEN_KEY)
    };
}

function setStoredAuth(user, token) {
    if (user) {
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    }
    if (token) {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    // Remove legacy persistent auth values.
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

function clearStoredAuth() {
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
}

// Check if user is logged in on page load
function checkAuthStatus() {
    const { userData, token } = getStoredAuth();

    // Clear old persistent sessions if present from earlier versions.
    if (!userData && !token) {
        localStorage.removeItem(AUTH_USER_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    if (userData && token) {
        try {
            currentUser = JSON.parse(userData);
            updateUIAfterLogin(currentUser);
        } catch (e) {
            clearStoredAuth();
            signOut();
        }
    } else if (userData || token) {
        signOut();
    }
}

// Update UI after login
function updateUIAfterLogin(user) {
    currentUser = user;
    const { token } = getStoredAuth();
    setStoredAuth(user, token);
    
    // Update header buttons
    const signInBtn = document.getElementById('signInBtn');
    const mobileSignInBtn = document.getElementById('mobileSignInBtn');
    const userDashboardBtn = document.getElementById('userDashboardBtn');
    const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
    const adminDashboardBtn = document.getElementById('adminDashboardBtn');
    
    [signInBtn, mobileSignInBtn].forEach(btn => {
        if (!btn) return;
        const signInBtnText = btn.querySelector('span');
        const signInBtnIcon = btn.querySelector('i');
        if (signInBtnText) signInBtnText.textContent = 'Sign Out';
        if (signInBtnIcon) {
            signInBtnIcon.classList.remove('fa-sign-in-alt');
            signInBtnIcon.classList.add('fa-sign-out-alt');
        }
    });

    const userDashboardButtons = [userDashboardBtn];
    const adminDashboardButtons = [adminDashboardBtn];

    if (user.email === 'admin@halalscanner.com') {
        // Admin: show only admin dashboard
        adminDashboardButtons.forEach(btn => {
            if (btn) btn.classList.remove('hidden');
        });
        userDashboardButtons.forEach(btn => {
            if (btn) btn.classList.add('hidden');
        });
        if (mobileDashboardBtn) {
            const mobileDashboardBtnText = mobileDashboardBtn.querySelector('span');
            const mobileDashboardBtnIcon = mobileDashboardBtn.querySelector('i');
            if (mobileDashboardBtnText) mobileDashboardBtnText.textContent = 'Admin Dashboard';
            if (mobileDashboardBtnIcon) {
                mobileDashboardBtnIcon.classList.remove('fa-user');
                mobileDashboardBtnIcon.classList.add('fa-shield-alt');
            }
            mobileDashboardBtn.dataset.target = 'admin-dashboard.html';
            mobileDashboardBtn.classList.remove('hidden');
        }
    } else {
        // Regular user: show only user dashboard
        userDashboardButtons.forEach(btn => {
            if (btn) btn.classList.remove('hidden');
        });
        adminDashboardButtons.forEach(btn => {
            if (btn) btn.classList.add('hidden');
        });
        if (mobileDashboardBtn) {
            const mobileDashboardBtnText = mobileDashboardBtn.querySelector('span');
            const mobileDashboardBtnIcon = mobileDashboardBtn.querySelector('i');
            if (mobileDashboardBtnText) mobileDashboardBtnText.textContent = 'Dashboard';
            if (mobileDashboardBtnIcon) {
                mobileDashboardBtnIcon.classList.remove('fa-shield-alt');
                mobileDashboardBtnIcon.classList.add('fa-user');
            }
            mobileDashboardBtn.dataset.target = 'user-dashboard.html';
            mobileDashboardBtn.classList.remove('hidden');
        }
    }
}

// Sign out functionality
function signOut() {
    currentUser = null;
    clearStoredAuth();
    
    const signInBtn = document.getElementById('signInBtn');
    const mobileSignInBtn = document.getElementById('mobileSignInBtn');
    const userDashboardBtn = document.getElementById('userDashboardBtn');
    const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
    const adminDashboardBtn = document.getElementById('adminDashboardBtn'); // Ensure admin button is also handled

    [signInBtn, mobileSignInBtn].forEach(btn => {
        if (!btn) return;
        const signInBtnText = btn.querySelector('span');
        const signInBtnIcon = btn.querySelector('i');
        if (signInBtnText) signInBtnText.textContent = 'Sign In';
        if (signInBtnIcon) {
            signInBtnIcon.classList.remove('fa-sign-out-alt');
            signInBtnIcon.classList.add('fa-sign-in-alt');
        }
    });
    [userDashboardBtn, adminDashboardBtn, mobileDashboardBtn].forEach(btn => {
        if (btn) btn.classList.add('hidden');
    });
    if (mobileDashboardBtn) {
        const mobileDashboardBtnText = mobileDashboardBtn.querySelector('span');
        const mobileDashboardBtnIcon = mobileDashboardBtn.querySelector('i');
        if (mobileDashboardBtnText) mobileDashboardBtnText.textContent = 'Dashboard';
        if (mobileDashboardBtnIcon) {
            mobileDashboardBtnIcon.classList.remove('fa-shield-alt');
            mobileDashboardBtnIcon.classList.add('fa-user');
        }
        delete mobileDashboardBtn.dataset.target;
    }
    
    // Close any open modals
    const modals = ['signInModal', 'signUpModal', 'reportModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    });
}

const signInBtn = document.getElementById('signInBtn');
const mobileSignInBtn = document.getElementById('mobileSignInBtn');

function handleAuthButtonClick(e) {
    e.stopPropagation();
    if (currentUser) {
        showAlert({
            title: 'Logout',
            text: 'Are you sure you want to sign out of your account?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Logout',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#4f46e5',
        }).then((result) => {
            if (result.isConfirmed) {
                signOut();
                location.reload();
            }
        });
    } else {
        const signInModal = document.getElementById('signInModal');
        if (signInModal) signInModal.classList.remove('hidden');
    }
}

[signInBtn, mobileSignInBtn].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        handleAuthButtonClick(e);
    });
});

// --- DASHBOARD NAVIGATION (MPA) ---
const userDashboardBtn = document.getElementById('userDashboardBtn');
const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
const adminDashboardBtn = document.getElementById('adminDashboardBtn');

[userDashboardBtn].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'user-dashboard.html';
    });
});

[adminDashboardBtn].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'admin-dashboard.html';
    });
});

if (mobileDashboardBtn) {
    mobileDashboardBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = mobileDashboardBtn.dataset.target || (currentUser && currentUser.email === 'admin@halalscanner.com' ? 'admin-dashboard.html' : 'user-dashboard.html');
        window.location.href = target;
    });
}

// --- SAVE RESULTS FUNCTIONALITY ---
function addSaveResultsFunctionality() {
    // Add event listeners to all "Save Results" buttons
    document.addEventListener('click', async function(e) {
        const btn = e.target.closest('button');
        if (btn && btn.textContent.includes('Save Results')) {
            e.preventDefault();
            e.stopPropagation();
            if (!currentUser) {
                showAlert({
                    icon: 'warning',
                    title: 'Sign In Required',
                    text: 'You need to sign in or create an account to save scan results.',
                    confirmButtonText: 'Sign In',
                    confirmButtonColor: '#4f46e5',
                    showCancelButton: true,
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const signInModal = document.getElementById('signInModal');
                        if (signInModal) signInModal.classList.remove('hidden');
                    }
                });
                return;
            }
            // Use the latest scan analysis for saving
            const analysis = window.latestScanAnalysis;
            if (!analysis) {
                showAlert({
                    icon: 'error',
                    title: 'No Analysis Data',
                    text: 'No scan analysis found. Please scan and analyze ingredients first.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
            // Determine overall status
            let overallStatus = 'halal';
            if (analysis.haram && analysis.haram.length > 0) {
                overallStatus = 'haram';
            } else if (analysis.mashbooh && analysis.mashbooh.length > 0) {
                overallStatus = 'mashbooh';
            } else if (analysis.unknown && analysis.unknown.length > 0) {
                overallStatus = 'unknown';
            }
            // Join all ingredients for saving
            const allIngredients = [
                ...(analysis.halal || []).map(i => i.ingredient),
                ...(analysis.haram || []).map(i => i.ingredient),
                ...(analysis.mashbooh || []).map(i => i.ingredient),
                ...(analysis.unknown || []).map(i => i.ingredient)
            ].join(', ');
            const scanData = {
                ingredients: allIngredients,
                overallStatus: overallStatus,
                timestamp: new Date().toISOString()
            };
            try {
                const response = await fetch(getApiUrl(API_ENDPOINTS.SAVE_RESULT), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getJwtToken()}`,
                        'user-id': currentUser.id,
                        'user-email': currentUser.email,
                        'user-name': currentUser.name
                    },
                    body: JSON.stringify({ result_data: scanData })
                });
                const data = await response.json();
                if (response.ok) {
                    showAlert({
                        icon: 'success',
                        title: 'Results Saved',
                        text: 'Your scan results have been saved successfully.',
                        timer: 3000,
                        showConfirmButton: false
                    });
                    // Dashboard refresh is handled in dedicated MPA dashboard pages.
                } else {
                    throw new Error(data.error || 'Failed to save results');
                }
            } catch (error) {
                showAlert({
                    icon: 'error',
                    title: 'Save Failed',
                    text: error.message,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

// --- REPORT INACCURACY FUNCTIONALITY ---
function addReportInaccuracyFunctionality() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        const isReportButton = btn && (
            btn.dataset.action === 'report-inaccuracy' ||
            btn.textContent.includes('Report Inaccuracy')
        );
        if (isReportButton) {
            e.preventDefault();
            e.stopPropagation();
            if (!currentUser) {
                showAlert({
                    icon: 'warning',
                    title: 'Sign In Required',
                    text: 'You need to sign in to submit a report.',
                    confirmButtonText: 'Sign In',
                    confirmButtonColor: '#4f46e5',
                    showCancelButton: true,
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const signInModal = document.getElementById('signInModal');
                        if (signInModal) signInModal.classList.remove('hidden');
                    }
                });
                return;
            }

            const resultsContainer =
                btn.closest('#resultsContainer') ||
                btn.closest('#uploadResultsContainer') ||
                btn.closest('.results-container') ||
                btn.closest('.bg-white');

            if (resultsContainer) {
                const itemNameElement =
                    resultsContainer.querySelector('.space-y-3 > div h4') ||
                    resultsContainer.querySelector('h4, h5, h3');
                if (itemNameElement) {
                    const reportItemName = document.getElementById('reportItemName');
                    if (reportItemName) {
                        reportItemName.value = itemNameElement.textContent
                            .replace('Analysis Results', '')
                            .replace('Overall Product Status:', '')
                            .trim();
                    }
                }
            }

            const reportModal = document.getElementById('reportModal');
            if (reportModal) {
                reportModal.classList.remove('hidden');
            } else {
                showAlert({
                    icon: 'error',
                    title: 'Report Form Unavailable',
                    text: 'The report form is missing on this page. Please refresh and try again.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

// --- REPORT MODAL FUNCTIONALITY ---
const reportModal = document.getElementById('reportModal');
const closeReportModal = document.getElementById('closeReportModal');
const cancelReportModal = document.getElementById('cancelReportModal');
const reportForm = document.getElementById('reportForm');

if (closeReportModal) {
    closeReportModal.addEventListener('click', (e) => {
        e.preventDefault();
        if (reportModal) reportModal.classList.add('hidden');
    });
}

if (cancelReportModal) {
    cancelReportModal.addEventListener('click', (e) => {
        e.preventDefault();
        if (reportModal) reportModal.classList.add('hidden');
    });
}

if (reportForm) {
    reportForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showAlert({
                icon: 'error',
                title: 'Authentication Required',
                text: 'You need to sign in to submit a report.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
            return;
        }
        
        const itemName = document.getElementById('reportItemName').value.trim();
        const reason = document.getElementById('reportReason').value.trim();
        
        if (!itemName || !reason) {
            showAlert({
                icon: 'error',
                title: 'Form Error',
                text: 'Please fill in all required fields.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
            return;
        }
        
        try {
            const response = await fetch(getApiUrl(API_ENDPOINTS.REPORT_INACCURACY), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJwtToken()}`,
                    'user-id': currentUser.id,
                    'user-email': currentUser.email,
                    'user-name': currentUser.name
                },
                body: JSON.stringify({ item_name: itemName, reason: reason })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showAlert({
                    icon: 'success',
                    title: 'Report Submitted',
                    text: 'Your report has been submitted successfully.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#4f46e5'
                });
                // Dashboard refresh is handled in dedicated MPA dashboard pages.
            } else {
                throw new Error(data.error || 'Failed to submit report');
            }
        } catch (error) {
            showAlert({
                icon: 'error',
                title: 'Submission Failed',
                text: error.message,
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
        }
    });
}



// --- PASSWORD TOGGLE FUNCTIONALITY ---
function addPasswordToggleFunctionality() {
    // Sign In Password Toggle
    const toggleSignInPassword = document.getElementById('toggleSignInPassword');
    const signInPassword = document.getElementById('signInPassword');
    const signInPasswordIcon = document.getElementById('signInPasswordIcon');
    
    if (toggleSignInPassword && signInPassword && signInPasswordIcon) {
        toggleSignInPassword.addEventListener('click', function(e) {
            e.preventDefault();
            if (signInPassword.type === 'password') {
                signInPassword.type = 'text';
                signInPasswordIcon.classList.remove('fa-eye');
                signInPasswordIcon.classList.add('fa-eye-slash');
            } else {
                signInPassword.type = 'password';
                signInPasswordIcon.classList.remove('fa-eye-slash');
                signInPasswordIcon.classList.add('fa-eye');
            }
        });
    }
    
    // Sign Up Password Toggle
    const toggleSignUpPassword = document.getElementById('toggleSignUpPassword');
    const signUpPassword = document.getElementById('signUpPassword');
    const signUpPasswordIcon = document.getElementById('signUpPasswordIcon');
    
    if (toggleSignUpPassword && signUpPassword && signUpPasswordIcon) {
        toggleSignUpPassword.addEventListener('click', function(e) {
            e.preventDefault();
            if (signUpPassword.type === 'password') {
                signUpPassword.type = 'text';
                signUpPasswordIcon.classList.remove('fa-eye');
                signUpPasswordIcon.classList.add('fa-eye-slash');
            } else {
                signUpPassword.type = 'password';
                signUpPasswordIcon.classList.remove('fa-eye-slash');
                signUpPasswordIcon.classList.add('fa-eye');
            }
        });
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
    // Show welcome modal after page load if disclaimer already accepted
    // Use a slightly longer timeout to ensure all elements are loaded
    setTimeout(() => {
        const disclaimerAccepted = localStorage.getItem('disclaimerAccepted') === 'true';
        const welcomeShown = sessionStorage.getItem('welcomeShown');
        
        if (disclaimerAccepted && welcomeModal && !welcomeShown) {
            welcomeModal.classList.remove('hidden');
            sessionStorage.setItem('welcomeShown', 'true');
            
            // Close modal when clicking outside
            welcomeModal.addEventListener('click', function(e) {
                if (e.target === welcomeModal) {
                    welcomeModal.classList.add('hidden');
                }
            });
        }
    }, 500);

    checkAuthStatus();
    addSaveResultsFunctionality();
    addReportInaccuracyFunctionality();
    addPasswordToggleFunctionality();
});

// Fade in sections on scroll
const sections = document.querySelectorAll('.section-hidden');

if (sections.length > 0) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        observer.observe(section);
    });
}

// --- GLOBAL FORM SUBMIT HANDLER (robust, reload-free, supports dynamic forms) ---
// Use a Set for fast lookup and allow dynamic extension
const reloadFreeForms = new Set([
    'signInForm',
    'signUpForm',
    'reportForm',
    'reviewForm',
    'adminNoteForm',
]);

// Helper to add new form IDs at runtime
function addReloadFreeFormId(id) {
    reloadFreeForms.add(id);
    // Usage: addReloadFreeFormId('myDynamicFormId');
}

document.addEventListener('submit', function(e) {
    if (e.target && reloadFreeForms.has(e.target.id)) {
        e.preventDefault();
        // The specific handler for each form will run as normal
        // (This is a safety net in case a handler is missing e.preventDefault())
    }
}, true); // Use capture to ensure this runs before other handlers

// --- REVIEW FORM STAR RATING AND VALIDATION ---
document.addEventListener('DOMContentLoaded', function() {
    const starRating = document.getElementById('starRating');
    const stars = starRating ? starRating.querySelectorAll('.star') : [];
    const ratingInput = document.getElementById('ratingInput');
    const reviewForm = document.getElementById('reviewForm');
    const testimonyInput = document.getElementById('testimony');
    const nameInput = document.getElementById('reviewerName');
    const testimonialsSection = document.getElementById('testimonials');
    const testimonialsGrid = testimonialsSection ? testimonialsSection.querySelector('.grid') : null;
    const testimonialsCarousel = document.getElementById('testimonialsCarousel');
    const testimonialPrev = document.getElementById('testimonialPrev');
    const testimonialNext = document.getElementById('testimonialNext');

    // Star click interaction
    if (starRating && stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = this.getAttribute('data-value');
                ratingInput.value = rating;
                // Color stars up to selected
                stars.forEach(s => {
                    if (parseInt(s.getAttribute('data-value')) <= rating) {
                        s.style.color = '#FFD700'; // gold
                    } else {
                        s.style.color = '#fff'; // white
                    }
                });
            });
        });
    }

    const testimonialEndpoints = Array.from(new Set([
        API_ENDPOINTS.GET_TESTIMONIALS,
        '/api/testimonials'
    ]));

    async function fetchTestimonialsEndpoint(options = {}) {
        let lastResponse = null;

        for (const endpoint of testimonialEndpoints) {
            const response = await fetch(getApiUrl(endpoint), options);
            lastResponse = response;

            // Try fallback endpoint only when the route is missing.
            if (response.status !== 404) return response;
        }

        return lastResponse;
    }

    // Handle review form submit
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitBtn = getSubmitButton(reviewForm);
            if (submitBtn && submitBtn.dataset.loading === 'true') return;

            if (!nameInput.value.trim() || !ratingInput.value || !testimonyInput.value.trim()) {
                showAlert({
                    icon: 'warning',
                    title: 'Incomplete Form',
                    text: 'Please enter your name, select a star rating, and fill in your testimony.',
                    confirmButtonColor: '#f59e42'
                });
                return;
            }

            setSubmitButtonLoading(reviewForm, true, 'Submitting...');

            try {
                const response = await fetchTestimonialsEndpoint({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput.value.trim(),
                        rating: ratingInput.value,
                        testimony: testimonyInput.value.trim()
                    })
                });

                const contentType = response.headers.get('content-type') || '';
                const data = contentType.includes('application/json')
                    ? await response.json()
                    : { success: false, error: `Server returned ${response.status}.` };

                if (!response.ok) {
                    throw new Error(data.error || `Request failed with status ${response.status}`);
                }

                if (data.success) {
                    showAlert({
                        icon: 'success',
                        title: 'Thank you!',
                        text: 'Your review has been submitted.',
                        confirmButtonColor: '#4f46e5',
                        timer: 3000,
                        showConfirmButton: false
                    }).then(() => {
                        // After alert closes, scroll to testimonials
                        const testimonialsSection = document.getElementById('testimonials');
                        if (testimonialsSection) testimonialsSection.scrollIntoView({ behavior: 'smooth' });
                    });
                    reviewForm.reset();
                    if (starRating && stars.length > 0) {
                        stars.forEach(s => s.style.color = '#fff');
                    }
                    loadTestimonials();
                } else {
                    showAlert({
                        icon: 'error',
                        title: 'Error',
                        text: data.error || 'Failed to submit review.',
                        confirmButtonColor: '#4f46e5'
                    });
                }
            } catch (err) {
                showAlert({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to submit review.',
                    confirmButtonColor: '#4f46e5'
                });
            } finally {
                setSubmitButtonLoading(reviewForm, false);
            }
        });
    }

    // Load testimonials from backend and render
    async function loadTestimonials() {
        if (!testimonialsCarousel) return;
        testimonialsCarousel.innerHTML = '<div class="text-center text-gray-400 py-8">Loading testimonials...</div>';
        try {
            const response = await fetchTestimonialsEndpoint();
            if (!response || !response.ok) {
                throw new Error(`Request failed with status ${response ? response.status : 'unknown'}`);
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error('Server did not return JSON for testimonials endpoint.');
            }

            const testimonials = await response.json();
            if (!Array.isArray(testimonials) || testimonials.length === 0) {
                testimonialsCarousel.innerHTML = '<div class="text-center text-gray-400 py-8">No testimonials yet. Be the first to review!</div>';
                return;
            }
            
            // Add a class to the carousel for better styling
            testimonialsCarousel.classList.add('testimonials-carousel');
            
            testimonialsCarousel.innerHTML = testimonials.map(t => {
                const initials = t.name ? t.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'A';
                const safeName = t.name ? t.name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Anonymous';
                const safeTestimony = t.testimony.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                const fullStars = Math.floor(t.rating);
                const halfStar = t.rating % 1 >= 0.5;
                const emptyStars = 5 - Math.ceil(t.rating);
                const starsHtml =
                    '<i class="fas fa-star"></i>'.repeat(fullStars) +
                    (halfStar ? '<i class="fas fa-star-half-alt"></i>' : '') +
                    '<i class="far fa-star"></i>'.repeat(emptyStars);
                return `
                <div class="testimonial-card snap-center flex-shrink-0">
                    <div class="tc-header">
                        <div class="tc-avatar">${initials}</div>
                        <div class="tc-meta">
                            <span class="tc-name">${safeName}</span>
                            ${t.role ? `<span class="tc-role">${t.role.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>` : ''}
                            <div class="tc-stars">${starsHtml}</div>
                        </div>
                    </div>
                    <blockquote class="tc-quote">${safeTestimony}</blockquote>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('Error loading testimonials:', err);
            testimonialsCarousel.innerHTML = `
                <div class="text-center py-8 px-4">
                    <div class="inline-block p-4 bg-red-50 rounded-full text-red-500 mb-3">
                        <i class="fas fa-exclamation-circle text-2xl"></i>
                    </div>
                    <p class="text-red-400">Failed to load testimonials.</p>
                    <button id="retryLoadTestimonials" type="button" class="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        <i class="fas fa-sync-alt mr-1"></i> Try again
                    </button>
                </div>`;

            const retryBtn = document.getElementById('retryLoadTestimonials');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    loadTestimonials();
                });
            }
        }
    }

    // Initial load
    // Initialize testimonials
    loadTestimonials();

    // Enhanced carousel navigation
    if (testimonialPrev && testimonialNext && testimonialsCarousel) {
        // Dynamically calculate scroll amount based on card width
        function getScrollAmount() {
            const card = testimonialsCarousel.querySelector('.testimonial-card');
            if (card) {
                const style = window.getComputedStyle(card);
                const marginRight = parseInt(style.marginRight) || 0;
                return card.offsetWidth + marginRight;
            }
            return 320; // fallback
        }

        function canScrollNext() {
            // Always allow next if more than one testimonial
            return testimonialsCarousel.scrollWidth > testimonialsCarousel.clientWidth + 10;
        }

        testimonialPrev.addEventListener('click', () => {
            testimonialsCarousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
        testimonialNext.addEventListener('click', () => {
            // Always allow next if more than one testimonial
            if (testimonialsCarousel.scrollWidth > testimonialsCarousel.clientWidth + 10) {
                testimonialsCarousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            } else if (testimonialsCarousel.childElementCount > 1) {
                // On mobile, always allow next if more than one testimonial
                testimonialsCarousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            }
        });

        // Always enable next/prev buttons if more than one testimonial
        function updateNavButtons() {
            if (testimonialsCarousel.childElementCount > 1) {
                testimonialNext.disabled = false;
                testimonialPrev.disabled = false;
                testimonialNext.classList.remove('opacity-50', 'pointer-events-none');
                testimonialPrev.classList.remove('opacity-50', 'pointer-events-none');
            } else {
                testimonialNext.disabled = true;
                testimonialPrev.disabled = true;
                testimonialNext.classList.add('opacity-50', 'pointer-events-none');
                testimonialPrev.classList.add('opacity-50', 'pointer-events-none');
            }
        }
        // Initial state
        updateNavButtons();
        // Update on window resize (for mobile/desktop switch)
        window.addEventListener('resize', updateNavButtons);
        // Also update after testimonials are loaded
        setTimeout(updateNavButtons, 500);
        
        // Update button states based on scroll position
        const updateButtonStates = () => {
            const { scrollLeft, scrollWidth, clientWidth } = testimonialsCarousel;
            testimonialPrev.disabled = scrollLeft === 0;
            testimonialNext.disabled = scrollLeft + clientWidth >= scrollWidth - 10; // Small threshold for float imprecision
            
            // Update button styles based on state
            testimonialPrev.style.opacity = testimonialPrev.disabled ? '0.5' : '1';
            testimonialNext.style.opacity = testimonialNext.disabled ? '0.5' : '1';
            testimonialPrev.style.cursor = testimonialPrev.disabled ? 'not-allowed' : 'pointer';
            testimonialNext.style.cursor = testimonialNext.disabled ? 'not-allowed' : 'pointer';
        };

        // Initial state
        updateButtonStates();

        // Scroll event listener
        testimonialsCarousel.addEventListener('scroll', updateButtonStates);

        // Navigation handlers with smooth scroll
        testimonialPrev.addEventListener('click', () => {
            if (testimonialPrev.disabled) return;
            testimonialsCarousel.scrollBy({
                left: -getScrollAmount(),
                behavior: 'smooth'
            });
        });

        testimonialNext.addEventListener('click', () => {
            if (testimonialNext.disabled) return;
            testimonialsCarousel.scrollBy({
                left: getScrollAmount(),
                behavior: 'smooth'
            });
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && !testimonialPrev.disabled) {
                testimonialPrev.click();
            } else if (e.key === 'ArrowRight' && !testimonialNext.disabled) {
                testimonialNext.click();
            }
        });

        // Handle touch events for mobile swipe
        let touchStartX = 0;
        let touchEndX = 0;

        testimonialsCarousel.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        testimonialsCarousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50; // Minimum distance to trigger swipe
            const swipeDistance = touchEndX - touchStartX;

            if (Math.abs(swipeDistance) > swipeThreshold) {
                if (swipeDistance > 0 && !testimonialPrev.disabled) {
                    // Swipe right - go to previous
                    testimonialPrev.click();
                } else if (swipeDistance < 0 && !testimonialNext.disabled) {
                    // Swipe left - go to next
                    testimonialNext.click();
                }
            }
        };
    }
});

// 3. Always land on Home section after refresh
window.addEventListener('DOMContentLoaded', function() {
    // Hide all modals and dashboard overlays on load
    const modals = document.querySelectorAll('.fixed.inset-0, .modal, .dashboard-modal');
    modals.forEach(m => m.classList.add('hidden'));
    // Optionally scroll to top
    window.scrollTo({ top: 0, behavior: 'auto' });
});



// Placeholder: get current user (simulate backend logic)
function getCurrentUserFrontend() {
    const { userData } = getStoredAuth();
    if (!userData) {
        return null;
    }

    try {
        const parsed = JSON.parse(userData);
        if (parsed && parsed.id) {
            return { id: parseInt(parsed.id, 10) };
        }
    } catch (error) {
        // Ignore parse errors and fall through to guest.
    }

    return null;
}



// Helper to get JWT token
function getJwtToken() {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
}

// --- CUSTOM CONFIRM MODAL FUNCTIONALITY ---
function customConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const msg = document.getElementById('customConfirmMessage');
        const btnOk = document.getElementById('customConfirmOk');
        const btnCancel = document.getElementById('customConfirmCancel');
        let cleanup;
        msg.textContent = message;
        modal.classList.remove('hidden');
        function close(result) {
            modal.classList.add('hidden');
            btnOk.removeEventListener('click', onOk);
            btnCancel.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBgClick);
            document.removeEventListener('keydown', onKey);
            resolve(result);
        }
        function onOk(e) { e.preventDefault(); close(true); }
        function onCancel(e) { e.preventDefault(); close(false); }
        function onBgClick(e) { if (e.target === modal) close(false); }
        function onKey(e) { if (e.key === 'Escape') close(false); }
        btnOk.addEventListener('click', onOk);
        btnCancel.addEventListener('click', onCancel);
        modal.addEventListener('click', onBgClick);
        document.addEventListener('keydown', onKey);
    });
}

// --- HELPER: Prevent default and stop propagation for event ---
function preventDefaultAndStop(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
}