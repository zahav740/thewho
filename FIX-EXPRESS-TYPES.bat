@echo off
echo ===========================================
echo БЫСТРОЕ ИСПРАВЛЕНИЕ ТИПОВ EXPRESS
echo ===========================================

cd backend

echo 🔧 Исправляем импорты Express типов...

echo Исправляем static-files.middleware.ts...
powershell -Command "(Get-Content 'src/common/middleware/static-files.middleware.ts') -replace 'import type { Request, Response, NextFunction } from ''express'';', 'import { Request, Response, NextFunction } from ''express'';' | Set-Content 'src/common/middleware/static-files.middleware.ts'"

echo Исправляем header-size.middleware.ts...
powershell -Command "(Get-Content 'src/common/middleware/header-size.middleware.ts') -replace 'import type { Request, Response, NextFunction } from ''express'';', 'import { Request, Response, NextFunction } from ''express'';' | Set-Content 'src/common/middleware/header-size.middleware.ts'"

echo Исправляем security-exception.filter.ts...
powershell -Command "(Get-Content 'src/filters/security-exception.filter.ts') -replace 'import type { Request, Response } from ''express'';', 'import { Request, Response } from ''express'';' | Set-Content 'src/filters/security-exception.filter.ts'"

echo Исправляем rate-limit.guard.ts...
powershell -Command "(Get-Content 'src/guards/rate-limit.guard.ts') -replace 'import type { Request } from ''express'';', 'import { Request } from ''express'';' | Set-Content 'src/guards/rate-limit.guard.ts'"

echo Исправляем security.middleware.ts...
powershell -Command "(Get-Content 'src/middleware/security.middleware.ts') -replace 'import type { Request, Response, NextFunction } from ''express'';', 'import { Request, Response, NextFunction } from ''express'';' | Set-Content 'src/middleware/security.middleware.ts'"

echo Исправляем files.controller.ts...
powershell -Command "(Get-Content 'src/modules/files/files.controller.ts') -replace 'import type { Response } from ''express'';', 'import { Response } from ''express'';' | Set-Content 'src/modules/files/files.controller.ts'"

echo Исправляем operation-history.controller.ts...
powershell -Command "(Get-Content 'src/modules/operations/operation-history.controller.ts') -replace 'import type { Response } from ''express'';', 'import { Response } from ''express'';' | Set-Content 'src/modules/operations/operation-history.controller.ts'"

echo Исправляем orders.controller.ts...
powershell -Command "(Get-Content 'src/modules/orders/orders.controller.ts') -replace 'import type { Response } from ''express'';', 'import { Response } from ''express'';' | Set-Content 'src/modules/orders/orders.controller.ts'"

echo Исправляем orders.middleware.ts...
powershell -Command "(Get-Content 'src/modules/orders/orders.middleware.ts') -replace 'import type { Request, Response, NextFunction } from ''express'';', 'import { Request, Response, NextFunction } from ''express'';' | Set-Content 'src/modules/orders/orders.middleware.ts'"

echo Исправляем orders-v2.controller.ts...
powershell -Command "(Get-Content 'src/modules/orders/v2/orders-v2.controller.ts') -replace 'import type { Request } from ''express'';', 'import { Request } from ''express'';' | Set-Content 'src/modules/orders/v2/orders-v2.controller.ts'"

echo.
echo ✅ Все импорты Express исправлены!
echo.

echo 📊 Проверяем TypeScript компиляцию...
npx tsc --noEmit

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ ВСЕ ОШИБКИ ИСПРАВЛЕНЫ!
    echo Можно запускать backend
    echo.
) else (
    echo.
    echo ❌ Остались ошибки, проверьте вывод выше
    echo.
)

pause
