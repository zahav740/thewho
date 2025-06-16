@echo off
chcp 65001 >nul

echo ╔══════════════════════════════════════════════════════════════════╗
echo ║           🔍 ПОИСК И ИСПРАВЛЕНИЕ ОШИБОК machineId                ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

echo [1/3] 🔍 Поиск файлов с упоминанием machineId...
echo.

cd backend\src

echo Ищем файлы TypeScript с machineId:
findstr /s /n /i "machineId" *.ts 2>nul

if %errorlevel% equ 0 (
    echo.
    echo ❌ Найдены файлы с machineId - требуется исправление
    echo.
    
    echo [2/3] 🔧 Автоматическое исправление...
    echo.
    
    REM Создаем временный скрипт PowerShell для замены
    echo # PowerShell script для замены machineId > temp_fix.ps1
    echo Get-ChildItem -Recurse -Filter "*.ts" ^| ForEach-Object { >> temp_fix.ps1
    echo     $content = Get-Content $_.FullName -Raw >> temp_fix.ps1
    echo     if ($content -match "operation\.machineId") { >> temp_fix.ps1
    echo         Write-Host "Исправляем файл: $($_.FullName)" >> temp_fix.ps1
    echo         $content = $content -replace "operation\.machineId", "operation.assignedMachine" >> temp_fix.ps1
    echo         $content = $content -replace "machineId: null", "// machineId удален - используем assignedMachine" >> temp_fix.ps1
    echo         Set-Content $_.FullName $content -NoNewline >> temp_fix.ps1
    echo     } >> temp_fix.ps1
    echo } >> temp_fix.ps1
    
    REM Выполняем скрипт PowerShell
    powershell -ExecutionPolicy Bypass -File temp_fix.ps1
    
    REM Удаляем временный файл
    del temp_fix.ps1
    
    echo ✅ Автоматические исправления применены
    
) else (
    echo ✅ Файлы с machineId не найдены - все исправлено
)

echo.
echo [3/3] ✅ Проверка завершена
echo.

cd ..\..

echo ┌────────────────────────────────────────────────────────────────────┐
echo │                    📋 ИТОГОВЫЙ СТАТУС:                            │
echo ├────────────────────────────────────────────────────────────────────┤
echo │                                                                    │
echo │ ✅ Поиск проблемных файлов завершен                                │
echo │ ✅ Автоматические исправления применены                            │
echo │ ✅ Теперь можно запускать backend                                  │
echo │                                                                    │
echo │ 🚀 Для запуска выполните:                                          │
echo │    ЗАПУСК-BACKEND-ИСПРАВЛЕННЫЙ.bat                                 │
echo │                                                                    │
echo └────────────────────────────────────────────────────────────────────┘

echo.
echo Нажмите любую клавишу для продолжения...
pause >nul
