const fs = require('fs');
const path = require('path');

// Исправляем orders.controller.ts
function fixOrdersController() {
  const filePath = path.join(__dirname, 'src/modules/orders/orders.controller.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('🔧 Исправляем orders.controller.ts...');
  
  // Удаляем неправильный метод convertToExcelFile
  content = content.replace(
    /\/\/ Вспомогательная функция для преобразования MulterFile в ExcelFile[\s\S]*?} as ExcelFile;\s*}/,
    ''
  );
  
  // Исправляем analyzeExcelStructure
  content = content.replace(
    'return await this.excelColumnMapperService.analyzeExcelStructure(file);',
    'return await this.excelColumnMapperService.analyzeExcelStructure(createExcelFile(file));'
  );
  
  // Исправляем importWithMapping
  content = content.replace(
    'const parsedOrders = await this.excelColumnMapperService.importWithMapping(file, settings);',
    'const parsedOrders = await this.excelColumnMapperService.importWithMapping(createExcelFile(file), settings);'
  );
  
  // Исправляем res.status() вызовы - добавляем return где нужно
  content = content.replace(/(\s+)res\.status\((\d+)\)\.send\(/g, '$1return res.status($2).send(');
  content = content.replace(/(\s+)res\.status\((\d+)\)\.json\(/g, '$1return res.status($2).json(');
  
  // Исправляем вызовы без return
  content = content.replace(
    'res.sendFile(filePath);',
    'return res.sendFile(filePath);'
  );
  
  content = content.replace(
    'res.set({',
    'res.set({'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ orders.controller.ts исправлен');
}

// Исправляем orders.middleware.ts
function fixOrdersMiddleware() {
  const filePath = path.join(__dirname, 'src/modules/orders/orders.middleware.ts');
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    console.log('🔧 Исправляем orders.middleware.ts...');
    
    // Исправляем импорты
    content = content.replace(
      /import.*from 'express';/,
      "import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';"
    );
    
    // Исправляем типы параметров
    content = content.replace(/req: Request/g, 'req: ExpressRequest');
    content = content.replace(/res: Response/g, 'res: ExpressResponse');
    
    fs.writeFileSync(filePath, content);
    console.log('✅ orders.middleware.ts исправлен');
  }
}

// Основная функция
function main() {
  console.log('🔧 АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК...\n');
  
  try {
    fixOrdersController();
    fixOrdersMiddleware();
    
    console.log('\n✅ ВСЕ ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ!');
    console.log('✅ Попробуйте скомпилировать проект снова');
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении:', error.message);
  }
}

main();
