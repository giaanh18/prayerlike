// import React, { useState, useEffect, useRef } from 'react';
// import './VoiceRecordButton.css';

// const VoiceRecordButton = ({ onTranscriptComplete, mediaStream }) => {
//   const [isRecording, setIsRecording] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [hasAudioInput, setHasAudioInput] = useState(false);
  
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);
//   const audioContextRef = useRef(null);
//   const analyserRef = useRef(null);

//   const cleanupResources = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//       mediaRecorderRef.current.stop();
//     }
//     if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
//       audioContextRef.current.close();
//     }
//   };

//   useEffect(() => {
//     return () => {
//       cleanupResources();
//     };
//   }, []);

//   const pollForTranscript = async (recordId, maxRetries = 10, interval = 2000) => {
//     for (let i = 0; i < maxRetries; i++) {
//       console.log(`⏳ [Polling] Lần kiểm tra thứ ${i + 1}...`);
      
//       const response = await fetch(`https://xiaohua.54ucl.com:8011/recording/api/v1/transcript/${recordId}`, {
//         method: 'GET'
//       });

//       if (!response.ok) {
//         throw new Error(`Kiểm tra trạng thái thất bại: ${response.status}`);
//       }

//       const data = await response.json();
//       console.log("📥 Nhận được response:", data);

//       if (data.status === 'completed') {
//         return data;
//       }
      
//       if (data.status === 'failed') {
//         throw new Error('Server trả về chuyển đổi thất bại');
//       }

//       await new Promise(resolve => setTimeout(resolve, interval));
//     }
//     throw new Error('Timeout chờ chuyển đổi');
//   };

//   const startRecording = async () => {
//     try {
//       // ✅ Dùng mediaStream từ bên ngoài, không yêu cầu quyền nữa
//       if (!mediaStream) {
//         alert('❌ Không thể lấy quyền microphone, vui lòng kiểm tra quyền');
//         return;
//       }

//       const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//       const analyser = audioContext.createAnalyser();
//       const microphone = audioContext.createMediaStreamSource(mediaStream);
      
//       analyser.fftSize = 256;
//       microphone.connect(analyser);
      
//       audioContextRef.current = audioContext;
//       analyserRef.current = analyser;

//       const bufferLength = analyser.frequencyBinCount;
//       const dataArray = new Uint8Array(bufferLength);
      
//       const checkAudioLevel = () => {
//         if (isRecording) {
//           analyser.getByteFrequencyData(dataArray);
//           const average = dataArray.reduce((a, b) => a + b) / bufferLength;
//           setHasAudioInput(average > 10);
//           requestAnimationFrame(checkAudioLevel);
//         }
//       };
//       checkAudioLevel();

//       const mediaRecorder = new MediaRecorder(mediaStream, {
//         mimeType: 'audio/webm;codecs=opus'
//       });
      
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
//         setIsProcessing(true);
        
//         try {
//           console.log("🚀 [Bước 1] Bắt đầu upload file âm thanh...");
//           const formData = new FormData();
//           formData.append('file', audioBlob, 'comment-recording.webm');

//           const uploadResponse = await fetch('https://xiaohua.54ucl.com:8011/recording/api/v1/upload', {
//             method: 'POST',
//             body: formData,
//           });

//           if (!uploadResponse.ok) {
//             throw new Error(`Upload âm thanh thất bại Status: ${uploadResponse.status}`);
//           }

//           const uploadData = await uploadResponse.json();
//           const recordId = uploadData.record_id;
//           if (!recordId) throw new Error('Không nhận được Record ID');

//           console.log("✅ [Bước 1] Upload thành công, Record ID:", recordId);

//           const transcriptData = await pollForTranscript(recordId);

//           console.log("✅ [Bước 2] Chuyển đổi hoàn tất, nội dung:", transcriptData);
          
//           const finalTranscript = transcriptData.transcript || '';

//           if (onTranscriptComplete) {
//             onTranscriptComplete(finalTranscript);
//           }

//         } catch (error) {
//           console.error('❌ Lỗi:', error);
//           alert(`Xử lý thất bại: ${error.message}`);
//         } finally {
//           setIsProcessing(false);
//           cleanupResources();
//         }
//       };

