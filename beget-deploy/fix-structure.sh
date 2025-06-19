#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ СТРУКТУРЫ МОДУЛЕЙ"
echo "================================"

# Создаем необходимые директории
echo "📁 Создание необходимых директорий..."
mkdir -p backend/dist/src/modules/machines
mkdir -p backend/dist/src/modules/operations
mkdir -p backend/dist/src/modules/orders
mkdir -p backend/dist/src/modules/calendar
mkdir -p backend/dist/src/database/entities
mkdir -p backend/dist/src/database/migrations

echo "✅ Директории созданы"

# Функция для безопасного копирования файлов
safe_copy() {
    local source_pattern="$1"
    local dest_dir="$2"
    local module_name="$3"
    
    echo "📁 Поиск файлов для $module_name..."
    
    # Ищем файлы по более гибкому паттерну
    find backend/dist -name "*.js" -path "*$source_pattern*" 2>/dev/null | while IFS= read -r file; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "   Копирование: $filename"
            cp "$file" "$dest_dir/$filename" 2>/dev/null || echo "   ⚠️  Ошибка копирования $filename"
        fi
    done
    
    # Альтернативный поиск без учета пути
    find backend/dist -name "*$source_pattern*.js" 2>/dev/null | while IFS= read -r file; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            if [ ! -f "$dest_dir/$filename" ]; then
                echo "   Копирование (альтернативный поиск): $filename"
                cp "$file" "$dest_dir/$filename" 2>/dev/null || echo "   ⚠️  Ошибка копирования $filename"
            fi
        fi
    done
}

# Копируем файлы модулей
echo ""
echo "🔄 Копирование файлов модулей..."

# Machines
safe_copy "machines" "backend/dist/src/modules/machines" "Machines"

# Operations  
safe_copy "operations" "backend/dist/src/modules/operations" "Operations"

# Orders
safe_copy "orders" "backend/dist/src/modules/orders" "Orders"

# Calendar
safe_copy "calendar" "backend/dist/src/modules/calendar" "Calendar"

# Entities
safe_copy "entities" "backend/dist/src/database/entities" "Entities"

# Migrations
safe_copy "migrations" "backend/dist/src/database/migrations" "Migrations"

echo ""
echo "📁 Поиск и копирование по типам файлов..."

# Копируем все контроллеры
find backend/dist -name "*controller*.js" 2>/dev/null | while IFS= read -r file; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Определяем куда копировать на основе имени файла
        if [[ "$filename" == *"machines"* ]]; then
            cp "$file" "backend/dist/src/modules/machines/$filename" 2>/dev/null
            echo "   Controller -> machines: $filename"
        elif [[ "$filename" == *"operations"* ]]; then
            cp "$file" "backend/dist/src/modules/operations/$filename" 2>/dev/null
            echo "   Controller -> operations: $filename"
        elif [[ "$filename" == *"orders"* ]]; then
            cp "$file" "backend/dist/src/modules/orders/$filename" 2>/dev/null
            echo "   Controller -> orders: $filename"
        elif [[ "$filename" == *"calendar"* ]]; then
            cp "$file" "backend/dist/src/modules/calendar/$filename" 2>/dev/null
            echo "   Controller -> calendar: $filename"
        fi
    fi
done

# Копируем все сервисы
find backend/dist -name "*service*.js" 2>/dev/null | while IFS= read -r file; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Определяем куда копировать на основе имени файла
        if [[ "$filename" == *"machines"* ]] || [[ "$filename" == *"recommendation"* ]] || [[ "$filename" == *"planning"* ]]; then
            cp "$file" "backend/dist/src/modules/machines/$filename" 2>/dev/null
            echo "   Service -> machines: $filename"
        elif [[ "$filename" == *"operations"* ]] || [[ "$filename" == *"progress"* ]] || [[ "$filename" == *"completion"* ]]; then
            cp "$file" "backend/dist/src/modules/operations/$filename" 2>/dev/null
            echo "   Service -> operations: $filename"
        elif [[ "$filename" == *"orders"* ]] || [[ "$filename" == *"excel"* ]]; then
            cp "$file" "backend/dist/src/modules/orders/$filename" 2>/dev/null
            echo "   Service -> orders: $filename"
        elif [[ "$filename" == *"calendar"* ]] || [[ "$filename" == *"working"* ]]; then
            cp "$file" "backend/dist/src/modules/calendar/$filename" 2>/dev/null
            echo "   Service -> calendar: $filename"
        fi
    fi
