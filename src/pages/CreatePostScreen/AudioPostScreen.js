// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import useAudioRecorder from '../../hooks/useAudioRecorder';

// // ================= 基本設定 =================

// const AUDIO_UPLOAD_API_BASE_URL = 'https://xiaohua.54ucl.com:8011';

// // ================= 環境偵測 =================
// const isInApp = () =>
//   typeof window !== "undefined" &&
//   typeof window.flutter_inappwebview !== "undefined";

// class ApiError extends Error {
//   constructor(message, statusCode = 0, data = null, url = '') {
//     super(message);
//     this.name = 'ApiError';
//     this.statusCode = statusCode;
//     this.data = data;
//     this.url = url;
//     this.timestamp = new Date().toISOString();
//   }
// }

// const makeRequestForUpload = async (url, options = {}) => {
//   const defaultOptions = {
//     timeout: 15000,
//     headers: {
//       Accept: 'application/json',
//       'X-Requested-With': 'XMLHttpRequest',
//       'Cache-Control': 'no-cache',
//       Pragma: 'no-cache',
//       ...options.headers
//     },
//     ...options
//   };

//   if (options.body instanceof FormData) {
//     delete defaultOptions.headers['Content-Type'];
//   } else {
//     defaultOptions.headers['Content-Type'] =
//       options.headers?.['Content-Type'] || 'application/json';
//   }

//   const controller = new AbortController();
//   const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);

//   try {
//     const response = await fetch(url, { ...defaultOptions, signal: controller.signal });
//     clearTimeout(timeoutId);

//     let data;
//     const contentType = response.headers.get('content-type');
//     if (contentType && contentType.includes('application/json')) {
//       data = await response.json();
//     } else {
//       data = await response.text();
//     }

//     if (!response.ok) {
//       throw new ApiError(
//         `HTTP ${response.status}: ${response.statusText}`,
//         response.status,
//         data,
//         url
//       );
//     }
//     return { response, data };
//   } catch (error) {
//     clearTimeout(timeoutId);
//     if (error.name === 'AbortError') throw new ApiError('請求超時', 408, null, url);
//     if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
//       throw new ApiError('網路錯誤 - 無法連接到伺服器', 0, null, url);
//     }
//     if (error instanceof ApiError) throw error;
//     throw new ApiError(`意外錯誤: ${error.message}`, 0, null, url);
//   }
// };

// const uploadAudio = async (audioBlob) => {
//   const performanceStart = performance.now();
//   try {
//     if (!(audioBlob instanceof Blob)) throw new ApiError('無效的音訊檔案類型，必須是 Blob。', 400);
//     if (audioBlob.size === 0) throw new ApiError('音訊檔案大小為 0，請確保有錄製內容。', 400);

//     const formData = new FormData();
//     const filename = `recording_${Date.now()}.webm`;
//     formData.append('file', audioBlob, filename);

//     const { data } = await makeRequestForUpload(
//       `${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/upload`,
//       { method: 'POST', body: formData }
//     );

//     return {
//       success: true,
//       data,
//       message: data.message || '音訊檔案上傳成功',
//       performance: `${performance.now() - performanceStart}ms`
//     };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.message || '音訊檔案上傳時發生錯誤',
//       error: error.message,
//       statusCode: error.statusCode || 0,
//       performance: `${performance.now() - performanceStart}ms`
//     };
//   }
// };

// const fetchTranscript = async (recordId) => {
//   try {
//     const res = await fetch(
//       `${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/transcript/${recordId}`,
//       {
//         method: 'GET',
//         headers: { Accept: 'application/json' },
//         signal: AbortSignal.timeout(20000)
//       }
//     );
//     if (!res.ok) {
//       const t = await res.text();
//       return { success: false, error: `HTTP ${res.status}`, raw: t };
//     }
//     const data = await res.json();
//     return {
//       success: true,
//       status: data.status,
//       transcript: data.transcript,
//       audio_url: data.audio_url
//     };
//   } catch (e) {
//     return { success: false, error: e.message };
//   }
// };

// const waitForTranscript = async (
//   recordId,
//   {
//     intervalMs = 2000,
//     maxAttempts = 20,
//     onProgress = () => {},
//     shouldAbort = () => false
//   } = {}
// ) => {
//   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//     if (shouldAbort()) throw new Error('已中止等待');
//     onProgress({ attempt, maxAttempts });

