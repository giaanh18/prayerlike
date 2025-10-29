const BASE_URL = 'https://pray-api.yalinelena.church';

// ✅ Helper function để tạo headers đúng chuẩn
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
});

// ✅ Helper function để xử lý fetch với error handling tốt hơn
const fetchWithCredentials = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
      mode: 'cors',
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Nếu không parse được JSON, dùng statusText
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Fetch error:', error);
    
    if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
      throw new Error('無法連接到伺服器，請檢查網路連線或聯絡技術支援');
    }
    
    throw error;
  }
};

const AuthAPI = {
  /**
   * ✅ Get available OAuth providers
   */
  async getProviders() {
    return fetchWithCredentials(`${BASE_URL}/auth/providers`, {
      method: 'GET',
    });
  },

  /**
   * ✅ Get current session
   */
  async getSession() {
    return fetchWithCredentials(`${BASE_URL}/auth/session`, {
      method: 'GET',
    });
  },

  /**
   * ✅ Get user profile - 修正處理不同回傳格式
   */
  async getProfile() {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/profile`, {
      method: 'GET',
    });
    
    console.log('📊 Raw profile response:', response);
    
    // ✅ 如果回傳 {ok: true, profile: {...}}，提取 profile
    if (response && response.ok && response.profile) {
      console.log('✅ Extracted profile from response.profile');
      return response.profile;
    }
    
    // ✅ 如果回傳 {ok: false, message: ...}，表示沒有 profile
    if (response && response.ok === false) {
      console.log('⚠️ Profile not found (ok: false)');
      return null;
    }
    
    // ✅ 如果直接回傳 profile 物件
    console.log('✅ Using response as profile directly');
    return response;
  },

  /**
   * ✅ Request OTP for email login
   */
  async requestOTP(email) {
    return fetchWithCredentials(`${BASE_URL}/auth/otp/request`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * ✅ Verify OTP
   */
  async verifyOTP(email, code) {
    try {
      const response = await fetch(`${BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        headers: getHeaders(),
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      
      return {
        ok: response.ok,
        ...data
      };
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      throw error;
    }
  },

  /**
   * ✅ Update user profile
   * @param {Object} profileData - Can include: name, user_id, phone, address, etc.
   */
  async updateProfile(profileData) {
    return fetchWithCredentials(`${BASE_URL}/auth/profile`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  /**
   * ✅ Check if user profile is complete
   * Kiểm tra xem profile có đầy đủ thông tin chưa
   */
  async isProfileComplete() {
    try {
      const profile = await this.getProfile();
      console.log('📋 Checking profile completeness:', profile);
      
      // ✅ Nếu profile null hoặc undefined → chưa complete
      if (!profile) {
        console.log('⚠️ Profile is null or undefined → not complete');
        return false;
      }
      
      // ✅ OPTION 1: Nếu backend có flag is_profile_complete
      if (profile.is_profile_complete !== undefined) {
        console.log('✅ Using backend flag:', profile.is_profile_complete);
        return profile.is_profile_complete;
      }
      
      // ✅ OPTION 2: Frontend tự check các field bắt buộc
      // ❓ ĐIỀU CHỈNH requiredFields theo yêu cầu của bạn
      const requiredFields = ['name', 'user_id']; // ← Có thể thêm 'phone', 'address' nếu cần
      
      const isComplete = requiredFields.every(field => {
        const value = profile[field];
        const hasValue = value && value.toString().trim() !== '';
        console.log(`  - ${field}: ${hasValue ? '✅' : '❌'} (${value})`);
        return hasValue;
      });
      
      console.log('📊 Profile complete result:', isComplete);
      return isComplete;
      
    } catch (error) {
      console.error('❌ Check profile complete error:', error);
      // Nếu không lấy được profile → coi như chưa complete
      return false;
    }
  },

  /**
   * ✅ Refresh token
   */
  async refreshToken() {
    return fetchWithCredentials(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
    });
  },

  /**
   * ✅ Logout
   */
  async logout() {
    return fetchWithCredentials(`${BASE_URL}/auth/logout`, {
      method: 'POST',
    });
  },
};

export default AuthAPI;
