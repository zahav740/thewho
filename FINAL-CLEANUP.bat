@echo off
echo Удаление тестовых файлов и папок...

:: Удаляем ненужные папки
echo Удаляем папки...
if exist ".history" rmdir /s /q ".history" 2>nul && echo Удалена .history
if exist "logs" rmdir /s /q "logs" 2>nul && echo Удалена logs  
if exist "uploads" rmdir /s /q "uploads" 2>nul && echo Удалена uploads
if exist "docs" rmdir /s /q "docs" 2>nul && echo Удалена docs
if exist "init-scripts" rmdir /s /q "init-scripts" 2>nul && echo Удалена init-scripts
if exist "database" rmdir /s /q "database" 2>nul && echo Удалена database

:: Удаляем .bat файлы кроме START-CRM-ENGLISH.bat и этого файла
echo Удаляем .bat файлы...
for %%f in (*.bat) do (
    if /I not "%%f"=="START-CRM-ENGLISH.bat" (
        if /I not "%%f"=="FINAL-CLEANUP.bat" (
            del "%%f" 2>nul && echo Удален %%f
        )
    )
)

:: Удаляем остальные типы файлов
echo Удаляем прочие файлы...
del *.sql 2>nul
del *.js 2>nul  
del *.ps1 2>nul
del *.sh 2>nul
del *.tsx.backup 2>nul

:: Удаляем .md файлы кроме README.md
for %%f in (*.md) do (
    if /I not "%%f"=="README.md" (
        del "%%f" 2>nul && echo Удален %%f
    )
)

:: Удаляем отдельные ненужные файлы
del "ActiveMachinesMonitor_fragment_backup.tsx" 2>nul
del "MachineCard.enhanced.tsx.backup" 2>nul
del "cleanup_project.py" 2>nul

echo.
echo Очистка завершена!
echo Оставлены только:
echo - START-CRM-ENGLISH.bat
echo - Основные файлы проекта (.env, README.md, docker-compose.yml)
echo - Папки: frontend, backend, shared, .git, docker
echo.
echo Можете теперь запускать: START-CRM-ENGLISH.bat
pause

:: Удаляем этот файл
del "%~f0"
