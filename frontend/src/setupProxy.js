const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      changeOrigin: true,
      onProxyReq: (proxyReq, req, res) => {
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
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error');
      }
    })
  );
};
