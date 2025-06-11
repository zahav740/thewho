/**
 * @file: Layout.tsx
 * @description: Основной layout приложения с поддержкой интернационализации
 * @dependencies: antd, react-router-dom
 * @created: 2025-01-28
 * @updated: 2025-01-28 - Добавлена поддержка i18n
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
  PlayCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from '../../i18n';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  console.log('Layout render with t function:', t);
  console.log('Translated menu.production:', t('menu.production'));

  const menuItems: MenuProps['items'] = [
    {
      key: '/production',
      icon: <AppstoreOutlined />,
      label: t('menu.production'),
      onClick: () => navigate('/production'),
    },
    {
      key: '/operations',
      icon: <PlayCircleOutlined />,
      label: t('menu.operations'),
      onClick: () => navigate('/operations'),
    },
    {
      key: '/operation-history',
      icon: <HistoryOutlined />,
      label: t('menu.operation_history'),
      onClick: () => navigate('/operation-history'),
    },
    {
      key: '/database',
      icon: <DatabaseOutlined />,
      label: t('menu.database'),
      onClick: () => navigate('/database'),
    },
    {
      key: '/shifts',
      icon: <ScheduleOutlined />,
      label: t('menu.shifts'),
      onClick: () => navigate('/shifts'),
    },
    {
      key: '/operators',
      icon: <UserOutlined />,
      label: t('menu.operators'),
      onClick: () => navigate('/operators'),
    },
    {
      key: '/planning',
      icon: <SettingOutlined />,
      label: t('menu.planning'),
      onClick: () => navigate('/planning'),
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: t('menu.calendar'),
      onClick: () => navigate('/calendar'),
    },
    {
      key: '/translations',
      icon: <GlobalOutlined />,
      label: t('menu.translations'),
      onClick: () => navigate('/translations'),
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
            {collapsed ? t('app.title.short') : t('app.title')}
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={3} style={{ margin: '16px 0' }}>
            {getPageTitle(location.pathname, t)}
          </Title>
          <LanguageSwitcher variant="adaptive" size="small" />
        </Header>
        
        <Content style={{ margin: '24px' }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

function getPageTitle(pathname: string, t: (key: string) => string): string {
  switch (pathname) {
    case '/production':
      return t('page.production.title');
    case '/operations':
      return t('page.operations.title');
    case '/operation-history':
      return t('page.operation_history.title');
    case '/database':
      return t('page.database.title');
    case '/shifts':
      return t('page.shifts.title');
    case '/operators':
      return t('page.operators.title');
    case '/planning':
      return t('page.planning.title');
    case '/calendar':
      return t('page.calendar.title');
    case '/translations':
      return t('translations.title');
    default:
      return t('app.title');
  }
}
