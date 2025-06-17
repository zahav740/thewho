@echo off
echo ====================================
echo CLEANUP FRONTEND DELETED FILES
echo ====================================
echo.

echo Cleaning frontend root directory...

REM Delete .deleted files in frontend root
if exist "check-fixes.bat.deleted" del /f /q "check-fixes.bat.deleted"
if exist "check-typescript.bat.deleted" del /f /q "check-typescript.bat.deleted"
if exist "clean-and-check.bat.deleted" del /f /q "clean-and-check.bat.deleted"
if exist "fix-typescript-errors.js.deleted" del /f /q "fix-typescript-errors.js.deleted"
if exist "fix-typescript-issues.sh.deleted" del /f /q "fix-typescript-issues.sh.deleted"
if exist "quick-check.bat.deleted" del /f /q "quick-check.bat.deleted"
if exist "test-compilation.js.deleted" del /f /q "test-compilation.js.deleted"
if exist "test-i18n.ts.backup.deleted" del /f /q "test-i18n.ts.backup.deleted"
if exist "TestImport.tsx.bak.deleted" del /f /q "TestImport.tsx.bak.deleted"
if exist "TYPESCRIPT-ИСПРАВЛЕНИЯ-ОТЧЕТ.md.deleted" del /f /q "TYPESCRIPT-ИСПРАВЛЕНИЯ-ОТЧЕТ.md.deleted"
if exist "TYPESCRIPT-ОШИБКИ-ИСПРАВЛЕНЫ.bat.deleted" del /f /q "TYPESCRIPT-ОШИБКИ-ИСПРАВЛЕНЫ.bat.deleted"
if exist "БЫСТРОЕ-ИСПРАВЛЕНИЕ-TS.ps1.deleted" del /f /q "БЫСТРОЕ-ИСПРАВЛЕНИЕ-TS.ps1.deleted"
if exist "БЫСТРОЕ-ИСПРАВЛЕНИЕ-TS.sh.deleted" del /f /q "БЫСТРОЕ-ИСПРАВЛЕНИЕ-TS.sh.deleted"
if exist "ИСПРАВИТЬ-TYPESCRIPT.bat.deleted" del /f /q "ИСПРАВИТЬ-TYPESCRIPT.bat.deleted"
if exist "ИСПРАВЛЕНИЕ-АВТОВОЗВРАТА-ОПЕРАЦИЙ.md.deleted" del /f /q "ИСПРАВЛЕНИЕ-АВТОВОЗВРАТА-ОПЕРАЦИЙ.md.deleted"
if exist "ИСПРАВЛЕНИЕ-ОБЪЕМОВ-ПРОИЗВОДСТВА.bat.deleted" del /f /q "ИСПРАВЛЕНИЕ-ОБЪЕМОВ-ПРОИЗВОДСТВА.bat.deleted"
if exist "ИСПРАВЛЕНИЕ-ОШИБОК-TYPESCRIPT.md.deleted" del /f /q "ИСПРАВЛЕНИЕ-ОШИБОК-TYPESCRIPT.md.deleted"
if exist "ИСПРАВЛЕНИЕ-ПРЕЖДЕВРЕМЕННОГО-ЗАВЕРШЕНИЯ.md.deleted" del /f /q "ИСПРАВЛЕНИЕ-ПРЕЖДЕВРЕМЕННОГО-ЗАВЕРШЕНИЯ.md.deleted"
if exist "ИСПРАВЛЕНИЕ-ЭКСПОРТА-МОДАЛКИ.md.deleted" del /f /q "ИСПРАВЛЕНИЕ-ЭКСПОРТА-МОДАЛКИ.md.deleted"
if exist "ИСПРАВЛЕНИЯ-DRAWINGNUMBER.md.deleted" del /f /q "ИСПРАВЛЕНИЯ-DRAWINGNUMBER.md.deleted"
if exist "ПРОВЕРКА-TYPESCRIPT-ИСПРАВЛЕНИЙ.bat.deleted" del /f /q "ПРОВЕРКА-TYPESCRIPT-ИСПРАВЛЕНИЙ.bat.deleted"
if exist "ПРОВЕРКА-ИСПРАВЛЕНИЙ-TS.bat.deleted" del /f /q "ПРОВЕРКА-ИСПРАВЛЕНИЙ-TS.bat.deleted"
if exist "РЕШЕНИЕ-ПРОБЛЕМЫ-ОБЪЕМОВ.md.deleted" del /f /q "РЕШЕНИЕ-ПРОБЛЕМЫ-ОБЪЕМОВ.md.deleted"
if exist "ФИНАЛЬНОЕ-ИСПРАВЛЕНИЕ-ОБЪЕМОВ.bat.deleted" del /f /q "ФИНАЛЬНОЕ-ИСПРАВЛЕНИЕ-ОБЪЕМОВ.bat.deleted"

REM Delete .deleted folders
if exist "build.backup.deleted" rmdir /s /q "build.backup.deleted"

echo.
echo Cleaning src/pages directory...
cd src\pages

if exist "OperationHistory.deleted" rmdir /s /q "OperationHistory.deleted"
if exist "Planning.deleted" rmdir /s /q "Planning.deleted"
if exist "OperationTestPage.tsx.deleted" del /f /q "OperationTestPage.tsx.deleted"

cd ..\..

echo.
echo ✅ Frontend cleanup completed!
echo.
echo The following items have been removed:
echo - Operation History page and all related files
echo - Planning page and all related files  
echo - All TypeScript fix scripts and documentation
echo - All temporary .bat/.sh scripts
echo - All Russian language documentation
echo - Build backup folder
echo - Test files
echo.
echo Menu order has been updated to:
echo 1. База данных (Database)
echo 2. Производство (Production)
echo 3. Смены (Shifts)
echo 4. Активные операции (Active Operations)
echo 5. Календарь (Calendar)
echo 6. Операторы (Operators)
echo 7. Переводы (Translations)
echo.
pause
