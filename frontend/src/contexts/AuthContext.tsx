import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  const login = (newToken: string, newUser: User) => {
    console.log('✅ AuthContext.login вызван:', { user: newUser.username, role: newUser.role });
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    console.log('🚪 AuthContext.logout вызван');
    
    // Очищаем состояние
    setToken(null);
    setUser(null);
    
    // Очищаем localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Перенаправляем на страницу входа БЕЗ перезагрузки страницы
    console.log('🔄 Перенаправляем на /login');
    
    // Используем setTimeout чтобы убедиться что состояние обновилось
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const checkAuth = async (): Promise<boolean> => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      console.log('🔍 Нет сохраненных данных аутентификации');
      setIsLoading(false);
      return false;
    }

    try {
      console.log('🔍 Проверяем валидность токена...');
      // Проверяем валидность токена на сервере
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = JSON.parse(storedUser);
        console.log('✅ Токен валидный, пользователь автоматически авторизован:', userData.username);
        setToken(storedToken);
        setUser(userData);
        setIsLoading(false);
        return true;
      } else {
        console.log('❌ Токен недействителен, очищаем данные');
        // Токен недействителен
        logout();
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка проверки аутентификации:', error);
      logout();
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
