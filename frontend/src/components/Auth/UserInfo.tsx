import React from 'react';
import { Button, Dropdown, Space, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import './UserInfo.css';

export const UserInfo: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const handleLogout = () => {
    if (window.confirm(t('auth.confirm_logout'))) {
      logout();
    }
  };

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: handleLogout,
      danger: true,
    },
  ];

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
    <Dropdown menu={{ items }} placement="bottomRight" arrow>
      <div style={{ cursor: 'pointer' }}>
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontWeight: '500' }}>{user.username}</span>
            <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>
              {getRoleText(user.role)}
            </span>
          </div>
        </Space>
      </div>
    </Dropdown>
  );
};
