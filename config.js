// Backend API configuration
const LOCAL_API_URL = 'http://localhost:3000';
const PRODUCTION_API_URL = 'https://halal-scanner.onrender.com';

function resolveApiBaseUrl() {
  const viteApiUrl = import.meta.env?.VITE_API_BASE_URL;

  // Optional runtime override for quick testing in browser devtools:
  // localStorage.setItem('API_BASE_URL', 'http://localhost:3000')
  let runtimeApiUrl;
  try {
    runtimeApiUrl = globalThis.localStorage?.getItem('API_BASE_URL');
  } catch (_err) {
    runtimeApiUrl = null;
  }

  if (runtimeApiUrl) return runtimeApiUrl;
  if (viteApiUrl) return viteApiUrl;

  const hostname = globalThis.location?.hostname || '';
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
  return isLocalHost ? LOCAL_API_URL : PRODUCTION_API_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  ANALYZE_INGREDIENTS: '/analyze-ingredients',
  EXTRACT_INGREDIENTS_AI: '/extract-ingredients-ai',
  SIGN_IN: '/auth/signin',
  SIGN_UP: '/auth/signup',
  SAVE_RESULT: '/save-results',
  GET_SAVED_RESULTS: '/user-saved-results',
  DELETE_SAVED_RESULT: (id) => `/saved-results/${id}`,
  REPORT_INACCURACY: '/submit-report',
  GET_USER_REPORTS: '/user-reports',
  GET_ADMIN_REPORTS: '/admin/reports',
  UPDATE_REPORT_STATUS: (id) => `/admin/reports/${id}`,
  GET_TESTIMONIALS: '/api/testimonials'
};

// Helper function to get full API URL with error handling
export function getApiUrl(endpoint) {
  try {
    // Ensure the API base URL doesn't end with a slash
    const baseUrl = API_BASE_URL.endsWith('/') 
      ? API_BASE_URL.slice(0, -1) 
      : API_BASE_URL;
      
    // Ensure the endpoint starts with a slash
    const normalizedEndpoint = endpoint.startsWith('/') 
      ? endpoint 
      : `/${endpoint}`;
      
    return `${baseUrl}${normalizedEndpoint}`;
  } catch (error) {
    console.error('Error constructing API URL:', error);
    throw new Error('Failed to construct API URL');
  }
}
