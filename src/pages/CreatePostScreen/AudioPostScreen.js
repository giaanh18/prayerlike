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

function AudioPostScreen({ onClose = () => {}, onUploadSuccess = () => {} }) {
  const navigate = useNavigate();
  const [recordingState, setRecordingState] = useState('idle');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [activeButton, setActiveButton] = useState(null);

  // 頁籤狀態管理
  const [activeTab, setActiveTab] = useState('Add');

  // Refs 用於管理錄音資源
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // ✅ [衝突迴避] 確保組件卸載時，絕對釋放麥克風權限
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  // ✅ 資源清理函數：這是解決衝突的關鍵
  // 在每次開始錄音前與結束後，都確保完全切斷與硬體的連結
  const cleanupResources = () => {
    // 1. 停止波形偵測動畫
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // 2. 停止 MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // 3. [核心] 停止所有音軌 (釋放麥克風給 OS/Flutter)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        // console.log("🛑 Track stopped (Mic released)"); 
      });
      streamRef.current = null;
    }

    // 4. 關閉 AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.error("Close context error", e));
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    setActiveButton('start');

    // ✅ [衝突迴避] 開始前先強制清理，避免「前一次 Session 未釋放」導致的 Occupied 錯誤
    cleanupResources();

    try {
      console.log("🎤 請求麥克風權限...");

      // ✅ [相容性優化] 在 WebView 中，過於複雜的 constraints (如 noiseSuppression) 有時會導致失敗
      // 先嘗試簡單的 audio: true，讓 Flutter 容易授權
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true 
      });
      
      console.log("✅ 麥克風授權成功");
      streamRef.current = stream;

      // --- 初始化 AudioContext (用於波形顯示) ---
      // 必須在使用者互動(Click)內建立，避免 WebView 自動播放策略阻擋
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // 波形偵測迴圈
      const checkAudioLevel = () => {
        if (analyser) {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setHasAudioInput(average > 10);
          animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
        }
      };
      
      // --- 初始化 MediaRecorder (用於錄製) ---
      // 優先使用 webm (Android/Chrome)，若不支援則讓瀏覽器自動選擇
      let options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = undefined; // Fallback to default
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // 錄音結束，組合 Blob
        // 注意：這裡若 options 為 undefined，type 可能需要動態判斷，但通常 'audio/webm' 或空字串即可
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
        setRecordingState('preview');
        setActiveButton(null);
        
        // ✅ [衝突迴避] 錄音完成進入預覽時，立即釋放麥克風
        // 這樣若使用者點擊播放錄音，不會因為麥克風還開著而產生回授或衝突
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setHasAudioInput(false);
      checkAudioLevel(); // 啟動波形

    } catch (error) {
      console.error('❌ 麥克風存取失敗:', error);
      
      // 錯誤處理：給予清楚的提示
      let errorMessage = '無法存取麥克風';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = '請允許 App 存取麥克風權限';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '找不到麥克風裝置';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '麥克風被其他應用程式佔用中'; // 這裡抓出衝突
      }

      alert(`${errorMessage}\n(錯誤代碼: ${error.name})`);
      setActiveButton(null);
      cleanupResources();
    }
  };

  const stopRecording = () => {
    setActiveButton('stop');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
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
    if (!audioBlob) return;

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
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
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