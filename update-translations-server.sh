#!/bin/bash

# Скрипт обновления переводов на сервере kasuf.xyz
echo "🌐 Обновление переводов Production CRM на kasuf.xyz"

# Переходим в директорию проекта
cd /var/www/thewho/frontend

echo "📝 Создание обновленных файлов переводов..."

# Создаем обновленный файл переводов с полными EN переводами
cat > src/i18n/translations.ts << 'EOF'
/**
 * ПОЛНЫЕ ПЕРЕВОДЫ ДЛЯ KASUF.XYZ
 * Обновлено: 2025-06-18
 */

export const translations: Record<'ru' | 'en', Record<string, string>> = {
  ru: {
    'app.title': 'Production CRM',
    'menu.production': 'Производство',
    'menu.operations': 'Активные операции',
    'menu.database': 'База данных',
    'menu.shifts': 'Смены',
    'menu.operators': 'Операторы',
    'menu.planning': 'Планирование',
    'menu.calendar': 'Календарь',
    'menu.translations': 'Переводы',
    
    'page.database.title': 'База данных заказов',
    'page.operations.title': 'Мониторинг активных операций',
    'page.shifts.title': 'Учет смен',
    'page.operators.title': 'Управление операторами',
    'page.planning.title': 'Планирование производства',
    'page.calendar.title': 'Производственный календарь',

    'button.save': 'Сохранить',
    'button.cancel': 'Отмена',
    'button.delete': 'Удалить',
    'button.edit': 'Редактировать',
    'button.add': 'Добавить',
    'button.create': 'Создать',
    'button.update': 'Обновить',
    'button.close': 'Закрыть',
    'button.refresh': 'Обновить',

    'order_form.new_order': 'Новый заказ',
    'order_form.edit_order': 'Редактировать заказ',
    'order_form.drawing_number': 'Номер чертежа',
    'order_form.drawing_placeholder': 'Например: C6HP0021A',
    'order_form.quantity': 'Количество',
    'order_form.priority': 'Приоритет',
    'order_form.deadline': 'Срок выполнения',
    'order_form.work_type': 'Тип работы',
    'order_form.operations': 'Операции',
    'order_form.operation_type': 'Тип операции',
    'order_form.machine_axes': 'Оси',
    'order_form.estimated_time': 'Время (мин)',
    'order_form.add_operation': 'Добавить операцию',
    'order_form.milling': 'Фрезерная',
    'order_form.turning': 'Токарная',
    'order_form.drilling': 'Сверлильная',
    'order_form.create': 'Создать',
    'order_form.save': 'Сохранить',
    'order_form.cancel': 'Отмена',

    'database.orders': 'Заказы',
    'database.add_order': 'Добавить заказ',
    'database.new_order': 'Новый заказ',
    'database.drawing_number': 'Номер чертежа',
    'database.quantity': 'Количество',
    'database.priority': 'Приоритет',
    'database.deadline': 'Срок',
    'database.operations': 'Операции',
    'database.actions': 'Действия',

    'priority.HIGH': 'Высокий',
    'priority.MEDIUM': 'Средний',
    'priority.LOW': 'Низкий',

    'language.switch': 'Переключить язык',
    'language.russian': 'Русский',
    'language.english': 'English',

    'message.loading': 'Загрузка...',
    'message.no_data': 'Нет данных',
  },

  en: {
    'app.title': 'Production CRM',
    'menu.production': 'Production',
    'menu.operations': 'Active Operations',
    'menu.database': 'Database',
    'menu.shifts': 'Shifts',
    'menu.operators': 'Operators',
    'menu.planning': 'Planning',
    'menu.calendar': 'Calendar',
    'menu.translations': 'Translations',
    
    'page.database.title': 'Orders Database',
    'page.operations.title': 'Active Operations Monitoring',
    'page.shifts.title': 'Shift Management',
    'page.operators.title': 'Operator Management',
    'page.planning.title': 'Production Planning',
    'page.calendar.title': 'Production Calendar',

    'button.save': 'Save',
    'button.cancel': 'Cancel',
    'button.delete': 'Delete',
    'button.edit': 'Edit',
    'button.add': 'Add',
    'button.create': 'Create',
    'button.update': 'Update',
    'button.close': 'Close',
    'button.refresh': 'Refresh',

    'order_form.new_order': 'New Order',
    'order_form.edit_order': 'Edit Order',
    'order_form.drawing_number': 'Drawing Number',
    'order_form.drawing_placeholder': 'e.g.: C6HP0021A',
    'order_form.quantity': 'Quantity',
    'order_form.priority': 'Priority',
    'order_form.deadline': 'Deadline',
    'order_form.work_type': 'Work Type',
    'order_form.operations': 'Operations',
    'order_form.operation_type': 'Operation Type',
    'order_form.machine_axes': 'Axes',
    'order_form.estimated_time': 'Time (min)',
    'order_form.add_operation': 'Add Operation',
    'order_form.milling': 'Milling',
    'order_form.turning': 'Turning',
    'order_form.drilling': 'Drilling',
    'order_form.create': 'Create',
    'order_form.save': 'Save',
    'order_form.cancel': 'Cancel',

    'database.orders': 'Orders',
    'database.add_order': 'Add Order',
    'database.new_order': 'New Order',
    'database.drawing_number': 'Drawing Number',
    'database.quantity': 'Quantity',
    'database.priority': 'Priority',
    'database.deadline': 'Deadline',
    'database.operations': 'Operations',
    'database.actions': 'Actions',

    'priority.HIGH': 'High',
    'priority.MEDIUM': 'Medium',
    'priority.LOW': 'Low',

    'language.switch': 'Switch language',
    'language.russian': 'Русский',
    'language.english': 'English',

    'message.loading': 'Loading...',
    'message.no_data': 'No data',
  },
};

export type TranslationKey = string;
EOF

echo "✅ Файл переводов обновлен"

echo "🔨 Пересборка фронтенда с новыми переводами..."

# Устанавливаем правильный API URL для kasuf.xyz
cat > .env.production << 'EOF'
REACT_APP_API_URL=http://kasuf.xyz/api
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
EOF

# Пересобираем проект
npm run build

echo "📦 Копирование новой сборки в production директорию..."

# Создаем резервную копию старой сборки
if [ -d "/var/www/production-crm-clean.backup" ]; then
    rm -rf /var/www/production-crm-clean.backup
fi
cp -r /var/www/production-crm-clean /var/www/production-crm-clean.backup

# Копируем новую сборку
cp -r build/* /var/www/production-crm-clean/

# Устанавливаем правильные права доступа
chmod -R 644 /var/www/production-crm-clean/*
find /var/www/production-crm-clean -type d -exec chmod 755 {} \;

echo "🔄 Перезагрузка Nginx..."
systemctl reload nginx

echo "🔍 Проверка результата..."

# Проверяем размеры файлов
echo "Размеры JS файлов:"
ls -lah /var/www/production-crm-clean/static/js/*.js

echo "Содержимое index.html:"
head -5 /var/www/production-crm-clean/index.html

echo "Проверка доступности:"
curl -I http://kasuf.xyz/ | head -3

echo ""
echo "✅ ОБНОВЛЕНИЕ ПЕРЕВОДОВ ЗАВЕРШЕНО!"
echo "🌐 Английская версия теперь должна работать полноценно"
echo "🔗 Проверьте: http://kasuf.xyz"
echo ""
echo "📱 Для проверки переводов:"
echo "   1. Откройте сайт в браузере"
echo "   2. Переключите язык на English"
echo "   3. Все элементы интерфейса должны быть переведены"
