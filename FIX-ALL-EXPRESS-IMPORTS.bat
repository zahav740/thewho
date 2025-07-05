@echo off
echo 🔧 Исправление всех ошибок Express импортов TypeScript
echo.

echo 📂 Переходим в backend директорию...
cd backend

echo 🔧 Исправляем excel-import-db.service.ts...
powershell -Command "(Get-Content 'src/modules/orders/excel-import-db.service.ts' -Raw) -replace 'import type \{ Express \} from ''express'';', 'import { MulterFile } from ''../../types/express'';' -replace 'Express\.Multer\.File', 'MulterFile' | Set-Content 'src/modules/orders/excel-import-db.service.ts' -NoNewline"

echo 🔧 Исправляем excel-import-simple.controller.ts...
powershell -Command "(Get-Content 'src/modules/orders/excel-import-simple.controller.ts' -Raw) -replace 'import type \{ Express \} from ''express'';', 'import { MulterFile } from ''../../types/express'';' -replace 'Express\.Multer\.File', 'MulterFile' | Set-Content 'src/modules/orders/excel-import-simple.controller.ts' -NoNewline"

echo 🔧 Исправляем excel-import.service.ts...
powershell -Command "(Get-Content 'src/modules/orders/excel-import.service.ts' -Raw) -replace 'import type \{ Express \} from ''express'';', 'import { MulterFile } from ''../../types/express'';' -replace 'Express\.Multer\.File', 'MulterFile' | Set-Content 'src/modules/orders/excel-import.service.ts' -NoNewline"

echo 🔧 Исправляем excel-preview.service.ts...
powershell -Command "(Get-Content 'src/modules/orders/excel-preview.service.ts' -Raw) -replace 'import type \{ Express \} from ''express'';', 'import { MulterFile } from ''../../types/express'';' -replace 'Express\.Multer\.File', 'MulterFile' | Set-Content 'src/modules/orders/excel-preview.service.ts' -NoNewline"

echo 🔧 Исправляем orders.controller.ts...
powershell -Command "(Get-Content 'src/modules/orders/orders.controller.ts' -Raw) -replace 'import \{ Response \} from ''express'';', 'import { Response } from ''../../types/express'';' -replace 'import type \{ Express \} from ''express'';', 'import { MulterFile } from ''../../types/express'';' -replace 'Express\.Multer\.File', 'MulterFile' | Set-Content 'src/modules/orders/orders.controller.ts' -NoNewline"

echo 🔧 Исправляем orders.middleware.ts...
powershell -Command "(Get-Content 'src/modules/orders/orders.middleware.ts' -Raw) -replace 'import \{ Request, Response, NextFunction \} from ''express'';', 'import { Request, Response, NextFunction } from ''../../types/express'';' | Set-Content 'src/modules/orders/orders.middleware.ts' -NoNewline"

echo 🔧 Исправляем excel-column-mapper.service.ts...
powershell -Command "(Get-Content 'src/modules/orders/excel-column-mapper.service.ts' -Raw) -replace 'import type \{ Express \} from ''express'';', 'import { MulterFile } from ''../../types/express'';' -replace 'Express\.Multer\.File', 'MulterFile' | Set-Content 'src/modules/orders/excel-column-mapper.service.ts' -NoNewline"

echo.
echo ✅ Все файлы исправлены!
echo.
echo 🧪 Проверяем компиляцию...
npx tsc --noEmit

echo.
echo 🎉 Исправление Express импортов завершено!
pause
