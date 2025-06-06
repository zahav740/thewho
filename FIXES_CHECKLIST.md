# Исправления для 500 ошибок API - Чеклист

## ✅ Исправленные Entity файлы:

### 1. operation.entity.ts
- ✅ ID: изменен с uuid на number 
- ✅ operationType: изменен с enum на string (поле operationtype)
- ✅ machineAxes: правильный маппинг (поле machineaxes)
- ✅ Добавлен правильный маппинг полей

### 2. order.entity.ts  
- ✅ ID: изменен с uuid на number
- ✅ Маппинг полей: добавлен для workType, pdfPath
- ✅ drawing_number: правильный маппинг

### 3. machine.entity.ts
- ✅ ID: изменен с uuid на number
- ✅ type: изменен с enum на string
- ✅ Маппинг полей: добавлен для isActive, isOccupied

### 4. machine-schedule.dto.ts
- ✅ machineType: изменен с MachineType enum на string
- ✅ Убран неиспользуемый импорт MachineType

## 🔧 Что делать дальше:

1. **Запустить скрипт**: compile-and-start.bat
2. **Проверить API**: test-api.bat 
3. **Открыть браузер**: http://localhost:3000/health

## 📊 Ожидаемые результаты:

- ✅ Компиляция без ошибок TypeScript
- ✅ Сервер запускается на порту 3000
- ✅ API /health возвращает статус 200
- ✅ API /api/orders возвращает список заказов
- ✅ Фронтенд перестает показывать 500 ошибки

## 🚨 Если проблемы остались:

1. Проверить логи компиляции
2. Проверить логи сервера в консоли
3. Проверить подключение к PostgreSQL
4. Использовать health endpoint для диагностики

## 📋 Резервные копии:

Все оригинальные файлы сохранены с расширением .backup.ts:
- operation.entity.backup.ts
- order.entity.backup.ts  
- machine.entity.backup.ts
