// Простой тест для проверки локализации
console.log('Тестирование i18n настроек...');

// Проверим, работает ли localStorage
try {
  localStorage.setItem('test', 'value');
  const test = localStorage.getItem('test');
  console.log('✓ localStorage работает:', test);
  localStorage.removeItem('test');
} catch (e) {
  console.error('✗ Проблема с localStorage:', e);
}

// Проверим текущий язык
const currentLang = localStorage.getItem('language');
console.log('Текущий язык в localStorage:', currentLang);

// Принудительно установим английский
localStorage.setItem('language', 'en');
console.log('Установлен английский язык');

// Проверим again
console.log('Новый язык:', localStorage.getItem('language'));
