// src/setupProxy.js

const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  
  // ========================================
  // 🔄 AUTH API PROXY (LOCAL BACKEND)
  // ========================================
  
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:5000',  // ✅ Backend base URL
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      pathRewrite: {
        '^/auth': '/api/auth'  // ✅ /auth/providers → /api/auth/providers
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxy Auth Request:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy Auth Response:', proxyRes.statusCode, req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy Auth Error:', err.message);
        res.status(500).json({
          success: false,
          message: 'Auth proxy error',
          error: err.message
        });
      }
    })
  );
  
  // ========================================
  // 🔄 CMS API PROXY (EXTERNAL API)
  // ========================================
  
  app.use(
    '/cms',
    createProxyMiddleware({
      target: 'https://zien.54ucl.com',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔄 Proxy CMS Request:', req.method, req.url);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('✅ Proxy CMS Response:', proxyRes.statusCode, req.url);
      },
      onError: (err, req, res) => {
        console.error('❌ Proxy CMS Error:', err.message);
        res.status(500).json({
          success: false,
          message: 'CMS proxy error',
          error: err.message
        });
      }
    })
  );
  
};
