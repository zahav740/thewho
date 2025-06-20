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
    <Space size="small" style={{ display: 'flex', alignItems: 'center' }}>
      {/* Информация о пользователе */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Avatar icon={<UserOutlined />} size="small" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: '500', fontSize: '14px' }}>{user.username}</span>
          <span style={{ fontSize: '11px', color: '#999', opacity: 0.8 }}>•</span>
          <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>
            {user.role === 'admin' ? 'ADM' : 'USR'}
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
          size="small"
          style={{
            minWidth: '70px',
            height: '28px',
            borderRadius: '4px',
            fontWeight: '500',
            fontSize: '12px'
          }}
        >
          Logout
        </Button>
      </Tooltip>
    </Space>
  );
};
