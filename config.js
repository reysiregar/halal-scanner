// Backend API configuration
export const API_BASE_URL = 'https://mid-andreana-veez-37004fdb.koyeb.app';

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

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};
