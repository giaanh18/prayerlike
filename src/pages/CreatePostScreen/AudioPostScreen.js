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

  // ✅ 新增: 頁籤狀態管理，進入此頁面時預設 "Add" 為激活狀態
  const [activeTab, setActiveTab] = useState('Add');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const startRecording = async () => {
    setActiveButton('start');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkAudioLevel = () => {
        if (recordingState === 'recording') {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setHasAudioInput(average > 10);
          requestAnimationFrame(checkAudioLevel);
        }
      };
      checkAudioLevel();

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
        setRecordingState('preview');
        setActiveButton(null);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setHasAudioInput(false);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('無法存取麥克風，請確認已授予權限');
      setActiveButton(null);
    }
  };

  const stopRecording = () => {
    setActiveButton('stop');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  // 輪詢轉錄結果
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
      formData.append('file', audioBlob, 'recording.webm');

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

      setUploadMessage('正在轉錄文字 (請稍候)...');
      
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
    // 若是全頁面模式，跳轉回上一頁
    navigate('/create-post');
    if (onClose) onClose();
  };

  const handleReRecord = () => {
    console.log("🔄 重置錄音狀態");
    setActiveButton(null);
    
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingState('idle');
    setHasAudioInput(false);
    
    audioChunksRef.current = [];
  };

  // ✅ Navigation Handlers
  const handleHome = () => {
    setActiveTab('Home');
    navigate('/main');
  };

  const handleSearch = () => {
    setActiveTab('Search');
    navigate('/tribe');
  };

  const handleCreatePost = () => {
    setActiveTab('Add');
    navigate('/create-post');
  };

  const handleProfile = () => {
    setActiveTab('Profile');
    navigate('/profile');
  };

  const handleNova = () => {
    setActiveTab('Nova');
    navigate('/notifications');
  };

  const renderButtons = () => {
    if (recordingState === 'idle') {
      return (
        <>
          <button 
            className={`btn-start-recording ${activeButton === 'start' ? 'active' : ''}`}
            onClick={startRecording}
          >
            開始錄音
          </button>
          <button 
            className={`btn-cancel ${activeButton === 'cancel' ? 'active' : ''}`}
            onClick={handleCancel}
          >
            取消
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
            停止錄音
          </button>
          <button 
            className={`btn-cancel ${activeButton === 'cancel' ? 'active' : ''}`}
            onClick={handleCancel}
          >
            取消
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
            確認並送出
          </button>
          <button 
            className={`btn-cancel ${activeButton === 'cancel' ? 'active' : ''}`}
            onClick={handleReRecord}
          >
            重新錄製
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
          <div className="ready-text">準備開始錄音</div>
          <div className="hint-text">點擊「開始錄音」後開始說話</div>
        </div>
      );
    }

    if (recordingState === 'recording') {
      return (
        <div className="recording-status">
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-text">錄音中...</span>
          </div>
          <div className={`audio-detection ${hasAudioInput ? 'detected' : 'waiting'}`}>
            {hasAudioInput ? '✓ 偵測到聲音' : '等待聲音輸入...'}
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
          <div className="preview-title">預覽錄音</div>
          {audioURL && (
            <>
              <audio controls src={audioURL} />
              <div className="preview-hint">確認無誤後點擊「確認並送出」</div>
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
      
      {/* ✅ 左上角返回鍵 */}
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
            語音貼文
          </div>
          
          <div className="card-body">
            {renderContent()}
          </div>

          <div className="card-buttons">
            {renderButtons()}
          </div>
        </div>
      </div>

      {/* ✅ 底部導航列 */}
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