//     const result = await fetchTranscript(recordId);
//     console.log('📥 Transcript 查詢結果:', result);

//     if (result.success && result.transcript) {
//       return {
//         transcript: result.transcript,
//         status: result.status || 'done',
//         audio_url: result.audio_url
//       };
//     }

//     if (result.success && ['failed', 'error'].includes(result.status)) {
//       throw new Error('轉錄失敗 (status=' + result.status + ')');
//     }

//     if (attempt < maxAttempts) {
//       await new Promise((r) => setTimeout(r, intervalMs));
//     } else {
//       throw new Error('等待轉錄超時，仍未取得內容');
//     }
//   }
//   throw new Error('未知錯誤');
// };

// // ================= 畫面組件 =================
// const AudioPostScreen = () => {
//   const {
//     isStreamingRecording,
//     startStreamingRecording,
//     stopStreamingRecording,
//     cancelStreamingRecording,
//     streamingAudioURL,
//     streamingAudioBlob,
//     streamingStatus,
//     audioInputDetected
//   } = useAudioRecorder();

//   const navigate = useNavigate();

//   const [uploading, setUploading] = useState(false);
//   const [uploadResult, setUploadResult] = useState(null);
//   const [progressMsg, setProgressMsg] = useState('');
//   const [environmentMessage, setEnvironmentMessage] = useState('');
//   const [isAppEnvironment, setIsAppEnvironment] = useState(false);
//   const abortRef = useRef(false);

//   // 環境偵測功能，僅設定狀態，不呼叫 showOverlay
//   const handleEnvironmentDetection = useCallback(() => {
//     const inApp = isInApp();
//     setIsAppEnvironment(inApp);
//     if (inApp) {
//       setEnvironmentMessage("偵測到 APP 環境，尚未呼叫 showOverlay()");
//     } else {
//       setEnvironmentMessage("目前是 WEB 環境");
//     }
//   }, []);

//   // 組件載入時執行環境偵測
//   useEffect(() => {
//     handleEnvironmentDetection();
//   }, [handleEnvironmentDetection]);

//   // 按下開始錄音按鈕時的處理
//   const handleStartRecording = async () => {
//     if (isAppEnvironment) {
//       if (typeof window.flutter_inappwebview?.callHandler === "function") {
//         try {
//           // 如果是APP 而且有flutter_inappwebview，我就嘗試使用 showOverlay
//           const res = await window.flutter_inappwebview.callHandler("showOverlay");
//           console.log("showOverlay result:", res);
//           setEnvironmentMessage("已呼叫 showOverlay()");
//         } catch (e) {
//           // 如果是APP 而且有flutter_inappwebview，但學長的失敗了，我要改用 startStreamingRecording
//           console.error("呼叫 showOverlay 失敗", e);
//           setEnvironmentMessage("呼叫 showOverlay() 失敗，改用 startStreamingRecording 錄音");
//           startStreamingRecording();
//         }
//       } else {
//         // 如果是APP 但沒有 flutter_inappwebview，那我要使用 startStreamingRecording
//         setEnvironmentMessage("偵測到 APP，但沒有 callHandler 可用，改用 startStreamingRecording 錄音");
//         startStreamingRecording();
//       }
//     } else {
//       // 如果不是APP(是WEB)，直接使用 startStreamingRecording
//       startStreamingRecording();
//     }
//   };


//   const canUpload =
//     !isStreamingRecording && streamingAudioBlob && streamingAudioBlob.size > 0;

//   const handleUploadAndGo = async () => {
//     if (!canUpload || uploading) return;
//     abortRef.current = false;
//     setUploading(true);
//     setProgressMsg('上傳中...');
//     setUploadResult(null);

//     const res = await uploadAudio(streamingAudioBlob);
//     setUploadResult(res);

//     if (!res.success) {
//       setProgressMsg('上傳失敗，無法進行轉錄');
//       setUploading(false);
//       return;
//     }

//     const recordId =
//       res?.data?.record_id ||
//       res?.data?.uuid ||
//       res?.data?.id ||
//       res?.data?.recordId ||
//       null;

//     if (!recordId) {
//       setProgressMsg('⚠️ 後端未返回 record_id，無法取得轉錄');
//       setUploading(false);
//       return;
//     }

//     console.log('📌 取得 recordId =', recordId);

