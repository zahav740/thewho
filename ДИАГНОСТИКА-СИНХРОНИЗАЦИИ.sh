#!/bin/bash

# 🔍 ДИАГНОСТИКА СИНХРОНИЗАЦИИ
echo "🔍 Диагностика синхронизации Production ↔ Shifts"
echo ""

API_URL="http://localhost:5100/api"

echo "1️⃣ Получаем данные станков..."
curl -s "$API_URL/machines/status/all" | jq '.[] | {id, machineName, isAvailable, currentOperationDetails: {orderDrawingNumber}}' | head -20

echo ""
echo "2️⃣ Получаем данные смен..."
curl -s "$API_URL/shifts" | jq '.[] | {id, machineId, drawingNumber, orderDrawingNumber, dayShiftQuantity, nightShiftQuantity, date}' | head -10

echo ""
echo "3️⃣ Анализ проблемы..."
echo "Из логов видно что станок Doosan 3 (ID: 3) с операцией C6HP0021A не находит смену ID 29 с machineId: 3 и drawingNumber: C6HP0021A"

echo ""
echo "4️⃣ Проверяем типы данных в БД..."
echo "SELECT id, machine_id, drawing_number, order_drawing_number FROM shift_records WHERE id = 29;"

echo ""
echo "Возможные проблемы:"
echo "  1. Разные типы данных (string vs number)"
echo "  2. Разные названия полей (drawingNumber vs orderDrawingNumber)"
echo "  3. Пробелы или регистр в данных"
echo "  4. Неправильный алгоритм сопоставления"
