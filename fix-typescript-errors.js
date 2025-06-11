#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Исправляем calendar.service.ts - убираем неправильный экспорт
const calendarServicePath = path.join(__dirname, 'backend/src/modules/calendar/calendar.service.ts');

if (fs.existsSync(calendarServicePath)) {
  let content = fs.readFileSync(calendarServicePath, 'utf8');
  
  // Экспортируем CalendarService как CalendarServiceFixed
  content = content.replace('export class CalendarService {', 'export class CalendarServiceFixed {');
  
  fs.writeFileSync(calendarServicePath, content);
  console.log('✅ Исправлен calendar.service.ts');
}

// Исправляем calendar.module.ts
const calendarModulePath = path.join(__dirname, 'backend/src/modules/calendar/calendar.module.ts');

if (fs.existsSync(calendarModulePath)) {
  let content = fs.readFileSync(calendarModulePath, 'utf8');
  
  // Заменяем импорт и провайдеры
  content = content.replace(/import { CalendarService }/g, 'import { CalendarServiceFixed }');
  content = content.replace(/CalendarService,/g, 'CalendarServiceFixed,');
  content = content.replace(/CalendarService\]/g, 'CalendarServiceFixed]');
  
  fs.writeFileSync(calendarModulePath, content);
  console.log('✅ Исправлен calendar.module.ts');
}

console.log('🎉 Все исправления применены!');
