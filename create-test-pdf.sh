#!/bin/bash

# Скрипт для создания тестового PDF файла
# Используйте: bash create-test-pdf.sh

echo "🔧 Создание тестового PDF файла..."

# Переходим в директорию PDF
cd backend/uploads/pdf/ || {
    echo "❌ Ошибка: Директория backend/uploads/pdf/ не найдена"
    echo "💡 Создаем директорию..."
    mkdir -p backend/uploads/pdf/
    cd backend/uploads/pdf/
}

# Создаем простой тестовый PDF файл
cat > test-document.pdf << 'EOF'
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
/Length 85
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
514
%%EOF
EOF

echo "✅ Тестовый PDF файл создан: backend/uploads/pdf/test-document.pdf"

# Проверяем размер файла
if [ -f "test-document.pdf" ]; then
    size=$(wc -c < test-document.pdf)
    echo "📊 Размер файла: $size байт"
    
    # Проверяем доступность через curl (если сервер запущен)
    echo "🌐 Проверяем доступность через API..."
    curl -s -I http://localhost:5100/api/orders/pdf/test-document.pdf | head -1
    
    echo ""
    echo "🎯 Теперь можно тестировать:"
    echo "   1. Откройте браузер: http://localhost:5100/api/orders/pdf/test-document.pdf"
    echo "   2. Или используйте в форме заказа функцию просмотра PDF"
    echo ""
else
    echo "❌ Ошибка создания файла"
fi
