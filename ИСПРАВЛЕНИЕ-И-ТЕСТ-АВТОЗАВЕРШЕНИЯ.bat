@echo off
echo ===============================================
echo ИСПРАВЛЕНИЕ ОШИБОК ИМПОРТА И ТЕСТ СИСТЕМЫ
echo ===============================================
echo.

echo ✅ Исправлено: Путь импорта PlanningModal
echo    Было: import PlanningModal from '../../components/PlanningModal/PlanningModal';
echo    Стало: import PlanningModal from '../../../components/PlanningModal/PlanningModal';
echo.

echo ✅ Все компоненты созданы:
echo    - OperationCompletionModal.tsx (уведомление о завершении)
echo    - OperationDetailModal.tsx (детали операции) 
echo    - ActiveMachinesMonitor.tsx (обновлен с автопроверкой)
echo.

echo 🔄 Попробуйте запустить frontend:
echo    cd frontend
echo    npm start
echo.

echo 📊 Текущие данные в БД:
cd backend
call npx ts-node -e "
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:magarel@localhost:5432/thewho'
});

async function showTestData() {
  try {
    await client.connect();
    
    console.log('📋 Смены для тестирования автозавершения:');
    const shifts = await client.query(\`
      SELECT 
        sr.id,
        sr.\"machineId\",
        sr.\"drawingnumber\",
        sr.\"dayShiftQuantity\",
        sr.\"nightShiftQuantity\",
        sr.\"dayShiftOperator\",
        sr.\"nightShiftOperator\",
        (sr.\"dayShiftQuantity\" + sr.\"nightShiftQuantity\") as total
      FROM shift_records sr
      WHERE sr.\"drawingnumber\" = 'C6HP0021A'
      ORDER BY sr.\"createdAt\" DESC
      LIMIT 5
    \`);
    
    let totalForC6HP = 0;
    shifts.rows.forEach(shift => {
      const shiftTotal = (shift.dayShiftQuantity || 0) + (shift.nightShiftQuantity || 0);
      totalForC6HP += shiftTotal;
      console.log(\`  🏭 Станок \${shift.machineId}: \${shift.dayShiftQuantity || 0} (день) + \${shift.nightShiftQuantity || 0} (ночь) = \${shiftTotal}\`);
      console.log(\`     Операторы: \${shift.dayShiftOperator || '-'} / \${shift.nightShiftOperator || '-'}\`);
    });
    
    console.log(\`\\n🎯 ИТОГО для C6HP0021A: \${totalForC6HP} из 30 штук\`);
    
    if (totalForC6HP >= 30) {
      console.log('🎉 СИСТЕМА ДОЛЖНА ПОКАЗАТЬ МОДАЛЬНОЕ ОКНО ЗАВЕРШЕНИЯ!');
    } else {
      console.log(\`⏳ Нужно еще \${30 - totalForC6HP} штук для автозавершения\`);
    }
    
    console.log('\\n🏭 Активные станки:');
    const machines = await client.query('SELECT id, \"machineName\", \"machineType\" FROM machines LIMIT 5');
    machines.rows.forEach(machine => {
      console.log(\`  \${machine.id}: \${machine.machineName} (\${machine.machineType})\`);
    });
    
    await client.end();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    await client.end();
  }
}

showTestData();
"

echo.
echo ===============================================
echo 🎯 ИНСТРУКЦИЯ ДЛЯ ТЕСТИРОВАНИЯ:
echo ===============================================
echo.
echo 1. Запустите frontend: npm start
echo 2. Перейдите в раздел "Смены" → "Мониторинг производства"
echo 3. Найдите станок с операцией C6HP0021A
echo 4. Добавьте записи смен так, чтобы сумма достигла 30 штук
echo 5. Система автоматически покажет уведомление о завершении
echo.
echo 🎬 Ожидаемое поведение:
echo - При достижении 30 штук появится модальное окно
echo - Три кнопки: ЗАКРЫТЬ / ПРОДОЛЖИТЬ / СПЛАНИРОВАТЬ  
echo - При выборе "Спланировать" откроется окно планирования
echo.
echo ✅ Функционал готов к использованию!
echo.
pause
