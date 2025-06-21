# 📱 TheWho CRM - Мобильная версия

Адаптивная мобильная версия системы управления производством TheWho CRM, оптимизированная для работы на смартфонах, планшетах и десктопах.

## 🚀 Быстрый старт

### Развертывание на Beget

1. **Сборка приложения:**
   ```bash
   cd frontend
   deploy-mobile-full.bat
   ```

2. **Загрузка на хостинг:**
   - Загрузите `thewho-crm-mobile-final.zip` в панель Beget
   - Разархивируйте в директорию `/var/upload`
   - Настройте домен kasuf.xyz

3. **Проверка:**
   - Откройте https://kasuf.xyz
   - Протестируйте на мобильном устройстве

## 📱 Мобильные функции

### ✅ Адаптивный дизайн
- **Мобильные устройства** (≤768px): Полноэкранный режим с выдвижным меню
- **Планшеты** (768px-1024px): Компактный сайдбар с адаптированным интерфейсом  
- **Десктоп** (>1024px): Полнофункциональный интерфейс

### ✅ Touch-оптимизация
- Минимальный размер касаний 44px
- Предотвращение автозума при фокусе на input
- Свайп-навигация и свайп-действия
- Pull-to-refresh для обновления данных

### ✅ PWA поддержка
- Установка на домашний экран
- Оффлайн режим с Service Worker
- Кэширование ресурсов
- Push уведомления (готово к настройке)

### ✅ Мобильный UX
- Floating Action Buttons (FAB)
- Мобильное выдвижное меню
- Карточный вид таблиц на мобильных
- Адаптивные модальные окна

## 🛠️ Технический стек

### Frontend
- **React 18+** с TypeScript
- **Ant Design** для UI компонентов
- **React Router** для навигации
- **React Query** для управления данными
- **i18next** для интернационализации

### Мобильные технологии
- **Service Worker** для PWA функций
- **Web App Manifest** для установки
- **Responsive Design** с CSS Grid/Flexbox
- **Touch Events API** для жестов

### Backend интеграция
- **Supabase PostgreSQL** база данных
- **RESTful API** для всех операций
- **JWT аутентификация**
- **CORS** настроен для kasuf.xyz

## 📁 Структура проекта

```
frontend/
├── src/
│   ├── components/
│   │   ├── Mobile/
│   │   │   └── MobileWrapper.tsx      # Мобильный wrapper
│   │   └── Layout/
│   │       └── Layout.tsx             # Адаптивный layout
│   ├── hooks/
│   │   └── useMobile.ts               # Hook для мобильных функций
│   ├── styles/
│   │   └── mobile.css                 # Мобильные стили
│   └── index.tsx                      # Точка входа с мобильной поддержкой
├── public/
│   ├── mobile-styles.css              # Внешние мобильные стили
│   ├── mobile-logic.js                # Мобильная JavaScript логика
│   ├── sw.js                          # Service Worker
│   └── manifest.json                  # Web App Manifest
└── build-mobile/                      # Готовая сборка для развертывания
```

## 🔧 Конфигурация

### Переменные окружения (.env.mobile.production)
```env
REACT_APP_ENVIRONMENT=production
REACT_APP_MOBILE=true
REACT_APP_API_URL=https://kasuf.xyz/api
REACT_APP_CORS_ORIGIN=https://kasuf.xyz
REACT_APP_ENABLE_PWA=true
REACT_APP_ENABLE_SERVICE_WORKER=true
```

### База данных (Supabase)
```env
REACT_APP_DATABASE_URL=postgresql://postgres.kukqacmzfmzepdfddppl:Magarel1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 🚀 Команды сборки

### Основные команды
```bash
# Полная сборка и развертывание
deploy-mobile-full.bat

# Только мобильная сборка
build-mobile.bat

# Разработка с мобильными функциями
npm start
```

### Для разработки
```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm start

# Сборка для production
npm run build

# Тестирование
npm test
```

## 📊 Производительность

### Оптимизации
- **Code Splitting** для уменьшения размера бандла
- **Lazy Loading** компонентов
- **Service Worker** кэширование
- **Gzip сжатие** статических ресурсов
- **Минификация** CSS и JavaScript

### Размеры сборки
- **Основной бандл**: ~500KB (gzipped)
- **Мобильные стили**: ~50KB
- **Service Worker**: ~10KB
- **Общий размер**: ~2MB (с ресурсами)

## 🔐 Безопасность

### Настройки
- **HTTPS** принудительно
- **CORS** настроен для kasuf.xyz
- **CSP заголовки** для защиты от XSS
- **Secure headers** в .htaccess
- **JWT токены** для аутентификации

### .htaccess конфигурация
```apache
# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
```

## 🐛 Устранение неисправностей

### Частые проблемы

**1. Приложение не загружается**
- Проверьте настройки домена в Beget
- Убедитесь, что .htaccess находится в корне
- Проверьте логи в панели хостинга

**2. API не работает**
- Проверьте CORS настройки
- Убедитесь в правильности API URL
- Проверьте подключение к базе данных

**3. PWA не устанавливается**
- Очистите кэш браузера
- Проверьте manifest.json
- Убедитесь в работе Service Worker

**4. Мобильное меню не работает**
- Проверьте загрузку mobile-logic.js
- Убедитесь в работе JavaScript
- Проверьте консоль браузера на ошибки

### Отладка
```javascript
// Проверка Service Worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('SW registrations:', registrations);
});

// Проверка мобильного режима
console.log('Mobile detected:', window.innerWidth <= 768);

// Проверка PWA установки
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('PWA install available');
});
```

## 📱 Тестирование на устройствах

### Chrome DevTools
1. Откройте DevTools (F12)
2. Включите Device Toolbar (Ctrl+Shift+M)
3. Выберите мобильное устройство
4. Тестируйте touch события

### Реальные устройства
1. Откройте https://kasuf.xyz на мобильном
2. Проверьте работу меню и навигации
3. Протестируйте свайп-действия
4. Попробуйте установить PWA

## 🔄 Обновления

### Автоматические обновления
- Service Worker автоматически обновляет кэш
- При изменении файлов создается новая версия
- Пользователи получают обновления при следующем посещении

### Ручные обновления
```bash
# Пересборка и развертывание
deploy-mobile-full.bat

# Очистка кэша Service Worker
# В DevTools: Application > Storage > Clear Storage
```

## 📞 Поддержка

### Ресурсы
- **Документация Beget**: https://beget.com/kb
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev

### Логи и мониторинг
- Панель Beget: логи веб-сервера
- Browser DevTools: Console, Network, Application
- Supabase Dashboard: база данных и API

## 📈 Планы развития

### Следующие версии
- [ ] Push уведомления
- [ ] Оффлайн синхронизация данных
- [ ] Геолокация для мобильных операций
- [ ] Камера для сканирования QR-кодов
- [ ] Биометрическая аутентификация
- [ ] Темная тема
- [ ] Улучшенная аналитика

### Производительность
- [ ] Дополнительная оптимизация бандла
- [ ] Prefetching критических ресурсов
- [ ] Image optimization
- [ ] Service Worker стратегии кэширования

---

**📅 Версия:** 1.0.0  
**🔗 URL:** https://kasuf.xyz  
**👥 Команда:** TheWho Development Team  
**📧 Поддержка:** admin@kasuf.xyz
