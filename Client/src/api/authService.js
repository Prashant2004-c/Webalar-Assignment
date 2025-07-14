import apiClient from './apiClient';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const normalizeUser = (userData) => {
  if (userData && userData.id && !userData._id) {
    return { ...userData, _id: userData.id };
  }
  return userData;
};

export const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;
      const normalizedUser = normalizeUser(user);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      return { success: true, user: normalizedUser, token };
    } catch (error) {
      throw error.response?.data || new Error('Login failed');
    }
  },

  async register(username, email, password) {
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      const { token, user } = response.data;
      const normalizedUser = normalizeUser(user);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      return { success: true, user: normalizedUser, token };
    } catch (error) {
      throw error.response?.data || new Error('Registration failed');
    }
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        return normalizeUser(JSON.parse(userStr));
      }
      return null;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
}; 