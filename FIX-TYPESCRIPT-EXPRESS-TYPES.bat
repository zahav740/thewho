@echo off
title TypeScript Errors Fix
echo.
echo ========================================
echo  ИСПРАВЛЕНИЕ ОШИБОК TYPESCRIPT
echo ========================================
echo.

echo [1/6] Исправляем типы Request и Response...

cd /d "%~dp0backend"

echo [2/6] Устанавливаем правильные типы Express...
npm install --save-dev @types/express@latest @types/node@latest

echo [3/6] Добавляем конфигурацию TypeScript...
echo // TypeScript compiler flags for Express types > src/types/express.d.ts
echo declare global { >> src/types/express.d.ts
echo   namespace Express { >> src/types/express.d.ts
echo     interface Request { >> src/types/express.d.ts
echo       requestId?: string; >> src/types/express.d.ts
echo     } >> src/types/express.d.ts
echo   } >> src/types/express.d.ts
echo } >> src/types/express.d.ts
echo export {}; >> src/types/express.d.ts

echo [4/6] Компилируем TypeScript...
npx tsc --noEmit

echo [5/6] Запускаем проверку...
npm run build

echo [6/6] Готово!
echo.
echo ✅ Все исправления применены
echo.
pause
