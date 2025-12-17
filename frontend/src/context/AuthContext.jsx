import { createContext, useContext, useState, useEffect } from 'react';
import { api, tokenManager } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
    } catch (error) {
      setUser(null);
      tokenManager.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.user?.token) {
      tokenManager.setToken(data.user.token);
    }
    setUser(data.user);
    return data.user;
  };

  const signup = async (email, password, name) => {
    const data = await api.signup(email, password, name);
    if (data.user?.token) {
      tokenManager.setToken(data.user.token);
    }
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.logout();
    tokenManager.clearToken();
    setUser(null);
  };

  const loginWithGoogle = () => {
    window.location.href = api.getGoogleAuthUrl();
  };

  // Handle OAuth callback token
  const handleOAuthToken = (token) => {
    tokenManager.setToken(token);
    return checkAuth();
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    loginWithGoogle,
    checkAuth,
    handleOAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
