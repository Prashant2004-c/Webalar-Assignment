import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL;

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    console.log("useSocket useEffect START: isAuthenticated", isAuthenticated, "user", user, "isLoading", isLoading, "current socket state", socket);
    
    if (isLoading) {
      console.log("useSocket useEffect: Still loading auth status, returning.");
      return; 
    }

    
    if (isAuthenticated && user?._id && user?.username && !socket) {
      console.log("useSocket useEffect: Auth successful, user data available, and no existing socket. Attempting to connect...");
      console.log("useSocket useEffect: User object at connection attempt:", user);
      const newSocket = io(SOCKET_SERVER_URL, {
        auth: {
          token: localStorage.getItem('token'),
        },
        query: {
          userId: user._id,
          username: user.username,
        },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully!', newSocket.id);
        newSocket.emit('authenticate', {
          userId: user._id,
          username: user.username,
        });
        console.log('Socket: Emitted authenticate event.');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('Socket disconnect reason indicates server-side issue or transport close. Relying on apiClient for full token invalidation.');
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message, err);
        if (err.message === 'Not authorized') {
          console.log('Socket connect_error: Not authorized. Logging out...');
          logout();
        }
      });
      
      setSocket(newSocket);
      console.log("useSocket useEffect: Socket instance set.");

      return () => {
        console.log("useSocket useEffect cleanup: Disconnecting socket and nulling state.");
        newSocket.disconnect();
        setSocket(null);
      };
    } else if (!isAuthenticated && socket) {
      console.log("useSocket useEffect: User logged out/unauthenticated AND socket exists. Disconnecting socket.");
      socket.disconnect();
      setSocket(null);
    } else if (isAuthenticated && socket) {
      console.log("useSocket useEffect: Authenticated and socket already exists. No action needed.");
    } else if (!isAuthenticated && !socket) {
      console.log("useSocket useEffect: Not authenticated and no socket. No action needed.");
    }

    console.log("useSocket useEffect END.");
  }, [isAuthenticated, user, isLoading, logout]); 

  return socket;
}; 