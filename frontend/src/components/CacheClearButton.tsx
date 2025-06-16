/**
 * @file: CacheClearButton.tsx
 * @description: Компонент для принудительной очистки кэша React Query
 * @created: 2025-06-16
 */
import React from 'react';
import { Button, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';

export const CacheClearButton: React.FC = () => {
  const queryClient = useQueryClient();

  const handleClearCache = () => {
    // Очищаем весь кэш React Query
    queryClient.clear();
    
    // Очищаем localStorage
    localStorage.clear();
    
    // Принудительно перезагружаем все данные
    queryClient.invalidateQueries();
    
    message.success('🗑️ Кэш очищен! Данные будут перезагружены из БД');
  };

  return (
    <Button
      icon={<DeleteOutlined />}
      onClick={handleClearCache}
      type="primary"
      danger
      size="small"
    >
      Очистить кэш
    </Button>
  );
};

export default CacheClearButton;