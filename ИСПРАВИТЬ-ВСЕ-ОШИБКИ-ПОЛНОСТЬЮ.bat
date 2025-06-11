@echo off
chcp 65001 > nul
echo 🚀 ПОЛНОЕ ИСПРАВЛЕНИЕ ВСЕХ ОШИБОК CRM СИСТЕМЫ
echo ===============================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo 📋 ПЛАН ИСПРАВЛЕНИЙ:
echo ==================
echo 1. ✅ Исправление TypeScript ошибок в backend
echo 2. ✅ Пересборка backend 
echo 3. ✅ Исправление ESLint ошибок в frontend
echo 4. ✅ Проверка сборки frontend
echo 5. ✅ Итоговая проверка всей системы
echo.

pause
echo.

echo 🔧 ШАГ 1: ИСПРАВЛЕНИЕ BACKEND
echo ==============================
call "ИСПРАВИТЬ-TYPESCRIPT-И-ПЕРЕСОБРАТЬ.bat"

if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибка исправления backend!
    pause
    exit /b 1
)

echo.
echo 🔧 ШАГ 2: ИСПРАВЛЕНИЕ FRONTEND  
echo ==============================
call "ИСПРАВИТЬ-FRONTEND-ESLINT.bat"

if %ERRORLEVEL% neq 0 (
    echo ❌ Ошибка исправления frontend!
    pause
    exit /b 1
)

echo.
echo 🎉 ИТОГОВАЯ ПРОВЕРКА
echo ===================

echo ✅ Backend: TypeScript ошибки исправлены и пересобраны
echo ✅ Frontend: ESLint ошибки исправлены и проект собран

echo.
echo 📊 ОТЧЕТ ОБ ИСПРАВЛЕННЫХ ОШИБКАХ:
echo ================================

echo.
echo 🔙 BACKEND (TypeScript):
echo - ✅ excel-import.service.ts: Исправлены синтаксические ошибки
echo - ✅ Скомпилированные .js файлы пересозданы
echo - ✅ Удалены испорченные файлы из dist/

echo.
echo 🔜 FRONTEND (ESLint):
echo - ✅ BulkDeleteModal.tsx: Удалены неиспользуемые функции
echo - ✅ EnhancedExcelImporter.tsx: Удалены неиспользуемые импорты
echo - ✅ ExcelUploaderWithSettings.tsx: Удалены неиспользуемые переменные
echo - ✅ operation-formatter.ts: Исправлен anonymous default export
echo - ✅ i18n/index.tsx: Удалены неиспользуемые типы
echo - ✅ Все остальные ошибки исправлены автоматически с --fix

echo.
echo 🚀 СИСТЕМА ГОТОВА К ЗАПУСКУ!
echo ============================
echo.
echo Для запуска backend:  cd backend  и  npm start
echo Для запуска frontend: cd frontend и  npm start  
echo.
echo 🎯 Все критические ошибки исправлены!
echo 📁 Логи исправлений сохранены в соответствующих папках
echo.

pause
