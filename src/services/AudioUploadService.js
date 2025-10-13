// ==================== Khối Cài đặt Cơ bản ====================
// Cài đặt URL cơ sở cho API upload âm thanh
const AUDIO_UPLOAD_API_BASE_URL = 'https://xiaohua.54ucl.com:8011'; // URL cơ sở API upload âm thanh


// ==================== Lớp Lỗi Tùy chỉnh ====================
// Chịu trách nhiệm: Xử lý thống nhất các lỗi liên quan đến API, cung cấp thông tin lỗi chi tiết hơn
export class ApiError extends Error { // Kế thừa lớp Error native và mở rộng chức năng
  constructor(message, statusCode = 0, data = null, url = '') {
    super(message); // Gọi constructor của lớp cha
    this.name = 'ApiError'; // Đặt tên lỗi
    this.statusCode = statusCode; // Mã trạng thái HTTP
    this.data = data; // Dữ liệu lỗi bổ sung
    this.url = url; // URL xảy ra lỗi
    this.timestamp = new Date().toISOString(); // Timestamp thời điểm xảy ra lỗi
  }
}

// ==================== Hàm HTTP Request Đơn giản hóa ====================
// Chịu trách nhiệm: Hàm xử lý HTTP request được thiết kế riêng cho chức năng upload âm thanh
// Chức năng: Bao gồm kiểm soát timeout, xử lý lỗi, hỗ trợ FormData, v.v.
const makeRequestForUpload = async (url, options = {}) => {
  // Cài đặt tùy chọn request mặc định
  const defaultOptions = {
    timeout: 15000, // Thời gian timeout request: 15 giây
    headers: {
      'Accept': 'application/json', // Chấp nhận response JSON
      'X-Requested-With': 'XMLHttpRequest', // Đánh dấu là AJAX request
      'Cache-Control': 'no-cache', // Vô hiệu hóa cache
      'Pragma': 'no-cache', // Vô hiệu hóa cache (tương thích trình duyệt cũ)
      ...options.headers // Merge custom headers
    },
    ...options // Merge các tùy chọn tùy chỉnh khác
  };

  // Xử lý trường hợp đặc biệt của FormData
  // FormData sẽ tự động đặt Content-Type, đặt thủ công sẽ gây ra vấn đề
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type']; // Xóa Content-Type, để trình duyệt tự động đặt
  } else {
    // Khi không phải FormData thì đặt Content-Type mặc định
    defaultOptions.headers['Content-Type'] = options.headers?.['Content-Type'] || 'application/json';
  }

  // Tạo AbortController để kiểm soát timeout request
  const controller = new AbortController(); // Tạo controller để hủy request
  const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout); // Đặt hủy timeout

  try {
    // Thực hiện HTTP request
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal // Bind cancel signal
    });
    clearTimeout(timeoutId); // Request hoàn thành, xóa timeout timer

    // ==================== Xử lý Dữ liệu Response ====================
    let data;
    const contentType = response.headers.get('content-type'); // Lấy Content-Type từ response header
    
    // Quyết định cách parse dựa trên Content-Type của response
    if (contentType && contentType.includes('application/json')) {
      data = await response.json(); // Parse định dạng JSON
    } else {
      data = await response.text(); // Parse định dạng text
    }

    // Kiểm tra mã trạng thái HTTP, throw lỗi nếu không thành công
    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`, // Thông báo lỗi
        response.status, // Mã trạng thái HTTP
        data, // Dữ liệu response
        url // URL request
      );
    }
    
    return { response, data }; // Trả về kết quả thành công
  } catch (error) {
    clearTimeout(timeoutId); // Xóa timer khi xảy ra lỗi
    
    // ==================== Xử lý Phân loại Lỗi ====================
    // Lỗi timeout request
    if (error.name === 'AbortError') {
      throw new ApiError('請求超時', 408, null, url); // Throw lỗi timeout
    }
    // Lỗi kết nối mạng
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError('網路錯誤 - 無法連接到伺服器', 0, null, url); // Throw lỗi mạng
    }
    // Nếu đã là ApiError thì throw trực tiếp
    if (error instanceof ApiError) {
      throw error; // Re-throw ApiError
    }
    // Các lỗi không xác định khác
    throw new ApiError(`意外錯誤: ${error.message}`, 0, null, url); // Throw lỗi không xác định
  }
};

// ==================== Hàm Upload Âm thanh ====================
// Chịu trách nhiệm: Xử lý toàn bộ quy trình upload file âm thanh lên server
// Tham số: audioBlob - Object Blob âm thanh cần upload
// Trả về: Object chứa trạng thái thành công/thất bại và thông tin liên quan
export const uploadAudio = async (audioBlob) => {
  const performanceStart = performance.now(); // Bắt đầu đo thời gian, dùng để giám sát hiệu suất

  try {
    console.log('🔊 準備上傳音訊檔案...'); // Log bắt đầu upload
    

    // ==================== Xác thực Input ====================
    // Kiểm tra tham số input có phải là object Blob hợp lệ không
    if (!(audioBlob instanceof Blob)) {
      throw new ApiError('無效的音訊檔案類型，必須是 Blob。', 400); // Throw lỗi nếu không phải Blob
    }
    // Kiểm tra kích thước file có rỗng không
    if (audioBlob.size === 0) {
      throw new ApiError('音訊檔案大小為 0，請確保有錄製內容。', 400); // Throw lỗi nếu file rỗng
    }

    // ==================== Chuẩn bị Dữ liệu Upload ====================
    const formData = new FormData(); // Tạo object FormData để upload file
    const filename = `recording_${Date.now()}.webm`; // Tạo tên file duy nhất (sử dụng timestamp)

    // Thêm Blob âm thanh vào FormData, chỉ định tên trường và tên file
    formData.append('file', audioBlob, filename); // Append file vào FormData

    console.log(`📤 正在上傳檔案: ${filename}, 大小: ${audioBlob.size} bytes`); // Log thông tin file

    // ==================== Thực hiện Request Upload ====================
    const { data } = await makeRequestForUpload(`${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/upload`, {
      method: 'POST', // Sử dụng phương thức POST
      body: formData, // Gửi FormData
      maxRetries: 3 // Số lần retry tối đa (mặc dù makeRequestForUpload hiện tại chưa implement cơ chế retry)
    });

    const performanceEnd = performance.now(); // Kết thúc đo thời gian

    console.log('✅ 音訊檔案上傳成功:', data); // Log thành công

    // ==================== Trả về Thành công ====================
    return {
      success: true, // Đánh dấu thành công
      data: data, // Dữ liệu trả về từ server
      message: data.message || '音訊檔案上傳成功', // Thông báo thành công
      performance: `${performanceEnd - performanceStart}ms` // Thời gian thực hiện
    };

  } catch (error) {
    console.error('❌ 音訊檔案上傳失敗:', error); // Log lỗi

    // ==================== Trả về Lỗi ====================
    return {
      success: false, // Đánh dấu thất bại
      message: error.message || '音訊檔案上傳時發生錯誤', // Thông báo lỗi
      error: error.message, // Thông báo lỗi chi tiết
      statusCode: error.statusCode || 0, // Mã trạng thái HTTP
      performance: `${performance.now() - performanceStart}ms` // Thời gian thực hiện
    };
  }
};

// ==================== 啟動串流錄音會話 ====================
/**
 * 啟動新的串流錄音會話
 * @returns {Promise<Object>} 包含會話 ID 的物件
 */
export const startStreamingSession = async () => {
  const performanceStart = performance.now(); // 開始計時以監控性能

  try {
    console.log('🔄 準備啟動串流錄音會話...'); // Log bắt đầu khởi tạo session
    
    // 呼叫啟動串流 API
    const { data } = await makeRequestForUpload(`${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/start_streaming`, {
      method: 'POST', // Sử dụng phương thức POST
      headers: {
        'Content-Type': 'application/json' // Đặt Content-Type cho JSON
      },
      body: JSON.stringify({}) // 空物件，因為 API 不需要參數
    });
    
    const performanceEnd = performance.now(); // 結束計時
    
    if (!data.session_id) {
      throw new ApiError('伺服器未返回有效的會話 ID', 500); // Throw lỗi nếu không có session ID
    }
    
    console.log(`✅ 串流會話啟動成功，會話 ID: ${data.session_id}`); // Log thành công
    
    return {
      success: true, // Đánh dấu thành công
      sessionId: data.session_id, // Session ID từ server
      message: '串流會話啟動成功', // Thông báo thành công
      performance: `${performanceEnd - performanceStart}ms` // Thời gian thực hiện
    };
    
  } catch (error) {
    console.error('❌ 啟動串流會話失敗:', error); // Log lỗi
    
    return {
      success: false, // Đánh dấu thất bại
      message: error.message || '啟動串流會話時發生錯誤', // Thông báo lỗi
      error: error.message, // Chi tiết lỗi
      statusCode: error.statusCode || 0, // Mã trạng thái HTTP
      performance: `${performance.now() - performanceStart}ms` // Thời gian thực hiện
    };
  }
};

// ==================== 上傳串流音訊區塊 ====================
/**
 * 上傳音訊區塊到現有串流會話
 * @param {Blob} audioChunk - 音訊區塊 Blob
 * @param {string} sessionId - 串流會話 ID
 * @returns {Promise<Object>} 上傳結果
 */
export const uploadStreamChunk = async (audioChunk, sessionId) => {
  const performanceStart = performance.now(); // 開始計時以監控性能
  
  try {
    // 驗證輸入
    if (!(audioChunk instanceof Blob)) {
      throw new ApiError('無效的音訊區塊類型，必須是 Blob。', 400); // Kiểm tra audioChunk phải là Blob
    }
    
    if (audioChunk.size === 0) {
      throw new ApiError('音訊區塊大小為 0，無法上傳空區塊。', 400); // Kiểm tra kích thước chunk không được rỗng
    }
    
    if (!sessionId) {
      throw new ApiError('缺少會話 ID，無法上傳音訊區塊。', 400); // Kiểm tra sessionId bắt buộc
    }
    
    console.log(`🔄 準備上傳音訊區塊 (${audioChunk.size} bytes) 到會話 ${sessionId}...`); // Log thông tin chunk
    
    // 準備 FormData
    const formData = new FormData(); // Tạo FormData mới
    const chunkFilename = `chunk_${Date.now()}.webm`; // Tạo tên file chunk duy nhất
    formData.append('file', audioChunk, chunkFilename); // Append chunk vào FormData
    
    // 上傳音訊區塊
    const { data } = await makeRequestForUpload(`${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/stream_chunk/${sessionId}`, {
      method: 'POST', // Sử dụng phương thức POST
      body: formData // Gửi FormData chứa chunk
    });
    
    const performanceEnd = performance.now(); // 結束計時
    
    console.log('✅ 音訊區塊上傳成功:', data); // Log thành công
    
    return {
      success: true, // Đánh dấu thành công
      data: data, // Dữ liệu từ server
      message: '音訊區塊上傳成功', // Thông báo thành công
      performance: `${performanceEnd - performanceStart}ms` // Thời gian thực hiện
    };
    
  } catch (error) {
    console.error('❌ 上傳音訊區塊失敗:', error); // Log lỗi
    
    return {
      success: false, // Đánh dấu thất bại
      message: error.message || '上傳音訊區塊時發生錯誤', // Thông báo lỗi
      error: error.message, // Chi tiết lỗi
      statusCode: error.statusCode || 0, // Mã trạng thái HTTP
      performance: `${performance.now() - performanceStart}ms` // Thời gian thực hiện
    };
  }
};

// ==================== 停止串流會話 ====================
/**
 * 停止音訊串流會話並獲取錄音 ID
 * @param {string} sessionId - 串流會話 ID
 * @returns {Promise<Object>} 包含錄音 ID 的物件
 */
export const stopStreamingSession = async (sessionId) => {
  const performanceStart = performance.now(); // 開始計時以監控性能
  
  try {
    // 驗證輸入
    if (!sessionId) {
      throw new ApiError('缺少會話 ID，無法停止串流會話。', 400); // Kiểm tra sessionId bắt buộc
    }
    
    console.log(`🔄 準備停止串流會話 ${sessionId}...`); // Log bắt đầu dừng session
    
    // 呼叫停止串流 API
    const { data } = await makeRequestForUpload(`${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/stop_streaming/${sessionId}`, {
      method: 'POST' // Sử dụng phương thức POST
    });
    
    const performanceEnd = performance.now(); // 結束計時
    
    if (!data.record_id) {
      throw new ApiError('伺服器未返回有效的錄音 ID', 500); // Throw lỗi nếu không có record ID
    }
    
    console.log(`✅ 串流會話停止成功，錄音 ID: ${data.record_id}`); // Log thành công
    
    return {
      success: true, // Đánh dấu thành công
      recordId: data.record_id, // Record ID từ server
      message: '串流會話停止成功', // Thông báo thành công
      performance: `${performanceEnd - performanceStart}ms` // Thời gian thực hiện
    };
    
  } catch (error) {
    console.error('❌ 停止串流會話失敗:', error); // Log lỗi
    
    return {
      success: false, // Đánh dấu thất bại
      message: error.message || '停止串流會話時發生錯誤', // Thông báo lỗi
      error: error.message, // Chi tiết lỗi
      statusCode: error.statusCode || 0, // Mã trạng thái HTTP
      performance: `${performance.now() - performanceStart}ms` // Thời gian thực hiện
    };
  }
};

// ==================== 獲取錄音轉錄結果 ====================
/**
 * 獲取指定錄音 ID 的轉錄結果
 * @param {string} recordId - 錄音 ID
 * @returns {Promise<Object>} 包含轉錄結果的物件
 */
export const getTranscription = async (recordId) => {
  const performanceStart = performance.now(); // 開始計時以監控性能
  
  try {
    // 驗證輸入
    if (!recordId) {
      throw new ApiError('缺少錄音 ID，無法獲取轉錄結果。', 400); // Kiểm tra recordId bắt buộc
    }
    
    console.log(`🔄 準備獲取錄音 ${recordId} 的轉錄結果...`); // Log bắt đầu lấy transcription
    
    // 呼叫獲取轉錄結果 API
    const { data } = await makeRequestForUpload(`${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/transcription/${recordId}`, {
      method: 'GET' // Sử dụng phương thức GET
    });
    
    const performanceEnd = performance.now(); // 結束計時
    
    console.log('✅ 獲取轉錄結果成功:', data); // Log thành công
    
    return {
      success: true, // Đánh dấu thành công
      transcription: data.transcription || '', // Kết quả transcription từ server
      message: '獲取轉錄結果成功', // Thông báo thành công
      performance: `${performanceEnd - performanceStart}ms` // Thời gian thực hiện
    };
    
  } catch (error) {
    console.error('❌ 獲取轉錄結果失敗:', error); // Log lỗi
    
    return {
      success: false, // Đánh dấu thất bại
      message: error.message || '獲取轉錄結果時發生錯誤', // Thông báo lỗi
      error: error.message, // Chi tiết lỗi
      statusCode: error.statusCode || 0, // Mã trạng thái HTTP
      performance: `${performance.now() - performanceStart}ms` // Thời gian thực hiện
    };
  }
};

// 導出所有功能
export default {
  uploadAudio, // Export hàm upload âm thanh
  startStreamingSession, // Export hàm khởi tạo streaming session
  uploadStreamChunk, // Export hàm upload chunk
  stopStreamingSession, // Export hàm dừng streaming session
  getTranscription, // Export hàm lấy transcription
  ApiError // Export class ApiError
};
