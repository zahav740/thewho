import { useState, useCallback, useRef } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100/api';

interface UseUsernameSearchReturn {
  searchResults: string[];
  isLoading: boolean;
  searchUsernames: (query: string) => void;
  clearResults: () => void;
}

// Простая реализация debounce без lodash
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

export const useUsernameSearch = (): UseUsernameSearchReturn => {
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Функция для поиска usernames в базе данных
  const performSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    console.log('🔍 Поиск usernames в БД для:', query);

    try {
      const response = await fetch(`${API_URL}/auth/search-usernames?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.usernames || []);
        console.log('✅ Получены результаты поиска:', data.usernames?.length || 0, 'usernames');
      } else {
        console.log('❌ Ошибка поиска usernames:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('❌ Ошибка сети при поиске usernames:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced версия поиска (ждем 300ms после окончания ввода)
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 300),
    []
  );

  const searchUsernames = (query: string) => {
    debouncedSearch(query);
  };

  const clearResults = () => {
    setSearchResults([]);
    setIsLoading(false);
  };

  return {
    searchResults,
    isLoading,
    searchUsernames,
    clearResults
  };
};
