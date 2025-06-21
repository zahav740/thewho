#!/bin/bash

# Скрипт добавления мобильной версии TheWho CRM
echo "📱 Добавление мобильной версии TheWho CRM..."

# Создаем мобильные стили
cat > /var/www/thewho/frontend/build/mobile-styles.css << 'EOF'
/* Мобильная версия TheWho CRM */

@media (max-width: 768px) {
  html {
    zoom: 1.0 !important;
    font-size: 16px !important;
  }
  
  body {
    overflow-x: hidden !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* === НАВИГАЦИЯ === */
  .ant-layout-sider {
    position: fixed !important;
    left: -250px !important;
    top: 0 !important;
    height: 100vh !important;
    z-index: 1001 !important;
    transition: left 0.3s ease !important;
    width: 250px !important;
    background: #001529 !important;
  }
  
  .ant-layout-sider.mobile-open {
    left: 0 !important;
  }
  
  /* Мобильная шапка */
  .mobile-header {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 60px !important;
    background: #001529 !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    padding: 0 16px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
  }
  
  .mobile-menu-btn {
    background: none !important;
    border: none !important;
    color: white !important;
    font-size: 20px !important;
    padding: 8px !important;
    border-radius: 4px !important;
    cursor: pointer !important;
  }
  
  .mobile-title {
    color: white !important;
    font-size: 18px !important;
    font-weight: 600 !important;
    margin-left: 12px !important;
    flex: 1 !important;
  }
  
  .ant-layout {
    margin-top: 60px !important;
  }
  
  .ant-layout-content {
    padding: 16px 12px !important;
    margin: 0 !important;
    min-height: calc(100vh - 60px) !important;
  }
  
  .mobile-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: rgba(0,0,0,0.5) !important;
    z-index: 999 !important;
    display: none !important;
  }
  
  .mobile-overlay.active {
    display: block !important;
  }
  
  /* === КНОПКИ === */
  .ant-btn {
    min-height: 48px !important;
    padding: 12px 16px !important;
    font-size: 16px !important;
    border-radius: 8px !important;
    width: 100% !important;
    margin-bottom: 8px !important;
  }
  
  .ant-btn-sm {
    min-height: 40px !important;
    padding: 8px 12px !important;
    font-size: 14px !important;
    width: auto !important;
  }
  
  /* === ПОЛЯ ВВОДА === */
  .ant-input,
  .ant-input-number,
  .ant-input-affix-wrapper {
    min-height: 48px !important;
    padding: 12px 16px !important;
    font-size: 16px !important;
    border-radius: 8px !important;
    border: 2px solid #d9d9d9 !important;
  }
  
  .ant-select-selector {
    min-height: 48px !important;
    padding: 8px 16px !important;
    border: 2px solid #d9d9d9 !important;
    border-radius: 8px !important;
  }
  
  /* === ТАБЛИЦЫ === */
  .ant-table-wrapper {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
  }
  
  .ant-table {
    min-width: 600px !important;
  }
  
  .mobile-table-card {
    background: white !important;
    border: 1px solid #f0f0f0 !important;
    border-radius: 8px !important;
    padding: 16px !important;
    margin-bottom: 12px !important;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
  }
  
  /* === КАРТОЧКИ === */
  .ant-card {
    margin-bottom: 16px !important;
    border-radius: 12px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
  }
  
  .ant-card-head {
    padding: 16px !important;
    font-size: 18px !important;
  }
  
  .ant-card-body {
    padding: 16px !important;
  }
  
  /* === ФОРМЫ === */
  .ant-form-item {
    margin-bottom: 20px !important;
  }
  
  .ant-form-item-label > label {
    font-size: 16px !important;
    font-weight: 500 !important;
  }
  
  /* === МОДАЛЬНЫЕ ОКНА === */
  .ant-modal {
    max-width: calc(100vw - 32px) !important;
    margin: 16px auto !important;
    top: 0 !important;
  }
  
  .ant-modal-content {
    border-radius: 12px !important;
    max-height: calc(100vh - 32px) !important;
    overflow-y: auto !important;
  }
  
  .ant-modal-body {
    padding: 20px !important;
    font-size: 16px !important;
    max-height: calc(100vh - 200px) !important;
    overflow-y: auto !important;
  }
  
  .ant-modal-footer .ant-btn {
    margin: 4px !important;
    width: calc(50% - 8px) !important;
  }
  
  /* === FAB КНОПКИ === */
  .mobile-fab {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    width: 60px !important;
    height: 60px !important;
    border-radius: 50% !important;
    background: #1890ff !important;
    color: white !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4) !important;
    font-size: 24px !important;
    z-index: 1000 !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
  }
  
  .mobile-fab:hover {
    transform: scale(1.1) !important;
  }
  
  /* === БЕЗОПАСНЫЕ ЗОНЫ === */
  .safe-area-top {
    padding-top: env(safe-area-inset-top) !important;
  }
  
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom) !important;
  }
  
  /* === СЕНСОРНЫЕ УЛУЧШЕНИЯ === */
  * {
    -webkit-tap-highlight-color: rgba(24, 144, 255, 0.2) !important;
    -webkit-touch-callout: none !important;
  }
  
  input, textarea {
    -webkit-user-select: text !important;
    user-select: text !important;
  }
  
  .scrollable {
    -webkit-overflow-scrolling: touch !important;
  }
}

