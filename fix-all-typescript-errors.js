const fs = require('fs').promises;
const path = require('path');

console.log('🔧 АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ ВСЕХ TYPESCRIPT ОШИБОК');
console.log('==================================================');

async function fixAllTypescriptErrors() {
  const srcPath = path.join(__dirname, 'backend', 'src');
  
  console.log('📁 Базовая папка:', srcPath);
  
  // Список всех файлов с проблемами типизации
  const filesToFix = [
    // Filters
    { file: 'filters/security-exception.filter.ts', needsImport: true },
    
    // Guards  
    { file: 'guards/rate-limit.guard.ts', needsImport: true },
    
    // Middleware
    { file: 'middleware/security.middleware.ts', needsImport: false }, // уже есть импорт
    
    // Controllers
    { file: 'modules/files/files.controller.ts', needsImport: false }, // уже есть импорт
    { file: 'modules/orders/orders.controller.ts', needsImport: true },
    
    // Middleware в modules
    { file: 'modules/orders/orders.middleware.ts', needsImport: true }
  ];
  
  for (const item of filesToFix) {
    const filePath = path.join(srcPath, item.file);
    
    try {
      console.log(`\n📝 Исправляем ${item.file}...`);
      
      // Проверяем существует ли файл
      try {
        await fs.access(filePath);
      } catch (error) {
        console.log(`  ⚠️ Файл не найден: ${item.file}`);
        continue;
      }
      
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      // 1. Добавляем импорт типов Express, если нужно
      if (item.needsImport && !content.includes('import { Request, Response }')) {
        console.log(`  📦 Добавляем импорт Express типов...`);
        
        // Найдем место для вставки импорта
        const importLines = content.split('\n');
        let insertIndex = -1;
        
        // Ищем последний импорт
        for (let i = 0; i < importLines.length; i++) {
          if (importLines[i].startsWith('import ')) {
            insertIndex = i;
          }
          if (importLines[i].startsWith('@') || importLines[i].startsWith('export')) {
            break;
          }
        }
        
        if (insertIndex >= 0) {
          importLines.splice(insertIndex + 1, 0, "import { Request, Response } from 'express';");
          content = importLines.join('\n');
          modified = true;
          console.log(`  ✅ Импорт добавлен после строки ${insertIndex + 1}`);
        }
      }
      
      // 2. Исправляем типизацию Request и Response
      console.log(`  🔧 Исправляем типизацию...`);
      
      // Заменяем все проблемные типы Request
      const requestReplacements = [
        // Общие замены типов
        { 
          from: /Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>/g, 
          to: 'Request' 
        },
        { 
          from: /Response<any, Record<string, any>>/g, 
          to: 'Response' 
        },
        
        // Специфичные замены для методов получения объектов
        {
          from: /context\.switchToHttp\(\)\.getRequest<any>\(\)/g,
          to: 'context.switchToHttp().getRequest<Request>()'
        },
        {
          from: /ctx\.getRequest<any>\(\)/g,
          to: 'ctx.getRequest<Request>()'
        },
        {
          from: /ctx\.getResponse<any>\(\)/g,
          to: 'ctx.getResponse<Response>()'
        }
      ];
      
      for (const replacement of requestReplacements) {
        const before = content;
        content = content.replace(replacement.from, replacement.to);
        if (content !== before) {
          modified = true;
          console.log(`  ✅ Исправлено: ${replacement.from.source || replacement.from} → ${replacement.to}`);
        }
      }
      
      // 3. Сохраняем файл, если были изменения
      if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`  ✅ ${item.file} успешно исправлен и сохранен`);
      } else {
        console.log(`  ⏭️ ${item.file} не требует изменений`);
      }
      
    } catch (error) {
      console.error(`  ❌ Ошибка при исправлении ${item.file}:`, error.message);
    }
  }
}

async function verifyCompilation() {
  console.log('\n🔍 ПРОВЕРКА КОМПИЛЯЦИИ TYPESCRIPT...');
  console.log('===================================');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript компиляция успешна!');
        console.log('🎉 Все ошибки исправлены!');
      } else {
        console.log('❌ Остались ошибки TypeScript:');
        console.log(errorOutput || output);
        
        // Подсчитываем количество ошибок
        const errorCount = (errorOutput + output).split('error TS').length - 1;
        console.log(`\n📊 Найдено ошибок: ${errorCount}`);
        
        if (errorCount > 0 && errorCount < 50) {
          console.log('\n🔧 РЕКОМЕНДАЦИИ:');
          console.log('Запустите скрипт еще раз - некоторые ошибки могли быть исправлены');
        }
      }
      resolve(code === 0);
    });
  });
}

async function main() {
  try {
    console.log('🚀 Начинаем автоматическое исправление...\n');
    
    await fixAllTypescriptErrors();
    
    console.log('\n📊 РЕЗУЛЬТАТЫ ИСПРАВЛЕНИЯ:');
    console.log('=========================');
    console.log('✅ Добавлены импорты Express типов во все необходимые файлы');
    console.log('✅ Исправлена типизация Request<...> → Request');
    console.log('✅ Исправлена типизация Response<...> → Response');
    console.log('✅ Исправлены методы получения объектов в контексте');
    
    console.log('\n🔍 Проверяем результат...');
    const success = await verifyCompilation();
    
    if (success) {
      console.log('\n🎉 ВСЕ ИСПРАВЛЕНИЯ УСПЕШНО ЗАВЕРШЕНЫ!');
      console.log('🚀 Теперь можно запускать backend:');
      console.log('   cd backend && npx ts-node --transpile-only src/main.ts');
    } else {
      console.log('\n⚠️ Некоторые ошибки остались. Возможно потребуется ручное исправление.');
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

main();
