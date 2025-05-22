// Файл для активации исправленного планирования
// Добавьте этот файл в проект для включения новой логики

// Создаем глобальный объект для хранения состояния
declare global {
  interface Window {
    activateFixedPlanning: () => boolean;
    deactivateFixedPlanning: () => boolean;
    isPlanningFixed: () => boolean;
    _planningFixEnabled: boolean;
  }
}

// Функция активации улучшенного планирования
function activateFixedPlanning() {
  console.log('📢 АКТИВАЦИЯ ИСПРАВЛЕННОЙ СИСТЕМЫ ПЛАНИРОВАНИЯ');
  window._planningFixEnabled = true;
  
  // Показываем сообщение пользователю
  const message = document.createElement('div');
  message.style.position = 'fixed';
  message.style.top = '10px';
  message.style.left = '50%';
  message.style.transform = 'translateX(-50%)';
  message.style.padding = '10px 20px';
  message.style.backgroundColor = '#4CAF50';
  message.style.color = 'white';
  message.style.borderRadius = '4px';
  message.style.zIndex = '10000';
  message.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  message.innerText = 'ИСПРАВЛЕННЫЙ РЕЖИМ ПЛАНИРОВАНИЯ АКТИВИРОВАН';
  
  document.body.appendChild(message);
  
  // Удаляем сообщение через 3 секунды
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
  
  // Включаем подсказку в консоли
  console.log(
    '%c СИСТЕМА ПЛАНИРОВАНИЯ ИСПРАВЛЕНА ',
    'background: #4CAF50; color: white; padding: 5px; border-radius: 3px;'
  );
  
  return true;
}

// Функция деактивации улучшенного планирования
function deactivateFixedPlanning() {
  console.log('📢 ДЕАКТИВАЦИЯ ИСПРАВЛЕННОЙ СИСТЕМЫ ПЛАНИРОВАНИЯ');
  window._planningFixEnabled = false;
  
  // Показываем сообщение пользователю
  const message = document.createElement('div');
  message.style.position = 'fixed';
  message.style.top = '10px';
  message.style.left = '50%';
  message.style.transform = 'translateX(-50%)';
  message.style.padding = '10px 20px';
  message.style.backgroundColor = '#F44336';
  message.style.color = 'white';
  message.style.borderRadius = '4px';
  message.style.zIndex = '10000';
  message.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  message.innerText = 'ИСПРАВЛЕННЫЙ РЕЖИМ ПЛАНИРОВАНИЯ ОТКЛЮЧЕН';
  
  document.body.appendChild(message);
  
  // Удаляем сообщение через 3 секунды
  setTimeout(() => {
    document.body.removeChild(message);
  }, 3000);
  
  // Включаем подсказку в консоли
  console.log(
    '%c СИСТЕМА ПЛАНИРОВАНИЯ В ОБЫЧНОМ РЕЖИМЕ ',
    'background: #F44336; color: white; padding: 5px; border-radius: 3px;'
  );
  
  return true;
}

// Функция проверки состояния
function isPlanningFixed() {
  return window._planningFixEnabled === true;
}

// Инициализация при загрузке страницы
function initializeFixedPlanning() {
  // По умолчанию включаем исправленный режим
  window._planningFixEnabled = true;
  
  // Добавляем функции в глобальный объект window
  window.activateFixedPlanning = activateFixedPlanning;
  window.deactivateFixedPlanning = deactivateFixedPlanning;
  window.isPlanningFixed = isPlanningFixed;
  
  // Добавляем информацию в консоль об активных функциях
  console.log(
    '%c СПРАВКА: Для активации исправленного планирования введите window.activateFixedPlanning() ',
    'background: #2196F3; color: white; padding: 5px; border-radius: 3px;'
  );
  console.log(
    '%c СПРАВКА: Для отключения исправленного планирования введите window.deactivateFixedPlanning() ',
    'background: #2196F3; color: white; padding: 5px; border-radius: 3px;'
  );
  
  // Активируем исправленное планирование автоматически
  activateFixedPlanning();
}

// Запуск инициализации после загрузки страницы
if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeFixedPlanning);
  
  // Или если окно уже загружено, выполняем сразу
  if (document.readyState === 'complete') {
    initializeFixedPlanning();
  }
}

export { activateFixedPlanning, deactivateFixedPlanning, isPlanningFixed };
