# Система аутентификации Production CRM

## Обзор

В приложение Production CRM добавлена система аутентификации с использованием JWT токенов.

## Компоненты системы

### Backend

1. **Модуль аутентификации** (`/backend/src/modules/auth/`)
   - `User` entity - сущность пользователя
   - `AuthService` - сервис для работы с аутентификацией
   - `AuthController` - контроллер API для аутентификации
   - JWT и Local стратегии для Passport
   - Guards для защиты маршрутов

2. **База данных**
   - Таблица `users` с полями:
     - `id` - уникальный идентификатор
     - `username` - логин пользователя
     - `password` - хэшированный пароль
     - `role` - роль (admin/user)
     - `isActive` - активность аккаунта
     - `createdAt/updatedAt` - даты создания/обновления

### Frontend

1. **Контекст аутентификации** (`/frontend/src/contexts/AuthContext.tsx`)
   - Управление состоянием аутентификации
   - Проверка токенов
   - Функции входа/выхода

2. **Компоненты**
   - `LoginPage` - страница входа в систему
   - `ProtectedRoute` - защищенные маршруты
   - `UserInfo` - информация о пользователе в header

3. **Хуки**
   - `useAuth` - хук для работы с аутентификацией
   - `useApiClient` - хук для API запросов с автоматической аутентификацией

## Учетные данные по умолчанию

**Администратор:**
- Логин: `kasuf`
- Пароль: `kasuf123`

## API Endpoints

### POST /api/auth/login
Вход в систему

**Request:**
```json
{
  "username": "kasuf",
  "password": "kasuf123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "kasuf",
    "role": "admin"
  }
}
```

### POST /api/auth/verify
Проверка валидности токена

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "kasuf",
    "role": "admin"
  }
}
```

### GET /api/auth/profile
Получение профиля пользователя

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "username": "kasuf",
  "role": "admin"
}
```

## Установка и запуск

1. **Установка зависимостей:**
   ```bash
   cd backend
   npm install @nestjs/jwt @nestjs/passport bcryptjs passport passport-jwt passport-local
   npm install --save-dev @types/bcryptjs @types/passport-jwt @types/passport-local
   ```

2. **Запуск системы:**
   - Запустите скрипт `START-CRM-WITH-AUTH.bat`
   - Или запустите backend и frontend отдельно:
     ```bash
     # Backend
     cd backend
     npm run start:dev
     
     # Frontend (в новом терминале)
     cd frontend
     npm start
     ```

3. **Доступ к приложению:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - Swagger Docs: http://localhost:3001/api/docs

## Безопасность

- Пароли хранятся в зашифрованном виде с использованием bcrypt
- JWT токены имеют срок действия 24 часа
- Все маршруты защищены по умолчанию (кроме /login)
- Автоматический выход при истечении токена

## Роли пользователей

- **admin** - полный доступ ко всем функциям
- **user** - базовый доступ (можно расширить в будущем)

## Разработка

При добавлении новых маршрутов API:
1. По умолчанию все маршруты требуют аутентификации
2. Для публичных маршрутов используйте декоратор `@Public()`
3. Для API запросов с frontend используйте хук `useApiClient`

## Файлы конфигурации

- `.env` - переменные окружения (включая JWT_SECRET)
- `package.json` - зависимости для аутентификации
- База данных создается автоматически при первом запуске