//     setProgressMsg('上傳成功，等待轉錄結果...');
//     try {
//       const result = await waitForTranscript(recordId, {
//         intervalMs: 2000,
//         maxAttempts: 25,
//         onProgress: ({ attempt, maxAttempts }) => {
//           setProgressMsg(`等待轉錄中 (${attempt}/${maxAttempts})...`);
//         },
//         shouldAbort: () => abortRef.current
//       });

//       console.log('✅ 取得轉錄結果：', result.transcript);

//       navigate('/create-post/text', {
//         state: {
//           transcript: result.transcript,
//           fromAudioRecord: true,
//           recordId,
//           audioUrl: result.audio_url
//         },
//         replace: true
//       });

//     } catch (e) {
//       console.error('❌ 等待轉錄失敗：', e);
//       setProgressMsg(`轉錄失敗：${e.message}`);
//       setUploading(false);
//     }
//   };

//   const cancelWaiting = () => {
//     abortRef.current = true;
//     setProgressMsg('已取消等待');
//     setUploading(false);
//   };

//   useEffect(() => {
//     return () => {
//       abortRef.current = true;
//     };
//   }, []);

//   return (
//     <div style={styles.container}>
//       <h2 style={styles.title}>語音轉文字</h2>

//       {/* 環境偵測顯示區域 */}
//       <div style={styles.environmentBox}>
//         <div style={styles.environmentStatus}>
//           <strong>環境狀態：{isAppEnvironment ? "APP" : "WEB"}</strong>
//         </div>
//         <button
//           style={styles.environmentBtn}
//           onClick={handleEnvironmentDetection}
//           disabled={uploading}
//         >
//           重新偵測環境
//         </button>
//         {environmentMessage && (
//           <div style={styles.environmentMessage}>
//             {environmentMessage}
//           </div>
//         )}
//       </div>

//       <div style={styles.controlsRow}>
//         {!isStreamingRecording && (
//           <>
//             <button
//               style={styles.primaryBtn}
//               onClick={handleStartRecording}
//               disabled={uploading}
//             >
//               開始串流錄音
//             </button>
//             <button
//               style={styles.secondaryBtn}
//               onClick={() => navigate('/main')}
//               disabled={uploading}
//             >
//               取消
//             </button>
//           </>
//         )}
//         {isStreamingRecording && (
//           <>
//             <button style={styles.dangerBtn} onClick={stopStreamingRecording}>
//               停止並送出
//             </button>
//             <button style={styles.secondaryBtn} onClick={cancelStreamingRecording}>
//               取消（不送出）
//             </button>
//           </>
//         )}
//       </div>

//       <div style={styles.statusBox}>
//         <div>
//           麥克風狀態：{audioInputDetected ? '有音訊偵測' : '尚未偵測到音訊'}
//         </div>
//         {streamingStatus?.recordId && (
//           <div>串流 recordId: {streamingStatus.recordId}</div>
//         )}
//       </div>

//       {streamingAudioURL && !isStreamingRecording && (
//         <div style={styles.preview}>
//           <h4>錄音預覽</h4>
//           <audio src={streamingAudioURL} controls />
//           <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
//             <button
//               style={canUpload ? styles.primaryBtn : styles.disabledBtn}
//               onClick={handleUploadAndGo}
//               disabled={!canUpload || uploading}
//             >
//               {uploading ? '處理中...' : '上傳並跳轉填入文字'}
//             </button>
//             <button
//               style={styles.secondaryBtn}
//               onClick={() => {
//                 abortRef.current = true;
//                 window.URL.revokeObjectURL(streamingAudioURL);
//               }}
//               disabled={uploading}
//             >
//               重新錄製
//             </button>
//             {uploading && (
//               <button style={styles.dangerBtn} onClick={cancelWaiting}>
//                 取消
//               </button>
//             )}
//           </div>

//           {progressMsg && (
//             <div style={{ marginTop: 10, fontSize: 14 }}>{progressMsg}</div>
//           )}

//           {uploadResult && !uploadResult.success && (
//             <div
//               style={{
//                 marginTop: 8,
//                 fontSize: 14,
//                 color: '#b91c1c'
//               }}
//             >
//               {uploadResult.message}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// const styles = {
//   container: {
//     maxWidth: '400px',
//     width: '100%',
//     boxSizing: 'border-box',
//     margin: '20px auto',
//     fontFamily: 'system-ui, sans-serif',
//     padding: '12px 16px',
//     border: '1px solid #e5e7eb',
//     borderRadius: 8,
//     background: '#fff'
//   },

