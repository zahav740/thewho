import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

interface LoginFormData {
  username: string;
  password: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Очищаем ошибку при изменении инпута
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('🚀 Начинаем вход с данными:', formData);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('🔍 Ответ от сервера:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        console.log('❌ Ответ не OK, получаем ошибку...');
        const errorData = await response.json();
        console.log('❌ Данные ошибки:', errorData);
        throw new Error(errorData.message || 'Ошибка входа');
      }

      const data = await response.json();
      console.log('✅ Полученные данные:', data);
      
      // Сохраняем токен и информацию о пользователе
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('✅ Данные сохранены в localStorage');
      
      // Перенаправляем на главную страницу
      console.log('✅ Перенаправляем на /database...');
      navigate('/database');
    } catch (err) {
      console.log('❌ Ошибка при входе:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Production CRM</h1>
            <p>Вход в систему</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Логин</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="Введите логин"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                placeholder="Введите пароль"
              />
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading || !formData.username || !formData.password}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="login-footer">
            <p>Для входа используйте учетные данные администратора</p>
            <small>kasuf / kasuf123</small>
          </div>
        </div>
      </div>
    </div>
  );
};
