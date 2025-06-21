/**
 * @file: Layout.tsx
 * @description: Адаптивный layout для приложения (финальная версия)
 * @created: 2025-06-20
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
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';
import { UserInfo } from '../Auth/UserInfo';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

function getPageTitle(pathname: string, t: (key: string) => string): string {
  const mapping: { [key: string]: string } = {
    '/database': t('page.database.title'),
    '/production': t('page.production.title'),
    '/shifts': t('page.shifts.title'),
    '/operations': t('page.operations.title'),
    '/calendar': t('page.calendar.title'),
    '/operators': t('page.operators.title'),
    '/translations': t('translations.title'),
  };
  return mapping[pathname] || t('app.title');
}

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);

  const menuItems: MenuProps['items'] = [
    { key: '/database', icon: <DatabaseOutlined />, label: t('menu.database') },
    { key: '/production', icon: <AppstoreOutlined />, label: t('menu.production') },
    { key: '/shifts', icon: <ScheduleOutlined />, label: t('menu.shifts') },
    { key: '/operations', icon: <PlayCircleOutlined />, label: t('menu.operations') },
    { key: '/calendar', icon: <CalendarOutlined />, label: t('menu.calendar') },
    { key: '/operators', icon: <UserOutlined />, label: t('menu.operators') },
    { key: '/translations', icon: <GlobalOutlined />, label: t('menu.translations') },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  const MenuComponent = () => (
    <>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
        <Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {collapsed && !isMobile ? t('app.title.short') : t('app.title')}
        </Title>
      </div>
      <Menu
        theme="dark"
        selectedKeys={[location.pathname]}
        mode="inline"
        items={menuItems}
        onClick={handleMenuClick}
        style={{ border: 'none' }}
      />
    </>
  );

  // Мобильная версия (без изменений, она работала хорошо)
  if (isMobile) {
    return (
      <AntLayout style={{ minHeight: '100vh' }}>
        <Header style={{
          background: '#fff', padding: '0 16px', boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'fixed', width: '100%', zIndex: 10, height: 56
        }}>
          <Button type="text" icon={<MenuOutlined style={{ fontSize: '20px' }} />} onClick={() => setMobileDrawerOpen(true)} style={{ marginLeft: -8 }} />
          <Title level={5} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getPageTitle(location.pathname, t)}
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <LanguageSwitcher variant="adaptive" size="small" />
            <UserInfo />
          </div>
        </Header>
        <Drawer placement="left" open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} closable={false} width={250} bodyStyle={{ padding: 0, background: '#001529' }}>
          <MenuComponent />
        </Drawer>
        <Content style={{ paddingTop: 56 }}>
          <div className="page-container" style={{ margin: '8px', minHeight: 'calc(100vh - 56px - 16px)' }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    );
  }

  // --- ИСПРАВЛЕННАЯ ДЕСКТОПНАЯ ВЕРСИЯ ---
  
  const siderWidth = collapsed ? 80 : 250; // Ширина сайдбара в зависимости от состояния

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 1. Сайдбар с position: 'fixed' вырывается из потока и крепится к левому краю */}
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
          zIndex: 100,
        }}
      >
        <MenuComponent />
      </Sider>
      
      {/* 2. Основной Layout получает margin-left, равный ширине сайдбара */}
      <AntLayout style={{
        marginLeft: siderWidth,
        transition: 'margin-left 0.2s', // Плавная анимация при сворачивании
        minHeight: '100vh'
      }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Title level={3} style={{ margin: 0 }}>
            {getPageTitle(location.pathname, t)}
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LanguageSwitcher variant="adaptive" size="small" />
            <UserInfo />
          </div>
        </Header>
        
        {/* 3. Контент отображается внутри этого Layout с правильным отступом */}
        <Content>
           {/* page-container теперь не нуждается во внешних отступах, так как они есть у родителя */}
          <div className="page-container" style={{ margin: '24px' }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};