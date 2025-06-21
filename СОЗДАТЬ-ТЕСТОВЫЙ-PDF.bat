@echo off
echo 🔧 Создание тестового PDF файла для Windows...

REM Переходим в директорию PDF
if not exist "backend\uploads\pdf\" (
    echo 💡 Создаем директорию backend\uploads\pdf\...
    mkdir backend\uploads\pdf\
)

cd backend\uploads\pdf\

REM Создаем тестовый PDF файл с помощью PowerShell
powershell -Command ^
"$content = @'^
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 120
>>
stream
BT
/F1 12 Tf
100 700 Td
(🧪 ТЕСТОВЫЙ PDF ДОКУМЕНТ) Tj
0 -20 Td
(Этот файл создан для тестирования) Tj
0 -20 Td
(системы просмотра PDF в Production CRM) Tj
0 -20 Td
(Дата создания: 21.06.2025) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000379 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
553
%%EOF
'@; [System.IO.File]::WriteAllText('test-document.pdf', $content, [System.Text.Encoding]::ASCII)"

echo ✅ Тестовый PDF файл создан: backend\uploads\pdf\test-document.pdf

REM Проверяем существование файла
if exist "test-document.pdf" (
    echo 📊 Файл создан успешно
    for %%A in (test-document.pdf) do echo 📊 Размер файла: %%~zA байт
    
    echo.
    echo 🌐 Проверяем доступность через API...
    curl -s -I http://localhost:5100/api/orders/pdf/test-document.pdf 2>nul | findstr "HTTP"
    
    echo.
    echo 🎯 Теперь можно тестировать:
    echo    1. Откройте браузер: http://localhost:5100/api/orders/pdf/test-document.pdf
    echo    2. Или используйте в форме заказа функцию просмотра PDF
    echo    3. Проверьте консоль браузера на ошибки ^(F12^)
    echo.
) else (
    echo ❌ Ошибка создания файла
)

cd ..\..\..
pause
