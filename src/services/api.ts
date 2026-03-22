import axios from 'axios';
import type { POI, CreatePOI, UpdatePOI, Narration, LocationUpdate, MenuItem, CreateMenuItem, Review, CreateReview } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// POI API
export const poiApi = {
  getAll: (status?: string) => axiosInstance.get<POI[]>('/POIs', {
    params: { status }
  }),
  
  getById: (id: number) => axiosInstance.get<POI>(`/POIs/${id}`),
  
  create: (data: CreatePOI) => axiosInstance.post<POI>('/POIs', data),
  
  update: (id: number, data: UpdatePOI) => axiosInstance.put<POI>(`/POIs/${id}`, data),
  
  delete: (id: number) => axiosInstance.delete(`/POIs/${id}`),
  
  approve: (id: number) => axiosInstance.put<POI>(`/POIs/${id}/approve`),
  
  reject: (id: number) => axiosInstance.put<POI>(`/POIs/${id}/reject`),
  
  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post(`/POIs/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getHistory: (id: number) => axiosInstance.get(`/POIs/${id}/history`),
};

// POI Translations API
export const translationApi = {
  getByPOI: (poiId: number) => axiosInstance.get(`/POITranslations/poi/${poiId}`),
  
  getByLanguage: (poiId: number, languageCode: string) => 
    axiosInstance.get(`/POITranslations/poi/${poiId}/language/${languageCode}`),
  
  create: (data: any) => axiosInstance.post('/POITranslations', data),
  
  update: (id: number, data: any) => axiosInstance.put(`/POITranslations/${id}`, data),
  
  delete: (id: number) => axiosInstance.delete(`/POITranslations/${id}`),
  
  updateApproval: (id: number, approvalStatus: string, approvedById?: number) =>
    axiosInstance.patch(`/POITranslations/${id}/approval`, { approvalStatus, approvedById }),
};

// Narration API
export const narrationApi = {
  getAll: () => axiosInstance.get<Narration[]>('/Narrations'),
  
  getByPOI: (poiId: number) => axiosInstance.get<Narration[]>(`/Narrations/poi/${poiId}`),
  
  getStats: () => axiosInstance.get('/Narrations/stats'),
};

// Location API
export const locationApi = {
  update: (data: LocationUpdate) => axiosInstance.post('/Locations/update', data),
  
  getHeatmap: () => axiosInstance.get('/Locations/heatmap'),
};

// TTS API
export const ttsApi = {
  synthesize: (text: string, languageCode: string) => 
    axiosInstance.post('/TTS/synthesize', { text, languageCode }),
  
  getNarration: (poiId: number, languageCode: string = 'vi') => 
    axiosInstance.get(`/TTS/narration/${poiId}`, { params: { languageCode } }),
  
  checkAudio: (audioUrl: string) => 
    axiosInstance.get('/TTS/check-audio', { params: { audioUrl } }),
};

// Menu API
export const menuApi = {
  getByPOI: (poiId: number) => axiosInstance.get<MenuItem[]>(`/pois/${poiId}/menu`),
  
  getAll: () => axiosInstance.get<MenuItem[]>('/menu'),
  
  create: (poiId: number, data: CreateMenuItem) => axiosInstance.post<MenuItem>(`/pois/${poiId}/menu`, data),
  
  update: (id: number, data: Partial<CreateMenuItem>) => axiosInstance.put<MenuItem>(`/menu/${id}`, data),
  
  delete: (id: number) => axiosInstance.delete(`/menu/${id}`),
};

// Review API
export const reviewApi = {
  getByPOI: (poiId: number) => axiosInstance.get<Review[]>(`/pois/${poiId}/reviews`),
  
  getAll: () => axiosInstance.get<Review[]>('/reviews'),
  
  create: (poiId: number, data: CreateReview) => axiosInstance.post<Review>(`/pois/${poiId}/reviews`, data),
  
  delete: (id: number) => axiosInstance.delete(`/reviews/${id}`),
  
  getSummary: (poiId: number) => axiosInstance.get(`/pois/${poiId}/reviews/summary`),
};

export default axiosInstance;
