const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 Настройка proxy на http://localhost:5100');
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5100',
      changeOrigin: true,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxy запрос:', req.method, req.url, '-> http://localhost:5100');
        
        // Удаляем большие заголовки
        const headersToRemove = ['cookie', 'referer'];
        headersToRemove.forEach(header => {
          proxyReq.removeHeader(header);
        });
        
        // Ограничиваем размер user-agent
        const userAgent = proxyReq.getHeader('user-agent');
        if (userAgent && userAgent.length > 200) {
          proxyReq.setHeader('user-agent', 'Mozilla/5.0');
        }
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err);
        res.status(500).send('Proxy error');
      }
    })
  );

  console.log('✅ Proxy настроен на http://localhost:5100');
};
