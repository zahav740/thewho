#!/bin/bash

echo "🚨 ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ BACKEND"
echo "==================================="

# Если структура полностью сломана, пересобираем backend
if [ ! -d "backend/dist/src" ]; then
    echo "❌ backend/dist/src не найден. Запускаем пересборку..."
    
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        echo "📦 Пересборка backend из исходников..."
        cd backend
        
        # Проверяем node_modules
        if [ ! -d "node_modules" ]; then
            echo "📥 Установка зависимостей..."
            npm install
        fi
        
        # Пересборка
        echo "🔨 Сборка TypeScript..."
        npm run build
        
        cd ..
        
        echo "✅ Пересборка завершена"
    else
        echo "❌ Исходники backend не найдены!"
        exit 1
    fi
fi

# Проверяем наличие основных файлов
echo ""
echo "🔍 Проверка основных файлов backend..."

if [ ! -f "backend/dist/src/main.js" ]; then
    echo "❌ main.js не найден!"
    if [ -f "backend/src/main.ts" ]; then
        echo "🔧 Попытка пересборки из TypeScript..."
        cd backend
        npm run build
        cd ..
    fi
fi

# Создаем базовую структуру если её нет
echo ""
echo "📁 Создание базовой структуры..."

mkdir -p backend/dist/src/modules/{machines,operations,orders,calendar}
mkdir -p backend/dist/src/database/{entities,migrations}
mkdir -p backend/dist/src/common/{dto,guards,interceptors,pipes}

# Если есть исходники TypeScript, компилируем их
if [ -d "backend/src" ]; then
    echo "📂 Найдены исходники TypeScript"
    
    # Копируем скомпилированные файлы в правильную структуру
    if [ -d "backend/dist" ]; then
        echo "🔄 Организация файлов по модулям..."
        
        # Находим все .js файлы и организуем их
        find backend/dist -name "*.js" -type f | while IFS= read -r file; do
            filename=$(basename "$file")
            dirname=$(dirname "$file")
            
            # Определяем назначение по имени файла
            if [[ "$filename" == *"machine"* ]]; then
                mkdir -p backend/dist/src/modules/machines
                cp "$file" "backend/dist/src/modules/machines/" 2>/dev/null
            elif [[ "$filename" == *"operation"* ]]; then
                mkdir -p backend/dist/src/modules/operations
                cp "$file" "backend/dist/src/modules/operations/" 2>/dev/null
            elif [[ "$filename" == *"order"* ]]; then
                mkdir -p backend/dist/src/modules/orders
                cp "$file" "backend/dist/src/modules/orders/" 2>/dev/null
            elif [[ "$filename" == *"calendar"* ]]; then
                mkdir -p backend/dist/src/modules/calendar
                cp "$file" "backend/dist/src/modules/calendar/" 2>/dev/null
            elif [[ "$filename" == *"entity"* ]]; then
                mkdir -p backend/dist/src/database/entities
                cp "$file" "backend/dist/src/database/entities/" 2>/dev/null
            elif [[ "$filename" == *"migration"* ]]; then
                mkdir -p backend/dist/src/database/migrations
                cp "$file" "backend/dist/src/database/migrations/" 2>/dev/null
            fi
        done
    fi
fi

# Создаем минимальные файлы если их нет
echo ""
echo "🔧 Создание минимальных файлов для запуска..."

# Главный файл приложения
if [ ! -f "backend/dist/src/main.js" ]; then
    cat > backend/dist/src/main.js << 'EOF'
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./app.module');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3001);
  console.log('Application is running on:', await app.getUrl());
}
bootstrap();
EOF
    echo "✅ Создан main.js"
fi

# Базовый app.module.js
if [ ! -f "backend/dist/src/app.module.js" ]; then
    cat > backend/dist/src/app.module.js << 'EOF'
const { Module } = require('@nestjs/common');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { ConfigModule } = require('@nestjs/config');

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'thewho',
      entities: [__dirname + '/database/entities/*.js'],
      synchronize: false,
      migrations: [__dirname + '/database/migrations/*.js'],
      migrationsRun: true,
    }),
  ],
})
class AppModule {}

module.exports = { AppModule };
EOF
    echo "✅ Создан app.module.js"
fi

echo ""
echo "📊 ИТОГ ЭКСТРЕННОГО ВОССТАНОВЛЕНИЯ:"
echo "=================================="

echo "Main файл: $([ -f backend/dist/src/main.js ] && echo '✅ EXISTS' || echo '❌ MISSING')"
echo "App module: $([ -f backend/dist/src/app.module.js ] && echo '✅ EXISTS' || echo '❌ MISSING')"
echo "Machines модуль: $(ls backend/dist/src/modules/machines/ 2>/dev/null | wc -l) файлов"
echo "Operations модуль: $(ls backend/dist/src/modules/operations/ 2>/dev/null | wc -l) файлов"
echo "Orders модуль: $(ls backend/dist/src/modules/orders/ 2>/dev/null | wc -l) файлов"
echo "Calendar модуль: $(ls backend/dist/src/modules/calendar/ 2>/dev/null | wc -l) файлов"
echo "Database entities: $(ls backend/dist/src/database/entities/ 2>/dev/null | wc -l) файлов"

echo ""
echo "🚀 Попытка запуска backend..."
cd backend
node dist/src/main.js &
BACKEND_PID=$!
sleep 5

# Проверяем запуск
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo "✅ Backend успешно запущен (PID: $BACKEND_PID)"
    echo "🌐 Проверьте http://localhost:3001"
    kill $BACKEND_PID
else
    echo "❌ Backend не смог запуститься"
    echo "📋 Проверьте логи и конфигурацию"
fi

cd ..
