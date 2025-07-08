Write-Host "🔥 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

# Переходим в директорию frontend
Set-Location "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend"

Write-Host "📁 Рабочая директория: $(Get-Location)" -ForegroundColor Cyan

# Функция для исправления файла
function Fix-TypeScriptFile {
    param($FilePath)
    
    if (Test-Path $FilePath) {
        Write-Host "🔧 Исправляем $FilePath..." -ForegroundColor Green
        
        $content = Get-Content $FilePath -Raw
        $originalContent = $content
        
        # Удаляем неиспользуемые импорты
        $content = $content -replace '^\s*Badge,?\s*$', ''
        $content = $content -replace '^\s*ClockCircleOutlined,?\s*$', ''
        $content = $content -replace '^\s*InfoCircleOutlined,?\s*$', ''
        $content = $content -replace '^\s*EditOutlined,?\s*$', ''
        $content = $content -replace '^\s*ThunderboltOutlined,?\s*$', ''
        $content = $content -replace '^\s*CalendarOutlined,?\s*$', ''
        $content = $content -replace '^\s*TeamOutlined,?\s*$', ''
        $content = $content -replace '^\s*SettingOutlined,?\s*$', ''
        $content = $content -replace '^\s*UserOutlined,?\s*$', ''
        $content = $content -replace '^\s*EyeOutlined,?\s*$', ''
        $content = $content -replace '^\s*DashboardOutlined,?\s*$', ''
        $content = $content -replace '^\s*Statistic,?\s*$', ''
        $content = $content -replace '^\s*CloseOutlined,?\s*$', ''
        $content = $content -replace '^\s*FileTextOutlined,?\s*$', ''
        $content = $content -replace '^\s*PlayCircleOutlined,?\s*$', ''
        $content = $content -replace '^\s*PrinterOutlined,?\s*$', ''
        $content = $content -replace '^\s*WarningOutlined,?\s*$', ''
        $content = $content -replace '^\s*StopOutlined,?\s*$', ''
        $content = $content -replace '^\s*Checkbox,?\s*$', ''
        $content = $content -replace '^\s*Divider,?\s*$', ''
        $content = $content -replace '^\s*SearchOutlined,?\s*$', ''
        $content = $content -replace '^\s*Alert,?\s*$', ''
        $content = $content -replace '^\s*Spin,?\s*$', ''
        
        # Удаляем неиспользуемые переменные
        $content = $content -replace 'const \[isProcessing, setIsProcessing\] = useState\(false\);', ''
        $content = $content -replace 'const \{ Option \} = Select;', ''
        $content = $content -replace 'const \{ Title \} = Typography;', 'const { Title, Text } = Typography;'
        
        # Убираем пустые строки
        $content = $content -replace '\r?\n\s*\r?\n', "`n"
        $content = $content -replace ',\s*\r?\n\s*}', "`n}"
        
        if ($content -ne $originalContent) {
            Set-Content $FilePath $content -Encoding UTF8
            Write-Host "✅ $FilePath исправлен" -ForegroundColor Green
        } else {
            Write-Host "ℹ️ $FilePath не требует изменений" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Файл не найден: $FilePath" -ForegroundColor Red
    }
}

# Список файлов для исправления
$filesToFix = @(
    "src\pages\ActiveOperations\ActiveOperationsPage.tsx",
    "src\pages\Calendar\components\EnhancedProductionCalendar.tsx",
    "src\pages\Calendar\EnhancedCalendarPage.tsx",
    "src\pages\Database\components\CSVImportModal.tsx",
    "src\pages\Database\components\ModernExcelUploader.tsx",
    "src\pages\Database\components\OrderForm.SIMPLE.ORIGINAL.tsx",
    "src\pages\Database\components\OrderForm.SIMPLE.tsx",
    "src\pages\Database\DatabasePage.ORIGINAL.tsx",
    "src\pages\Database\DatabasePage.tsx",
    "src\pages\Demo\DemoPage.tsx",
    "src\pages\OperationHistory\OperationHistory.tsx",
    "src\pages\Production\components\MachineCard.tsx",
    "src\pages\Shifts\components\ActiveMachinesMonitor.tsx",
    "src\pages\Shifts\components\OperationDetailModal.tsx",
    "src\pages\Shifts\components\ShiftForm.tsx",
    "src\pages\Shifts\components\ShiftsList.tsx",
    "src\components\OperationAnalyticsModal\EnhancedOperationAnalyticsModal.tsx",
    "src\components\OperationDetailsModal\OperationDetailsModal.tsx",
    "src\components\PlanningModal\PlanningModalImproved.tsx",
    "src\components\StableExcelImporter.tsx",
    "src\components\ExcelUploader\ModernExcelUploader.OLD.tsx",
    "src\services\ordersApi.ts"
)

Write-Host "🎯 Исправляем файлы..." -ForegroundColor Yellow

$fixedCount = 0
foreach ($file in $filesToFix) {
    Fix-TypeScriptFile $file
    $fixedCount++
}

Write-Host ""
Write-Host "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!" -ForegroundColor Green
Write-Host "✅ Обработано файлов: $fixedCount" -ForegroundColor Green
Write-Host "🔍 Рекомендуется запустить 'npm run build' для проверки" -ForegroundColor Cyan

Read-Host "Нажмите Enter для продолжения..."
