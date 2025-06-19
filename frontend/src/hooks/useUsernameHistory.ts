import { useState, useEffect } from 'react';

const USERNAME_HISTORY_KEY = 'usernameHistory';
const MAX_HISTORY_SIZE = 10;

interface UseUsernameHistoryReturn {
  usernameHistory: string[];
  saveUsername: (username: string) => void;
  clearHistory: () => void;
  removeUsername: (username: string) => void;
}

export const useUsernameHistory = (): UseUsernameHistoryReturn => {
  const [usernameHistory, setUsernameHistory] = useState<string[]>([]);

  // Загружаем историю при инициализации
  useEffect(() => {
    const savedUsernames = localStorage.getItem(USERNAME_HISTORY_KEY);
    if (savedUsernames) {
      try {
        const usernames = JSON.parse(savedUsernames);
        if (Array.isArray(usernames)) {
          setUsernameHistory(usernames);
          console.log('📚 Загружена история usernames:', usernames.length, 'записей');
        }
      } catch (error) {
        console.error('Ошибка загрузки истории usernames:', error);
        localStorage.removeItem(USERNAME_HISTORY_KEY);
      }
    }
  }, []);

  // Сохраняем username в историю
  const saveUsername = (username: string) => {
    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return;
    }

    const trimmedUsername = username.trim();
    
    setUsernameHistory(currentHistory => {
      // Удаляем дубликат если есть
      let newHistory = currentHistory.filter(u => u !== trimmedUsername);
      
      // Добавляем в начало
      newHistory.unshift(trimmedUsername);
      
      // Ограничиваем размер
      newHistory = newHistory.slice(0, MAX_HISTORY_SIZE);
      
      // Сохраняем в localStorage
      localStorage.setItem(USERNAME_HISTORY_KEY, JSON.stringify(newHistory));
      
      console.log('📝 Username сохранен в историю:', trimmedUsername);
      return newHistory;
    });
  };

  // Очищаем всю историю
  const clearHistory = () => {
    setUsernameHistory([]);
    localStorage.removeItem(USERNAME_HISTORY_KEY);
    console.log('🗑️ История usernames очищена');
  };

  // Удаляем конкретный username из истории
  const removeUsername = (username: string) => {
    setUsernameHistory(currentHistory => {
      const newHistory = currentHistory.filter(u => u !== username);
      localStorage.setItem(USERNAME_HISTORY_KEY, JSON.stringify(newHistory));
      console.log('🗑️ Username удален из истории:', username);
      return newHistory;
    });
  };

  return {
    usernameHistory,
    saveUsername,
    clearHistory,
    removeUsername
  };
};
