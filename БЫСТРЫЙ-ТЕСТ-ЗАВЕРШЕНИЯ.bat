@echo off
echo ===========================================
echo БЫСТРЫЙ ТЕСТ ЗАВЕРШЕНИЯ ОПЕРАЦИЙ
echo ===========================================
echo.

echo Тестируем логику автоматического завершения...
echo.

echo 1. Проверяем текущие данные смен в БД:
cd backend
call npx ts-node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:magarel@localhost:5432/thewho'
});

async function checkShifts() {
  try {
    await client.connect();
    
    console.log('📊 Текущие смены с количеством деталей:');
    const shifts = await client.query(`
      SELECT 
        id,
        \"machineId\",
        drawingnumber,
        \"dayShiftQuantity\",
        \"nightShiftQuantity\",
        (\"dayShiftQuantity\" + \"nightShiftQuantity\") as total,
        \"dayShiftOperator\",
        \"nightShiftOperator\"
      FROM shift_records 
      ORDER BY \"createdAt\" DESC 
      LIMIT 5
    `);
    
    shifts.rows.forEach(shift => {
      console.log(\`  ID: \${shift.id}\`);
      console.log(\`  Станок: \${shift.machineId}\`);
      console.log(\`  Чертеж: \${shift.drawingnumber}\`);
      console.log(\`  День: \${shift.dayShiftQuantity || 0} (\${shift.dayShiftOperator || '-'})\`);
      console.log(\`  Ночь: \${shift.nightShiftQuantity || 0} (\${shift.nightShiftOperator || '-'})\`);
      console.log(\`  ИТОГО: \${shift.total || 0} деталей\`);
      
      if (shift.total >= 30) {
        console.log(\`  🎉 ЗАВЕРШЕНО! \${shift.total} >= 30 - должно показать уведомление\`);
      } else {
        console.log(\`  ⏳ В процессе: \${shift.total}/30\`);
      }
      
      console.log('  ---');
    });
    
    await client.end();
  } catch (error) {
    console.error('Ошибка:', error);
  }
}

checkShifts();
"

echo.
echo 2. Логика работы системы:
echo    ✅ Система каждые 3-5 секунд проверяет прогресс операций
echo    ✅ Когда День + Ночь >= 30 штук, показывается уведомление
echo    ✅ Три варианта: Закрыть / Продолжить / Спланировать
echo    ✅ При планировании используется существующий PlanningModal
echo.

echo 3. Для тестирования:
echo    - Запустите frontend: npm start
echo    - Откройте "Мониторинг производства" 
echo    - Добавьте записи смен до достижения 30 штук
echo    - Система автоматически покажет уведомление
echo.

echo ===========================================
echo ✅ СИСТЕМА ГОТОВА К ТЕСТИРОВАНИЮ
echo ===========================================
pause
