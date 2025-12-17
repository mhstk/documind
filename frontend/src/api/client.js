const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'documind_token';

// Token management
export const tokenManager = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const token = tokenManager.getToken();

  const config = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    },
  };

  // Add Authorization header if token exists
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Auth
  signup: (email, password, name) => request('/api/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  }),

  login: (email, password) => request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),

  logout: () => request('/api/logout', { method: 'DELETE' }),

  getCurrentUser: () => request('/api/me'),

  getGoogleAuthUrl: () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${apiUrl}/auth/google_oauth2`;
  },

  // Documents
  getDocuments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/documents${query ? `?${query}` : ''}`);
  },

  getDocument: (id) => request(`/api/documents/${id}`),

  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/documents', {
      method: 'POST',
      body: formData,
    });
  },

  deleteDocument: (id) => request(`/api/documents/${id}`, { method: 'DELETE' }),

  // Search
  searchDocuments: (query) => {
    const params = new URLSearchParams({ search: query }).toString();
    return request(`/api/documents?${params}`);
  },

  // Q&A (RAG) with conversation history
  askQuestion: (question, messages = [], summary = null) => request('/api/qa', {
    method: 'POST',
    body: JSON.stringify({ question, messages, summary }),
  }),

  // Chat with specific document (with conversation history)
  chatWithDocument: (documentId, question, messages = [], summary = null) => request(`/api/documents/${documentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ question, messages, summary }),
  }),
};
