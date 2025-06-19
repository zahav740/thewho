# 🧪 Тестирование API Регистрации

## cURL запросы для тестирования

### 1. Регистрация нового пользователя (успех)
```bash
curl -X POST http://localhost:5100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser1",
    "password": "password123",
    "role": "user"
  }'
```
**Ожидаемый ответ:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 5,
    "username": "newuser1",
    "role": "user",
    "createdAt": "2025-06-19T22:10:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Регистрация админа
```bash
curl -X POST http://localhost:5100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newadmin",
    "password": "adminpass123",
    "role": "admin"
  }'
```

### 3. Попытка регистрации с существующим username (ошибка)
```bash
curl -X POST http://localhost:5100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kasuf",
    "password": "somepassword",
    "role": "user"
  }'
```
**Ожидаемый ответ:**
```json
{
  "statusCode": 409,
  "message": "User with this username already exists"
}
```

### 4. Регистрация с невалидными данными (короткий username)
```bash
curl -X POST http://localhost:5100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "password": "password123",
    "role": "user"
  }'
```
**Ожидаемый ответ:**
```json
{
  "statusCode": 400,
  "message": ["username must be longer than or equal to 3 characters"]
}
```

### 5. Регистрация с коротким паролем
```bash
curl -X POST http://localhost:5100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123",
    "role": "user"
  }'
```

### 6. Проверка токена после регистрации
```bash
# Сначала зарегистрируйтесь и получите токен
TOKEN="your_token_here"

curl -X POST http://localhost:5100/api/auth/verify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 7. Получение профиля после регистрации
```bash
curl -X GET http://localhost:5100/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## JavaScript запросы (для тестирования в браузере)

### Регистрация через fetch
```javascript
async function testRegistration() {
  try {
    const response = await fetch('http://localhost:5100/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'jsuser',
        password: 'password123',
        role: 'user'
      })
    });
    
    const data = await response.json();
    console.log('Registration result:', data);
    
    if (response.ok) {
      // Сохраняем токен
      localStorage.setItem('authToken', data.access_token);
      console.log('Token saved:', data.access_token);
    }
  } catch (error) {
    console.error('Registration error:', error);
  }
}

// Вызвать функцию
testRegistration();
```

### Проверка токена
```javascript
async function verifyToken() {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('http://localhost:5100/api/auth/verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Token verification:', data);
  } catch (error) {
    console.error('Verification error:', error);
  }
}
```

## Postman Collection

### Создайте коллекцию в Postman с этими запросами:

1. **Register User** - POST `/api/auth/register`
2. **Register Admin** - POST `/api/auth/register` 
3. **Login** - POST `/api/auth/login`
4. **Verify Token** - POST `/api/auth/verify`
5. **Get Profile** - GET `/api/auth/profile`

### Переменные окружения Postman:
- `base_url`: `http://localhost:5100/api`
- `token`: `{{access_token}}` (автоматически устанавливается после login/register)

## Тестовые сценарии

### ✅ Позитивные тесты:
1. Регистрация с валидными данными
2. Автоматический вход после регистрации
3. Использование полученного токена
4. Регистрация пользователей с разными ролями

### ❌ Негативные тесты:
1. Регистрация с существующим username
2. Короткий username (< 3 символов)
3. Короткий пароль (< 6 символов)
4. Пустые поля
5. Неверный формат JSON
6. Неверная роль

### 🔄 Интеграционные тесты:
1. Регистрация → Проверка токена → Получение профиля
2. Регистрация → Логаут → Логин с теми же данными
3. Регистрация нескольких пользователей
4. Проверка уникальности username

---

**Все тесты должны проходить успешно если система работает корректно! 🎉**
