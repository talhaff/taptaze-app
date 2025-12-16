import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { adminService } from '../services/api';

interface AuthContextType {
  isAdminLoggedIn: boolean;
  adminUsername: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_STORAGE_KEY = '@taptaze_admin';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminData = await AsyncStorage.getItem(ADMIN_STORAGE_KEY);
      if (adminData) {
        const { username } = JSON.parse(adminData);
        setIsAdminLoggedIn(true);
        setAdminUsername(username);
      }
    } catch (error) {
      console.error('Admin durumu kontrol edilemedi:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await adminService.login(username, password);
      if (response.success) {
        await AsyncStorage.setItem(
          ADMIN_STORAGE_KEY,
          JSON.stringify({ username: response.username })
        );
        setIsAdminLoggedIn(true);
        setAdminUsername(response.username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Giriş hatası:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(ADMIN_STORAGE_KEY);
      setIsAdminLoggedIn(false);
      setAdminUsername(null);
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAdminLoggedIn, adminUsername, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth hook, AuthProvider içinde kullanılmalıdır');
  }
  return context;
};
