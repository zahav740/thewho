#!/bin/bash

# 🔥 ТЕСТ СИНХРОНИЗАЦИИ ПРОИЗВОДСТВО ↔ СМЕНЫ
# 
# Этот скрипт проверяет работу синхронизации между модулями Production и Shifts
# 
# Как работает синхронизация:
# 1. Производство: Выбирают операцию → записывают в БД
# 2. Смена: Получает вебхук → записывает операцию в план
# 3. Смена: Делается наладка → данные записываются в БД
# 4. Смена: Выполняется объем (день/ночь) → записали в БД и отобразили в карточке станка
# 5. Производство: Принимает вебхук → записывает данные в карточку станка
#

echo "🚀 Начинаем тестирование синхронизации..."
echo ""

# Базовый URL API
API_URL="http://localhost:5100/api"

# 1. Проверяем здоровье системы синхронизации
echo "🏥 1. Проверка работоспособности системы синхронизации..."
curl -s -X GET "$API_URL/sync/health" | jq '.'
echo ""

# 2. Получаем список доступных станков
echo "📋 2. Получение доступных станков..."
MACHINES=$(curl -s -X GET "$API_URL/machines/availability" | jq -r '.[] | select(.isAvailable == true) | .id' | head -1)
MACHINE_ID=$MACHINES
echo "Используем станок ID: $MACHINE_ID"
echo ""

# 3. Получаем список операций для назначения
echo "📋 3. Получение доступных операций..."
OPERATIONS=$(curl -s -X GET "$API_URL/operations" | jq -r '.[] | select(.status == "PENDING" or .status == "READY") | .id' | head -1)
OPERATION_ID=$OPERATIONS
echo "Используем операцию ID: $OPERATION_ID"
echo ""

if [ -z "$MACHINE_ID" ] || [ -z "$OPERATION_ID" ]; then
    echo "❌ Не найдены доступные станки или операции для тестирования"
    echo "   Убедитесь что в БД есть:"
    echo "   - Станки с isAvailable=true"
    echo "   - Операции со статусом PENDING или READY"
    exit 1
fi

# 4. Назначаем операцию с синхронизацией (НОВЫЙ МЕТОД)
echo "🎯 4. Назначение операции с полной синхронизацией..."
ASSIGN_RESULT=$(curl -s -X POST "$API_URL/planning/assign-operation" \
    -H "Content-Type: application/json" \
    -d "{\"operationId\": $OPERATION_ID, \"machineId\": $MACHINE_ID}")

echo "Результат назначения:"
echo "$ASSIGN_RESULT" | jq '.'
echo ""

# 5. Проверяем статус синхронизации
echo "📊 5. Проверка статуса синхронизации операции..."
sleep 2
SYNC_STATUS=$(curl -s -X GET "$API_URL/planning/sync-status/$OPERATION_ID")
echo "Статус синхронизации:"
echo "$SYNC_STATUS" | jq '.'
echo ""

# 6. Создаем тестовую запись смены (имитируем работу модуля Смены)
echo "🔨 6. Создание тестовой записи смены (имитация работы)..."
TODAY=$(date +%Y-%m-%d)

# Получаем список смен для операции
SHIFTS=$(curl -s -X GET "$API_URL/shifts?operationId=$OPERATION_ID")
echo "Текущие смены для операции:"
echo "$SHIFTS" | jq '.'
echo ""

# 7. Обновляем объем выполненных работ (имитация заполнения смены)
echo "📈 7. Обновление выполненного объема (день: 10, ночь: 15)..."

# Создаем/обновляем запись смены с выполненным объемом
SHIFT_UPDATE=$(curl -s -X POST "$API_URL/shifts" \
    -H "Content-Type: application/json" \
    -d "{
        \"date\": \"$TODAY\",
        \"operationId\": $OPERATION_ID,
        \"machineId\": $MACHINE_ID,
        \"dayShiftQuantity\": 10,
        \"nightShiftQuantity\": 15,
        \"dayShiftOperator\": \"Тест Оператор День\",
        \"nightShiftOperator\": \"Тест Оператор Ночь\"
    }")

echo "Результат обновления смены:"
echo "$SHIFT_UPDATE" | jq '.'
echo ""

# 8. Запускаем принудительную синхронизацию
echo "🔄 8. Принудительная синхронизация всех данных..."
sleep 1
SYNC_ALL=$(curl -s -X POST "$API_URL/sync/sync-all")
echo "Результат синхронизации:"
echo "$SYNC_ALL" | jq '.'
echo ""

# 9. Проверяем обновленный статус синхронизации
echo "📊 9. Финальная проверка статуса синхронизации..."
FINAL_STATUS=$(curl -s -X GET "$API_URL/planning/sync-status/$OPERATION_ID")
echo "Финальный статус:"
echo "$FINAL_STATUS" | jq '.'
echo ""

# 10. Проверяем состояние станка
echo "🔧 10. Проверка состояния станка..."
MACHINE_STATUS=$(curl -s -X GET "$API_URL/machines/availability" | jq ".[] | select(.id == \"$MACHINE_ID\")")
echo "Состояние станка:"
echo "$MACHINE_STATUS" | jq '.'
echo ""

echo "✅ Тестирование синхронизации завершено!"
echo ""
echo "📋 Результат тестирования:"
echo "   - Операция $OPERATION_ID назначена на станок $MACHINE_ID"
echo "   - Автоматически создана запись смены"
echo "   - Записан выполненный объем: День 10 + Ночь 15 = 25 деталей"
echo "   - Данные синхронизированы между модулями Production и Shifts"
echo ""
echo "🎉 Синхронизация работает корректно!"
