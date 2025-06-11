#!/usr/bin/env node

console.log('🚀 ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК');
console.log('='.repeat(50));

const fs = require('fs');
const path = require('path');

// Путь к backend
const backendPath = path.join(__dirname, 'backend');

console.log('\n1. Проверяем исправления в calendar.controller.ts...');
const calendarControllerPath = path.join(backendPath, 'src/modules/calendar/calendar.controller.ts');
if (fs.existsSync(calendarControllerPath)) {
    const content = fs.readFileSync(calendarControllerPath, 'utf8');
    
    if (content.includes('interface CalendarDay')) {
        console.log('   ✅ Интерфейс CalendarDay добавлен');
    } else {
        console.log('   ❌ Интерфейс CalendarDay не найден');
    }
    
    if (content.includes('const day: CalendarDay')) {
        console.log('   ✅ Типизация day исправлена');
    } else {
        console.log('   ❌ Типизация day не исправлена');
    }
}

console.log('\n2. Проверяем исправления в calendar.module.ts...');
const calendarModulePath = path.join(backendPath, 'src/modules/calendar/calendar.module.ts');
if (fs.existsSync(calendarModulePath)) {
    const content = fs.readFileSync(calendarModulePath, 'utf8');
    
    if (content.includes('CalendarServiceFixed')) {
        console.log('   ✅ CalendarServiceFixed используется');
    } else {
        console.log('   ❌ CalendarService все еще используется');
    }
}

console.log('\n3. Проверяем исправления в calendar.service.ts...');
const calendarServicePath = path.join(backendPath, 'src/modules/calendar/calendar.service.ts');
if (fs.existsSync(calendarServicePath)) {
    const content = fs.readFileSync(calendarServicePath, 'utf8');
    
    if (content.includes('export class CalendarServiceFixed')) {
        console.log('   ✅ Класс переименован в CalendarServiceFixed');
    } else {
        console.log('   ❌ Класс не переименован');
    }
    
    if (content.includes('assignedMachine: machine.id')) {
        console.log('   ✅ Используется assignedMachine вместо machineId');
    } else {
        console.log('   ⚠️  Проверьте использование assignedMachine в запросах');
    }
}

console.log('\n4. Проверяем исправления в operation-analytics.controller.ts...');
const analyticsControllerPath = path.join(backendPath, 'src/modules/operation-analytics/operation-analytics.controller.ts');
if (fs.existsSync(analyticsControllerPath)) {
    const content = fs.readFileSync(analyticsControllerPath, 'utf8');
    
    if (content.includes('assignedMachine: machineId')) {
        console.log('   ✅ Используется assignedMachine для поиска операций');
    } else {
        console.log('   ❌ Используется неправильное поле для поиска операций');
    }
}

console.log('\n' + '='.repeat(50));
console.log('🎉 ПРОВЕРКА ЗАВЕРШЕНА');
console.log('\nТеперь можно запустить компиляцию:');
console.log('cd backend && npx tsc --noEmit');
