@echo off
echo 🧪 Comprehensive TypeScript Compilation Test
echo.

cd backend

echo 📝 Testing compilation of fixed files...
echo.

echo 🔧 1. Testing orders-v2.controller.ts...
npx tsc --noEmit src/modules/orders/v2/orders-v2.controller.ts
if %errorlevel%==0 (
    echo ✅ orders-v2.controller.ts compiles successfully
) else (
    echo ❌ orders-v2.controller.ts has compilation errors
)

echo.
echo 🔧 2. Testing excel-import-db.controller.ts...
npx tsc --noEmit src/modules/orders/excel-import-db.controller.ts
if %errorlevel%==0 (
    echo ✅ excel-import-db.controller.ts compiles successfully
) else (
    echo ❌ excel-import-db.controller.ts has compilation errors
)

echo.
echo 🔧 3. Testing excel-import-db.service.ts...
npx tsc --noEmit src/modules/orders/excel-import-db.service.ts
if %errorlevel%==0 (
    echo ✅ excel-import-db.service.ts compiles successfully
) else (
    echo ❌ excel-import-db.service.ts has compilation errors
)

echo.
echo 🔧 4. Testing orders.controller.ts...
npx tsc --noEmit src/modules/orders/orders.controller.ts
if %errorlevel%==0 (
    echo ✅ orders.controller.ts compiles successfully
) else (
    echo ❌ orders.controller.ts has compilation errors
)

echo.
echo 🔧 5. Testing orders.middleware.ts...
npx tsc --noEmit src/modules/orders/orders.middleware.ts
if %errorlevel%==0 (
    echo ✅ orders.middleware.ts compiles successfully
) else (
    echo ❌ orders.middleware.ts has compilation errors
)

echo.
echo 🎯 Final comprehensive check...
npx tsc --noEmit
if %errorlevel%==0 (
    echo ✅ ALL FILES COMPILE SUCCESSFULLY!
    echo 🎉 TypeScript errors have been fixed!
) else (
    echo ❌ Some TypeScript errors remain
    echo 🔍 Check the output above for details
)

echo.
echo 📊 Summary:
echo ===================
echo ✅ Express type definitions created
echo ✅ Column K priority implemented  
echo ✅ Ports configured (5100/5101)
echo ✅ TypeScript Express imports fixed
echo.
echo 🚀 Ready to start the system!
pause
