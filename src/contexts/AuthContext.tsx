import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { message } from 'antd';
import axiosInstance from '../services/api';

interface User {
  username: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'RestaurantOwner';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      // Set token in API client
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const response = await axiosInstance.post('/Auth/login', {
        username,
        password
      });

      console.log('Login response:', response.data);

      // Backend returns PascalCase (C# convention)
      const { token, username: uname, email, fullName, role } = response.data;

      // Save to state
      setToken(token);
      const userData: User = { username: uname, email, fullName, role };
      setUser(userData);

      // Save to localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));

      // Set token in API client
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      message.success(`Chào mừng ${fullName}!`);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
      }
      throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  const logout = (): void => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');

    // Remove token from API client
    delete axiosInstance.defaults.headers.common['Authorization'];

    message.info('Đã đăng xuất');
  };

  const isAdmin = (): boolean => {
    return user?.role === 'Admin';
  };

  const isOwner = (): boolean => {
    return user?.role === 'RestaurantOwner';
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    isAdmin,
    isOwner
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
