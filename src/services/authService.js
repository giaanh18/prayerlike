// src/services/authService.js

import ApiService from './api';

// ✅ Define API base URL directly
const API_BASE_URL = 'https://pray-api.yalinelena.church';

const authService = {
  /**
   * ✅ Lấy danh sách OAuth Providers (ĐÃ FIX FALLBACK)
   */
  getProviders: async () => {
    try {
      console.log('📋 Fetching OAuth providers...');
      
      const result = await ApiService.getAuthProviders();
      
      console.log('📦 API result:', result);
      
      // ✅ Nếu thành công và có providers
      if (result.success && result.providers && result.providers.length > 0) {
        console.log('✅ Providers loaded:', result.providers);
        return result;
      }
      
      // ✅ Nếu thất bại hoặc rỗng, dùng default
      console.warn('⚠️ API failed or empty, using default providers');
      
      return {
        success: true,
        providers: [
          { 
            name: 'google', 
            display_name: 'Google', 
            enabled: true,
            type: 'oauth'
          },
          { 
            name: 'facebook', 
            display_name: 'Facebook', 
            enabled: true,
            type: 'oauth'
          },
          { 
            name: 'apple', 
            display_name: 'Apple', 
            enabled: true,
            type: 'oauth'
          }
        ],
        message: 'Using default providers',
        fallback: true
      };
      
    } catch (error) {
      console.error('❌ Get providers failed:', error);
      
      // ✅ Nếu lỗi, vẫn trả về default providers
      return {
        success: true,
        providers: [
          { name: 'google', display_name: 'Google', enabled: true, type: 'oauth' },
          { name: 'facebook', display_name: 'Facebook', enabled: true, type: 'oauth' },
          { name: 'apple', display_name: 'Apple', enabled: true, type: 'oauth' }
        ],
        error: error.message,
        fallback: true
      };
    }
  },

  /**
   * ✅ Bắt đầu OAuth Login Flow
   */
  startOAuthLogin: (provider) => {
    try {
      console.log(`🔐 Starting OAuth login with ${provider}`);
      console.log('📍 Current location:', window.location.href);
      
      // ✅ VALIDATE PROVIDER
      const validProviders = ['google', 'facebook', 'apple'];
      const normalizedProvider = provider.toLowerCase();
      
      if (!validProviders.includes(normalizedProvider)) {
        console.error(`❌ Invalid provider: ${provider}`);
        alert(`Provider "${provider}" không được hỗ trợ. Vui lòng chọn Google, Facebook hoặc Apple.`);
        return;
      }
      
      // ✅ Lưu current path để redirect về sau khi login thành công
      const currentPath = window.location.pathname;
      sessionStorage.setItem('oauth_return_path', currentPath);
      console.log('💾 Saved return path:', currentPath);
      
      // ✅ Tạo success_url - nơi backend sẽ redirect về sau khi OAuth thành công
      const successUrl = `${window.location.origin}/auth/callback`;
      
      // ✅ Tạo OAuth login URL với provider đúng
      const loginUrl = `${API_BASE_URL}/auth/${normalizedProvider}/login?success_url=${encodeURIComponent(successUrl)}`;
      
      console.log('🔗 OAuth URL:', loginUrl);
      console.log('🔗 Success URL:', successUrl);
      console.log('🚀 Redirecting to OAuth provider...');
      
      // ✅ Redirect đến OAuth provider
      window.location.href = loginUrl;
      
    } catch (error) {
      console.error('❌ Start OAuth failed:', error);
      alert('無法啟動社交登入，請稍後再試');
    }
  },

  /**
   * ✅ Xử lý OAuth Callback (sau khi redirect về từ provider)
   */
  handleOAuthCallback: async (urlParams) => {
    try {
      console.log('🔐 Handling OAuth callback...');
      console.log('📦 URL params:', urlParams);
      
      // ✅ Lấy token và user từ URL params
      const token = urlParams.get('token');
      const userJson = urlParams.get('user');
      const error = urlParams.get('error');
      
      // ✅ Kiểm tra lỗi từ backend
      if (error) {
        console.error('❌ OAuth error:', error);
        return {
          success: false,
          error: decodeURIComponent(error)
        };
      }
      
      // ✅ Kiểm tra token
      if (!token) {
        console.error('❌ No token in callback URL');
        return {
          success: false,
          error: 'No authentication token received'
        };
      }
      
      // ✅ Parse user data
      let user = null;
      if (userJson) {
        try {
          user = JSON.parse(decodeURIComponent(userJson));
          console.log('👤 User data:', user);
        } catch (e) {
          console.error('❌ Failed to parse user data:', e);
        }
      }
      
      // ✅ Lưu session
      const sessionData = {
        access_token: token,
        user: user,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
      console.log('✅ Session saved');
      
      return {
        success: true,
        token: token,
        user: user,
        session: sessionData
      };
      
    } catch (error) {
      console.error('❌ Handle OAuth callback failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ✅ Lấy session hiện tại
   */
  getSession: async () => {
    try {
      console.log('🔍 Getting session...');
      
      // ✅ Thử lấy từ sessionStorage trước
      const localSession = sessionStorage.getItem('auth_session');
      if (localSession) {
        try {
          const session = JSON.parse(localSession);
          console.log('✅ Found local session:', session);
          return {
            success: true,
            user: session.user,
            session: session,
            access_token: session.access_token
          };
        } catch (e) {
          console.error('❌ Failed to parse local session:', e);
        }
      }
      
      // ✅ Nếu không có local session, gọi API
      const result = await ApiService.getAuthSession();
      
      if (result.success && result.user) {
        // ✅ Lưu session vào local
        const sessionData = {
          access_token: result.session?.access_token,
          user: result.user,
          timestamp: Date.now()
        };
        sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
        
        return {
          success: true,
          user: result.user,
          session: result.session,
          access_token: result.session?.access_token,
          refresh_token: result.session?.refresh_token
        };
      }
      
      return {
        success: false,
        error: result.message || 'No session found',
        requireLogin: result.requireLogin
      };
      
    } catch (error) {
      console.error('❌ Get session failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ✅ Gửi Email Xác Thực (với demo mode fallback)
   */
  sendVerificationEmail: async (email) => {
    try {
      console.log('📧 Sending verification email to:', email);
      
      // TODO: Uncomment khi có API thực
      // const result = await ApiService.sendVerificationEmail(email);
      // if (result.success) {
      //   return result;
      // }
      
      // ✅ TẠM THỜI: Mock response với demo code
      console.log('📧 Using demo mode (backend not ready)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate demo code
      const demoCode = '123456';
      
      console.log(`✅ Demo verification code: ${demoCode}`);
      
      return {
        success: true,
        message: 'Verification code sent (demo mode)',
        demo: true,
        code: demoCode
      };
      
    } catch (error) {
      console.error('❌ Send verification email failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ✅ Verify Email Code (với demo mode)
   */
  verifyEmailCode: async (email, code) => {
    try {
      console.log('🔍 Verifying code:', code, 'for email:', email);
      
      // TODO: Uncomment khi có API thực
      // const result = await ApiService.verifyEmailCode(email, code);
      // if (result.success) {
      //   return result;
      // }
      
      // ✅ TẠM THỜI: Accept demo code
      if (code === '123456') {
        console.log('✅ Demo code verified');
        
        // Generate mock user data
        const mockUser = {
          id: 'user_' + Date.now(),
          email: email,
          emailVerified: true,
          createdAt: new Date().toISOString()
        };
        
        return {
          success: true,
          message: 'Code verified (demo mode)',
          demo: true,
          user: mockUser
        };
      }
      
      return {
        success: false,
        error: 'Invalid verification code'
      };
      
    } catch (error) {
      console.error('❌ Verify email code failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ✅ Verify Email Token (từ email link)
   */
  verifyEmail: async (token, type) => {
    try {
      console.log('📧 Verifying email with token:', token, 'type:', type);
      
      // TODO: Implement API call khi có endpoint
      // const result = await ApiService.verifyEmail(token, type);
      // return result;
      
      // ✅ Tạm thời return mock data
      console.log('✅ Email verified (demo mode)');
      
      return {
        success: true,
        data: {
          userId: 'user_' + Date.now(),
          user: {
            id: 'user_' + Date.now(),
            email: 'verified@email.com',
            name: 'Verified User',
            emailVerified: true
          },
          session: {
            access_token: 'token_' + Date.now()
          }
        },
        message: 'Email verified successfully (demo mode)',
        demo: true
      };
    } catch (error) {
      console.error('❌ Verify email failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ✅ Register User
   */
  register: async (signupData) => {
    try {
      console.log('📝 Registering user:', signupData);
      
      // TODO: Implement API call khi có endpoint
      // const result = await ApiService.register(signupData);
      // return result;
      
      // ✅ Tạm thời return mock data
      console.log('✅ User registered (demo mode)');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        requireEmailVerification: false, // Set false vì đã verify ở bước trước
        message: '註冊成功！',
        data: {
          userId: signupData.userId,
          email: signupData.email,
          user: {
            id: signupData.userId,
            email: signupData.email,
            name: signupData.name,
            phone: signupData.phone,
            emailVerified: true
          }
        },
        demo: true
      };
    } catch (error) {
      console.error('❌ Register failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * ✅ Logout
   */
  logout: async () => {
    try {
      console.log('🚪 Logging out...');
      
      // ✅ Clear local session
      sessionStorage.removeItem('auth_session');
      sessionStorage.removeItem('oauth_return_path');
      console.log('🗑️ Local session cleared');
      
      // ✅ Call API logout
      try {
        const result = await ApiService.logout();
        console.log('✅ Server logout successful');
        return result;
      } catch (error) {
        console.warn('⚠️ Server logout failed, but local session cleared:', error);
        return {
          success: true,
          message: 'Logged out locally'
        };
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      return {
        success: true, // Vẫn return success để clear local data
        message: 'Logged out locally'
      };
    }
  },

  /**
   * ✅ Check if user is authenticated
   */
  isAuthenticated: () => {
    try {
      const session = sessionStorage.getItem('auth_session');
      if (!session) {
        return false;
      }
      
      const sessionData = JSON.parse(session);
      
      // ✅ Kiểm tra session có hợp lệ không (ví dụ: chưa expire)
      const now = Date.now();
      const sessionAge = now - (sessionData.timestamp || 0);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (sessionAge > maxAge) {
        console.warn('⚠️ Session expired');
        sessionStorage.removeItem('auth_session');
        return false;
      }
      
      return !!sessionData.access_token;
    } catch (error) {
      console.error('❌ Check authentication failed:', error);
      return false;
    }
  },

  /**
   * ✅ Get current user
   */
  getCurrentUser: () => {
    try {
      const session = sessionStorage.getItem('auth_session');
      if (!session) {
        return null;
      }
      
      const sessionData = JSON.parse(session);
      return sessionData.user || null;
    } catch (error) {
      console.error('❌ Get current user failed:', error);
      return null;
    }
  },

  /**
   * ✅ Get access token
   */
  getAccessToken: () => {
    try {
      const session = sessionStorage.getItem('auth_session');
      if (!session) {
        return null;
      }
      
      const sessionData = JSON.parse(session);
      return sessionData.access_token || null;
    } catch (error) {
      console.error('❌ Get access token failed:', error);
      return null;
    }
  }
};

export default authService;
