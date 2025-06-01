# Production CRM System

CRM система для управления производством с функциями учета станков, заказов, операций, смен и производственного календаря.

## Функциональность

- **Управление станками**: отслеживание состояния и загруженности станков
- **База заказов**: создание, редактирование, импорт из Excel
- **Операции**: последовательное выполнение операций с контролем статусов
- **Учет смен**: детальная фиксация работы в дневные и ночные смены
- **Производственный календарь**: планирование и визуализация загрузки
- **Статистика и отчеты**: анализ эффективности производства

## Технологии

### Backend
- NestJS (Node.js framework)
- TypeORM (ORM)
- PostgreSQL (база данных)
- Swagger (API документация)

### Frontend
- React 18 с TypeScript
- Ant Design (UI библиотека)
- React Query (управление состоянием)
- Recharts (графики)

## Требования

- Node.js 18+
- PostgreSQL 15+
- Docker и Docker Compose (для контейнерного запуска)

## Установка и запуск

### Быстрый запуск (рекомендуется)

Используйте готовые батники для Windows:

```bash
# Полный запуск приложения
start-all.bat

# Запуск в режиме разработки (с автоперезагрузкой)
start-dev.bat

# Остановка всех процессов
stop-all.bat

# Перезапуск приложения
restart-all.bat
```

После запуска:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- API документация: http://localhost:3000/api/docs

### Вариант 1: Локальная разработка

#### Backend
```bash
cd backend
npm install
cp .env.example .env  # Настройте переменные окружения
npm run start:dev
```

Backend будет доступен по адресу: http://localhost:3000
Swagger документация: http://localhost:3000/api/docs

#### Frontend
```bash
cd frontend
npm install
npm start
```

Frontend будет доступен по адресу: http://localhost:3001

### Вариант 2: Docker Compose

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка
docker-compose down

# Просмотр логов
docker-compose logs -f
```

Приложение будет доступно по адресу: http://localhost

## Структура проекта

```
production-crm/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/   # Модули приложения
│   │   ├── database/  # Entities и миграции
│   │   └── common/    # Общие компоненты
│   └── uploads/       # Загруженные файлы
├── frontend/          # React приложение
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы приложения
│   │   ├── services/    # API сервисы
│   │   └── types/       # TypeScript типы
├── shared/            # Общие типы (если используются)
├── docker/            # Docker конфигурации
└── docs/              # Документация
```

## API Endpoints

### Станки (Machines)
- `GET /api/machines` - список всех станков
- `GET /api/machines/:id` - информация о станке
- `PUT /api/machines/:id/toggle` - переключить занятость
- `GET /api/machines/:id/recommended-orders` - рекомендуемые заказы

### Заказы (Orders)
- `GET /api/orders` - список заказов с фильтрацией
- `POST /api/orders` - создать заказ
- `PUT /api/orders/:id` - обновить заказ
- `POST /api/orders/import-excel` - импорт из Excel
- `POST /api/orders/:id/upload-pdf` - загрузить PDF

### Операции (Operations)
- `GET /api/operations` - список операций
- `PUT /api/operations/:id/assign-machine` - назначить станок
- `PUT /api/operations/:id/start` - начать операцию
- `PUT /api/operations/:id/complete` - завершить операцию

### Смены (Shifts)
- `GET /api/shifts` - список смен
- `POST /api/shifts` - создать запись смены
- `GET /api/shifts/statistics` - статистика

### Календарь (Calendar)
- `GET /api/calendar` - календарное представление
- `GET /api/calendar/machine-utilization` - загруженность станков
- `GET /api/calendar/upcoming-deadlines` - предстоящие дедлайны

## Настройка базы данных

### Создание таблиц
SQL скрипты для создания таблиц находятся в backend коде. При запуске с `synchronize: true` таблицы создадутся автоматически.

### Начальные данные
Станки (F1-F4 для фрезерных, T1-T4 для токарных) добавляются автоматически при первом запуске.

## Особенности системы

1. **Рабочие дни**: Воскресенье-Четверг (Пятница и Суббота - выходные)
2. **Смены**: Дневная и ночная по 8 часов
3. **Приоритеты заказов**: 1 (критический) - 4 (низкий)
4. **Последовательность операций**: следующая операция доступна только после завершения предыдущей

## Разработка

### Добавление нового модуля в Backend
```bash
nest g module modules/new-module
nest g controller modules/new-module
nest g service modules/new-module
```

### Создание миграции
```bash
npm run typeorm migration:create -- -n MigrationName
npm run typeorm migration:run
```

## Лицензия

Proprietary
