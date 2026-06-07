const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : '/api';

// Helper to get auth token
const getHeaders = () => {
  const token = localStorage.getItem('linkedoc_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Authentication
  async register(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success && result.token) {
      localStorage.setItem('linkedoc_token', result.token);
      localStorage.setItem('linkedoc_user', JSON.stringify(result.user));
    }
    return result;
  },

  logout() {
    localStorage.removeItem('linkedoc_token');
    localStorage.removeItem('linkedoc_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('linkedoc_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Profiles
  async getProfile(id: string) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async updateProfile(id: string, data: any) {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Connections
  async sendConnection(receiverId: string) {
    const res = await fetch(`${API_BASE_URL}/users/connections`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ receiverId }),
    });
    return res.json();
  },

  async respondToConnection(connectionId: string, action: 'ACCEPT' | 'REJECT') {
    const res = await fetch(`${API_BASE_URL}/users/connections/${connectionId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    });
    return res.json();
  },

  // Admin Verification queue
  async getPendingUsers() {
    const res = await fetch(`${API_BASE_URL}/admin/users/pending`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async verifyUser(id: string, status: 'APPROVED' | 'REJECTED') {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/verify`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // Forums & Discussions
  async getCategories() {
    const res = await fetch(`${API_BASE_URL}/forums/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getThreads(categoryId: string) {
    const res = await fetch(`${API_BASE_URL}/forums/categories/${categoryId}/threads`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getThread(threadId: string) {
    const res = await fetch(`${API_BASE_URL}/forums/threads/${threadId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async createThread(categoryId: string, title: string, body: string) {
    const res = await fetch(`${API_BASE_URL}/forums/threads`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ categoryId, title, body }),
    });
    return res.json();
  },

  async createReply(threadId: string, body: string) {
    const res = await fetch(`${API_BASE_URL}/forums/replies`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ threadId, body }),
    });
    return res.json();
  },

  async reportContent(contentType: 'THREAD' | 'REPLY', contentId: string, reason: string) {
    const res = await fetch(`${API_BASE_URL}/forums/report`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contentType, contentId, reason }),
    });
    return res.json();
  },

  // Job Board
  async createJob(title: string, description: string, specialty: string, location: string) {
    const res = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, description, specialty, location }),
    });
    return res.json();
  },

  async getJobs(filters?: { specialty?: string; location?: string }) {
    const params = new URLSearchParams();
    if (filters?.specialty) params.append('specialty', filters.specialty);
    if (filters?.location) params.append('location', filters.location);
    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/jobs?${queryString}` : `${API_BASE_URL}/jobs`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },
};
