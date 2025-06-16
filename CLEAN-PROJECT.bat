@echo off
echo Очистка проекта от тестовых файлов...

:: Удаляем все .bat файлы кроме START-CRM-ENGLISH.bat и этого файла
for %%f in (*.bat) do (
    if /I not "%%f"=="START-CRM-ENGLISH.bat" (
        if /I not "%%f"=="CLEAN-PROJECT.bat" (
            echo Удаляем %%f
            del "%%f"
        )
    )
)

:: Удаляем все .sql файлы
echo Удаляем .sql файлы...
del *.sql 2>nul

:: Удаляем все .js файлы в корне
echo Удаляем .js файлы в корне...
del *.js 2>nul

:: Удаляем все .ps1 файлы
echo Удаляем .ps1 файлы...
del *.ps1 2>nul

:: Удаляем все .sh файлы
echo Удаляем .sh файлы...
del *.sh 2>nul

:: Удаляем все .md файлы кроме основных
for %%f in (*.md) do (
    if /I not "%%f"=="README.md" (
        echo Удаляем %%f
        del "%%f"
    )
)

:: Удаляем папку .history
echo Удаляем папку .history...
rmdir /s /q ".history" 2>nul

:: Удаляем папку logs
echo Удаляем папку logs...
rmdir /s /q "logs" 2>nul

:: Удаляем папку uploads
echo Удаляем папку uploads...
rmdir /s /q "uploads" 2>nul

:: Удаляем папку docs
echo Удаляем папку docs...
rmdir /s /q "docs" 2>nul

:: Удаляем папку init-scripts
echo Удаляем папку init-scripts...
rmdir /s /q "init-scripts" 2>nul

:: Удаляем папку database
echo Удаляем папку database...
rmdir /s /q "database" 2>nul

:: Удаляем отдельные файлы
echo Удаляем отдельные файлы...
del "ActiveMachinesMonitor_fragment_backup.tsx" 2>nul
del "MachineCard.enhanced.tsx.backup" 2>nul
del "orders.service.fixed.js" 2>nul
del "orders.service.patch.js" 2>nul
del "ИСПРАВЛЕННЫЙ-OperatorsPage.tsx" 2>nul
del "ADD-OPERATIONS-C6HP0021A.sql" 2>nul

echo Очистка завершена!
echo Остались только основные файлы проекта и START-CRM-ENGLISH.bat
pause
