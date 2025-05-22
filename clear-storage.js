// Скрипт для очистки localStorage
// Запустите его в консоли браузера на http://localhost:5173

console.log('Очищаем localStorage...');
localStorage.removeItem('operators');
localStorage.removeItem('orders');
localStorage.removeItem('shifts');
localStorage.removeItem('setups');
localStorage.removeItem('pdfPreview');
console.log('localStorage очищен. Перезагрузите страницу (F5)');
