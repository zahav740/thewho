#!/bin/bash

# Скрипт для поиска всех используемых ключей переводов в коде
# и проверки их наличия в файле переводов

echo "🔍 Поиск всех ключей переводов в проекте..."

# Находим все файлы .tsx и .ts
find src -name "*.tsx" -o -name "*.ts" | grep -v ".test." | grep -v "node_modules" | while read file; do
  echo ""
  echo "📁 Файл: $file"
  
  # Ищем вызовы t('...') и tWithParams('...')
  grep -n "t\s*(\s*['\"]" "$file" | while read line; do
    # Извлекаем ключ перевода
    key=$(echo "$line" | sed -n "s/.*t\s*(\s*['\"][^'\"]*['\"].*/\1/p" | cut -d':' -f2- | sed "s/.*t\s*(\s*['\"]//g" | sed "s/['\"].*//g")
    if [ ! -z "$key" ]; then
      echo "  ✅ Найден ключ: $key"
    fi
  done
done

echo ""
echo "🎯 Проверьте, что все найденные ключи есть в файле src/i18n/translations.ts"