done

# Копируем все модули
find backend/dist -name "*module*.js" 2>/dev/null | while IFS= read -r file; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        if [[ "$filename" == *"machines"* ]]; then
            cp "$file" "backend/dist/src/modules/machines/$filename" 2>/dev/null
            echo "   Module -> machines: $filename"
        elif [[ "$filename" == *"operations"* ]]; then
            cp "$file" "backend/dist/src/modules/operations/$filename" 2>/dev/null
            echo "   Module -> operations: $filename"
        elif [[ "$filename" == *"orders"* ]]; then
            cp "$file" "backend/dist/src/modules/orders/$filename" 2>/dev/null
            echo "   Module -> orders: $filename"
        elif [[ "$filename" == *"calendar"* ]]; then
            cp "$file" "backend/dist/src/modules/calendar/$filename" 2>/dev/null
            echo "   Module -> calendar: $filename"
        fi
    fi
done

# Копируем все entity файлы
find backend/dist -name "*entity*.js" 2>/dev/null | while IFS= read -r file; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        cp "$file" "backend/dist/src/database/entities/$filename" 2>/dev/null
        echo "   Entity: $filename"
    fi
done

# Копируем все DTO файлы
find backend/dist -name "*dto*.js" 2>/dev/null | while IFS= read -r file; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        if [[ "$filename" == *"machines"* ]]; then
            cp "$file" "backend/dist/src/modules/machines/$filename" 2>/dev/null
            echo "   DTO -> machines: $filename"
        elif [[ "$filename" == *"operations"* ]]; then
            cp "$file" "backend/dist/src/modules/operations/$filename" 2>/dev/null
            echo "   DTO -> operations: $filename"
        elif [[ "$filename" == *"orders"* ]]; then
            cp "$file" "backend/dist/src/modules/orders/$filename" 2>/dev/null
            echo "   DTO -> orders: $filename"
        elif [[ "$filename" == *"calendar"* ]]; then
            cp "$file" "backend/dist/src/modules/calendar/$filename" 2>/dev/null
            echo "   DTO -> calendar: $filename"
        fi
    fi
done

echo ""
echo "📊 РЕЗУЛЬТАТ ВОССТАНОВЛЕНИЯ:"
echo "============================"

echo "Machines файлов: $(ls backend/dist/src/modules/machines/ 2>/dev/null | wc -l)"
echo "Operations файлов: $(ls backend/dist/src/modules/operations/ 2>/dev/null | wc -l)"
echo "Orders файлов: $(ls backend/dist/src/modules/orders/ 2>/dev/null | wc -l)"
echo "Calendar файлов: $(ls backend/dist/src/modules/calendar/ 2>/dev/null | wc -l)"
echo "Entities файлов: $(ls backend/dist/src/database/entities/ 2>/dev/null | wc -l)"
echo "Migrations файлов: $(ls backend/dist/src/database/migrations/ 2>/dev/null | wc -l)"

echo ""
echo "📂 Подробный список восстановленных файлов:"
echo "============================================"

echo ""
echo "🔧 Machines:"
ls -la backend/dist/src/modules/machines/ 2>/dev/null | head -10

echo ""
echo "⚙️ Operations:"
ls -la backend/dist/src/modules/operations/ 2>/dev/null | head -10

echo ""
echo "📋 Orders:"
ls -la backend/dist/src/modules/orders/ 2>/dev/null | head -10

echo ""
echo "📅 Calendar:"
ls -la backend/dist/src/modules/calendar/ 2>/dev/null | head -10

echo ""
echo "🗃️ Entities:"
ls -la backend/dist/src/database/entities/ 2>/dev/null | head -10

echo ""
echo "✅ Восстановление структуры завершено!"
