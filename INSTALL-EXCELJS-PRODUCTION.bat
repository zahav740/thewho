@echo off
echo ============================================
echo 🔧 УСТАНОВКА EXCELJS ДЛЯ ПРОДАКШЕН ВЕРСИИ
echo ============================================

echo.
echo 📦 Переходим в директорию frontend...
cd frontend

echo.
echo 🔽 Устанавливаем ExcelJS...
npm install exceljs

echo.
echo 🔽 Устанавливаем типы для ExcelJS...
npm install --save-dev @types/exceljs

echo.
echo ✅ ГОТОВО! ExcelJS установлен для чтения реальных Excel файлов
echo.
echo 🚀 Теперь система будет читать оригинальные Excel файлы вместо тестовых данных!
echo.
pause
