// Backend API configuration
const LOCAL_API_URL = 'http://localhost:3000';
const PRODUCTION_API_URL = 'https://halal-scanner.onrender.com';

function sanitizeApiBaseUrl(value) {
  if (typeof value !== 'string') return '';

  // Trim and unwrap accidental surrounding quotes from localStorage values.
  const trimmed = value.trim().replace(/^['\"]+|['\"]+$/g, '');
  if (!trimmed) return '';

  // Ignore clearly malformed values that would break Request URL parsing.
  if (/[\s<>{}`]/.test(trimmed)) return '';

  return trimmed;
}

function normalizeApiBaseUrl(value) {
  const sanitized = sanitizeApiBaseUrl(value);
  if (!sanitized) return '';

  // Allow absolute URLs, protocol-relative URLs, and root-relative paths.
  if (/^https?:\/\//i.test(sanitized) || sanitized.startsWith('//') || sanitized.startsWith('/')) {
    return sanitized;
  }

  // Common local dev input without protocol, e.g. localhost:5000
  if (/^[\w.-]+(?::\d+)?(?:\/.*)?$/i.test(sanitized)) {
    const isLocalHost = /^(localhost|127(?:\.\d{1,3}){3})(?::\d+)?(?:\/.*)?$/i.test(sanitized);
    return `${isLocalHost ? 'http' : 'https'}://${sanitized}`;
  }

  return '';
}

function resolveApiBaseUrl() {
  // Optional runtime override for quick testing in browser devtools:
  // localStorage.setItem('API_BASE_URL', 'http://localhost:5000')
  let runtimeApiUrl;
  try {
    runtimeApiUrl = globalThis.localStorage?.getItem('API_BASE_URL');
  } catch (_err) {
    runtimeApiUrl = null;
  }

  const normalizedRuntimeUrl = normalizeApiBaseUrl(runtimeApiUrl);
  if (normalizedRuntimeUrl) return normalizedRuntimeUrl;

  const hostname = globalThis.location?.hostname || '';
  const isLocalHost = /^(localhost|127(?:\.\d{1,3}){3}|::1)$/i.test(hostname);

  const defaultBaseUrl = isLocalHost ? LOCAL_API_URL : PRODUCTION_API_URL;
  return normalizeApiBaseUrl(defaultBaseUrl);
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
  GET_TESTIMONIALS: '/testimonials'
};

// Helper function to get full API URL with error handling
export function getApiUrl(endpoint) {
  try {
    const rawEndpoint = typeof endpoint === 'string' ? endpoint.trim() : '';
    if (!rawEndpoint) return API_BASE_URL || '/';

    // Ensure the API base URL doesn't end with a slash
    const baseUrl = API_BASE_URL.endsWith('/')
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;

    // Ensure the endpoint starts with a slash
    const normalizedEndpoint = rawEndpoint.startsWith('/')
      ? rawEndpoint
      : `/${rawEndpoint}`;

    if (!baseUrl) return normalizedEndpoint;

    // Use URL parsing when possible to avoid malformed joins.
    if (/^https?:\/\//i.test(baseUrl) || baseUrl.startsWith('//')) {
      return new URL(normalizedEndpoint, `${baseUrl}/`).toString();
    }

    return `${baseUrl}${normalizedEndpoint}`;
  } catch (error) {
    console.error('Error constructing API URL:', error);
    throw new Error('Failed to construct API URL');
  }
}
