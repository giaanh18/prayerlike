// TranscriptAPI.js
// 獨立的轉錄和錄音記錄管理 API
// 可直接在 React 組件中使用
// API độc lập để quản lý chuyển đổi giọng nói thành văn bản và ghi âm
// Có thể sử dụng trực tiếp trong các component React

const TRANSCRIPT_API = {
  baseURL: 'https://xiaohua.54ucl.com:8011/recording/api/v1', // URL cơ sở của API
  
  // 默認請求標頭
  getHeaders() { // Hàm lấy headers mặc định cho request
    const token = localStorage.getItem('token'); // Lấy token từ localStorage
    const headers = { // Object chứa các headers
      'Content-Type': 'application/json', // Loại nội dung JSON
      'Accept': 'application/json', // Chấp nhận response JSON
    };
    
    if (token) { // Nếu có token
      headers['Authorization'] = `Bearer ${token}`; // Thêm Authorization header
    }
    
    return headers; // Trả về headers
  },

  /**
   * 查詢轉錄結果
   * @param {string} recordId - 錄音記錄 ID
   * @returns {Promise<Object>} 查詢結果
   */
  async getTranscript(recordId) { // Hàm truy vấn kết quả chuyển đổi giọng nói
    if (!recordId) { // Nếu không có recordId
      return {
        success: false, // Thất bại
        error: 'recordId 不能為空', // Lỗi: recordId không được để trống
        status: null, // Trạng thái null
        transcript: null, // Văn bản chuyển đổi null
        audio_url: null // URL audio null
      };
    }

    const url = `${this.baseURL}/transcript/${recordId}`; // Tạo URL API
    console.log(`🔍 查詢轉錄結果: ${recordId}`); // Log truy vấn kết quả chuyển đổi

    try {
      const startTime = Date.now(); // Bắt đầu đo thời gian
      
      const response = await fetch(url, { // Gửi request GET
        method: 'GET', // Phương thức GET
        headers: this.getHeaders(), // Sử dụng headers mặc định
        signal: AbortSignal.timeout(30000) // Timeout 30 giây
      });

      const endTime = Date.now(); // Kết thúc đo thời gian
      const duration = endTime - startTime; // Tính thời gian thực hiện

      if (!response.ok) { // Nếu response không thành công
        const errorText = await response.text(); // Lấy text lỗi
        console.error(`❌ 查詢轉錄結果失敗 ${response.status}: ${response.statusText}`, errorText); // Log lỗi
        
        return {
          success: false, // Thất bại
          error: `HTTP ${response.status}: ${response.statusText}`, // Thông báo lỗi HTTP
          status: null, // Trạng thái null
          transcript: null, // Văn bản null
          audio_url: null, // URL audio null
          performance: `${duration}ms` // Thời gian thực hiện
        };
      }

      const data = await response.json(); // Parse JSON response
      console.log('✅ 轉錄結果查詢成功:', data); // Log thành công

      return {
        success: true, // Thành công
        recordId: recordId, // ID bản ghi
        status: data.status, // Trạng thái từ API
        transcript: data.transcript, // Văn bản chuyển đổi
        audio_url: data.audio_url, // URL file audio
        performance: `${duration}ms` // Thời gian thực hiện
      };

    } catch (error) {
      console.error('💥 查詢轉錄結果時發生錯誤:', error); // Log lỗi exception
      
      let errorMessage = error.message; // Thông báo lỗi mặc định
      if (error.name === 'TimeoutError') { // Nếu lỗi timeout
        errorMessage = '查詢超時，請稍後再試'; // Thông báo timeout
      } else if (error.name === 'TypeError') { // Nếu lỗi network
        errorMessage = '網路連線錯誤，請檢查網路狀態'; // Thông báo lỗi mạng
      }

      return {
        success: false, // Thất bại
        error: errorMessage, // Thông báo lỗi
        recordId: recordId, // ID bản ghi
        status: null, // Trạng thái null
        transcript: null, // Văn bản null
        audio_url: null, // URL audio null
        performance: null // Không có thông tin hiệu suất
      };
    }
  },

  /**
   * 刪除錄音記錄
   * @param {string} recordId - 錄音記錄 ID
   * @returns {Promise<Object>} 刪除結果
   */
  async deleteRecord(recordId) { // Hàm xóa bản ghi âm thanh
    if (!recordId) { // Nếu không có recordId
      return {
        success: false, // Thất bại
        error: 'recordId 不能為空' // Lỗi: recordId không được để trống
      };
    }

    const url = `${this.baseURL}/record/${recordId}`; // Tạo URL API xóa
    console.log(`🗑️ 刪除錄音記錄: ${recordId}`); // Log xóa bản ghi

    try {
      const startTime = Date.now(); // Bắt đầu đo thời gian
      
      const response = await fetch(url, { // Gửi request DELETE
        method: 'DELETE', // Phương thức DELETE
        headers: this.getHeaders(), // Sử dụng headers mặc định
        signal: AbortSignal.timeout(15000) // Timeout 15 giây
      });

      const endTime = Date.now(); // Kết thúc đo thời gian
      const duration = endTime - startTime; // Tính thời gian thực hiện

      if (!response.ok) { // Nếu response không thành công
        const errorText = await response.text(); // Lấy text lỗi
        console.error(`❌ 刪除錄音記錄失敗 ${response.status}: ${response.statusText}`, errorText); // Log lỗi
        
        return {
          success: false, // Thất bại
          error: `HTTP ${response.status}: ${response.statusText}`, // Thông báo lỗi HTTP
          recordId: recordId, // ID bản ghi
          performance: `${duration}ms` // Thời gian thực hiện
        };
      }

      const data = await response.json(); // Parse JSON response
      console.log('✅ 錄音記錄刪除成功:', recordId); // Log xóa thành công

      return {
        success: data.success || true, // Trạng thái thành công từ API hoặc mặc định true
        recordId: recordId, // ID bản ghi
        message: '錄音記錄已成功刪除', // Thông báo xóa thành công
        performance: `${duration}ms` // Thời gian thực hiện
      };

    } catch (error) {
      console.error('💥 刪除錄音記錄時發生錯誤:', error); // Log lỗi exception
      
      let errorMessage = error.message; // Thông báo lỗi mặc định
      if (error.name === 'TimeoutError') { // Nếu lỗi timeout
        errorMessage = '刪除超時，請稍後再試'; // Thông báo timeout
      } else if (error.name === 'TypeError') { // Nếu lỗi network
        errorMessage = '網路連線錯誤，請檢查網路狀態'; // Thông báo lỗi mạng
      }

      return {
        success: false, // Thất bại
        error: errorMessage, // Thông báo lỗi
        recordId: recordId, // ID bản ghi
        performance: null // Không có thông tin hiệu suất
      };
    }
  },

  /**
   * 批量查詢轉錄結果
   * @param {Array<string>} recordIds - 錄音記錄 ID 陣列
   * @returns {Promise<Object>} 批量查詢結果
   */
  async getMultipleTranscripts(recordIds) { // Hàm truy vấn hàng loạt kết quả chuyển đổi
    if (!Array.isArray(recordIds) || recordIds.length === 0) { // Nếu không phải mảng hoặc mảng rỗng
      return {
        success: false, // Thất bại
        error: '錄音 ID 陣列不能為空', // Lỗi: mảng ID không được để trống
        results: [] // Kết quả rỗng
      };
    }

    console.log(`🔍 批量查詢轉錄結果: ${recordIds.length} 個記錄`); // Log truy vấn hàng loạt
    const startTime = Date.now(); // Bắt đầu đo thời gian

    try {
      // 並行查詢所有轉錄結果
      const promises = recordIds.map(recordId => this.getTranscript(recordId)); // Tạo mảng promises để truy vấn song song
      const results = await Promise.all(promises); // Chờ tất cả promises hoàn thành
      
      const endTime = Date.now(); // Kết thúc đo thời gian
      const duration = endTime - startTime; // Tính thời gian thực hiện
      
      const successCount = results.filter(r => r.success).length; // Đếm số lượng thành công
      const failureCount = results.length - successCount; // Đếm số lượng thất bại
      
      console.log(`✅ 批量查詢完成: 成功 ${successCount} 個，失敗 ${failureCount} 個`); // Log kết quả hàng loạt

      return {
        success: true, // Thành công
        results: results, // Mảng kết quả
        summary: { // Tóm tắt kết quả
          total: recordIds.length, // Tổng số bản ghi
          success: successCount, // Số thành công
          failure: failureCount, // Số thất bại
          performance: `${duration}ms` // Thời gian thực hiện
        }
      };

    } catch (error) {
      console.error('💥 批量查詢時發生錯誤:', error); // Log lỗi exception
      
      return {
        success: false, // Thất bại
        error: error.message, // Thông báo lỗi
        results: [], // Kết quả rỗng
        summary: { // Tóm tắt lỗi
          total: recordIds.length, // Tổng số bản ghi
          success: 0, // Không có thành công
          failure: recordIds.length, // Tất cả thất bại
          performance: null // Không có thông tin hiệu suất
        }
      };
    }
  },

  /**
   * 批量刪除錄音記錄
   * @param {Array<string>} recordIds - 錄音記錄 ID 陣列
   * @returns {Promise<Object>} 批量刪除結果
   */
  async deleteMultipleRecords(recordIds) { // Hàm xóa hàng loạt bản ghi âm thanh
    if (!Array.isArray(recordIds) || recordIds.length === 0) { // Nếu không phải mảng hoặc mảng rỗng
      return {
        success: false, // Thất bại
        error: '錄音 ID 陣列不能為空', // Lỗi: mảng ID không được để trống
        results: [] // Kết quả rỗng
      };
    }

    console.log(`🗑️ 批量刪除錄音記錄: ${recordIds.length} 個記錄`); // Log xóa hàng loạt
    const startTime = Date.now(); // Bắt đầu đo thời gian

    try {
      // 並行刪除所有錄音記錄
      const promises = recordIds.map(recordId => this.deleteRecord(recordId)); // Tạo mảng promises để xóa song song
      const results = await Promise.all(promises); // Chờ tất cả promises hoàn thành
      
      const endTime = Date.now(); // Kết thúc đo thời gian
      const duration = endTime - startTime; // Tính thời gian thực hiện
      
      const successCount = results.filter(r => r.success).length; // Đếm số lượng thành công
      const failureCount = results.length - successCount; // Đếm số lượng thất bại
      
      console.log(`✅ 批量刪除完成: 成功 ${successCount} 個，失敗 ${failureCount} 個`); // Log kết quả xóa hàng loạt

      return {
        success: true, // Thành công
        results: results, // Mảng kết quả
        summary: { // Tóm tắt kết quả
          total: recordIds.length, // Tổng số bản ghi
          success: successCount, // Số thành công
          failure: failureCount, // Số thất bại
          performance: `${duration}ms` // Thời gian thực hiện
        }
      };

    } catch (error) {
      console.error('💥 批量刪除時發生錯誤:', error); // Log lỗi exception
      
      return {
        success: false, // Thất bại
        error: error.message, // Thông báo lỗi
        results: [], // Kết quả rỗng
        summary: { // Tóm tắt lỗi
          total: recordIds.length, // Tổng số bản ghi
          success: 0, // Không có thành công
          failure: recordIds.length, // Tất cả thất bại
          performance: null // Không có thông tin hiệu suất
        }
      };
    }
  },

  /**
   * 測試 API 連線
   * @returns {Promise<Object>} 連線測試結果
   */
  async testConnection() { // Hàm test kết nối API
    console.log('🔗 測試轉錄 API 連線...'); // Log test kết nối
    
    try {
      const testRecordId = 'test-connection-' + Date.now(); // Tạo ID test với timestamp
      const url = `${this.baseURL}/transcript/${testRecordId}`; // Tạo URL test
      
      const response = await fetch(url, { // Gửi request test
        method: 'GET', // Phương thức GET
        headers: this.getHeaders(), // Sử dụng headers mặc định
        signal: AbortSignal.timeout(10000) // Timeout 10 giây
      });
      
      console.log(`✅ 轉錄 API 連線正常 (狀態碼: ${response.status})`); // Log kết nối thành công
      
      return {
        success: true, // Thành công
        status: response.status, // Mã trạng thái HTTP
        message: '轉錄 API 連線正常' // Thông báo kết nối bình thường
      };
      
    } catch (error) {
      console.error('❌ 轉錄 API 連線失敗:', error); // Log kết nối thất bại
      
      return {
        success: false, // Thất bại
        error: error.message, // Thông báo lỗi
        message: `轉錄 API 連線失敗: ${error.message}` // Thông báo kết nối thất bại chi tiết
      };
    }
  }
};

export default TRANSCRIPT_API; // Export API object