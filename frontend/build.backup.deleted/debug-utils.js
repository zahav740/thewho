/**
 * @file: debug-utils.js
 * @description: Утилиты для отладки ошибки 400
 * @created: 2025-06-01
 */

// Сохраняем оригинальные методы fetch и XMLHttpRequest
const originalFetch = window.fetch;
const originalXMLHttpRequest = window.XMLHttpRequest;

// Переопределяем метод fetch для логирования
window.fetch = async function(...args) {
  console.log('🔍 FETCH REQUEST:', args);
  try {
    const response = await originalFetch.apply(this, args);
    const clonedResponse = response.clone();
    
    try {
      const contentType = clonedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await clonedResponse.json();
        console.log('✅ FETCH RESPONSE:', {
          status: clonedResponse.status,
          url: clonedResponse.url,
          data
        });
      } else {
        console.log('✅ FETCH RESPONSE (non-JSON):', {
          status: clonedResponse.status,
          url: clonedResponse.url
        });
      }
    } catch (parseError) {
      console.log('✅ FETCH RESPONSE (parse failed):', {
        status: clonedResponse.status,
        url: clonedResponse.url,
        error: parseError.message
      });
    }
    
    return response;
  } catch (error) {
    console.error('❌ FETCH ERROR:', error);
    throw error;
  }
};

