const fs = require('fs');
const path = require('path');

// Функция для рекурсивного поиска файлов
function findFiles(dir, extension, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && item !== 'node_modules' && item !== 'dist') {
      findFiles(fullPath, extension, files);
    } else if (stat.isFile() && item.endsWith(extension)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Функция для исправления импортов
function fixFileImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Заменяем импорты Express типов
  const oldImports = [
    /import\s*{\s*([^}]*)\s*}\s*from\s*['"]express['"];/g,
    /import\s*\*\s*as\s*express\s*from\s*['"]express['"];/g
  ];
  
  const replacements = [
    "import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';",
    "import * as express from 'express';\nimport { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';"
  ];
  
  // Исправляем импорты
  content = content.replace(/import\s*{\s*([^}]*Request[^}]*)\s*}\s*from\s*['"]express['"];/g, (match, imports) => {
    if (imports.includes('Request') && imports.includes('Response')) {
      modified = true;
      return "import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';";
    } else if (imports.includes('Request')) {
      modified = true;
      return imports.replace('Request', 'Request as ExpressRequest').replace(/import\s*{/, "import {") + " from 'express';";
    } else if (imports.includes('Response')) {
      modified = true;
      return imports.replace('Response', 'Response as ExpressResponse').replace(/import\s*{/, "import {") + " from 'express';";
    }
    return match;
  });
  
  // Заменяем использование типов
  content = content.replace(/:\s*Request/g, ': ExpressRequest');
  content = content.replace(/:\s*Response/g, ': ExpressResponse');
  content = content.replace(/<Request>/g, '<ExpressRequest>');
  content = content.replace(/<Response>/g, '<ExpressResponse>');
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Основная функция
function main() {
  console.log('🔧 Исправление TypeScript типов Express...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const tsFiles = findFiles(srcDir, '.ts');
  
  let fixedCount = 0;
  
  for (const file of tsFiles) {
    if (fixFileImports(file)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Исправлено файлов: ${fixedCount}/${tsFiles.length}`);
  console.log('🎉 Готово!');
}

main();