//   title: { 
//     marginTop: 0, 
//     marginBottom: 16,
//     fontSize: '1.3rem',
//     fontWeight: '600'
//   },

//   environmentBox: {
//     marginBottom: 16,
//     padding: '10px 12px',
//     background: '#f0f9ff',
//     border: '1px solid #0ea5e9',
//     borderRadius: 6
//   },

//   environmentStatus: {
//     fontSize: '0.9rem',
//     marginBottom: 8,
//     color: '#0c4a6e'
//   },

//   environmentBtn: {
//     background: '#0ea5e9',
//     color: '#fff',
//     border: 'none',
//     padding: '6px 12px',
//     borderRadius: 4,
//     cursor: 'pointer',
//     fontSize: '0.8rem',
//     fontWeight: '500',
//     marginBottom: 8
//   },

//   environmentMessage: {
//     fontSize: '0.8rem',
//     color: '#0c4a6e',
//     background: '#e0f2fe',
//     padding: '6px 8px',
//     borderRadius: 4,
//     wordBreak: 'break-word'
//   },

//   controlsRow: {
//     display: 'flex',
//     gap: 8,
//     flexWrap: 'wrap',
//     marginBottom: 12
//   },

//   primaryBtn: {
//     background: '#2563eb',
//     color: '#fff',
//     border: 'none',
//     padding: '8px 14px',
//     borderRadius: 4,
//     cursor: 'pointer',
//     fontSize: '0.9rem',
//     fontWeight: '500',
//     transition: 'background-color 0.2s'
//   },

//   disabledBtn: {
//     background: '#93c5fd',
//     color: '#fff',
//     border: 'none',
//     padding: '8px 14px',
//     borderRadius: 4,
//     cursor: 'not-allowed',
//     fontSize: '0.9rem',
//     fontWeight: '500'
//   },

//   dangerBtn: {
//     background: '#dc2626',
//     color: '#fff',
//     border: 'none',
//     padding: '8px 14px',
//     borderRadius: 4,
//     cursor: 'pointer',
//     fontSize: '0.9rem',
//     fontWeight: '500',
//     transition: 'background-color 0.2s'
//   },

//   secondaryBtn: {
//     background: '#6b7280',
//     color: '#fff',
//     border: 'none',
//     padding: '8px 14px',
//     borderRadius: 4,
//     cursor: 'pointer',
//     fontSize: '0.9rem',
//     fontWeight: '500',
//     transition: 'background-color 0.2s'
//   },

//   statusBox: {
//     fontSize: '0.85rem',
//     lineHeight: 1.5,
//     background: '#f9fafb',
//     padding: '8px 10px',
//     borderRadius: 6,
//     border: '1px solid #e5e7eb',
//     marginBottom: 12
//   },

//   preview: {
//     marginTop: 12,
//     padding: '10px 12px',
//     background: '#f1f5f9',
//     borderRadius: 6
//   }
// };

// export default AudioPostScreen;

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAudioRecorder from '../../hooks/useAudioRecorder';

// ================= Cấu hình cơ bản =================

const AUDIO_UPLOAD_API_BASE_URL = 'https://xiaohua.54ucl.com:8011'; // URL API để upload âm thanh

// ================= Phát hiện môi trường =================
// Kiểm tra xem có đang chạy trong app hay không
const isInApp = () =>
  typeof window !== "undefined" &&
  typeof window.flutter_inappwebview !== "undefined";

// Lớp lỗi tùy chỉnh cho API
class ApiError extends Error {
  constructor(message, statusCode = 0, data = null, url = '') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode; // Mã lỗi HTTP
    this.data = data; // Dữ liệu lỗi
    this.url = url; // URL gây lỗi
    this.timestamp = new Date().toISOString(); // Thời gian xảy ra lỗi
  }
}

