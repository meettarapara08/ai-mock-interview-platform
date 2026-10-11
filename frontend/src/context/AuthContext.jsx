import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient, { ensureCsrfToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session on application load
  const checkAuth = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/auth/me/');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    await ensureCsrfToken();
    const res = await apiClient.post('/api/auth/login/', credentials);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (userData) => {
    await ensureCsrfToken();
    const res = await apiClient.post('/api/auth/register/', userData);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await ensureCsrfToken();
      await apiClient.post('/api/auth/logout/');
    } catch (err) {
      console.warn('Logout request failed or already logged out:', err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    await ensureCsrfToken();
    const res = await apiClient.patch('/api/profile/', profileData);
    setUser(res.data.user);
    return res.data;
  };

  const changePassword = async (passwordData) => {
    await ensureCsrfToken();
    const res = await apiClient.post('/api/auth/change-password/', passwordData);
    return res.data;
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
