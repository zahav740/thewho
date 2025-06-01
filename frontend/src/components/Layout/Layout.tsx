/**
 * @file: Layout.tsx
 * @description: Основной layout приложения
 * @dependencies: antd, react-router-dom
 * @created: 2025-01-28
 */
import React, { useState } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu, Typography } from 'antd';
import {
  AppstoreOutlined,
  DatabaseOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuProps['items'] = [
    {
      key: '/production',
      icon: <AppstoreOutlined />,
      label: 'Производство',
      onClick: () => navigate('/production'),
    },
    {
      key: '/database',
      icon: <DatabaseOutlined />,
      label: 'База данных',
      onClick: () => navigate('/database'),
    },
    {
      key: '/shifts',
      icon: <ScheduleOutlined />,
      label: 'Смены',
      onClick: () => navigate('/shifts'),
    },
    {
      key: '/planning',
      icon: <SettingOutlined />,
      label: 'Планирование',
      onClick: () => navigate('/planning'),
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: 'Календарь',
      onClick: () => navigate('/calendar'),
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#fff'
        }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'CRM' : 'Production CRM'}
          </Title>
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
        />
      </Sider>
      
      <AntLayout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
        }}>
          <Title level={3} style={{ margin: '16px 0' }}>
            {getPageTitle(location.pathname)}
          </Title>
        </Header>
        
        <Content style={{ margin: '24px' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

function getPageTitle(pathname: string): string {
  switch (pathname) {
    case '/production':
      return 'Производство';
    case '/database':
      return 'База данных заказов';
    case '/shifts':
      return 'Учет смен';
    case '/planning':
      return 'Планирование производства';
    case '/calendar':
      return 'Производственный календарь';
    default:
      return 'Production CRM';
  }
}
