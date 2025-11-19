import React, { useState, useRef, useEffect } from 'react';
import './AudioPostScreen.css';

function AudioPostScreen({ onClose = () => {}, onUploadSuccess = () => {} }) {
  const [recordingState, setRecordingState] = useState('idle');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [activeButton, setActiveButton] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  // 👇 HÀM CLEANUP CHUNG
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
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
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

  const handleConfirm = async () => {
    setActiveButton('confirm');
    if (!audioBlob) return;

    setRecordingState('uploading');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('http://localhost:3000/api/posts/audio', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRecordingState('success');
        setUploadMessage('語音上傳成功！');
        
        setTimeout(() => {
          onUploadSuccess(data.post);
          cleanupResources();
          onClose();
        }, 1500);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      setRecordingState('error');
      setUploadMessage('上傳失敗，請重試');
      setActiveButton(null);
    }
  };

  // 👇 SỬA LẠI HÀM NÀY
  const handleCancel = () => {
    console.log('🔴 Nhấn nút Hủy'); // Debug log
    setActiveButton('cancel');
    cleanupResources();
    onClose(); // 👈 GỌI NGAY LẬP TỨC
  };

  const handleReRecord = () => {
    setActiveButton(null);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingState('idle');
    setHasAudioInput(false);
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
          <div>上傳中...</div>
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
    <div className="voice-overlay" onClick={(e) => {
      // 👇 SỬA LẠI ĐIỀU KIỆN CLICK OUTSIDE
      if (e.target === e.currentTarget) {
        handleCancel();
      }
    }}>
      <div className="voice-overlay-content">
        <div className="voice-overlay-header">
          語音貼文
        </div>
        
        <div className="voice-overlay-body">
          {renderContent()}
        </div>

        <div className="voice-overlay-buttons">
          {renderButtons()}
        </div>
      </div>
    </div>
  );
}

export default AudioPostScreen;
