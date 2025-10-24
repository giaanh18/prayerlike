// src/services/authApi.js
const BASE_URL = 'https://pray-api.yalinelena.church';

class AuthAPI {
  // ✅ 1. Lấy danh sách providers (Google, Facebook, Apple)
  static async getProviders() {
    try {
      const response = await fetch(`${BASE_URL}/auth/providers`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ getProviders error:', error);
      throw error;
    }
  }

  // ✅ 2. Gửi OTP qua email
  static async requestOTP(email) {
    try {
      const response = await fetch(`${BASE_URL}/auth/otp/request`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        // Xử lý lỗi từ API
        if (response.status === 422 && data.detail) {
          const errorMsg = Array.isArray(data.detail) 
            ? data.detail[0]?.msg || 'Validation error'
            : data.detail;
          throw new Error(errorMsg);
        }
        throw new Error(data.detail || 'Failed to send OTP');
      }

      return data;
    } catch (error) {
      console.error('❌ requestOTP error:', error);
      throw error;
    }
  }

  // ✅ 3. Xác thực OTP
  static async verifyOTP(email, code) {
    try {
      const response = await fetch(`${BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include', // ⭐ Quan trọng: Lưu cookie session
        body: JSON.stringify({ 
          email, 
          code  // ⚠️ Đúng field name theo API
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.detail) {
          const errorMsg = Array.isArray(data.detail) 
            ? data.detail[0]?.msg || 'Validation error'
            : data.detail;
          throw new Error(errorMsg);
        }
        throw new Error(data.detail || 'Invalid OTP');
      }

      return data;
    } catch (error) {
      console.error('❌ verifyOTP error:', error);
      throw error;
    }
  }

  // ✅ 4. Kiểm tra session hiện tại
  static async getSession() {
    try {
      const response = await fetch(`${BASE_URL}/auth/session`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include' // ⭐ Gửi cookie
      });

      if (!response.ok) {
        throw new Error('Failed to get session');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ getSession error:', error);
      throw error;
    }
  }

  // ✅ 5. Lấy thông tin profile (cần authenticated)
  static async getProfile() {
    try {
      const response = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include' // ⭐ Gửi cookie
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to get profile');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ getProfile error:', error);
      throw error;
    }
  }

  // ✅ 6. Cập nhật profile (first login)
  static async updateProfile(name, user_id) {
    try {
      const response = await fetch(`${BASE_URL}/auth/profile`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name, user_id })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized');
        }
        if (response.status === 422 && data.detail) {
          const errorMsg = Array.isArray(data.detail) 
            ? data.detail[0]?.msg || 'Validation error'
            : data.detail;
          throw new Error(errorMsg);
        }
        throw new Error(data.detail || 'Failed to update profile');
      }

      return data;
    } catch (error) {
      console.error('❌ updateProfile error:', error);
      throw error;
    }
  }

  // ✅ 7. Refresh token
  static async refreshToken() {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ refreshToken error:', error);
      throw error;
    }
  }

  // ✅ 8. Đăng xuất
  static async logout() {
    try {
      const response = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      return await response.json();
    } catch (error) {
      console.error('❌ logout error:', error);
      throw error;
    }
  }
}

export default AuthAPI;
