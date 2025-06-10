@echo off
chcp 65001 > nul
echo ===========================================
echo 🌐 ТЕСТИРОВАНИЕ ПЕРЕВОДОВ СТРАНИЦЫ БАЗЫ ДАННЫХ
echo ===========================================
echo.

cd /d "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

echo 📂 Текущая директория: %CD%
echo.

echo 🔧 Проверка TypeScript компиляции...
npx tsc --noEmit --skipLibCheck
if %errorlevel% neq 0 (
    echo ❌ Обнаружены ошибки TypeScript. Проверьте вывод выше.
    pause
    exit /b 1
)

echo ✅ TypeScript проверка прошла успешно!
echo.

echo 📋 Что было переведено:
echo    ✅ Заголовок страницы "Orders Database"
echo    ✅ Кнопки: "New Order", "CSV Import", "Excel 2.0", "Excel 1.0", "Refresh"
echo    ✅ Поиск: "Search by drawing number"
echo    ✅ Фильтр: "Filter by priority"
echo    ✅ Таблица: все колонки переведены
echo    ✅ Действия: "Edit", "Delete", всплывающие окна
echo    ✅ Форма заказа: все поля и кнопки
echo    ✅ Сообщения об ошибках и успехе
echo    ✅ Приоритеты: "High", "Medium", "Low"
echo.

echo 🚀 Запуск приложения для тестирования...
echo 📍 Откройте http://localhost:5101/database
echo 🔄 Переключите язык в правом верхнем углу
echo.
echo 🎯 Что протестировать:
echo    1. Переключение языка (Русский ↔ English)
echo    2. Создание нового заказа
echo    3. Редактирование заказа
echo    4. Поиск и фильтрацию
echo    5. Удаление заказов
echo    6. Импорт данных
echo.

npm start
