#!/bin/bash

echo "🔥 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ TYPESCRIPT ОШИБОК"
echo "=========================================="

# Переходим в нужную директорию
cd "C:\Users\kasuf\Downloads\TheWho\production-crm\frontend\src"

# Функция для удаления строк с неиспользуемыми импортами
fix_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "🔧 Исправляем $file..."
        
        # Удаляем неиспользуемые импорты
        sed -i '/^\s*Badge,\s*$/d' "$file"
        sed -i '/^\s*ClockCircleOutlined,\s*$/d' "$file"
        sed -i '/^\s*InfoCircleOutlined,\s*$/d' "$file"
        sed -i '/^\s*EditOutlined,\s*$/d' "$file"
        sed -i '/^\s*ThunderboltOutlined,\s*$/d' "$file"
        sed -i '/^\s*CalendarOutlined,\s*$/d' "$file"
        sed -i '/^\s*TeamOutlined,\s*$/d' "$file"
        sed -i '/^\s*SettingOutlined,\s*$/d' "$file"
        sed -i '/^\s*UserOutlined,\s*$/d' "$file"
        sed -i '/^\s*EyeOutlined,\s*$/d' "$file"
        sed -i '/^\s*DashboardOutlined,\s*$/d' "$file"
        sed -i '/^\s*Statistic,\s*$/d' "$file"
        sed -i '/^\s*CloseOutlined,\s*$/d' "$file"
        sed -i '/^\s*FileTextOutlined,\s*$/d' "$file"
        sed -i '/^\s*ExclamationCircleOutlined,\s*$/d' "$file"
        sed -i '/^\s*PlayCircleOutlined,\s*$/d' "$file"
        sed -i '/^\s*PrinterOutlined,\s*$/d' "$file"
        sed -i '/^\s*WarningOutlined,\s*$/d' "$file"
        sed -i '/^\s*StopOutlined,\s*$/d' "$file"
        sed -i '/^\s*Checkbox,\s*$/d' "$file"
        sed -i '/^\s*Divider,\s*$/d' "$file"
        sed -i '/^\s*Modal,\s*$/d' "$file"
        sed -i '/^\s*SearchOutlined,\s*$/d' "$file"
        sed -i '/^\s*Alert,\s*$/d' "$file"
        sed -i '/^\s*Spin,\s*$/d' "$file"
        
        # Удаляем неиспользуемые переменные
        sed -i '/const \[isProcessing, setIsProcessing\] = useState(false);/d' "$file"
        sed -i '/const { Option } = Select;/d' "$file"
        sed -i '/const { Title } = Typography;/d' "$file"
        
        echo "✅ $file исправлен"
    fi
}

# Исправляем конкретные файлы
echo "🎯 Исправляем основные проблемные файлы..."

fix_file "pages/ActiveOperations/ActiveOperationsPage.tsx"
fix_file "pages/Calendar/components/EnhancedProductionCalendar.tsx"
fix_file "pages/Calendar/EnhancedCalendarPage.tsx"
fix_file "pages/Database/components/CSVImportModal.tsx"
fix_file "pages/Database/components/ModernExcelUploader.tsx"
fix_file "pages/Database/components/OrderForm.SIMPLE.ORIGINAL.tsx"
fix_file "pages/Database/components/OrderForm.SIMPLE.tsx"
fix_file "pages/Database/DatabasePage.ORIGINAL.tsx"
fix_file "pages/Database/DatabasePage.tsx"
fix_file "pages/Demo/DemoPage.tsx"
fix_file "pages/OperationHistory/OperationHistory.tsx"
fix_file "pages/Production/components/MachineCard.tsx"
fix_file "pages/Shifts/components/ActiveMachinesMonitor.tsx"
fix_file "pages/Shifts/components/OperationDetailModal.tsx"
fix_file "pages/Shifts/components/ShiftForm.tsx"
fix_file "pages/Shifts/components/ShiftsList.tsx"
fix_file "components/OperationAnalyticsModal/EnhancedOperationAnalyticsModal.tsx"
fix_file "components/OperationDetailsModal/OperationDetailsModal.tsx"
fix_file "components/PlanningModal/PlanningModalImproved.tsx"
fix_file "components/StableExcelImporter.tsx"
fix_file "components/ExcelUploader/ModernExcelUploader.OLD.tsx"
fix_file "services/ordersApi.ts"

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "✅ Удалены основные неиспользуемые импорты"
echo "🔍 Рекомендуется запустить 'npm run build' для проверки"
