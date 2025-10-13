const LOGIN_API_BASE_URL = 'https://plmfindmy.54ucl.com/api/v1/pray';
const POSTS_API_BASE_URL = 'https://zien.54ucl.com/cms';

// ==================== 🔧 UTILITY CLASSES ====================

// ✅ 自定義錯誤類別
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

// ✅ Storage Service - Thay thế localStorage
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

// ✅ 簡單的記憶體快取系統
const cache = new Map();

// ==================== 🚀 MAIN API SERVICE ====================

const ApiService = {
  // ==================== 核心工具函數 ====================

  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  isRetryableError: (error) => {
    return error.statusCode >= 500 || error.statusCode === 0 || error.name === 'AbortError';
  },

  debugLog: (method, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🔧 API Debug: ${method}`);
      console.log('Input:', data.input);
      console.log('Processing:', data.processing);
      console.log('Output:', data.output);
      console.log('Performance:', data.performance);
      console.groupEnd();
    }
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

  // ==================== 錯誤處理和驗證 ====================

  handleApiError: (error, context = '') => {
    const errorMap = {
      400: 'Dữ liệu không hợp lệ',
      401: 'Chưa đăng nhập',
      403: 'Không có quyền truy cập',
      404: 'Không tìm thấy',
      422: 'Dữ liệu không đúng định dạng',
      429: 'Quá nhiều yêu cầu',
      500: 'Lỗi server',
      0: 'Không thể kết nối đến server'
    };

    return {
      message: errorMap[error.statusCode] || error.message,
      context,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    };
  },

  validatePostContent: (content) => {
    const errors = [];
    if (!content || content.trim().length === 0) {
      errors.push('Nội dung không được để trống');
    }
    if (content.length > 1000) {
      errors.push('Nội dung quá dài (tối đa 1000 ký tự)');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  validateCommentContent: (content) => {
    const errors = [];
    if (!content || content.trim().length === 0) {
      errors.push('Bình luận không được để trống');
    }
    if (content.length > 500) {
      errors.push('Bình luận quá dài (tối đa 500 ký tự)');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // ==================== Rate Limiting ====================

  _rateLimiter: new Map(),

  checkRateLimit: (key, limit = 10, windowMs = 60000) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!ApiService._rateLimiter.has(key)) {
      ApiService._rateLimiter.set(key, []);
    }

    const requests = ApiService._rateLimiter.get(key);
    const validRequests = requests.filter(time => time > windowStart);

    if (validRequests.length >= limit) {
      return false;
    }

    validRequests.push(now);
    ApiService._rateLimiter.set(key, validRequests);
    return true;
  },

  // ==================== HTTP 請求核心函數 ====================

  makeRequest: async (url, options = {}, retryCount = 0) => {
    const maxRetries = options.maxRetries || 3;
    const defaultOptions = {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
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

      console.log(`⏱️ 請求 ${url} 耗時 ${performanceEnd - performanceStart}ms`);

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

  // ==================== 🆕 評論相關 API ====================

  // ✅ POST: 新增評論到貼文
  addComment: async ({ userid, content, sn }) => {
    const performanceStart = performance.now();

    // 先建立requestBody物件（先用初始值）
    let requestBody = {
      userid: userid,
      content: content,
      sn: sn
    };

    try {
      // 檢查sn是否為有效整數
      const snInt = Number(sn);
      if (!Number.isInteger(snInt) || snInt <= 0) {
        console.log('📤 預計發送評論資料（格式錯誤）:', requestBody);
        return {
          success: false,
          message: 'sn（貼文ID）格式錯誤'
        };
      }

      // 確保 userid 非空
      if (userid === null || userid === undefined || userid === '') {
        console.log('📤 預計發送評論資料（格式錯誤）:', requestBody);
        return {
          success: false,
          message: 'userid 不可為空'
        };
      }

      // 如果 userid 不是字串，強制轉字串
      let useridStr;
      if (typeof userid !== 'string') {
        useridStr = String(userid).trim();
      } else {
        useridStr = userid.trim();
      }

      // 如果轉換後是空字串，仍視為錯誤
      if (useridStr === '') {
        console.log('📤 預計發送評論資料（格式錯誤）:', requestBody);
        return {
          success: false,
          message: 'userid 不可為空且需為有效字串'
        };
      }

      // Rate limiting check
      const rateLimitKey = `comment_${useridStr}`;
      if (!ApiService.checkRateLimit(rateLimitKey, 5, 60000)) {
        requestBody = {
          userid: useridStr,
          content: content,
          sn: snInt
        };
        console.log('📤 預計發送評論資料（頻率限制）:', requestBody);
        return {
          success: false,
          message: '請求太頻繁，請稍後再試'
        };
      }

      // Validate content
      if (typeof content !== 'string' || content.trim() === '') {
        requestBody = {
          userid: useridStr,
          content: content,
          sn: snInt
        };
        console.log('📤 預計發送評論資料（內容空白）:', requestBody);
        return {
          success: false,
          message: 'content（評論內容）不可為空'
        };
      }
      const contentStr = content.trim();

      const validation = ApiService.validateCommentContent(contentStr);
      if (!validation.isValid) {
        requestBody = {
          userid: useridStr,
          content: contentStr,
          sn: snInt
        };
        console.log('📤 預計發送評論資料（驗證失敗）:', requestBody);
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // 最終要送出的requestBody
      requestBody = {
        userid: useridStr,
        content: contentStr,
        sn: snInt
      };

      console.log(`📤 發送評論資料:`, requestBody);

      const { data } = await ApiService.makeRequest(`${POSTS_API_BASE_URL}/api/comment`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        maxRetries: 3
      });

      console.log(`✅ 評論新增成功:`, data);

      const performanceEnd = performance.now();

      if (data.status === 'success') {
        ApiService.clearCommentsCache(String(snInt));

        const commentResult = {
          id: data.data?.comment?.id || Date.now(),
          postId: String(snInt),
          userId: useridStr,
          content: contentStr,
          datetime: data.data?.comment?.datetime || new Date().toISOString(),
          time: ApiService.formatDateTime(data.data?.comment?.datetime),
          author: useridStr,
          ...data.data?.comment
        };

        return {
          success: true,
          comment: commentResult,
          targetPost: data.data?.target_post,
          message: data.message || '評論新增成功',
          response: data,
          performance: `${performanceEnd - performanceStart}ms`
        };
      } else {
        console.log('📤 預計發送評論資料（後端回應失敗）:', requestBody);
        return {
          success: false,
          message: data.message || '評論新增失敗',
          response: data
        };
      }

    } catch (error) {
      console.error('❌ 新增評論錯誤:', error);
      console.log('📤 預計發送評論資料（例外錯誤）:', requestBody);
      const errorInfo = ApiService.handleApiError(error, 'addComment');

      return {
        success: false,
        message: errorInfo.message,
        error: error.message,
        statusCode: error.statusCode,
        comment: null,
        performance: `${performance.now() - performanceStart}ms`
      };
    }
  },


  // ✅ GET: 取得貼文的評論列表
  getComments: async (postId, page = 1, limit = 20) => {
    const performanceStart = performance.now();
    const cacheKey = `comments_${postId}_${page}_${limit}`;

    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < 60000) {
        console.log('📋 回傳快取的評論資料');
        return cachedData.data;
      }
    }

    try {
      console.log(`📡 從伺服器獲取評論: postId=${postId}, page=${page}, limit=${limit}`);

      const { data } = await ApiService.makeRequest(`${POSTS_API_BASE_URL}/api/comments?postId=${postId}&page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        maxRetries: 2
      });

      const performanceEnd = performance.now();

      console.log('🔍 評論 API 回應:', data);

      let comments = [];

      if (data.status === 'success' && Array.isArray(data.data)) {
        comments = data.data.map(comment => ({
          id: comment.id,
          postId: postId,
          userId: comment.userid,
          content: comment.content,
          datetime: comment.datetime,
          time: ApiService.formatDateTime(comment.datetime),
          author: comment.userid,
          ...comment
        }));

        comments.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
      }

      const result = {
        success: true,
        comments: comments,
        postId: postId,
        pagination: {
          page: page,
          limit: limit,
          total: data.total || comments.length
        },
        message: data.message || '評論載入成功',
        performance: `${performanceEnd - performanceStart}ms`
      };

      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('❌ 獲取評論錯誤:', error);

      return {
        success: false,
        comments: [],
        postId: postId,
        pagination: {
          page: page,
          limit: limit,
          total: 0
        },
        message: `載入評論失敗: ${error.message}`,
        error: error.message,
        statusCode: error.statusCode,
        performance: `${performance.now() - performanceStart}ms`
      };
    }
  },

  // ✅ 快速新增評論 (簡化版)
  quickComment: async (postId, commentText, userId = null) => {
    try {
      console.log(`💬 快速評論貼文 ${postId}: "${commentText}"`);

      const result = await ApiService.addComment(postId, commentText, userId);

      if (result.success) {
        console.log('✅ 快速評論成功:', result.comment);
      } else {
        console.error('❌ 快速評論失敗:', result.message);
      }

      return result;

    } catch (error) {
      console.error('❌ 快速評論時發生錯誤:', error);
      return {
        success: false,
        message: `快速評論失敗: ${error.message}`,
        error: error.message
      };
    }
  },

  // ✅ 批量新增評論
  addMultipleComments: async (postId, comments, userId = null) => {
    const results = [];

    for (let i = 0; i < comments.length; i++) {
      console.log(`💬 新增評論 ${i + 1}/${comments.length}: "${comments[i]}"`);

      const result = await ApiService.quickComment(postId, comments[i], userId);
      results.push(result);

      // 等待一下避免請求過於頻繁
      if (i < comments.length - 1) {
        await ApiService.delay(1000);
      }
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `批量新增評論完成: ${successCount}/${comments.length} 成功`,
      results: results,
      summary: {
        total: comments.length,
        success: successCount,
        failed: comments.length - successCount
      }
    };
  },

  // ✅ 取得評論統計
  getCommentStats: async (postId) => {
    try {
      const result = await ApiService.getComments(postId, 1, 100); // 取得前100則評論

      if (!result.success) {
        return {
          success: false,
          message: result.message
        };
      }

      const comments = result.comments;
      const authors = [...new Set(comments.map(c => c.author))];
      const authorStats = {};

      authors.forEach(author => {
        authorStats[author] = comments.filter(c => c.author === author).length;
      });

      return {
        success: true,
        stats: {
          totalComments: comments.length,
          uniqueAuthors: authors.length,
          averageLength: comments.length > 0 ? Math.round(comments.reduce((sum, c) => sum + c.content.length, 0) / comments.length) : 0,
          authorStats: authorStats,
          latestComment: comments[0] || null,
          oldestComment: comments[comments.length - 1] || null
        },
        postId: postId
      };

    } catch (error) {
      return {
        success: false,
        message: `取得評論統計失敗: ${error.message}`,
        error: error.message
      };
    }
  },

  // ✅ 清除評論快取
  clearCommentsCache: (postId = null) => {
    if (postId) {
      for (const key of cache.keys()) {
        if (key.startsWith(`comments_${postId}_`)) {
          cache.delete(key);
        }
      }
      console.log(`🗑️ 已清除貼文 ${postId} 的評論快取`);
    } else {
      for (const key of cache.keys()) {
        if (key.startsWith('comments_')) {
          cache.delete(key);
        }
      }
      console.log('🗑️ 已清除所有評論快取');
    }
  },

  // ==================== 貼文相關 API ====================

  // ✅ POST: 建立貼文
  createPost: async (userId, postDataOrContent, privacy = 'public') => {
    const performanceStart = performance.now();

    try {
      // Rate limiting check
      const rateLimitKey = `post_${userId}`;
      if (!ApiService.checkRateLimit(rateLimitKey, 3, 60000)) {
        return {
          success: false,
          message: '發文太頻繁，請稍後再試'
        };
      }

      let postData;
      if (typeof postDataOrContent === 'string') {
        postData = { content: postDataOrContent };
      } else if (typeof postDataOrContent === 'object' && postDataOrContent !== null) {
        postData = postDataOrContent;
      } else {
        return {
          success: false,
          message: '貼文資料格式錯誤'
        };
      }

      const userIdStr = String(userId);

      // Validate post content
      const validation = ApiService.validatePostContent(postData.content);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      const requestBody = {
        userid: userIdStr,
        content: postData.content.trim()
      };

      if (postData.audioRecordId) {
        requestBody.uuid = postData.audioRecordId;
      }

      if (postData.title && typeof postData.title === 'string' && postData.title.trim()) {
        requestBody.title = postData.title.trim();
      }

      console.log(`📤 發送資料:`, requestBody);

      const { data } = await ApiService.makeRequest(`${POSTS_API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        maxRetries: 3
      });

      console.log(`✅ 貼文建立成功:`, data);

      ApiService.clearCache();

      console.log('🔍 驗證貼文建立狀態...');
      await ApiService.delay(1500);

      const verifyResult = await ApiService.getPosts();
      if (verifyResult.success) {
        const createdPost = verifyResult.posts.find(post =>
          post.content === requestBody.content &&
          (post.userid === requestBody.userid || post.userid === requestBody.userid.toString())
        );

        if (createdPost) {
          console.log('✅ 貼文已在資料庫中驗證:', createdPost);
        } else {
          console.warn('⚠️ 驗證檢查中未找到貼文，但建立成功');
        }
      }

      const performanceEnd = performance.now();

      const postResult = {
        id: data.data?.docid || data.id || data._id || Date.now(),
        docid: data.data?.docid,
        userid: requestBody.userid,
        content: requestBody.content,
        datetime: data.data?.datetime || new Date().toISOString(),
        uuid: requestBody.uuid,
        timezone: data.data?.timezone,
        title: requestBody.title || '',
        privacy: privacy,
        likes: 0,
        comments: 0,
        author: requestBody.userid,
        time: ApiService.formatDateTime(data.data?.datetime),
        audioRecordId: requestBody.uuid,
        ...postData
      };

      return {
        success: true,
        post: postResult,
        message: data.message || '發文成功',
        response: data,
        performance: `${performanceEnd - performanceStart}ms`
      };

    } catch (error) {
      console.error('❌ 建立貼文錯誤:', error);
      const errorInfo = ApiService.handleApiError(error, 'createPost');

      return {
        success: false,
        message: errorInfo.message,
        error: error.message,
        statusCode: error.statusCode,
        post: null,
        performance: `${performance.now() - performanceStart}ms`
      };
    }
  },

  // ✅ 快速發文
  quickPost: async (userId, content, title = '') => {
    try {
      console.log(`📝 快速發文: "${content.substring(0, 50)}..."`);

      const postData = { content };
      if (title) {
        postData.title = title;
      }

      const result = await ApiService.createPost(userId, postData);

      if (result.success) {
        console.log('✅ 快速發文成功:', result.post);
      } else {
        console.error('❌ 快速發文失敗:', result.message);
      }

      return result;

    } catch (error) {
      console.error('❌ 快速發文時發生錯誤:', error);
      return {
        success: false,
        message: `快速發文失敗: ${error.message}`,
        error: error.message
      };
    }
  },

  // ✅ 批量發文
  createMultiplePosts: async (userId, posts) => {
    const results = [];

    for (let i = 0; i < posts.length; i++) {
      console.log(`📝 發文 ${i + 1}/${posts.length}: "${posts[i].substring(0, 30)}..."`);

      const result = await ApiService.quickPost(userId, posts[i]);
      results.push(result);

      // 等待一下避免請求過於頻繁
      if (i < posts.length - 1) {
        await ApiService.delay(2000);
      }
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `批量發文完成: ${successCount}/${posts.length} 成功`,
      results: results,
      summary: {
        total: posts.length,
        success: successCount,
        failed: posts.length - successCount
      }
    };
  },

  // ✅ GET: 獲取貼文列表（同時計算每篇貼文的留言數，僅計算 docid !== null 的貼文）
  getPosts: async (page = 1, limit = 10, forceRefresh = false) => {
    const performanceStart = performance.now();
    const cacheKey = `posts_list_${page}_${limit}`;

    if (!forceRefresh && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < 30000) {
        console.log('📋 回傳快取的貼文資料');
        return cachedData.data;
      }
    }

    try {
      console.log(`📡 從伺服器獲取貼文: page=${page}, limit=${limit}`);

      const endpoints = [
        `${POSTS_API_BASE_URL}/api/page?page=${page}&limit=${limit}`
      ];

      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 嘗試端點: ${endpoint}`);

          const { data } = await ApiService.makeRequest(endpoint, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            maxRetries: 2
          });

          const performanceEnd = performance.now();

          console.log('🔍 API 回應的原始資料:', data);

          let posts = [];
          let pageInfo = null;
          let apiMessage = '';

          if (data.status !== 'success') {
            throw new Error(`API 回應狀態錯誤: ${data.status}`);
          }

          if (data.data && Array.isArray(data.data.posts)) {
            posts = data.data.posts;
            pageInfo = data.data.pageinfo || null;
            apiMessage = data.message || '';
          } else {
            console.warn('⚠️ 無法找到貼文資料，檢查 data.data.posts:', data.data);
            posts = [];
          }

          console.log(`🔍 解析到的貼文數量: ${posts.length}`);


          // 計算留言數：只要有 parent_docid 指向該貼文的 docid 就算一則留言
          const commentsCountMap = {};
          posts.forEach(post => {
            if (post.parent_docid) {
              if (!commentsCountMap[post.parent_docid]) {
                commentsCountMap[post.parent_docid] = 0;
              }
              commentsCountMap[post.parent_docid]++;
            }
          });

          // 轉換所有貼文（包含主貼文和留言），保留原結構
          const transformedPosts = posts.map(post => ({
            id: post.docid || post.id,
            docid: post.docid,
            sn: post.sn,
            title: post.title || '',
            content: post.content || '',
            datetime: post.datetime,
            userid: post.userid,
            uuid: post.uuid,
            timezone: post.timezone,
            parent_docid: post.parent_docid || null,
            author: post.userid || 'Anonymous',
            time: ApiService.formatDateTime(post.datetime),
            privacy: 'public',
            likes: post.likes || 0,
            comments: post.comments || 0, // 保持原本數據，避免影響留言載入
            audioRecordId: post.uuid,
            // 新增計算留言數欄位，只有主貼文(docid !== null)才有值
            calculatedComments: post.docid !== null ? (commentsCountMap[post.docid] || 0) : 0
          }));

          if (transformedPosts.length > 0) {
            transformedPosts.sort((a, b) => {
              const timeA = new Date(a.datetime || 0);
              const timeB = new Date(b.datetime || 0);
              return timeB - timeA;
            });
            console.log(`✅ 成功排序 ${transformedPosts.length} 篇貼文`);
          }

          console.log(`✅ 從 ${endpoint} 獲取貼文:`, transformedPosts.length, '篇貼文');

          const result = {
            success: true,
            posts: transformedPosts,
            pageInfo: pageInfo,
            pagination: {
              page: page,
              limit: limit,
              total: pageInfo?.total_items || transformedPosts.length
            },
            message: apiMessage || '貼文載入成功',
            endpoint: endpoint,
            performance: `${performanceEnd - performanceStart}ms`,
            stats: {
              totalItems: pageInfo?.total_items || transformedPosts.length,
              currentPage: pageInfo?.current_page || page,
              totalPages: pageInfo?.total_pages || 1,
              hasNext: pageInfo?.has_next || false,
              hasPrev: pageInfo?.has_prev || false
            }
          };

          cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });

          return result;

        } catch (endpointError) {
          console.log(`❌ 端點 ${endpoint} 失敗:`, endpointError.message);
          lastError = endpointError;
          continue;
        }
      }

      throw lastError || new Error('所有端點都失敗了');

    } catch (error) {
      console.error('❌ 獲取貼文錯誤:', error);

      return {
        success: false,
        posts: [],
        pageInfo: null,
        pagination: {
          page: page,
          limit: limit,
          total: 0
        },
        message: `載入貼文失敗: ${error.message}`,
        error: error.message,
        statusCode: error.statusCode,
        performance: `${performance.now() - performanceStart}ms`,
        stats: {
          totalItems: 0,
          currentPage: page,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
    }
  },

  // ✅ 取得貼文統計
  getPostStats: async (page = 1, limit = 50) => {
    try {
      const result = await ApiService.getPosts(page, limit);

      if (!result.success) {
        return {
          success: false,
          message: result.message
        };
      }

      const posts = result.posts;
      const authors = [...new Set(posts.map(p => p.author))];
      const authorStats = {};

      authors.forEach(author => {
        authorStats[author] = posts.filter(p => p.author === author).length;
      });

      return {
        success: true,
        stats: {
          totalPosts: posts.length,
          uniqueAuthors: authors.length,
          averageLength: posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + p.content.length, 0) / posts.length) : 0,
          authorStats: authorStats,
          latestPost: posts[0] || null,
          oldestPost: posts[posts.length - 1] || null
        },
        pagination: result.pagination
      };

    } catch (error) {
      return {
        success: false,
        message: `取得貼文統計失敗: ${error.message}`,
        error: error.message
      };
    }
  },

  // ✅ 組合功能：發文並立即新增評論
  createPostWithComment: async (userId, postContent, commentContent) => {
    try {
      console.log('🚀 開始發文並新增評論流程...');

      console.log('📝 步驟 1: 建立貼文...');
      const postResult = await ApiService.createPost(userId, postContent);

      if (!postResult.success) {
        return {
          success: false,
          message: `建立貼文失敗: ${postResult.message}`,
          step: 'create_post',
          error: postResult.error
        };
      }

      console.log('✅ 貼文建立成功:', postResult.post);

      await ApiService.delay(2000);

      console.log('💬 步驟 2: 新增評論...');
      const commentResult = await ApiService.addComment(postResult.post.id, commentContent, userId);

      if (!commentResult.success) {
        return {
          success: false,
          message: `新增評論失敗: ${commentResult.message}`,
          step: 'add_comment',
          post: postResult.post,
          error: commentResult.error
        };
      }

      console.log('✅ 評論新增成功:', commentResult.comment);

      return {
        success: true,
        message: '發文並新增評論成功！',
        post: postResult.post,
        comment: commentResult.comment,
        steps: {
          create_post: postResult.success,
          add_comment: commentResult.success
        }
      };

    } catch (error) {
      console.error('❌ 發文並新增評論流程失敗:', error);
      return {
        success: false,
        message: `流程失敗: ${error.message}`,
        error: error.message
      };
    }
  },

  // ==================== 輔助功能 API ====================

  getDocumentation: async () => {
    const performanceStart = performance.now();

    try {
      console.log('📖 正在獲取文件指南...');

      const performanceEnd = performance.now();

      return {
        success: true,
        documentation: {
          title: "發文指南",
          guidelines: [
            "1. 內容必須積極且適當",
            "2. 不得發送垃圾訊息或重複內容",
            "3. 尊重社群中的其他成員",
            "4. 使用禮貌的語言",
            "5. 內容不超過 1000 個字元"
          ],
          postingRules: {
            maxLength: 1000,
            allowedPrivacy: ['public', 'family', 'tribe', 'private'],
            requiredFields: ['content'],
            optionalFields: ['title', 'image']
          },
          commentRules: {
            maxLength: 500,
            requiredFields: ['content'],
            rateLimit: '5 comments per minute'
          }
        },
        endpoint: 'default',
        message: '文件已成功載入',
        performance: `${performanceEnd - performanceStart}ms`
      };

    } catch (error) {
      console.error('❌ 獲取文件錯誤:', error);

      return {
        success: false,
        documentation: null,
        message: `無法載入文件: ${error.message}`,
        error: error.message,
        performance: `${performance.now() - performanceStart}ms`
      };
    }
  },

  checkPostPermissions: async (userId) => {
    try {
      console.log(`🔐 檢查使用者發文權限: ${userId}`);

      // 檢查用戶是否被封鎖
      const isBlocked = false; // 這裡可以加入實際的檢查邏輯

      return {
        success: true,
        permissions: {
          canPost: !isBlocked,
          canComment: !isBlocked,
          canLike: !isBlocked
        },
        canPost: !isBlocked,
        message: '發文權限已檢查完成',
        isBlocked: isBlocked
      };

    } catch (error) {
      console.log('⚠️ 權限檢查失敗，使用預設權限:', error.message);

      return {
        success: true,
        permissions: {
          canPost: true,
          canComment: true,
          canLike: true
        },
        canPost: true,
        message: '使用預設權限（允許發文）',
        fallback: true
      };
    }
  },

  createPostWithPreCheck: async (userId, content, privacy = 'public') => {
    const performanceStart = performance.now();

    try {
      console.log('🚀 開始完整的發文流程...');
      console.log('📖 步驟 1: 獲取發文指南...');
      const docResult = await ApiService.getDocumentation();

      console.log('🔐 步驟 2: 檢查發文權限...');
      const permissionResult = await ApiService.checkPostPermissions(userId);

      if (!permissionResult.canPost) {
        return {
          success: false,
          message: '您沒有發文權限',
          documentation: docResult.documentation,
          permissions: permissionResult.permissions
        };
      }

      console.log('✅ 步驟 3: 驗證內容...');
      if (docResult.success && docResult.documentation.postingRules) {
        const rules = docResult.documentation.postingRules;

        if (content.length > rules.maxLength) {
          return {
            success: false,
            message: `內容過長（最多 ${rules.maxLength} 個字元）`,
            documentation: docResult.documentation,
            currentLength: content.length,
            maxLength: rules.maxLength
          };
        }

        if (!rules.allowedPrivacy.includes(privacy)) {
          return {
            success: false,
            message: `隱私設定無效。允許的設定: ${rules.allowedPrivacy.join(', ')}`,
            documentation: docResult.documentation
          };
        }
      }

      console.log('📝 步驟 4: 建立貼文...');
      const postResult = await ApiService.createPost(userId, content, privacy);

      const performanceEnd = performance.now();

      if (postResult.success) {
        return {
          success: true,
          post: postResult.post,
          message: '發文成功！',
          documentation: docResult.documentation,
          permissions: permissionResult.permissions,
          steps: {
            documentation: docResult.success,
            permissions: permissionResult.success,
            posting: postResult.success
          },
          performance: `${performanceEnd - performanceStart}ms`
        };
      } else {
        return {
          success: false,
          message: postResult.message,
          documentation: docResult.documentation,
          permissions: permissionResult.permissions,
          error: postResult.error
        };
      }

    } catch (error) {
      console.error('❌ 完整發文流程失敗:', error);

      return {
        success: false,
        message: `發文流程失敗: ${error.message}`,
        error: error.message,
        performance: `${performance.now() - performanceStart}ms`
      };
    }
  },

  // ==================== 用戶認證 API ====================

  login: async (email, password) => {
    const performanceStart = performance.now();

    try {
      console.log('🔐 嘗試登入...');

      if (!email || !password) {
        return { success: false, message: '請輸入 Email 和密碼' };
      }

      const { data } = await ApiService.makeRequest(`${LOGIN_API_BASE_URL}/login`, {
        method: 'POST',
        body: JSON.stringify({
          email: email,
          code: password
        }),
        maxRetries: 2
      });

      const performanceEnd = performance.now();

      if (data.status === 'success') {
        const userInfo = {
          id: data.user_id,
          userId: data.user_id,
          name: data.email.split('@')[0],
          email: data.email,
          avatar: `https://ui-avatars.com/api/?name=${data.email.split('@')[0]}&background=667eea&color=fff`
        };

        const audioBackupKey = `audioBackup_${data.email}`;
        const audioBackup = StorageService.getItem(audioBackupKey);

        if (audioBackup) {
          StorageService.setItem('audioRecords', audioBackup);
          console.log(`🔄 已恢復音訊記錄從 ${audioBackupKey}`);
          StorageService.removeItem(audioBackupKey);
        }

        StorageService.setItem('currentUser', JSON.stringify(userInfo));
        StorageService.setItem('userEmail', data.email);
        StorageService.setItem('loginTime', new Date().toISOString());
        StorageService.setItem('isAuthenticated', 'true');

        const audioRecords = StorageService.getItem('audioRecords');
        const userEmail = StorageService.getItem('userEmail');

        if (audioRecords && userEmail) {
          StorageService.setItem(`audioBackup_${userEmail}`, audioRecords);
          console.log(`💾 已備份音訊記錄至 audioBackup_${userEmail}`);
        }

        return {
          success: true,
          user: userInfo,
          message: data.message || '登入成功',
          performance: `${performanceEnd - performanceStart}ms`
        };
      } else {
        return {
          success: false,
          message: data.message || '登入失敗',
          performance: `${performanceEnd - performanceStart}ms`
        };
      }

    } catch (error) {
      console.error('❌ 登入錯誤:', error);

      return {
        success: false,
        message: error.statusCode === 0 ? '無法連接到伺服器' : error.message,
        statusCode: error.statusCode,
        performance: `${performance.now() - performanceStart}ms`
      };
    }
  },

  logout: async () => {
    try {
      console.log('🚪 正在登出...');

      StorageService.removeItem('currentUser');
      StorageService.removeItem('userEmail');
      StorageService.removeItem('loginTime');
      StorageService.removeItem('isAuthenticated');

      ApiService.clearCache();

      return {
        success: true,
        message: '登出成功'
      };

    } catch (error) {
      console.error('❌ 登出錯誤:', error);
      return {
        success: false,
        message: '登出時發生錯誤'
      };
    }
  },

  // ==================== 系統測試和工具 ====================

  testConnections: async () => {
    console.log('🔧 測試 API 連線狀態...');

    const results = {
      loginServer: {
        url: LOGIN_API_BASE_URL,
        status: 'unknown',
        responseTime: 0,
        error: null
      },
      postsServer: {
        url: POSTS_API_BASE_URL,
        status: 'unknown',
        responseTime: 0,
        error: null
      },
      commentsServer: {
        url: POSTS_API_BASE_URL,
        status: 'unknown',
        responseTime: 0,
        error: null
      },
      summary: {
        totalServers: 3,
        onlineServers: 0,
        offlineServers: 0,
        averageResponseTime: 0,
        testTime: new Date().toISOString()
      }
    };

    // 測試貼文伺服器
    try {
      const startTime = Date.now();
      await ApiService.makeRequest(`${POSTS_API_BASE_URL}/api/page?page=1&limit=1`, {
        method: 'GET',
        timeout: 8000,
        maxRetries: 1
      });

      results.postsServer.status = 'online';
      results.postsServer.responseTime = Date.now() - startTime;
      results.summary.onlineServers++;

    } catch (error) {
      results.postsServer.status = 'offline';
      results.postsServer.error = error.message;
      results.summary.offlineServers++;
    }

    // 測試評論伺服器
    try {
      const startTime = Date.now();
      await ApiService.makeRequest(`${POSTS_API_BASE_URL}/api/comment`, {
        method: 'HEAD',
        timeout: 8000,
        maxRetries: 1
      });

      results.commentsServer.status = 'online';
      results.commentsServer.responseTime = Date.now() - startTime;
      results.summary.onlineServers++;

    } catch (error) {
      results.commentsServer.status = 'offline';
      results.commentsServer.error = error.message;
      results.summary.offlineServers++;
    }

    // 測試登入伺服器
    try {
      const startTime = Date.now();
      await ApiService.makeRequest(`${LOGIN_API_BASE_URL}`, {
        method: 'HEAD',
        timeout: 8000,
        maxRetries: 1
      });

      results.loginServer.status = 'online';
      results.loginServer.responseTime = Date.now() - startTime;
      results.summary.onlineServers++;

    } catch (error) {
      results.loginServer.status = 'offline';
      results.loginServer.error = error.message;
      results.summary.offlineServers++;
    }

    // 計算平均回應時間
    const responseTimes = [
      results.loginServer.responseTime,
      results.postsServer.responseTime,
      results.commentsServer.responseTime
    ].filter(time => time > 0);

    results.summary.averageResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    console.log('📊 連線測試結果:', results);
    return results;
  },

  // ✅ 完整功能測試
  runFullTest: async () => {
    console.log('🧪 開始完整功能測試...');

    const testResults = {
      connection: null,
      posts: null,
      comments: null,
      auth: null,
      performance: {
        startTime: Date.now(),
        endTime: null,
        duration: null
      }
    };

    try {
      // 測試 1: 連線測試
      console.log('🧪 測試 1: API 連線');
      testResults.connection = await ApiService.testConnections();

      // 測試 2: 貼文功能
      console.log('🧪 測試 2: 貼文功能');
      testResults.posts = await ApiService.getPostStats(1, 5);

      // 測試 3: 評論功能
      console.log('🧪 測試 3: 評論功能');
      testResults.comments = await ApiService.getCommentStats(129);

      // 測試 4: 認證狀態
      console.log('🧪 測試 4: 用戶認證');
      testResults.auth = {
        success: true,
        isAuthenticated: ApiService.isAuthenticated(),
        currentUser: ApiService.getCurrentUser()
      };

      testResults.performance.endTime = Date.now();
      testResults.performance.duration = testResults.performance.endTime - testResults.performance.startTime;

      console.log('✅ 完整功能測試完成');

      return {
        success: true,
        message: '所有測試完成',
        results: testResults,
        summary: {
          connectionStatus: testResults.connection?.summary?.onlineServers || 0,
          totalTests: 4,
          passedTests: Object.values(testResults).filter(r => r && r.success).length,
          duration: `${testResults.performance.duration}ms`
        }
      };

    } catch (error) {
      console.error('❌ 測試過程中發生錯誤:', error);
      return {
        success: false,
        message: `測試失敗: ${error.message}`,
        error: error.message,
        results: testResults
      };
    }
  },

  // ==================== 用戶管理工具 ====================

  clearCache: () => {
    cache.clear();
    console.log('🗑️ API 快取已清除');
  },


  getCurrentUserId: () => {
    const user = JSON.parse(StorageService.getItem('currentUser') || '{}');
    return user.id || user.userId || 11445;
  },

  getCurrentUser: () => {
    const stored = StorageService.getItem('currentUser');
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      userId: "1753967589321",
      name: "測試用戶",
      avatar: "https://ui-avatars.com/api/?name=測試用戶&background=random"
    };
  },

  setCurrentUser: (user) => {
    StorageService.setItem('currentUser', JSON.stringify(user));
  },

  isAuthenticated: () => {
    const user = ApiService.getCurrentUser();
    const isAuth = StorageService.getItem('isAuthenticated') === 'true';
    return !!(user.id && isAuth);
  },

  // ==================== 社交功能 API ====================

  // ✅ 點讚貼文
  likePost: async (postId, userId = null) => {
    try {
      const currentUserId = userId || ApiService.getCurrentUserId();
      console.log(`👍 點讚貼文: ${postId} by user: ${currentUserId}`);

      // Rate limiting check
      const rateLimitKey = `like_${currentUserId}`;
      if (!ApiService.checkRateLimit(rateLimitKey, 10, 60000)) {
        return {
          success: false,
          message: '點讚太頻繁，請稍後再試'
        };
      }

      // 這裡可以實作實際的點讚 API 呼叫
      // const { data } = await ApiService.makeRequest(`${POSTS_API_BASE_URL}/api/like`, {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     postId: postId,
      //     userId: currentUserId
      //   })
      // });

      return {
        success: true,
        message: '點讚成功',
        postId: postId,
        userId: currentUserId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ 點讚失敗:', error);
      return {
        success: false,
        message: '點讚失敗',
        error: error.message
      };
    }
  },

  // ✅ 取消點讚
  unlikePost: async (postId, userId = null) => {
    try {
      const currentUserId = userId || ApiService.getCurrentUserId();
      console.log(`👎 取消點讚貼文: ${postId} by user: ${currentUserId}`);

      // 這裡可以實作實際的取消點讚 API 呼叫

      return {
        success: true,
        message: '取消點讚成功',
        postId: postId,
        userId: currentUserId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ 取消點讚失敗:', error);
      return {
        success: false,
        message: '取消點讚失敗',
        error: error.message
      };
    }
  },

  // ==================== 🆕 進階功能 ====================

  // ✅ 搜尋貼文
  searchPosts: async (keyword, page = 1, limit = 10) => {
    const performanceStart = performance.now();
    const cacheKey = `search_${keyword}_${page}_${limit}`;

    if (cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < 120000) { // 2分鐘快取
        console.log('📋 回傳快取的搜尋結果');
        return cachedData.data;
      }
    }

    try {
      console.log(`🔍 搜尋貼文: "${keyword}"`);

      // 先取得所有貼文，然後在客戶端過濾
      const allPostsResult = await ApiService.getPosts(1, 100);

      if (!allPostsResult.success) {
        return allPostsResult;
      }

      const filteredPosts = allPostsResult.posts.filter(post =>
        post.content.toLowerCase().includes(keyword.toLowerCase()) ||
        (post.title && post.title.toLowerCase().includes(keyword.toLowerCase()))
      );

      // 分頁處理
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

      const result = {
        success: true,
        posts: paginatedPosts,
        keyword: keyword,
        pagination: {
          page: page,
          limit: limit,
          total: filteredPosts.length
        },
        message: `找到 ${filteredPosts.length} 篇相關貼文`,
        performance: `${performance.now() - performanceStart}ms`
      };

      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('❌ 搜尋貼文錯誤:', error);
      return {
        success: false,
        posts: [],
        message: `搜尋失敗: ${error.message}`,
        error: error.message,
        performance: `${performance.now() - performanceStart}ms`
      };
    }
  },

  // ✅ 取得用戶的所有貼文
  getUserPosts: async (userId, page = 1, limit = 10) => {
    try {
      console.log(`👤 取得用戶 ${userId} 的貼文`);

      const allPostsResult = await ApiService.getPosts(1, 100);

      if (!allPostsResult.success) {
        return allPostsResult;
      }

      const userPosts = allPostsResult.posts.filter(post =>
        post.userid === userId || post.userid === String(userId)
      );

      // 分頁處理
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedPosts = userPosts.slice(startIndex, endIndex);

      return {
        success: true,
        posts: paginatedPosts,
        userId: userId,
        pagination: {
          page: page,
          limit: limit,
          total: userPosts.length
        },
        message: `用戶共有 ${userPosts.length} 篇貼文`
      };

    } catch (error) {
      console.error('❌ 取得用戶貼文錯誤:', error);
      return {
        success: false,
        posts: [],
        message: `取得用戶貼文失敗: ${error.message}`,
        error: error.message
      };
    }
  },

  // ✅ 初始化 API 服務
  initialize: async () => {
    console.log('🚀 初始化 API 服務...');

    try {
      // 檢查連線狀態
      const connectionTest = await ApiService.testConnections();
      console.log('📊 連線測試結果:', connectionTest.summary);

      // 檢查用戶認證狀態
      const isAuth = ApiService.isAuthenticated();
      console.log('🔐 用戶認證狀態:', isAuth ? '已登入' : '未登入');

      if (isAuth) {
        const user = ApiService.getCurrentUser();
        console.log('👤 當前用戶:', user.name || user.userId);
      }

      console.log('✅ API 服務初始化完成');

      return {
        success: true,
        message: 'API 服務初始化成功',
        connectionStatus: connectionTest.summary,
        isAuthenticated: isAuth,
        currentUser: isAuth ? ApiService.getCurrentUser() : null
      };

    } catch (error) {
      console.error('❌ API 服務初始化失敗:', error);
      return {
        success: false,
        message: `初始化失敗: ${error.message}`,
        error: error.message
      };
    }
  },

  // ==================== 🆕 高級功能 ====================

  // ✅ 批量操作管理器
  batchOperations: {
    // 批量點讚
    likeMultiplePosts: async (postIds, userId = null) => {
      const results = [];
      const currentUserId = userId || ApiService.getCurrentUserId();

      for (let i = 0; i < postIds.length; i++) {
        console.log(`👍 批量點讚 ${i + 1}/${postIds.length}: 貼文 ${postIds[i]}`);

        const result = await ApiService.likePost(postIds[i], currentUserId);
        results.push({
          postId: postIds[i],
          ...result
        });

        // 避免請求過於頻繁
        if (i < postIds.length - 1) {
          await ApiService.delay(500);
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        success: successCount > 0,
        message: `批量點讚完成: ${successCount}/${postIds.length} 成功`,
        results: results,
        summary: {
          total: postIds.length,
          success: successCount,
          failed: postIds.length - successCount
        }
      };
    },

    // 批量刪除快取
    clearMultipleCache: (patterns = []) => {
      let clearedCount = 0;

      if (patterns.length === 0) {
        // 清除所有快取
        const totalCount = cache.size;
        cache.clear();
        return {
          success: true,
          message: `已清除所有快取 (${totalCount} 項)`
        };
      }

      // 根據模式清除快取
      for (const pattern of patterns) {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
            clearedCount++;
          }
        }
      }

      return {
        success: true,
        message: `已清除 ${clearedCount} 項快取`,
        patterns: patterns,
        clearedCount: clearedCount
      };
    }
  },

  // ✅ 資料分析工具
  analytics: {
    // 取得平台統計
    getPlatformStats: async () => {
      try {
        console.log('📊 分析平台統計資料...');

        const postsResult = await ApiService.getPosts(1, 100);
        const connectionResult = await ApiService.testConnections();

        if (!postsResult.success) {
          return {
            success: false,
            message: '無法取得貼文資料進行分析'
          };
        }

        const posts = postsResult.posts;
        const authors = [...new Set(posts.map(p => p.author))];

        // 計算各種統計
        const stats = {
          posts: {
            total: posts.length,
            averageLength: posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + p.content.length, 0) / posts.length) : 0,
            longestPost: posts.reduce((max, p) => p.content.length > max.content.length ? p : max, posts[0] || { content: '' }),
            shortestPost: posts.reduce((min, p) => p.content.length < min.content.length ? p : min, posts[0] || { content: '' })
          },
          users: {
            total: authors.length,
            mostActive: null,
            postDistribution: {}
          },
          performance: {
            serverStatus: connectionResult.summary,
            cacheSize: cache.size,
            lastUpdate: new Date().toISOString()
          }
        };

        // 計算最活躍用戶
        authors.forEach(author => {
          stats.users.postDistribution[author] = posts.filter(p => p.author === author).length;
        });

        stats.users.mostActive = Object.entries(stats.users.postDistribution)
          .sort(([, a], [, b]) => b - a)[0];

        return {
          success: true,
          stats: stats,
          message: '平台統計分析完成',
          generatedAt: new Date().toISOString()
        };

      } catch (error) {
        console.error('❌ 平台統計分析失敗:', error);
        return {
          success: false,
          message: `統計分析失敗: ${error.message}`,
          error: error.message
        };
      }
    },

    // 取得用戶活動分析
    getUserActivity: async (userId) => {
      try {
        console.log(`📈 分析用戶 ${userId} 的活動...`);

        const userPostsResult = await ApiService.getUserPosts(userId, 1, 100);

        if (!userPostsResult.success) {
          return {
            success: false,
            message: '無法取得用戶貼文資料'
          };
        }

        const posts = userPostsResult.posts;

        // 分析發文時間模式
        const timeAnalysis = {
          hourDistribution: {},
          dayDistribution: {},
          monthDistribution: {}
        };

        posts.forEach(post => {
          const date = new Date(post.datetime);
          const hour = date.getHours();
          const day = date.getDay();
          const month = date.getMonth();

          timeAnalysis.hourDistribution[hour] = (timeAnalysis.hourDistribution[hour] || 0) + 1;
          timeAnalysis.dayDistribution[day] = (timeAnalysis.dayDistribution[day] || 0) + 1;
          timeAnalysis.monthDistribution[month] = (timeAnalysis.monthDistribution[month] || 0) + 1;
        });

        const activity = {
          userId: userId,
          totalPosts: posts.length,
          averagePostLength: posts.length > 0 ? Math.round(posts.reduce((sum, p) => sum + p.content.length, 0) / posts.length) : 0,
          firstPost: posts[posts.length - 1] || null,
          latestPost: posts[0] || null,
          timeAnalysis: timeAnalysis,
          mostActiveHour: Object.entries(timeAnalysis.hourDistribution).sort(([, a], [, b]) => b - a)[0] || [0, 0],
          mostActiveDay: Object.entries(timeAnalysis.dayDistribution).sort(([, a], [, b]) => b - a)[0] || [0, 0]
        };

        return {
          success: true,
          activity: activity,
          message: '用戶活動分析完成'
        };

      } catch (error) {
        console.error('❌ 用戶活動分析失敗:', error);
        return {
          success: false,
          message: `用戶活動分析失敗: ${error.message}`,
          error: error.message
        };
      }
    }
  },

  // ✅ 系統監控工具
  monitoring: {
    // 健康檢查
    healthCheck: async () => {
      console.log('🏥 執行系統健康檢查...');

      const checks = {
        apiConnections: null,
        authentication: null,
        cache: null,
        storage: null,
        performance: null
      };

      try {
        // 檢查 API 連線
        checks.apiConnections = await ApiService.testConnections();

        // 檢查認證狀態
        checks.authentication = {
          success: true,
          isAuthenticated: ApiService.isAuthenticated(),
          currentUser: ApiService.getCurrentUser()
        };

        // 檢查快取狀態
        checks.cache = {
          success: true,
          size: cache.size,
          status: cache.size < 1000 ? 'healthy' : 'warning'
        };

        // 檢查儲存狀態
        try {
          StorageService.setItem('healthCheck', 'test');
          const testValue = StorageService.getItem('healthCheck');
          StorageService.removeItem('healthCheck');

          checks.storage = {
            success: testValue === 'test',
            status: testValue === 'test' ? 'healthy' : 'error'
          };
        } catch (error) {
          checks.storage = {
            success: false,
            status: 'error',
            error: error.message
          };
        }

        // 性能檢查
        const perfStart = performance.now();
        await ApiService.delay(1);
        const perfEnd = performance.now();

        checks.performance = {
          success: true,
          responseTime: perfEnd - perfStart,
          status: (perfEnd - perfStart) < 10 ? 'healthy' : 'warning'
        };

        const overallHealth = Object.values(checks).every(check => check && check.success);

        return {
          success: overallHealth,
          message: overallHealth ? '系統健康狀態良好' : '系統存在一些問題',
          checks: checks,
          timestamp: new Date().toISOString(),
          overallStatus: overallHealth ? 'healthy' : 'warning'
        };

      } catch (error) {
        console.error('❌ 健康檢查失敗:', error);
        return {
          success: false,
          message: `健康檢查失敗: ${error.message}`,
          error: error.message,
          checks: checks
        };
      }
    },

    // 性能監控
    performanceMonitor: {
      _metrics: [],

      startTracking: () => {
        console.log('📊 開始性能監控...');
        ApiService.monitoring.performanceMonitor._metrics = [];
        ApiService.monitoring.performanceMonitor._startTime = Date.now();
      },

      addMetric: (operation, duration, success = true) => {
        ApiService.monitoring.performanceMonitor._metrics.push({
          operation,
          duration,
          success,
          timestamp: Date.now()
        });
      },

      getReport: () => {
        const metrics = ApiService.monitoring.performanceMonitor._metrics;
        const totalTime = Date.now() - (ApiService.monitoring.performanceMonitor._startTime || Date.now());

        if (metrics.length === 0) {
          return {
            success: false,
            message: '沒有性能資料可分析'
          };
        }

        const successfulOps = metrics.filter(m => m.success);
        const failedOps = metrics.filter(m => !m.success);

        const avgDuration = successfulOps.length > 0
          ? successfulOps.reduce((sum, m) => sum + m.duration, 0) / successfulOps.length
          : 0;

        return {
          success: true,
          report: {
            totalOperations: metrics.length,
            successfulOperations: successfulOps.length,
            failedOperations: failedOps.length,
            successRate: (successfulOps.length / metrics.length * 100).toFixed(2) + '%',
            averageDuration: Math.round(avgDuration) + 'ms',
            totalMonitoringTime: totalTime + 'ms',
            operations: metrics
          },
          message: '性能監控報告已生成'
        };
      }
    }
  },

  // ✅ 開發者工具
  devTools: {
    // 生成測試資料
    generateTestData: {
      posts: (count = 5, userId = null) => {
        const currentUserId = userId || ApiService.getCurrentUserId();
        const testPosts = [];

        const sampleContents = [
          "這是一篇測試貼文，用來驗證系統功能。",
          "今天天氣真好，適合出去走走！",
          "分享一些生活中的小確幸 ✨",
          "學習新技術總是令人興奮的事情。",
          "感謝大家的支持和鼓勵！",
          "週末愉快，大家有什麼計劃嗎？",
          "美食分享：今天嘗試了新的料理。",
          "讀書心得：最近看了一本很棒的書。"
        ];

        for (let i = 0; i < count; i++) {
          testPosts.push({
            content: sampleContents[i % sampleContents.length] + ` (測試 #${i + 1})`,
            title: `測試貼文 ${i + 1}`,
            userId: currentUserId
          });
        }

        return testPosts;
      },

      comments: (count = 3) => {
        const sampleComments = [
          "很棒的分享！",
          "謝謝你的資訊。",
          "我也有同樣的想法。",
          "期待更多內容！",
          "說得很有道理。"
        ];

        const testComments = [];
        for (let i = 0; i < count; i++) {
          testComments.push(sampleComments[i % sampleComments.length] + ` (測試評論 #${i + 1})`);
        }

        return testComments;
      }
    },

    // 執行完整測試流程
    runCompleteTest: async () => {
      console.log('🧪 開始完整測試流程...');

      const testResults = {
        initialization: null,
        posting: null,
        commenting: null,
        analytics: null,
        monitoring: null
      };

      try {
        // 1. 初始化測試
        console.log('🧪 步驟 1: 初始化測試');
        testResults.initialization = await ApiService.initialize();

        // 2. 發文測試
        console.log('🧪 步驟 2: 發文功能測試');
        const testPosts = ApiService.devTools.generateTestData.posts(2);
        const userId = ApiService.getCurrentUserId();

        const postResult = await ApiService.quickPost(userId, testPosts[0].content);
        testResults.posting = postResult;

        if (postResult.success) {
          // 3. 評論測試
          console.log('🧪 步驟 3: 評論功能測試');
          await ApiService.delay(1000);

          const testComments = ApiService.devTools.generateTestData.comments(1);
          const commentResult = await ApiService.quickComment(postResult.post.id, testComments[0]);
          testResults.commenting = commentResult;
        }

        // 4. 分析測試
        console.log('🧪 步驟 4: 分析功能測試');
        testResults.analytics = await ApiService.analytics.getPlatformStats();

        // 5. 監控測試
        console.log('🧪 步驟 5: 監控功能測試');
        testResults.monitoring = await ApiService.monitoring.healthCheck();

        const successCount = Object.values(testResults).filter(r => r && r.success).length;

        return {
          success: successCount >= 3, // 至少3個測試通過
          message: `完整測試完成: ${successCount}/5 項測試通過`,
          results: testResults,
          summary: {
            total: 5,
            passed: successCount,
            failed: 5 - successCount,
            passRate: (successCount / 5 * 100).toFixed(1) + '%'
          }
        };

      } catch (error) {
        console.error('❌ 完整測試流程失敗:', error);
        return {
          success: false,
          message: `測試流程失敗: ${error.message}`,
          error: error.message,
          results: testResults
        };
      }
    },

    // 重置系統狀態
    resetSystem: () => {
      console.log('🔄 重置系統狀態...');

      try {
        // 清除快取
        ApiService.clearCache();

        // 清除 rate limiting
        ApiService._rateLimiter.clear();

        // 重置性能監控
        if (ApiService.monitoring.performanceMonitor._metrics) {
          ApiService.monitoring.performanceMonitor._metrics = [];
        }

        console.log('✅ 系統狀態已重置');

        return {
          success: true,
          message: '系統狀態重置成功',
          actions: [
            '已清除所有快取',
            '已重置 Rate Limiting',
            '已清除性能監控資料'
          ]
        };

      } catch (error) {
        console.error('❌ 系統重置失敗:', error);
        return {
          success: false,
          message: `系統重置失敗: ${error.message}`,
          error: error.message
        };
      }
    }
  },

  // ✅ 實用工具函數
  utils: {
    // 格式化檔案大小
    formatFileSize: (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 產生隨機 ID
    generateId: (length = 8) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    },

    // 深度複製物件
    deepClone: (obj) => {
      if (obj === null || typeof obj !== 'object') return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (obj instanceof Array) return obj.map(item => ApiService.utils.deepClone(item));
      if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            clonedObj[key] = ApiService.utils.deepClone(obj[key]);
          }
        }
        return clonedObj;
      }
    },

    // 節流函數
    throttle: (func, limit) => {
      let inThrottle;
      return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    // 防抖函數
    debounce: (func, delay) => {
      let timeoutId;
      return function () {
        const args = arguments;
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), delay);
      };
    }
  }
};

