#!/bin/bash

# Скрипт добавления адаптивного масштабирования в TheWho CRM
echo "🎨 Добавление адаптивного масштабирования..."

# Создаем CSS файл адаптивного масштабирования
cat > /var/www/thewho/frontend/build/adaptive-scaling.css << 'EOF'
/* Адаптивное масштабирование для TheWho CRM */

/* Базовое увеличение масштаба на 20% */
html {
  zoom: 1.2;
  font-size: 16px;
}

/* Адаптивное масштабирование под разные разрешения */
@media (max-width: 1366px) {
  html { zoom: 1.0; font-size: 14px; }
}

@media (min-width: 1367px) and (max-width: 1600px) {
  html { zoom: 1.1; font-size: 15px; }
}

@media (min-width: 1601px) and (max-width: 1920px) {
  html { zoom: 1.2; font-size: 16px; }
}

@media (min-width: 1921px) and (max-width: 2560px) {
  html { zoom: 1.3; font-size: 17px; }
}

@media (min-width: 2561px) {
  html { zoom: 1.5; font-size: 18px; }
}

/* Улучшенная читаемость текста */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
  line-height: 1.6 !important;
  letter-spacing: 0.3px !important;
}

/* Увеличение размеров кнопок и интерактивных элементов */
.ant-btn {
  min-height: 40px !important;
  padding: 8px 16px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
}

.ant-btn-lg {
  min-height: 48px !important;
  padding: 12px 20px !important;
  font-size: 16px !important;
}

/* Увеличение размеров полей ввода */
.ant-input {
  min-height: 40px !important;
  padding: 8px 12px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
}

.ant-select-selector {
  min-height: 40px !important;
  padding: 4px 12px !important;
}

/* Увеличение размеров таблиц */
.ant-table-tbody > tr > td {
  padding: 12px 16px !important;
  font-size: 14px !important;
}

.ant-table-thead > tr > th {
  padding: 12px 16px !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

/* Увеличение размеров карточек */
.ant-card {
  border-radius: 8px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.ant-card-head {
  padding: 16px 24px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
}

.ant-card-body {
  padding: 20px 24px !important;
}

/* Улучшение навигации */
.ant-menu-item {
  height: 48px !important;
  line-height: 48px !important;
  margin: 4px 0 !important;
  border-radius: 6px !important;
}

.ant-menu-item-selected {
  background-color: #e6f7ff !important;
  border-radius: 6px !important;
}

/* Увеличение иконок */
.anticon {
  font-size: 16px !important;
}

.ant-btn .anticon {
  font-size: 14px !important;
}

/* Улучшение модальных окон */
.ant-modal-content {
  border-radius: 8px !important;
}

.ant-modal-header {
  padding: 20px 24px !important;
  border-radius: 8px 8px 0 0 !important;
}

.ant-modal-body {
  padding: 20px 24px !important;
  font-size: 14px !important;
}

/* Улучшение форм */
.ant-form-item {
  margin-bottom: 20px !important;
}

.ant-form-item-label > label {
  font-size: 14px !important;
  font-weight: 500 !important;
  color: #262626 !important;
}

/* Увеличение отступов в контейнерах */
.ant-layout-content {
  padding: 24px !important;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  html { 
    zoom: 1.0; 
    font-size: 16px; 
  }
  
  .ant-btn {
    min-height: 44px !important;
    font-size: 16px !important;
  }
  
  .ant-input {
    min-height: 44px !important;
    font-size: 16px !important;
  }
}

/* Настройки для высоких DPI дисплеев */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  html {
    zoom: 1.3;
  }
  
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* Кастомные классы для управления масштабом */
.zoom-small { zoom: 0.9 !important; }
.zoom-normal { zoom: 1.0 !important; }
.zoom-large { zoom: 1.2 !important; }
.zoom-xlarge { zoom: 1.4 !important; }

/* Контрастность и доступность */
.ant-btn-primary {
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  font-weight: 500 !important;
}

.ant-btn-primary:hover {
  background-color: #40a9ff !important;
  border-color: #40a9ff !important;
}

/* Улучшение видимости активных элементов */
.ant-input:focus,
.ant-select-focused .ant-select-selector {
  border-color: #40a9ff !important;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2) !important;
}
EOF

# Добавляем стили в index.html
echo "📝 Добавляем стили в index.html..."

# Создаем бэкап index.html
cp /var/www/thewho/frontend/build/index.html /var/www/thewho/frontend/build/index.html.backup

# Добавляем ссылку на CSS в head секцию
sed -i '/<\/head>/i\    <link rel="stylesheet" href="/adaptive-scaling.css">' /var/www/thewho/frontend/build/index.html

# Добавляем viewport meta tag для правильного отображения на мобильных
sed -i '/<meta name="viewport"/c\    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes">' /var/www/thewho/frontend/build/index.html

echo "✅ Адаптивное масштабирование добавлено!"
echo ""
echo "🎯 Особенности:"
echo "   📱 Автоматическое масштабирование под размер экрана"
echo "   🔍 Базовое увеличение на 20% для лучшей читаемости"
echo "   📏 Адаптивные размеры для экранов от 1366px до 4K+"
echo "   🖱️ Увеличенные кнопки и поля ввода"
echo "   📋 Улучшенная читаемость таблиц"
echo ""
echo "📐 Масштабирование по разрешениям:"
echo "   ≤1366px: 100% (стандартный размер)"
echo "   1367-1600px: 110%"
echo "   1601-1920px: 120% (ваш запрос)"
echo "   1921-2560px: 130%"
echo "   ≥2561px: 150% (4K мониторы)"
echo ""
echo "🔧 Дополнительные возможности:"
echo "   - Поддержка высоких DPI дисплеев"
echo "   - Улучшенная контрастность"
echo "   - Адаптивность для планшетов и телефонов"
echo ""
echo "🌐 Обновите страницу чтобы увидеть изменения!"

# Перезапускаем nginx
sudo systemctl reload nginx

echo "✅ Nginx перезапущен, изменения применены!"
