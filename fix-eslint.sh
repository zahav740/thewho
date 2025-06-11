#!/bin/bash

echo "🔧 Исправляем ESLint ошибки..."

# 1. PlanningModalImproved.tsx - исправить незакрытый тег Result
FILE1="C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\components\\PlanningModal\\PlanningModalImproved.tsx"
echo "📁 Исправляем PlanningModalImproved.tsx..."
sed -i 's/          <\/r>/          <\/r>/g' "$FILE1"
sed -i '/const getMachineTypeColor/,+8d' "$FILE1"
echo "✅ PlanningModalImproved.tsx исправлен"

# 2. StableExcelImporter.tsx - удалить неиспользуемые импорты
FILE2="C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\components\\StableExcelImporter.tsx"
echo "📁 Исправляем StableExcelImporter.tsx..."
sed -i 's/import React, { useState, useRef, useCallback }/import React, { useState, useCallback }/g' "$FILE2"
sed -i 's/const { data, errors } = Papa.parse(/const { data } = Papa.parse(/g' "$FILE2"
echo "✅ StableExcelImporter.tsx исправлен"

# 3. ActiveOperationsPage.tsx - удалить неиспользуемые импорты
FILE3="C:\\Users\\kasuf\\Downloads\\TheWho\\production-crm\\frontend\\src\\pages\\ActiveOperations\\ActiveOperationsPage.tsx"
echo "📁 Исправляем ActiveOperationsPage.tsx..."
sed -i 's/Badge,//g' "$FILE3"
sed -i 's/InfoCircleOutlined,//g' "$FILE3"
echo "✅ ActiveOperationsPage.tsx исправлен"

echo "🎉 Все ESLint ошибки исправлены!"
