@echo off
echo ==============================================
echo     ОТЛАДКА ОШИБОК 400 (ДЕТАЛИЗАЦИЯ)
echo ==============================================

echo.
echo 🔍 ДЛЯ ПОЛУЧЕНИЯ ДЕТАЛЬНОЙ ИНФОРМАЦИИ ОБ ОШИБКЕ:
echo.
echo 1. Откройте браузер (Chrome/Edge/Firefox)
echo 2. Перейдите на http://localhost:5101
echo 3. Откройте Developer Tools (F12)
echo 4. Перейдите на вкладку "Console"
echo 5. Попробуйте импортировать Excel файл
echo.
echo 6. Найдите строку:
echo    ❌ API V2: Ошибка создания заказа: {message: Array(3), ...}
echo.
echo 7. КЛИКНИТЕ на этот объект, чтобы развернуть его
echo.
echo 8. Скопируйте содержимое массива "message"
echo.
echo 💡 ПРИМЕР ТОГО, ЧТО ВЫ ДОЛЖНЫ УВИДЕТЬ:
echo.
echo    message: [
echo      "operations.0.operationType must be a valid enum value",
echo      "workType must not be empty", 
echo      "deadline must be a valid ISO 8601 date string"
echo    ]
echo.
echo 🎯 ЭТО ПОКАЖЕТ ТОЧНЫЕ ПОЛЯ, КОТОРЫЕ НЕ ПРОХОДЯТ ВАЛИДАЦИЮ
echo.
echo ⚠️  ВОЗМОЖНЫЕ ПРОБЛЕМЫ:
echo    - workType: '1' вместо осмысленного названия
echo    - operationType: может отсутствовать в enum на backend
echo    - deadline: формат даты может не соответствовать ISO
echo.
echo 📋 ПОСЛЕ ПОЛУЧЕНИЯ ОШИБКИ, СООБЩИТЕ МНЕ:
echo    1. Содержимое массива message
echo    2. Объект данных, который отправляется на сервер
echo.
pause
