import { useState, useRef, useCallback } from 'react'; // Import các hook từ React
import { 
  uploadAudio, // Service tải lên audio
  startStreamingSession, // Service bắt đầu phiên streaming
  uploadStreamChunk, // Service tải lên chunk streaming
  stopStreamingSession, // Service dừng phiên streaming
  getTranscription // Service lấy bản chuyển đổi giọng nói
} from '../services/AudioUploadService';

const AUDIO_INPUT_THRESHOLD = 5; // Ngưỡng phát hiện âm thanh đầu vào
const STREAM_TIMESLICE = 500; // Streaming ghi âm tạo chunk mỗi 500ms (có thể điều chỉnh)

const useAudioRecorder = () => { // Hook tùy chỉnh cho ghi âm
  // ====== Trạng thái ghi âm một lần (Batch) ======
  const [isRecording, setIsRecording] = useState(false); // Có đang ghi âm không
  const [audioBlob, setAudioBlob] = useState(null); // Blob dữ liệu audio  
  const [audioURL, setAudioURL] = useState(''); // URL để phát audio
  const [audioInputDetected, setAudioInputDetected] = useState(false); // Đã phát hiện âm thanh đầu vào

  // ====== Trạng thái ghi âm streaming ======
  const [isStreamingRecording, setIsStreamingRecording] = useState(false); // Có đang streaming không
  const [streamingAudioBlob, setStreamingAudioBlob] = useState(null); // Blob audio streaming
  const [streamingAudioURL, setStreamingAudioURL] = useState(''); // URL audio streaming
  const [streamingStatus, setStreamingStatus] = useState({ // Trạng thái streaming
    isActive: false, // Có đang hoạt động không
    sessionId: null, // ID phiên từ server
    error: null, // Lỗi nếu có
    message: '', // Thông báo trạng thái
    recordId: null, // ID bản ghi
    transcription: '', // Bản chuyển đổi giọng nói
    performance: '' // Thông tin hiệu suất
  });

  // ====== Trạng thái tải lên một lần ======
  const [batchUploadStatus, setBatchUploadStatus] = useState({ // Trạng thái tải lên batch
    isUploading: false, // Có đang tải lên không
    success: false, // Thành công hay không
    error: null, // Lỗi nếu có
    message: '', // Thông báo
    performance: '', // Thông tin hiệu suất
    recordId: null, // ID bản ghi
    transcription: '' // Bản chuyển đổi giọng nói
  });

  // ====== Các Ref cho Recorder / Stream / Chunks / Session ======
  const batchRecorderRef = useRef(null); // Ref cho MediaRecorder batch
  const batchStreamRef = useRef(null); // Ref cho MediaStream batch
  const batchChunksRef = useRef([]); // Ref cho các chunk dữ liệu batch
  const batchSessionIdRef = useRef(null); // Ref cho session ID batch
  const lastCompletedBatchSessionIdRef = useRef(null); // Ref cho session ID batch hoàn thành cuối

  const streamingRecorderRef = useRef(null); // Ref cho MediaRecorder streaming
  const streamingStreamRef = useRef(null); // Ref cho MediaStream streaming
  const streamingChunksRef = useRef([]); // Ref cho các chunk streaming
  const streamingLocalSessionIdRef = useRef(null); // Ref cho session ID local streaming
  const streamingServerSessionIdRef = useRef(null); // Ref cho session ID server streaming
  const streamingStoppingRef = useRef(false); // Ref cho trạng thái đang dừng streaming

  // Tài nguyên phát hiện âm lượng dùng chung (chỉ một loại ghi âm hoạt động cùng lúc)
  const audioContextRef = useRef(null); // Ref cho AudioContext
  const analyserRef = useRef(null); // Ref cho AnalyserNode
  const dataArrayRef = useRef(null); // Ref cho mảng dữ liệu tần số
  const rafIdRef = useRef(null); // Ref cho requestAnimationFrame ID
  const monitorSessionIdRef = useRef(null); // Ref cho session ID monitor

  // Quản lý Object URL
  const batchObjectURLRef = useRef(null); // Ref cho Object URL batch
  const streamingObjectURLRef = useRef(null); // Ref cho Object URL streaming

  // ====== Công cụ: Tạo Session ID mới ======
  const newSessionId = () => // Hàm tạo session ID mới
    (crypto?.randomUUID && crypto.randomUUID()) || Date.now().toString() + '-' + Math.random().toString(36).slice(2);

  // ====== Giải phóng Object URL ======
  const revokeBatchURL = () => { // Giải phóng URL batch
    if (batchObjectURLRef.current) { // Nếu có URL batch
      URL.revokeObjectURL(batchObjectURLRef.current); // Giải phóng URL
      batchObjectURLRef.current = null; // Reset ref
    }
  };
  const revokeStreamingURL = () => { // Giải phóng URL streaming
    if (streamingObjectURLRef.current) { // Nếu có URL streaming
      URL.revokeObjectURL(streamingObjectURLRef.current); // Giải phóng URL
      streamingObjectURLRef.current = null; // Reset ref
    }
  };

  // ====== Dọn dẹp monitor âm lượng ======
  const cleanupAudioMonitor = useCallback(() => { // Dọn dẹp monitor âm thanh
    monitorSessionIdRef.current = null; // Reset session ID monitor
    if (rafIdRef.current) { // Nếu có animation frame
      cancelAnimationFrame(rafIdRef.current); // Hủy animation frame
      rafIdRef.current = null; // Reset ref
    }
    if (audioContextRef.current) { // Nếu có audio context
      audioContextRef.current.close().catch(()=>{}); // Đóng audio context
      audioContextRef.current = null; // Reset ref
    }
    analyserRef.current = null; // Reset analyser
    dataArrayRef.current = null; // Reset data array
  }, []);

  // ====== Khởi động monitor âm lượng ======
  const startAudioMonitor = (sessionId, onDetectedOnce) => { // Bắt đầu monitor âm thanh
    // Tạo AudioContext mới
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)(); // Tạo audio context
    const source = audioContextRef.current.createMediaStreamSource( // Tạo source từ media stream
      batchStreamRef.current || streamingStreamRef.current // Sử dụng stream batch hoặc streaming
    );
    analyserRef.current = audioContextRef.current.createAnalyser(); // Tạo analyser
    analyserRef.current.fftSize = 256; // Thiết lập kích thước FFT
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount); // Tạo mảng dữ liệu
    source.connect(analyserRef.current); // Kết nối source với analyser

    monitorSessionIdRef.current = sessionId; // Lưu session ID

    const loop = () => { // Vòng lặp monitor
      if (monitorSessionIdRef.current !== sessionId) return; // Tránh session cũ tiếp tục chạy
      if (!analyserRef.current || !dataArrayRef.current) return; // Kiểm tra analyser và data array
      analyserRef.current.getByteFrequencyData(dataArrayRef.current); // Lấy dữ liệu tần số
      let sum = 0; // Tổng âm lượng
      for (let i = 0; i < dataArrayRef.current.length; i++) sum += dataArrayRef.current[i]; // Tính tổng
      const avg = sum / dataArrayRef.current.length; // Tính trung bình
      if (avg > AUDIO_INPUT_THRESHOLD) { // Nếu vượt ngưỡng
        onDetectedOnce(); // Gọi callback phát hiện
      }
      rafIdRef.current = requestAnimationFrame(loop); // Tiếp tục vòng lặp
    };
    rafIdRef.current = requestAnimationFrame(loop); // Bắt đầu vòng lặp
  };

  // ====== Dọn dẹp tài nguyên Batch ======
  const cleanupBatchStream = () => { // Dọn dẹp stream batch
    if (batchStreamRef.current) { // Nếu có batch stream
      batchStreamRef.current.getTracks().forEach(t => t.stop()); // Dừng tất cả track
      batchStreamRef.current = null; // Reset ref
    }
    batchRecorderRef.current = null; // Reset recorder ref
  };

  // ====== Dọn dẹp tài nguyên Streaming ======
  const cleanupStreamingStream = () => { // Dọn dẹp stream streaming
    if (streamingStreamRef.current) { // Nếu có streaming stream
      streamingStreamRef.current.getTracks().forEach(t => t.stop()); // Dừng tất cả track
      streamingStreamRef.current = null; // Reset ref
    }
    streamingRecorderRef.current = null; // Reset recorder ref
  };

  // ====== Ghi âm một lần: Bắt đầu ======
  const startRecording = useCallback(async () => { // Bắt đầu ghi âm một lần
    if (isRecording) { // Nếu đang ghi âm
      console.warn('已在一次性錄音中'); // Cảnh báo đã trong ghi âm một lần
      return;
    }
    if (isStreamingRecording) { // Nếu đang streaming
      alert('目前正處於串流錄音中，請先停止串流錄音再開始一次性錄音。'); // Thông báo đang streaming
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) { // Nếu không hỗ trợ getUserMedia
      alert('您的瀏覽器不支援錄音功能。'); // Thông báo không hỗ trợ
      return;
    }

    // Reset trạng thái
    setBatchUploadStatus({ // Reset trạng thái tải lên batch
      isUploading: false,
      success: false,
      error: null,
      message: '',
      performance: '',
      recordId: null,
      transcription: ''
    });
    setAudioBlob(null); // Reset audio blob
    setAudioURL(''); // Reset audio URL
    setAudioInputDetected(false); // Reset phát hiện âm thanh
    revokeBatchURL(); // Giải phóng URL batch

    batchChunksRef.current = []; // Reset chunks
    const sessionId = newSessionId(); // Tạo session ID mới
    batchSessionIdRef.current = sessionId; // Lưu session ID
    lastCompletedBatchSessionIdRef.current = null; // Reset session hoàn thành

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Lấy media stream
      batchStreamRef.current = stream; // Lưu stream

      // Khởi động monitor âm lượng
      startAudioMonitor(sessionId, () => { // Bắt đầu monitor với callback
        setAudioInputDetected(true); // Đặt đã phát hiện âm thanh
      });

      // Chọn MIME type
      let mimeType = 'audio/webm;codecs=opus'; // MIME type ưu tiên
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm'; // Fallback
      if (!MediaRecorder.isTypeSupported(mimeType)) { // Nếu không hỗ trợ
        throw new Error('瀏覽器不支援錄音格式'); // Ném lỗi không hỗ trợ
      }

      const recorder = new MediaRecorder(stream, { mimeType }); // Tạo MediaRecorder
      batchRecorderRef.current = recorder; // Lưu recorder

      recorder.ondataavailable = (e) => { // Khi có dữ liệu
        if (batchSessionIdRef.current !== sessionId) return; // Kiểm tra session ID
        if (e.data && e.data.size > 0) { // Nếu có dữ liệu
          batchChunksRef.current.push(e.data); // Thêm vào chunks
        }
      };

      recorder.onstop = () => { // Khi dừng ghi âm
        if (batchSessionIdRef.current !== sessionId) { // Kiểm tra session ID
          cleanupBatchStream(); // Dọn dẹp stream
          return;
        }
        cleanupAudioMonitor(); // Dọn dẹp monitor

        // Nếu người dùng dừng rất nhanh, một số trình duyệt sẽ xuất chunk cuối khi stop
        if (recorder.state !== 'inactive') { // Nếu recorder chưa inactive
          try { recorder.requestData(); } catch(_) {} // Yêu cầu dữ liệu cuối
        }

        if (batchChunksRef.current.length === 0) { // Nếu không có chunk nào
          cleanupBatchStream(); // Dọn dẹp stream
          alert('沒有錄到任何聲音（可能錄得太短）'); // Thông báo không có âm thanh
          return;
        }

        const blob = new Blob(batchChunksRef.current, { type: mimeType }); // Tạo blob từ chunks
        revokeBatchURL(); // Giải phóng URL cũ
        const url = URL.createObjectURL(blob); // Tạo URL mới
        batchObjectURLRef.current = url; // Lưu URL
        setAudioBlob(blob); // Đặt audio blob
        setAudioURL(url); // Đặt audio URL
        lastCompletedBatchSessionIdRef.current = sessionId; // Lưu session hoàn thành

        cleanupBatchStream(); // Dọn dẹp stream
      };

      // Không sử dụng timeslice, đảm bảo ghi âm ngắn cũng có dữ liệu
      recorder.start(); // Bắt đầu ghi âm
      setIsRecording(true); // Đặt trạng thái đang ghi âm
    } catch (err) {
      cleanupAudioMonitor(); // Dọn dẹp monitor
      cleanupBatchStream(); // Dọn dẹp stream
      alert('錄音失敗: ' + err.message); // Thông báo lỗi
      setIsRecording(false); // Đặt không ghi âm
    }
  }, [isRecording, isStreamingRecording, cleanupAudioMonitor]);

  // ====== Ghi âm một lần: Dừng ======
  const stopRecording = useCallback(() => { // Dừng ghi âm một lần
    if (!isRecording) return; // Nếu không đang ghi âm thì return
    if (batchRecorderRef.current && batchRecorderRef.current.state === 'recording') { // Nếu recorder đang ghi âm
      try { batchRecorderRef.current.stop(); } catch(_) {} // Dừng recorder
    }
    setIsRecording(false); // Đặt không ghi âm
  }, [isRecording]);

  // ====== Ghi âm một lần: Xóa ======
  const clearRecording = useCallback(() => { // Xóa ghi âm một lần
    revokeBatchURL(); // Giải phóng URL batch
    setAudioBlob(null); // Reset audio blob
    setAudioURL(''); // Reset audio URL
    setAudioInputDetected(false); // Reset phát hiện âm thanh
    batchChunksRef.current = []; // Reset chunks
    lastCompletedBatchSessionIdRef.current = null; // Reset session hoàn thành
    setBatchUploadStatus({ // Reset trạng thái tải lên
      isUploading: false,
      success: false,
      error: null,
      message: '',
      performance: '',
      recordId: null,
      transcription: ''
    });
  }, []);

  // ====== Ghi âm một lần: Tải lên ======
  const uploadRecordingBatch = useCallback(async () => { // Tải lên ghi âm batch
    if (!audioBlob || !lastCompletedBatchSessionIdRef.current) { // Nếu không có blob hoặc session
      setBatchUploadStatus({ // Đặt trạng thái lỗi
        isUploading: false,
        success: false,
        error: '尚無可上傳的錄音', // Chưa có ghi âm để tải lên
        message: '尚無可上傳的錄音',
        performance: '',
        recordId: null,
        transcription: ''
      });
      return;
    }

    try {
      setBatchUploadStatus(prev => ({ // Đặt trạng thái đang tải lên
        ...prev,
        isUploading: true,
        success: false,
        error: null,
        message: '正在上傳音訊檔案...' // Đang tải lên file âm thanh
      }));

      const result = await uploadAudio(audioBlob); // Gọi service tải lên

      if (!result.success) { // Nếu tải lên thất bại
        setBatchUploadStatus({ // Đặt trạng thái thất bại
          isUploading: false,
          success: false,
          error: result.message,
          message: '音訊檔案上傳失敗: ' + result.message, // Tải lên file âm thanh thất bại
          performance: result.performance || '',
          recordId: null,
          transcription: ''
        });
        return;
      }

      let recordId = result.data?.record_id || null; // Lấy record ID
      let transcription = ''; // Khởi tạo transcription
      if (recordId) { // Nếu có record ID
        try {
          const tr = await getTranscription(recordId); // Lấy bản chuyển đổi
          if (tr.success) { // Nếu thành công
            transcription = tr.transcription; // Lưu transcription
          }
        } catch (e) {
          console.warn('取得轉錄失敗:', e); // Cảnh báo lấy transcription thất bại
        }
      }

      setBatchUploadStatus({ // Đặt trạng thái thành công
        isUploading: false,
        success: true,
        error: null,
        message: '音訊檔案上傳成功', // Tải lên file âm thanh thành công
        performance: result.performance || '',
        recordId,
        transcription
      });

    } catch (e) {
      setBatchUploadStatus({ // Đặt trạng thái lỗi
        isUploading: false,
        success: false,
        error: e.message,
        message: '上傳過程發生錯誤: ' + e.message, // Quá trình tải lên gặp lỗi
        performance: '',
        recordId: null,
        transcription: ''
      });
    }
  }, [audioBlob]);

  // ====== Ghi âm streaming: Bắt đầu ======
  const startStreamingRecording = useCallback( async () => { // Bắt đầu ghi âm streaming
    if (isStreamingRecording) { // Nếu đang streaming
      console.warn('已在串流錄音中'); // Cảnh báo đã trong streaming
      return;
    }
    if (isRecording) { // Nếu đang ghi âm một lần
      alert('目前正處於一次性錄音中，請先停止再開始串流錄音。'); // Thông báo đang ghi âm một lần
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) { // Nếu không hỗ trợ getUserMedia
      alert('您的瀏覽器不支援錄音功能。'); // Thông báo không hỗ trợ
      return;
    }

    // Reset UI / trạng thái
    setStreamingStatus({ // Reset trạng thái streaming
      isActive: false,
      sessionId: null,
      error: null,
      message: '啟動串流會話中...', // Đang khởi động phiên streaming
      recordId: null,
      transcription: '',
      performance: ''
    });
    setStreamingAudioBlob(null); // Reset streaming blob
    setStreamingAudioURL(''); // Reset streaming URL
    setAudioInputDetected(false); // Reset phát hiện âm thanh
    revokeStreamingURL(); // Giải phóng streaming URL
    streamingChunksRef.current = []; // Reset streaming chunks
    streamingStoppingRef.current = false; // Reset trạng thái đang dừng

    const localSessionId = newSessionId(); // Tạo local session ID
    streamingLocalSessionIdRef.current = localSessionId; // Lưu local session ID
    streamingServerSessionIdRef.current = null; // Reset server session ID

    try {
      // Khởi động phiên streaming backend
      const sessionResult = await startStreamingSession(); // Gọi service bắt đầu phiên
      if (!sessionResult.success) { // Nếu thất bại
        throw new Error(sessionResult.message || '無法啟動串流會話'); // Không thể khởi động phiên streaming
      }
      const serverId = sessionResult.sessionId; // Lấy server ID
      streamingServerSessionIdRef.current = serverId; // Lưu server ID

      setStreamingStatus(prev => ({ // Cập nhật trạng thái
        ...prev,
        isActive: true,
        sessionId: serverId,
        message: '串流會話已啟動，取得麥克風...' // Phiên streaming đã khởi động, đang lấy microphone
      }));

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Lấy media stream
      streamingStreamRef.current = stream; // Lưu stream

      // Khởi động monitor âm lượng
      startAudioMonitor(localSessionId, () => { // Bắt đầu monitor
        setAudioInputDetected(true); // Đặt đã phát hiện âm thanh
      });

      // MIME type
      let mimeType = 'audio/webm;codecs=opus'; // MIME type ưu tiên
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'audio/webm'; // Fallback
      if (!MediaRecorder.isTypeSupported(mimeType)) { // Nếu không hỗ trợ
        throw new Error('瀏覽器不支援音訊格式'); // Trình duyệt không hỗ trợ định dạng âm thanh
      }

      const recorder = new MediaRecorder(stream, { mimeType }); // Tạo MediaRecorder
      streamingRecorderRef.current = recorder; // Lưu recorder

      recorder.ondataavailable = async (e) => { // Khi có dữ liệu
        if (streamingLocalSessionIdRef.current !== localSessionId) return; // Kiểm tra local session ID
        if (e.data && e.data.size > 0) { // Nếu có dữ liệu
          streamingChunksRef.current.push(e.data); // Thêm vào chunks
          if (streamingServerSessionIdRef.current && !streamingStoppingRef.current) { // Nếu có server session và không đang dừng
            try {
              const up = await uploadStreamChunk(e.data, streamingServerSessionIdRef.current); // Tải lên chunk
              if (!up.success) { // Nếu thất bại
                console.warn('串流區塊上傳失敗:', up.message); // Cảnh báo tải lên chunk thất bại
              }
            } catch (err) {
              console.error('串流區塊上傳錯誤:', err); // Lỗi tải lên chunk streaming
            }
          }
        }
      };

      recorder.onstop = async () => { // Khi dừng recorder
        if (streamingLocalSessionIdRef.current !== localSessionId) { // Kiểm tra local session ID
          cleanupStreamingStream(); // Dọn dẹp streaming stream
          return;
        }
        cleanupAudioMonitor(); // Dọn dẹp monitor

        // Tạo preview local
        if (streamingChunksRef.current.length > 0) { // Nếu có chunks
          const blob = new Blob(streamingChunksRef.current, { type: mimeType }); // Tạo blob
          revokeStreamingURL(); // Giải phóng URL cũ
          const url = URL.createObjectURL(blob); // Tạo URL mới
          streamingObjectURLRef.current = url; // Lưu URL
          setStreamingAudioBlob(blob); // Đặt streaming blob
          setStreamingAudioURL(url); // Đặt streaming URL
        }

        const sid = streamingServerSessionIdRef.current; // Lấy server session ID
        if (!sid) { // Nếu không có server session ID
          setStreamingStatus(prev => ({ // Đặt trạng thái lỗi
            ...prev,
            isActive: false,
            error: '無有效串流會話', // Không có phiên streaming hợp lệ
            message: '串流錄音失敗：無有效會話' // Streaming thất bại: không có phiên hợp lệ
          }));
          cleanupStreamingStream(); // Dọn dẹp stream
          return;
        }

        try {
          setStreamingStatus(prev => ({ ...prev, message: '結束串流會話中...' })); // Đang kết thúc phiên streaming
          const stopRes = await stopStreamingSession(sid); // Gọi service dừng phiên
          if (!stopRes.success) { // Nếu thất bại
            throw new Error(stopRes.message || '停止串流會話失敗'); // Dừng phiên streaming thất bại
          }
          const recordId = stopRes.recordId; // Lấy record ID
          let transcription = ''; // Khởi tạo transcription
          try {
            const tr = await getTranscription(recordId); // Lấy transcription
            if (tr.success) transcription = tr.transcription; // Lưu transcription nếu thành công
          } catch (e) {
            console.warn('取得串流轉錄失敗:', e); // Cảnh báo lấy transcription streaming thất bại
          }

          setStreamingStatus({ // Đặt trạng thái hoàn thành
            isActive: false,
            sessionId: null,
            error: null,
            message: '串流錄音完成', // Streaming hoàn thành
            recordId,
            transcription,
            performance: stopRes.performance || ''
          });
        } catch (err) {
          setStreamingStatus(prev => ({ // Đặt trạng thái lỗi
            ...prev,
            isActive: false,
            sessionId: null,
            error: err.message,
            message: '串流錄音處理失敗: ' + err.message, // Xử lý streaming thất bại
            recordId: null,
            transcription: '',
            performance: ''
          }));
        } finally {
          cleanupStreamingStream(); // Dọn dẹp stream
        }
      };

      recorder.start(STREAM_TIMESLICE); // Bắt đầu recorder với timeslice
      setIsStreamingRecording(true); // Đặt trạng thái đang streaming
      setStreamingStatus(prev => ({ ...prev, message: '串流錄音中...' })); // Đang streaming
    } catch (err) {
      cleanupAudioMonitor(); // Dọn dẹp monitor
      cleanupStreamingStream(); // Dọn dẹp stream
      setStreamingStatus({ // Đặt trạng thái lỗi
        isActive: false,
        sessionId: null,
        error: err.message,
        message: '串流錄音啟動失敗: ' + err.message, // Khởi động streaming thất bại
        recordId: null,
        transcription: '',
        performance: ''
      });
      setIsStreamingRecording(false); // Đặt không streaming
    }
  }, [isRecording, isStreamingRecording, cleanupAudioMonitor]);

  // ====== Ghi âm streaming: Dừng ======
  const stopStreamingRecording = useCallback(() => { // Dừng ghi âm streaming
    if (!isStreamingRecording) return; // Nếu không đang streaming thì return
    streamingStoppingRef.current = true; // Đặt trạng thái đang dừng
    if (streamingRecorderRef.current && streamingRecorderRef.current.state === 'recording') { // Nếu recorder đang ghi âm
      try { streamingRecorderRef.current.stop(); } catch(_) {} // Dừng recorder
    }
    setIsStreamingRecording(false); // Đặt không streaming
  }, [isStreamingRecording]);

  // ====== Ghi âm streaming: Xóa preview đã hoàn thành ======
  const clearStreamingRecording = useCallback(() => { // Xóa ghi âm streaming đã hoàn thành
    revokeStreamingURL(); // Giải phóng streaming URL
    setStreamingAudioBlob(null); // Reset streaming audio blob
    setStreamingAudioURL(''); // Reset streaming audio URL
    setStreamingStatus(prev => ({ // Cập nhật trạng thái streaming
      ...prev,
      recordId: null, // Reset record ID
      transcription: '', // Reset transcription
      performance: '', // Reset performance
      message: '' // Reset message
    }));
  }, []);

  // ====== (Tùy chọn) Hủy ghi âm streaming đang tiến hành (không gọi backend dừng) ======
  const cancelStreamingRecording = useCallback(() => { // Hủy ghi âm streaming
    if (isStreamingRecording && streamingRecorderRef.current) { // Nếu đang streaming và có recorder
      try { streamingRecorderRef.current.stop(); } catch(_) {} // Dừng recorder
    }
    streamingLocalSessionIdRef.current = null; // Reset local session ID
    streamingServerSessionIdRef.current = null; // Reset server session ID
    streamingChunksRef.current = []; // Reset streaming chunks
    streamingStoppingRef.current = false; // Reset trạng thái đang dừng
    setIsStreamingRecording(false); // Đặt không streaming
    cleanupAudioMonitor(); // Dọn dẹp audio monitor
    cleanupStreamingStream(); // Dọn dẹp streaming stream
    revokeStreamingURL(); // Giải phóng streaming URL
    setStreamingAudioBlob(null); // Reset streaming audio blob
    setStreamingAudioURL(''); // Reset streaming audio URL
    setStreamingStatus({ // Reset trạng thái streaming
      isActive: false, // Không hoạt động
      sessionId: null, // Không có session ID
      error: null, // Không có lỗi
      message: '已取消串流錄音', // Đã hủy ghi âm streaming
      recordId: null, // Không có record ID
      transcription: '', // Không có transcription
      performance: '' // Không có performance
    });
  }, [isStreamingRecording, cleanupAudioMonitor]);

  // ====== Export các function và state ======
  return {
    // Ghi âm một lần (Batch)
    isRecording, // Trạng thái đang ghi âm
    audioBlob, // Blob dữ liệu audio
    audioURL, // URL để phát audio
    audioInputDetected, // Đã phát hiện âm thanh đầu vào
    startRecording, // Function bắt đầu ghi âm
    stopRecording, // Function dừng ghi âm
    clearRecording, // Function xóa ghi âm
    uploadRecordingBatch, // Function tải lên ghi âm batch
    batchUploadStatus, // Trạng thái tải lên batch

    // Ghi âm streaming
    isStreamingRecording, // Trạng thái đang streaming
    streamingAudioBlob, // Blob audio streaming
    streamingAudioURL, // URL audio streaming
    streamingStatus, // Trạng thái streaming
    startStreamingRecording, // Function bắt đầu streaming
    stopStreamingRecording, // Function dừng streaming
    clearStreamingRecording, // Function xóa streaming đã hoàn thành
    cancelStreamingRecording, // Function hủy streaming đang tiến hành
  };
};

export default useAudioRecorder; // Export hook làm default
