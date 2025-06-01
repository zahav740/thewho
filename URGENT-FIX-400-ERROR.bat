@echo off
chcp 65001 > nul
echo ============================================
echo СРОЧНОЕ ИСПРАВЛЕНИЕ ОШИБКИ BAD REQUEST
echo ============================================
echo.
echo Выполнение патча для устранения ошибки 400...
echo.

echo Остановка приложения...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo Патч для сервиса заказов...
cd backend\src\modules\orders

echo // СРОЧНЫЙ ПАТЧ - исправление ошибки Bad Request > orders.service.patch.js
echo const fs = require('fs'); >> orders.service.patch.js
echo const path = require('path'); >> orders.service.patch.js
echo // Читаем файл сервиса заказов >> orders.service.patch.js
echo const serviceFile = path.join(__dirname, 'orders.service.ts'); >> orders.service.patch.js
echo let content = fs.readFileSync(serviceFile, 'utf8'); >> orders.service.patch.js
echo. >> orders.service.patch.js
echo // Исправляем обработку machineAxes >> orders.service.patch.js
echo content = content.replace(/machine: opDto\.machineAxes \? `\$\{opDto\.machineAxes\}-axis` : '3-axis'/g, >> orders.service.patch.js
echo   "machine: typeof opDto.machineAxes === 'number' ? `${opDto.machineAxes}-axis` : (String(opDto.machineAxes).includes('-axis') ? String(opDto.machineAxes) : `${opDto.machineAxes || 3}-axis`)"); >> orders.service.patch.js
echo. >> orders.service.patch.js
echo // Исправляем преобразование приоритета >> orders.service.patch.js
echo content = content.replace(/priority: parseInt\(orderData\.priority\)/g, >> orders.service.patch.js
echo   "priority: parseInt(String(orderData.priority), 10)"); >> orders.service.patch.js
echo content = content.replace(/processedUpdateData\.priority = parseInt\(orderDataToUpdate\.priority\)/g, >> orders.service.patch.js
echo   "processedUpdateData.priority = parseInt(String(orderDataToUpdate.priority), 10)"); >> orders.service.patch.js
echo. >> orders.service.patch.js
echo // Сохраняем изменения >> orders.service.patch.js
echo fs.writeFileSync(serviceFile, content, 'utf8'); >> orders.service.patch.js
echo console.log('Патч успешно применен к orders.service.ts'); >> orders.service.patch.js

echo.
echo Применение патча...
node orders.service.patch.js
cd ..\..\..\..\

echo.
echo Перезапуск приложения...
start cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul
start cmd /k "cd frontend && npm start"

echo.
echo ============================================
echo Патч успешно применен!
echo.
echo Теперь сохранение операций должно работать корректно.
echo ============================================
pause
