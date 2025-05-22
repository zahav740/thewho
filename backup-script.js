// ===============================================
// АВТОМАТИЧЕСКОЕ РЕЗЕРВНОЕ КОПИРОВАНИЕ ДАННЫХ
// ===============================================
// Выполните этот скрипт в консоли браузера
// ПЕРЕД очисткой базы данных
// ===============================================

console.log('🔄 Начинаем резервное копирование данных TheWho...');

async function createBackup() {
  try {
    // Импортируем необходимые функции
    const { loadFromSupabase, supabase } = await import('./src/utils/supabaseClient.js');
    
    console.log('📊 Получаем статистику данных...');
    
    // Получаем статистику
    const stats = {};
    
    try {
      const { data: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      stats.orders = ordersCount?.length || 0;
    } catch (e) {
      stats.orders = 0;
    }
    
    try {
      const { data: operationsCount } = await supabase.from('operations').select('*', { count: 'exact', head: true });
      stats.operations = operationsCount?.length || 0;
    } catch (e) {
      stats.operations = 0;
    }
    
    try {
      const { data: planningCount } = await supabase.from('planning_results').select('*', { count: 'exact', head: true });
      stats.planning_results = planningCount?.length || 0;
    } catch (e) {
      try {
        const { data: oldPlanningCount } = await supabase.from('planning_result').select('*', { count: 'exact', head: true });
        stats.planning_result = oldPlanningCount?.length || 0;
      } catch (e2) {
        stats.planning_result = 0;
      }
    }
    
    try {
      const { data: shiftsCount } = await supabase.from('shifts').select('*', { count: 'exact', head: true });
      stats.shifts = shiftsCount?.length || 0;
    } catch (e) {
      stats.shifts = 0;
    }
    
    console.log('📈 Статистика данных:', stats);
    
    // Загружаем все данные
    console.log('⬇️ Загружаем данные из Supabase...');
    const backupData = await loadFromSupabase();
    
    // Добавляем метаданные
    const fullBackup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0',
        source: 'TheWho Production Planning',
        statistics: stats,
        description: 'Полное резервное копирование данных перед миграцией к новой схеме БД'
      },
      data: backupData
    };
    
    // Создаем имя файла с датой
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const filename = `theWho-backup-${date}-${time}.json`;
    
    // Сохраняем файл
    console.log('💾 Сохраняем резервную копию...');
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Резервная копия сохранена как: ${filename}`);
    console.log('📊 Статистика сохраненных данных:');
    console.log(`   📦 Заказов: ${backupData.data?.orders?.length || 0}`);
    console.log(`   ⚙️ Операций: ${backupData.data?.orders?.reduce((sum, order) => sum + (order.operations?.length || 0), 0) || 0}`);
    console.log(`   📅 Записей планирования: ${backupData.data?.planningResults?.length || 0}`);
    
    // Также сохраняем в localStorage как дополнительную защиту
    localStorage.setItem('theWho-backup-' + date, JSON.stringify(fullBackup));
    console.log('💿 Дополнительная копия сохранена в localStorage');
    
    return fullBackup;
    
  } catch (error) {
    console.error('❌ Ошибка при создании резервной копии:', error);
    
    // Попытка создать упрощенную копию
    console.log('🔄 Попытка создания упрощенной копии...');
    try {
      const simpleBackup = {
        orders: JSON.parse(localStorage.getItem('orders') || '[]'),
        planningResults: JSON.parse(localStorage.getItem('planningResults') || '[]'),
        timestamp: new Date().toISOString(),
        source: 'localStorage'
      };
      
      const blob = new Blob([JSON.stringify(simpleBackup, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `theWho-localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      console.log('✅ Упрощенная копия из localStorage сохранена');
      
    } catch (localError) {
      console.error('❌ Не удалось создать даже упрощенную копию:', localError);
    }
    
    throw error;
  }
}

// Функция для восстановления данных
async function restoreFromBackup(backupData) {
  try {
    console.log('🔄 Начинаем восстановление данных...');
    
    const { syncWithSupabase } = await import('./src/utils/supabaseClient.js');
    
    // Определяем формат данных
    let orders, planningResults;
    
    if (backupData.data) {
      // Новый формат с метаданными
      orders = backupData.data.orders || [];
      planningResults = backupData.data.planningResults || [];
    } else {
      // Старый формат
      orders = backupData.orders || [];
      planningResults = backupData.planningResults || [];
    }
    
    console.log(`📊 Восстанавливаем ${orders.length} заказов и ${planningResults.length} записей планирования...`);
    
    const result = await syncWithSupabase(orders, planningResults);
    
    if (result.success) {
      console.log('✅ Восстановление завершено успешно!');
      console.log(`📦 Восстановлено заказов: ${result.ordersCount}`);
      console.log(`⚙️ Восстановлено операций: ${result.operationsCount}`);
      console.log(`📅 Восстановлено записей планирования: ${result.planningCount}`);
    } else {
      console.error('❌ Ошибка восстановления:', result.error);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Критическая ошибка восстановления:', error);
    throw error;
  }
}

// Функция для загрузки файла резервной копии
function loadBackupFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      console.log(`📂 Загружаем файл: ${file.name}`);
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      console.log('📊 Данные из файла:', {
        timestamp: backupData.metadata?.timestamp || backupData.timestamp,
        orders: backupData.data?.orders?.length || backupData.orders?.length,
        planning: backupData.data?.planningResults?.length || backupData.planningResults?.length
      });
      
      const confirmed = confirm(
        `Восстановить данные из файла ${file.name}?\n\n` +
        `Заказов: ${backupData.data?.orders?.length || backupData.orders?.length || 0}\n` +
        `Записей планирования: ${backupData.data?.planningResults?.length || backupData.planningResults?.length || 0}\n\n` +
        `ВНИМАНИЕ: Это перезапишет текущие данные!`
      );
      
      if (confirmed) {
        await restoreFromBackup(backupData);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки файла:', error);
      alert('Ошибка загрузки файла: ' + error.message);
    }
  };
  input.click();
}

// Основные команды для выполнения
console.log(`
🔧 ДОСТУПНЫЕ КОМАНДЫ:

1. createBackup() - Создать резервную копию
2. loadBackupFile() - Загрузить файл резервной копии  
3. restoreFromBackup(data) - Восстановить из данных

📝 ПРИМЕР ИСПОЛЬЗОВАНИЯ:

// Создание резервной копии
await createBackup();

// Восстановление из файла
loadBackupFile();

// Восстановление из данных в переменной
const backup = {...}; // ваши данные
await restoreFromBackup(backup);
`);

// Автоматически предлагаем создать резервную копию
if (confirm('Создать резервную копию данных сейчас?')) {
  createBackup().catch(console.error);
}

// Экспортируем функции в глобальную область
window.createBackup = createBackup;
window.restoreFromBackup = restoreFromBackup;
window.loadBackupFile = loadBackupFile;
