# 🚀 Инструкция по запуску исправлений

## 📋 Быстрый старт

### 1. Применение миграции базы данных

**Для Windows:**
```cmd
cd C:\Users\Alexey\Downloads\thewho-main
apply-soft-delete-migration.bat
```

**Для Linux/Mac:**
```bash
cd /path/to/thewho-main
chmod +x apply-soft-delete-migration.sh
./apply-soft-delete-migration.sh
```

### 2. Перезапуск backend

```bash
cd backend
npm install  # если нужно
npm run start:dev
```

### 3. Перезапуск frontend

```bash
cd frontend
npm install  # если нужно
npm start
```

## 🧪 Тестирование функционала

### 1. Проверка soft delete

1. Откройте страницу "База данных"
2. Создайте тестовый заказ
3. Удалите его (должен исчезнуть из списка, но остаться в БД)
4. Проверьте в БД: `SELECT * FROM orders WHERE "isDeleted" = true;`

### 2. Проверка импорта с дубликатами

1. Создайте Excel файл с заказами
2. Импортируйте его один раз
3. Добавьте операции к заказам в интерфейсе и отметьте некоторые как выполненные
4. Импортируйте тот же файл снова
5. Нажмите кнопку "🔄 Excel (проверка дубликатов)"
6. Должно появиться окно выбора действий с дубликатами
7. Выберите "Умное обновление" и проверьте, что выполненные операции сохранились

### 3. Проверка восстановления

1. Удалите заказ
2. Импортируйте Excel с тем же номером чертежа
3. Должно появиться предложение восстановить заказ

## 🔧 Решение проблем

### Ошибка компиляции frontend

Если появляются ошибки TypeScript:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Ошибка подключения к БД

Убедитесь что PostgreSQL запущен и настройте переменные окружения:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=thewho_db
export DB_USER=postgres
export DB_PASSWORD=your_password
```

### Backend не видит новые API endpoints

Перезапустите backend:

```bash
cd backend
npm run start:dev
```

## 📁 Структура новых файлов

```
backend/
├── src/database/migrations/
│   └── add-soft-delete-to-orders.sql
├── src/modules/orders/
│   ├── orders.service.ts (обновлен)
│   ├── orders.controller.ts (обновлен)
│   └── excel-import-with-duplicates.service.ts (обновлен)
└── src/database/entities/
    └── order.entity.ts (обновлен)

frontend/
├── src/components/ExcelImportManager/
│   ├── DuplicateResolutionModal.tsx (новый)
│   ├── EnhancedExcelImportModal.tsx (новый)
│   └── index.ts
└── src/pages/Database/
    └── DatabasePage.tsx (обновлен)
```

## ✅ Ожидаемый результат

После успешного применения всех исправлений:

1. ✅ Заказы удаляются мягко (остаются в БД)
2. ✅ При импорте дубликатов появляется выбор действий
3. ✅ Выполненные операции НЕ удаляются при обновлении
4. ✅ Есть возможность восстановить удаленные заказы
5. ✅ Интуитивный интерфейс с предупреждениями

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи backend: `npm run start:dev`
2. Проверьте консоль браузера (F12)
3. Убедитесь что миграция применилась: `\d orders` в psql
4. Перезапустите оба сервиса

**Важно**: Все изменения обратно совместимы!
