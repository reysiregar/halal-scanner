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

// Modal handling with null checks
const signInModal = document.getElementById('signInModal');
const signUpModal = document.getElementById('signUpModal');
const closeSignIn = document.getElementById('closeSignIn');
const closeSignUp = document.getElementById('closeSignUp');
const showSignUp = document.getElementById('showSignUp');
const showSignIn = document.getElementById('showSignIn');
const signInButton = document.getElementById('signInBtn');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        if (window.innerWidth < 768) {
            mobileMenuBtn.classList.toggle('open');
            mobileMenu.classList.toggle('open');
            document.body.classList.toggle('mobile-menu-open');
        }
    });

    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.classList.remove('mobile-menu-open');
        });
    });

    // Close menu on window resize if it's open
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            mobileMenuBtn.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.classList.remove('mobile-menu-open');
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

// Check if disclaimer has been accepted
const disclaimerModal = document.getElementById('disclaimerModal');
const closeDisclaimer = document.getElementById('closeDisclaimer');
const acceptDisclaimer = document.getElementById('acceptDisclaimer');

// Welcome modal elements (new design)
const welcomeModal = document.getElementById('welcomeModal');
const closeWelcome = document.getElementById('closeWelcome');
const acceptWelcome = document.getElementById('acceptWelcome');
const declineWelcome = document.getElementById('declineWelcome');

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

