@echo off
chcp 65001 >nul
title PostgreSQL - Запуск и проверка
color 0A

echo.
echo ================================================================
echo                    ЗАПУСК POSTGRESQL
echo ================================================================
echo.

echo 🔍 Проверяем статус PostgreSQL...
echo.

REM Попробуем найти PostgreSQL service
sc query postgresql* >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Служба PostgreSQL найдена
    
    REM Запускаем службу PostgreSQL
    echo 🔄 Запускаем службу PostgreSQL...
    net start postgresql* >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ PostgreSQL успешно запущен
    ) else (
        echo ⚠️ Не удалось запустить через net start, пробуем другие способы...
        
        REM Пробуем запустить через pg_ctl
        if exist "C:\Program Files\PostgreSQL" (
            for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
                if exist "%%i\bin\pg_ctl.exe" (
                    echo Найден PostgreSQL в: %%i
                    "%%i\bin\pg_ctl.exe" start -D "%%i\data" >nul 2>&1
                    if %ERRORLEVEL% EQU 0 (
                        echo ✅ PostgreSQL запущен через pg_ctl
                        goto :check_connection
                    )
                )
            )
        )
    )
) else (
    echo ❌ Служба PostgreSQL не найдена
    echo.
    echo Возможные причины:
    echo 1. PostgreSQL не установлен
    echo 2. Служба имеет другое имя
    echo 3. PostgreSQL установлен не как служба
    echo.
)

:check_connection
echo.
echo 🔍 Проверяем подключение к PostgreSQL...
echo.

REM Проверяем подключение разными способами
pg_isready -h localhost -p 5432 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ PostgreSQL доступен на localhost:5432
    echo.
    echo 📋 Информация о сервере:
    psql -U postgres -c "SELECT version();" 2>nul
    
    echo.
    echo 🗃️ Список баз данных:
    psql -U postgres -c "\l" 2>nul
    
    goto :success
) else (
    echo ❌ PostgreSQL недоступен на localhost:5432
    echo.
    echo 🔧 Попробуйте следующие решения:
    echo.
    echo 1. Запустите PostgreSQL вручную:
    echo    - Найдите PostgreSQL в меню Пуск
    echo    - Или запустите pgAdmin
    echo.
    echo 2. Проверьте, установлен ли PostgreSQL:
    echo    - Скачайте с https://www.postgresql.org/download/windows/
    echo.
    echo 3. Если PostgreSQL установлен, но не запускается:
    echo    - Проверьте службы Windows (services.msc)
    echo    - Найдите службу postgresql и запустите её
    echo.
    echo 4. Альтернативно, используйте Docker:
    echo    - docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
    echo.
    goto :end
)

:success
echo.
echo ================================================================
echo                  POSTGRESQL ГОТОВ К РАБОТЕ
echo ================================================================
echo.
echo ✅ PostgreSQL успешно запущен и доступен
echo 🔗 Подключение: localhost:5432
echo 👤 Пользователь: postgres
echo.
echo Теперь можно запустить миграции:
echo cd backend ^&^& npm run migration:run
echo.

:end
pause
