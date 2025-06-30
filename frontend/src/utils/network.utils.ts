/**
 * @file: network.utils.ts
 * @description: Утилиты для работы с сетью и определения IP-адресов
 * @created: 2025-06-21
 */

// Функция для получения локального IP-адреса (в браузере)
export const getLocalIPAddress = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Создаем RTCPeerConnection для получения локального IP
    const rtc = new RTCPeerConnection({ iceServers: [] });
    
    rtc.createDataChannel('');
    rtc.createOffer()
      .then(offer => rtc.setLocalDescription(offer))
      .catch(reject);
    
    rtc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/);
        
        if (ipMatch && ipMatch[0] && ipMatch[0] !== '127.0.0.1') {
          rtc.close();
          resolve(ipMatch[0]);
        }
      }
    };
    
    // Таймаут на случай, если IP не удается получить
    setTimeout(() => {
      rtc.close();
      reject(new Error('Could not determine local IP address'));
    }, 2000);
  });
};

// Функция для проверки, является ли устройство мобильным
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Функция для определения, находимся ли мы в локальной сети
export const isLocalDevelopment = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
};

// Функция для получения оптимального API URL
export const getOptimalApiUrl = async (): Promise<string> => {
  const isDev = process.env.NODE_ENV === 'development';
  const isLocal = isLocalDevelopment();
  
  // Если мы в продакшен или не в локальной сети, используем настроенный URL
  if (!isDev || !isLocal) {
    return process.env.REACT_APP_API_URL || 'https://kasuf.xyz/api';
  }
  
  // Если мы на мобильном устройстве в локальной сети, пытаемся найти IP
  if (isMobileDevice()) {
    try {
      // Пробуем стандартные IP адреса для разработки
      const commonIPs = ['192.168.1.100', '192.168.0.100', '192.168.1.101'];
      
      for (const ip of commonIPs) {
        // Пробуем разные порты
        const ports = [5200, 5100, 3001];
        for (const port of ports) {
          try {
            const response = await fetch(`http://${ip}:${port}/api/auth/test`, { 
              method: 'GET',
              signal: AbortSignal.timeout(2000)
            });
            if (response.ok) {
              console.log(`✅ Найден backend на ${ip}:${port}`);
              return `http://${ip}:${port}/api`;
            }
          } catch {
            // Пробуем другие endpoints
          }
        }
      }
      
      // Если не нашли, возвращаем дефолтный localhost
      console.warn('⚠️ Не удалось найти backend, используем localhost');
      return 'http://localhost:5100/api';
    } catch (error) {
      console.error('❌ Ошибка при определении IP:', error);
      return 'http://localhost:5100/api';
    }
  }
  
  // Для десктопа в локальной разработке используем localhost
  return 'http://localhost:5100/api';
};

// Функция для тестирования доступности API
export const testApiConnection = async (apiUrl: string): Promise<boolean> => {
  try {
    // Сначала пробуем auth/test endpoint (если доступен)
    try {
      const authResponse = await fetch(`${apiUrl}/auth/test`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (authResponse.ok) {
        console.log(`✅ Auth endpoint работает: ${apiUrl}/auth/test`);
        return true;
      }
    } catch {
      // Игнорируем ошибку auth/test
    }
    
    // Затем пробуем health endpoint
    try {
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (healthResponse.ok) {
        console.log(`✅ Health endpoint работает: ${apiUrl}/health`);
        return true;
      }
    } catch {
      // Игнорируем ошибку health
    }
    
    // В крайнем случае пробуем translations endpoint
    try {
      const translationsResponse = await fetch(`${apiUrl}/translations/client`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      if (translationsResponse.ok) {
        console.log(`✅ Translations endpoint работает: ${apiUrl}/translations/client`);
        return true;
      }
    } catch {
      // Игнорируем ошибку translations
    }
    
    return false;
  } catch {
    return false;
  }
};

// Функция для автоматического поиска доступного backend
export const findAvailableBackend = async (): Promise<string> => {
  const candidates = [
    'http://localhost:5100/api', // Наш основной порт
    'http://localhost:3001/api',
    'http://localhost:5101/api',
    'http://localhost:5200/api',
  ];
  
  // Если мобильное устройство, добавляем IP-адреса
  if (isMobileDevice()) {
    const ips = ['192.168.1.100', '192.168.0.100', '192.168.1.101', '192.168.1.102'];
    const ports = [5100, 3001, 5101];
    
    for (const ip of ips) {
      for (const port of ports) {
        candidates.push(`http://${ip}:${port}/api`);
      }
    }
  }
  
  console.log('🔍 Поиск доступного backend среди:', candidates);
  
  for (const url of candidates) {
    if (await testApiConnection(url)) {
      console.log(`✅ Найден доступный backend: ${url}`);
      return url;
    }
  }
  
  console.warn('⚠️ Не найден доступный backend, используем default');
  return candidates[0];
};