// Toggle FAQ answers
const faqButtons = document.querySelectorAll('#faqSection button');
if (faqButtons.length > 0) {
    faqButtons.forEach(button => {
        button.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            if (answer) answer.classList.toggle('hidden');
            if (icon) icon.classList.toggle('rotate-180');
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
            Swal.fire({
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
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid File',
                    text: 'Please select a valid image file.',
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
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
            Swal.fire({
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
                    </div>
                    <div class="mt-6 flex justify-between items-center">
                        <button type="button" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                            <i class="fas fa-flag mr-1"></i> Report Inaccuracy
                        </button>
                        <button type="button" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
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

    try {
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loadingIndicator.innerHTML = '<div class="text-white text-lg">Initializing camera...</div>';
        document.body.appendChild(loadingIndicator);

        // Clean up any existing stream
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
                    <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
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
    Swal.fire({
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

// Capture image from camera
const captureBtn = document.getElementById('captureBtn');
if (captureBtn) {
    captureBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const video = document.getElementById('cameraFeed');
        if (!video || !video.srcObject) {
            Swal.fire({
                icon: 'error',
                title: 'Camera Not Ready',
                text: 'Camera is not ready. Please wait a moment and try again.',
                confirmButtonColor: '#ef4444'
            });
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const loadingIndicator = document.getElementById('loadingIndicator');
        const resultsContainer = document.getElementById('resultsContainer');
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');
        if (resultsContainer) resultsContainer.classList.add('hidden');
        setTimeout(function() {
            analyzeCapturedImage(canvas.toDataURL('image/jpeg'));
        }, 2000);
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

// Utility to check if OCR text is likely an ingredient list
function isLikelyIngredientList(text) {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase();
    // Require the word 'ingredient' or 'bahan' (for Indonesian/Malay)
    if (lower.includes('ingredient') || lower.includes('bahan')) return true;
    // Require at least 2 food keywords AND at least 2 commas (to avoid single-word or short lists)
    const foodKeywords = [
        'salt', 'oil', 'sugar', 'flour', 'extract', 'gum', 'acid', 'starch', 'protein', 'spice', 'herb', 'flavour', 'flavor', 'color', 'colour', 'preservative', 'emulsifier', 'thickener', 'lecithin', 'yeast', 'enzyme', 'vitamin', 'whey', 'milk', 'egg', 'soy', 'bean', 'corn', 'wheat', 'gluten', 'dextrose', 'malt', 'monosodium', 'glutamate', 'powder', 'onion', 'garlic', 'pepper', 'seasoning', 'shallot', 'caramel', 'citrate', 'benzoate', 'sorbate', 'carbonate', 'phosphate', 'lactate', 'pectin', 'pectins', 'casein', 'caseinate', 'carrageenan', 'agar', 'xanthan', 'pectin', 'sorbitol', 'mannitol', 'aspartame', 'sucralose', 'saccharin', 'maltodextrin', 'fructose', 'glucose', 'honey', 'molasses', 'syrup', 'vinegar', 'mustard', 'celery', 'cocoa', 'chocolate', 'fruit', 'vegetable', 'juice', 'concentrate', 'fiber', 'fibre', 'seed', 'nut', 'sesame', 'sunflower', 'canola', 'rapeseed', 'palm', 'coconut', 'olive', 'soybean', 'peanut', 'almond', 'cashew', 'hazelnut', 'walnut', 'pistachio', 'macadamia', 'brazil', 'pecan', 'pine', 'chestnut', 'date', 'raisin', 'apricot', 'fig', 'prune', 'plum', 'apple', 'banana', 'orange', 'lemon', 'lime', 'grape', 'berry', 'strawberry', 'blueberry', 'raspberry', 'blackberry', 'cranberry', 'melon', 'watermelon', 'cantaloupe', 'honeydew', 'mango', 'papaya', 'pineapple', 'kiwi', 'guava', 'passion', 'dragon', 'lychee', 'longan', 'rambutan', 'durian', 'jackfruit', 'soursop', 'starfruit', 'carambola', 'tamarind', 'avocado', 'olive', 'artichoke', 'asparagus', 'beet', 'broccoli', 'brussels', 'cabbage', 'carrot', 'cauliflower', 'celery', 'chard', 'chicory', 'collard', 'corn', 'cress', 'cucumber', 'dandelion', 'edamame', 'eggplant', 'endive', 'fennel', 'garlic', 'ginger', 'horseradish', 'jicama', 'kale', 'kohlrabi', 'leek', 'lettuce', 'mushroom', 'okra', 'onion', 'parsnip', 'pea', 'pepper', 'potato', 'pumpkin', 'radish', 'rutabaga', 'shallot', 'spinach', 'squash', 'sweet', 'tomato', 'turnip', 'yam', 'zucchini'
    ];
    const keywordCount = foodKeywords.reduce((count, word) => count + (lower.includes(word) ? 1 : 0), 0);
    const commaCount = (lower.match(/,/g) || []).length;
    if (keywordCount >= 2 && commaCount >= 2) return true;
    // E-number detection: only if 'ingredient' or 'bahan' is present
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
        // Run OCR on the image
        const result = await window.Tesseract.recognize(
            uploadedImagePreview.src,
            'eng',
            { logger: m => {/* Optionally log progress */} }
        );
        const ocrText = result.data.text;
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
        // Generate results HTML based on analysis (reuse previous logic)
        let resultsHTML = `
            <div>
                <h3 class="text-xl font-bold mb-4">Analysis Results</h3>
                <div class="space-y-3 mb-6">
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
                </div>
                <div class="mt-6 flex justify-between items-center">
                    <button type="button" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        <i class="fas fa-flag mr-1"></i> Report Inaccuracy
                    </button>
                    <button type="button" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
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

// Real AI analysis for captured image
async function analyzeCapturedImage(imageData) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');

    // --- NEW: Run OCR on the captured image (if not already) ---
    let ocrText = '';
    try {
        const result = await window.Tesseract.recognize(
            imageData,
            'eng',
            { logger: m => {/* Optionally log progress */} }
        );
        ocrText = result.data.text;
    } catch (err) {
        ocrText = '';
    }
    // --- NEW: Check for empty OCR result ---
    if (!ocrText || ocrText.trim().length === 0) {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-yellow-300 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-700">No Text Detected</h3>
                    <p class="text-gray-500 mt-2">No text was found in the image. Please capture a clear image of the product's ingredient list.</p>
                </div>
            `;
            resultsContainer.classList.remove('hidden');
        }
        return;
    }
    // --- Ingredient list detection ---
    if (!isLikelyIngredientList(ocrText)) {
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-4xl text-yellow-300 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-700">No Ingredient List Detected</h3>
                    <p class="text-gray-500 mt-2">Please capture a clear image of the product's ingredient list.</p>
                </div>
            `;
            resultsContainer.classList.remove('hidden');
        }
        return;
    }
    
    try {
        const response = await fetch(getApiUrl(API_ENDPOINTS.ANALYZE_INGREDIENTS), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredients: ocrText
            })
        });

        if (!response.ok) {
            throw new Error('Analysis failed');
        }

        const data = await response.json();
        const analysis = data.analysis;
        
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        
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
                </div>
                <div class="mt-6 flex justify-between items-center">
                    <button type="button" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        <i class="fas fa-flag mr-1"></i> Report Inaccuracy
                    </button>
                    <button type="button" class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                        <i class="fas fa-save mr-1"></i> Save Results
                    </button>
                </div>
            </div>
        `;
        
        if (resultsContainer) {
            resultsContainer.innerHTML = resultsHTML;
            resultsContainer.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        
        // Show error message
        const errorHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-300 mb-4"></i>
                <h3 class="text-xl font-medium text-gray-700">Analysis Failed</h3>
                <p class="text-gray-500 mt-2">Unable to analyze ingredients. Please try again.</p>
            </div>
        `;
        
        if (resultsContainer) {
            resultsContainer.innerHTML = errorHTML;
            resultsContainer.classList.remove('hidden');
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
        console.log('[DEBUG] signUpForm submit handler triggered');
        e.preventDefault();
        
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
            Swal.fire({
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
                Swal.fire({
                    icon: 'error',
                    title: 'Sign Up Failed',
                    text: data.error,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444'
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Account Created Successfully!',
                    text: 'Your account has been created. Please sign in to continue.',
                    confirmButtonText: 'Sign In',
                    confirmButtonColor: '#4f46e5',
                    showCancelButton: false,
                    allowOutsideClick: false
                }).then((result) => {
                    if (signUpModal) signUpModal.classList.add('hidden');
                    if (signInModal) signInModal.classList.remove('hidden');
                    signUpForm.reset();
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Sign Up Error',
                text: 'An error occurred during sign up. Please try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
        });
    });
}

// --- SIGN IN LOGIC ---
const signInForm = document.getElementById('signInForm');
if (signInForm) {
    signInForm.addEventListener('submit', function(e) {
        console.log('[DEBUG] signInForm submit handler triggered');
        e.preventDefault();
        
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
            Swal.fire({
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
                Swal.fire({
                    icon: 'error',
                    title: 'Sign In Failed',
                    text: data.error,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#ef4444'
                });
            } else {
                const user = data.user;
                const token = data.token;
                localStorage.setItem('currentUser', JSON.stringify(user));
                localStorage.setItem('jwtToken', token);
                Swal.fire({
                    icon: 'success',
                    title: 'Welcome Back!',
                    text: `Hello ${user.name}, you have been successfully signed in.`,
                    confirmButtonText: 'Continue',
                    confirmButtonColor: '#4f46e5',
                    showCancelButton: false,
                    allowOutsideClick: false
                }).then((result) => {
                    if (signInModal) signInModal.classList.add('hidden');
                    updateUIAfterLogin(user);
                    signInForm.reset();
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Sign In Error',
                text: 'An error occurred during sign in. Please try again.',
                confirmButtonText: 'OK',
                confirmButtonColor: '#ef4444'
            });
        });
    });
}

// --- USER AUTHENTICATION STATE MANAGEMENT ---
let currentUser = null;

// Check if user is logged in on page load
function checkAuthStatus() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            updateUIAfterLogin(currentUser);
        } catch (e) {
            localStorage.removeItem('currentUser');
        }
    }
}

// Update UI after login
function updateUIAfterLogin(user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Update header buttons
    const signInBtn = document.getElementById('signInBtn');
    const userDashboardBtn = document.getElementById('userDashboardBtn');
    const adminDashboardBtn = document.getElementById('adminDashboardBtn');
    
    const signInBtnText = signInBtn.querySelector('span');
    const signInBtnIcon = signInBtn.querySelector('i');
    
    if (signInBtnText) signInBtnText.textContent = 'Sign Out';
    if (signInBtnIcon) {
        signInBtnIcon.classList.remove('fa-sign-in-alt');
        signInBtnIcon.classList.add('fa-sign-out-alt');
    }
    if (user.email === 'admin@halalscanner.com') {
        // Admin: show only admin dashboard
        if (adminDashboardBtn) adminDashboardBtn.classList.remove('hidden');
        if (userDashboardBtn) userDashboardBtn.classList.add('hidden');
    } else {
        // Regular user: show only user dashboard
        if (userDashboardBtn) userDashboardBtn.classList.remove('hidden');
        if (adminDashboardBtn) adminDashboardBtn.classList.add('hidden');
    }
}

// Sign out functionality
function signOut() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwtToken');
    
    const signInBtn = document.getElementById('signInBtn');
    const userDashboardBtn = document.getElementById('userDashboardBtn');
    const adminDashboardBtn = document.getElementById('adminDashboardBtn'); // Ensure admin button is also handled
    const signInBtnText = signInBtn ? signInBtn.querySelector('span') : null;
    const signInBtnIcon = signInBtn ? signInBtn.querySelector('i') : null;
    
    if (signInBtnText) signInBtnText.textContent = 'Sign In';
    if (signInBtnIcon) {
        signInBtnIcon.classList.remove('fa-sign-out-alt');
        signInBtnIcon.classList.add('fa-sign-in-alt');
    }
    if (userDashboardBtn) userDashboardBtn.classList.add('hidden');
    if (adminDashboardBtn) adminDashboardBtn.classList.add('hidden');
    
    // Close any open modals
    const modals = ['signInModal', 'signUpModal', 'reportModal', 'userDashboardModal', 'adminDashboardModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    });
}

// Update sign in button click handler
const signInBtn = document.getElementById('signInBtn');
if (signInBtn) {
    signInBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (currentUser) {
            // Show confirmation dialog before sign out
            Swal.fire({
                title: 'Are you sure you want to sign out?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Sign Out',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#4f46e5',
            }).then((result) => {
                if (result.isConfirmed) {
                    signOut();
                    location.reload(); // Reload to update UI (Dashboard button hidden)
                }
            });
        } else {
            const signInModal = document.getElementById('signInModal');
            if (signInModal) signInModal.classList.remove('hidden');
        }
    });
}

// --- DASHBOARD FUNCTIONALITY ---
const userDashboardBtn = document.getElementById('userDashboardBtn');
const userDashboardModal = document.getElementById('userDashboardModal');
const closeUserDashboard = document.getElementById('closeUserDashboard');

if (userDashboardBtn) {
    userDashboardBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Always hide the Sign In modal if it's open
        const signInModal = document.getElementById('signInModal');
        if (signInModal) signInModal.classList.add('hidden');
        if (userDashboardModal) {
            userDashboardModal.classList.remove('hidden');
            loadUserDashboard();
        }
    });
}

if (closeUserDashboard) {
    closeUserDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        if (userDashboardModal) userDashboardModal.classList.add('hidden');
    });
}

// Tab functionality for user dashboard
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = button.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(btn => {
            btn.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
            btn.classList.add('text-gray-500');
        });
        button.classList.add('active', 'border-indigo-500', 'text-indigo-600');
        button.classList.remove('text-gray-500');
        
        // Show target tab content
        tabContents.forEach(content => {
            content.classList.add('hidden');
        });
        const targetContent = document.getElementById(`${targetTab}-tab`);
        if (targetContent) targetContent.classList.remove('hidden');
        
        // Load data for the selected tab
        if (targetTab === 'saved-results') {
            loadSavedResults();
        } else if (targetTab === 'reports') {
            loadUserReports();
        }
    });
});

async function loadUserDashboard() {
    await loadSavedResults();
    await loadUserReports();
}

async function loadSavedResults() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(getApiUrl(API_ENDPOINTS.GET_SAVED_RESULTS), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displaySavedResults(data.saved_results);
        } else {
            throw new Error(data.error || 'Failed to load saved results');
        }
    } catch (error) {
        console.error('Error loading saved results:', error);
        document.getElementById('savedResultsList').innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load saved results</p>
            </div>
        `;
    }
}

function displaySavedResults(results) {
    const container = document.getElementById('savedResultsList');
    
    if (!results || results.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-save text-2xl mb-2"></i>
                <p>No saved results yet</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    results.forEach(result => {
        const resultData = result.result_data;
        const date = new Date(result.created_at).toLocaleDateString();
        
        html += `
            <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h5 class="font-medium">Scan Result - ${date}</h5>
                        <p class="text-sm text-gray-600">Overall Status: ${resultData.overallStatus}</p>
                    </div>
                    <button type="button" class="delete-saved-result text-red-600 hover:text-red-800" data-id="${result._id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="text-sm text-gray-600">
                    <p><strong>Ingredients:</strong> ${resultData.ingredients || 'N/A'}</p>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add delete event listeners with confirmation
    document.querySelectorAll('.delete-saved-result').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const resultId = this.getAttribute('data-id');
            Swal.fire({
                title: 'Delete Saved Result?',
                text: 'Are you sure you want to delete this saved result? This action cannot be undone.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Delete',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#4f46e5'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await deleteSavedResult(resultId);
                }
            });
        });
    });
}

function displayUserReports(reports) {
    const container = document.getElementById('userReportsList');
    
    if (!reports || reports.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-clipboard-list text-2xl mb-2"></i>
                <p>No reports found</p>
                <p class="text-sm mt-2">Your submitted reports will appear here</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `;
    
    reports.forEach(report => {
        const date = new Date(report.createdAt).toLocaleDateString();
        let statusBadge = '';
        
        switch(report.status) {
            case 'pending':
                statusBadge = 'bg-yellow-100 text-yellow-800';
                break;
            case 'in_progress':
                statusBadge = 'bg-blue-100 text-blue-800';
                break;
            case 'resolved':
                statusBadge = 'bg-green-100 text-green-800';
                break;
            case 'rejected':
                statusBadge = 'bg-red-100 text-red-800';
                break;
            default:
                statusBadge = 'bg-gray-100 text-gray-800';
        }
        
        html += `
            <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium">${report.item_name || 'Unnamed Item'}</h4>
                    <span class="text-xs px-2 py-1 rounded-full ${statusBadge}">
                        ${report.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-2">${report.reason || 'No reason provided'}</p>
                <div class="text-xs text-gray-400 flex justify-between items-center">
                    <span>${date}</span>
                    ${report.admin_note ? `
                        <button class="text-blue-500 hover:underline" 
                                onclick="document.getElementById('adminNoteText').textContent='${report.admin_note.replace(/'/g, "\\'")}'; 
                                         document.getElementById('adminNoteModal').classList.remove('hidden');">
                            View Note
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

async function loadUserReports() {
    if (!currentUser) return;
    
    try {
        const token = localStorage.getItem('jwtToken');
        const response = await fetch(getApiUrl(API_ENDPOINTS.GET_USER_REPORTS), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayUserReports(data.reports);
        } else {
            throw new Error(data.error || 'Failed to load reports');
        }
    } catch (error) {
        console.error('Error loading user reports:', error);
        document.getElementById('userReportsList').innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Failed to load reports</p>
            </div>
        `;
    }
}

async function deleteSavedResult(resultId) {
    try {
        const response = await fetch(`${getApiUrl(API_ENDPOINTS.DELETE_SAVED_RESULT)}/${resultId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                'user-id': currentUser.id,
                'user-email': currentUser.email,
                'user-name': currentUser.name
            }
        });
        
        if (response.ok) {
            // Remove the deleted item from the UI without reloading
            const btn = document.querySelector(`.delete-saved-result[data-id="${resultId}"]`);
            if (btn) {
                const card = btn.closest('.bg-gray-50, .saved-result-card');
                if (card) card.remove();
            }
            Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Saved result deleted.',
                timer: 3000,
                showConfirmButton: false
            });
            // If no more cards, show empty state
            const container = document.getElementById('savedResultsList');
            if (container && container.children.length === 0) {
                container.innerHTML = `<div class="text-center py-8 text-gray-500"><i class="fas fa-save text-2xl mb-2"></i><p>No saved results yet</p></div>`;
            }
        } else {
            throw new Error('Failed to delete saved result');
        }
    } catch (error) {
        console.error('Error deleting saved result:', error);
        Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Failed to delete saved result',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444'
        });
    }
}

async function loadAdminReports() {
    if (!currentUser || currentUser.id !== 1) return;
    
    try {
        const response = await fetch(getApiUrl(API_ENDPOINTS.GET_ADMIN_REPORTS), {
            headers: {
                'user-id': currentUser.id,
                'user-email': currentUser.email,
                'user-name': currentUser.name
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayAdminReports(data.reports);
        } else {
            throw new Error(data.error || 'Failed to load admin reports');
        }
    } catch (error) {
        console.error('Error loading admin reports:', error);
        const adminReportsList = document.getElementById('adminReportsList');
        if (adminReportsList) {
            adminReportsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Failed to load reports: ${error.message}</p>
                </div>
            `;
        }
    }
}

function displayAdminReports(reports) {
    const container = document.getElementById('adminReportsList');
    
    if (!reports || reports.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-flag text-2xl mb-2"></i>
                <p>No reports to review</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    reports.forEach(report => {
        const date = new Date(report.created_at).toLocaleDateString();
        const statusColor = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'solved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        }[report.status] || 'bg-gray-100 text-gray-800';
        
        html += `
            <div class="bg-white border rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h5 class="font-medium">${report.item_name}</h5>
                        <p class="text-sm text-gray-600">Reported by: ${report.user_name} (${report.user_email})</p>
                    </div>
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${statusColor}">
                        ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${report.reason}</p>
                <div class="text-xs text-gray-500 mb-3">Submitted: ${date}</div>
                
                <div class="flex space-x-2">
                    <button class="update-report-status bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700" 
                            data-id="${report.id}" data-status="solved">
                        Mark Solved
                    </button>
                    <button class="update-report-status bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700" 
                            data-id="${report.id}" data-status="rejected">
                        Reject
                    </button>
                    <button class="add-admin-note bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700" 
                            data-id="${report.id}">
                        Add Note
                    </button>
                    <button class="delete-admin-report bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300" 
                            data-id="${report.id}" data-status="${report.status}">
                        Delete
                    </button>
                </div>
                
                ${report.admin_note ? `
                    <div class="mt-3 p-2 bg-blue-50 rounded text-sm">
                        <strong>Admin Note:</strong> ${report.admin_note}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Add event listeners for admin actions
    document.querySelectorAll('.update-report-status').forEach(button => {
        button.addEventListener('click', async function() {
            const reportId = this.getAttribute('data-id');
            const status = this.getAttribute('data-status');
            await updateReportStatus(reportId, status);
        });
    });
    
    document.querySelectorAll('.add-admin-note').forEach(button => {
        button.addEventListener('click', function() {
            const reportId = this.getAttribute('data-id');
            addAdminNote(reportId);
        });
    });

    // Delete report (admin)
    document.querySelectorAll('.delete-admin-report').forEach(button => {
        button.addEventListener('click', async function() {
            const reportId = this.getAttribute('data-id');
            const status = this.getAttribute('data-status');
            if (status === 'pending') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Action Required',
                    text: 'You must review the report (mark solved or reject) before deleting.',
                    confirmButtonColor: '#f59e42'
                });
                return;
            }
            const confirmed = await customConfirm('Are you sure you want to delete this report?');
            if (confirmed) {
                try {
                    const response = await fetch(getApiUrl(API_ENDPOINTS.DELETE_REPORT) + `/${reportId}`, {
                        method: 'DELETE',
                        headers: {
                            'user-id': currentUser.id,
                            'user-email': currentUser.email,
                            'user-name': currentUser.name
                        }
                    });
                    if (response.ok) {
                        activateAdminReportsTab();
                        loadAdminReports();
                    } else {
                        const data = await response.json();
                        Swal.fire({
                            icon: 'error',
                            title: 'Delete Failed',
                            text: data.error || 'Failed to delete report',
                            confirmButtonColor: '#ef4444'
                        });
                    }
                } catch (err) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Delete Failed',
                        text: 'Failed to delete report',
                        confirmButtonColor: '#ef4444'
                    });
                }
            }
        });
    });
}

async function updateReportStatus(reportId, status, adminNote) {
    try {
        const body = { status: status };
        if (adminNote !== undefined) body.admin_note = adminNote;
        const response = await fetch(getApiUrl(API_ENDPOINTS.UPDATE_REPORT_STATUS) + `/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'user-id': currentUser.id,
                'user-email': currentUser.email,
                'user-name': currentUser.name
            },
            body: JSON.stringify(body)
        });
        if (response.ok) {
            activateAdminReportsTab();
            loadAdminReports(); // Reload the list
        } else {
            throw new Error('Failed to update report status');
        }
    } catch (error) {
        console.error('Error updating report status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Failed to update report status',
            confirmButtonColor: '#ef4444'
        });
    }
}

// --- ADMIN NOTE MODAL FUNCTIONALITY ---
let currentReportId = null;

function addAdminNote(reportId) {
    currentReportId = reportId;
    const adminNoteModal = document.getElementById('adminNoteModal');
    const adminNoteText = document.getElementById('adminNoteText');
    
    if (adminNoteModal && adminNoteText) {
        adminNoteText.value = ''; // Clear previous note
        adminNoteModal.classList.remove('hidden');
        adminNoteText.focus(); // Focus on the textarea
    }
}

// Admin Note Modal Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const adminNoteModal = document.getElementById('adminNoteModal');
    const closeAdminNoteModal = document.getElementById('closeAdminNoteModal');
    const cancelAdminNote = document.getElementById('cancelAdminNote');
    const adminNoteForm = document.getElementById('adminNoteForm');
    const adminNoteText = document.getElementById('adminNoteText');
    
    // Close modal with X button
    if (closeAdminNoteModal) {
        closeAdminNoteModal.addEventListener('click', function(e) {
            e.preventDefault();
            if (adminNoteModal) adminNoteModal.classList.add('hidden');
        });
    }
    
    // Close modal with Cancel button
    if (cancelAdminNote) {
        cancelAdminNote.addEventListener('click', function(e) {
            e.preventDefault();
            if (adminNoteModal) adminNoteModal.classList.add('hidden');
        });
    }
    
    // Close modal when clicking outside
    if (adminNoteModal) {
        adminNoteModal.addEventListener('click', function(e) {
            if (e.target === adminNoteModal) {
                e.preventDefault();
                adminNoteModal.classList.add('hidden');
            }
        });
    }
    
    // Handle form submission
    if (adminNoteForm) {
        adminNoteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const note = adminNoteText.value.trim();
            if (note && currentReportId) {
                updateReportStatus(currentReportId, 'solved', note);
                adminNoteModal.classList.add('hidden');
                adminNoteForm.reset();
            }
        });
    }
    
    // Handle Escape key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && adminNoteModal && !adminNoteModal.classList.contains('hidden')) {
            adminNoteModal.classList.add('hidden');
        }
    });
});

// --- SAVE RESULTS FUNCTIONALITY ---
function addSaveResultsFunctionality() {
    // Add event listeners to all "Save Results" buttons
    document.addEventListener('click', async function(e) {
        const btn = e.target.closest('button');
        if (btn && btn.textContent.includes('Save Results')) {
            e.preventDefault();
            e.stopPropagation();
            if (!currentUser) {
                Swal.fire({
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
                Swal.fire({
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
                const response = await fetch(getApiUrl(API_ENDPOINTS.SAVE_RESULTS), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                        'user-id': currentUser.id,
                        'user-email': currentUser.email,
                        'user-name': currentUser.name
                    },
                    body: JSON.stringify({ result_data: scanData })
                });
                const data = await response.json();
                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Results Saved',
                        text: 'Your scan results have been saved successfully.',
                        timer: 3000,
                        showConfirmButton: false
                    });
                    if (document.getElementById('userDashboardModal') && !document.getElementById('userDashboardModal').classList.contains('hidden')) {
                        loadSavedResults();
                    }
                } else {
                    throw new Error(data.error || 'Failed to save results');
                }
            } catch (error) {
                Swal.fire({
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
        if (btn && btn.textContent.includes('Report Inaccuracy')) {
            e.preventDefault();
            e.stopPropagation();
            if (!currentUser) {
                Swal.fire({
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
            const resultsContainer = btn.closest('.bg-white') || btn.closest('.results-container');
            if (resultsContainer) {
                const itemNameElement = resultsContainer.querySelector('h3, h4, h5');
                if (itemNameElement) {
                    const reportItemName = document.getElementById('reportItemName');
                    if (reportItemName) {
                        reportItemName.value = itemNameElement.textContent.replace('Analysis Results', '').trim();
                    }
                }
            }
            const reportModal = document.getElementById('reportModal');
            if (reportModal) reportModal.classList.remove('hidden');
        }
    });
}

// --- REPORT MODAL FUNCTIONALITY ---
const reportModal = document.getElementById('reportModal');
const closeReportModal = document.getElementById('closeReportModal');
const reportForm = document.getElementById('reportForm');

if (closeReportModal) {
    closeReportModal.addEventListener('click', (e) => {
        e.preventDefault();
        if (reportModal) reportModal.classList.add('hidden');
    });
}

if (reportForm) {
    reportForm.addEventListener('submit', async function(e) {
        console.log('[DEBUG] reportForm submit handler triggered');
        e.preventDefault();
        
        if (!currentUser) {
            Swal.fire({
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
            Swal.fire({
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
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    'user-id': currentUser.id,
                    'user-email': currentUser.email,
                    'user-name': currentUser.name
                },
                body: JSON.stringify({ item_name: itemName, reason: reason })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Report Submitted',
                    text: 'Your report has been submitted successfully.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#4f46e5'
                });
                // Optionally, update the dashboard if it's open
                if (document.getElementById('userDashboardModal') && !document.getElementById('userDashboardModal').classList.contains('hidden')) {
                    loadUserReports();
                }
            } else {
                throw new Error(data.error || 'Failed to submit report');
            }
        } catch (error) {
            Swal.fire({
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

    // Handle review form submit
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!nameInput.value.trim() || !ratingInput.value || !testimonyInput.value.trim()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Incomplete Form',
                    text: 'Please enter your name, select a star rating, and fill in your testimony.',
                    confirmButtonColor: '#f59e42'
                });
                return;
            }
            try {
                const response = await fetch(getApiUrl(API_ENDPOINTS.GET_TESTIMONIALS), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput.value.trim(),
                        rating: ratingInput.value,
                        testimony: testimonyInput.value.trim()
                    })
                });
                const data = await response.json();
                if (data.success) {
                    Swal.fire({
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
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error || 'Failed to submit review.',
                        confirmButtonColor: '#4f46e5'
                    });
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to submit review.',
                    confirmButtonColor: '#4f46e5'
                });
            }
        });
    }

    // Load testimonials from backend and render
    async function loadTestimonials() {
        if (!testimonialsCarousel) return;
        testimonialsCarousel.innerHTML = '<div class="text-center text-gray-400 py-8">Loading testimonials...</div>';
        try {
            const response = await fetch(getApiUrl(API_ENDPOINTS.GET_TESTIMONIALS));
            const testimonials = await response.json();
            if (!Array.isArray(testimonials) || testimonials.length === 0) {
                testimonialsCarousel.innerHTML = '<div class="text-center text-gray-400 py-8">No testimonials yet. Be the first to review!</div>';
                return;
            }
            
            // Add a class to the carousel for better styling
            testimonialsCarousel.classList.add('testimonials-carousel');
            
            testimonialsCarousel.innerHTML = testimonials.map(t => `
                <div class="testimonial-card bg-white p-4 rounded-xl shadow-md snap-center flex-shrink-0 relative overflow-hidden">
                    <div class="flex flex-col items-center text-center relative z-10">
                        <div class="avatar-sm mb-2">
                            <span class="avatar-initials">${t.name ? t.name.charAt(0).toUpperCase() : 'A'}</span>
                        </div>
                        <h4 class="testimonial-name">${t.name ? t.name.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Anonymous'}</h4>
                        ${t.role ? `<p class=\"testimonial-role\">${t.role}</p>` : ''}
                        <div class="testimonial-stars">
                            ${'<i class=\"fas fa-star\"></i>'.repeat(Math.floor(t.rating))}
                            ${t.rating % 1 >= 0.5 ? '<i class=\"fas fa-star-half-alt\"></i>' : ''}
                            ${'<i class=\"far fa-star\"></i>'.repeat(5 - Math.ceil(t.rating))}
                        </div>
                        <p class="testimonial-text mt-2">${t.testimony.replace(/"/g, '&quot;')}</p>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error loading testimonials:', err);
            testimonialsCarousel.innerHTML = `
                <div class="text-center py-8 px-4">
                    <div class="inline-block p-4 bg-red-50 rounded-full text-red-500 mb-3">
                        <i class="fas fa-exclamation-circle text-2xl"></i>
                    </div>
                    <p class="text-red-400">Failed to load testimonials.</p>
                    <button onclick="loadTestimonials()" class="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        <i class="fas fa-sync-alt mr-1"></i> Try again
                    </button>
                </div>`;
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

        testimonialPrev.addEventListener('click', () => {
            testimonialsCarousel.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
        testimonialNext.addEventListener('click', () => {
            testimonialsCarousel.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });
        
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
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        testimonialNext.addEventListener('click', () => {
            if (testimonialNext.disabled) return;
            testimonialsCarousel.scrollBy({
                left: scrollAmount,
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
    // Try to get from localStorage/session or fallback to guest
    const userId = localStorage.getItem('userId');
    if (userId) {
        return { id: parseInt(userId) };
    }
    return null; // guest
}



// Helper to get JWT token
function getJwtToken() {
    return localStorage.getItem('jwtToken') || '';
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

// Helper to activate the Inaccuracy Reports tab in admin dashboard
function activateAdminReportsTab() {
    const tabBtn = document.querySelector('.admin-tab-button[data-tab="admin-reports"]');
    const tabContent = document.getElementById('admin-reports-tab');
    const allTabBtns = document.querySelectorAll('.admin-tab-button');
    const allTabContents = document.querySelectorAll('.admin-tab-content');
    if (tabBtn && tabContent) {
        allTabBtns.forEach(btn => btn.classList.remove('active', 'border-b-2', 'border-indigo-500', 'text-indigo-600'));
        tabBtn.classList.add('active', 'border-b-2', 'border-indigo-500', 'text-indigo-600');
        allTabContents.forEach(c => c.classList.add('hidden'));
        tabContent.classList.remove('hidden');
    }
}

// --- GLOBAL DEBUG: Log before page reload ---
window.addEventListener('beforeunload', () => {
  console.log('[DEBUG] Page is about to reload');
});

// --- HELPER: Prevent default and stop propagation for event ---
function preventDefaultAndStop(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
}