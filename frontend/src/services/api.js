import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Main Q&A endpoint
  async askQuestion(question, context = null, maxResults = 10) {
    try {
      const response = await api.post('/api/ask', {
        question,
        context,
        max_results: maxResults,
        include_sources: ['documentation', 'github_issue', 'source_code']
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get answer');
    }
  },

  // Search specific sources
  async searchDocumentation(query, limit = 5) {
    try {
      const response = await api.get('/api/search/documentation', {
        params: { q: query, limit }
      });
      return response.data.results;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to search documentation');
    }
  },

  async searchGitHubIssues(query, limit = 5) {
    try {
      const response = await api.get('/api/search/github', {
        params: { q: query, limit }
      });
      return response.data.results;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to search GitHub issues');
    }
  },

  async searchSourceCode(query, limit = 5) {
    try {
      const response = await api.get('/api/search/code', {
        params: { q: query, limit }
      });
      return response.data.results;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to search source code');
    }
  },

  // Get popular questions
  async getPopularQuestions() {
    try {
      const response = await api.get('/api/popular-questions');
      return response.data.questions;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to get popular questions');
    }
  },

  // Submit feedback
  async submitFeedback(feedback) {
    try {
      const response = await api.post('/api/feedback', feedback);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to submit feedback');
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Backend service is not available');
    }
  }
};

export default api;