//       mediaRecorder.start();
//       setIsRecording(true);
//       setHasAudioInput(false);

//     } catch (error) {
//       console.error('Lỗi khi bắt đầu ghi âm:', error);
//       alert('Không thể bắt đầu ghi âm');
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//     }
//   };

//   const handleClick = () => {
//     if (isRecording) {
//       stopRecording();
//     } else {
//       startRecording();
//     }
//   };

//   return (
//     <button
//       type="button"
//       className={`voice-record-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
//       onClick={handleClick}
//       disabled={isProcessing}
//       title={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
//     >
//       {isProcessing ? (
//         <div className="voice-spinner"></div>
//       ) : isRecording ? (
//         <>
//           <svg viewBox="0 0 24 24" className="voice-icon recording-icon">
//             <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
//             <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
//           </svg>
//           {hasAudioInput && <span className="voice-indicator"></span>}
//         </>
//       ) : (
//         <svg viewBox="0 0 24 24" className="voice-icon">
//           <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" fill="currentColor"/>
//           <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="currentColor"/>
//         </svg>
//       )}
//     </button>
//   );
// };

// export default VoiceRecordButton;
import React, { useState, useEffect, useRef } from 'react';
import './VoiceRecordButton.css';

const VoiceRecordButton = ({ onTranscriptComplete, mediaStream }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  const [internalStream, setInternalStream] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const cleanupResources = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (internalStream) {
      internalStream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [internalStream]);

  const pollForTranscript = async (recordId, maxRetries = 10, interval = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`⏳ [Polling] Lần kiểm tra thứ ${i + 1}...`);
      
      const response = await fetch(`https://xiaohua.54ucl.com:8011/recording/api/v1/transcript/${recordId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Kiểm tra trạng thái thất bại: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Nhận được response:", data);

      if (data.status === 'completed') {
        return data;
      }
      
      if (data.status === 'failed') {
        throw new Error('Server trả về chuyển đổi thất bại');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout chờ chuyển đổi');
  };

  const startRecording = async () => {
    try {
      // ✅ Nếu không có mediaStream từ props, tự động xin quyền
      let streamToUse = mediaStream;
      
      if (!streamToUse) {
        console.log('⚠️ Không có mediaStream từ props, đang tự xin quyền microphone...');
        try {
          streamToUse = await navigator.mediaDevices.getUserMedia({ audio: true });
          setInternalStream(streamToUse);
          console.log('✅ Đã lấy mediaStream từ browser');
        } catch (err) {
          console.error('❌ Không thể lấy quyền microphone:', err);
          alert('❌ Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt.');
          return;
        }
      } else {
        console.log('✅ Sử dụng mediaStream từ props');
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(streamToUse);
      
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

      const mediaRecorder = new MediaRecorder(streamToUse, {
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
          console.log("🚀 [Bước 1] Bắt đầu upload file âm thanh...");
          const formData = new FormData();
          formData.append('file', audioBlob, 'comment-recording.webm');

          const uploadResponse = await fetch('https://xiaohua.54ucl.com:8011/recording/api/v1/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload âm thanh thất bại Status: ${uploadResponse.status}`);
          }

          const uploadData = await uploadResponse.json();
          const recordId = uploadData.record_id;
          if (!recordId) throw new Error('Không nhận được Record ID');

          console.log("✅ [Bước 1] Upload thành công, Record ID:", recordId);

          const transcriptData = await pollForTranscript(recordId);

          console.log("✅ [Bước 2] Chuyển đổi hoàn tất, nội dung:", transcriptData);
          
          const finalTranscript = transcriptData.transcript || '';

          if (onTranscriptComplete) {
            onTranscriptComplete(finalTranscript);
          }

        } catch (error) {
          console.error('❌ Lỗi:', error);
          alert(`Xử lý thất bại: ${error.message}`);
        } finally {
          setIsProcessing(false);
          cleanupResources();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setHasAudioInput(false);

    } catch (error) {
      console.error('Lỗi khi bắt đầu ghi âm:', error);
      alert('Không thể bắt đầu ghi âm');
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
      title={isRecording ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
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
