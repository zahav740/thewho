const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Загружаем переменные из .env.production
dotenv.config({ path: path.join(__dirname, '.env.production') });

console.log('🔍 Тестирование подключения к Supabase PostgreSQL...');
console.log('');

async function testConnectionVariant1() {
  console.log('🧪 ВАРИАНТ 1: Подключение через DATABASE_URL');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('📡 Подключение через URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':***@'));
    await client.connect();
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ УСПЕХ! Время сервера:', result.rows[0].current_time);
    console.log('🗄️ Версия PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка варианта 1:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function testConnectionVariant2() {
  console.log('🧪 ВАРИАНТ 2: Подключение через отдельные параметры');
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 60000,
    query_timeout: 60000,
    statement_timeout: 60000,
  });

  try {
    console.log('📡 Подключение к:', `${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log('🗄️ База данных:', process.env.DB_NAME);
    console.log('👤 Пользователь:', process.env.DB_USERNAME);
    
    await client.connect();
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ УСПЕХ! Время сервера:', result.rows[0].current_time);
    console.log('🗄️ Версия PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка варианта 2:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function testConnectionVariant3() {
  console.log('🧪 ВАРИАНТ 3: Session mode (порт 5432)');
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: 5432, // Session mode
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 60000,
  });

  try {
    console.log('📡 Подключение к:', `${process.env.DB_HOST}:5432 (session mode)`);
    
    await client.connect();
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ УСПЕХ! Время сервера:', result.rows[0].current_time);
    console.log('🗄️ Версия PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка варианта 3:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

async function testAllConnections() {
  console.log('🔧 Информация о подключении:');
  console.log('HOST:', process.env.DB_HOST);
  console.log('PORT:', process.env.DB_PORT);
  console.log('DATABASE:', process.env.DB_NAME);
  console.log('USERNAME:', process.env.DB_USERNAME);
  console.log('');
  
  const variant1Success = await testConnectionVariant1();
  console.log('');
  
  if (!variant1Success) {
    const variant2Success = await testConnectionVariant2();
    console.log('');
    
    if (!variant2Success) {
      const variant3Success = await testConnectionVariant3();
      console.log('');
      
      if (!variant3Success) {
        console.log('💡 Возможные решения:');
        console.log('1. Проверьте интернет соединение');
        console.log('2. Убедитесь что Supabase проект активен');
        console.log('3. Проверьте правильность учетных данных');
        console.log('4. Убедитесь что IP адрес разрешен в Supabase');
        console.log('5. Попробуйте сбросить пароль базы данных в Supabase');
      }
    }
  }
  
  console.log('');
  console.log('🔌 Тестирование завершено');
}

testAllConnections();
