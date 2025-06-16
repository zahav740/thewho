@echo off
echo Удаление ненужных файлов и папок...

:: Проверяем что мы в правильной папке
if not exist "START-CRM-ENGLISH.bat" (
    echo ОШИБКА: Не найден START-CRM-ENGLISH.bat
    echo Запустите этот скрипт из папки проекта
    pause
    exit /b 1
)

:: Удаляем временные папки _deleted_*
echo Удаляю временные папки...
rmdir /s /q "_deleted_database" 2>nul && echo ✅ Удалена _deleted_database
rmdir /s /q "_deleted_docs" 2>nul && echo ✅ Удалена _deleted_docs  
rmdir /s /q "_DELETED_FILES" 2>nul && echo ✅ Удалена _DELETED_FILES
rmdir /s /q "_deleted_history" 2>nul && echo ✅ Удалена _deleted_history
rmdir /s /q "_deleted_init_scripts" 2>nul && echo ✅ Удалена _deleted_init_scripts
rmdir /s /q "_deleted_logs_removed" 2>nul && echo ✅ Удалена _deleted_logs_removed
rmdir /s /q "_deleted_uploads" 2>nul && echo ✅ Удалена _deleted_uploads

:: Удаляем все .bat файлы кроме START-CRM-ENGLISH.bat
echo Удаляю .bat файлы...
for %%f in (*.bat) do (
    if /I not "%%f"=="START-CRM-ENGLISH.bat" (
        if /I not "%%f"=="quick_delete.bat" (
            echo ✅ Удаляю %%f
            del "%%f"
        )
    )
)

:: Удаляем остальные файлы
echo Удаляю прочие ненужные файлы...
del *.sql 2>nul && echo ✅ Удалены .sql файлы
del *.js 2>nul && echo ✅ Удалены .js файлы
del *.ps1 2>nul && echo ✅ Удалены .ps1 файлы
del *.sh 2>nul && echo ✅ Удалены .sh файлы
del *.py 2>nul && echo ✅ Удалены .py файлы
del *.tsx.backup 2>nul && echo ✅ Удалены .tsx.backup файлы

:: Удаляем .md файлы кроме README.md  
echo Удаляю .md файлы (кроме README.md)...
for %%f in (*.md) do (
    if /I not "%%f"=="README.md" (
        echo ✅ Удаляю %%f
        del "%%f"
    )
)

:: Удаляем отдельные файлы
echo Удаляю отдельные ненужные файлы...
del "ActiveMachinesMonitor_fragment_backup.tsx" 2>nul && echo ✅ Удален ActiveMachinesMonitor_fragment_backup.tsx
del "MachineCard.enhanced.tsx.backup" 2>nul && echo ✅ Удален MachineCard.enhanced.tsx.backup
del "orders.service.fixed.js" 2>nul && echo ✅ Удален orders.service.fixed.js
del "orders.service.patch.js" 2>nul && echo ✅ Удален orders.service.patch.js
del "ИСПРАВЛЕННЫЙ-OperatorsPage.tsx" 2>nul && echo ✅ Удален ИСПРАВЛЕННЫЙ-OperatorsPage.tsx

echo.
echo ================================================================
echo                      ✅ ОЧИСТКА ЗАВЕРШЕНА!
echo ================================================================
echo.
echo 📁 ОСТАЛИСЬ ТОЛЬКО НУЖНЫЕ ФАЙЛЫ И ПАПКИ:
echo    📁 Папки: frontend, backend, shared, .git, docker
echo    📄 Файлы:
echo       - START-CRM-ENGLISH.bat (главный файл запуска)
echo       - .env.prod, .env.production (конфигурации)
echo       - .gitignore (git настройки)
echo       - README.md (документация)
echo       - docker-compose.yml, docker-compose.prod.yml (docker)
echo.
echo 🚀 ТЕПЕРЬ МОЖЕТЕ ЗАПУСКАТЬ: START-CRM-ENGLISH.bat
echo.
echo 🎉 Проект полностью очищен от тестовых данных и лишних файлов!
echo.
pause

:: Удаляем этот файл
del "%~f0"
