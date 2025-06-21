/**
 * @file: LanguageSwitcher.tsx
 * @description: Современный компонент переключения языков
 * @created: 2025-01-28
 * @updated: 2025-06-11
 */

import React from 'react';
import { Button, Dropdown, Space, Segmented, Tooltip, Grid } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useTranslation, Language } from '../../i18n';

const { useBreakpoint } = Grid;

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'segmented' | 'toggle' | 'compact' | 'adaptive';
  size?: 'small' | 'middle' | 'large';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'adaptive',
  size = 'middle'
}) => {
  const { currentLanguage, setLanguage } = useTranslation();
  const screens = useBreakpoint();

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
  };

  // Адаптивный вариант - автоматически выбирает лучший вариант
  if (variant === 'adaptive') {
    if (screens.xs || screens.sm) {
      // Мобильные устройства - компактный вариант
      variant = 'compact';
    } else if (screens.md) {
      // Планшеты - toggle
      variant = 'toggle';
    } else {
      // Десктоп - segmented
      variant = 'segmented';
    }
  }

  // Вариант 1: Segmented (современный переключатель)
  if (variant === 'segmented') {
    return (
      <Segmented
        value={currentLanguage}
        onChange={(value) => handleLanguageChange(value as Language)}
        options={[
          {
            label: (
              <Space size="small">
                <span>🇷🇺</span>
                <span>RU</span>
              </Space>
            ),
            value: 'ru',
          },
          {
            label: (
              <Space size="small">
                <span>🇺🇸</span>
                <span>EN</span>
              </Space>
            ),
            value: 'en',
          },
        ]}
        size={size}
      />
    );
  }

  // Вариант 2: Компактный переключатель
  if (variant === 'compact') {
    return (
      <Button.Group size={size}>
        <Button 
          type={currentLanguage === 'ru' ? 'primary' : 'default'}
          onClick={() => handleLanguageChange('ru')}
          size={size}
          style={{ height: '32px', minWidth: '40px', fontSize: '14px' }}
        >
          🇷🇺
        </Button>
        <Button 
          type={currentLanguage === 'en' ? 'primary' : 'default'}
          onClick={() => handleLanguageChange('en')}
          size={size}
          style={{ height: '32px', minWidth: '40px', fontSize: '14px' }}
        >
          🇺🇸
        </Button>
      </Button.Group>
    );
  }

  // Вариант 3: Простой переключатель
  if (variant === 'toggle') {
    const isRussian = currentLanguage === 'ru';
    return (
      <Tooltip title={`Переключить на ${isRussian ? 'English' : 'Русский'}`}>
        <Button
          type="text"
          size={size}
          onClick={() => handleLanguageChange(isRussian ? 'en' : 'ru')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#1890ff',
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: '16px' }}>
            {isRussian ? '🇷🇺' : '🇺🇸'}
          </span>
          <span>{isRussian ? 'RU' : 'EN'}</span>
        </Button>
      </Tooltip>
    );
  }

  // Вариант 4: Dropdown (оригинальный)
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
        style={{ color: '#1890ff' }}
        size={size}
      >
        <Space>
          {getCurrentLanguageFlag()}
          {getCurrentLanguageLabel()}
        </Space>
      </Button>
    </Dropdown>
  );
};
