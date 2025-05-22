// Скрипт для очистки локального хранилища и перезагрузки
console.log('🧹 Очищаем локальное хранилище...');

// Очищаем localStorage
localStorage.clear();

// Очищаем sessionStorage  
sessionStorage.clear();

// Очищаем indexedDB (если используется)
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    });
  });
}

console.log('✅ Локальное хранилище очищено!');
console.log('🔄 Перезагружаем страницу...');

// Перезагружаем страницу
window.location.reload();
