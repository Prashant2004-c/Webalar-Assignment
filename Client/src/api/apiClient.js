import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050/api'; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, 
});


apiClient.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);


apiClient.interceptors.response.use(
  (response) => response,
  async function (error) {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

   
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient; 