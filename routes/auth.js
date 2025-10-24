const express = require('express');
const router = express.Router();
const passport = require('passport');

// ========================================
// 🔐 GET /api/auth/providers - Lấy danh sách providers
// ========================================

router.get('/providers', async (req, res) => {
  try {
    console.log('📋 GET /api/auth/providers');

    const providers = [
      {
        name: 'google',
        display_name: 'Google',
        enabled: true
      },
      {
        name: 'facebook',
        display_name: 'Facebook',
        enabled: true
      },
      {
        name: 'apple',
        display_name: 'Apple',
        enabled: true
      }
    ];

    res.json({
      success: true,
      providers: providers
    });

  } catch (error) {
    console.error('❌ Providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ========================================
// 🔐 GET /api/auth/session - Lấy session hiện tại
// ========================================

router.get('/session', async (req, res) => {
  try {
    console.log('📋 GET /api/auth/session');
    console.log('🍪 Cookies:', req.cookies);
    console.log('🔑 Session ID:', req.sessionID);
    console.log('👤 Session User:', req.session?.user);

    // Kiểm tra session có tồn tại không
    if (!req.session || !req.session.user) {
      console.log('❌ No valid session found');
      return res.status(404).json({
        success: false,
        message: 'No valid session found'
      });
    }

    // Trả về thông tin session
    res.json({
      success: true,
      session: {
        user: req.session.user,
        authenticated: true,
        sessionID: req.sessionID
      }
    });

  } catch (error) {
    console.error('❌ Session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ========================================
// 🔐 GET /api/auth/callback - OAuth callback
// ========================================

router.get('/callback', async (req, res) => {
  try {
    console.log('📋 GET /api/auth/callback');
    console.log('🔍 Query params:', req.query);

    // Xử lý callback từ OAuth provider
    const { code, state, provider } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Missing authorization code'
      });
    }

    // TODO: Xử lý OAuth callback logic ở đây

    res.json({
      success: true,
      message: 'Callback received',
      data: { code, state, provider }
    });

  } catch (error) {
    console.error('❌ Callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ========================================
// 🔐 POST /api/auth/login - Đăng nhập
// ========================================

router.post('/login', async (req, res) => {
  try {
    console.log('📋 POST /api/auth/login');
    console.log('📦 Body:', req.body);

    const { email, password } = req.body;

    // TODO: Xử lý đăng nhập logic ở đây

    res.json({
      success: true,
      message: 'Login successful',
      user: { email }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ========================================
// 🔐 POST /api/auth/logout - Đăng xuất
// ========================================

router.post('/logout', async (req, res) => {
  try {
    console.log('📋 POST /api/auth/logout');

    // Xóa session
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Logout error:', err);
        return res.status(500).json({
          success: false,
          message: 'Logout failed'
        });
      }

      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logout successful'
      });
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
