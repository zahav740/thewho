@echo off
chcp 65001 >nul
echo ==========================================
echo 🧪 ТЕСТИРОВАНИЕ НОВОЙ СИСТЕМЫ ОПЕРАЦИЙ
echo ==========================================
echo.

echo 📋 Проверяем готовность backend...

REM Проверяем что backend работает
curl -s http://localhost:3000/api/operation-management/test >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend не запущен или не отвечает
    echo Запустите: START-BACKEND.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Backend работает
echo.

echo 📋 Проверяем готовность API...

echo Тестируем /api/operation-management/test...
curl -s http://localhost:3000/api/operation-management/test | jq -r ".status // \"Error\""

echo Тестируем /api/progress/test...  
curl -s http://localhost:3000/api/progress/test | jq -r ".status // \"Error\""

echo.
echo 📊 Проверяем данные для тестирования...

psql -h localhost -p 5432 -U postgres -d thewho -c "
SELECT 
  '📋 ДАННЫЕ ДЛЯ ТЕСТИРОВАНИЯ:' as info,
  COUNT(CASE WHEN ord.drawing_number = 'C6HP0021A' THEN 1 END) as orders_with_operations,
  COUNT(CASE WHEN ord.drawing_number IN ('CH1JK281A', 'E-87019') THEN 1 END) as orders_without_operations,
  COUNT(*) as total_test_orders
FROM orders ord
WHERE ord.drawing_number IN ('C6HP0021A', 'CH1JK281A', 'E-87019');
"

echo.
echo 🎯 ИНСТРУКЦИЯ ПО ТЕСТИРОВАНИЮ:
echo.
echo 1. Откройте http://localhost:3001/operation-test
echo 2. Выберите заказ "C6HP0021A" (должны быть рекомендации)
echo 3. Нажмите "Рекомендации" - система покажет существующие данные
echo 4. Нажмите "Добавить операцию"
echo 5. Используйте кнопку "Применить" для рекомендации
echo 6. Сохраните операцию
echo.
echo 7. Выберите заказ "CH1JK281A" (новый заказ)
echo 8. Нажмите "Рекомендации" - будет показано "Нет рекомендаций"
echo 9. Создайте операции вручную
echo 10. Данные сохранятся для будущих похожих заказов
echo.

echo 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:
echo.
echo ✅ Для заказа C6HP0021A:
echo    - Есть рекомендации на основе существующих операций
echo    - Система предложит MILLING операции
echo    - Уверенность рекомендаций будет высокой
echo.
echo ⚠️  Для новых заказов:
echo    - Рекомендации ограничены или отсутствуют
echo    - Система будет обучаться от ваших данных
echo    - После создания операций появятся рекомендации
echo.

echo 🚀 НАЧАТЬ ТЕСТИРОВАНИЕ?
echo.
echo Нажмите любую клавишу для открытия браузера...
pause >nul

start http://localhost:3001/operation-test

echo.
echo ✅ Страница тестирования открыта в браузере
echo.
echo 📝 ВАЖНО: Если страница не загружается:
echo 1. Проверьте что frontend запущен: START-FRONTEND.bat
echo 2. Добавьте файлы в проект:
echo    - frontend/src/components/SimpleOperationManagement.tsx
echo    - frontend/src/pages/OperationTestPage.tsx
echo 3. Добавьте маршрут в App.tsx или роутер
echo.

pause