// Переопределяем XMLHttpRequest для логирования
window.XMLHttpRequest = function() {
  const xhr = new originalXMLHttpRequest();
  
  // Сохраняем оригинальные методы
  const originalOpen = xhr.open;
  const originalSend = xhr.send;
  
  let requestMethod;
  let requestUrl;
  let requestData;
  
  // Переопределяем метод open
  xhr.open = function(...args) {
    requestMethod = args[0];
    requestUrl = args[1];
    console.log('🔍 XHR OPEN:', { method: requestMethod, url: requestUrl });
    return originalOpen.apply(xhr, args);
  };
  
  // Переопределяем метод send
  xhr.send = function(data) {
    requestData = data;
    
    // Пытаемся распарсить данные как JSON
    if (typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        console.log('🔍 XHR SEND:', {
          method: requestMethod,
          url: requestUrl,
          data: jsonData
        });
        
        // Глубокая диагностика данных заказа
        if (jsonData && jsonData.operations && Array.isArray(jsonData.operations)) {
          console.log('🔬 OPERATIONS DATA TYPES:');
          jsonData.operations.forEach((op, index) => {
            console.log(`Operation ${index}:`, {
              operationNumber: op.operationNumber + ' (type: ' + typeof op.operationNumber + ')',
              operationType: op.operationType + ' (type: ' + typeof op.operationType + ')',
              machineAxes: op.machineAxes + ' (type: ' + typeof op.machineAxes + ')',
              estimatedTime: op.estimatedTime + ' (type: ' + typeof op.estimatedTime + ')',
              id: op.id ? op.id + ' (type: ' + typeof op.id + ')' : 'undefined',
            });
          });
        }
        
        // Проверка на потенциальные проблемы
        if (jsonData.priority !== undefined) {
          console.log('🔬 PRIORITY:', jsonData.priority, '(type: ' + typeof jsonData.priority + ')');
        }
      } catch (e) {
        console.log('🔍 XHR SEND (non-JSON):', {
          method: requestMethod,
          url: requestUrl,
          dataSize: data ? data.length : 0
        });
      }
    } else {
      console.log('🔍 XHR SEND (non-string):', {
        method: requestMethod,
        url: requestUrl,
        dataType: data ? typeof data : 'null'
      });
    }
    
    // Добавляем слушателей событий для отслеживания ответа
    xhr.addEventListener('load', function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          console.log('✅ XHR RESPONSE:', {
            status: xhr.status,
            url: requestUrl,
            data: responseData
          });
        } catch (e) {
          console.log('✅ XHR RESPONSE (parse failed):', {
            status: xhr.status,
            url: requestUrl,
            responseText: xhr.responseText ? xhr.responseText.substring(0, 500) + '...' : null
          });
        }
      } else {
        try {
          const responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          console.error('❌ XHR ERROR RESPONSE:', {
            status: xhr.status,
            url: requestUrl,
            data: responseData,
            requestData: requestData
          });
          
          // Для ошибок 400 показываем детальное сравнение
          if (xhr.status === 400 && typeof requestData === 'string') {
            try {
              const reqData = JSON.parse(requestData);
              console.error('🚨 BAD REQUEST ANALYSIS:');
              console.error('Request data structure:', Object.keys(reqData));
              
              if (reqData.operations && Array.isArray(reqData.operations)) {
                console.error('Operations structure:', Object.keys(reqData.operations[0]));
                
                // Проверка на наличие запрещенных полей
                const knownFields = ['id', 'operationNumber', 'operationType', 'machineAxes', 'estimatedTime', 'status', 'completedUnits'];
                const unknownFields = reqData.operations.reduce((acc, op) => {
                  Object.keys(op).forEach(key => {
                    if (!knownFields.includes(key) && !acc.includes(key)) {
                      acc.push(key);
                    }
                  });
                  return acc;
                }, []);
                
                if (unknownFields.length > 0) {
                  console.error('⚠️ Unknown fields in operations:', unknownFields);
                }
                
                // Попытка выявить проблему с форматированием
                const fixedData = JSON.parse(JSON.stringify(reqData));
                
                // Пробуем разные форматы machineAxes
                if (fixedData.operations) {
                  console.error('⚙️ ATTEMPTING DATA FIXES FOR NEXT REQUEST:');
                  
                  // Fix 1: Преобразование machineAxes в строку с суффиксом
                  console.error('Fix 1: machineAxes as string with suffix');
                  const fix1 = JSON.parse(JSON.stringify(fixedData));
                  fix1.operations = fix1.operations.map(op => ({
                    ...op,
                    machineAxes: `${op.machineAxes}-axis`
                  }));
                  console.error('Fix 1 Data:', fix1);
                  
                  // Fix 2: Преобразование всех числовых полей в строки
                  console.error('Fix 2: all numeric fields as strings');
                  const fix2 = JSON.parse(JSON.stringify(fixedData));
                  fix2.operations = fix2.operations.map(op => ({
                    ...op,
                    operationNumber: String(op.operationNumber),
                    machineAxes: String(op.machineAxes),
                    estimatedTime: String(op.estimatedTime)
                  }));
                  console.error('Fix 2 Data:', fix2);
                  
                  // Сохраняем фиксы в глобальную переменную для тестирования
                  window._debug = {
                    originalData: reqData,
                    fix1,
                    fix2,
                    apply: async (fixNumber) => {
                      const fix = window._debug[`fix${fixNumber}`];
                      if (!fix) {
                        console.error(`Fix ${fixNumber} not found`);
                        return;
                      }
                      
                      // Извлекаем ID заказа из URL
                      const urlMatch = requestUrl.match(/\/orders\/(\d+)/);
                      if (!urlMatch) {
                        console.error('Could not extract order ID from URL');
                        return;
                      }
                      
                      const orderId = urlMatch[1];
                      console.log(`Applying fix ${fixNumber} to order ${orderId}...`);
                      
                      try {
                        const response = await fetch(`/api/orders/${orderId}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify(fix)
                        });
                        
                        if (response.ok) {
                          console.log(`✅ Fix ${fixNumber} SUCCESSFUL!`);
                          const data = await response.json();
                          console.log('Response data:', data);
                          return data;
                        } else {
                          console.error(`❌ Fix ${fixNumber} FAILED with status ${response.status}`);
                          try {
                            const errorData = await response.json();
                            console.error('Error data:', errorData);
                          } catch (e) {
                            console.error('Could not parse error response');
                          }
                        }
                      } catch (e) {
                        console.error(`Error applying fix ${fixNumber}:`, e);
                      }
                    }
                  };
                  
                  console.error('Try different fixes in console with window._debug.apply(1) or window._debug.apply(2)');
                }
              }
            } catch (e) {
              console.error('Error analyzing bad request:', e);
            }
          }
        } catch (e) {
          console.error('❌ XHR ERROR RESPONSE (parse failed):', {
            status: xhr.status,
            url: requestUrl,
            responseText: xhr.responseText ? xhr.responseText.substring(0, 500) + '...' : null
          });
        }
      }
    });
    
    xhr.addEventListener('error', function() {
      console.error('❌ XHR NETWORK ERROR:', {
        url: requestUrl
      });
    });
    
    return originalSend.apply(xhr, arguments);
  };
  
  return xhr;
};

// Добавляем глобальную функцию для отключения перехвата
window.disableDebugHooks = function() {
  window.fetch = originalFetch;
  window.XMLHttpRequest = originalXMLHttpRequest;
  console.log('Debug hooks disabled');
};

console.log('✅ Debug hooks initialized. Call window.disableDebugHooks() to disable.');

// Инструменты для разрешения проблемы с ошибкой 400
window.orderDebugTools = {
  // Простой запрос для тестирования соединения
  pingBackend: async () => {
    try {
      const response = await fetch('/api/orders?limit=1');
      if (response.ok) {
        console.log('✅ Backend connection successful');
        return await response.json();
      } else {
        console.error('❌ Backend connection failed:', response.status);
      }
    } catch (e) {
      console.error('❌ Backend connection error:', e);
    }
  },
  
  // Попытка создать минимальный заказ без операций
  createMinimalOrder: async () => {
    const minimalOrder = {
      drawingNumber: `TEST-${Date.now()}`,
      quantity: 1,
      deadline: new Date().toISOString().split('T')[0],
      priority: 2,
      workType: 'Test'
    };
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalOrder)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Minimal order created successfully:', data);
        return data;
      } else {
        console.error('❌ Failed to create minimal order:', response.status);
        try {
          const errorData = await response.json();
          console.error('Error data:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
      }
    } catch (e) {
      console.error('❌ Error creating minimal order:', e);
    }
  },
  
  // Попытка добавить одну простую операцию к существующему заказу
  addSimpleOperation: async (orderId) => {
    if (!orderId) {
      console.error('Order ID is required');
      return;
    }
    
    try {
      // Сначала получаем текущий заказ
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        console.error(`❌ Failed to get order ${orderId}`);
        return;
      }
      
      const order = await orderResponse.json();
      console.log('Current order:', order);
      
      // Создаем копию заказа с одной простой операцией
      const updatedOrder = {
        ...order,
        operations: [
          {
            operationNumber: 1,
            operationType: 'milling',
            machineAxes: '3-axis', // Строка с суффиксом
            estimatedTime: 60
          }
        ]
      };
      
      // Отправляем обновление
      const updateResponse = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedOrder)
      });
      
      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        console.log('✅ Operation added successfully:', updatedData);
        return updatedData;
      } else {
        console.error('❌ Failed to add operation:', updateResponse.status);
        try {
          const errorData = await updateResponse.json();
          console.error('Error data:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
      }
    } catch (e) {
      console.error('❌ Error adding operation:', e);
    }
  },
  
  // Прямая отправка запроса PUT с заданным форматом данных
  directUpdate: async (orderId, format) => {
    if (!orderId) {
      console.error('Order ID is required');
      return;
    }
    
    try {
      // Создаем тестовый заказ
      const testOrder = {
        drawingNumber: `TEST-DIRECT-${Date.now()}`,
        quantity: 1,
        deadline: new Date().toISOString().split('T')[0],
        priority: 2,
        workType: 'Test Direct'
      };
      
      // Добавляем операцию в нужном формате
      if (format === 'string') {
        testOrder.operations = [
          {
            operationNumber: "1",
            operationType: "milling",
            machineAxes: "3-axis",
            estimatedTime: "60"
          }
        ];
      } else if (format === 'number') {
        testOrder.operations = [
          {
            operationNumber: 1,
            operationType: "milling",
            machineAxes: 3,
            estimatedTime: 60
          }
        ];
      } else if (format === 'mixed') {
        testOrder.operations = [
          {
            operationNumber: 1,
            operationType: "milling",
            machineAxes: "3-axis",
            estimatedTime: 60
          }
        ];
      } else {
        console.error('Unknown format. Use "string", "number", or "mixed"');
        return;
      }
      
      console.log(`Sending ${format} format update...`);
      
      // Отправляем обновление
      const updateResponse = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testOrder)
      });
      
      if (updateResponse.ok) {
        const updatedData = await updateResponse.json();
        console.log(`✅ ${format} format update successful:`, updatedData);
        return updatedData;
      } else {
        console.error(`❌ ${format} format update failed:`, updateResponse.status);
        try {
          const errorData = await updateResponse.json();
          console.error('Error data:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
      }
    } catch (e) {
      console.error(`❌ Error in ${format} format update:`, e);
    }
  }
};

console.log('✅ Order debug tools available. Use window.orderDebugTools to access them.');
console.log('Examples:');
console.log('1. Test backend connection: window.orderDebugTools.pingBackend()');
console.log('2. Create minimal order: window.orderDebugTools.createMinimalOrder()');
console.log('3. Add simple operation: window.orderDebugTools.addSimpleOperation(orderId)');
console.log('4. Test different formats: window.orderDebugTools.directUpdate(orderId, "string|number|mixed")');
