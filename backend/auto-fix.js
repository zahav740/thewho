#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Автоматическое исправление типов TypeScript...\n');

const backendPath = 'C:\\Users\\apule\\Downloads\\TheWho\\production-crm\\backend';

function runCommand(command) {
  try {
    console.log(`📋 Выполнение: ${command}`);
    const result = execSync(command, { 
      cwd: backendPath, 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return true;
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('1️⃣ Установка типов для Express...');
  if (!runCommand('npm install --save-dev @types/express @types/multer')) {
    console.log('⚠️ Не удалось установить типы, продолжаем...');
  }

  console.log('\n2️⃣ Проверка компиляции...');
  if (runCommand('npx nest build')) {
    console.log('\n✅ Компиляция успешна!');
    console.log('\n🚀 Можно запускать backend командой: npm run start:prod');
  } else {
    console.log('\n❌ Все еще есть ошибки компиляции');
    console.log('\n🔍 Попробуем более детальную проверку...');
    runCommand('npx tsc --noEmit');
  }
}

main().catch(console.error);