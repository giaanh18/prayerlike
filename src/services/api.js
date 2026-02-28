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
  
  processAvatarUrl: (avatarUrl) => {
    if (!avatarUrl) return null;

    // Nếu đã là URL đầy đủ (http/https), trả về nguyên bản
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }

    // Nếu là đường dẫn tương đối (bắt đầu bằng /), ghép với API_BASE_URL
    if (avatarUrl.startsWith('/')) {
      return `${API_BASE_URL}${avatarUrl}`;
    }

    // Fallback: thêm / vào đầu
    return `${API_BASE_URL}/${avatarUrl}`;
  },
    // ✅ THÊM FUNCTION NÀY
getUserAvatar: async (userId) => {
  try {
    if (!userId) {
      console.warn('⚠️ getUserAvatar: No userId provided');
      return null;
    }

    console.log(`👤 Fetching avatar for user: ${userId}`);

    // ✅ GỌI API LẤY THÔNG TIN USER
    const url = `${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`;

    const { data } = await ApiService.makeRequest(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'accept': 'application/json' },
      timeout: 10000
    });

    // ✅ PARSE AVATAR URL TỪ RESPONSE
    if (data && data.status === 'success' && data.data) {
      const avatarUrl = data.data.avatar_url || data.data.avatar || null;
      
      if (avatarUrl) {
        const processedUrl = ApiService.processAvatarUrl(avatarUrl);
        console.log(`✅ Avatar found for ${userId}:`, processedUrl);
        return processedUrl;
      }
    }

    console.warn(`⚠️ No avatar found for user: ${userId}`);
    return null;

  } catch (error) {
    console.error(`❌ Error fetching avatar for ${userId}:`, error);
    
    // ✅ KHÔNG THROW LỖI - TRẢ VỀ NULL ĐỂ HIỂN THỊ FALLBACK
    return null;
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

      // ✅ NEW STRUCTURE
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

      // ✅ FALLBACK: Old structure
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

  createWitness: async (userId, content, parentDocid) => {
    try {
      console.log(`✨ Create Witness for ${parentDocid}`);

      const { data } = await ApiService.makeRequest(`${POSTS_API_URL}/witness`, {
        method: 'POST',
        credentials: 'include',
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

  getWitnessList: async (page = 1, limit = 10) => {
    try {
      const params = new URLSearchParams({ page, limit });
      const url = `${POSTS_API_URL}/witness-list?${params.toString()}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include'
      });

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

  // ==================== 🎪 ACTIVITIES API (✅ FIXED - NO TRIBE PARAM) ====================

  getActivities: async (params = {}) => {
    try {
      const {
        page = 1,
        limit = 10
        // ❌ XÓA - Backend không hỗ trợ:
        // tribe = null,
        // is_published = null
      } = params;

      // ✅ CHỈ GỬI page và limit
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

      // ✅ Parse response - Support multiple formats
      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          activities: data.data.activities || data.data || [],
          pageinfo: data.data.pageinfo || {},
          total: data.data.total || (data.data.activities?.length || 0),
          message: data.message || 'Lấy activities thành công'
        };
      }

      // ✅ Fallback: Direct array
      if (Array.isArray(data)) {
        return {
          success: true,
          activities: data,
          pageinfo: {},
          total: data.length,
          message: 'Lấy activities thành công'
        };
      }

      // ✅ Fallback: Data at root
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

      // ✅ GỌI API SEARCH USERS
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

      // ✅ PARSE RESPONSE - BACKEND TRẢ VỀ data.data.results ARRAY
      if (data && data.status === 'success' && data.data && data.data.results) {

        console.log('📊 Results array:', data.data.results);

        // ✅ KIỂM TRA CÓ KẾT QUẢ KHÔNG
        if (data.data.results.length === 0) {
          return {
            success: false,
            users: [],
            message: 'Không tìm thấy người dùng'
          };
        }

        // ✅ CHUYỂN ĐỔI TẤT CẢ RESULTS THÀNH USER OBJECTS
        const users = data.data.results.map(result => {
          // ✅ FALLBACK: name → user_id → email prefix → 'Unknown User'
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
            avatar: null
          };
        });

        console.log('✅ Parsed users:', users);

        // ✅ LOG CHI TIẾT TỪNG USER
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

      // ✅ Không tìm thấy
      return {
        success: false,
        users: [],
        message: data?.message || 'Không tìm thấy người dùng'
      };

    } catch (error) {
      console.error('❌ Tìm kiếm thất bại:', error);

      // ✅ XỬ LÝ CÁC LOẠI LỖI
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
        avatar: friend.avatar || null,
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
        avatar: member.avatar || null,
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


  getNotifications: async (params = {}) => {
    try {
      const limit = params.limit !== undefined ? params.limit : 20;
      const offset = params.offset !== undefined ? params.offset : 0;
      const unreadOnly = params.unreadOnly !== undefined ? params.unreadOnly : (params.unread_only !== undefined ? params.unread_only : false);

      const queryParams = new URLSearchParams({
        limit: limit,
        offset: offset,
        unread_only: unreadOnly
      });
      
      const url = `${API_BASE_URL}/api/notifications?${queryParams.toString()}`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'accept': 'application/json' }
      });

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          notifications: data.data.notifications || [],
          total: data.data.total || 0,
          unread_count: data.data.unread_count || 0,
          message: data.message || '取得通知列表成功'
        };
      }

      throw new ApiError('無效的回應格式', 500);

    } catch (error) {
      console.error('取得通知列表失敗:', error);
      return {
        success: false,
        notifications: [],
        total: 0,
        unread_count: 0,
        message: error.message,
        error: error.message
      };
    }
  },

  
  markNotificationAsRead: async (notificationId) => {
    try {
      if (!notificationId) {
        throw new ApiError('必須提供通知 ID', 400);
      }

      const url = `${API_BASE_URL}/api/notifications/${encodeURIComponent(notificationId)}/read`;

      const { data } = await ApiService.makeRequest(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'accept': 'application/json' }
      });

      if (data && data.status === 'success' && data.data) {
        return {
          success: true,
          notification: data.data,
          message: data.message || '標示為已讀成功'
        };
      }

      throw new ApiError('無效的回應格式', 500);

    } catch (error) {
      console.error('標示通知為已讀失敗:', error);
      return {
        success: false,
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