// Hàm gửi request HTTP với timeout và xử lý lỗi
const makeRequestForUpload = async (url, options = {}) => {
  const defaultOptions = {
    timeout: 15000, // Timeout 15 giây
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...options.headers
    },
    ...options
  };

  // Nếu body là FormData thì xóa Content-Type để browser tự set
  if (options.body instanceof FormData) {
    delete defaultOptions.headers['Content-Type'];
  } else {
    defaultOptions.headers['Content-Type'] =
      options.headers?.['Content-Type'] || 'application/json';
  }

  // Tạo controller để có thể hủy request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), defaultOptions.timeout);

  try {
    const response = await fetch(url, { ...defaultOptions, signal: controller.signal });
    clearTimeout(timeoutId);

    let data;
    const contentType = response.headers.get('content-type');
    // Kiểm tra content-type để parse dữ liệu phù hợp
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Nếu response không thành công thì throw error
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
    clearTimeout(timeoutId);
    // Xử lý các loại lỗi khác nhau
    if (error.name === 'AbortError') throw new ApiError('請求超時', 408, null, url); // Request timeout
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError('網路錯誤 - 無法連接到伺服器', 0, null, url); // Network error
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError(`意外錯誤: ${error.message}`, 0, null, url); // Unexpected error
  }
};

// Hàm upload file âm thanh lên server
const uploadAudio = async (audioBlob) => {
  const performanceStart = performance.now(); // Đo thời gian thực hiện
  try {
    // Kiểm tra tính hợp lệ của file âm thanh
    if (!(audioBlob instanceof Blob)) throw new ApiError('無效的音訊檔案類型，必須是 Blob。', 400);
    if (audioBlob.size === 0) throw new ApiError('音訊檔案大小為 0，請確保有錄製內容。', 400);

    // Tạo FormData để upload file
    const formData = new FormData();
    const filename = `recording_${Date.now()}.webm`; // Tên file với timestamp
    formData.append('file', audioBlob, filename);

    // Gửi request upload
    const { data } = await makeRequestForUpload(
      `${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/upload`,
      { method: 'POST', body: formData }
    );

    return {
      success: true,
      data,
      message: data.message || '音訊檔案上傳成功', // Upload thành công
      performance: `${performance.now() - performanceStart}ms`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '音訊檔案上傳時發生錯誤', // Lỗi khi upload
      error: error.message,
      statusCode: error.statusCode || 0,
      performance: `${performance.now() - performanceStart}ms`
    };
  }
};

