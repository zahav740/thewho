/**
 * @file: i18n/translations.ts
 * @description: Статические переводы (будут дополнены данными из API)
 * @created: 2025-01-28
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

    // Статусы
    'status.active': 'Активно',
    'status.inactive': 'Неактивно',
    'status.completed': 'Завершено',
    'status.in_progress': 'В процессе',
    'status.pending': 'Ожидает',
    'status.cancelled': 'Отменено',

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

    // Сообщения
    'message.success.saved': 'Успешно сохранено',
    'message.success.deleted': 'Успешно удалено',
    'message.success.updated': 'Успешно обновлено',
    'message.error.save': 'Ошибка при сохранении',
    'message.error.delete': 'Ошибка при удалении',
    'message.error.load': 'Ошибка при загрузке',
    'message.confirm.delete': 'Вы уверены, что хотите удалить?',

    // Настройки языка
    'language.current': 'Текущий язык',
    'language.switch': 'Переключить язык',
    'language.russian': 'Русский',
    'language.english': 'English',

    // Страница переводов
    'translations.title': 'Управление переводами',
    'translations.description': 'Управление текстами интерфейса на разных языках',
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

    // Statuses
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.completed': 'Completed',
    'status.in_progress': 'In Progress',
    'status.pending': 'Pending',
    'status.cancelled': 'Cancelled',

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

    // Messages
    'message.success.saved': 'Successfully saved',
    'message.success.deleted': 'Successfully deleted',
    'message.success.updated': 'Successfully updated',
    'message.error.save': 'Error saving',
    'message.error.delete': 'Error deleting',
    'message.error.load': 'Error loading',
    'message.confirm.delete': 'Are you sure you want to delete?',

    // Language settings
    'language.current': 'Current language',
    'language.switch': 'Switch language',
    'language.russian': 'Русский',
    'language.english': 'English',

    // Translations page
    'translations.title': 'Translation Management',
    'translations.description': 'Manage interface texts in different languages',
  },
};

export type TranslationKey = string;
