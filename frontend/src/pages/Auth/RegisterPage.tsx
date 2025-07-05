import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Select, Card, Typography, AutoComplete, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import { useUsernameSearch } from '../../hooks/useUsernameSearch';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  role: string;
}

type ValidateStatus = '' | 'success' | 'warning' | 'error' | 'validating';

export const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register, isAuthenticated } = useAuth();
  const { searchResults, isLoading: isSearching, searchUsernames, clearResults } = useUsernameSearch();

  // ПОЛНОСТЬЮ УДАЛЯЕМ ПРОБЛЕМНЫЕ СТИЛИ
  useEffect(() => {
    // НЕ добавляем никаких классов к body!
    // НЕ добавляем никаких глобальных стилей!
    
    // Возвращаем body к нормальному состоянию
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.overflow = '';
    
    // Убираем все проблемные классы
    document.body.classList.remove('login-page');
    
    return () => {
      // При выходе тоже очищаем
      document.body.classList.remove('login-page');
      const registerStyles = document.getElementById('register-page-styles');
      if (registerStyles) {
        registerStyles.remove();
      }
    };
  }, []);

  // Если пользователь уже авторизован, перенаправляем его
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Пользователь уже авторизован, перенаправляем на /database');
      navigate('/database', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Проверяем доступность username при изменении результатов поиска
  useEffect(() => {
    const currentUsername = form.getFieldValue('username');
    if (currentUsername && currentUsername.length >= 3) {
      const isTaken = searchResults.includes(currentUsername);
      setUsernameStatus(isTaken ? 'taken' : 'available');
    }
  }, [searchResults, form]);

  // Функция для получения опций автодополнения (предлагаем свободные варианты)
  const getUsernameOptions = (searchText: string) => {
    if (!searchText || searchText.length < 2) {
      return [];
    }

    // Создаем варианты на основе введенного текста
    const suggestions = [
      `${searchText}1`,
      `${searchText}2`,
      `${searchText}_user`,
      `${searchText}_admin`,
      `user_${searchText}`,
      `${searchText}2024`,
      `${searchText}_new`,
    ];

    // Фильтруем только те, которых НЕТ в результатах поиска (свободные)
    const availableSuggestions = suggestions.filter(suggestion => 
      !searchResults.includes(suggestion)
    );

    return availableSuggestions.slice(0, 6).map(username => ({
      value: username,
      label: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
          {username}
          <Text type="secondary" style={{ marginLeft: 'auto', fontSize: '12px' }}>
            available
          </Text>
        </div>
      )
    }));
  };

  const handleUsernameSearch = (value: string) => {
    console.log('🔍 Проверка доступности username:', value);
    if (value && value.length >= 2) {
      setUsernameStatus('checking');
      searchUsernames(value);
    } else {
      setUsernameStatus(null);
      clearResults();
    }
  };

  const getUsernameValidationStatus = (): { validateStatus?: ValidateStatus; help?: string } => {
    const currentUsername = form.getFieldValue('username');
    if (!currentUsername || currentUsername.length < 3) {
      return {};
    }

    switch (usernameStatus) {
      case 'checking':
        return {
          validateStatus: 'validating' as ValidateStatus,
          help: 'Checking availability...'
        };
      case 'available':
        return {
          validateStatus: 'success' as ValidateStatus,
          help: 'Username is available!'
        };
      case 'taken':
        return {
          validateStatus: 'error' as ValidateStatus,
          help: 'Username is already taken'
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (values: RegisterFormData) => {
    // Проверяем что username доступен
    if (usernameStatus === 'taken') {
      message.error('Please choose a different username');
      return;
    }

    setIsLoading(true);

    console.log('🚀 Начинаем регистрацию пользователя:', values.username);

    try {
      const result = await register({
        username: values.username,
        password: values.password,
        role: values.role
      });

      if (result.success) {
        message.success('Registration successful! Welcome to Production CRM!');
        console.log('✅ Регистрация успешна, перенаправляем на главную страницу');
        
        // Перенаправляем на главную страницу
        setTimeout(() => {
          navigate('/database', { replace: true });
        }, 1000);
      } else {
        message.error(result.message || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Ошибка регистрации:', error);
      message.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ПРОСТЫЕ БЕЗОПАСНЫЕ СТИЛИ - только inline, не затрагивают body
  const pageWrapperStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    boxSizing: 'border-box'
  };

  const cardContainerStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '400px',
    position: 'relative'
  };

  const cardStyles: React.CSSProperties = {
    width: '100%',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: 'none',
    overflow: 'hidden'
  };

  const languageSwitcherStyles: React.CSSProperties = {
    position: 'absolute',
    top: '-60px',
    right: '0px',
    zIndex: 1000
  };

  return (
    <div style={pageWrapperStyles}>
      <div style={cardContainerStyles}>
        <div style={languageSwitcherStyles}>
          <LanguageSwitcher />
        </div>
        
        <Card style={cardStyles}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Title level={2} style={{ marginBottom: '8px', fontSize: '28px', fontWeight: 600 }}>
              Production CRM
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Create New Account
            </Text>
          </div>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            style={{ width: '100%' }}
          >
            <Form.Item
              name="username"
              label="Username"
              rules={[
                { required: true, message: 'Please enter username' },
                { min: 3, message: 'Username must be at least 3 characters' },
                { 
                  pattern: /^[a-zA-Z0-9_]+$/, 
                  message: 'Username can only contain letters, numbers and underscore' 
                }
              ]}
              {...getUsernameValidationStatus()}
              style={{ marginBottom: '24px' }}
            >
              <AutoComplete
                options={getUsernameOptions(form.getFieldValue('username') || '')}
                placeholder="Enter username"
                disabled={isLoading}
                filterOption={false}
                onSearch={handleUsernameSearch}
                onSelect={(value) => {
                  form.setFieldsValue({ username: value });
                  handleUsernameSearch(value);
                }}
                style={{ width: '100%' }}
                dropdownStyle={{ maxHeight: '300px' }}
                notFoundContent={isSearching ? <Spin size="small" /> : 
                  form.getFieldValue('username')?.length >= 2 ? 'Great! Try the suggestions above' : null
                }
              >
                <Input
                  prefix={<UserOutlined />}
                  suffix={
                    usernameStatus === 'checking' ? <Spin size="small" /> :
                    usernameStatus === 'available' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                    usernameStatus === 'taken' ? <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> :
                    null
                  }
                  placeholder="Enter username"
                  disabled={isLoading}
                  autoComplete="username"
                  style={{ height: '48px', fontSize: '16px' }}
                />
              </AutoComplete>
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
              style={{ marginBottom: '24px' }}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter password"
                disabled={isLoading}
                autoComplete="new-password"
                style={{ height: '48px', fontSize: '16px' }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match'));
                  },
                }),
              ]}
              style={{ marginBottom: '24px' }}
            >
              <Input.Password
                prefix={<SafetyOutlined />}
                placeholder="Confirm password"
                disabled={isLoading}
                autoComplete="new-password"
                style={{ height: '48px', fontSize: '16px' }}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              initialValue="user"
              style={{ marginBottom: '24px' }}
            >
              <Select
                placeholder="Select role"
                disabled={isLoading}
                style={{ height: '48px', fontSize: '16px' }}
              >
                <Option value="user">User</Option>
              </Select>
            </Form.Item>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                disabled={usernameStatus === 'taken'}
                style={{ 
                  height: '48px', 
                  fontSize: '16px', 
                  fontWeight: 600,
                  borderRadius: '8px'
                }}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              💡 Username availability checked in real-time
            </Text>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Text type="secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1890ff' }}>
                Sign in here
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};