// Hàm lấy kết quả chuyển đổi giọng nói thành văn bản
const fetchTranscript = async (recordId) => {
  try {
    const res = await fetch(
      `${AUDIO_UPLOAD_API_BASE_URL}/recording/api/v1/transcript/${recordId}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(20000) // Timeout 20 giây
      }
    );
    if (!res.ok) {
      const t = await res.text();
      return { success: false, error: `HTTP ${res.status}`, raw: t };
    }
    const data = await res.json();
    return {
      success: true,
      status: data.status, // Trạng thái xử lý
      transcript: data.transcript, // Văn bản đã chuyển đổi
      audio_url: data.audio_url // URL file âm thanh
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Hàm chờ kết quả chuyển đổi hoàn thành (polling)
const waitForTranscript = async (
  recordId,
  {
    intervalMs = 2000, // Khoảng thời gian giữa các lần kiểm tra (2 giây)
    maxAttempts = 20, // Số lần thử tối đa
    onProgress = () => {}, // Callback báo tiến độ
    shouldAbort = () => false // Hàm kiểm tra có nên dừng không
  } = {}
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (shouldAbort()) throw new Error('已中止等待'); // Đã hủy chờ
    onProgress({ attempt, maxAttempts });

    const result = await fetchTranscript(recordId);
    console.log('📥 Transcript 查詢結果:', result); // Log kết quả truy vấn

    // Nếu đã có kết quả transcript
    if (result.success && result.transcript) {
      return {
        transcript: result.transcript,
        status: result.status || 'done',
        audio_url: result.audio_url
      };
    }

    // Nếu xử lý thất bại
    if (result.success && ['failed', 'error'].includes(result.status)) {
      throw new Error('轉錄失敗 (status=' + result.status + ')'); // Chuyển đổi thất bại
    }

    // Chờ trước khi thử lại
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, intervalMs));
    } else {
      throw new Error('等待轉錄超時，仍未取得內容'); // Timeout chờ chuyển đổi
    }
  }
  throw new Error('未知錯誤'); // Lỗi không xác định
};

// ================= Component giao diện =================
const AudioPostScreen = () => {
  // Sử dụng hook để ghi âm
  const {
    isStreamingRecording, // Đang ghi âm hay không
    startStreamingRecording, // Bắt đầu ghi âm
    stopStreamingRecording, // Dừng ghi âm
    cancelStreamingRecording, // Hủy ghi âm
    streamingAudioURL, // URL âm thanh đã ghi
    streamingAudioBlob, // Blob âm thanh đã ghi
    streamingStatus, // Trạng thái ghi âm
    audioInputDetected // Có phát hiện âm thanh từ mic không
  } = useAudioRecorder();

  const navigate = useNavigate(); // Hook để điều hướng

  // Các state của component
  const [uploading, setUploading] = useState(false); // Đang upload hay không
  const [uploadResult, setUploadResult] = useState(null); // Kết quả upload
  const [progressMsg, setProgressMsg] = useState(''); // Thông báo tiến độ
  const [environmentMessage, setEnvironmentMessage] = useState(''); // Thông báo môi trường
  const [isAppEnvironment, setIsAppEnvironment] = useState(false); // Có phải môi trường app không
  
  // State để lưu recordId nhận từ Flutter
  const [recordId, setRecordId] = useState('');
  
  const abortRef = useRef(false); // Ref để hủy quá trình chờ

  // Thiết lập callback để nhận audio ID từ Flutter
  useEffect(() => {
    window.receiveAudioId = (id) => {
      const v = String(id ?? "");
      setRecordId(v);
      console.log("receiveAudioId:", v);
      
      // Khi nhận được recordId, tự động bắt đầu chờ chuyển đổi
      if (v) {
        handleFlutterRecordId(v);
      }
    };
    
    return () => {
      delete window.receiveAudioId; // Dọn dẹp khi component unmount
    };
  }, []);

  // Xử lý recordId nhận từ Flutter
  const handleFlutterRecordId = async (receivedRecordId) => {
    console.log('📌 從 Flutter 收到 recordId =', receivedRecordId); // Nhận recordId từ Flutter
    
    setUploading(true);
    setProgressMsg('已收到錄音 ID，等待轉錄結果...'); // Đã nhận ID ghi âm, chờ kết quả chuyển đổi
    setUploadResult(null);
    abortRef.current = false;

    try {
      const result = await waitForTranscript(receivedRecordId, {
        intervalMs: 2000,
        maxAttempts: 25,
        onProgress: ({ attempt, maxAttempts }) => {
          setProgressMsg(`等待轉錄中 (${attempt}/${maxAttempts})...`); // Đang chờ chuyển đổi
        },
        shouldAbort: () => abortRef.current
      });

      console.log('✅ 取得轉錄結果：', result.transcript); // Lấy được kết quả chuyển đổi

      // Điều hướng đến trang tạo bài viết với văn bản đã chuyển đổi
      navigate('/create-post/text', {
        state: {
          transcript: result.transcript,
          fromAudioRecord: true,
          recordId: receivedRecordId,
          audioUrl: result.audio_url
        },
        replace: true
      });

    } catch (e) {
      console.error('❌ 等待轉錄失敗：', e); // Chờ chuyển đổi thất bại
      setProgressMsg(`轉錄失敗：${e.message}`); // Chuyển đổi thất bại
      setUploading(false);
    }
  };

  // Phát hiện môi trường (app hay web)
  const handleEnvironmentDetection = useCallback(() => {
    const inApp = isInApp();
    setIsAppEnvironment(inApp);
    if (inApp) {
      setEnvironmentMessage("偵測到 APP 環境，尚未呼叫 showOverlay()"); // Phát hiện môi trường APP
    } else {
      setEnvironmentMessage("目前是 WEB 環境"); // Hiện tại là môi trường WEB
    }
  }, []);

  // Thực hiện phát hiện môi trường khi component mount
  useEffect(() => {
    handleEnvironmentDetection();
  }, [handleEnvironmentDetection]);

  // Xử lý khi nhấn nút bắt đầu ghi âm
  const handleStartRecording = async () => {
    if (isAppEnvironment) {
      if (typeof window.flutter_inappwebview?.callHandler === "function") {
        try {
          // Nếu là APP và có flutter_inappwebview, thử sử dụng showOverlay
          const res = await window.flutter_inappwebview.callHandler("showOverlay");
          console.log("showOverlay result:", res);
          setEnvironmentMessage("已呼叫 showOverlay()，等待接收 recordId..."); // Đã gọi showOverlay, chờ nhận recordId
        } catch (e) {
          // Nếu showOverlay thất bại, chuyển sang dùng startStreamingRecording
          console.error("呼叫 showOverlay 失敗", e); // Gọi showOverlay thất bại
          setEnvironmentMessage("呼叫 showOverlay() 失敗，改用 startStreamingRecording 錄音"); // Gọi showOverlay thất bại, chuyển sang ghi âm streaming
          startStreamingRecording();
        }
      } else {
        // Nếu là APP nhưng không có flutter_inappwebview, dùng startStreamingRecording
        setEnvironmentMessage("偵測到 APP，但沒有 callHandler 可用，改用 startStreamingRecording 錄音"); // Phát hiện APP nhưng không có callHandler
        startStreamingRecording();
      }
    } else {
      // Nếu không phải APP (là WEB), dùng startStreamingRecording
      startStreamingRecording();
    }
  };

  // Kiểm tra có thể upload hay không
  const canUpload =
    !isStreamingRecording && streamingAudioBlob && streamingAudioBlob.size > 0;

  // Xử lý upload và chuyển trang
  const handleUploadAndGo = async () => {
    if (!canUpload || uploading) return;
    abortRef.current = false;
    setUploading(true);
    setProgressMsg('上傳中...'); // Đang upload
    setUploadResult(null);

    const res = await uploadAudio(streamingAudioBlob);
    setUploadResult(res);

    if (!res.success) {
      setProgressMsg('上傳失敗，無法進行轉錄'); // Upload thất bại, không thể chuyển đổi
      setUploading(false);
      return;
    }

    // Lấy recordId từ response
    const recordId =
      res?.data?.record_id ||
      res?.data?.uuid ||
      res?.data?.id ||
      res?.data?.recordId ||
      null;

    if (!recordId) {
      setProgressMsg('⚠️ 後端未返回 record_id，無法取得轉錄'); // Backend không trả về record_id
      setUploading(false);
      return;
    }

    console.log('📌 取得 recordId =', recordId); // Lấy được recordId

    setProgressMsg('上傳成功，等待轉錄結果...'); // Upload thành công, chờ kết quả chuyển đổi
    try {
      const result = await waitForTranscript(recordId, {
        intervalMs: 2000,
        maxAttempts: 25,
        onProgress: ({ attempt, maxAttempts }) => {
          setProgressMsg(`等待轉錄中 (${attempt}/${maxAttempts})...`); // Đang chờ chuyển đổi
        },
        shouldAbort: () => abortRef.current
      });

      console.log('✅ 取得轉錄結果：', result.transcript); // Lấy được kết quả chuyển đổi

      // Điều hướng đến trang tạo bài viết
      navigate('/create-post/text', {
        state: {
          transcript: result.transcript,
          fromAudioRecord: true,
          recordId,
          audioUrl: result.audio_url
        },
        replace: true
      });

    } catch (e) {
      console.error('❌ 等待轉錄失敗：', e); // Chờ chuyển đổi thất bại
      setProgressMsg(`轉錄失敗：${e.message}`); // Chuyển đổi thất bại
      setUploading(false);
    }
  };

  // Hủy chờ
  const cancelWaiting = () => {
    abortRef.current = true;
    setProgressMsg('已取消等待'); // Đã hủy chờ
    setUploading(false);
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>語音轉文字</h2> {/* Chuyển đổi giọng nói thành văn bản */}

      {/* Khu vực hiển thị phát hiện môi trường */}
      <div style={styles.environmentBox}>
        <div style={styles.environmentStatus}>
          <strong>環境狀態：{isAppEnvironment ? "APP" : "WEB"}</strong> {/* Trạng thái môi trường */}
        </div>
        <button
          style={styles.environmentBtn}
          onClick={handleEnvironmentDetection}
          disabled={uploading}
        >
          重新偵測環境 {/* Phát hiện lại môi trường */}
        </button>
        {environmentMessage && (
          <div style={styles.environmentMessage}>
            {environmentMessage}
          </div>
        )}
        {/* Hiển thị recordId nhận từ Flutter */}
        {recordId && (
          <div style={styles.recordIdDisplay}>
            <strong>接收到的 Record ID：</strong>{recordId} {/* Record ID đã nhận */}
          </div>
        )}
      </div>

      <div style={styles.controlsRow}>
        {!isStreamingRecording && (
          <>
            <button
              style={styles.primaryBtn}
              onClick={handleStartRecording}
              disabled={uploading}
            >
              開始串流錄音 {/* Bắt đầu ghi âm streaming */}
            </button>
            <button
              style={styles.secondaryBtn}
              onClick={() => navigate('/main')}
              disabled={uploading}
            >
              取消 {/* Hủy */}
            </button>
          </>
        )}
        {isStreamingRecording && (
          <>
            <button style={styles.dangerBtn} onClick={stopStreamingRecording}>
              停止並送出 {/* Dừng và gửi */}
            </button>
            <button style={styles.secondaryBtn} onClick={cancelStreamingRecording}>
              取消（不送出） {/* Hủy (không gửi) */}
            </button>
          </>
        )}
      </div>

      <div style={styles.statusBox}>
        <div>
          麥克風狀態：{audioInputDetected ? '有音訊偵測' : '尚未偵測到音訊'} {/* Trạng thái micro: Có phát hiện âm thanh / Chưa phát hiện âm thanh */}
        </div>
        {streamingStatus?.recordId && (
          <div>串流 recordId: {streamingStatus.recordId}</div> 
        )}
      </div>

      {streamingAudioURL && !isStreamingRecording && (
        <div style={styles.preview}>
          <h4>錄音預覽</h4> {/* Xem trước ghi âm */}
          <audio src={streamingAudioURL} controls />
          <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              style={canUpload ? styles.primaryBtn : styles.disabledBtn}
              onClick={handleUploadAndGo}
              disabled={!canUpload || uploading}
            >
              {uploading ? '處理中...' : '上傳並跳轉填入文字'} {/* Đang xử lý / Upload và chuyển đến điền văn bản */}
            </button>
            <button
              style={styles.secondaryBtn}
              onClick={() => {
                abortRef.current = true;
                window.URL.revokeObjectURL(streamingAudioURL);
              }}
              disabled={uploading}
            >
              重新錄製 {/* Ghi lại */}
            </button>
            {uploading && (
              <button style={styles.dangerBtn} onClick={cancelWaiting}>
                取消 {/* Hủy */}
              </button>
            )}
          </div>

          {progressMsg && (
            <div style={{ marginTop: 10, fontSize: 14 }}>{progressMsg}</div>
          )}

          {uploadResult && !uploadResult.success && (
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: '#b91c1c'
              }}
            >
              {uploadResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Định nghĩa styles cho component
const styles = {
  container: {
    maxWidth: '400px',
    width: '100%',
    boxSizing: 'border-box',
    margin: '20px auto',
    fontFamily: 'system-ui, sans-serif',
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    background: '#fff'
  },

  title: { 
    marginTop: 0, 
    marginBottom: 16,
    fontSize: '1.3rem',
    fontWeight: '600'
  },

  environmentBox: { // Box hiển thị thông tin môi trường
    marginBottom: 16,
    padding: '10px 12px',
    background: '#f0f9ff',
    border: '1px solid #0ea5e9',
    borderRadius: 6
  },

  environmentStatus: { // Trạng thái môi trường
    fontSize: '0.9rem',
    marginBottom: 8,
    color: '#0c4a6e'
  },

  environmentBtn: { // Nút phát hiện môi trường
    background: '#0ea5e9',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    marginBottom: 8
  },

  environmentMessage: { // Thông báo môi trường
    fontSize: '0.8rem',
    color: '#0c4a6e',
    background: '#e0f2fe',
    padding: '6px 8px',
    borderRadius: 4,
    wordBreak: 'break-word'
  },

  recordIdDisplay: { // Hiển thị recordId
    fontSize: '0.8rem',
    color: '#059669',
    background: '#d1fae5',
    padding: '6px 8px',
    borderRadius: 4,
    marginTop: 8,
    wordBreak: 'break-all'
  },

  controlsRow: { // Hàng các nút điều khiển
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12
  },

  primaryBtn: { // Nút chính
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },

  disabledBtn: { // Nút bị vô hiệu hóa
    background: '#93c5fd',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 4,
    cursor: 'not-allowed',
    fontSize: '0.9rem',
    fontWeight: '500'
  },

  dangerBtn: { // Nút nguy hiểm (màu đỏ)
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },

  secondaryBtn: { // Nút phụ
    background: '#6b7280',
    color: '#fff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },

  statusBox: { // Box hiển thị trạng thái
    fontSize: '0.85rem',
    lineHeight: 1.5,
    background: '#f9fafb',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #e5e7eb',
    marginBottom: 12
  },

  preview: { // Khu vực xem trước
    marginTop: 12,
    padding: '10px 12px',
    background: '#f1f5f9',
    borderRadius: 6
  }
};

export default AudioPostScreen;
