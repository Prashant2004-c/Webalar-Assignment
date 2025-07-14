import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: baseURL, 
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
      // Redirect to login page
      window.location.href = '/login';

      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient; 