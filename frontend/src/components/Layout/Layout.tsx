/**
 * @file: Layout.tsx
 * @description: Адаптивный layout приложения с поддержкой интернационализации и мобильных устройств
 * @dependencies: antd, react-router-dom
 * @created: 2025-01-28
 * @updated: 2025-06-18 - Добавлена полная адаптивность для всех экранов
 */
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu, Typography, Button, Drawer } from 'antd';
import {
  AppstoreOutlined,
  DatabaseOutlined,
  ScheduleOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation } from '../../i18n';
import { useResponsive } from '../../hooks';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Определение мобильного устройства
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true); // На мобильных всегда сворачиваем
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Закрытие мобильного меню при навигации
  useEffect(() => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);

  console.log('Layout render with t function:', t);
  console.log('Translated menu.production:', t('menu.production'));

  const menuItems: MenuProps['items'] = [
    {
      key: '/database',
      icon: <DatabaseOutlined />,
      label: t('menu.database'),
      onClick: () => navigate('/database'),
    },
    {
      key: '/production',
      icon: <AppstoreOutlined />,
      label: t('menu.production'),
      onClick: () => navigate('/production'),
    },
    {
      key: '/shifts',
      icon: <ScheduleOutlined />,
      label: t('menu.shifts'),
      onClick: () => navigate('/shifts'),
    },
    {
      key: '/operations',
      icon: <PlayCircleOutlined />,
      label: t('menu.operations'),
      onClick: () => navigate('/operations'),
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: t('menu.calendar'),
      onClick: () => navigate('/calendar'),
    },
    {
      key: '/operators',
      icon: <UserOutlined />,
      label: t('menu.operators'),
      onClick: () => navigate('/operators'),
    },
    {
      key: '/translations',
      icon: <GlobalOutlined />,
      label: t('menu.translations'),
      onClick: () => navigate('/translations'),
    },
  ];

  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Компонент меню для переиспользования
  const MenuComponent = () => (
    <>
      <div style={{ 
        height: 64, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#fff',
        padding: '0 16px',
        borderBottom: '1px solid #001529'
      }}>
        <Title level={isMobile ? 5 : 4} style={{ 
          color: '#fff', 
          margin: 0,
          textAlign: 'center',
          wordBreak: 'break-word'
        }}>
          {collapsed && !isMobile ? t('app.title.short') : t('app.title')}
        </Title>
      </div>
      <Menu
        theme="dark"
        selectedKeys={[location.pathname]}
        mode="inline"
        items={menuItems}
        style={{ 
          border: 'none',
          fontSize: isMobile ? '14px' : '16px'
        }}
      />
    </>
  );

  // Мобильная версия с Drawer
  if (isMobile) {
    return (
      <AntLayout style={{ minHeight: '100vh' }}>
        {/* Мобильная кнопка меню */}
        <Button
          type="primary"
          icon={<MenuOutlined />}
          onClick={handleMenuToggle}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 1001,
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        />

        {/* Мобильное drawer меню */}
        <Drawer
          title={null}
          placement="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          closable={false}
          width={280}
          bodyStyle={{ padding: 0 }}
          style={{ zIndex: 1000 }}
        >
          <div style={{ 
            background: '#001529', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <MenuComponent />
          </div>
        </Drawer>

        {/* Основной контент */}
        <AntLayout style={{ marginLeft: 0 }}>
          <Header style={{ 
            background: '#fff', 
            padding: '0 16px 0 70px', // Отступ для кнопки меню
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '56px',
            height: 'auto'
          }}>
            <div className="header-content">
              <Title level={4} style={{ 
                margin: '8px 0',
                fontSize: '18px',
                wordBreak: 'break-word',
                flex: 1
              }}>
                {getPageTitle(location.pathname, t)}
              </Title>
              <LanguageSwitcher variant="adaptive" size="small" />
            </div>
          </Header>
          
          <Content style={{ 
            margin: '16px',
            marginTop: '16px'
          }}>
            <Outlet />
          </Content>
        </AntLayout>
      </AntLayout>
    );
  }

  // Десктопная версия
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={250}
        collapsedWidth={80}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <MenuComponent />
      </Sider>
      
      <AntLayout style={{ 
        marginLeft: collapsed ? 80 : 250,
        transition: 'margin-left 0.2s'
      }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <Title level={3} style={{ margin: '16px 0' }}>
            {getPageTitle(location.pathname, t)}
          </Title>
          <LanguageSwitcher variant="adaptive" size="small" />
        </Header>
        
        <Content style={{ 
          margin: '24px',
          overflow: 'auto'
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

function getPageTitle(pathname: string, t: (key: string) => string): string {
  switch (pathname) {
    case '/database':
      return t('page.database.title');
    case '/production':
      return t('page.production.title');
    case '/shifts':
      return t('page.shifts.title');
    case '/operations':
      return t('page.operations.title');
    case '/calendar':
      return t('page.calendar.title');
    case '/operators':
      return t('page.operators.title');
    case '/translations':
      return t('translations.title');
    default:
      return t('app.title');
  }
}
