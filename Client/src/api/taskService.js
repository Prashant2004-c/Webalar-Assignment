import apiClient from './apiClient';

export const taskService = {
  async createTask(taskData) {
    try {
      const response = await apiClient.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Task creation failed');
    }
  },

  async getTasks() {
    try {
      const response = await apiClient.get('/tasks');
      return response.data.tasks;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch tasks');
    }
  },

  async updateTask(taskId, taskData) {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Task update failed');
    }
  },

  async deleteTask(taskId) {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Task deletion failed');
    }
  },

  async smartAssign(taskId) {
    try {
      const response = await apiClient.put(`/tasks/${taskId}/smart-assign`);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Smart assign failed');
    }
  },

  async getRecentActions(limit = 20) {
    try {
      const response = await apiClient.get(`/actions?limit=${limit}`);
      return response.data.actions;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch recent actions');
    }
  },

  // New function to fetch all users
  async getAllUsers() {
    try {
      const response = await apiClient.get('/auth/users');
      return response.data.users;
    } catch (error) {
      throw error.response?.data || new Error('Failed to fetch users');
    }
  }
}; 