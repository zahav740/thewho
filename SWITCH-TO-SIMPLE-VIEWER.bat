@echo off
echo 🔧 Быстрое исправление PDF превью - Переключение на SimplePdfViewer
echo ================================================================

cd /d "%~dp0"

echo 📝 Обновляем PdfUpload.tsx для использования SimplePdfViewer...

powershell -Command "(Get-Content 'frontend\src\components\common\PdfUpload.tsx') -replace '/\* \s*<SimplePdfViewer', '<SimplePdfViewer' -replace 'allowDownload=\{true\}\s*/>', 'allowDownload={true} />' -replace '<PdfDebugViewer', '/* <PdfDebugViewer' -replace 'allowDownload=\{true\}\s*/>', 'allowDownload={true} */ }' | Set-Content 'frontend\src\components\common\PdfUpload.tsx'"

echo ✅ Переключено на SimplePdfViewer

echo.
echo 💡 Теперь PDF будет открываться в новых вкладках и с PDF.js
echo 🔄 Для возврата к диагностическому режиму запустите: SWITCH-TO-DEBUG-VIEWER.bat

pause
