import axios from 'axios';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  type: 'SONG_ADDED' | 'EVENT_CREATED' | 'EVENT_UPDATED' | 'VERSION_RELEASED';
  icon: string;
  actionUrl?: string;
  metadata?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  total: number;
}

// Función para detectar la URL base automáticamente
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const backendHost = isLocalhost ? 'localhost' : hostname;
  return import.meta.env.VITE_API_URL || `http://${backendHost}:3001/api`;
};

// Función helper para hacer requests con auth
const makeRequest = async (method: 'GET' | 'POST' | 'DELETE', endpoint: string, data?: any) => {
  const token = localStorage.getItem('token');
  const headers: any = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    url: `${getApiBaseUrl()}${endpoint}`,
    headers,
    ...(data && { data })
  };

  const response = await axios(config);
  return response.data;
};

export const newsAPI = {
  // Get all active news
  getNews: async (limit: number = 20): Promise<NewsResponse> => {
    return await makeRequest('GET', `/news?limit=${limit}`);
  },

  // Create news (admin only)
  createNews: async (newsData: {
    title: string;
    description: string;
    type: string;
    icon: string;
    actionUrl?: string;
    metadata?: any;
  }): Promise<{ success: boolean; data: NewsItem; message: string }> => {
    return await makeRequest('POST', '/news', newsData);
  },

  // Deactivate news
  deleteNews: async (id: string): Promise<{ success: boolean; message: string }> => {
    return await makeRequest('DELETE', `/news/${id}`);
  },

  // Cleanup old news
  cleanupNews: async (daysOld: number = 30): Promise<{ success: boolean; message: string; count: number }> => {
    return await makeRequest('POST', '/news/cleanup', { daysOld });
  },
};

export default newsAPI;
