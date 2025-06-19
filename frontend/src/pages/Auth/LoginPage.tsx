import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, Typography, AutoComplete, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useUsernameSearch } from '../../hooks/useUsernameSearch';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import './LoginPage.css';

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
  remember?: boolean;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

export const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const { searchResults, isLoading: isSearching, searchUsernames, clearResults } = useUsernameSearch();

  // Если пользователь уже авторизован, перенаправляем его
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Пользователь уже авторизован, перенаправляем на /database');
      navigate('/database', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Загружаем сохраненные учетные данные при инициализации
  useEffect(() => {
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      try {
        const { username, password } = JSON.parse(savedCredentials);
        console.log('💾 Загружаем сохраненные данные для:', username);
        form.setFieldsValue({
          username,
          password,
          remember: true
        });
      } catch (error) {
        console.error('Ошибка загрузки сохраненных данных:', error);
      }
    }
  }, [form]);

  // Функция для получения опций автодополнения из БД
  const getUsernameOptions = (searchText: string) => {
    return searchResults.map(username => ({
      value: username,
      label: (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          padding: '4px 0'
        }}>
          <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          {username}
          <Text type="secondary" style={{ marginLeft: 'auto', fontSize: '12px' }}>
            registered user
          </Text>
        </div>
      )
    }));
  };

  const handleUsernameSearch = (value: string) => {
    console.log('🔍 Поиск username:', value);
    if (value && value.length >= 2) {
      searchUsernames(value);
    } else {
      clearResults();
    }
  };

  const handleSubmit = async (values: LoginFormData) => {
    setIsLoading(true);

    console.log('🚀 Начинаем вход с данными:', { username: values.username, remember: values.remember });

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password
        }),
      });

      console.log('🔍 Ответ от сервера:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Ошибка входа:', errorData);
        throw new Error(errorData.message || t('auth.invalid_credentials'));
      }

      const data = await response.json();
      console.log('✅ Полученные данные:', { user: data.user.username, role: data.user.role });
      
      // Сохраняем или удаляем учетные данные в зависимости от чекбокса
      if (values.remember) {
        localStorage.setItem('savedCredentials', JSON.stringify({
          username: values.username,
          password: values.password
        }));
        console.log('✅ Учетные данные сохранены');
      } else {
        localStorage.removeItem('savedCredentials');
        console.log('🗑️ Учетные данные удалены');
      }
      
      // Вызываем login из AuthContext
      login(data.access_token, data.user);
      
      console.log('✅ Авторизация успешна, перенаправляем...');
      
      // Перенаправляем на главную страницу
      navigate('/database', { replace: true });
      
    } catch (err) {
      console.log('❌ Ошибка при входе:', err);
      message.error(err instanceof Error ? err.message : t('auth.login_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <LanguageSwitcher />
        </div>
        
        <Card
          style={{
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '12px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ marginBottom: '8px' }}>
              Production CRM
            </Title>
            <Text type="secondary">
              {t('auth.login')}
            </Text>
          </div>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label={t('auth.username')}
              rules={[
                { required: true, message: t('auth.username') + ' ' + t('shifts.required_field') }
              ]}
            >
              <AutoComplete
                options={getUsernameOptions(form.getFieldValue('username') || '')}
                placeholder={t('auth.username')}
                disabled={isLoading}
                filterOption={false}
                onSearch={handleUsernameSearch}
                onSelect={(value) => {
                  form.setFieldsValue({ username: value });
                  clearResults();
                }}
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: '300px' }}
                notFoundContent={isSearching ? <Spin size="small" /> : null}
              >
                <Input
                  prefix={<UserOutlined />}
                  suffix={isSearching ? <Spin size="small" /> : <SearchOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder={t('auth.username')}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </AutoComplete>
            </Form.Item>

            <Form.Item
              name="password"
              label={t('auth.password')}
              rules={[
                { required: true, message: t('auth.password') + ' ' + t('shifts.required_field') }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('auth.password')}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item
              name="remember"
              valuePropName="checked"
            >
              <Checkbox>{t('auth.remember_me')}</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                style={{ height: '48px', fontSize: '16px' }}
              >
                {t('auth.login')}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              💡 Type 2+ characters to search registered usernames
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#1890ff' }}>
                Sign up here
              </Link>
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('auth.role.admin')}: kasuf / kasuf123
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};
