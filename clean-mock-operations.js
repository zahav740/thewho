const axios = require('axios');

const API_BASE = 'http://localhost:5100/api';

async function cleanMockOperations() {
    console.log('🧹 Начинаем очистку моковых операций...');
    
    try {
        // Получаем все заказы
        console.log('📋 Получение списка заказов...');
        const ordersResponse = await axios.get(`${API_BASE}/orders?limit=1000`);
        const orders = ordersResponse.data.data;
        
        console.log(`📊 Найдено заказов: ${orders.length}`);
        
        let cleanedOrders = 0;
        let cleanedOperations = 0;
        
        for (const order of orders) {
            const operations = order.operations || [];
            
            // Проверяем, есть ли моковые операции
            const mockOperations = operations.filter(op => 
                (op.operationType === 'MILLING' || op.operationType === 'TURNING') &&
                (op.estimatedTime === 60 || op.estimatedTime === 45) &&
                (op.operationNumber === 1 || op.operationNumber === 2) &&
                (op.machineAxes === 3)
            );
            
            if (mockOperations.length === 2 && operations.length === 2) {
                console.log(`🎯 Заказ ${order.drawingNumber} содержит моковые операции`);
                
                try {
                    // Обновляем заказ с пустыми операциями
                    const updateData = {
                        drawingNumber: order.drawingNumber,
                        quantity: order.quantity,
                        deadline: order.deadline,
                        priority: order.priority,
                        workType: order.workType,
                        operations: [] // Пустые операции
                    };
                    
                    await axios.put(`${API_BASE}/orders/${order.id}`, updateData);
                    
                    cleanedOrders++;
                    cleanedOperations += mockOperations.length;
                    
                    console.log(`✅ Очищен заказ ${order.drawingNumber}`);
                } catch (error) {
                    console.error(`❌ Ошибка при очистке заказа ${order.drawingNumber}:`, error.message);
                }
            } else if (operations.length > 0) {
                console.log(`⚠️ Заказ ${order.drawingNumber} имеет ${operations.length} операций (возможно реальные)`);
            }
        }
        
        console.log('\n🎉 ОЧИСТКА ЗАВЕРШЕНА!');
        console.log(`📊 Статистика:`);
        console.log(`   - Очищено заказов: ${cleanedOrders}`);
        console.log(`   - Удалено моковых операций: ${cleanedOperations}`);
        console.log('\n✅ Теперь операции должны заполняться технологом!');
        
    } catch (error) {
        console.error('❌ Ошибка при очистке:', error.message);
        console.error('🔧 Убедитесь, что backend запущен на порту 5100');
    }
}

async function verifyCleanup() {
    console.log('\n🔍 Проверка результата очистки...');
    
    try {
        const ordersResponse = await axios.get(`${API_BASE}/orders?limit=1000`);
        const orders = ordersResponse.data.data;
        
        let ordersWithOperations = 0;
        let ordersWithoutOperations = 0;
        let totalOperations = 0;
        
        orders.forEach(order => {
            const operationsCount = order.operations?.length || 0;
            totalOperations += operationsCount;
            
            if (operationsCount > 0) {
                ordersWithOperations++;
            } else {
                ordersWithoutOperations++;
            }
        });
        
        console.log('\n📊 РЕЗУЛЬТАТ ПРОВЕРКИ:');
        console.log(`   - Всего заказов: ${orders.length}`);
        console.log(`   - Заказов с операциями: ${ordersWithOperations}`);
        console.log(`   - Заказов без операций: ${ordersWithoutOperations}`);
        console.log(`   - Общее количество операций: ${totalOperations}`);
        
        if (ordersWithoutOperations === orders.length) {
            console.log('\n🎉 ОТЛИЧНО! Все заказы теперь без операций');
            console.log('✅ Технологи могут заполнять операции самостоятельно');
        } else if (ordersWithoutOperations > 0) {
            console.log('\n✅ Частично очищено. Проверьте заказы с операциями');
        } else {
            console.log('\n⚠️ Очистка не выполнена или есть реальные операции');
        }
        
    } catch (error) {
        console.error('❌ Ошибка при проверке:', error.message);
    }
}

// Запуск очистки
if (require.main === module) {
    cleanMockOperations()
        .then(() => verifyCleanup())
        .catch(console.error);
}

module.exports = { cleanMockOperations, verifyCleanup };
