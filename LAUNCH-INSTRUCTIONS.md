# 🚀 ФИНАЛЬНАЯ ИНСТРУКЦИЯ ПО ЗАПУСКУ

## 📋 Порты и адреса:
- **Backend**: http://localhost:5100
- **Frontend**: http://localhost:5101  
- **Excel Import**: http://localhost:5101/excel-import
- **API Docs**: http://localhost:5100/api/docs

## 🏃‍♂️ БЫСТРЫЙ ЗАПУСК:

### Вариант 1: Автоматические скрипты
```bash
# 1. Запустите backend (в первом терминале)
.\START-BACKEND-5100.bat

# 2. Запустите frontend (во втором терминале)  
.\START-FRONTEND-5101.bat

# 3. Откройте браузер
http://localhost:5101/excel-import
```

### Вариант 2: Ручной запуск
```bash
# Backend
cd backend
npm run migration:run
set PORT=5100 && npm run start:dev

# Frontend (в новом терминале)
cd frontend  
set PORT=5101 && npm start
```

## ✅ Проверка работы:

1. **Backend проверка**: http://localhost:5100/api/health
2. **API документация**: http://localhost:5100/api/docs
3. **Frontend**: http://localhost:5101
4. **Excel Import**: http://localhost:5101/excel-import

## 🔧 Функциональность Excel Import:

✅ **Drag & Drop загрузка** Excel файлов (.xlsx, .xls)  
✅ **Автоматический парсинг** и сохранение в БД  
✅ **Просмотр списка файлов** с фильтрацией по статусу  
✅ **Просмотр данных файла** в удобной таблице  
✅ **Статистика** по файлам (количество, размер, строки)  
✅ **Управление файлами** - удаление и повторная обработка  
✅ **Дедупликация** - предотвращение загрузки одинаковых файлов  
✅ **Responsive дизайн** для мобильных устройств  

## 🛠️ Технические характеристики:

- **Максимальный размер файла**: 50MB
- **Поддерживаемые форматы**: .xlsx, .xls
- **Максимальное количество строк**: 10,000 (настраивается)
- **База данных**: PostgreSQL с таблицей `excel_files`

## 🔍 Отладка проблем:

**Если backend не запускается:**
1. Проверьте PostgreSQL запущен
2. Проверьте настройки БД в `backend/.env`
3. Убедитесь что порт 5100 свободен

**Если frontend не подключается:**
1. Убедитесь что backend запущен на порту 5100
2. Проверьте адрес http://localhost:5100/api/health
3. Откройте Developer Tools → Network для просмотра ошибок

**Если Excel Import не работает:**
1. Проверьте API документацию: http://localhost:5100/api/docs
2. Попробуйте загрузить файл через Swagger UI
3. Проверьте логи backend в консоли

## 📚 Дополнительные ресурсы:

- **Backend API**: http://localhost:5100/api/docs (Swagger)
- **Database**: PostgreSQL (настройки в backend/.env)
- **Логи**: Смотрите консоли backend и frontend

---

## 🎉 ГОТОВО!

**Модуль Excel импорта полностью настроен и готов к использованию!**

После запуска обоих серверов, откройте http://localhost:5101/excel-import и загружайте Excel файлы.

Все основные функции работают "из коробки":
- Загрузка файлов
- Просмотр данных  
- Статистика
- Управление файлами
