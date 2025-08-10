// Backend API configuration
// Use environment variable if available, otherwise fallback to production URL
const DEFAULT_API_URL = 'https://mid-andreana-veez-37004fdb.koyeb.app';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL;

// API endpoints
export const API_ENDPOINTS = {
  ANALYZE_INGREDIENTS: '/analyze-ingredients',
  SIGN_IN: '/auth/signin',
  SIGN_UP: '/auth/signup',
  SAVE_RESULT: '/api/save-result',
  GET_SAVED_RESULTS: '/api/saved-results',
  DELETE_SAVED_RESULT: '/api/saved-results',
  REPORT_INACCURACY: '/api/report-inaccuracy',
  GET_USER_REPORTS: '/api/user/reports',
  GET_ADMIN_REPORTS: '/api/admin/reports',
  UPDATE_REPORT_STATUS: '/api/admin/reports/status',
  GET_TESTIMONIALS: '/api/testimonials'
};

// Helper function to get full API URL with error handling
export const getApiUrl = (endpoint) => {
  try {
    // Ensure the API base URL ends with a slash for proper concatenation
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
};
