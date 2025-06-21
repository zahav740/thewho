/**
 * @file: MobileWrapper.tsx
 * @description: Wrapper компонент для интеграции мобильной логики
 * @created: 2025-06-20
 */
import React, { useEffect } from 'react';
import { useMobile } from '../../hooks/useMobile';

interface MobileWrapperProps {
  children: React.ReactNode;
}

export const MobileWrapper: React.FC<MobileWrapperProps> = ({ children }) => {
  const { isMobile, isTablet, touchDevice } = useMobile();

  useEffect(() => {
    // Добавляем CSS классы для стилизации
    const body = document.body;
    const root = document.getElementById('root');

    if (isMobile) {
      body.classList.add('mobile-device', 'responsive-mode');
      root?.classList.add('mobile-layout');
    } else if (isTablet) {
      body.classList.add('tablet-device', 'responsive-mode');
      root?.classList.add('tablet-layout');
    } else {
      body.classList.add('desktop-device');
      root?.classList.add('desktop-layout');
    }

    if (touchDevice) {
      body.classList.add('touch-device');
    }

    // Предотвращение зума на мобильных
    if (isMobile) {
      const metaViewport = document.querySelector('meta[name=viewport]');
      if (metaViewport) {
        metaViewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }
    }

    return () => {
      body.classList.remove(
        'mobile-device',
        'tablet-device',
        'desktop-device',
        'responsive-mode',
        'touch-device'
      );
      root?.classList.remove('mobile-layout', 'tablet-layout', 'desktop-layout');
    };
  }, [isMobile, isTablet, touchDevice]);

  return <>{children}</>;
};

export default MobileWrapper;
