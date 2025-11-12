const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ========================================
// 🔧 MIDDLEWARE
// ========================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========================================
// 📝 LOGGING MIDDLEWARE
// ========================================

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========================================
// 🛣️ API ROUTES (必須在靜態檔案之前!)
// ========================================

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// API 健康檢查
app.get('/api', (req, res) => {
  res.json({
    message: 'Backend API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      providers: '/api/auth/providers',
      session: '/api/auth/session'
    }
  });
});

// ========================================
// 🏠 提供前端靜態檔案 (生產環境)
// ========================================

if (isProduction) {
  // 提供 build 資料夾的靜態檔案
  app.use(express.static(path.join(__dirname, 'build')));

  // 所有非 API 的路由都返回 index.html (支援 React Router)
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} else {
  // 開發環境的首頁
  app.get('/', (req, res) => {
    res.json({
      message: 'Backend API is running in development mode',
      note: 'Frontend should be running on http://localhost:3000'
    });
  });
}

// ========================================
// ❌ 404 HANDLER (只在開發環境使用)
// ========================================

if (!isProduction) {
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.path
    });
  });
}

// ========================================
// 💥 ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error('💥 Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========================================
// 🚀 START SERVER
// ========================================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (isProduction) {
    console.log('📦 Serving static files from /build');
  } else {
    console.log('🔧 Development mode - API only');
  }
  console.log('🚀 ========================================');
  console.log('');
});
