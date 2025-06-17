#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Проверяем компиляцию TypeScript...');

// Переходим в директорию frontend
process.chdir(path.join(__dirname));

// Проверяем TypeScript
exec('npx tsc --noEmit', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Ошибки TypeScript:');
    console.error(stderr);
    process.exit(1);
  }
  
  if (stdout) {
    console.log('📋 Результат проверки TypeScript:');
    console.log(stdout);
  }
  
  console.log('✅ Проверка TypeScript завершена успешно!');
  
  // Теперь проверяем сборку
  console.log('🔨 Проверяем сборку React...');
  
  exec('npm run build', (buildError, buildStdout, buildStderr) => {
    if (buildError) {
      console.error('❌ Ошибки сборки:');
      console.error(buildStderr);
      process.exit(1);
    }
    
    console.log('✅ Сборка завершена успешно!');
    console.log('📦 Результат сборки:', buildStdout);
  });
});
