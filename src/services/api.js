// src/services/api.js

// ==================== 🔧 API BASE URLS ====================

// ✅ Sử dụng proxy (không hardcode domain)
const POSTS_API_BASE_URL = '/cms';  // Proxy đến zien.54ucl.com/cms
const AUTH_API_BASE_URL = '/auth';  // Proxy đến pray-api.yalinelena.church/auth

// ==================== 🔧 UTILITY CLASSES ====================

class ApiError extends Error {
  constructor(message, statusCode = 0, data = null, url = '') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    this.url = url;
    this.timestamp = new Date().toISOString();
  }
}

const StorageService = {
  _storage: new Map(),

  getItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return StorageService._storage.get(key) || null;
  },

  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      StorageService._storage.set(key, value);
    }
  },

  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      StorageService._storage.delete(key);
    }
  },

  clear: () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    } else {
      StorageService._storage.clear();
    }
  }
};

const cache = new Map();

// ==================== 🚀 MAIN API SERVICE ====================

const ApiService = {
  // ==================== 🔧 UTILITY METHODS ====================
  
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  isRetryableError: (error) => {
    return error.statusCode >= 500 || error.statusCode === 0 || error.name === 'AbortError';
  },

  formatDateTime: (datetime) => {
    if (!datetime) return '剛剛';
    try {
      const date = new Date(datetime);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return '剛剛';
      if (diffMins < 60) return `${diffMins}分鐘前`;
      if (diffHours < 24) return `${diffHours}小時前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return date.toLocaleDateString('zh-TW');
    } catch (error) {
      return datetime;
    }
  },

  makeRequest: async (url, options = {}, retryCount = 0) => {
    const maxRetries = options.maxRetries || 3;
    const defaultOptions = {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    const performanceStart = performance.now();

    try {
      console.log(`🌐 發送請求到: ${url} (第 ${retryCount + 1} 次嘗試)`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const performanceEnd = performance.now();

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log(`⏱️ 請求 ${url} 耗時 ${(performanceEnd - performanceStart).toFixed(2)}ms`);

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data,
          url
        );
      }

      return { response, data };

    } catch (error) {
      console.error(`❌ 請求失敗 ${url}:`, error);

      if (retryCount < maxRetries && ApiService.isRetryableError(error)) {
        console.log(`🔄 重試請求 (${retryCount + 1}/${maxRetries}): ${url}`);
        await ApiService.delay(2000 * (retryCount + 1));
        return ApiService.makeRequest(url, options, retryCount + 1);
      }

      if (error.name === 'AbortError') {
        throw new ApiError('請求超時', 408, null, url);
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new ApiError('網路錯誤 - 無法連接到伺服器', 0, null, url);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(`意外錯誤: ${error.message}`, 0, null, url);
    }
  },

  // ==================== 🆕 AUTH API ====================

  /**
   * ✅ Login bằng email
   * @param {string} email - Email người dùng
   * @param {string} successUrl - URL redirect sau khi login thành công
   * @returns {Promise<Object>}
   */
  loginWithEmail: async (email, successUrl = null) => {
    const performanceStart = performance.now();

    try {
      // Validate email
      if (!email || !email.trim()) {
        throw new ApiError('Email không được để trống', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ApiError('Email không hợp lệ', 400);
      }

      const redirectUrl = successUrl || `${window.location.origin}/auth/callback`;
      const url = `${AUTH_API_BASE_URL}/${encodeURIComponent(email)}/login?success_url=${encodeURIComponent(redirectUrl)}`;

      console.log(`🔐 Đăng nhập bằng email: ${email}`);
      console.log(`📍 Redirect URL: ${redirectUrl}`);

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        maxRetries: 2,
        timeout: 30000
      });

      const performanceEnd = performance.now();

      console.log('✅ Email đăng nhập đã được gửi:', data);

      return {
        success: true,
        data: data,
        message: 'Email đăng nhập đã được gửi. Vui lòng kiểm tra hộp thư.',
        performance: `${(performanceEnd - performanceStart).toFixed(2)}ms`
      };

    } catch (error) {
      console.error('❌ Đăng nhập thất bại:', error);

      let errorMessage = 'Không thể gửi email đăng nhập';
      
      if (error.statusCode === 400) {
        errorMessage = error.message || 'Dữ liệu không hợp lệ';
      } else if (error.statusCode === 404) {
        errorMessage = 'Không tìm thấy người dùng';
      } else if (error.statusCode === 422) {
        errorMessage = 'Email không hợp lệ';
      } else if (error.statusCode === 429) {
        errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
      } else if (error.statusCode >= 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
      } else if (error.statusCode === 0) {
        errorMessage = 'Không thể kết nối đến máy chủ';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message,
        statusCode: error.statusCode,
        performance: `${(performance.now() - performanceStart).toFixed(2)}ms`
      };
    }
  },

  /**
   * ✅ Lấy danh sách Auth Providers (ĐÃ FIX FORMAT)
   * @returns {Promise<Object>}
   */
  getAuthProviders: async () => {
    try {
      console.log('📋 Lấy danh sách Auth Providers...');

      const { data } = await ApiService.makeRequest(`${AUTH_API_BASE_URL}/providers`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('📦 Raw providers data:', data);

      // ✅ CONVERT FORMAT: {"google": true, "apple": true} 
      //    => [{name: "google", display_name: "Google", enabled: true}, ...]
      
      let providers = [];
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Format: {"google": true, "apple": true, "facebook": true}
        providers = Object.entries(data).map(([key, enabled]) => ({
          name: key.toLowerCase(),
          display_name: key.charAt(0).toUpperCase() + key.slice(1),
          enabled: enabled === true,
          type: 'oauth'
        }));
        
        console.log('✅ Converted providers:', providers);
      } else if (Array.isArray(data)) {
        // Nếu backend đã trả về array
        providers = data;
      }

      return {
        success: true,
        providers: providers,
        message: 'Lấy danh sách providers thành công'
      };

    } catch (error) {
      console.error('❌ Lấy providers thất bại:', error);

      return {
        success: false,
        providers: [],
        message: error.message || 'Lấy providers thất bại',
        error: error.message
      };
    }
  },

  /**
   * ✅ Lấy thông tin Session
   * @returns {Promise<Object>}
   */
  getAuthSession: async () => {
    try {
      console.log('🔍 Kiểm tra session...');

      const { data } = await ApiService.makeRequest(`${AUTH_API_BASE_URL}/session`, {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        },
        credentials: 'include', // Gửi cookies
        timeout: 10000
      });

      console.log('✅ Session:', data);

      return {
        success: true,
        session: data,
        user: data?.user || null,
        message: 'Lấy session thành công'
      };

    } catch (error) {
      console.error('❌ Lấy session thất bại:', error);

      // Nếu 401 = chưa đăng nhập
      if (error.statusCode === 401) {
        return {
          success: false,
          session: null,
          user: null,
          message: 'Chưa đăng nhập',
          requireLogin: true
        };
      }

      return {
        success: false,
        session: null,
        user: null,
        message: error.message || 'Lấy session thất bại',
        error: error.message
      };
    }
  },

  /**
   * ✅ Logout
   * @returns {Promise<Object>}
   */
  logout: async () => {
    try {
      console.log('🚪 Đăng xuất...');

      await ApiService.makeRequest(`${AUTH_API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        credentials: 'include'
      });

      // Xóa dữ liệu local
      StorageService.removeItem('currentUser');
      StorageService.removeItem('userData');
      StorageService.removeItem('isAuthenticated');
      StorageService.removeItem('pendingUser');

      console.log('✅ Đăng xuất thành công');

      return {
        success: true,
        message: 'Đăng xuất thành công'
      };

    } catch (error) {
      console.error('❌ Đăng xuất thất bại:', error);

      // Vẫn xóa dữ liệu local
      StorageService.removeItem('currentUser');
      StorageService.removeItem('userData');
      StorageService.removeItem('isAuthenticated');
      StorageService.removeItem('pendingUser');

      return {
        success: true, // Vẫn return success
        message: 'Đã xóa dữ liệu local'
      };
    }
  },

  // ==================== 📝 POSTS API ====================
  
  /**
   * ✅ Lấy danh sách posts
   */
  getPosts: async (page = 1, limit = 10, forceRefresh = false) => {
    const cacheKey = `posts_${page}_${limit}`;

    if (!forceRefresh && cache.has(cacheKey)) {
      console.log('📦 Sử dụng cache cho posts');
      return cache.get(cacheKey);
    }

    try {
      console.log(`📝 Lấy posts (page: ${page}, limit: ${limit})`);

      const { data } = await ApiService.makeRequest(
        `${POSTS_API_BASE_URL}/posts?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          maxRetries: 2
        }
      );

      const result = {
        success: true,
        posts: Array.isArray(data) ? data : data?.posts || [],
        pagination: data?.pagination || { page, limit, total: 0 },
        message: 'Lấy posts thành công'
      };

      cache.set(cacheKey, result);
      setTimeout(() => cache.delete(cacheKey), 60000); // Cache 1 phút

      return result;

    } catch (error) {
      console.error('❌ Lấy posts thất bại:', error);

      return {
        success: false,
        posts: [],
        message: error.message || 'Lấy posts thất bại',
        error: error.message
      };
    }
  },

  /**
   * ✅ Tạo post mới
   */
  createPost: async (userId, postDataOrContent, privacy = 'public') => {
    try {
      let postData;

      if (typeof postDataOrContent === 'string') {
        postData = {
          userid: userId,
          content: postDataOrContent,
          privacy: privacy
        };
      } else {
        postData = {
          userid: userId,
          ...postDataOrContent
        };
      }

      console.log('📝 Tạo post mới:', postData);

      const { data } = await ApiService.makeRequest(`${POSTS_API_BASE_URL}/posts`, {
        method: 'POST',
        body: JSON.stringify(postData)
      });

      // Xóa cache
      cache.clear();

      return {
        success: true,
        post: data,
        message: 'Tạo post thành công'
      };

    } catch (error) {
      console.error('❌ Tạo post thất bại:', error);

      return {
        success: false,
        message: error.message || 'Tạo post thất bại',
        error: error.message
      };
    }
  },

  /**
   * ✅ Thêm comment
   */
  addComment: async ({ userid, content, sn }) => {
    try {
      if (!userid || !content || !sn) {
        throw new ApiError('Thiếu thông tin bắt buộc', 400);
      }

      console.log(`💬 Thêm comment cho post ${sn}`);

      const { data } = await ApiService.makeRequest(`${POSTS_API_BASE_URL}/comments`, {
        method: 'POST',
        body: JSON.stringify({ userid, content, sn })
      });

      // Xóa cache
      cache.clear();

      return {
        success: true,
        comment: data,
        message: 'Thêm comment thành công'
      };

    } catch (error) {
      console.error('❌ Thêm comment thất bại:', error);

      return {
        success: false,
        message: error.message || 'Thêm comment thất bại',
        error: error.message
      };
    }
  },

  /**
   * ✅ Lấy comments của post
   */
  getComments: async (postSn) => {
    try {
      console.log(`💬 Lấy comments cho post ${postSn}`);

      const { data } = await ApiService.makeRequest(
        `${POSTS_API_BASE_URL}/posts/${postSn}/comments`,
        {
          method: 'GET'
        }
      );

      return {
        success: true,
        comments: Array.isArray(data) ? data : data?.comments || [],
        message: 'Lấy comments thành công'
      };

    } catch (error) {
      console.error('❌ Lấy comments thất bại:', error);

      return {
        success: false,
        comments: [],
        message: error.message || 'Lấy comments thất bại',
        error: error.message
      };
    }
  },

  /**
   * ✅ Like post
   */
  likePost: async (postSn, userId) => {
    try {
      console.log(`❤️ Like post ${postSn}`);

      const { data } = await ApiService.makeRequest(
        `${POSTS_API_BASE_URL}/posts/${postSn}/like`,
        {
          method: 'POST',
          body: JSON.stringify({ userid: userId })
        }
      );

      // Xóa cache
      cache.clear();

      return {
        success: true,
        data: data,
        message: 'Like thành công'
      };

    } catch (error) {
      console.error('❌ Like thất bại:', error);

      return {
        success: false,
        message: error.message || 'Like thất bại',
        error: error.message
      };
    }
  },

  // ==================== 🧪 TEST FUNCTIONS ====================

  /**
   * ✅ Test Auth API
   */
  testAuthAPI: async () => {
    console.log('🧪 Bắt đầu test Auth API...');

    const results = {
      providers: null,
      session: null,
      login: null
    };

    try {
      // Test 1: Lấy providers
      console.log('🧪 Test 1: Lấy providers');
      results.providers = await ApiService.getAuthProviders();

      // Test 2: Kiểm tra session
      console.log('🧪 Test 2: Kiểm tra session');
      results.session = await ApiService.getAuthSession();

      // Test 3: Test login (dùng email test)
      console.log('🧪 Test 3: Test login');
      results.login = await ApiService.loginWithEmail(
        'test@example.com',
        `${window.location.origin}/auth/callback`
      );

      const successCount = Object.values(results).filter(r => r && r.success).length;

      console.log(`✅ Test hoàn thành: ${successCount}/3 thành công`);

      return {
        success: successCount > 0,
        message: `Auth API test hoàn thành: ${successCount}/3 thành công`,
        results: results
      };

    } catch (error) {
      console.error('❌ Test Auth API thất bại:', error);
      return {
        success: false,
        message: `Test thất bại: ${error.message}`,
        error: error.message,
        results: results
      };
    }
  },

  /**
   * ✅ Test Posts API
   */
  testPostsAPI: async () => {
    console.log('🧪 Bắt đầu test Posts API...');

    const results = {
      getPosts: null,
      createPost: null,
      addComment: null
    };

    try {
      // Test 1: Lấy posts
      console.log('🧪 Test 1: Lấy posts');
      results.getPosts = await ApiService.getPosts(1, 5);

      // Test 2: Tạo post (nếu có user)
      const userId = ApiService.getCurrentUserId();
      if (userId) {
        console.log('🧪 Test 2: Tạo post');
        results.createPost = await ApiService.createPost(
          userId,
          'Test post từ API Service',
          'public'
        );
      }

      const successCount = Object.values(results).filter(r => r && r.success).length;

      console.log(`✅ Test hoàn thành: ${successCount}/2 thành công`);

      return {
        success: successCount > 0,
        message: `Posts API test hoàn thành: ${successCount}/2 thành công`,
        results: results
      };

    } catch (error) {
      console.error('❌ Test Posts API thất bại:', error);
      return {
        success: false,
        message: `Test thất bại: ${error.message}`,
        error: error.message,
        results: results
      };
    }
  },

  // ==================== 🔧 USER UTILITY FUNCTIONS ====================

  getCurrentUserId: () => {
    try {
      const userStr = StorageService.getItem('userData') || StorageService.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.userId || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Get user ID failed:', error);
      return null;
    }
  },

  getCurrentUser: () => {
    try {
      const userStr = StorageService.getItem('userData') || StorageService.getItem('currentUser');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('❌ Get current user failed:', error);
      return null;
    }
  },

  isAuthenticated: () => {
    const user = ApiService.getCurrentUser();
    const isAuth = StorageService.getItem('isAuthenticated') === 'true';
    return !!(user && user.id && isAuth);
  },

  clearCache: () => {
    cache.clear();
    console.log('🗑️ API 快取已清除');
  },

  clearAllData: () => {
    cache.clear();
    StorageService.clear();
    console.log('🗑️ 所有數據已清除');
  }
};

// ==================== 🎯 EXPORTS ====================

export default ApiService;

export {
  ApiService,
  StorageService,
  ApiError,
  POSTS_API_BASE_URL,
  AUTH_API_BASE_URL
};

// ==================== 📊 LOGGING ====================

console.log('🎉 API Service đã load!');
console.log('📦 Available APIs:');
console.log('');
console.log('🔐 Auth API:');
console.log('   • loginWithEmail(email, successUrl)');
console.log('   • getAuthProviders()');
console.log('   • getAuthSession()');
console.log('   • logout()');
console.log('');
console.log('📝 Posts API:');
console.log('   • getPosts(page, limit, forceRefresh)');
console.log('   • createPost(userId, content, privacy)');
console.log('   • addComment({ userid, content, sn })');
console.log('   • getComments(postSn)');
console.log('   • likePost(postSn, userId)');
console.log('');
console.log('🧪 Test Functions:');
console.log('   • testAuthAPI()');
console.log('   • testPostsAPI()');
console.log('');
console.log('🔧 Utilities:');
console.log('   • getCurrentUser()');
console.log('   • getCurrentUserId()');
console.log('   • isAuthenticated()');
console.log('   • clearCache()');
console.log('   • clearAllData()');
