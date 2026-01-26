import React, { useState, useEffect, useRef } from 'react';
import './VoiceRecordButton.css';

const VoiceRecordButton = ({ onTranscriptComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

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

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

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

  const startRecording = async () => {
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
        if (isRecording) {
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        setIsProcessing(true);
        
        try {
          console.log("🚀 [Step 1] 開始上傳音檔...");
          const formData = new FormData();
          formData.append('file', audioBlob, 'comment-recording.webm');

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

          const transcriptData = await pollForTranscript(recordId);

          console.log("✅ [Step 2] 轉錄完成，內容:", transcriptData);
          
          const finalTranscript = transcriptData.transcript || '';

          if (onTranscriptComplete) {
            onTranscriptComplete(finalTranscript);
          }

        } catch (error) {
          console.error('❌ 錯誤:', error);
          alert(`處理失敗: ${error.message}`);
        } finally {
          setIsProcessing(false);
          cleanupResources();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setHasAudioInput(false);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('無法存取麥克風，請確認已授予權限');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <button
      type="button"
      className={`voice-record-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
      onClick={handleClick}
      disabled={isProcessing}
      title={isRecording ? '停止錄音' : '開始錄音'}
    >
      {isProcessing ? (
        <div className="voice-spinner"></div>
      ) : isRecording ? (
        <>
          <svg viewBox="0 0 24 24" className="voice-icon recording-icon">
            <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
            <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
          </svg>
          {hasAudioInput && <span className="voice-indicator"></span>}
        </>
      ) : (
        <svg viewBox="0 0 24 24" className="voice-icon">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill="currentColor"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="currentColor"/>
        </svg>
      )}
    </button>
  );
};

export default VoiceRecordButton;
