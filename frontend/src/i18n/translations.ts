/**
 * @file: i18n/translations.ts
 * @description: Полные переводы для Production CRM (ОБНОВЛЕНО ДЛЯ KASUF.XYZ)
 * @updated: 2025-06-18
 */

export const translations: Record<'ru' | 'en', Record<string, string>> = {
  ru: {
    // Навигация и меню
    'app.title': 'Production CRM',
    'app.title.short': 'CRM',
    'menu.production': 'Производство',
    'menu.operations': 'Активные операции',
    'menu.operation_history': 'История операций',
    'menu.database': 'База данных',
    'menu.shifts': 'Смены',
    'menu.operators': 'Операторы',
    'menu.planning': 'Планирование',
    'menu.calendar': 'Календарь',
    'menu.translations': 'Переводы',

    // Заголовки страниц
    'page.production.title': 'Производство',
    'page.operations.title': 'Мониторинг активных операций',
    'page.operation_history.title': 'История операций и аналитика',
    'page.database.title': 'База данных заказов',
    'page.shifts.title': 'Учет смен',
    'page.operators.title': 'Управление операторами',
    'page.planning.title': 'Планирование производства',
    'page.calendar.title': 'Производственный календарь',

    // Общие кнопки и действия
    'button.save': 'Сохранить',
    'button.cancel': 'Отмена',
    'button.delete': 'Удалить',
    'button.edit': 'Редактировать',
    'button.add': 'Добавить',
    'button.create': 'Создать',
    'button.update': 'Обновить',
    'button.close': 'Закрыть',
    'button.confirm': 'Подтвердить',
    'button.search': 'Поиск',
    'button.filter': 'Фильтр',
    'button.export': 'Экспорт',
    'button.import': 'Импорт',
    'button.refresh': 'Обновить',

    // Статусы
    'status.active': 'Активно',
    'status.inactive': 'Неактивно',
    'status.completed': 'Завершено',
    'status.in_progress': 'В процессе',
    'status.pending': 'Ожидает',
    'status.cancelled': 'Отменено',
    'status.paused': 'Приостановлено',
    'status.stopped': 'Остановлено',

    // Формы и поля
    'form.name': 'Название',
    'form.description': 'Описание',
    'form.date': 'Дата',
    'form.time': 'Время',
    'form.quantity': 'Количество',
    'form.duration': 'Длительность',
    'form.priority': 'Приоритет',
    'form.type': 'Тип',
    'form.status': 'Статус',
    'form.machine': 'Станок',
    'form.operator': 'Оператор',
    'form.order': 'Заказ',
    'form.operation': 'Операция',

    // Order Form - ПОЛНЫЕ RU переводы для формы заказа
    'order_form.new_order': 'Новый заказ',
    'order_form.edit_order': 'Редактировать заказ',
    'order_form.drawing_number': 'Номер чертежа',
    'order_form.drawing_placeholder': 'Например: C6HP0021A',
    'order_form.quantity': 'Количество',
    'order_form.priority': 'Приоритет',
    'order_form.deadline': 'Срок выполнения',
    'order_form.work_type': 'Тип работы',
    'order_form.work_type_placeholder': 'Например: Фрезерная обработка',
    'order_form.operations': 'Операции',
    'order_form.operation_number': '№',
    'order_form.operation_type': 'Тип операции',
    'order_form.machine_axes': 'Оси',
    'order_form.estimated_time': 'Время (мин)',
    'order_form.add_operation': 'Добавить операцию',
    'order_form.operations_count': 'Операций: {{count}}',
    'order_form.milling': 'Фрезерная',
    'order_form.turning': 'Токарная',
    'order_form.drilling': 'Сверлильная',
    'order_form.required_field': 'Обязательное поле',
    'order_form.create': 'Создать',
    'order_form.save': 'Сохранить',
    'order_form.cancel': 'Отмена',
    'order_form.order_created': 'Заказ успешно создан',
    'order_form.order_updated': 'Заказ успешно обновлен',
    'order_form.create_error': 'Ошибка при создании заказа',
    'order_form.update_error': 'Ошибка при обновлении заказа',

    // Настройки языка
    'language.current': 'Текущий язык',
    'language.switch': 'Переключить язык',
    'language.russian': 'Русский',
    'language.english': 'English',

    // База данных заказов
    'database.orders': 'Заказы',
    'database.add_order': 'Добавить заказ',
    'database.edit_order': 'Редактировать заказ',
    'database.total_orders': 'Всего заказов',
    'database.new_order': 'Новый заказ',
    'database.csv_import': 'CSV Импорт',
    'database.excel_import': 'Excel Импорт',
    'database.refresh': 'Обновить',
    'database.search_drawing': 'Поиск по номеру чертежа',
    'database.filter_priority': 'Фильтр по приоритету',
    'database.drawing_number': 'Номер чертежа',
    'database.quantity': 'Количество',
    'database.priority': 'Приоритет',
    'database.deadline': 'Срок',
    'database.work_type': 'Тип работы',
    'database.operations': 'Операции',
    'database.actions': 'Действия',
    'database.operations_count': '{{count}} оп.',
    'database.days_left': 'Осталось {{days}} дн.',
    'database.delete_order': 'Удалить заказ?',
    'database.delete_confirm': 'Это действие нельзя отменить',
    'database.delete_button': 'Удалить',
    'database.cancel_button': 'Отмена',

    // Приоритеты
    'priority.HIGH': 'Высокий',
    'priority.MEDIUM': 'Средний', 
    'priority.LOW': 'Низкий',
    'priority.high': 'Высокий',
    'priority.medium': 'Средний',
    'priority.low': 'Низкий',

    // Сообщения
    'message.success.saved': 'Успешно сохранено',
    'message.success.deleted': 'Успешно удалено',
    'message.success.updated': 'Успешно обновлено',
    'message.error.save': 'Ошибка при сохранении',
    'message.error.delete': 'Ошибка при удалении',
    'message.error.load': 'Ошибка при загрузке',
    'message.confirm.delete': 'Вы уверены, что хотите удалить?',
    'message.no_data': 'Нет данных',
    'message.loading': 'Загрузка...',

    // Операции и типы операций
    'operation.MILLING': 'Фрезерная',
    'operation.TURNING': 'Токарная',
    'operation.DRILLING': 'Сверлильная',
    'operation.milling': 'Фрезерная',
    'operation.turning': 'Токарная',
    'operation.drilling': 'Сверлильная',

    // Страница переводов
    'translations.title': 'Управление переводами',
    'translations.description': 'Управление текстами интерфейса на разных языках',

    // Производство
    'production.machines': 'Станки',
    'production.current_operations': 'Текущие операции',
    'production.queue': 'Очередь',
    'production.efficiency': 'Эффективность',

    // Станки
    'machine.status.available': 'Свободен',
    'machine.status.busy': 'Занят',
    'machine.operation': 'Операция',
    'machine.time': 'Время',

    // Смены
    'shifts.current_shift': 'Текущая смена',
    'shifts.shift_history': 'История смен',
    'shifts.operators': 'Операторы смены',

    // Операторы
    'operators.list': 'Список операторов',
    'operators.add': 'Добавить оператора',
    'operators.performance': 'Производительность',

    // Планирование
    'planning.schedule': 'Расписание',
    'planning.optimize': 'Оптимизировать',
    'planning.gantt': 'Диаграмма Гантта',

    // Календарь
    'calendar.today': 'Сегодня',
    'calendar.week': 'Неделя',
    'calendar.month': 'Месяц',
    'calendar.events': 'События',
  },

  en: {
    // Navigation and menu
    'app.title': 'Production CRM',
    'app.title.short': 'CRM',
    'menu.production': 'Production',
    'menu.operations': 'Active Operations',
    'menu.operation_history': 'Operation History',
    'menu.database': 'Database',
    'menu.shifts': 'Shifts',
    'menu.operators': 'Operators',
    'menu.planning': 'Planning',
    'menu.calendar': 'Calendar',
    'menu.translations': 'Translations',

    // Page titles
    'page.production.title': 'Production',
    'page.operations.title': 'Active Operations Monitoring',
    'page.operation_history.title': 'Operation History and Analytics',
    'page.database.title': 'Orders Database',
    'page.shifts.title': 'Shift Management',
    'page.operators.title': 'Operator Management',
    'page.planning.title': 'Production Planning',
    'page.calendar.title': 'Production Calendar',

    // Common buttons and actions
    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.delete': 'Delete',
    'button.edit': 'Edit',
    'button.add': 'Add',
    'button.create': 'Create',
    'button.update': 'Update',
    'button.close': 'Close',
    'button.confirm': 'Confirm',
    'button.search': 'Search',
    'button.filter': 'Filter',
    'button.export': 'Export',
    'button.import': 'Import',
    'button.refresh': 'Refresh',

    // Statuses
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.completed': 'Completed',
    'status.in_progress': 'In Progress',
    'status.pending': 'Pending',
    'status.cancelled': 'Cancelled',
    'status.paused': 'Paused',
    'status.stopped': 'Stopped',

    // Forms and fields
    'form.name': 'Name',
    'form.description': 'Description',
    'form.date': 'Date',
    'form.time': 'Time',
    'form.quantity': 'Quantity',
    'form.duration': 'Duration',
    'form.priority': 'Priority',
    'form.type': 'Type',
    'form.status': 'Status',
    'form.machine': 'Machine',
    'form.operator': 'Operator',
    'form.order': 'Order',
    'form.operation': 'Operation',

    // Order Form - ПОЛНЫЕ EN переводы для формы заказа
    'order_form.new_order': 'New Order',
    'order_form.edit_order': 'Edit Order',
    'order_form.drawing_number': 'Drawing Number',
    'order_form.drawing_placeholder': 'e.g.: C6HP0021A',
    'order_form.quantity': 'Quantity',
    'order_form.priority': 'Priority',
    'order_form.deadline': 'Deadline',
    'order_form.work_type': 'Work Type',
    'order_form.work_type_placeholder': 'e.g.: Milling operation',
    'order_form.operations': 'Operations',
    'order_form.operation_number': '№',
    'order_form.operation_type': 'Operation Type',
    'order_form.machine_axes': 'Axes',
    'order_form.estimated_time': 'Time (min)',
    'order_form.add_operation': 'Add Operation',
    'order_form.operations_count': 'Operations: {{count}}',
    'order_form.milling': 'Milling',
    'order_form.turning': 'Turning',
    'order_form.drilling': 'Drilling',
    'order_form.required_field': 'Required field',
    'order_form.create': 'Create',
    'order_form.save': 'Save',
    'order_form.cancel': 'Cancel',
    'order_form.order_created': 'Order created successfully',
    'order_form.order_updated': 'Order updated successfully',
    'order_form.create_error': 'Error creating order',
    'order_form.update_error': 'Error updating order',

    // Language settings
    'language.current': 'Current language',
    'language.switch': 'Switch language',
    'language.russian': 'Русский',
    'language.english': 'English',

    // Database
    'database.orders': 'Orders',
    'database.add_order': 'Add Order',
    'database.edit_order': 'Edit Order',
    'database.total_orders': 'Total Orders',
    'database.new_order': 'New Order',
    'database.csv_import': 'CSV Import',
    'database.excel_import': 'Excel Import',
    'database.refresh': 'Refresh',
    'database.search_drawing': 'Search by drawing number',
    'database.filter_priority': 'Filter by priority',
    'database.drawing_number': 'Drawing Number',
    'database.quantity': 'Quantity',
    'database.priority': 'Priority',
    'database.deadline': 'Deadline',
    'database.work_type': 'Work Type',
    'database.operations': 'Operations',
    'database.actions': 'Actions',
    'database.operations_count': '{{count}} ops.',
    'database.days_left': '{{days}} days left',
    'database.delete_order': 'Delete order?',
    'database.delete_confirm': 'This action cannot be undone',
    'database.delete_button': 'Delete',
    'database.cancel_button': 'Cancel',

    // Priorities
    'priority.HIGH': 'High',
    'priority.MEDIUM': 'Medium',
    'priority.LOW': 'Low',
    'priority.high': 'High',
    'priority.medium': 'Medium',
    'priority.low': 'Low',

    // Messages
    'message.success.saved': 'Successfully saved',
    'message.success.deleted': 'Successfully deleted',
    'message.success.updated': 'Successfully updated',
    'message.error.save': 'Error saving',
    'message.error.delete': 'Error deleting',
    'message.error.load': 'Error loading',
    'message.confirm.delete': 'Are you sure you want to delete?',
    'message.no_data': 'No data',
    'message.loading': 'Loading...',

    // Operations and operation types
    'operation.MILLING': 'Milling',
    'operation.TURNING': 'Turning',
    'operation.DRILLING': 'Drilling',
    'operation.milling': 'Milling',
    'operation.turning': 'Turning',
    'operation.drilling': 'Drilling',

    // Translations page
    'translations.title': 'Translation Management',
    'translations.description': 'Manage interface texts in different languages',

    // Production
    'production.machines': 'Machines',
    'production.current_operations': 'Current Operations',
    'production.queue': 'Queue',
    'production.efficiency': 'Efficiency',

    // Machines
    'machine.status.available': 'Available',
    'machine.status.busy': 'Busy',
    'machine.operation': 'Operation',
    'machine.time': 'Time',

    // Shifts
    'shifts.current_shift': 'Current Shift',
    'shifts.shift_history': 'Shift History',
    'shifts.operators': 'Shift Operators',

    // Operators
    'operators.list': 'Operators List',
    'operators.add': 'Add Operator',
    'operators.performance': 'Performance',

    // Planning
    'planning.schedule': 'Schedule',
    'planning.optimize': 'Optimize',
    'planning.gantt': 'Gantt Chart',

    // Calendar
    'calendar.today': 'Today',
    'calendar.week': 'Week',
    'calendar.month': 'Month',
    'calendar.events': 'Events',
  },
};

export type TranslationKey = string;
