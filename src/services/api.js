// src/services/api.js

// ==================== 🔧 API BASE URLS ====================

// ✅ 設定新的主要 API 網域
const API_BASE_URL = 'https://pray-api.yalinelena.church';

// 貼文與內容相關 API 路徑
const POSTS_API_URL = `${API_BASE_URL}/api`;
const AUTH_API_URL = `${API_BASE_URL}/auth`;

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

  // ==================== 🆕 AUTH API (保持原有邏輯) ====================

  /**
   * ✅ Login bằng email
   */
  loginWithEmail: async (email, successUrl = null) => {
    const performanceStart = performance.now();

    try {
      if (!email || !email.trim()) {
        throw new ApiError('Email không được để trống', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ApiError('Email không hợp lệ', 400);
      }

      const redirectUrl = successUrl || `${window.location.origin}/auth/callback`;
      const url = `${AUTH_API_URL}/${encodeURIComponent(email)}/login?success_url=${encodeURIComponent(redirectUrl)}`;

      console.log(`🔐 Đăng nhập bằng email: ${email}`);

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        maxRetries: 2,
        timeout: 30000
      });

      const performanceEnd = performance.now();

      return {
        success: true,
        data: data,
        message: 'Email đăng nhập đã được gửi. Vui lòng kiểm tra hộp thư.',
        performance: `${(performanceEnd - performanceStart).toFixed(2)}ms`
      };

    } catch (error) {
      console.error('❌ Đăng nhập thất bại:', error);
      let errorMessage = 'Không thể gửi email đăng nhập';
      if (error.statusCode === 400) errorMessage = error.message || 'Dữ liệu không hợp lệ';
      else if (error.statusCode === 404) errorMessage = 'Không tìm thấy người dùng';
      
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
   * ✅ Lấy danh sách Auth Providers
   */
  getAuthProviders: async () => {
    try {
      const { data } = await ApiService.makeRequest(`${AUTH_API_URL}/providers`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        timeout: 10000
      });

      let providers = [];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        providers = Object.entries(data).map(([key, enabled]) => ({
          name: key.toLowerCase(),
          display_name: key.charAt(0).toUpperCase() + key.slice(1),
          enabled: enabled === true,
          type: 'oauth'
        }));
      } else if (Array.isArray(data)) {
        providers = data;
      }

      return { success: true, providers: providers, message: 'Lấy danh sách providers thành công' };
    } catch (error) {
      return { success: false, providers: [], message: error.message, error: error.message };
    }
  },

  /**
   * ✅ Lấy thông tin Session
   */
  getAuthSession: async () => {
    try {
      const { data } = await ApiService.makeRequest(`${AUTH_API_URL}/session`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        credentials: 'include',
        timeout: 10000
      });

      return { success: true, session: data, user: data?.user || null, message: 'Lấy session thành công' };
    } catch (error) {
      if (error.statusCode === 401) {
        return { success: false, session: null, user: null, message: 'Chưa đăng nhập', requireLogin: true };
      }
      return { success: false, session: null, user: null, message: error.message, error: error.message };
    }
  },

  /**
   * ✅ Logout
   */
  logout: async () => {
    try {
      await ApiService.makeRequest(`${AUTH_API_URL}/logout`, {
        method: 'POST',
        headers: { 'accept': 'application/json' },
        credentials: 'include'
      });
      StorageService.removeItem('currentUser');
      StorageService.removeItem('userData');
      StorageService.removeItem('isAuthenticated');
      StorageService.removeItem('pendingUser');
      return { success: true, message: 'Đăng xuất thành công' };
    } catch (error) {
      return { success: true, message: 'Đã xóa dữ liệu local' };
    }
  },

  // ==================== 📝 POSTS & INTERACTION API (Updated to New Spec) ====================
  
  /**
   * ✅ 4. 查詢貼文分頁 (Get Posts Page)
   * Method: GET /api/page
   * Params: userid, event, category, viewer_userid, page, limit
   */
  getPosts: async (page = 1, limit = 10, forceRefresh = false, filters = {}) => {
    const cacheKey = `posts_${page}_${limit}_${JSON.stringify(filters)}`;

    if (!forceRefresh && cache.has(cacheKey)) {
      console.log('📦 Sử dụng cache cho posts');
      return cache.get(cacheKey);
    }

    try {
      const currentUserId = ApiService.getCurrentUserId();
      
      // 建構查詢參數
      const params = new URLSearchParams({
        page: page,
        limit: limit,
        viewer_userid: currentUserId || '',
        ...filters // 可傳入 event, category, userid
      });

      const url = `${POSTS_API_URL}/page?${params.toString()}`;
      console.log(`📝 Lấy posts from: ${url}`);

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        maxRetries: 2
      });

      if (data && data.status === 'success' && data.data) {
        const result = {
          success: true,
          posts: data.data.posts || [], 
          pagination: data.data.pageinfo || {},
          filters: data.data.filter || {},
          message: data.message || 'Lấy posts thành công'
        };

        cache.set(cacheKey, result);
        setTimeout(() => cache.delete(cacheKey), 60000); // Cache 1 min
        return result;
      } else {
         throw new ApiError(data?.message || 'Format response không hợp lệ', 500);
      }

    } catch (error) {
      console.error('❌ Lấy posts thất bại:', error);
      return { success: false, posts: [], message: error.message, error: error.message };
    }
  },

  /**
   * ✅ 1. 新增貼文 (Create Post)
   * Method: POST /api/posts
   * Body: userid, content, category (enum), uuid (optional)
   */
  createPost: async (userId, postDataOrContent, privacy = 'Personal & Family') => {
    try {
      let postData;
      
      // 處理參數重載 (可以直接傳物件或分開傳)
      if (typeof postDataOrContent === 'string') {
        postData = {
          userid: userId,
          content: postDataOrContent,
          category: privacy, // 注意：舊程式碼的 privacy 對應新的 category
          uuid: null
        };
      } else {
        postData = {
          userid: userId,
          category: 'Personal & Family', // Default
          uuid: null,
          ...postDataOrContent
        };
      }

      console.log('📝 Tạo post mới:', postData);

      const { data } = await ApiService.makeRequest(`${POSTS_API_URL}/posts`, {
        method: 'POST',
        body: JSON.stringify(postData)
      });

      cache.clear();

      // 回傳結構位於 data.data
      return {
        success: true,
        post: data.data,
        message: data.message || 'Tạo post thành công'
      };

    } catch (error) {
      console.error('❌ Tạo post thất bại:', error);
      return { success: false, message: error.message, error: error.message };
    }
  },

  /**
   * ✅ 2. 新增留言 (Create Comment)
   * Method: POST /api/comment
   * Body: userid, content, docid
   */
  addComment: async ({ userid, content, sn, docid }) => {
    try {
      // 兼容舊代碼傳入 sn 的情況，但 API 需要 docid
      if (!userid || !content || (!docid && !sn)) {
        throw new ApiError('Thiếu thông tin bắt buộc', 400);
      }

      // 若只有 sn，需確保調用方已修改為傳入 docid，此處假設 docid 已傳入
      const targetId = docid || sn; 

      console.log(`💬 Thêm comment cho post ${targetId}`);

      const { data } = await ApiService.makeRequest(`${POSTS_API_URL}/comment`, {
        method: 'POST',
        body: JSON.stringify({
          userid,
          content,
          docid: targetId 
        })
      });

      cache.clear();

      return {
        success: true,
        comment: data.data?.comment,
        message: data.message || 'Thêm comment thành công'
      };

    } catch (error) {
      console.error('❌ Thêm comment thất bại:', error);
      return { success: false, message: error.message, error: error.message };
    }
  },

  /**
   * ✅ 3. Amen 與收回 Amen (Toggle Amen)
   * Method: POST /api/posts/{docid}/amen
   * Body: userid
   * Note: 初次點擊為 Amen，第二次則為收回 (Toggle)
   */
  likePost: async (docid, userId) => {
    try {
      console.log(`❤️ Toggle Amen post ${docid}`);

      const { data } = await ApiService.makeRequest(
        `${POSTS_API_URL}/posts/${docid}/amen`,
        {
          method: 'POST',
          body: JSON.stringify({ userid: userId })
        }
      );

      cache.clear();

      // data.data 包含 updated amen_count 和 amened status
      return {
        success: true,
        data: data.data, 
        message: data.message || 'Amen 成功'
      };

    } catch (error) {
      console.error('❌ Amen thất bại:', error);
      return { success: false, message: error.message, error: error.message };
    }
  },

  /**
   * ✅ 5. 新增 Witness (Create Witness)
   * Method: POST /api/witness
   * Body: userid, content, parent_docid
   */
  createWitness: async (userId, content, parentDocid) => {
    try {
      console.log(`✨ Create Witness for ${parentDocid}`);

      const { data } = await ApiService.makeRequest(`${POSTS_API_URL}/witness`, {
        method: 'POST',
        body: JSON.stringify({
          userid: userId,
          content: content,
          parent_docid: parentDocid
        })
      });

      cache.clear();

      return {
        success: true,
        witness: data.data?.witness,
        message: data.message || '見證新增成功'
      };
    } catch (error) {
      console.error('❌ Create Witness failed:', error);
      return { success: false, message: error.message, error: error.message };
    }
  },

  /**
   * ✅ 6. 查詢 Witness 列表 (Get Witness List)
   * Method: GET /api/witness-list
   * Params: page, limit
   */
  getWitnessList: async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({ page, limit });
      const url = `${POSTS_API_URL}/witness-list?${params.toString()}`;
      
      const { data } = await ApiService.makeRequest(url, { method: 'GET' });

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          witnesses: data.data.witnesses || [],
          pagination: data.data.pageinfo || {},
          message: data.message
        };
      }
      throw new ApiError('Invalid format');
    } catch (error) {
      console.error('❌ Get Witness List failed:', error);
      return { success: false, witnesses: [], message: error.message };
    }
  },

  /**
   * ⚠️ 獲取評論 (Compatibility)
   * 新規格無專屬 Get Comment 接口，使用 /api/page 並帶入 event='comment' 模擬。
   * 如果後端不支援 parent_docid 篩選，這部分可能需要在前端做過濾。
   */
  getComments: async (postDocid) => {
    try {
      console.log(`💬 獲取評論 for ${postDocid}`);
      // 嘗試使用 getPosts 帶入 event 篩選
      const result = await ApiService.getPosts(1, 50, false, { 
        event: 'comment'
      });

      if (result.success) {
        // 前端過濾：確保只回傳該貼文的評論 (假設後端暫不支援 parent_docid 參數)
        // 注意：若 API 支援 ?parent_docid=xxx 則可直接加入 filters
        const filteredComments = result.posts.filter(c => c.parent_docid === postDocid);
        return {
          success: true,
          comments: filteredComments,
          message: 'Lấy comments thành công'
        };
      }
      return { success: false, comments: [] };

    } catch (error) {
      console.error('❌ Lấy comments thất bại:', error);
      return { success: false, comments: [], message: error.message };
    }
  },

  // ==================== 🔧 USER UTILITY FUNCTIONS (保持不變) ====================

  getCurrentUserId: () => {
    try {
      const userStr = StorageService.getItem('userData') || StorageService.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.userId || null;
      }
      return null;
    } catch (error) {
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
  API_BASE_URL,
  POSTS_API_URL,
  AUTH_API_URL
};

// ==================== 📊 LOGGING ====================

console.log('🎉 API Service đã load! (Updated for New Specs)');
console.log('📦 API Base URL:', API_BASE_URL);
console.log('📦 Available APIs:');
console.log('');
console.log('🔐 Auth API:');
console.log('   • loginWithEmail(email, successUrl)');
console.log('   • getAuthProviders()');
console.log('   • getAuthSession()');
console.log('   • logout()');
console.log('');
console.log('📝 Posts API (Unified Format):');
console.log('   • getPosts(page, limit, filters) -> returns raw { docid, amen_count, ... }');
console.log('   • createPost(userId, content, category)');
console.log('   • addComment({ userid, content, docid })');
console.log('   • getComments(postDocid) [Simulated via /page]');
console.log('   • likePost(docid, userId) [Toggle Amen]');
console.log('   • createWitness(userId, content, parentDocid)');
console.log('   • getWitnessList(page, limit)');
console.log('');
console.log('🔧 Utilities:');
console.log('   • getCurrentUser()');
console.log('   • getCurrentUserId()');
console.log('   • isAuthenticated()');
console.log('   • clearCache()');
console.log('   • clearAllData()');