/**
 * @file: ResponsiveGrid.tsx
 * @description: Адаптивная сетка для отображения карточек с автоматической адаптацией к размеру экрана
 * @created: 2025-06-18
 */
import React from 'react';
import { Row, Col } from 'antd';
import { useResponsive, responsiveUtils } from '../../hooks/useResponsive';

interface ResponsiveGridProps {
  children: React.ReactNode[];
  minItemWidth?: number;
  maxColumns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  gutter?: number | [number, number];
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 300,
  maxColumns = {},
  gutter,
  className = ''
}) => {
  const screenInfo = useResponsive();
  
  // Определяем количество колонок на основе ширины экрана и минимальной ширины элемента
  const calculateColumns = () => {
    const containerWidth = screenInfo.width - (screenInfo.isMobile ? 32 : 48); // Учитываем отступы
    const possibleColumns = Math.floor(containerWidth / minItemWidth) || 1;
    
    // Применяем ограничения по максимальному количеству колонок
    if (screenInfo.isMobile && maxColumns.xs) {
      return Math.min(possibleColumns, maxColumns.xs);
    }
    if (!screenInfo.sm && maxColumns.sm) {
      return Math.min(possibleColumns, maxColumns.sm);
    }
    if (!screenInfo.md && maxColumns.md) {
      return Math.min(possibleColumns, maxColumns.md);
    }
    if (!screenInfo.lg && maxColumns.lg) {
      return Math.min(possibleColumns, maxColumns.lg);
    }
    if (!screenInfo.xl && maxColumns.xl) {
      return Math.min(possibleColumns, maxColumns.xl);
    }
    if (screenInfo.xxl && maxColumns.xxl) {
      return Math.min(possibleColumns, maxColumns.xxl);
    }
    
    // Дефолтные ограничения
    if (screenInfo.isMobile) return Math.min(possibleColumns, 1);
    if (screenInfo.isTablet) return Math.min(possibleColumns, 2);
    if (screenInfo.isDesktop) return Math.min(possibleColumns, 4);
    return Math.min(possibleColumns, 6); // Large screen
  };

  const columns = calculateColumns();
  const span = Math.floor(24 / columns);
  
  // Определяем отступы
  const gutterValue = gutter || (screenInfo.isMobile ? [8, 8] : screenInfo.isTablet ? [16, 16] : [24, 24]);

  return (
    <Row gutter={gutterValue} className={className}>
      {children.map((child, index) => (
        <Col 
          key={index}
          xs={24}
          sm={screenInfo.isMobile ? 24 : span > 12 ? 24 : span * 2}
          md={span > 8 ? 12 : span * 1.5}
          lg={span}
          xl={span}
          xxl={span}
          style={{ marginBottom: screenInfo.isMobile ? 12 : 16 }}
        >
          {child}
        </Col>
      ))}
    </Row>
  );
};

/**
 * Компонент для адаптивного отображения действий (кнопок)
 */
interface ResponsiveActionsProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical' | 'auto';
  wrap?: boolean;
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around';
  align?: 'start' | 'end' | 'center';
  className?: string;
  style?: React.CSSProperties;
}

export const ResponsiveActions: React.FC<ResponsiveActionsProps> = ({
  children,
  direction = 'auto',
  wrap = true,
  justify = 'start',
  align = 'center',
  className = '',
  style = {}
}) => {
  const screenInfo = useResponsive();
  
  const actualDirection = direction === 'auto' 
    ? (screenInfo.isMobile ? 'vertical' : 'horizontal')
    : direction;
  
  const flexDirection = actualDirection === 'vertical' ? 'column' : 'row';
  const gap = screenInfo.isMobile ? '8px' : '12px';
  
  return (
    <div
      className={`responsive-actions ${className}`}
      style={{
        display: 'flex',
        flexDirection,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        justifyContent: justify,
        alignItems: align,
        gap,
        width: '100%',
        ...style
      }}
    >
      {children}
    </div>
  );
};

/**
 * Контейнер для адаптивного контента с автоматическими отступами
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: 'auto' | number;
  background?: string;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth,
  padding = 'auto',
  background = '#fff',
  className = ''
}) => {
  const screenInfo = useResponsive();
  
  const actualPadding = padding === 'auto' 
    ? responsiveUtils.getPadding(screenInfo)
    : padding;
  
  return (
    <div
      className={`responsive-container ${className}`}
      style={{
        width: '100%',
        maxWidth: maxWidth || (screenInfo.isLargeScreen ? 1400 : '100%'),
        margin: '0 auto',
        padding: actualPadding,
        background,
        borderRadius: screenInfo.isMobile ? 4 : 8,
        boxShadow: screenInfo.isMobile 
          ? '0 1px 3px rgba(0, 0, 0, 0.1)' 
          : '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}
    >
      {children}
    </div>
  );
};

/**
 * Адаптивная обертка для таблиц
 */
interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  scrollX?: boolean;
  className?: string;
}

export const ResponsiveTableWrapper: React.FC<ResponsiveTableWrapperProps> = ({
  children,
  scrollX = true,
  className = ''
}) => {
  const screenInfo = useResponsive();
  
  return (
    <div
      className={`responsive-table-wrapper ${className}`}
      style={{
        width: '100%',
        overflowX: scrollX && screenInfo.isMobile ? 'auto' : 'visible',
        overflowY: 'visible',
        border: screenInfo.isMobile ? '1px solid #f0f0f0' : 'none',
        borderRadius: screenInfo.isMobile ? 6 : 0
      }}
    >
      {children}
    </div>
  );
};
