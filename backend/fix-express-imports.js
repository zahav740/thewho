const fs = require('fs');
const path = require('path');

// Файлы, которые нужно исправить
const filesToFix = [
  'src/modules/files/files.service.ts',
  'src/modules/operations/operation-history.controller.ts',
  'src/modules/orders/enhanced-excel-import.service.ts',
  'src/modules/orders/enhanced-orders.controller.ts',
  'src/modules/orders/excel-column-mapper.service.ts',
  'src/modules/orders/excel-preview.service.ts',
  'src/modules/orders/orders.controller.ts',
  'src/modules/orders/orders.middleware.ts',
  'src/modules/orders/v2/orders-v2.controller.ts'
];

function fixExpressImports() {
  filesToFix.forEach(file => {
    const fullPath = path.join(__dirname, file);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Файл не найден: ${fullPath}`);
      return;
    }

    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Заменяем import type { Express } from 'express';
      if (content.includes("import type { Express } from 'express';")) {
        const depth = file.split('/').length - 2; // Количество уровней до src
        const relativePath = '../'.repeat(depth) + 'types/express';
        content = content.replace(
          "import type { Express } from 'express';",
          `import '${relativePath}';`
        );
        modified = true;
      }

      // Добавляем импорт типов, если его нет
      if (content.includes("from 'express'") && !content.includes("types/express")) {
        const depth = file.split('/').length - 2;
        const relativePath = '../'.repeat(depth) + 'types/express';
        
        // Находим последний импорт из express
        const expressImportRegex = /import.*from 'express';/g;
        const matches = content.match(expressImportRegex);
        if (matches) {
          const lastImport = matches[matches.length - 1];
          content = content.replace(
            lastImport,
            lastImport + `\\nimport '${relativePath}';`
          );
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Исправлен: ${file}`);
      } else {
        console.log(`ℹ️  Пропущен: ${file} (не требует изменений)`);
      }
    } catch (error) {
      console.error(`❌ Ошибка при обработке ${file}:`, error.message);
    }
  });
}

console.log('🔧 Исправление импортов Express...');
fixExpressImports();
console.log('✅ Готово!');
