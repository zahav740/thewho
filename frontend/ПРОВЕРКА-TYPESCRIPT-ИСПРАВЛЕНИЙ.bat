@echo off
echo ===============================================
echo ПРОВЕРКА ИСПРАВЛЕНИЯ ОШИБОК TYPESCRIPT
echo ===============================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo Проверяем TypeScript ошибки в проблемных файлах...
echo.

echo 1. Проверяем DataDiagnostics.tsx:
npx tsc --noEmit --skipLibCheck src/pages/Shifts/components/DataDiagnostics.tsx
echo.

echo 2. Проверяем SimpleProductionView.tsx:
npx tsc --noEmit --skipLibCheck src/pages/Shifts/components/SimpleProductionView.tsx
echo.

echo 3. Полная проверка всех TypeScript файлов:
npx tsc --noEmit --skipLibCheck
echo.

echo ===============================================
echo ПРОВЕРКА ЗАВЕРШЕНА
echo ===============================================

pause
