// Мобильная логика для TheWho CRM
(function() {
    'use strict';
    
    // Определение мобильного устройства
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    
    // Состояние мобильного меню
    let mobileMenuOpen = false;
    
    // Создание мобильной шапки
    function createMobileHeader() {
        if (!isMobile) return;
        
        const header = document.createElement('div');
        header.className = 'mobile-header';
        header.innerHTML = `
            <button class="mobile-menu-btn" id="mobile-menu-toggle">
                <span style="display: inline-block; width: 20px; height: 3px; background: white; margin: 3px 0; transition: 0.3s;"></span>
                <span style="display: inline-block; width: 20px; height: 3px; background: white; margin: 3px 0; transition: 0.3s;"></span>
                <span style="display: inline-block; width: 20px; height: 3px; background: white; margin: 3px 0; transition: 0.3s;"></span>
            </button>
            <div class="mobile-title">TheWho CRM</div>
            <div style="width: 32px;"></div>
        `;
        
        // Вставляем в начало body
        document.body.insertBefore(header, document.body.firstChild);
        
        // Создаем оверлей
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.id = 'mobile-overlay';
        document.body.appendChild(overlay);
    }
    
    // Настройка мобильной навигации
    function setupMobileNavigation() {
        if (!isMobile) return;
        
        const sider = document.querySelector('.ant-layout-sider');
        const overlay = document.getElementById('mobile-overlay');
        const menuToggle = document.getElementById('mobile-menu-toggle');
        
        if (!sider || !overlay || !menuToggle) return;
        
        // Добавляем класс для стилизации
        sider.classList.add('mobile-sider');
        
        // Обработчик кнопки меню
        menuToggle.addEventListener('click', toggleMobileMenu);
        
        // Закрытие по клику на оверлей
        overlay.addEventListener('click', closeMobileMenu);
        
        // Закрытие по свайпу
        let startX = 0;
        sider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        
        sider.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            if (startX - endX > 50) { // Свайп влево
                closeMobileMenu();
            }
        });
    }
    
    function toggleMobileMenu() {
        const sider = document.querySelector('.ant-layout-sider');
        const overlay = document.getElementById('mobile-overlay');
        const menuBtn = document.getElementById('mobile-menu-toggle');
        
        mobileMenuOpen = !mobileMenuOpen;
        
        if (mobileMenuOpen) {
            sider.classList.add('mobile-open');
            overlay.classList.add('active');
            menuBtn.style.transform = 'rotate(90deg)';
        } else {
            sider.classList.remove('mobile-open');
            overlay.classList.remove('active');
            menuBtn.style.transform = 'rotate(0deg)';
        }
    }
    
    function closeMobileMenu() {
        if (mobileMenuOpen) {
            toggleMobileMenu();
        }
    }
    
    // Преобразование таблиц в мобильные карточки
    function convertTablesToCards() {
        if (!isMobile) return;
        
        const tables = document.querySelectorAll('.ant-table-wrapper');
        
        tables.forEach(tableWrapper => {
            const table = tableWrapper.querySelector('.ant-table-tbody');
            if (!table) return;
            
            const headers = Array.from(tableWrapper.querySelectorAll('.ant-table-thead th')).map(th => th.textContent.trim());
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
                                <strong style="color: #666; font-size: 12px; text-transform: uppercase;">${headers[index]}:</strong>
                                <div style="margin-top: 2px;">${cell.innerHTML}</div>
                            </div>
                        `;
                    }
                });
                
                card.innerHTML = cardHTML;
                cardContainer.appendChild(card);
            });
            
            // Скрываем оригинальную таблицу и показываем карточки
            tableWrapper.style.display = 'none';
            tableWrapper.parentNode.insertBefore(cardContainer, tableWrapper.nextSibling);
        });
    }
    
    // Добавление FAB кнопок
    function addFloatingActionButtons() {
        if (!isMobile) return;
        
        // Кнопка "Добавить"
        const addFab = document.createElement('button');
        addFab.className = 'mobile-fab';
        addFab.innerHTML = '+';
        addFab.style.bottom = '80px';
        addFab.title = 'Добавить новый элемент';
        
        addFab.addEventListener('click', () => {
            // Находим кнопку "Добавить" на странице и кликаем по ней
            const addButton = document.querySelector('.ant-btn-primary[title*="добавить"], .ant-btn-primary:contains("Добавить"), .ant-btn[title*="Новый"]');
            if (addButton) {
                addButton.click();
            }
        });
        
        document.body.appendChild(addFab);
        
        // Кнопка "Обновить"
        const refreshFab = document.createElement('button');
        refreshFab.className = 'mobile-fab';
        refreshFab.innerHTML = '↻';
        refreshFab.style.bottom = '20px';
        refreshFab.style.fontSize = '20px';
        refreshFab.title = 'Обновить данные';
        
        refreshFab.addEventListener('click', () => {
            window.location.reload();
        });
        
        document.body.appendChild(refreshFab);
    }
    
    // Улучшение форм для мобильных
    function enhanceMobileForms() {
        if (!isMobile) return;
        
        // Добавляем автофокус и правильные типы input
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Предотвращаем зум при фокусе
            if (input.type === 'text' || input.type === 'email' || input.type === 'password') {
                input.style.fontSize = '16px';
            }
            
            // Улучшаем числовые поля
            if (input.type === 'number' || input.classList.contains('ant-input-number-input')) {
                input.setAttribute('inputmode', 'numeric');
                input.setAttribute('pattern', '[0-9]*');
            }
        });
        
        // Улучшаем модальные окна
        const modals = document.querySelectorAll('.ant-modal');
        modals.forEach(modal => {
            modal.style.maxHeight = '90vh';
            modal.style.overflow = 'auto';
        });
    }
    
    // Добавление свайп-действий
    function addSwipeActions() {
        if (!isMobile) return;
        
        const tableRows = document.querySelectorAll('.ant-table-tbody tr, .mobile-table-card');
        
        tableRows.forEach(row => {
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            row.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
                row.style.transition = 'none';
            });
            
            row.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                currentX = e.touches[0].clientX;
                const diffX = startX - currentX;
                
                if (diffX > 0) { // Свайп влево
                    row.style.transform = `translateX(-${Math.min(diffX, 100)}px)`;
                }
            });
            
            row.addEventListener('touchend', () => {
                if (!isDragging) return;
                isDragging = false;
                
                const diffX = startX - currentX;
                row.style.transition = 'transform 0.3s ease';
                
                if (diffX > 50) {
                    // Показываем действия
                    row.style.transform = 'translateX(-100px)';
                    row.classList.add('swiped');
                    
                    // Добавляем кнопки действий если их нет
                    if (!row.querySelector('.swipe-actions')) {
                        const actions = document.createElement('div');
                        actions.className = 'swipe-actions';
                        actions.innerHTML = `
                            <button style="background: none; border: none; color: white; padding: 8px;">
                                🗑️
                            </button>
                        `;
                        row.style.position = 'relative';
                        row.appendChild(actions);
                    }
                } else {
                    row.style.transform = 'translateX(0)';
                    row.classList.remove('swiped');
                }
            });
        });
    }
    
    // Адаптивная сетка
    function setupResponsiveGrid() {
        const containers = document.querySelectorAll('.ant-row, .grid-container');
        
        containers.forEach(container => {
            if (isMobile) {
                container.style.display = 'grid';
                container.style.gridTemplateColumns = '1fr';
                container.style.gap = '16px';
            } else if (isTablet) {
                container.style.display = 'grid';
                container.style.gridTemplateColumns = 'repeat(2, 1fr)';
                container.style.gap = '16px';
            }
        });
    }
    
    // Улучшение производительности на мобильных
    function optimizePerformance() {
        if (!isMobile) return;
        
        // Отключаем анимации при скроллинге
        let isScrolling = false;
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                document.body.style.pointerEvents = 'none';
                isScrolling = true;
            }
            
            clearTimeout(window.scrollTimeout);
            window.scrollTimeout = setTimeout(() => {
                document.body.style.pointerEvents = 'auto';
                isScrolling = false;
            }, 100);
        });
        
        // Ленивая загрузка изображений
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Добавление pull-to-refresh
    function addPullToRefresh() {
        if (!isMobile) return;
        
        let startY = 0;
        let currentY = 0;
        let isRefreshing = false;
        
        const refreshIndicator = document.createElement('div');
        refreshIndicator.style.cssText = `
            position: fixed;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: #1890ff;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1002;
            transition: top 0.3s ease;
        `;
        refreshIndicator.textContent = 'Потяните для обновления';
        document.body.appendChild(refreshIndicator);
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && !isRefreshing) {
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;
                
                if (diff > 0) {
                    e.preventDefault();
                    refreshIndicator.style.top = Math.min(diff - 50, 20) + 'px';
                    
                    if (diff > 100) {
                        refreshIndicator.textContent = 'Отпустите для обновления';
                        refreshIndicator.style.background = '#52c41a';
                    } else {
                        refreshIndicator.textContent = 'Потяните для обновления';
                        refreshIndicator.style.background = '#1890ff';
                    }
                }
            }
        });
        
        document.addEventListener('touchend', () => {
            if (window.scrollY === 0 && !isRefreshing) {
                const diff = currentY - startY;
                
                if (diff > 100) {
                    isRefreshing = true;
                    refreshIndicator.textContent = 'Обновление...';
                    refreshIndicator.style.top = '20px';
                    refreshIndicator.style.background = '#1890ff';
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    refreshIndicator.style.top = '-50px';
                }
            }
        });
    }
    
    // Инициализация мобильных функций
    function initMobile() {
        createMobileHeader();
        setupMobileNavigation();
        enhanceMobileForms();
        setupResponsiveGrid();
        addFloatingActionButtons();
        optimizePerformance();
        addPullToRefresh();
        
        // Отложенная инициализация для элементов, которые загружаются динамически
        setTimeout(() => {
            convertTablesToCards();
            addSwipeActions();
        }, 1000);
        
        // Переинициализация при изменениях DOM
        const observer = new MutationObserver(() => {
            setTimeout(() => {
                convertTablesToCards();
                addSwipeActions();
                enhanceMobileForms();
            }, 500);
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('📱 Мобильная версия TheWho CRM загружена');
    }
    
    // Запуск после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobile);
    } else {
        initMobile();
    }
    
    // Переинициализация при изменении ориентации
    window.addEventListener('orientationchange', () => {
        setTimeout(initMobile, 500);
    });
    
})();
