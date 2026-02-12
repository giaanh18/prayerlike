// ./src/pages/CreatePostScreen/AudioPostScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CircleButton from '../../components/CircleButton/CircleButton';
import './AudioPostScreen.css';

// Icon imports
import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

// ================= 環境檢測 =================
const isInApp = () =>
  typeof window !== "undefined" &&
  typeof window.flutter_inappwebview !== "undefined";

function AudioPostScreen({ onClose = () => {}, onUploadSuccess = () => {} }) {
  const navigate = useNavigate();
  // 🔴 除錯用狀態：將 Log 顯示在螢幕上
  const [debugLogs, setDebugLogs] = useState([]);
  const addLog = (msg) => {
    console.log(msg);
    setDebugLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()} ${msg}`]);
  };

  const [recordingState, setRecordingState] = useState('idle');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [activeButton, setActiveButton] = useState(null);

  // 頁籤狀態管理
  const [activeTab, setActiveTab] = useState('Add');

  // App 環境狀態
  const [isAppEnvironment, setIsAppEnvironment] = useState(false);
  const [flutterRecordId, setFlutterRecordId] = useState('');

  // Refs（僅保留需要的）
  const audioChunksRef = useRef([]);
  const abortPollingRef = useRef(false);

  // 環境檢測
  useEffect(() => {
    const inApp = isInApp();
    setIsAppEnvironment(inApp);
    if (inApp) {
      addLog('✅ 偵測到 APP 環境');
    } else {
      addLog('🌐 目前是 WEB 環境');
    }
  }, []);

  // 設置接收 Flutter recordId 的回調
  useEffect(() => {
    window.receiveAudioId = (id) => {
      const recordId = String(id ?? "");
      setFlutterRecordId(recordId);
      addLog(`📌 從 Flutter 收到 recordId: ${recordId}`);
      
      if (recordId) {
        handleFlutterRecordId(recordId);
      }
    };
    
    return () => {
      delete window.receiveAudioId;
    };
  }, []);

  // 確保組件卸載時，釋放 URL 資源（不涉及任何麥克風權限）
  useEffect(() => {
    return () => {
      cleanupResources();
      abortPollingRef.current = true;
    };
  }, []);

  // 資源清理函數：不再操作任何麥克風/錄音硬體，只清掉前端 URL 資源
  const cleanupResources = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };

  // 接收 App 回傳的錄音結果（Base64 或 URL）
  useEffect(() => {
    const onMessage = (event) => {
      let data = event?.data;
      addLog(`📩 收到 msg. Type: ${typeof data}`);

      // 1. 嘗試解析字串格式的 JSON (解決部分 App 傳回字串導致無反應的問題)
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          addLog('✅ JSON 解析成功');
        } catch (e) {
          addLog(`⚠️ JSON 解析失敗: ${e.message.slice(0, 20)}`);
          // 不是 JSON 字串，忽略，繼續往下走 (有些 App 可能真的傳字串且不是 JSON)
        }
      }

      if (!data || typeof data !== 'object') {
        addLog('⚠️ 資料無效/非物件');
        return;
      }
      
      if (data.type) addLog(`🔍 Type: ${data.type}`);

      // ✅ App 回傳錄音完成
      if (data.type === 'AUDIO_RECORDING_READY') {
        try {
          const payload = data.payload || {};

          // 1) App 直接給檔案 URL（例如本機檔案或 App 自己的 blob url）
          if (payload.audioUrl) {
            setAudioBlob(null);
            setAudioURL(payload.audioUrl);
            setRecordingState('preview');
            setActiveButton(null);
            return;
          }

          // 2) App 給 base64 + mimeType（Web 端轉成 Blob）
          const base64 = payload.base64;
          const mimeType = payload.mimeType || 'audio/webm';

          if (!base64) throw new Error('Missing base64 audio payload');

          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });

          setAudioBlob(blob);
          setAudioURL(URL.createObjectURL(blob));
          setRecordingState('preview');
          setActiveButton(null);
        } catch (e) {
          console.error('❌ 解析 App 錄音回傳失敗:', e);
          setRecordingState('error');
          setUploadMessage(`處理失敗: ${e.message}`);
          setActiveButton(null);
        }
      }

      // ✅ App 回傳錄音失敗
      if (data.type === 'AUDIO_RECORDING_ERROR') {
        const message = data.payload?.message || '錄音失敗';
        console.error('❌ App 錄音錯誤:', message);
        setRecordingState('error');
        setUploadMessage(`處理失敗: ${message}`);
        setActiveButton(null);
      }

      // （可選）App 回傳即時音量偵測
      if (data.type === 'AUDIO_INPUT_LEVEL') {
        const level = Number(data.payload?.level ?? 0);
        setHasAudioInput(level > 0);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [audioURL]);

  // 處理 Flutter 返回的 recordId
  const handleFlutterRecordId = async (receivedRecordId) => {
    addLog('🔄 開始處理 Flutter recordId');
    setRecordingState('uploading');
    setUploadMessage('已收到錄音 ID，等待轉錄結果...');
    abortPollingRef.current = false;

    try {
      const transcriptData = await pollForTranscript(receivedRecordId);
      addLog('✅ 轉錄完成');
      
      const finalTranscript = transcriptData.transcript || '';
      const finalAudioUrl = transcriptData.audio_url || '';

      setRecordingState('success');
      setUploadMessage('轉錄成功！');

      cleanupResources();

      const navigationState = { 
        transcript: finalTranscript,
        initialContent: finalTranscript, 
        audioUrl: finalAudioUrl,
        recordId: receivedRecordId,
        fromAudio: true
      };

      navigate('/create-post/text', { state: navigationState });

      if (onUploadSuccess) onUploadSuccess(transcriptData);
      if (onClose) onClose();

    } catch (error) {
      console.error('❌ 處理 Flutter recordId 失敗:', error);
      setRecordingState('error');
      setUploadMessage(`處理失敗: ${error.message}`);
      setActiveButton(null);
    }
  };

  const startRecording = async () => {
    setActiveButton('start');

    // 開始前清理舊 URL（不涉及任何權限）
    cleanupResources();

    try {
      // ✅ 檢查是否在 App 環境
      if (isAppEnvironment) {
        addLog('📱 App 環境：嘗試呼叫 Flutter showOverlay');
        
        if (typeof window.flutter_inappwebview?.callHandler === "function") {
          try {
            const res = await window.flutter_inappwebview.callHandler("showOverlay");
            addLog(`✅ showOverlay 成功: ${JSON.stringify(res)}`);
            setRecordingState('recording');
            setUploadMessage('等待 Flutter 返回錄音結果...');
            return;
          } catch (e) {
            addLog(`⚠️ showOverlay 失敗: ${e.message}，改用 Web 錄音`);
            console.error('呼叫 showOverlay 失敗', e);
            // 如果 Flutter 調用失敗，繼續使用 Web 錄音
          }
        } else {
          addLog('⚠️ 無 callHandler，改用 Web 錄音');
        }
      }

      // Web 環境或 Flutter 調用失敗時，使用原有的錄音邏輯
      addLog('🌐 使用 Web 錄音');
      window.AppBridge?.postMessage?.(JSON.stringify({ type: 'START_RECORDING' }));

      // UI 狀態切換
      setRecordingState('recording');
      setHasAudioInput(false);

    } catch (error) {
      console.error('❌ 無法開始錄音:', error);
      addLog(`❌ 錄音錯誤: ${error.message}`);
      setRecordingState('error');
      setUploadMessage(`處理失敗: ${error.message}`);
      setActiveButton(null);
    }
  };

  const stopRecording = () => {
    setActiveButton('stop');

    // 2. 立即給予 UI 回饋，避免等待 App 回傳時看起來像當機
    setRecordingState('uploading'); 
    setUploadMessage('Processing audio...');

    try {
      // ✅ 通知 App 停止錄音，並由 App 回傳 AUDIO_RECORDING_READY
      window.AppBridge?.postMessage?.(JSON.stringify({ type: 'STOP_RECORDING' }));
      addLog('📤 已發送 STOP_RECORDING');
    } catch (error) {
      console.error('❌ 無法呼叫 App 停止錄音:', error);
      setRecordingState('error');
      setUploadMessage(`處理失敗: ${error.message}`);
      setActiveButton(null);
    }
  };

  // 輪詢轉錄結果 (保持原有邏輯)
  const pollForTranscript = async (recordId, maxRetries = 10, interval = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`⏳ [Polling] 第 ${i + 1} 次檢查轉錄狀態...`);
      
      const response = await fetch(`https://xiaohua.54ucl.com:8011/recording/api/v1/transcript/${recordId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`檢查狀態失敗: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 收到回應:", data);

      if (data.status === 'completed') {
        return data; 
      }
      
      if (data.status === 'failed') {
        throw new Error('伺服器回傳轉錄失敗');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('等待轉錄逾時');
  };

  const handleConfirm = async () => {
    setActiveButton('confirm');
    if (!audioBlob && !audioURL) return;

    setRecordingState('uploading');
    setUploadMessage('上傳音訊中...');
    
    try {
      console.log("🚀 [Step 1] 開始上傳音檔...");
      const formData = new FormData();
      
      // 確保檔名有副檔名
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('file', audioBlob, `recording.${ext}`);

      const uploadResponse = await fetch('https://xiaohua.54ucl.com:8011/recording/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`音訊上傳失敗 Status: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const recordId = uploadData.record_id;
      if (!recordId) throw new Error('未收到 Record ID');

      console.log("✅ [Step 1] 上傳成功，Record ID:", recordId);

      setUploadMessage('Transcribing text (please wait)...');
      
      const transcriptData = await pollForTranscript(recordId);

      console.log("✅ [Step 2] 轉錄完成，內容:", transcriptData);
      
      const finalTranscript = transcriptData.transcript || '';
      const finalAudioUrl = transcriptData.audio_url || '';

      setRecordingState('success');
      setUploadMessage('轉錄成功！');

      console.log("🚀 [Step 3] 跳轉至 TextPostScreen，攜帶文字:", finalTranscript);
      
      cleanupResources(); 

      const navigationState = { 
        transcript: finalTranscript,
        initialContent: finalTranscript, 
        audioUrl: finalAudioUrl,
        recordId: recordId,
        fromAudio: true
      };

      navigate('/create-post/text', { state: navigationState });

      if (onUploadSuccess) onUploadSuccess(transcriptData);
      if (onClose) onClose();

    } catch (error) {
      console.error('❌ 錯誤:', error);
      setRecordingState('error');
      setUploadMessage(`處理失敗: ${error.message}`);
      setActiveButton(null);
    }
  };

  const handleCancel = () => {
    setActiveButton('cancel');
    cleanupResources();
    navigate('/create-post');
    if (onClose) onClose();
  };

  const handleReRecord = () => {
    console.log("🔄 重置錄音狀態");
    setActiveButton(null);
    
    // 清理舊資源
    cleanupResources();
    
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingState('idle');
    setHasAudioInput(false);
    
    audioChunksRef.current = [];
  };

  // Navigation Handlers
  const handleHome = () => { setActiveTab('Home'); navigate('/main'); };
  const handleSearch = () => { setActiveTab('Search'); navigate('/tribe'); };
  const handleCreatePost = () => { setActiveTab('Add'); navigate('/create-post'); };
  const handleProfile = () => { setActiveTab('Profile'); navigate('/profile'); };
  const handleNova = () => { setActiveTab('Nova'); navigate('/notifications'); };

  const renderButtons = () => {
    if (recordingState === 'idle') {
      return (
        <>
          <button 
            className={`btn-start-recording ${activeButton === 'start' ? 'active' : ''}`}
            onClick={startRecording}
          >
            Start Recording
          </button>
          <button 
            className={`btn-cancel ${activeButton === 'cancel' ? 'active' : ''}`}
            onClick={handleCancel}
          >
            	Cancel
          </button>
        </>
      );
    }

    if (recordingState === 'recording') {
      return (
        <>
          <button 
            className={`btn-stop-recording ${activeButton === 'stop' ? 'active' : ''}`}
            onClick={stopRecording}
          >
            Stop Recording
          </button>
          <button 
            className={`btn-cancel ${activeButton === 'cancel' ? 'active' : ''}`}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </>
      );
    }

    if (recordingState === 'preview') {
      return (
        <>
          <button 
            className={`btn-confirm ${activeButton === 'confirm' ? 'active' : ''}`}
            onClick={handleConfirm}
          >
            Confirm & Submit
          </button>
          <button 
            className={`btn-cancel ${activeButton === 'cancel' ? 'active' : ''}`}
            onClick={handleReRecord}
          >
            Re-record
          </button>
        </>
      );
    }

    return null;
  };

  const renderContent = () => {
    if (recordingState === 'idle') {
      return (
        <div className="recording-status">
          <div className="mic-icon">🎤</div>
          <div className="ready-text">Ready to Record</div>
          <div className="hint-text">Click "Start Recording" to begin speaking</div>
        </div>
      );
    }

    if (recordingState === 'recording') {
      return (
        <div className="recording-status">
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-text">Recording...</span>
          </div>
          <div className={`audio-detection ${hasAudioInput ? 'detected' : 'waiting'}`}>
            {hasAudioInput ? '✓ 偵測到聲音' : 'Waiting for audio input...'}
          </div>
          <div className="recording-wave">
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
          </div>
        </div>
      );
    }

    if (recordingState === 'preview') {
      return (
        <div className="audio-preview">
          <div className="preview-title">Preview Recording</div>
          {audioURL && (
            <>
              <audio controls src={audioURL} />
              <div className="preview-hint">Click "Confirm & Submit" if everything is correct</div>
            </>
          )}
        </div>
      );
    }

    if (recordingState === 'uploading') {
      return (
        <div className="upload-status">
          <div className="spinner"></div>
          <div>{uploadMessage}</div>
        </div>
      );
    }

    if (recordingState === 'success') {
      return (
        <div className="result-message success">
          {uploadMessage}
        </div>
      );
    }

    if (recordingState === 'error') {
      return (
        <div className="result-message error">
          {uploadMessage}
        </div>
      );
    }
  };

  return (
    <div className="audio-post-screen">
      
      <button 
        className="back-button" 
        onClick={() => navigate('/create-post')} 
        aria-label="返回上一頁"
      >
        ←
      </button>

      <div className="audio-post-content">
        <div className="content-card">
          <div className="card-header">
            Voice Post
          </div>
          
          <div className="card-body">
            {renderContent()}
          </div>

          <div className="card-buttons">
            {renderButtons()}
          </div>
          
          {/* 🔴 除錯視窗：顯示最新的 Logs */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.8)', color: '#0f0', fontSize: '10px',
            padding: '5px', maxHeight: '150px', overflowY: 'auto', zIndex: 9999
          }}>
            <div style={{fontWeight:'bold', borderBottom:'1px solid #333'}}>DEBUG LOGS:</div>
            {debugLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>

        </div>
      </div>

      <div className="bottom-navigation">
        <CircleButton 
          provider="Home" 
          iconSrc={Home} 
          onClick={handleHome} 
          isActive={activeTab === 'Home'} 
          size="medium" 
          ariaLabel="首頁" 
        />
        <CircleButton 
          provider="Search" 
          iconSrc={Search} 
          onClick={handleSearch} 
          isActive={activeTab === 'Search'} 
          size="medium" 
          ariaLabel="搜尋" 
        />
        <CircleButton 
          provider="Add" 
          iconSrc={Add} 
          onClick={handleCreatePost} 
          isActive={activeTab === 'Add'} 
          size="medium" 
          ariaLabel="新增貼文" 
        />
        <CircleButton 
          provider="Profile" 
          iconSrc={Profile} 
          onClick={handleProfile} 
          isActive={activeTab === 'Profile'} 
          size="medium" 
          ariaLabel="個人資料" 
        />
        <CircleButton 
          provider="Nova" 
          iconSrc={Nova} 
          onClick={handleNova} 
          isActive={activeTab === 'Nova'} 
          size="medium" 
          ariaLabel="nova小天使" 
        />
      </div>
    </div>
  );
}

export default AudioPostScreen;
