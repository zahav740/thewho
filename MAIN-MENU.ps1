# ГЛАВНОЕ МЕНЮ - Production CRM
# Выберите нужное действие

Write-Host "=================================" -ForegroundColor Green
Write-Host "    PRODUCTION CRM - МЕНЮ" -ForegroundColor Green  
Write-Host "=================================" -ForegroundColor Green

Write-Host "`nВыберите действие:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Быстрый запуск (рекомендуется)" -ForegroundColor Cyan
Write-Host "2. Диагностика проблем" -ForegroundColor Cyan  
Write-Host "3. Полное исправление ошибок" -ForegroundColor Cyan
Write-Host "4. Остановить все сервисы" -ForegroundColor Cyan
Write-Host "5. Запустить только backend" -ForegroundColor Cyan
Write-Host "6. Запустить только frontend" -ForegroundColor Cyan
Write-Host "7. Выход" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Введите номер (1-7)"

switch ($choice) {
    "1" {
        Write-Host "`nЗапуск быстрого старта..." -ForegroundColor Green
        .\quick-start-all.ps1
    }
    "2" {
        Write-Host "`nЗапуск диагностики..." -ForegroundColor Green
        .\diagnose-errors.ps1
    }
    "3" {
        Write-Host "`nЗапуск полного исправления..." -ForegroundColor Green
        .\fix-all-errors.ps1
    }
    "4" {
        Write-Host "`nОстановка всех сервисов..." -ForegroundColor Green
        .\stop-all.bat
    }
    "5" {
        Write-Host "`nЗапуск backend..." -ForegroundColor Green
        .\start-backend.bat
    }
    "6" {
        Write-Host "`nЗапуск frontend..." -ForegroundColor Green
        .\start-frontend.bat
    }
    "7" {
        Write-Host "`nДо свидания!" -ForegroundColor Green
        exit
    }
    default {
        Write-Host "`nНеверный выбор. Попробуйте снова." -ForegroundColor Red
        Start-Sleep -Seconds 2
        .\MAIN-MENU.ps1
    }
}

Write-Host "`nНажмите любую клавишу для возврата в меню..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
.\MAIN-MENU.ps1
