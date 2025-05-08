import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login, register, logout as apiLogout, getCurrentUser } from '../services/api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (storedToken) {
          setToken(storedToken);
          const userData = await getCurrentUser(storedToken);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredToken();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const response = await login(email, password);
      setUser(response.user);
      setToken(response.token);
      await SecureStore.setItemAsync('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleRegister = async (name, email, password, passwordConfirmation) => {
    try {
      const response = await register(name, email, password, passwordConfirmation);
      setUser(response.user);
      setToken(response.token);
      await SecureStore.setItemAsync('token', response.token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await apiLogout(token);
      }
      setUser(null);
      setToken(null);
      await SecureStore.deleteItemAsync('token');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setToken(null);
      await SecureStore.deleteItemAsync('token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};