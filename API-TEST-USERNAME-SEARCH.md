# 🧪 API Test для Username Search

## Быстрый тест API

### 1. Запустите backend:
```bash
cd backend
npm run start:dev
```

### 2. Протестируйте API:
```bash
# Поиск "ka" (должен найти "kasuf")
curl "http://localhost:5100/api/auth/search-usernames?query=ka"

# Поиск "te" (должен найти "test") 
curl "http://localhost:5100/api/auth/search-usernames?query=te"

# Поиск "da" (должен найти "dan1")
curl "http://localhost:5100/api/auth/search-usernames?query=da"

# Поиск несуществующего (должен вернуть пустой массив)
curl "http://localhost:5100/api/auth/search-usernames?query=xyz"
```

### 3. Ожидаемые ответы:

**Поиск "ka":**
```json
{
  "usernames": ["kasuf"]
}
```

**Поиск "te":**
```json
{
  "usernames": ["test"]
}
```

**Поиск "da":**
```json
{
  "usernames": ["dan1"]
}
```

**Поиск "xyz":**
```json
{
  "usernames": []
}
```

### 4. Проверка в браузере:
```
http://localhost:5100/api/auth/search-usernames?query=ka
```

### 5. Swagger документация:
```
http://localhost:5100/api/docs
```

## SQL проверка в базе:
```sql
SELECT username FROM users WHERE username LIKE '%ka%' AND "isActive" = true;
```

Должно вернуть: `kasuf`
