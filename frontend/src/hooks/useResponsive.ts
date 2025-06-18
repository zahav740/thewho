/**
 * @file: useResponsive.ts
 * @description: Хук для определения размера экрана и адаптивного поведения
 * @created: 2025-06-18
 */
import { useState, useEffect } from 'react';

export interface BreakpointValues {
  xs: boolean;    // < 576px
  sm: boolean;    // >= 576px
  md: boolean;    // >= 768px
  lg: boolean;    // >= 992px
  xl: boolean;    // >= 1200px
  xxl: boolean;   // >= 1600px
}

export interface ResponsiveInfo extends BreakpointValues {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
}

const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export const useResponsive = (): ResponsiveInfo => {
  const [screenData, setScreenData] = useState<ResponsiveInfo>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    return {
      width,
      height,
      xs: width >= breakpoints.xs,
      sm: width >= breakpoints.sm,
      md: width >= breakpoints.md,
      lg: width >= breakpoints.lg,
      xl: width >= breakpoints.xl,
      xxl: width >= breakpoints.xxl,
      isMobile: width < breakpoints.md,
      isTablet: width >= breakpoints.md && width < breakpoints.lg,
      isDesktop: width >= breakpoints.lg && width < breakpoints.xxl,
      isLargeScreen: width >= breakpoints.xxl,
    };
  });

  useEffect(() => {
    const updateScreenData = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenData({
        width,
        height,
        xs: width >= breakpoints.xs,
        sm: width >= breakpoints.sm,
        md: width >= breakpoints.md,
        lg: width >= breakpoints.lg,
        xl: width >= breakpoints.xl,
        xxl: width >= breakpoints.xxl,
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg && width < breakpoints.xxl,
        isLargeScreen: width >= breakpoints.xxl,
      });
    };

    // Debounce функция для оптимизации
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenData, 150);
    };

    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('orientationchange', debouncedUpdate);

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('orientationchange', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, []);

  return screenData;
};

/**
 * Утилитарные функции для работы с адаптивностью
 */
export const responsiveUtils = {
  // Получить количество колонок для Grid в зависимости от экрана
  getGridCols: (screenInfo: ResponsiveInfo): { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number } => {
    return {
      xs: 1,
      sm: screenInfo.isMobile ? 1 : 2,
      md: screenInfo.isTablet ? 2 : 3,
      lg: 3,
      xl: 4,
      xxl: screenInfo.isLargeScreen ? 5 : 4,
    };
  },

  // Получить размер компонентов в зависимости от экрана (компактнее)
  getComponentSize: (screenInfo: ResponsiveInfo): 'small' | 'middle' | 'large' => {
    if (screenInfo.isMobile) return 'small';
    if (screenInfo.isTablet) return 'small'; // было 'middle'
    return 'middle'; // было 'large'
  },

  // Получить отступы в зависимости от экрана (компактнее)
  getPadding: (screenInfo: ResponsiveInfo): number => {
    if (screenInfo.isMobile) return 8;  // было 12
    if (screenInfo.isTablet) return 12;  // было 16
    if (screenInfo.isDesktop) return 16; // было 24
    return 20; // было 32 (Large screen)
  },

  // Получить размер шрифта заголовков
  getTitleLevel: (screenInfo: ResponsiveInfo, defaultLevel: 1 | 2 | 3 | 4 | 5 = 3): 1 | 2 | 3 | 4 | 5 => {
    if (screenInfo.isMobile && defaultLevel < 5) {
      return (defaultLevel + 1) as 1 | 2 | 3 | 4 | 5;
    }
    return defaultLevel;
  },

  // Определить, нужно ли скрывать элемент на маленьких экранах
  shouldHideOnMobile: (screenInfo: ResponsiveInfo, hideBreakpoint: 'xs' | 'sm' | 'md' = 'md'): boolean => {
    switch (hideBreakpoint) {
      case 'xs':
        return !screenInfo.xs;
      case 'sm':
        return !screenInfo.sm;
      case 'md':
        return !screenInfo.md;
      default:
        return false;
    }
  },

  // Получить конфигурацию для Ant Design Row/Col
  getRowColConfig: (screenInfo: ResponsiveInfo) => {
    return {
      gutter: screenInfo.isMobile ? [8, 8] : screenInfo.isTablet ? [16, 16] : [24, 24],
      xs: 24,
      sm: screenInfo.isMobile ? 24 : 12,
      md: screenInfo.isTablet ? 12 : 8,
      lg: 8,
      xl: 6,
      xxl: screenInfo.isLargeScreen ? 4 : 6,
    };
  },
};

/**
 * Хук для адаптивных значений
 */
export const useResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
  default: T;
}): T => {
  const screenInfo = useResponsive();

  if (screenInfo.xxl && values.xxl !== undefined) return values.xxl;
  if (screenInfo.xl && values.xl !== undefined) return values.xl;
  if (screenInfo.lg && values.lg !== undefined) return values.lg;
  if (screenInfo.md && values.md !== undefined) return values.md;
  if (screenInfo.sm && values.sm !== undefined) return values.sm;
  if (screenInfo.xs && values.xs !== undefined) return values.xs;

  return values.default;
};
