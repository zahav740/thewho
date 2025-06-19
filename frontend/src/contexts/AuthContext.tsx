import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

interface RegisterData {
  username: string;
  password: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  register: (registerData: RegisterData) => Promise<{ success: boolean; message: string; user?: User; token?: string }>;
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
    
    // НЕ используем window.location.href - пусть компоненты сами решают куда переходить
    console.log('🔄 Состояние очищено, пользователь разлогинен');
  };

  const register = async (registerData: RegisterData): Promise<{ success: boolean; message: string; user?: User; token?: string }> => {
    try {
      console.log('🚀 AuthContext.register вызван для пользователя:', registerData.username);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Регистрация успешна, автоматически входим в систему');
        
        // Автоматически логиним пользователя после успешной регистрации
        login(data.access_token, data.user);
        
        return {
          success: true,
          message: data.message || 'Registration successful',
          user: data.user,
          token: data.access_token
        };
      } else {
        console.log('❌ Ошибка регистрации:', data.message);
        return {
          success: false,
          message: data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('❌ Ошибка при регистрации:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    }
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
        // Токен недействителен - просто очищаем состояние
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Ошибка проверки аутентификации:', error);
      // При ошибке сети - просто очищаем состояние
      setToken(null);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
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
    register,
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