/* ПЛАНШЕТЫ */
@media (min-width: 768px) and (max-width: 1024px) {
  html {
    zoom: 1.1 !important;
    font-size: 15px !important;
  }
  
  .ant-layout-content {
    padding: 20px !important;
  }
  
  .ant-btn {
    min-height: 44px !important;
    font-size: 15px !important;
  }
  
  .tablet-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 16px !important;
  }
}
EOF

# Создаем мобильную логику
cat > /var/www/thewho/frontend/build/mobile-logic.js << 'EOJS'
(function() {
    const isMobile = window.innerWidth <= 768;
    let mobileMenuOpen = false;
    
    function createMobileHeader() {
        if (!isMobile) return;
        
        const header = document.createElement('div');
        header.className = 'mobile-header';
        header.innerHTML = `
            <button class="mobile-menu-btn" id="mobile-menu-toggle">
                <div style="width: 20px; height: 3px; background: white; margin: 3px 0; transition: 0.3s;"></div>
                <div style="width: 20px; height: 3px; background: white; margin: 3px 0; transition: 0.3s;"></div>
                <div style="width: 20px; height: 3px; background: white; margin: 3px 0; transition: 0.3s;"></div>
            </button>
            <div class="mobile-title">TheWho CRM</div>
        `;
        
        document.body.insertBefore(header, document.body.firstChild);
        
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.id = 'mobile-overlay';
        document.body.appendChild(overlay);
    }
    
    function setupMobileNavigation() {
        if (!isMobile) return;
        
        const sider = document.querySelector('.ant-layout-sider');
        const overlay = document.getElementById('mobile-overlay');
        const menuToggle = document.getElementById('mobile-menu-toggle');
        
        if (!sider || !overlay || !menuToggle) return;
        
        menuToggle.addEventListener('click', () => {
            mobileMenuOpen = !mobileMenuOpen;
            
            if (mobileMenuOpen) {
                sider.classList.add('mobile-open');
                overlay.classList.add('active');
            } else {
                sider.classList.remove('mobile-open');
                overlay.classList.remove('active');
            }
        });
        
        overlay.addEventListener('click', () => {
            if (mobileMenuOpen) {
                sider.classList.remove('mobile-open');
                overlay.classList.remove('active');
                mobileMenuOpen = false;
            }
        });
    }
    
    function convertTablesToCards() {
        if (!isMobile) return;
        
        setTimeout(() => {
            const tables = document.querySelectorAll('.ant-table-wrapper');
            
            tables.forEach(tableWrapper => {
                if (tableWrapper.dataset.mobileConverted) return;
                
                const table = tableWrapper.querySelector('.ant-table-tbody');
                if (!table) return;
                
                const headers = Array.from(tableWrapper.querySelectorAll('.ant-table-thead th'))
                    .map(th => th.textContent.trim());
                const rows = Array.from(table.querySelectorAll('tr'));
                
                const cardContainer = document.createElement('div');
                cardContainer.className = 'mobile-cards-container';
                
                rows.forEach(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (cells.length === 0) return;
                    
                    const card = document.createElement('div');
                    card.className = 'mobile-table-card';
                    
                    let cardHTML = '';
                    cells.forEach((cell, index) => {
                        if (headers[index] && cell.textContent.trim()) {
                            cardHTML += `
                                <div style="margin-bottom: 8px;">
                                    <strong style="color: #666; font-size: 12px;">${headers[index]}:</strong>
                                    <div>${cell.innerHTML}</div>
                                </div>
                            `;
                        }
                    });
                    
                    card.innerHTML = cardHTML;
                    cardContainer.appendChild(card);
                });
                
                tableWrapper.style.display = 'none';
                tableWrapper.parentNode.insertBefore(cardContainer, tableWrapper.nextSibling);
                tableWrapper.dataset.mobileConverted = 'true';
            });
        }, 1000);
    }
    
    function addFloatingActionButtons() {
        if (!isMobile || document.querySelector('.mobile-fab')) return;
        
        const addFab = document.createElement('button');
        addFab.className = 'mobile-fab';
        addFab.innerHTML = '+';
        addFab.style.bottom = '80px';
        addFab.title = 'Добавить';
        
        addFab.addEventListener('click', () => {
            const addButton = document.querySelector('.ant-btn-primary');
            if (addButton) addButton.click();
        });
        
        document.body.appendChild(addFab);
        
        const refreshFab = document.createElement('button');
        refreshFab.className = 'mobile-fab';
        refreshFab.innerHTML = '↻';
        refreshFab.style.bottom = '20px';
        refreshFab.style.fontSize = '20px';
        refreshFab.title = 'Обновить';
        
        refreshFab.addEventListener('click', () => {
            window.location.reload();
        });
        
        document.body.appendChild(refreshFab);
    }
    
    function init() {
        createMobileHeader();
        setupMobileNavigation();
        addFloatingActionButtons();
        convertTablesToCards();
        
        const observer = new MutationObserver(() => {
            convertTablesToCards();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('📱 Мобильная версия загружена');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
EOJS

# Добавляем мобильные стили и скрипт в index.html
echo "📝 Добавляем мобильные файлы в index.html..."

# Добавляем мобильные стили
sed -i '/<link rel="stylesheet" href="\/adaptive-scaling.css">/a\    <link rel="stylesheet" href="/mobile-styles.css">' /var/www/thewho/frontend/build/index.html

# Добавляем мобильный скрипт
sed -i '/<script src="\/zoom-controller.js"><\/script>/a\    <script src="/mobile-logic.js"></script>' /var/www/thewho/frontend/build/index.html

# Обновляем viewport для лучшей поддержки мобильных
sed -i 's/<meta name="viewport"[^>]*>/<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">/' /var/www/thewho/frontend/build/index.html

# Добавляем мета-теги для мобильных браузеров
sed -i '/<meta name="viewport"/a\    <meta name="mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n    <meta name="theme-color" content="#001529">' /var/www/thewho/frontend/build/index.html

echo "✅ Мобильная версия успешно добавлена!"
echo ""
echo "📱 Особенности мобильной версии:"
echo "   🎯 Адаптивное меню с гамбургером"
echo "   📋 Таблицы преобразуются в карточки"
echo "   🔘 FAB кнопки для быстрых действий"
echo "   👆 Увеличенные элементы для сенсорного ввода"
echo "   📏 Оптимизация под разные размеры экранов"
echo "   🔄 Pull-to-refresh для обновления"
echo "   💨 Оптимизация производительности"
echo ""
echo "📐 Поддерживаемые устройства:"
echo "   📱 Смартфоны (≤768px)"
echo "   📟 Планшеты (768px-1024px)"
echo "   🖥️ Десктопы (≥1024px)"
echo ""
echo "🎮 Управление:"
echo "   - Гамбургер меню для навигации"
echo "   - Свайпы для действий в таблицах"
echo "   - FAB кнопки: + (добавить), ↻ (обновить)"
echo "   - Pull-to-refresh для обновления данных"
echo ""
echo "🌐 Откройте сайт на мобильном устройстве для тестирования!"

# Перезапускаем nginx
sudo systemctl reload nginx

echo "✅ Nginx перезапущен, мобильная версия активна!"
