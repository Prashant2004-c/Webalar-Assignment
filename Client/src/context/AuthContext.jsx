import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authService } from '../api/authService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); 
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        const token = authService.getToken();

        if (storedUser && token) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        authService.logout(); 
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []); 

  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      navigate('/dashboard'); 
      return response;
    } catch (error) {
      setIsAuthenticated(false);
      throw error; 
    }
  }, [navigate]);

  const register = useCallback(async (username, email, password) => {
    try {
      const response = await authService.register(username, email, password);
      setUser(response.user);
      setIsAuthenticated(true);
      navigate('/dashboard'); // Redirect to dashboard on successful registration
      return response;
    } catch (error) {
      setIsAuthenticated(false);
      throw error; // Re-throw to allow component to handle specific errors
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login'); // Redirect to login on logout
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easier consumption of the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 