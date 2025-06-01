const http = require('http');

// Простой тест сервер на порту 3001
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${req.method} ${req.url}`);

  if (req.url === '/api/orders/import-excel' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Тестовый импорт успешен',
      result: {
        created: 5,
        updated: 0,
        skipped: 2,
        errors: []
      }
    }));
  } else if (req.url === '/api/orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      data: [
        {
          id: '1',
          drawingNumber: 'TEST-001',
          quantity: 10,
          deadline: '2025-06-01',
          priority: 2,
          operations: []
        }
      ],
      total: 1
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: `Cannot ${req.method} ${req.url}`,
      error: 'Not Found',
      statusCode: 404
    }));
  }
});

server.listen(3001, () => {
  console.log('🚀 Тестовый сервер запущен на порту 3001');
  console.log('📡 Доступные эндпоинты:');
  console.log('   GET  http://localhost:3001/api/orders');
  console.log('   POST http://localhost:3001/api/orders/import-excel');
});