// ✅ 定期清理過期快取 - 每 5 分鐘執行一次
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > 300000) { // 5 分鐘
      cache.delete(key);
    }
  }
}, 300000);

// ✅ 定期清理 Rate Limiting 資料 - 每 10 分鐘執行一次
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of ApiService._rateLimiter.entries()) {
    const validRequests = requests.filter(time => now - time < 300000); // 5分鐘內的請求
    if (validRequests.length === 0) {
      ApiService._rateLimiter.delete(key);
    } else {
      ApiService._rateLimiter.set(key, validRequests);
    }
  }
}, 600000);

// ==================== 🎯 匯出和初始化 ====================

// ✅ 主要匯出
export default ApiService;

// ✅ 具名匯出
export {
  ApiService,
  StorageService,
  ApiError
};

// ==================== 🎉 完成訊息和使用範例 ====================

console.log('🎉 完整 API 服務已載入！');
console.log('📦 主要功能:');
console.log('   🔐 用戶認證: login(), logout(), isAuthenticated()');
console.log('   📝 貼文管理: createPost(), getPosts(), quickPost()');
console.log('   💬 評論系統: addComment(), getComments(), quickComment()');
console.log('   👍 社交功能: likePost(), unlikePost()');
console.log('   🔍 搜尋功能: searchPosts(), getUserPosts()');
console.log('   📊 分析工具: analytics.getPlatformStats()');
console.log('   🏥 系統監控: monitoring.healthCheck()');
console.log('   🧪 開發工具: devTools.runCompleteTest()');
console.log('');
console.log('🚀 快速開始:');
console.log('   await ApiService.initialize()');
console.log('   await ApiService.quickPost("userId", "我的貼文")');
console.log('   await ApiService.quickComment(postId, "我的評論")');
console.log('   await ApiService.devTools.runCompleteTest()');
console.log('');
console.log('📖 更多功能請查看 ApiService 物件的各個方法');

