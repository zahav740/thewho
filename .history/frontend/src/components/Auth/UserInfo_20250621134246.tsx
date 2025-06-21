import React from 'react';
import { Button, Space, Avatar, Tooltip } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import './UserInfo.css';

export const UserInfo: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    console.log('🚪 Быстрый выход без подтверждения');
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return t('auth.role.admin');
      case 'user':
        return t('auth.role.user');
      default:
        return role;
    }
  };

  return (
    <Space size="middle" style={{ display: 'flex', alignItems: 'center' }}>
      {/* Информация о пользователе */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Avatar icon={<UserOutlined />} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontWeight: '300', fontSize: '14px' }}>{user.username}</span>
          <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
            {getRoleText(user.role)}
          </span>
        </div>
      </div>

      {/* Кнопка быстрого выхода */}
      <Tooltip title="Quick logout">
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          size="middle"
          style={{
            minWidth: '80px',
            height: '32px',
            borderRadius: '6px',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Logout
        </Button>
      </Tooltip>
    </Space>
  );
};
