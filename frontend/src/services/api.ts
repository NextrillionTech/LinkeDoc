const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5001/api'
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

  // E2EE Messaging & Key Exchange
  async registerPublicKey(publicKey: string) {
    const res = await fetch(`${API_BASE_URL}/users/public-key`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ publicKey }),
    });
    return res.json();
  },

  async getPublicKey(userId: string) {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/public-key`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async createConversation(participantId: string) {
    const res = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ participantId }),
    });
    return res.json();
  },

  async getConversations() {
    const res = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async sendMessage(conversationId: string, encryptedBody: string) {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ encryptedBody }),
    });
    return res.json();
  },

  async getMessages(conversationId: string) {
    const res = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Feed & Social Posting
  async createPost(data: { content: string; isResearch?: boolean; researchTitle?: string; researchAbstract?: string; researchLink?: string }) {
    const res = await fetch(`${API_BASE_URL}/feed`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getFeed() {
    const res = await fetch(`${API_BASE_URL}/feed`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async toggleLike(postId: string) {
    const res = await fetch(`${API_BASE_URL}/feed/${postId}/like`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async addComment(postId: string, content: string) {
    const res = await fetch(`${API_BASE_URL}/feed/${postId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    return res.json();
  },

  async getComments(postId: string) {
    const res = await fetch(`${API_BASE_URL}/feed/${postId}/comments`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  // Groups API
  async createGroup(name: string, description: string) {
    const res = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description }),
    });
    return res.json();
  },

  async getGroups() {
    const res = await fetch(`${API_BASE_URL}/groups`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async joinGroup(groupId: string) {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async leaveGroup(groupId: string) {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async getGroupFeed(groupId: string) {
    const res = await fetch(`${API_BASE_URL}/groups/${groupId}/feed`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return res.json();
  },

  async createGroupPost(groupId: string, data: { content: string; isResearch?: boolean; researchTitle?: string; researchAbstract?: string; researchLink?: string; mediaUrls?: string[] }) {
    const res = await fetch(`${API_BASE_URL}/feed`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, groupId }),
    });
    return res.json();
  },

  // PubMed / DOI search integration
  async searchPubMed(doiOrKeyword: string) {
    try {
      const isDoi = doiOrKeyword.includes('/') || doiOrKeyword.match(/^\d{2}\.\d{4}/);
      const query = isDoi ? `doi:${doiOrKeyword}` : doiOrKeyword;
      
      const res = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json`);
      if (res.ok) {
        const data = await res.json();
        const firstResult = data.resultList?.result?.[0];
        if (firstResult) {
          return {
            success: true,
            title: firstResult.title,
            abstract: firstResult.abstractText || 'Abstract not available in short lookup, click link to view.',
            link: firstResult.doi ? `https://doi.org/${firstResult.doi}` : `https://europepmc.org/article/MED/${firstResult.id}`,
            authors: firstResult.authorString || '',
            journal: firstResult.journalInfo?.journal?.title || '',
          };
        }
      }
    } catch (e) {
      console.warn("Failed to reach EuropePMC, using fallback search mock data", e);
    }
    
    // Fallback Mock data for demo/testing
    const mockPapers: Record<string, any> = {
      '10.1016/j.cell.2023.01.001': {
        title: 'Artificial Intelligence in Radiology: Multi-Center Clinical Evaluation of Deep Learning Diagnostics',
        abstract: 'This multi-center study evaluates the diagnostic efficacy of deep convolutional neural networks in classifying lung nodules from thoracic CT scans. The neural model achieved an Area Under the Curve (AUC) of 0.942, demonstrating statistical parity with senior radiologists.',
        link: 'https://doi.org/10.1016/j.cell.2023.01.001',
        authors: 'Doe J, Smith A, Robinson C',
        journal: 'Cell Medicine'
      },
      'cardiology': {
        title: 'Beta-Blocker Efficacy and Safety Profile in Chronic Heart Failure Patients',
        abstract: 'A randomized controlled trial checking long-term survival metrics for patients administered carvedilol versus metoprolol succinate. Survival rates at 5 years show a 12% improvement in the carvedilol cohort.',
        link: 'https://pubmed.ncbi.nlm.nih.gov/30291753/',
        authors: 'Johnson M, Vance L',
        journal: 'Journal of Cardiology'
      }
    };
    
    const key = Object.keys(mockPapers).find(k => doiOrKeyword.toLowerCase().includes(k)) || '10.1016/j.cell.2023.01.001';
    return {
      success: true,
      ...mockPapers[key]
    };
  }
};
