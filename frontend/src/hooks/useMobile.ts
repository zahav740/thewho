/**
 * @file: useMobile.ts
 * @description: Hook для определения мобильных устройств и управления мобильной логикой
 * @created: 2025-06-20
 */
import { useState, useEffect } from 'react';

interface MobileConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  touchDevice: boolean;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useMobile = (): MobileConfig => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
      
      // Автоматически закрываем мобильное меню при переходе на десктоп
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    const handleOrientationChange = () => {
      // Задержка для корректного получения новых размеров
      setTimeout(() => {
        setScreenWidth(window.innerWidth);
        setScreenHeight(window.innerHeight);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [mobileMenuOpen]);

  // Определение типа устройства
  const isMobile = screenWidth <= 768;
  const isTablet = screenWidth > 768 && screenWidth <= 1024;
  const isDesktop = screenWidth > 1024;

  // Определение ориентации
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

  // Определение touch устройства
  const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    orientation,
    touchDevice,
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu
  };
};

export default useMobile;
