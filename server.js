// server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
// 🛣️ ROUTES
// ========================================

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// ========================================
// 🏠 HOME ROUTE
// ========================================

app.get('/', (req, res) => {
  res.json({
    message: 'Backend API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      providers: '/api/auth/providers',
      session: '/api/auth/session'
    }
  });
});

// ========================================
// ❌ 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

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
  console.log('🚀 ========================================');
  console.log('');
});
