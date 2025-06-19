import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, Typography, Space, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useTranslation } from '../../i18n';
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

  // Загружаем сохраненные учетные данные при инициализации
  useEffect(() => {
    const savedCredentials = localStorage.getItem('savedCredentials');
    if (savedCredentials) {
      try {
        const { username, password } = JSON.parse(savedCredentials);
        form.setFieldsValue({
          username,
          password,
          remember: true
        });
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    }
  }, [form]);

  const handleSubmit = async (values: LoginFormData) => {
    setIsLoading(true);

    console.log('🚀 Начинаем вход с данными:', values);

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
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        console.log('❌ Ответ не OK, получаем ошибку...');
        const errorData = await response.json();
        console.log('❌ Данные ошибки:', errorData);
        throw new Error(errorData.message || t('auth.invalid_credentials'));
      }

      const data = await response.json();
      console.log('✅ Полученные данные:', data);
      
      // Сохраняем токен и информацию о пользователе
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
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
      
      console.log('✅ Данные сохранены в localStorage');
      
      // Перенаправляем на главную страницу
      console.log('✅ Перенаправляем на /database...');
      navigate('/database');
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
              <Input
                prefix={<UserOutlined />}
                placeholder={t('auth.username')}
                disabled={isLoading}
              />
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
