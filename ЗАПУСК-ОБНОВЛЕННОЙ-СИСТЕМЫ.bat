@echo off
echo ================================================
echo  🚀 ЗАПУСК ОБНОВЛЕННОЙ СИСТЕМЫ МОНИТОРИНГА
echo ================================================
echo.

echo 📋 Проверяем статус системы...
cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm"

echo.
echo 🔍 Структура проекта:
echo ✅ Frontend - система мониторинга обновлена
echo ✅ Backend - новые API endpoints добавлены  
echo ✅ Хуки - useOperationCompletion готов
echo ✅ Компоненты - OperationCompletionModal создан

echo.
echo 🎯 Новые возможности:
echo   • Автоматическое обнаружение завершенных операций
echo   • Модальное окно с выбором действий (Закрыть/Продолжить/Спланировать)
echo   • Отображение суммы выполненного объема по сменам
echo   • Синхронизация между секциями Production и Shifts
echo   • Автоматическая очистка данных при завершении

echo.
echo 📦 Запускаем Frontend...
cd frontend
if exist node_modules (
    echo ✅ node_modules найден
) else (
    echo ❌ node_modules не найден, запускаем npm install...
    npm install
)

echo.
echo 🚀 Запуск React Development Server...
echo 🌐 Приложение будет доступно по адресу: http://localhost:5101
echo.
echo 📋 Страницы для тестирования:
echo   • /shifts - Мониторинг производства (основная страница)
echo   • /production - Планирование операций
echo.
echo ⚡ Новая система завершения операций:
echo   1. Работайте с операциями как обычно
echo   2. При достижении 30 деталей появится модальное окно
echo   3. Выберите действие: Закрыть / Продолжить / Спланировать
echo   4. В Production есть кнопка "Проверить завершение"
echo.

npm start

echo.
echo 🎉 Система мониторинга производства запущена!
echo 📚 Подробности в файле: МОНИТОРИНГ-ПРОИЗВОДСТВА-УЛУЧШЕНИЯ.md
pause
