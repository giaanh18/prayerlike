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

  
  processAvatarUrl: (url) => {
    if (!url) return null; // 或是回傳預設圖片路徑

    // 情況 1: 已經是完整的 HTTP/HTTPS URL (例如 Google 頭像)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // 情況 2: 自行上傳的相對路徑 (例如 uploads/avatars/...)
    // 移除開頭可能多餘的 '/' 以確保路徑拼接正確
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    
    // 拼接 API_BASE_URL
    return `${API_BASE_URL}/${cleanPath}`;
  },

  // ==================== 🔐 AUTH API ====================

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

  getAuthProviders: async () => {
    try {
      const { data } = await ApiService.makeRequest(`${AUTH_API_URL}/providers`, {
        method: 'GET',
        credentials: 'include',
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

  getAuthSession: async () => {
    try {
      const { data } = await ApiService.makeRequest(`${AUTH_API_URL}/session`, {
        method: 'GET',
        headers: { 'accept': 'application/json' },
        credentials: 'include',
        timeout: 10000
      });

      console.log('📥 Raw session data:', data);

      if (data && data.authenticated && data.account) {
        const user = {
          id: data.account.user_id,
          userId: data.account.user_id,
          name: data.account.name,
          email: data.account.email,
          tribe: data.account.tribe,
          provider: data.provider,
          profile: data.profile,
          created_at: data.account.created_at,
          updated_at: data.account.updated_at,
          accountId: data.account.id
        };

        console.log('✅ Session parsed (NEW structure):', user);

        return { 
          success: true, 
          session: data, 
          user: user,
          message: 'Lấy session thành công (new format)' 
        };
      }

      if (data && data.user) {
        console.warn('⚠️ Old session structure detected, converting...');
        const user = {
          id: data.user.userId || data.user.user_id || data.user.id,
          userId: data.user.userId || data.user.user_id || data.user.id,
          name: data.user.name,
          email: data.user.email,
          tribe: data.user.tribe,
          ...data.user
        };

        return { 
          success: true, 
          session: data, 
          user: user, 
          message: 'Lấy session thành công (old format)' 
        };
      }

      throw new ApiError('Invalid session format', 500);

    } catch (error) {
      console.error('❌ Get session error:', error);
      
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
        message: error.message, 
        error: error.message 
      };
    }
  },

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
      cache.clear();
      return { success: true, message: 'Đăng xuất thành công' };
    } catch (error) {
      return { success: true, message: 'Đã xóa dữ liệu local' };
    }
  },

  // ==================== 📝 POSTS & INTERACTION API ====================
  
  getPosts: async (page = 1, limit = 10, forceRefresh = false, filters = {}) => {
    const cacheKey = `posts_${page}_${limit}_${JSON.stringify(filters)}`;

    if (!forceRefresh && cache.has(cacheKey)) {
      console.log('📦 Sử dụng cache cho posts');
      return cache.get(cacheKey);
    }

    try {
      const currentUserId = ApiService.getCurrentUserId();
      
      const params = new URLSearchParams({
        page: page,
        limit: limit,
        viewer_userid: currentUserId || '',
        ...filters
      });

      const url = `${POSTS_API_URL}/page?${params.toString()}`;
      console.log(`📝 Lấy posts from: ${url}`);

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
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
        setTimeout(() => cache.delete(cacheKey), 60000);
        return result;
      } else {
         throw new ApiError(data?.message || 'Format response không hợp lệ', 500);
      }

    } catch (error) {
      console.error('❌ Lấy posts thất bại:', error);
      return { success: false, posts: [], message: error.message, error: error.message };
    }
  },

  createPost: async (userId, postDataOrContent, privacy = 'Personal & Family') => {
    try {
      let postData;
      
      if (typeof postDataOrContent === 'string') {
        postData = {
          userid: userId,
          content: postDataOrContent,
          category: privacy,
          privacy: 'public',
          uuid: null
        };
      } else {
        postData = {
          userid: userId,
          category: 'Personal & Family',
          privacy: 'public',
          uuid: null,
          ...postDataOrContent
        };
      }

      console.log('📝 Tạo post mới (Final Payload):', postData);

      const { data } = await ApiService.makeRequest(`${POSTS_API_URL}/posts`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(postData)
      });

      cache.clear();

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

  addComment: async ({ userid, content, sn, docid }) => {
    try {
      if (!userid || !content || (!docid && !sn)) {
        throw new ApiError('Thiếu thông tin bắt buộc', 400);
      }

      const targetId = docid || sn; 

      console.log(`💬 Thêm comment cho post ${targetId}`);

      const { data } = await ApiService.makeRequest(`${POSTS_API_URL}/comment`, {
        method: 'POST',
        credentials: 'include',
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

  likePost: async (docid, userId) => {
    try {
      console.log(`❤️ Toggle Amen post ${docid}`);

      const { data } = await ApiService.makeRequest(
        `${POSTS_API_URL}/posts/${docid}/amen`,
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ userid: userId })
        }
      );

      cache.clear();

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

  likeComment: async (commentDocid, userId) => {
    try {
      console.log(`❤️ Toggle Amen comment ${commentDocid}`);

      const { data } = await ApiService.makeRequest(
        `${POSTS_API_URL}/posts/${commentDocid}/amen`,
        {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ userid: userId })
        }
      );

      cache.clear();

      return {
        success: true,
        data: data.data,
        message: data.message || 'Comment Amen 成功'
      };

    } catch (error) {
      console.error('❌ Comment Amen thất bại:', error);
      return { 
        success: false, 
        message: error.message, 
        error: error.message 
      };
    }
  },

  getComments: async (postDocid) => {
    try {
      console.log(`💬 獲取評論 for ${postDocid}`);
      const result = await ApiService.getPosts(1, 50, false, { 
        event: 'comment'
      });

      if (result.success) {
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

  // ==================== ✨ WITNESS API ====================

  createWitness: async (userId, content, parentDocid, imageFile = null) => {
    try {
      console.log(`✨ Create Witness for ${parentDocid}`, {
        userId,
        content: content.substring(0, 50) + '...',
        hasImage: !!imageFile
      });

      const formData = new FormData();
      formData.append('userid', userId);
      formData.append('content', content);
      formData.append('parent_docid', parentDocid);

      if (imageFile && imageFile instanceof File) {
        console.log('📸 Adding image:', imageFile.name, 
                    `(${(imageFile.size / 1024).toFixed(2)} KB)`);
        formData.append('file', imageFile);
      }

      console.log('📤 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const response = await fetch(`${POSTS_API_URL}/witness`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('📥 Response status:', response.status);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📥 Response data:', data);
      } else {
        const text = await response.text();
        console.error('❌ Response không phải JSON:', text.substring(0, 200));
        
        return {
          success: false,
          message: 'Backend trả về không phải JSON',
          error: text.substring(0, 200)
        };
      }

      if (!response.ok) {
        console.error('❌ Backend trả về lỗi:', data);
        
        let errorMessage = 'Tạo witness thất bại';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => 
              `[${err.loc?.join(' > ') || 'unknown'}] ${err.msg}`
            ).join(', ');
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        return {
          success: false,
          message: errorMessage,
          error: errorMessage
        };
      }

      cache.clear();

      return {
        success: true,
        witness: data.data?.witness || data.data || data,
        message: data.message || '見證新增成功'
      };

    } catch (error) {
      console.error('❌ Create Witness failed:', error);
      
      let errorMessage = 'Không thể kết nối đến server';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Lỗi mạng - Không thể kết nối đến server';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage, 
        error: error.message 
      };
    }
  },

  getWitnessList: async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({ page, limit });
      const url = `${POSTS_API_URL}/witness-list?${params.toString()}`;
      
      const { data } = await ApiService.makeRequest(url, { 
        method: 'GET',
        credentials: 'include'
      });

      if (data && data.status === 'success' && data.data) {
        // 取得原始列表
        const rawWitnesses = data.data.witnesses || [];
        
        // 🔄 遍歷並修正 avatar_url
        const processedWitnesses = rawWitnesses.map(witness => ({
          ...witness,
          // 修正見證人的頭像
          avatar_url: ApiService.processAvatarUrl(witness.avatar_url),
          // 如果有 original_post，也一併修正其中的頭像
          original_post: witness.original_post ? {
            ...witness.original_post,
            avatar_url: ApiService.processAvatarUrl(witness.original_post.avatar_url)
          } : null
        }));

        return {
          success: true,
          witnesses: processedWitnesses, // 回傳處理後的資料
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

  // ==================== 🎪 ACTIVITIES API ====================

  getActivities: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10
      } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);

      const url = `${API_BASE_URL}/api/activities?${queryParams.toString()}`;
      
      console.log('🎪 Requesting activities:', url);

      const { data, response } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'accept': 'application/json' }
      });

      console.log('📥 Activities response:', response.status, data);

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        );
      }

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          activities: data.data.activities || data.data || [],
          pageinfo: data.data.pageinfo || {},
          total: data.data.total || (data.data.activities?.length || 0),
          message: data.message || 'Lấy activities thành công'
        };
      }

      if (Array.isArray(data)) {
        return {
          success: true,
          activities: data,
          pageinfo: {},
          total: data.length,
          message: 'Lấy activities thành công'
        };
      }

      if (data && data.activities) {
        return {
          success: true,
          activities: data.activities,
          pageinfo: data.pageinfo || {},
          total: data.total || data.activities.length,
          message: 'Lấy activities thành công'
        };
      }

      throw new ApiError('Invalid response format', 500);

    } catch (error) {
      console.error('❌ Lấy activities thất bại:', error);
      
      let errorMessage = error.message;
      
      if (error.statusCode === 403) {
        errorMessage = '⛔ Không có quyền truy cập. Vui lòng đăng nhập lại.';
      } else if (error.statusCode === 401) {
        errorMessage = '🔐 Session hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.statusCode === 0) {
        errorMessage = '🌐 Không thể kết nối đến server. Vui lòng kiểm tra mạng.';
      }
      
      return { 
        success: false, 
        activities: [], 
        pageinfo: {},
        total: 0,
        message: errorMessage,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  getActivityById: async (activityId) => {
    try {
      if (!activityId) {
        throw new ApiError('Activity ID không được để trống', 400);
      }

      console.log(`🎪 Lấy chi tiết activity: ${activityId}`);

      const url = `${API_BASE_URL}/api/activities/${encodeURIComponent(activityId)}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'accept': 'application/json' }
      });

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          activity: data.data,
          message: data.message || 'Lấy activity thành công'
        };
      }

      throw new ApiError('Invalid response format', 500);

    } catch (error) {
      console.error('❌ Lấy activity thất bại:', error);
      return { 
        success: false, 
        activity: null,
        message: error.message, 
        error: error.message 
      };
    }
  },

  createActivity: async (activityData) => {
    try {
      if (!activityData.title || !activityData.location || !activityData.event_date) {
        throw new ApiError('Thiếu thông tin bắt buộc (title, location, event_date)', 400);
      }

      console.log('🎪 Tạo activity mới:', {
        title: activityData.title,
        location: activityData.location,
        event_date: activityData.event_date,
        event_time: activityData.event_time,
        hasCoverImage: !!activityData.coverImageFile,
        imageCount: activityData.imageFiles?.length || 0
      });

      const formData = new FormData();
      formData.append('title', activityData.title);
      formData.append('location', activityData.location);
      formData.append('event_date', activityData.event_date);
      formData.append('event_time', activityData.event_time || '00:00-23:59');
      formData.append('description', activityData.description || '');
      
      if (activityData.coverImageFile && activityData.coverImageFile instanceof File) {
        console.log('📸 Adding cover image:', activityData.coverImageFile.name, 
                    `(${(activityData.coverImageFile.size / 1024).toFixed(2)} KB)`);
        formData.append('files', activityData.coverImageFile);
      }

      if (activityData.imageFiles && Array.isArray(activityData.imageFiles)) {
        activityData.imageFiles.forEach((file, index) => {
          if (file instanceof File) {
            console.log(`🖼️ Adding image ${index + 1}:`, file.name, 
                        `(${(file.size / 1024).toFixed(2)} KB)`);
            formData.append('files', file);
          }
        });
      }

      if (activityData.max_participants) {
        formData.append('max_participants', activityData.max_participants);
      }

      if (activityData.tribe !== undefined) {
        formData.append('tribe', activityData.tribe);
      }

      console.log('📤 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/activities`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      console.log('📥 Response status:', response.status);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📥 Response data:', data);
      } else {
        const text = await response.text();
        console.error('❌ Response không phải JSON:', text.substring(0, 200));
        
        return {
          success: false,
          message: 'Backend trả về không phải JSON',
          error: text.substring(0, 200),
          statusCode: response.status
        };
      }

      if (!response.ok) {
        console.error('❌ Backend trả về lỗi:', data);
        
        let errorMessage = 'Tạo activity thất bại';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => 
              `[${err.loc?.join(' > ') || 'unknown'}] ${err.msg}`
            ).join(', ');
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        return {
          success: false,
          message: errorMessage,
          error: errorMessage,
          statusCode: response.status,
          details: data
        };
      }

      cache.clear();

      return {
        success: true,
        activity: data.data?.activities?.[0] || data.data || data,
        message: data.message || 'Tạo activity thành công'
      };

    } catch (error) {
      console.error('❌ Tạo activity thất bại:', error);
      
      let errorMessage = 'Không thể kết nối đến server';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Lỗi mạng - Không thể kết nối đến server';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage,
        error: errorMessage,
        statusCode: error.statusCode || 0
      };
    }
  },

  updateActivity: async (activityId, activityData) => {
    try {
      if (!activityId) {
        throw new ApiError('Activity ID không được để trống', 400);
      }

      console.log(`🎪 Cập nhật activity ${activityId}:`, activityData);

      const payload = {};

      if (activityData.title) payload.title = activityData.title;
      if (activityData.location) payload.location = activityData.location;
      if (activityData.event_date) payload.event_date = activityData.event_date;
      if (activityData.event_time !== undefined) payload.event_time = activityData.event_time;
      if (activityData.description !== undefined) payload.description = activityData.description;
      if (activityData.max_participants) payload.max_participants = activityData.max_participants;
      if (activityData.cover_image) payload.cover_image = activityData.cover_image;
      if (activityData.images) payload.images = activityData.images;

      const response = await fetch(
        `${API_BASE_URL}/api/activities/${encodeURIComponent(activityId)}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new ApiError('Backend trả về không phải JSON', response.status);
      }

      if (!response.ok) {
        throw new ApiError(
          data.detail || data.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      cache.clear();

      return {
        success: true,
        activity: data.data,
        message: data.message || 'Cập nhật activity thành công'
      };

    } catch (error) {
      console.error('❌ Cập nhật activity thất bại:', error);
      return { 
        success: false, 
        message: error.message, 
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  publishActivity: async (activityId, isPublish = true) => {
    try {
      if (!activityId) {
        throw new ApiError('Activity ID không được để trống', 400);
      }

      console.log(`🎪 ${isPublish ? 'Publish' : 'Unpublish'} activity ${activityId}`);

      const { data } = await ApiService.makeRequest(
        `${API_BASE_URL}/api/activities/${encodeURIComponent(activityId)}/publish`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify({ publish: isPublish })
        }
      );

      cache.clear();

      return {
        success: true,
        activity: data.data,
        message: data.message || `${isPublish ? 'Publish' : 'Unpublish'} thành công`
      };

    } catch (error) {
      console.error(`❌ ${isPublish ? 'Publish' : 'Unpublish'} thất bại:`, error);
      return { 
        success: false, 
        message: error.message, 
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  // ==================== 👥 FRIENDS API ====================

  sendFriendInvitation: async (targetUserId, message = '') => {
    try {
      if (!targetUserId) {
        throw new ApiError('Target User ID không được để trống', 400);
      }

      console.log(`👥 Gửi lời mời kết bạn đến: ${targetUserId}`);

      const url = `${API_BASE_URL}/api/friends/invite`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          target_user_id: targetUserId,
          message: message
        })
      });

      cache.clear();

      return {
        success: true,
        data: data.data,
        invitation: {
          id: data.data?.id,
          target_user_id: data.data?.target_user_id,
          message: data.data?.message,
          status: data.data?.status,
          created_at: data.data?.created_at
        },
        message: data.message || 'Gửi lời mời thành công'
      };

    } catch (error) {
      console.error('❌ Gửi lời mời thất bại:', error);
      return { 
        success: false, 
        message: error.message, 
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  getFriendInvitations: async () => {
    try {
      console.log('📋 Lấy danh sách lời mời kết bạn');

      const url = `${API_BASE_URL}/api/friends/pending`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'accept': 'application/json'
        }
      });

      return {
        success: true,
        incoming: data.data?.incoming || [],
        outgoing: data.data?.outgoing || [],
        message: data.message || 'Lấy danh sách thành công'
      };

    } catch (error) {
      console.error('❌ Lấy danh sách thất bại:', error);
      return { 
        success: false, 
        incoming: [], 
        outgoing: [], 
        message: error.message,
        error: error.message
      };
    }
  },

  respondToInvitation: async (inviteId, accept) => {
    try {
      if (!inviteId) {
        throw new ApiError('Invite ID không được để trống', 400);
      }

      if (typeof accept !== 'boolean') {
        throw new ApiError('Accept phải là boolean (true/false)', 400);
      }

      console.log(`${accept ? '✅ Chấp nhận' : '❌ Từ chối'} lời mời: ${inviteId}`);

      const url = `${API_BASE_URL}/api/friends/${encodeURIComponent(inviteId)}/respond`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({ 
          accept: accept 
        })
      });

      cache.clear();

      return {
        success: true,
        data: data.data,
        invitation: {
          id: data.data?.id,
          requester_user_id: data.data?.requester_user_id,
          target_user_id: data.data?.target_user_id,
          status: data.data?.status,
          message: data.data?.message,
          created_at: data.data?.created_at,
          responded_at: data.data?.responded_at
        },
        message: data.message || (accept ? 'Đã chấp nhận lời mời' : 'Đã từ chối lời mời')
      };

    } catch (error) {
      console.error('❌ Phản hồi lời mời thất bại:', error);
      return { 
        success: false, 
        message: error.message, 
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  searchUsers: async (query) => {
    try {
      if (!query || !query.trim()) {
        return { success: true, users: [], message: 'Query trống' };
      }

      console.log(`🔍 Tìm kiếm người dùng: "${query}"`);

      const url = `${API_BASE_URL}/api/users/search?user_id=${encodeURIComponent(query.trim())}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('📥 Search API response:', data);

      if (data && data.status === 'success' && data.data && data.data.results) {
        
        console.log('📊 Results array:', data.data.results);
        
        if (data.data.results.length === 0) {
          return {
            success: false,
            users: [],
            message: 'Không tìm thấy người dùng'
          };
        }

        const users = data.data.results.map(result => {
          const userName = result.name 
            || result.user_id 
            || (result.email ? result.email.split('@')[0] : null)
            || 'Unknown User';
          
          return {
            id: result.user_id,
            name: userName,
            username: result.user_id,
            email: result.email,
            tribe: result.tribe,
            avatar: result.avatar_url || null
          };
        });

        console.log('✅ Parsed users:', users);
        
        users.forEach((user, index) => {
          console.log(`👤 User ${index + 1}:`, {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            tribe: user.tribe
          });
        });

        return {
          success: true,
          users: users,
          message: data.message || `Tìm thấy ${users.length} người dùng`
        };
      }

      return { 
        success: false, 
        users: [], 
        message: data?.message || 'Không tìm thấy người dùng' 
      };

    } catch (error) {
      console.error('❌ Tìm kiếm thất bại:', error);
      
      let errorMessage = 'Không thể tìm kiếm';
      
      if (error.statusCode === 404) {
        errorMessage = 'Không tìm thấy người dùng với ID này';
      } else if (error.statusCode === 422) {
        errorMessage = 'User ID không hợp lệ';
      } else if (error.statusCode === 401 || error.statusCode === 403) {
        errorMessage = 'Vui lòng đăng nhập lại';
      } else if (error.statusCode === 0) {
        errorMessage = 'Không thể kết nối đến server';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        users: [], 
        message: errorMessage,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  getFriends: async (userId = null) => {
    try {
      const currentUserId = userId || ApiService.getCurrentUserId();
      
      console.log(`👥 Lấy danh sách bạn bè cho user: ${currentUserId}`);

      const url = `${API_BASE_URL}/api/friends${currentUserId ? `?user_id=${encodeURIComponent(currentUserId)}` : ''}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'accept': 'application/json'
        },
        timeout: 10000
      });

      let friends = [];
      
      if (data && data.status === 'success') {
        if (Array.isArray(data.data)) {
          friends = data.data;
        } else if (data.data && Array.isArray(data.data.friends)) {
          friends = data.data.friends;
        }
      }

      const formattedFriends = friends.map(friend => ({
        id: friend.user_id || friend.id || friend.friend_user_id,
        name: friend.name || friend.username || friend.user_id || 'Unknown',
        username: friend.username || friend.user_id,
        avatar: friend.avatar_url || friend.avatar || null,
        relationship: friend.relationship || 'Friend',
        created_at: friend.created_at || friend.friendship_date
      }));

      return {
        success: true,
        friends: formattedFriends,
        count: formattedFriends.length,
        message: `Lấy ${formattedFriends.length} bạn bè thành công`
      };

    } catch (error) {
      console.error('❌ Lấy danh sách bạn bè thất bại:', error);
      
      if (error.statusCode === 404 || error.statusCode === 0) {
        console.warn('⚠️ API /api/friends chưa có, thử lấy từ accepted invitations...');
        
        try {
          const invitationsResult = await ApiService.getFriendInvitations();
          
          if (invitationsResult.success) {
            const acceptedIncoming = (invitationsResult.incoming || [])
              .filter(inv => inv.status === 'accepted')
              .map(inv => ({
                id: inv.requester_user_id,
                name: inv.requester_user_id,
                username: inv.requester_user_id,
                avatar: null,
                relationship: 'Friend',
                created_at: inv.created_at
              }));

            const acceptedOutgoing = (invitationsResult.outgoing || [])
              .filter(inv => inv.status === 'accepted')
              .map(inv => ({
                id: inv.target_user_id,
                name: inv.target_user_id,
                username: inv.target_user_id,
                avatar: null,
                relationship: 'Friend',
                created_at: inv.created_at
              }));

            const allFriends = [...acceptedIncoming, ...acceptedOutgoing];

            const uniqueFriends = Array.from(
              new Map(allFriends.map(f => [f.id, f])).values()
            );

            return {
              success: true,
              friends: uniqueFriends,
              count: uniqueFriends.length,
              message: `Lấy ${uniqueFriends.length} bạn bè từ invitations thành công`
            };
          }
        } catch (invError) {
          console.error('❌ Lấy từ invitations cũng thất bại:', invError);
        }
      }
      
      return { 
        success: false, 
        friends: [],
        count: 0,
        message: error.message,
        error: error.message
      };
    }
  },

  getFamily: async (userId = null) => {
    try {
      const currentUserId = userId || ApiService.getCurrentUserId();
      
      console.log(`👨‍👩‍👧‍👦 Lấy danh sách gia đình cho user: ${currentUserId}`);

      const url = `${API_BASE_URL}/api/family${currentUserId ? `?user_id=${encodeURIComponent(currentUserId)}` : ''}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'accept': 'application/json'
        },
        timeout: 10000
      });

      let family = [];
      
      if (data && data.status === 'success') {
        if (Array.isArray(data.data)) {
          family = data.data;
        } else if (data.data && Array.isArray(data.data.family)) {
          family = data.data.family;
        }
      }

      const formattedFamily = family.map(member => ({
        id: member.user_id || member.id || member.family_member_id,
        name: member.name || member.username || member.user_id || 'Unknown',
        username: member.username || member.user_id,
        avatar: member.avatar_url || member.avatar || null,
        relationship: member.relationship || 'Family',
        created_at: member.created_at || member.added_date
      }));

      return {
        success: true,
        family: formattedFamily,
        count: formattedFamily.length,
        message: `Lấy ${formattedFamily.length} thành viên gia đình thành công`
      };

    } catch (error) {
      console.error('❌ Lấy danh sách gia đình thất bại:', error);
      
      if (error.statusCode === 404 || error.statusCode === 0) {
        console.warn('⚠️ API /api/family chưa có, trả về danh sách trống');
        return {
          success: true,
          family: [],
          count: 0,
          message: 'API chưa có, danh sách trống'
        };
      }
      
      return { 
        success: false, 
        family: [],
        count: 0,
        message: error.message,
        error: error.message
      };
    }
  },

  // ==================== 💰 YCOIN API ====================

  getUserBalance: async (userId) => {
    try {
      if (!userId) {
        throw new ApiError('User ID không được để trống', 400);
      }

      console.log(`💰 Lấy số dư YCoin cho user: ${userId}`);

      const url = `${API_BASE_URL}/api/ycoin/balance?user_id=${encodeURIComponent(userId)}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'accept': 'application/json' },
        timeout: 10000
      });

      return {
        success: true,
        balance: data.balance || 0,
        userId: data.user_id,
        message: 'Lấy số dư thành công'
      };

    } catch (error) {
      console.error('❌ Lấy số dư thất bại:', error);
      return { 
        success: false, 
        balance: 0,
        message: error.message, 
        error: error.message 
      };
    }
  },

  getYCoinTransactions: async (params = {}) => {
    try {
      const {
        user_id = null,
        event_type = null,
        page = 1,
        limit = 20
      } = params;

      console.log(`📜 Lấy lịch sử giao dịch YCoin:`, params);

      const queryParams = new URLSearchParams();
      if (user_id) queryParams.append('user_id', user_id);
      if (event_type) queryParams.append('event_type', event_type);
      queryParams.append('page', page);
      queryParams.append('limit', limit);

      const url = `${API_BASE_URL}/api/ycoin/transactions?${queryParams.toString()}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'accept': 'application/json' },
        timeout: 15000
      });

      return {
        success: true,
        transactions: data.items || [],
        pageinfo: data.pageinfo || {},
        message: 'Lấy lịch sử thành công'
      };

    } catch (error) {
      console.error('❌ Lấy lịch sử thất bại:', error);
      return { 
        success: false, 
        transactions: [],
        pageinfo: {},
        message: error.message, 
        error: error.message 
      };
    }
  },

  formatYCoinTransaction: (transaction) => {
    const eventTypeLabels = {
      'post': '📝 create post',
      'comment': '💬 Comment',
      'witness': '👁️ Witness',
      'amen': '🙏 Amen'
    };

    const eventTypeColors = {
      'post': '#4CAF50',
      'comment': '#2196F3',
      'witness': '#FF9800',
      'amen': '#9C27B0'
    };

    return {
      ...transaction,
      eventLabel: eventTypeLabels[transaction.event_type] || transaction.event_type,
      eventColor: eventTypeColors[transaction.event_type] || '#666666',
      formattedAmount: transaction.amount > 0 ? `+${transaction.amount}` : `${transaction.amount}`,
      isPositive: transaction.amount > 0,
      formattedDate: ApiService.formatDateTime(transaction.created_at)
    };
  },

  testYCoinLogic: async (userId) => {
    console.log('🧪 BẮT ĐẦU TEST YCOIN LOGIC...\n');

    try {
      const initialBalance = await ApiService.getUserBalance(userId);
      console.log(`💰 Balance ban đầu: ${initialBalance.balance}Y\n`);

      console.log('📝 TEST 1: Tạo post...');
      const postResult = await ApiService.createPost(userId, 'Test post for YCoin');
      const postId = postResult.post?.docid;
      
      await ApiService.delay(1000);
      
      const balanceAfterPost = await ApiService.getUserBalance(userId);
      console.log(`   → Balance sau khi post: ${balanceAfterPost.balance}Y`);
      console.log(`   → Tăng: ${balanceAfterPost.balance - initialBalance.balance}Y (Expected: +1Y)\n`);

      console.log('🙏 TEST 2: Amen lần 1...');
      await ApiService.likePost(postId, userId);
      
      await ApiService.delay(1000);
      
      const balanceAfterAmen1 = await ApiService.getUserBalance(userId);
      console.log(`   → Balance sau Amen 1: ${balanceAfterAmen1.balance}Y`);
      console.log(`   → Tăng: ${balanceAfterAmen1.balance - balanceAfterPost.balance}Y (Expected: +0.2Y)\n`);

      console.log('🙏 TEST 3: Amen lần 2 (test limit)...');
      await ApiService.likePost(postId, userId);
      
      await ApiService.delay(1000);
      
      const balanceAfterAmen2 = await ApiService.getUserBalance(userId);
      console.log(`   → Balance sau Amen 2: ${balanceAfterAmen2.balance}Y`);
      console.log(`   → Thay đổi: ${balanceAfterAmen2.balance - balanceAfterAmen1.balance}Y`);
      console.log(`   → Expected: -0.2Y (un-amen) hoặc 0 (không thay đổi)\n`);

      console.log('💬 TEST 4: Comment lần 1...');
      await ApiService.addComment({
        userid: userId,
        content: 'Test comment 1',
        docid: postId
      });
      
      await ApiService.delay(1000);
      
      const balanceAfterComment1 = await ApiService.getUserBalance(userId);
      console.log(`   → Balance sau Comment 1: ${balanceAfterComment1.balance}Y`);
      console.log(`   → Tăng: ${balanceAfterComment1.balance - balanceAfterAmen2.balance}Y (Expected: +1Y)\n`);

      console.log('💬 TEST 5: Comment lần 2 (test limit)...');
      await ApiService.addComment({
        userid: userId,
        content: 'Test comment 2',
        docid: postId
      });
      
      await ApiService.delay(1000);
      
      const balanceAfterComment2 = await ApiService.getUserBalance(userId);
      console.log(`   → Balance sau Comment 2: ${balanceAfterComment2.balance}Y`);
      console.log(`   → Tăng: ${balanceAfterComment2.balance - balanceAfterComment1.balance}Y`);
      console.log(`   → Expected: +1Y (nếu không giới hạn) hoặc 0 (nếu giới hạn 1Y/post)\n`);

      console.log('📜 Lấy lịch sử giao dịch...');
      const txResult = await ApiService.getYCoinTransactions({ user_id: userId, limit: 10 });
      console.log('   → Transactions:');
      txResult.transactions.slice(0, 5).forEach(tx => {
        const formatted = ApiService.formatYCoinTransaction(tx);
        console.log(`      ${formatted.eventLabel}: ${formatted.formattedAmount}Y`);
      });

      console.log('\n✅ TEST HOÀN TẤT!');
      
      return {
        success: true,
        results: {
          initialBalance: initialBalance.balance,
          afterPost: balanceAfterPost.balance,
          afterAmen1: balanceAfterAmen1.balance,
          afterAmen2: balanceAfterAmen2.balance,
          afterComment1: balanceAfterComment1.balance,
          afterComment2: balanceAfterComment2.balance
        }
      };

    } catch (error) {
      console.error('❌ TEST FAILED:', error);
      return { success: false, error: error.message };
    }
  },

  // ==================== 👤 USER PROFILE & AVATAR API ====================

  getUserProfile: async (userId) => {
    try {
      if (!userId) {
        userId = ApiService.getCurrentUserId();
      }

      if (!userId) {
        throw new ApiError('User ID không được để trống', 400);
      }

      console.log(`👤 Lấy profile user: ${userId}`);

      const url = `${AUTH_API_URL}/profile?user_id=${encodeURIComponent(userId)}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'accept': 'application/json' },
        timeout: 10000
      });

      return {
        success: true,
        profile: {
          id: data.user_id || data.id,
          user_id: data.user_id || data.id,
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url || null,
          has_custom_avatar: !!data.avatar_url,
          tribe: data.tribe,
          coins: data.coins || 0,
          created_at: data.created_at
        },
        message: 'Lấy profile thành công'
      };

    } catch (error) {
      console.error('❌ Lấy profile thất bại:', error);
      
      if (error.statusCode === 422 || error.statusCode === 400) {
        console.warn('⚠️ API không hỗ trợ user_id parameter');
        return {
          success: false,
          profile: null,
          message: 'API không hỗ trợ lấy profile của user khác',
          error: error.message
        };
      }
      
      return { 
        success: false, 
        profile: null,
        message: error.message, 
        error: error.message 
      };
    }
  },

  getAvatarUrl: (userId, profileData = null) => {
    if (!userId) return null;
    
    if (profileData && profileData.avatar_url) {
      const avatarUrl = profileData.avatar_url;
      
      if (avatarUrl.startsWith('uploads/')) {
        return `${API_BASE_URL}/${avatarUrl}?t=${Date.now()}`;
      }
      
      if (avatarUrl.startsWith('http')) {
        return avatarUrl;
      }
      
      return `${API_BASE_URL}/${avatarUrl}?t?t=${Date.now()}`;
    }
    
    return `${AUTH_API_URL}/profile/avatar?user_id=${encodeURIComponent(userId)}&t=${Date.now()}`;
  },

  getUserAvatar: async (userId) => {
    try {
      if (!userId) {
        throw new ApiError('User ID không được để trống', 400);
      }

      console.log(`🖼️ Lấy avatar cho user: ${userId}`);

      const profileResult = await ApiService.getUserProfile(userId);

      if (profileResult.success && profileResult.profile && profileResult.profile.avatar_url) {
        let avatarUrl = profileResult.profile.avatar_url;
        
        if (avatarUrl.startsWith('uploads/')) {
          avatarUrl = `${API_BASE_URL}/${avatarUrl}`;
        }
        
        return {
          success: true,
          avatar_url: avatarUrl,
          user_id: profileResult.profile.user_id || userId,
          profile: profileResult.profile,
          message: 'Lấy avatar thành công'
        };
      }

      try {
        const avatarUrl = `${AUTH_API_URL}/profile/avatar?user_id=${encodeURIComponent(userId)}`;
        
        const response = await fetch(avatarUrl, {
          method: 'GET',
          credentials: 'include',
          headers: { 'accept': 'image/*' }
        });

        if (response.ok) {
          return {
            success: true,
            avatar_url: avatarUrl,
            user_id: userId,
            message: 'Lấy avatar thành công'
          };
        }
      } catch (avatarError) {
        console.warn('⚠️ Không thể lấy avatar trực tiếp:', avatarError.message);
      }

      return {
        success: true,
        avatar_url: null,
        user_id: userId,
        message: 'User chưa có avatar'
      };

    } catch (error) {
      console.error('❌ Lấy avatar thất bại:', error);
      
      return { 
        success: false, 
        avatar_url: null,
        user_id: userId,
        message: error.message,
        error: error.message
      };
    }
  },

  uploadAvatar: async (userId, imageFile) => {
    try {
      if (!userId) {
        throw new ApiError('User ID không được để trống', 400);
      }

      if (!imageFile || !(imageFile instanceof File)) {
        throw new ApiError('File ảnh không hợp lệ', 400);
      }

      if (!imageFile.type.startsWith('image/')) {
        throw new ApiError('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)', 400);
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        throw new ApiError('Kích thước file phải nhỏ hơn 5MB', 400);
      }

      console.log('📸 Upload avatar:', imageFile.name, 
                  `(${(imageFile.size / 1024).toFixed(2)} KB)`);

      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('avatar_url', '');

      console.log('📤 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`  ${key}: "${value}"`);
        }
      }

      const response = await fetch(
        `${AUTH_API_URL}/profile/avatar`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData
        }
      );

      console.log('📥 Response status:', response.status);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📥 Response data:', data);
      } else {
        const text = await response.text();
        console.log('📥 Response text:', text);
        
        if (response.ok && text) {
          const avatarUrl = text.replace(/"/g, '');
          return {
            success: true,
            avatar_url: avatarUrl,
            message: 'Upload avatar thành công'
          };
        }
        
        throw new ApiError('Backend trả về không phải JSON', response.status);
      }

      if (!response.ok) {
        let errorMessage = 'Upload avatar thất bại';
        
        if (data.detail) {
          if (typeof data.detail === 'string') {
            errorMessage = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorMessage = data.detail.map(err => 
              `[${err.loc?.join(' > ') || 'unknown'}] ${err.msg}`
            ).join(', ');
          }
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        throw new ApiError(errorMessage, response.status, data);
      }

      cache.clear();

      let avatarUrl = null;
      
      if (typeof data === 'string') {
        avatarUrl = data;
      } else if (data.ok && data.profile) {
        avatarUrl = data.profile.avatar_url;
      } else if (data.avatar_url) {
        avatarUrl = data.avatar_url;
      } else if (data.data?.avatar_url) {
        avatarUrl = data.data.avatar_url;
      }

      return {
        success: true,
        avatar_url: avatarUrl,
        profile: data.profile || null,
        message: 'Upload avatar thành công'
      };

    } catch (error) {
      console.error('❌ Upload avatar thất bại:', error);
      return { 
        success: false, 
        message: error.message, 
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  deleteAvatar: async (userId) => {
    try {
      if (!userId) {
        throw new ApiError('User ID không được để trống', 400);
      }

      console.log('🗑️ Xóa avatar user:', userId);

      const { data } = await ApiService.makeRequest(
        `${AUTH_API_URL}/profile/avatar`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'accept': 'application/json' }
        }
      );

      cache.clear();

      return {
        success: true,
        message: data.message || 'Xóa avatar thành công'
      };

    } catch (error) {
      console.error('❌ Xóa avatar thất bại:', error);
      return { 
        success: false, 
        message: error.message, 
        error: error.message 
      };
    }
  },

  // ==================== 🤖 AI API ====================

  sendAIMessage: async (messages, sessionUuid = null) => {
    try {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new ApiError('Messages array không được để trống', 400);
      }

      console.log('🤖 Gửi tin nhắn đến AI:', { 
        messageCount: messages.length, 
        sessionUuid 
      });

      const payload = {
        messages: messages,
        ...(sessionUuid && { session_uuid: sessionUuid })
      };

      const { data } = await ApiService.makeRequest(
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(payload),
          timeout: 30000
        }
      );

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          message: data.data.message,
          sessionUuid: data.data.session_uuid,
          provider: data.data.provider,
          model: data.data.model,
          finishReason: data.data.finish_reason,
          usage: data.data.usage,
          title: data.data.title,
          expired: data.data.expired
        };
      }

      throw new ApiError('Invalid AI response format', 500);

    } catch (error) {
      console.error('❌ AI message error:', error);
      return {
        success: false,
        message: error.message,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  getAISessions: async () => {
    try {
      console.log('📋 Lấy danh sách AI sessions...');

      const { data } = await ApiService.makeRequest(
        `${API_BASE_URL}/api/ai/sessions`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'accept': 'application/json' }
        }
      );

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          sessions: data.data,
          message: data.message || 'Lấy sessions thành công'
        };
      }

      throw new ApiError('Invalid response format', 500);

    } catch (error) {
      console.error('❌ Get AI sessions error:', error);
      return {
        success: false,
        sessions: [],
        message: error.message,
        error: error.message
      };
    }
  },

  getAISession: async (sessionUuid) => {
    try {
      if (!sessionUuid) {
        throw new ApiError('Session UUID không được để trống', 400);
      }

      console.log(`📖 Lấy chi tiết session: ${sessionUuid}`);

      const { data } = await ApiService.makeRequest(
        `${API_BASE_URL}/api/ai/sessions/${encodeURIComponent(sessionUuid)}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'accept': 'application/json' }
        }
      );

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          session: data.data.session,
          messages: data.data.messages,
          message: data.message || 'Lấy session thành công'
        };
      }

      throw new ApiError('Invalid response format', 500);

    } catch (error) {
      console.error('❌ Get AI session error:', error);
      return {
        success: false,
        session: null,
        messages: [],
        message: error.message,
        error: error.message
      };
    }
  },

  endAISession: async (sessionUuid) => {
    try {
      if (!sessionUuid) {
        throw new ApiError('Session UUID không được để trống', 400);
      }

      console.log(`🔚 Kết thúc session: ${sessionUuid}`);

      const { data } = await ApiService.makeRequest(
        `${API_BASE_URL}/api/ai/sessions/${encodeURIComponent(sessionUuid)}/end`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          }
        }
      );

      if (data && data.status === 'success') {
        return {
          success: true,
          session: data.data,
          message: data.message || 'Kết thúc session thành công'
        };
      }

      throw new ApiError('Invalid response format', 500);

    } catch (error) {
      console.error('❌ End AI session error:', error);
      return {
        success: false,
        message: error.message,
        error: error.message
      };
    }
  },

  getAIUsage: async () => {
    try {
      console.log('📊 Lấy thông tin AI usage...');

      const { data } = await ApiService.makeRequest(
        `${API_BASE_URL}/api/ai/usage`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'accept': 'application/json' }
        }
      );

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          used: data.data.used,
          limit: data.data.limit,
          windowHours: data.data.window_hours,
          resetsAt: data.data.resets_at,
          message: data.message || 'Lấy usage thành công'
        };
      }

      throw new ApiError('Invalid response format', 500);

    } catch (error) {
      console.error('❌ Get AI usage error:', error);
      return {
        success: false,
        used: 0,
        limit: 0,
        message: error.message,
        error: error.message
      };
    }
  },

  // ==================== 🌐 GOOGLE TRANSLATION API ====================

  translate: async (text, targetLang, sourceLang = null) => {
    try {
      if (!text || (Array.isArray(text) && text.length === 0)) {
        throw new ApiError('Text không được để trống', 400);
      }

      if (!targetLang) {
        throw new ApiError('Target language không được để trống', 400);
      }

      console.log(`🌐 Dịch sang ${targetLang}:`, 
        Array.isArray(text) ? `${text.length} đoạn` : text.substring(0, 50) + '...'
      );

      const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDwa1Yuu7ihKTeXU4eFrsqkbxR2a6Vf7Jw';
      const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

      const params = new URLSearchParams({
        key: GOOGLE_TRANSLATE_API_KEY,
        target: targetLang,
        format: 'text'
      });

      if (sourceLang) {
        params.append('source', sourceLang);
      }

      const textArray = Array.isArray(text) ? text : [text];
      textArray.forEach(t => params.append('q', t));

      const url = `${TRANSLATE_URL}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.error?.message || 'Translation failed',
          response.status,
          errorData
        );
      }

      const data = await response.json();

      if (data && data.data && data.data.translations) {
        const translations = data.data.translations.map(t => ({
          translatedText: t.translatedText,
          detectedSourceLanguage: t.detectedSourceLanguage || sourceLang
        }));

        return {
          success: true,
          translations: translations,
          translatedText: Array.isArray(text) 
            ? translations.map(t => t.translatedText)
            : translations[0].translatedText,
          detectedSourceLanguage: translations[0].detectedSourceLanguage,
          message: 'Dịch thành công'
        };
      }

      throw new ApiError('Invalid translation response', 500);

    } catch (error) {
      console.error('❌ Translation failed:', error);
      return {
        success: false,
        translatedText: Array.isArray(text) ? text : text,
        message: error.message,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  detectLanguage: async (text) => {
    try {
      if (!text || (Array.isArray(text) && text.length === 0)) {
        throw new ApiError('Text không được để trống', 400);
      }

      console.log('🔍 Phát hiện ngôn ngữ:', 
        Array.isArray(text) ? `${text.length} đoạn` : text.substring(0, 50) + '...'
      );

      const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDwa1Yuu7ihKTeXU4eFrsqkbxR2a6Vf7Jw';
      const DETECT_URL = 'https://translation.googleapis.com/language/translate/v2/detect';

      const params = new URLSearchParams({
        key: GOOGLE_TRANSLATE_API_KEY
      });

      const textArray = Array.isArray(text) ? text : [text];
      textArray.forEach(t => params.append('q', t));

      const url = `${DETECT_URL}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.error?.message || 'Language detection failed',
          response.status,
          errorData
        );
      }

      const data = await response.json();

      if (data && data.data && data.data.detections) {
        const detections = data.data.detections.map(detection => ({
          language: detection[0].language,
          confidence: detection[0].confidence,
          isReliable: detection[0].isReliable
        }));

        return {
          success: true,
          detections: detections,
          language: Array.isArray(text) 
            ? detections.map(d => d.language)
            : detections[0].language,
          confidence: Array.isArray(text)
            ? detections.map(d => d.confidence)
            : detections[0].confidence,
          message: 'Phát hiện ngôn ngữ thành công'
        };
      }

      throw new ApiError('Invalid detection response', 500);

    } catch (error) {
      console.error('❌ Language detection failed:', error);
      return {
        success: false,
        language: null,
        message: error.message,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  getSupportedLanguages: async (targetLang = 'en') => {
    try {
      console.log(`🌍 Lấy danh sách ngôn ngữ hỗ trợ (target: ${targetLang})`);

      const GOOGLE_TRANSLATE_API_KEY = 'AIzaSyDwa1Yuu7ihKTeXU4eFrsqkbxR2a6Vf7Jw';
      const LANGUAGES_URL = 'https://translation.googleapis.com/language/translate/v2/languages';

      const params = new URLSearchParams({
        key: GOOGLE_TRANSLATE_API_KEY,
        target: targetLang
      });

      const url = `${LANGUAGES_URL}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ApiError(
          errorData.error?.message || 'Failed to get languages',
          response.status,
          errorData
        );
      }

      const data = await response.json();

      if (data && data.data && data.data.languages) {
        return {
          success: true,
          languages: data.data.languages,
          count: data.data.languages.length,
          message: `Lấy ${data.data.languages.length} ngôn ngữ thành công`
        };
      }

      throw new ApiError('Invalid languages response', 500);

    } catch (error) {
      console.error('❌ Get languages failed:', error);
      return {
        success: false,
        languages: [],
        count: 0,
        message: error.message,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  },

  translatePost: async (post, targetLang) => {
    try {
      if (!post || !post.content) {
        throw new ApiError('Post content không được để trống', 400);
      }

      console.log(`🌐 Dịch post ${post.docid || post.sn} sang ${targetLang}`);

      const result = await ApiService.translate(post.content, targetLang);

      if (result.success) {
        return {
          success: true,
          originalPost: post,
          translatedContent: result.translatedText,
          detectedLanguage: result.detectedSourceLanguage,
          targetLanguage: targetLang,
          message: 'Dịch post thành công'
        };
      }

      throw new ApiError(result.message || 'Translation failed', 500);

    } catch (error) {
      console.error('❌ Translate post failed:', error);
      return {
        success: false,
        originalPost: post,
        translatedContent: post.content,
        message: error.message,
        error: error.message
      };
    }
  },

  translateComment: async (comment, targetLang) => {
    try {
      if (!comment || !comment.content) {
        throw new ApiError('Comment content không được để trống', 400);
      }

      console.log(`🌐 Dịch comment ${comment.docid || comment.sn} sang ${targetLang}`);

      const result = await ApiService.translate(comment.content, targetLang);

      if (result.success) {
        return {
          success: true,
          originalComment: comment,
          translatedContent: result.translatedText,
          detectedLanguage: result.detectedSourceLanguage,
          targetLanguage: targetLang,
          message: 'Dịch comment thành công'
        };
      }

      throw new ApiError(result.message || 'Translation failed', 500);

    } catch (error) {
      console.error('❌ Translate comment failed:', error);
      return {
        success: false,
        originalComment: comment,
        translatedContent: comment.content,
        message: error.message,
        error: error.message
      };
    }
  },

  // ==================== 🔧 USER UTILITY FUNCTIONS ====================

  getCurrentUserId: () => {
    try {
      const userStr = StorageService.getItem('userData') || StorageService.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.userId || user.user_id || user.id || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return null;
    }
  },

  getCurrentUser: () => {
    try {
      const userStr = StorageService.getItem('userData') || StorageService.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        return {
          id: user.userId || user.user_id || user.id,
          userId: user.userId || user.user_id || user.id,
          name: user.name,
          email: user.email,
          tribe: user.tribe,
          provider: user.provider,
          profile: user.profile,
          ...user
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
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

console.log('🎉 API Service đã load! (✅ WITH GOOGLE TRANSLATION API)');
console.log('📦 API Base URL:', API_BASE_URL);
console.log('');
console.log('🌐 Google Translation API: ✅ INTEGRATED');
console.log('   • translate(text, targetLang, sourceLang) - Dịch văn bản');
console.log('   • detectLanguage(text) - Phát hiện ngôn ngữ');
console.log('   • getSupportedLanguages(targetLang) - Danh sách ngôn ngữ');
console.log('   • translatePost(post, targetLang) - Dịch post');
console.log('   • translateComment(comment, targetLang) - Dịch comment');
console.log('');
console.log('👤 Avatar API: ✅ WORKING');
console.log('✨ Witness API: ✅ WORKING');
console.log('🎪 Activities API: ✅ WORKING');
console.log('🔐 Auth, Posts, Friends, YCoin APIs: ✅ WORKING');
console.log('🤖 AI API: ✅ WORKING');
console.log('');
console.log('📋 Available Methods:');
console.log('   🔐 Auth:');
console.log('      - loginWithEmail(email, successUrl)');
console.log('      - getAuthProviders()');
console.log('      - getAuthSession()');
console.log('      - logout()');
console.log('');
console.log('   📝 Posts:');
console.log('      - getPosts(page, limit, forceRefresh, filters)');
console.log('      - createPost(userId, postData, privacy)');
console.log('      - addComment({ userid, content, sn, docid })');
console.log('      - likePost(docid, userId)');
console.log('      - likeComment(commentDocid, userId)');
console.log('      - getComments(postDocid)');
console.log('');
console.log('   ✨ Witness:');
console.log('      - createWitness(userId, content, parentDocid, imageFile)');
console.log('      - getWitnessList(page, limit)');
console.log('');
console.log('   🎪 Activities:');
console.log('      - getActivities(params)');
console.log('      - getActivityById(activityId)');
console.log('      - createActivity(activityData)');
console.log('      - updateActivity(activityId, activityData)');
console.log('      - publishActivity(activityId, isPublish)');
console.log('');
console.log('   👥 Friends:');
console.log('      - sendFriendInvitation(targetUserId, message)');
console.log('      - getFriendInvitations()');
console.log('      - respondToInvitation(inviteId, accept)');
console.log('      - searchUsers(query)');
console.log('      - getFriends(userId)');
console.log('      - getFamily(userId)');
console.log('');
console.log('   💰 YCoin:');
console.log('      - getUserBalance(userId)');
console.log('      - getYCoinTransactions(params)');
console.log('      - formatYCoinTransaction(transaction)');
console.log('      - testYCoinLogic(userId)');
console.log('');
console.log('   👤 User Profile & Avatar:');
console.log('      - getUserProfile(userId)');
console.log('      - getAvatarUrl(userId, profileData)');
console.log('      - getUserAvatar(userId)');
console.log('      - uploadAvatar(userId, imageFile)');
console.log('      - deleteAvatar(userId)');
console.log('');
console.log('   🤖 AI:');
console.log('      - sendAIMessage(messages, sessionUuid)');
console.log('      - getAISessions()');
console.log('      - getAISession(sessionUuid)');
console.log('      - endAISession(sessionUuid)');
console.log('      - getAIUsage()');
console.log('');
console.log('   🌐 Translation: ✅ NEW');
console.log('      - translate(text, targetLang, sourceLang)');
console.log('      - detectLanguage(text)');
console.log('      - getSupportedLanguages(targetLang)');
console.log('      - translatePost(post, targetLang)');
console.log('      - translateComment(comment, targetLang)');
console.log('');
console.log('   🔧 Utilities:');
console.log('      - getCurrentUserId()');
console.log('      - getCurrentUser()');
console.log('      - isAuthenticated()');
console.log('      - clearCache()');
console.log('      - clearAllData()');
console.log('      - formatDateTime(datetime)');
console.log('');
console.log('🚀 Ready to use!');
console.log('');
console.log('💡 CÁCH SỬ DỤNG TRANSLATION API:');
console.log('');
console.log('   // 1. Dịch văn bản đơn giản');
console.log('   const result = await ApiService.translate("Hello World", "vi");');
console.log('   console.log(result.translatedText); // "Xin chào thế giới"');
console.log('');
console.log('   // 2. Dịch nhiều đoạn cùng lúc');
console.log('   const texts = ["Hello", "Good morning", "Thank you"];');
console.log('   const result = await ApiService.translate(texts, "vi");');
console.log('   console.log(result.translatedText); // ["Xin chào", "Chào buổi sáng", "Cảm ơn"]');
console.log('');
console.log('   // 3. Phát hiện ngôn ngữ');
console.log('   const detected = await ApiService.detectLanguage("你好世界");');
console.log('   console.log(detected.language); // "zh-CN"');
console.log('');
console.log('   // 4. Dịch post');
console.log('   const post = { docid: "123", content: "Hello everyone!" };');
console.log('   const translated = await ApiService.translatePost(post, "vi");');
console.log('   console.log(translated.translatedContent); // "Xin chào mọi người!"');
console.log('');
console.log('   // 5. Dịch comment');
console.log('   const comment = { docid: "456", content: "Great post!" };');
console.log('   const translated = await ApiService.translateComment(comment, "zh-TW");');
console.log('   console.log(translated.translatedContent); // "很棒的貼文!"');
console.log('');
console.log('   // 6. Lấy danh sách ngôn ngữ hỗ trợ');
console.log('   const langs = await ApiService.getSupportedLanguages("vi");');
console.log('   console.log(langs.languages); // [{ language: "en", name: "Tiếng Anh" }, ...]');
console.log('');
console.log('🌍 MÃ NGÔN NGỮ PHỔ BIẾN:');
console.log('   • vi: Tiếng Việt');
console.log('   • en: English');
console.log('   • zh-TW: 繁體中文 (Traditional Chinese)');
console.log('   • zh-CN: 简体中文 (Simplified Chinese)');
console.log('   • ja: 日本語 (Japanese)');
console.log('   • ko: 한국어 (Korean)');
console.log('   • th: ภาษาไทย (Thai)');
console.log('   • fr: Français (French)');
console.log('   • de: Deutsch (German)');
console.log('   • es: Español (Spanish)');
console.log('');
console.log('⚠️ LƯU Ý BẢO MẬT:');
console.log('   • API Key hiện đang hardcode trong code');
console.log('   • NÊN chuyển sang biến môi trường (.env):');
console.log('     VITE_GOOGLE_TRANSLATE_API_KEY=AIzaSy...');
console.log('   • Hoặc lưu trong backend và gọi qua proxy');
console.log('');

