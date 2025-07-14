import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show a loading indicator while checking auth status
  if (isLoading) {
    return <div>Loading authentication...</div>; // You can replace this with a proper spinner
  }

  // If authenticated, render the child routes; otherwise, redirect to login
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute; 