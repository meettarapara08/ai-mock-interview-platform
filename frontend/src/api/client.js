import axios from 'axios';

export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach CSRF token on modifying requests
apiClient.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken && !['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Ensures the CSRF cookie is present in the browser by pinging the backend CSRF endpoint.
 */
export async function ensureCsrfToken() {
  try {
    const response = await apiClient.get('/api/auth/csrf/');
    return response.data?.csrfToken;
  } catch (err) {
    console.warn('Failed to prefetch CSRF token:', err);
    return null;
  }
}

export default apiClient;
