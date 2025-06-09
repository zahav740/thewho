/**
 * @file: LanguageSwitcher.tsx
 * @description: Компонент переключения языков с мгновенным переключением
 * @created: 2025-01-28
 */

import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation, Language } from '../../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { t, currentLanguage, setLanguage } = useTranslation();

  console.log('Current language in LanguageSwitcher:', currentLanguage);

  const handleLanguageChange = (language: Language) => {
    console.log('Switching language to:', language);
    setLanguage(language);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'ru',
      label: (
        <Space>
          🇷🇺 Русский
          {currentLanguage === 'ru' && <span style={{ color: '#1890ff' }}>✓</span>}
        </Space>
      ),
      onClick: () => handleLanguageChange('ru'),
    },
    {
      key: 'en',
      label: (
        <Space>
          🇺🇸 English
          {currentLanguage === 'en' && <span style={{ color: '#1890ff' }}>✓</span>}
        </Space>
      ),
      onClick: () => handleLanguageChange('en'),
    },
  ];

  const getCurrentLanguageFlag = () => {
    return currentLanguage === 'ru' ? '🇷🇺' : '🇺🇸';
  };

  const getCurrentLanguageLabel = () => {
    return currentLanguage === 'ru' ? 'Русский' : 'English';
  };

  return (
    <Dropdown 
      menu={{ items: menuItems }} 
      placement="bottomRight"
      trigger={['click']}
    >
      <Button 
        type="text" 
        icon={<GlobalOutlined />}
        style={{ color: '#fff' }}
      >
        <Space>
          {getCurrentLanguageFlag()}
          {getCurrentLanguageLabel()}
        </Space>
      </Button>
    </Dropdown>
  );
};
