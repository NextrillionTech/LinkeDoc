const API_BASE_URL = 'http://localhost:5000/api';

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
};
