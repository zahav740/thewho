const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные из .env.production
dotenv.config({ path: path.join(__dirname, '.env.production') });

console.log('🔍 Тестирование подключения к PostgreSQL...');
console.log('');

async function testLocalConnection() {
  console.log('🧪 ТЕСТ: Подключение к локальной PostgreSQL');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'magarel',
    database: process.env.DB_NAME || 'thewho',
    // Для локальной БД SSL не нужен
    ssl: false,
    connectionTimeoutMillis: 30000,
  });

  try {
    console.log('📡 Подключение к:', `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    console.log('🗄️ База данных:', process.env.DB_NAME || 'thewho');
    console.log('👤 Пользователь:', process.env.DB_USERNAME || 'postgres');
    console.log('');
    
    await client.connect();
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ УСПЕХ! Подключение к локальной PostgreSQL установлено!');
    console.log('⏰ Время сервера:', result.rows[0].current_time);
    console.log('🗄️ Версия PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Проверяем есть ли база данных thewho
    try {
      const dbCheck = await client.query('SELECT current_database()');
      console.log('📊 Текущая база данных:', dbCheck.rows[0].current_database);
      
      // Проверяем доступные таблицы
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      
      console.log('');
      console.log('📋 Доступные таблицы:');
      if (tablesResult.rows.length > 0) {
        tablesResult.rows.forEach(row => {
          console.log(`  - ${row.table_name}`);
        });
      } else {
        console.log('  📝 Нет таблиц в схеме public (это нормально для новой БД)');
      }
      
    } catch (tableError) {
      console.log('⚠️ Не удалось получить список таблиц:', tableError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к локальной PostgreSQL:');
    console.error('   ', error.message);
    console.log('');
    console.log('🔧 Возможные решения:');
    console.log('1. Убедитесь что PostgreSQL запущен локально');
    console.log('2. Проверьте что служба PostgreSQL работает');
    console.log('3. Убедитесь что существует база данных "thewho"');
    console.log('4. Проверьте пароль пользователя postgres: "magarel"');
    console.log('5. Попробуйте создать базу данных через pgAdmin:');
    console.log('   CREATE DATABASE thewho;');
    
    return false;
  } finally {
    await client.end();
  }
}

async function testConnection() {
  console.log('🔧 Информация о подключении:');
  console.log('HOST:', process.env.DB_HOST || 'localhost');
  console.log('PORT:', process.env.DB_PORT || 5432);
  console.log('DATABASE:', process.env.DB_NAME || 'thewho');
  console.log('USERNAME:', process.env.DB_USERNAME || 'postgres');
  console.log('');
  
  const success = await testLocalConnection();
  
  console.log('');
  if (success) {
    console.log('🎉 Подключение успешно! Можно запускать backend сервер.');
    console.log('💡 Запустите: START-PRODUCTION-BACKEND.bat');
  } else {
    console.log('❌ Подключение не удалось. Проверьте PostgreSQL.');
    console.log('💡 Убедитесь что PostgreSQL запущен и доступен.');
  }
  
  console.log('');
  console.log('🔌 Тестирование завершено');
}

testConnection();
