// Service Worker для TheWho CRM Mobile
const CACHE_NAME = 'thewho-crm-mobile-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/mobile-styles.css',
  '/mobile-logic.js',
  '/manifest.json',
  '/favicon.ico'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📱 Кэширование ресурсов мобильного приложения');
        return cache.addAll(urlsToCache);
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кэшированную версию или делаем сетевой запрос
        if (response) {
          return response;
        }
        
        // Клонируем запрос для безопасности
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Проверяем валидность ответа
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Клонируем ответ для кэширования
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Fallback для оффлайн режима
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});

// Background Sync для мобильных
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Фоновая синхронизация данных');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Синхронизация данных при восстановлении соединения
    const response = await fetch('/api/sync');
    if (response.ok) {
      console.log('✅ Данные синхронизированы');
    }
  } catch (error) {
    console.log('❌ Ошибка синхронизации:', error);
  }
}

// Push уведомления
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от TheWho CRM',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Открыть приложение',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/logo192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TheWho CRM', options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
