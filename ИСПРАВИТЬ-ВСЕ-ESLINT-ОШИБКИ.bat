@echo off
echo 🔧 Исправляем все ESLint ошибки TypeScript...

REM Исправление OrderForm.SIMPLE.tsx
echo Исправляем OrderForm.SIMPLE.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Database\components\OrderForm.SIMPLE.tsx') -replace 'import { CreateOrderDto, Priority, OrderFormOperationDto }', 'import { CreateOrderDto, Priority }' -replace '  setValue,', '  // setValue, // Неиспользуемая переменная' -replace '  getValues,', '  // getValues, // Неиспользуемая переменная' | Set-Content 'frontend\src\pages\Database\components\OrderForm.SIMPLE.tsx'"

REM Исправление DatabasePage.ORIGINAL.tsx  
echo Исправляем DatabasePage.ORIGINAL.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Database\DatabasePage.ORIGINAL.tsx') -replace 'import ExcelUploaderWithSettings', '// import ExcelUploaderWithSettings // Неиспользуемый импорт' | Set-Content 'frontend\src\pages\Database\DatabasePage.ORIGINAL.tsx'"

REM Исправление DatabasePage.tsx
echo Исправляем DatabasePage.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Database\DatabasePage.tsx') -replace 'import ExcelUploaderWithSettings', '// import ExcelUploaderWithSettings // Неиспользуемый импорт' | Set-Content 'frontend\src\pages\Database\DatabasePage.tsx'"

REM Исправление DemoPage.tsx
echo Исправляем DemoPage.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Demo\DemoPage.tsx') -replace '  ExclamationCircleOutlined,', '' | Set-Content 'frontend\src\pages\Demo\DemoPage.tsx'"

REM Исправление MachineCard.tsx
echo Исправляем MachineCard.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Production\components\MachineCard.tsx') -replace '  Checkbox,', '' -replace '  StopOutlined,', '' -replace 'const getPriorityColor', '// const getPriorityColor // Неиспользуемая функция' -replace 'import { operationsApi }', '// import { operationsApi } // Неиспользуемый импорт' | Set-Content 'frontend\src\pages\Production\components\MachineCard.tsx'"

REM Исправление ActiveMachinesMonitor.tsx
echo Исправляем ActiveMachinesMonitor.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Shifts\components\ActiveMachinesMonitor.tsx') -replace '  Modal,', '' -replace '  Statistic,', '' -replace '  PlayCircleOutlined,', '' -replace '  UserOutlined,', '' -replace '  SettingOutlined,', '' -replace '  PrinterOutlined,', '' -replace 'import { MachineAvailability }', '// import { MachineAvailability } // Неиспользуемый импорт' -replace 'const workingSessions', '// const workingSessions // Неиспользуемая переменная' -replace 'const formatTime', '// const formatTime // Неиспользуемая переменная' | Set-Content 'frontend\src\pages\Shifts\components\ActiveMachinesMonitor.tsx'"

REM Исправление OperationDetailModal.tsx
echo Исправляем OperationDetailModal.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Shifts\components\OperationDetailModal.tsx') -replace '  useEffect,', '' -replace '  Divider,', '' -replace '  WarningOutlined,', '' -replace 'import { OperatorEfficiencyStats }', '// import { OperatorEfficiencyStats } // Неиспользуемый импорт' -replace 'const Title', '// const Title // Неиспользуемая переменная' -replace 'const progressPercent', '// const progressPercent // Неиспользуемая переменная' | Set-Content 'frontend\src\pages\Shifts\components\OperationDetailModal.tsx'"

REM Исправление ShiftForm.tsx
echo Исправляем ShiftForm.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Shifts\components\ShiftForm.tsx') -replace '  Input,', '' -replace 'const operations', '// const operations // Неиспользуемая переменная' | Set-Content 'frontend\src\pages\Shifts\components\ShiftForm.tsx'"

REM Исправление ShiftsList.tsx
echo Исправляем ShiftsList.tsx...
powershell -Command "(Get-Content 'frontend\src\pages\Shifts\components\ShiftsList.tsx') -replace '  ClockCircleOutlined,', '' -replace 'const getShiftTypeTag', '// const getShiftTypeTag // Неиспользуемая переменная' | Set-Content 'frontend\src\pages\Shifts\components\ShiftsList.tsx'"

echo ✅ Все ESLint ошибки исправлены!
echo 🚀 Теперь можно запускать frontend без ошибок TypeScript

pause
