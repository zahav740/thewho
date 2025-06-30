// Тестирование auth endpoints локально
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5200/api';

async function testAuthEndpoints() {
    console.log('🧪 Тестирование Auth Endpoints...\n');
    
    try {
        // 1. Тест auth/test endpoint (если добавим)
        console.log('1. Тестируем базовую доступность API...');
        try {
            const healthResponse = await fetch(`${API_BASE}/health`);
            console.log(`   Health: ${healthResponse.status}`);
        } catch (error) {
            console.log(`   Health: недоступен (${error.message})`);
        }
        
        // 2. Тест login endpoint
        console.log('\n2. Тестируем login endpoint...');
        const loginData = {
            username: 'kasuf',
            password: 'password123'
        };
        
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        console.log(`   Status: ${loginResponse.status}`);
        
        if (loginResponse.ok) {
            const loginResult = await loginResponse.json();
            console.log('   ✅ Login успешен!');
            console.log(`   Token: ${loginResult.access_token?.substring(0, 20)}...`);
            console.log(`   User: ${loginResult.user?.username} (${loginResult.user?.role})`);
            
            // 3. Тест profile endpoint с токеном
            console.log('\n3. Тестируем profile endpoint...');
            const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${loginResult.access_token}`
                }
            });
            
            console.log(`   Status: ${profileResponse.status}`);
            if (profileResponse.ok) {
                const profile = await profileResponse.json();
                console.log('   ✅ Profile получен!');
                console.log(`   User: ${profile.username}`);
            } else {
                console.log('   ❌ Profile недоступен');
            }
            
        } else {
            const error = await loginResponse.text();
            console.log('   ❌ Login неуспешен');
            console.log(`   Error: ${error}`);
        }
        
        // 4. Тест с неправильными данными
        console.log('\n4. Тестируем неправильные данные...');
        const badLoginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'wrong',
                password: 'wrong'
            })
        });
        
        console.log(`   Status: ${badLoginResponse.status}`);
        if (badLoginResponse.status === 401) {
            console.log('   ✅ Правильно отклонен неверный логин');
        }
        
        // 5. Тест всех endpoints
        console.log('\n5. Тестируем все auth endpoints...');
        const endpoints = [
            'GET /auth/profile',
            'POST /auth/login', 
            'POST /auth/register',
            'GET /auth/search-usernames'
        ];
        
        for (const endpoint of endpoints) {
            const [method, path] = endpoint.split(' ');
            try {
                const response = await fetch(`${API_BASE}${path}`, { 
                    method: method === 'GET' ? 'GET' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: method !== 'GET' ? JSON.stringify({}) : undefined
                });
                console.log(`   ${endpoint}: ${response.status}`);
            } catch (error) {
                console.log(`   ${endpoint}: ERROR (${error.message})`);
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

// Также тестируем translations endpoint
async function testOtherEndpoints() {
    console.log('\n📚 Тестируем другие endpoints...');
    
    try {
        const translationsResponse = await fetch(`${API_BASE}/translations/client`);
        console.log(`Translations: ${translationsResponse.status}`);
        
        if (translationsResponse.ok) {
            const data = await translationsResponse.json();
            console.log('✅ Translations работает');
        }
    } catch (error) {
        console.log(`Translations: ERROR (${error.message})`);
    }
}

// Запускаем тесты
console.log('🚀 Начинаем тестирование...');
console.log('⚠️ Убедитесь что backend запущен: npm run start:dev\n');

testAuthEndpoints()
    .then(() => testOtherEndpoints())
    .then(() => {
        console.log('\n🎉 Тестирование завершено!');
        console.log('\nЕсли auth endpoints возвращают 404:');
        console.log('1. Проверьте что таблица users создана в БД');
        console.log('2. Проверьте что AuthModule импортирован в app.module.ts');
        console.log('3. Перезапустите backend после изменений');
    })
    .catch(console.error);
