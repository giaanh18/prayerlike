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

// ================= Environment Detection =================
const isInApp = () =>
  typeof window !== "undefined" &&
  typeof window.flutter_inappwebview !== "undefined";

function AudioPostScreen({ onClose = () => { }, onUploadSuccess = () => { } }) {
  const navigate = useNavigate();

  const [recordingState, setRecordingState] = useState('idle');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [hasAudioInput, setHasAudioInput] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [activeButton, setActiveButton] = useState(null);

  // Tab state management
  const [activeTab, setActiveTab] = useState('Add');
  const convertToTraditional = async (text) => {
    if (!text || !text.trim()) return text;
    try {
      const params = new URLSearchParams({
        key: 'AIzaSyDwa1Yuu7ihKTeXU4eFrsqkbxR2a6Vf7Jw',
        target: 'zh-TW',
        source: 'zh-CN',
        format: 'text',
        q: text
      });
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?${params.toString()}`,
        { method: 'POST' }
      );
      const data = await response.json();
      return data?.data?.translations?.[0]?.translatedText || text;
    } catch (err) {
      console.warn('⚠️ Convert to Traditional failed:', err);
      return text;
    }
  };


  // App environment state
  const [isAppEnvironment, setIsAppEnvironment] = useState(false);
  const [flutterRecordId, setFlutterRecordId] = useState('');

  // Refs (only keep necessary ones)
  const audioChunksRef = useRef([]);
  const abortPollingRef = useRef(false);

  // Environment detection
  useEffect(() => {
    const inApp = isInApp();
    setIsAppEnvironment(inApp);
  }, []);

  // Setup callback to receive Flutter recordId
  useEffect(() => {
    window.receiveAudioId = (id) => {
      const recordId = String(id ?? "");
      setFlutterRecordId(recordId);

      if (recordId) {
        handleFlutterRecordId(recordId);
      }
    };

    return () => {
      delete window.receiveAudioId;
    };
  }, []);

  // Ensure URL resources are released when component unmounts (does not involve any microphone permissions)
  useEffect(() => {
    return () => {
      cleanupResources();
      abortPollingRef.current = true;
    };
  }, []);

  // Resource cleanup function: No longer handles any microphone/recording hardware, only cleans up frontend URL resources
  const cleanupResources = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };

  // Receive recording result from App (Base64 or URL)
  useEffect(() => {
    const onMessage = (event) => {
      let data = event?.data;


      // ✅ App returned recording complete
      if (data.type === 'AUDIO_RECORDING_READY') {
        try {
          const payload = data.payload || {};

          // 1) App directly provides file URL (e.g. local file or App's own blob url)
          if (payload.audioUrl) {
            setAudioBlob(null);
            setAudioURL(payload.audioUrl);
            setRecordingState('preview');
            setActiveButton(null);
            return;
          }

          // 2) App provides base64 + mimeType (Web side converts to Blob)
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
          console.error('❌ Failed to parse App recording response:', e);
          setRecordingState('error');
          setUploadMessage(`Processing failed: ${e.message}`);
          setActiveButton(null);
        }
      }

      // ✅ App returned recording error
      if (data.type === 'AUDIO_RECORDING_ERROR') {
        const message = data.payload?.message || 'Recording failed';
        console.error('❌ App recording error:', message);
        setRecordingState('error');
        setUploadMessage(`Processing failed: ${message}`);
        setActiveButton(null);
      }

      // (Optional) App returns real-time volume detection
      if (data.type === 'AUDIO_INPUT_LEVEL') {
        const level = Number(data.payload?.level ?? 0);
        setHasAudioInput(level > 0);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [audioURL]);

  // Handle recordId returned from Flutter
  const handleFlutterRecordId = async (receivedRecordId) => {
    setRecordingState('uploading');
    setUploadMessage('Received recording ID, waiting for transcription result...');
    abortPollingRef.current = false;

    try {
      const transcriptData = await pollForTranscript(receivedRecordId);

      let finalTranscript = transcriptData.transcript || '';
      if (finalTranscript) {
        setUploadMessage('Converting to Traditional Chinese...');
        finalTranscript = await convertToTraditional(finalTranscript);
      }
      const finalAudioUrl = transcriptData.audio_url || '';

      setRecordingState('success');
      setUploadMessage('Transcription successful!');

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
      console.error('❌ Failed to process Flutter recordId:', error);
      setRecordingState('error');
      setUploadMessage(`Processing failed: ${error.message}`);
      setActiveButton(null);
    }
  };

  const startRecording = async () => {
    setActiveButton('start');

    // Clean up old URLs before starting (does not involve any permissions)
    cleanupResources();

    try {
      // ✅ Check if in App environment
      if (isAppEnvironment) {

        if (typeof window.flutter_inappwebview?.callHandler === "function") {
          try {
            const res = await window.flutter_inappwebview.callHandler("showOverlay");
            setRecordingState('recording');
            setUploadMessage('Waiting for Flutter to return recording result...');
            return;
          } catch (e) {
            console.error('Failed to call showOverlay', e);
            // If Flutter call fails, continue with Web recording
          }
        } else {
        }
      }

      // Use original recording logic when in Web environment or Flutter call fails
      window.AppBridge?.postMessage?.(JSON.stringify({ type: 'START_RECORDING' }));

      // UI state switch
      setRecordingState('recording');
      setHasAudioInput(false);

    } catch (error) {
      console.error('❌ Unable to start recording:', error);
      setRecordingState('error');
      setUploadMessage(`Processing failed: ${error.message}`);
      setActiveButton(null);
    }
  };

  const stopRecording = () => {
    setActiveButton('stop');

    // 2. Provide immediate UI feedback to avoid looking frozen while waiting for App response
    setRecordingState('uploading');
    setUploadMessage('Processing audio...');

    try {
      // ✅ Notify App to stop recording, App will return AUDIO_RECORDING_READY
      window.AppBridge?.postMessage?.(JSON.stringify({ type: 'STOP_RECORDING' }));
    } catch (error) {
      console.error('❌ Unable to call App to stop recording:', error);
      setRecordingState('error');
      setUploadMessage(`Processing failed: ${error.message}`);
      setActiveButton(null);
    }
  };

  // Poll for transcription result (keep original logic)
  const pollForTranscript = async (recordId, maxRetries = 10, interval = 2000) => {
    for (let i = 0; i < maxRetries; i++) {
      console.log(`⏳ [Polling] Attempt ${i + 1} to check transcription status...`);

      const response = await fetch(`https://xiaohua.54ucl.com:8011/recording/api/v1/transcript/${recordId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("📥 Received response:", data);

      if (data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        throw new Error('Server returned transcription failure');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Transcription timeout');
  };

  const handleConfirm = async () => {
    setActiveButton('confirm');
    if (!audioBlob && !audioURL) return;

    setRecordingState('uploading');
    setUploadMessage('Uploading audio...');

    try {
      console.log("🚀 [Step 1] Starting audio upload...");
      const formData = new FormData();

      // Ensure filename has extension
      const ext = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('file', audioBlob, `recording.${ext}`);

      const uploadResponse = await fetch('https://xiaohua.54ucl.com:8011/recording/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Audio upload failed Status: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      const recordId = uploadData.record_id;
      if (!recordId) throw new Error('Record ID not received');

      console.log("✅ [Step 1] Upload successful, Record ID:", recordId);

      setUploadMessage('Transcribing text (please wait)...');

      const transcriptData = await pollForTranscript(recordId);

      console.log("✅ [Step 2] Transcription complete, content:", transcriptData);

      let finalTranscript = transcriptData.transcript || '';
      if (finalTranscript) {
        setUploadMessage('Converting to Traditional Chinese...');
        finalTranscript = await convertToTraditional(finalTranscript);
      }
      const finalAudioUrl = transcriptData.audio_url || '';

      setRecordingState('success');
      setUploadMessage('Transcription successful!');

      console.log("🚀 [Step 3] Navigating to TextPostScreen with text:", finalTranscript);

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
      console.error('❌ Error:', error);
      setRecordingState('error');
      setUploadMessage(`Processing failed: ${error.message}`);
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
    console.log("🔄 Reset recording state");
    setActiveButton(null);

    // Clean up old resources
    cleanupResources();

    setAudioBlob(null);
    setAudioURL(null);
    setRecordingState('idle');
    setHasAudioInput(false);

    audioChunksRef.current = [];
  };

  // Navigation Handlers
  const handleHome = () => { setActiveTab('Home'); navigate('/main'); };
  const handleSearch = () => { setActiveTab('Search'); navigate('/prayer-hub'); };
  const handleCreatePost = () => { setActiveTab('Add'); navigate('/create-post'); };
  const handleProfile = () => { setActiveTab('Profile'); navigate('/addfriend'); };
  const handleNova = () => { setActiveTab('Nova'); navigate('/nova'); };

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
            {hasAudioInput ? '✓ Audio detected' : 'Waiting for audio input...'}
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
        aria-label="Back to previous page"
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
          ariaLabel="Home"
        />
        <CircleButton
          provider="Search"
          iconSrc={Search}
          onClick={handleSearch}
          isActive={activeTab === 'Search'}
          size="medium"
          ariaLabel="Search"
        />
        <CircleButton
          provider="Add"
          iconSrc={Add}
          onClick={handleCreatePost}
          isActive={activeTab === 'Add'}
          size="medium"
          ariaLabel="Create Post"
        />
        <CircleButton
          provider="Profile"
          iconSrc={Profile}
          onClick={handleProfile}
          isActive={activeTab === 'Profile'}
          size="medium"
          ariaLabel="Profile"
        />
        <CircleButton
          provider="Nova"
          iconSrc={Nova}
          onClick={handleNova}
          isActive={activeTab === 'Nova'}
          size="medium"
          ariaLabel="Nova Assistant"
        />
      </div>
    </div>
  );
}

export default AudioPostScreen;
