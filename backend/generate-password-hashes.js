// Скрипт для генерации хэшированных паролей
const bcrypt = require('bcryptjs');

async function generatePasswordHashes() {
    console.log('🔐 Генерация хэшированных паролей...\n');
    
    const passwords = [
        { username: 'kasuf', password: 'password123', role: 'admin' },
        { username: 'admin', password: 'admin123', role: 'admin' },
        { username: 'user', password: 'user123', role: 'user' },
        { username: 'demo', password: 'demo123', role: 'user' }
    ];
    
    for (const user of passwords) {
        const hash = await bcrypt.hash(user.password, 10);
        console.log(`-- ${user.username} (${user.role})`);
        console.log(`INSERT INTO users (username, password, role) VALUES ('${user.username}', '${hash}', '${user.role}') ON CONFLICT (username) DO NOTHING;`);
        console.log('');
    }
    
    console.log('\n✅ Скопируйте SQL команды выше и выполните их в базе данных');
}

generatePasswordHashes().catch(console.error);
