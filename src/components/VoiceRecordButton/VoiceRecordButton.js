// ./src/components/VoiceRecordButton/VoiceRecordButton.jsx

import React, { useState, useEffect, useRef } from 'react';
import './VoiceRecordButton.css';

// ================= Environment Detection =================
const isInApp = () =>
  typeof window !== "undefined" &&
  typeof window.flutter_inappwebview !== "undefined";

const VoiceRecordButton = ({ onTranscriptComplete, mediaStream }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  const [internalStream, setInternalStream] = useState(null);
  
  // App environment state
  const [isAppEnvironment, setIsAppEnvironment] = useState(false);
  const [flutterRecordId, setFlutterRecordId] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // ================= Environment Detection =================
  useEffect(() => {
    const inApp = isInApp();
    setIsAppEnvironment(inApp);
    if (inApp) {
      console.log('✅ APP environment detected');
    } else {
      console.log('🌐 Currently in WEB environment');
    }
  }, []);

  // ================= Setup Flutter Callback =================
  useEffect(() => {
    window.receiveAudioId = (id) => {
      const recordId = String(id ?? "");
      setFlutterRecordId(recordId);
      console.log(`📌 Received recordId from Flutter: ${recordId}`);
      
      if (recordId) {
        handleFlutterRecordId(recordId);
      }
    };
    
    return () => {
      delete window.receiveAudioId;
    };
  }, []);

  // ================= Listen to App Messages =================
  useEffect(() => {
    const onMessage = (event) => {
      let data = event?.data;
      console.log(`📩 Received message. Type: ${typeof data}`);

      // Try to parse JSON string
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          console.log('✅ JSON parsing successful');
        } catch (e) {
          console.log(`⚠️ JSON parsing failed: ${e.message}`);
          return;
        }
      }

      if (!data || typeof data !== 'object') {
        console.log('⚠️ Invalid data/not an object');
        return;
      }
      
      if (data.type) console.log(`🔍 Message type: ${data.type}`);

      // ✅ App returned recording complete
      if (data.type === 'AUDIO_RECORDING_READY') {
        try {
          const payload = data.payload || {};
          let audioBlob = null;

          // 1) App provides file URL
          if (payload.audioUrl) {
            console.log('✅ Received audioUrl from App:', payload.audioUrl);
            processAppAudio(payload.audioUrl, null);
            return;
          }

          // 2) App provides base64
          const base64 = payload.base64;
          const mimeType = payload.mimeType || 'audio/webm';

          if (!base64) throw new Error('Missing base64 audio payload');

          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          audioBlob = new Blob([byteArray], { type: mimeType });

          console.log('✅ Converted base64 to Blob:', audioBlob.size, 'bytes');
          processAppAudio(null, audioBlob);

        } catch (e) {
          console.error('❌ Failed to parse App recording response:', e);
          setIsProcessing(false);
          setIsRecording(false);
          alert(`Processing failed: ${e.message}`);
        }
      }

      // ✅ App returned recording error
      if (data.type === 'AUDIO_RECORDING_ERROR') {
        const message = data.payload?.message || 'Recording failed';
        console.error('❌ App recording error:', message);
        setIsProcessing(false);
        setIsRecording(false);
        alert(`Recording failed: ${message}`);
      }

      // (Optional) Real-time volume detection
      if (data.type === 'AUDIO_INPUT_LEVEL') {
        const level = Number(data.payload?.level ?? 0);
        setHasAudioInput(level > 0);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // ================= Cleanup Resources =================
  const cleanupResources = () => {
    console.log('🧹 Cleaning up resources...');
    
    // Cancel animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('MediaRecorder already stopped');
      }
    }
    
    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        console.warn('AudioContext already closed');
      }
    }
    
    // Stop internal stream
    if (internalStream) {
      internalStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.label);
      });
      setInternalStream(null);
    }
  };

  useEffect(() => {
    return () => {
      console.log('🔄 Component unmounting');
      cleanupResources();
    };
  }, []);

  // ================= Poll for Transcript =================
  const pollForTranscript = async (recordId, maxRetries = 10, interval = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`⏳ [Polling] Attempt ${i + 1}/${maxRetries}...`);
      
      try {
        const response = await fetch(
          `https://xiaohua.54ucl.com:8011/recording/api/v1/transcript/${recordId}`,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log("📥 Response:", data);

        if (data.status === 'completed') {
          return data;
        }
        
        if (data.status === 'failed') {
          throw new Error('Transcription failed on server');
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`❌ Polling error:`, error);
        if (i === maxRetries - 1) throw error;
      }
    }
    throw new Error('Timeout waiting for transcript');
  };

  // ================= Handle Flutter RecordId =================
  const handleFlutterRecordId = async (receivedRecordId) => {
    console.log('🔄 Processing Flutter recordId:', receivedRecordId);
    setIsProcessing(true);

    try {
      const transcriptData = await pollForTranscript(receivedRecordId);
      console.log('✅ Transcription complete:', transcriptData);
      
      const finalTranscript = transcriptData.transcript || '';

      if (onTranscriptComplete) {
        onTranscriptComplete(finalTranscript);
      }

    } catch (error) {
      console.error('❌ Failed to process Flutter recordId:', error);
      alert(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setIsRecording(false);
      cleanupResources();
    }
  };

  // ================= Process App Audio =================
  const processAppAudio = async (audioUrl, audioBlob) => {
    setIsProcessing(true);
    
    try {
      console.log("🚀 Uploading audio from App...");
      
      let blobToUpload = audioBlob;
      
      // If App provides URL, fetch it
      if (audioUrl && !audioBlob) {
        const response = await fetch(audioUrl);
        blobToUpload = await response.blob();
        console.log('✅ Fetched blob from URL:', blobToUpload.size, 'bytes');
      }

      if (!blobToUpload) {
        throw new Error('No audio data to upload');
      }

      const formData = new FormData();
      const ext = blobToUpload.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('file', blobToUpload, `recording.${ext}`);

      const uploadResponse = await fetch(
        'https://xiaohua.54ucl.com:8011/recording/api/v1/upload',
        { method: 'POST', body: formData }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploadData = await uploadResponse.json();
      const recordId = uploadData.record_id;
      
      if (!recordId) throw new Error('No record_id');

      console.log("✅ Upload successful, ID:", recordId);

      const transcriptData = await pollForTranscript(recordId);
      const finalTranscript = transcriptData.transcript || '';

      console.log("✅ Transcription complete:", finalTranscript);
      
      if (onTranscriptComplete) {
        onTranscriptComplete(finalTranscript);
      }

    } catch (error) {
      console.error('❌ Processing failed:', error);
      alert(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setIsRecording(false);
      cleanupResources();
    }
  };

  // ================= Start Recording (App) =================
  const startRecordingInApp = async () => {
    try {
      console.log('📱 App environment: Calling Flutter showOverlay');
      
      if (typeof window.flutter_inappwebview?.callHandler === "function") {
        try {
          const res = await window.flutter_inappwebview.callHandler("showOverlay");
          console.log(`✅ showOverlay successful:`, res);
          setIsRecording(true);
          return true;
        } catch (e) {
          console.error(`⚠️ showOverlay failed:`, e);
          return false;
        }
      } else {
        console.log('⚠️ No callHandler available');
        return false;
      }
    } catch (error) {
      console.error('❌ App recording error:', error);
      return false;
    }
  };

  // ================= Start Recording (Browser) =================
  const startRecordingInBrowser = async () => {
    try {
      console.log('💻 Browser environment: Starting recording...');
      
      // Get stream
      let streamToUse = mediaStream;
      
      if (!streamToUse) {
        console.log('⚠️ No mediaStream from props, requesting permission...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert('❌ Browser does not support recording!\n\nPlease use Chrome, Firefox, or Edge.');
          return;
        }
        
        try {
          streamToUse = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
          setInternalStream(streamToUse);
          console.log('✅ Got mediaStream:', streamToUse.getTracks());
        } catch (err) {
          console.error('❌ getUserMedia error:', err);
          
          if (err.name === 'NotAllowedError') {
            alert('❌ Microphone permission denied!\n\n' +
                  'How to fix:\n' +
                  '1. Click 🔒 in address bar\n' +
                  '2. Allow "Microphone"\n' +
                  '3. Reload page');
          } else if (err.name === 'NotFoundError') {
            alert('❌ Microphone not found!\n\nPlease check your device.');
          } else {
            alert(`❌ Error: ${err.message}`);
          }
          return;
        }
      }

      // Check audio tracks
      const audioTracks = streamToUse.getAudioTracks();
      if (audioTracks.length === 0) {
        alert('❌ No audio track found!');
        return;
      }
      console.log('🎵 Audio tracks:', audioTracks.map(t => t.label));

      // Create AudioContext for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(streamToUse);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Audio level detection
      let isActive = true;
      const checkAudioLevel = () => {
        if (!isActive) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setHasAudioInput(average > 10);
        
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };
      checkAudioLevel();

      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        alert('❌ Browser does not support MediaRecorder!');
        isActive = false;
        return;
      }

      // Check mimeType
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn('⚠️ audio/webm not supported, trying audio/mp4');
        mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Use default
        }
      }

      const mediaRecorder = new MediaRecorder(
        streamToUse, 
        mimeType ? { mimeType } : undefined
      );
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📦 Chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped');
        isActive = false;
        
        if (audioChunksRef.current.length === 0) {
          alert('❌ No audio data!');
          cleanupResources();
          return;
        }

        const audioBlob = new Blob(
          audioChunksRef.current, 
          { type: mimeType || 'audio/webm' }
        );
        console.log('📦 Blob created:', audioBlob.size, 'bytes');
        
        setIsProcessing(true);
        
        try {
          console.log("🚀 Uploading...");
          const formData = new FormData();
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          formData.append('file', audioBlob, `recording.${ext}`);

          const uploadResponse = await fetch(
            'https://xiaohua.54ucl.com:8011/recording/api/v1/upload',
            { method: 'POST', body: formData }
          );

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            throw new Error(`Upload failed: ${errorText}`);
          }

          const uploadData = await uploadResponse.json();
          const recordId = uploadData.record_id;
          
          if (!recordId) throw new Error('No record_id');

          console.log("✅ Uploaded, ID:", recordId);

          const transcriptData = await pollForTranscript(recordId);
          const finalTranscript = transcriptData.transcript || '';

          console.log("✅ Transcription complete:", finalTranscript);
          
          if (onTranscriptComplete) {
            onTranscriptComplete(finalTranscript);
          }

        } catch (error) {
          console.error('❌ Error:', error);
          alert(`❌ Processing failed:\n\n${error.message}`);
        } finally {
          setIsProcessing(false);
          cleanupResources();
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        alert(`❌ Recording error: ${event.error.message}`);
        isActive = false;
        cleanupResources();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setHasAudioInput(false);
      console.log('✅ Recording started');

    } catch (error) {
      console.error('❌ startRecordingInBrowser error:', error);
      alert(`❌ Cannot record:\n\n${error.message}`);
      cleanupResources();
    }
  };

  // ================= Start Recording (Unified) =================
  const startRecording = async () => {
    cleanupResources();

    try {
      // ✅ Try App first
      if (isAppEnvironment) {
        const success = await startRecordingInApp();
        if (success) return;
        
        console.log('⚠️ App recording failed, falling back to browser');
      }

      // ✅ Fallback to browser
      await startRecordingInBrowser();

    } catch (error) {
      console.error('❌ Unable to start recording:', error);
      alert(`❌ Recording failed: ${error.message}`);
      setIsRecording(false);
    }
  };

  // ================= Stop Recording =================
  const stopRecording = () => {
    console.log('⏹️ Stopping recording...');
    
    if (isAppEnvironment) {
      // Notify App to stop
      try {
        window.AppBridge?.postMessage?.(JSON.stringify({ type: 'STOP_RECORDING' }));
        console.log('📤 Sent STOP_RECORDING to App');
        setIsProcessing(true);
      } catch (e) {
        console.error('❌ Failed to notify App:', e);
      }
    } else {
      // Browser: stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    }
  };

  // ================= Handle Click =================
  const handleClick = () => {
    console.log('🖱️ Click, recording:', isRecording, 'processing:', isProcessing);
    
    if (isProcessing) {
      console.log('⚠️ Still processing');
      return;
    }
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // ================= Render =================
  return (
    <button
      type="button"
      className={`voice-record-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
      onClick={handleClick}
      disabled={isProcessing}
      title={isRecording ? 'Stop Recording' : 'Start Recording'}
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
