import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';
import CircleButton from '../../components/CircleButton/CircleButton';
import './TextPostScreen.css';

// ✅ Import icons đúng định dạng .png
import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

const TextPostScreen = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Lấy transcript từ AudioPostScreen
  const transcriptFromAudio = location.state?.initialContent || 
                               location.state?.transcript || '';
  const cameFromAudio = location.state?.fromAudio || 
                        location.state?.fromAudioRecord || false;
  const recordId = location.state?.recordId;
  const audioUrl = location.state?.audioUrl;

  // ✅ State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(transcriptFromAudio);
  const [privacy, setPrivacy] = useState('Public');
  const [category, setCategory] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const charCount = content.length;
  const maxChars = 500;

  // ✅ Auto-fill content từ audio
  useEffect(() => {
    if (transcriptFromAudio) {
      setContent(transcriptFromAudio);
    }
  }, [transcriptFromAudio]);

  // ✅ Handle content change
  const handleContentChange = (e) => {
    if (e.target.value.length <= maxChars) {
      setContent(e.target.value);
    }
  };

  // ✅ Handle submit
  const handleSubmit = async () => {
    if (!content.trim()) {
      setStatusMessage('內容不能為空');
      return;
    }
    if (!user || !user.id) {
      setStatusMessage('使用者未登入，無法發文');
      return;
    }
    setStatusMessage('發文中...');

    try {
      const result = await ApiService.createPost(
        user.id, 
        content.trim(), 
        privacy.toLowerCase()
      );
      
      if (result.success) {
        setStatusMessage('發文成功！');
        setTimeout(() => {
          navigate('/main');
        }, 600);
      } else {
        setStatusMessage(`發文失敗: ${result.message || '未知錯誤'}`);
      }
    } catch (err) {
      console.error('發文錯誤:', err);
      setStatusMessage('發文時發生錯誤，請稍後再試');
    }
  };

  // ✅ Handle cancel
  const handleCancel = () => {
    navigate('/create-post');
  };

  // ✅ Navigation handlers
  const handleHome = () => navigate('/main');
  const handleSearch = () => navigate('/tribe');
  const handleCreatePost = () => navigate('/create-post');
  const handleProfile = () => navigate('/profile');
  const handleNova = () => navigate('/notifications');

  return (
    <div className="text-post-screen">
      <div className="text-post-content">
        
        {/* ✅ Audio Import Notice */}
        {cameFromAudio && (
          <div className="audio-import-notice">
            ✓ 已從錄音自動匯入文字
            {recordId && <span style={{ marginLeft: 8 }}>ID: {recordId}</span>}
            {audioUrl && (
              <span style={{ marginLeft: 8 }}>
                <a href={audioUrl} target="_blank" rel="noreferrer">
                  播放原音訊
                </a>
              </span>
            )}
          </div>
        )}

        {/* ✅ Dropdown Row - Căn phải */}
        <div className="dropdown-row">
          <div className="dropdown-container">
            <select 
              className="dropdown-select privacy-dropdown"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
            >
              <option value="Public">Public</option>
              <option value="Private">Private</option>
              <option value="Friends">Friends</option>
            </select>
          </div>

          <div className="dropdown-container">
            <select 
              className="dropdown-select category-dropdown"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Category</option>
              <option value="prayer">Prayer</option>
              <option value="testimony">Testimony</option>
              <option value="question">Question</option>
            </select>
          </div>
        </div>

        {/* ✅ White Card - Chứa Title + Textarea */}
        <div className="prayer-card">
          {/* Title Input */}
          <input
            type="text"
            className="prayer-title"
            placeholder="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />

          {/* Textarea Wrapper */}
          <div className="textarea-wrapper">
            <textarea
              placeholder="maximum limit is 500 words..."
              value={content}
              onChange={handleContentChange}
              maxLength={maxChars}
            />
            <div className="char-count">
              {charCount}/{maxChars}
            </div>
          </div>
        </div>

        {/* ✅ Status Message */}
        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}

        {/* ✅ Button Row */}
        <div className="button-row">
          <button onClick={handleCancel}>
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!content.trim() || statusMessage === '發文中...'}
          >
            發布
          </button>
        </div>

      </div>

      {/* ✅ BOTTOM NAVIGATION */}
      <div className="bottom-navigation">
        <CircleButton
          provider="Home"
          iconSrc={Home}
          onClick={handleHome}
          size="medium"
          ariaLabel="首頁"
        />
        <CircleButton
          provider="Search"
          iconSrc={Search}
          onClick={handleSearch}
          size="medium"
          ariaLabel="搜尋"
        />
        <CircleButton
          provider="Add"
          iconSrc={Add}
          onClick={handleCreatePost}
          size="medium"
          ariaLabel="新增貼文"
          className="nav-active"
        />
        <CircleButton
          provider="Profile"
          iconSrc={Profile}
          onClick={handleProfile}
          size="medium"
          ariaLabel="個人資料"
        />
        <CircleButton
          provider="Nova"
          iconSrc={Nova}
          onClick={handleNova}
          size="medium"
          ariaLabel="通知"
        />
      </div>
    </div>
  );
};

export default TextPostScreen;
