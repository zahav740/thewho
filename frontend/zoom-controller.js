// Скрипт для добавления контроллера масштаба в интерфейс
(function() {
    'use strict';
    
    // Создаем контроллер масштаба
    function createZoomController() {
        const controller = document.createElement('div');
        controller.id = 'zoom-controller';
        controller.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: white;
            border: 1px solid #d9d9d9;
            border-radius: 6px;
            padding: 8px 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        // Получаем текущий масштаб
        const currentZoom = parseFloat(document.documentElement.style.zoom) || 1.2;
        
        // Создаем элементы управления
        controller.innerHTML = `
            <span style="color: #666; font-weight: 500;">Масштаб:</span>
            <button id="zoom-decrease" style="
                background: #f5f5f5; 
                border: 1px solid #d9d9d9; 
                border-radius: 4px; 
                width: 24px; 
                height: 24px; 
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">−</button>
            <span id="zoom-display" style="
                min-width: 40px; 
                text-align: center; 
                font-weight: 600;
                color: #1890ff;
            ">${Math.round(currentZoom * 100)}%</span>
            <button id="zoom-increase" style="
                background: #f5f5f5; 
                border: 1px solid #d9d9d9; 
                border-radius: 4px; 
                width: 24px; 
                height: 24px; 
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">+</button>
            <button id="zoom-reset" style="
                background: #1890ff; 
                color: white; 
                border: 1px solid #1890ff; 
                border-radius: 4px; 
                padding: 2px 8px; 
                cursor: pointer;
                font-size: 11px;
                margin-left: 4px;
            ">Сброс</button>
        `;
        
        return controller;
    }
    
    // Функции управления масштабом
    function setZoom(zoom) {
        document.documentElement.style.zoom = zoom;
        localStorage.setItem('crm-zoom-level', zoom);
        
        const display = document.getElementById('zoom-display');
        if (display) {
            display.textContent = Math.round(zoom * 100) + '%';
        }
    }
    
    function getZoom() {
        const saved = localStorage.getItem('crm-zoom-level');
        return saved ? parseFloat(saved) : 1.2;
    }
    
    function increaseZoom() {
        const current = parseFloat(document.documentElement.style.zoom) || getZoom();
        const newZoom = Math.min(current + 0.1, 2.0);
        setZoom(newZoom);
    }
    
    function decreaseZoom() {
        const current = parseFloat(document.documentElement.style.zoom) || getZoom();
        const newZoom = Math.max(current - 0.1, 0.7);
        setZoom(newZoom);
    }
    
    function resetZoom() {
        setZoom(1.2);
    }
    
    // Инициализация
    function init() {
        // Применяем сохраненный масштаб
        const savedZoom = getZoom();
        setZoom(savedZoom);
        
        // Создаем контроллер
        const controller = createZoomController();
        document.body.appendChild(controller);
        
        // Привязываем события
        document.getElementById('zoom-increase').addEventListener('click', increaseZoom);
        document.getElementById('zoom-decrease').addEventListener('click', decreaseZoom);
        document.getElementById('zoom-reset').addEventListener('click', resetZoom);
        
        // Горячие клавиши
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey) {
                if (e.key === '=') {
                    e.preventDefault();
                    increaseZoom();
                } else if (e.key === '-') {
                    e.preventDefault();
                    decreaseZoom();
                } else if (e.key === '0') {
                    e.preventDefault();
                    resetZoom();
                }
            }
        });
        
        console.log('🎨 Контроллер масштаба загружен. Горячие клавиши: Ctrl + / Ctrl - / Ctrl 0');
    }
    
    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
