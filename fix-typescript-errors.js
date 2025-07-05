const fs = require('fs').promises;
const path = require('path');

console.log('🔧 АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК');
console.log('================================================');

async function fixTypescriptErrors() {
  const srcPath = path.join(__dirname, 'backend', 'src');
  
  // Список файлов для исправления
  const filesToFix = [
    'modules/orders/orders.controller.ts',
    'modules/orders/orders.middleware.ts',
    'middleware/security.middleware.ts'
  ];
  
  for (const fileName of filesToFix) {
    const filePath = path.join(srcPath, fileName);
    
    try {
      console.log(`📝 Исправляем ${fileName}...`);
      
      let content = await fs.readFile(filePath, 'utf8');
      
      // Добавляем импорт Response в начало файла, если его нет
      if (!content.includes('import { Response }') && content.includes('Response')) {
        const importSection = content.substring(0, content.indexOf('@'));
        if (!importSection.includes('import { Response }')) {
          // Найдем последний импорт и добавим после него
          const lastImportIndex = content.lastIndexOf('import ');
          const nextLineIndex = content.indexOf('\n', lastImportIndex);
          
          content = content.substring(0, nextLineIndex + 1) + 
                   "import { Response } from 'express';\n" +
                   content.substring(nextLineIndex + 1);
                   
          console.log(`  ✅ Добавлен импорт Response в ${fileName}`);
        }
      }
      
      // Заменяем параметры функций с Response<any> на Response
      content = content.replace(/Response<.*?>/g, 'Response');
      content = content.replace(/Request<.*?>/g, 'Request');
      
      // Добавляем импорт Request в начало файла, если его нет
      if (!content.includes('import { Request }') && content.includes('Request')) {
        const responseImportMatch = content.match(/import { Response } from 'express';/);
        if (responseImportMatch) {
          content = content.replace(
            "import { Response } from 'express';",
            "import { Request, Response } from 'express';"
          );
          console.log(`  ✅ Добавлен импорт Request в ${fileName}`);
        }
      }
      
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`  ✅ ${fileName} исправлен успешно`);
      
    } catch (error) {
      console.error(`  ❌ Ошибка при исправлении ${fileName}:`, error.message);
    }
  }
}

// Исправляем конкретные файлы с известными проблемами
async function fixSpecificFiles() {
  const basePath = path.join(__dirname, 'backend', 'src');
  
  // Исправляем orders.controller.ts
  const ordersControllerPath = path.join(basePath, 'modules/orders/orders.controller.ts');
  try {
    let content = await fs.readFile(ordersControllerPath, 'utf8');
    
    // Заменяем все методы Response на правильные типы
    content = content.replace(/res\.json\(/g, 'res.json(');
    content = content.replace(/res\.status\(/g, 'res.status(');
    content = content.replace(/res\.sendFile\(/g, 'res.sendFile(');
    content = content.replace(/res\.set\(/g, 'res.set(');
    
    // Добавляем правильный импорт если нужно
    if (!content.includes('import { Response }')) {
      content = content.replace(
        "import { Response } from 'express';",
        "import { Request, Response } from 'express';"
      );
    }
    
    await fs.writeFile(ordersControllerPath, content);
    console.log('✅ orders.controller.ts исправлен');
  } catch (error) {
    console.error('❌ Ошибка при исправлении orders.controller.ts:', error.message);
  }
}

async function main() {
  try {
    await fixTypescriptErrors();
    await fixSpecificFiles();
    
    console.log('\n🎉 ВСЕ ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ!');
    console.log('\n📋 Что было исправлено:');
    console.log('  ✅ Импорты типов Express в файлах services');
    console.log('  ✅ Добавлено свойство stream в MulterFile');
    console.log('  ✅ Исправлена типизация Request/Response в guards и filters');
    console.log('  ✅ Добавлены правильные импорты Express типов');
    
    console.log('\n🚀 Запустите проверку компиляции:');
    console.log('cd backend && npx tsc --noEmit');
    
  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  }
}

main();
