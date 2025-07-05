const { Client } = require('pg');

async function testDatabaseConnection() {
  console.log('🔍 Тестируем подключение к базе данных...');
  
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'magarel',
    database: 'thewho'
  });

  try {
    await client.connect();
    console.log('✅ Подключение к PostgreSQL успешно!');
    
    const result = await client.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    console.log('📊 Найдено таблиц в БД:', result.rows[0].table_count);
    
    // Проверяем наличие наших таблиц
    const tables = ['excel_imports', 'excel_data', 'import_filters', 'orders'];
    for (const table of tables) {
      const tableExists = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
        [table]
      );
      console.log(`📋 Таблица ${table}:`, tableExists.rows[0].exists ? '✅ существует' : '❌ отсутствует');
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к БД:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 ПРОВЕРКА ГОТОВНОСТИ BACKEND К ЗАПУСКУ\n');
  
  const dbOk = await testDatabaseConnection();
  
  if (dbOk) {
    console.log('\n🎉 База данных готова!');
    console.log('💡 Теперь можно запускать backend: npm run start:dev');
  } else {
    console.log('\n❌ Проблемы с базой данных');
    console.log('💡 Проверьте настройки PostgreSQL');
  }
}

main().catch(console.error);
