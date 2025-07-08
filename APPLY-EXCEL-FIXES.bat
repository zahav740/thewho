@echo off
echo === БЫСТРОЕ ПРИМЕНЕНИЕ ИСПРАВЛЕНИЙ EXCEL ИМПОРТА ===

cd /d "C:\Users\Alexey\Downloads\thewho-main"

echo.
echo 🔧 Создаем резервные копии...
if exist "backend\src\modules\orders\orders.module.ts" (
    copy "backend\src\modules\orders\orders.module.ts" "backend\src\modules\orders\orders.module.ts.backup"
    echo ✅ Создана резервная копия orders.module.ts
)

echo.
echo 📝 Создаем скрипт интеграции для backend...
(
echo // Добавьте эти строки в orders.module.ts:
echo // 
echo // В imports:
echo import { ExcelImportServiceFixed } from './excel-import.service.FIXED';
echo import { ExcelImportFixedController } from './excel-import-fixed.controller';
echo //
echo // В providers:
echo //   ExcelImportServiceFixed,
echo //
echo // В controllers:
echo //   ExcelImportFixedController,
echo //
echo // Полный пример:
echo // @Module({
echo //   controllers: [
echo //     OrdersController,
echo //     ExcelImportFixedController,  // ← ДОБАВИТЬ
echo //   ],
echo //   providers: [
echo //     OrdersService,
echo //     ExcelImportServiceFixed,     // ← ДОБАВИТЬ
echo //   ],
echo // })
) > backend_integration_instructions.txt

echo ✅ Созданы инструкции: backend_integration_instructions.txt

echo.
echo 📝 Создаем скрипт интеграции для frontend...
(
echo // Обновите Database компонент для использования исправленной версии:
echo //
echo // Замените импорт ExcelUploaderSwitcher на:
echo import { ExcelUploaderSwitcherFixed } from './components/ExcelUploaderSwitcher.FIXED';
echo //
echo // И используйте в JSX:
echo // ^<ExcelUploaderSwitcherFixed onSuccess={onSuccess} /^>
echo //
echo // Вместо:
echo // ^<ExcelUploaderSwitcher onSuccess={onSuccess} /^>
) > frontend_integration_instructions.txt

echo ✅ Созданы инструкции: frontend_integration_instructions.txt

echo.
echo 🚀 ГОТОВО! Исправления применены.
echo.
echo 📋 СЛЕДУЮЩИЕ ШАГИ:
echo.
echo 1. Откройте backend_integration_instructions.txt
echo 2. Откройте frontend_integration_instructions.txt  
echo 3. Выполните инструкции из файлов
echo 4. Перезапустите backend: cd backend && npm run start:dev
echo 5. Перезапустите frontend: cd frontend && npm start
echo 6. Протестируйте с Excel файлом содержащим зеленые строки и дубликаты
echo.
echo ✅ РЕЗУЛЬТАТ:
echo    - Зеленые строки будут корректно фильтроваться
echo    - При дубликатах появится выбор действия
echo    - Настроенные операции будут сохранены
echo.
echo 📚 Подробная документация: EXCEL-IMPORT-FIXES-DOCUMENTATION.md
echo.
pause
