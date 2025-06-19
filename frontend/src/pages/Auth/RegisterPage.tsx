import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Select, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher/LanguageSwitcher';
import './LoginPage.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  role: string;
}

export const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register, isAuthenticated } = useAuth();

  // Если пользователь уже авторизован, перенаправляем его
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Пользователь уже авторизован, перенаправляем на /database');
      navigate('/database', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values: RegisterFormData) => {
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
              Create New Account
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
              label="Username"
              rules={[
                { required: true, message: 'Please enter username' },
                { min: 3, message: 'Username must be at least 3 characters' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter username"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter password"
                disabled={isLoading}
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
            >
              <Input.Password
                prefix={<SafetyOutlined />}
                placeholder="Confirm password"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              name="role"
              label="Role"
              initialValue="user"
            >
              <Select
                placeholder="Select role"
                disabled={isLoading}
              >
                <Option value="user">User</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                style={{ height: '48px', fontSize: '16px' }}
              >
                Create Account
              </Button>
            </Form.Item>
          </Form>

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
