// ./src/pages/CreatePostScreen/TextPostScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';
import CircleButton from '../../components/CircleButton/CircleButton';
import './TextPostScreen.css';

// Icon imports
import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

const TextPostScreen = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 接收來自 AudioPostScreen 的資料
  const transcriptFromAudio = location.state?.transcript || 
                               location.state?.initialContent || '';
  const cameFromAudio = location.state?.fromAudio || false;
  const recordId = location.state?.recordId;

  // State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(transcriptFromAudio);
  
  // Dropdown Values
  const [privacy, setPrivacy] = useState('Privacy Choices'); 
  const [category, setCategory] = useState('Prayer Category'); 
  
  // Dropdown Open/Close State
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');

  // Ref for click outside
  const privacyRef = useRef(null);
  const categoryRef = useRef(null);

  const charCount = content.length;
  const maxChars = 500;

  // 當 transcriptFromAudio 有值時，更新 content
  useEffect(() => {
    if (transcriptFromAudio) {
      console.log("📝 收到轉錄文字，自動填入:", transcriptFromAudio);
      setContent(transcriptFromAudio);
    }
  }, [transcriptFromAudio]);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (privacyRef.current && !privacyRef.current.contains(event.target)) {
        setIsPrivacyOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleContentChange = (e) => {
    if (e.target.value.length <= maxChars) {
      setContent(e.target.value);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setStatusMessage('Content cannot be empty');
      return;
    }
    if (!user || !user.id) {
      setStatusMessage('User not logged in');
      return;
    }

    // 準備 Category (API 必填)
    const finalCategory = (category === 'Prayer Category' || category === '') ? 'Personal & Family' : category;
    
    setStatusMessage('Posting...');

    try {
      // 建構符合 PostCreate Schema 的 Payload
      const postPayload = {
        content: content.trim(),
        category: finalCategory,
        uuid: null 
      };

      console.log("🚀 發送貼文 Payload:", postPayload);

      const result = await ApiService.createPost(
        user.id, 
        postPayload
      );
      
      if (result.success) {
        setStatusMessage('Success!');
        setTimeout(() => {
          navigate('/main');
        }, 600);
      } else {
        setStatusMessage(`Failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setStatusMessage('Error occurred, please try again');
    }
  };

  const handleCancel = () => {
    navigate('/create-post');
  };

  // Navigation
  const handleHome = () => navigate('/main');
  const handleSearch = () => navigate('/tribe');
  const handleCreatePost = () => navigate('/create-post');
  const handleProfile = () => navigate('/profile');
  const handleNova = () => navigate('/notifications');

  // 選項資料
  const privacyOptions = ['Public', 'Family', 'Tribe', 'Individual'];
  const categoryOptions = ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer', 'Tribe Prayer'];

  return (
    <div className="text-post-screen">
      <div className="text-post-content">
        
        {cameFromAudio && (
          <div className="audio-import-notice">
            ✓ Imported from audio
            {recordId && <span style={{ marginLeft: 8 }}>ID: {recordId}</span>}
          </div>
        )}

        {/* Dropdown Row */}
        <div className="dropdown-row">
          
          {/* Privacy Dropdown */}
          <div className="custom-dropdown" ref={privacyRef}>
            <div 
              className="dropdown-trigger" 
              onClick={() => setIsPrivacyOpen(!isPrivacyOpen)}
            >
              {privacy}
              <span className={`arrow ${isPrivacyOpen ? 'up' : 'down'}`}>▼</span>
            </div>
            {isPrivacyOpen && (
              <div className="dropdown-menu">
                {privacyOptions.map((option) => (
                  <div 
                    key={option} 
                    className={`dropdown-item ${privacy === option ? 'selected' : ''}`}
                    onClick={() => {
                      setPrivacy(option);
                      setIsPrivacyOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="custom-dropdown" ref={categoryRef}>
            <div 
              className="dropdown-trigger" 
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              {category}
              <span className={`arrow ${isCategoryOpen ? 'up' : 'down'}`}>▼</span>
            </div>
            {isCategoryOpen && (
              <div className="dropdown-menu">
                {categoryOptions.map((option) => (
                  <div 
                    key={option} 
                    className={`dropdown-item ${category === option ? 'selected' : ''}`}
                    onClick={() => {
                      setCategory(option);
                      setIsCategoryOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Prayer Card */}
        <div className="prayer-card">
          <input
            type="text"
            className="prayer-title"
            placeholder="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />

          <div className="textarea-wrapper">
            <textarea
              placeholder="maximum limit is 500 words"
              value={content}
              onChange={handleContentChange}
              maxLength={maxChars}
            />
            <div className="char-count">
              {charCount}/{maxChars}
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="status-message">
            {statusMessage}
          </div>
        )}

        {/* Buttons */}
        <div className="button-row">
          <button 
            className="action-btn"
            onClick={handleSubmit}
            disabled={!content.trim() || statusMessage === 'Posting...'}
          >
            post
          </button>
          <button 
            className="action-btn"
            onClick={handleCancel}
          >
            cancel
          </button>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        <CircleButton
          provider="Home"
          iconSrc={Home}
          onClick={handleHome}
          size="medium"
          ariaLabel="Home"
        />
        <CircleButton
          provider="Search"
          iconSrc={Search}
          onClick={handleSearch}
          size="medium"
          ariaLabel="Search"
        />
        <CircleButton
          provider="Add"
          iconSrc={Add}
          onClick={handleCreatePost}
          size="medium"
          ariaLabel="Add Post"
          className="nav-active"
          isActive={true} 
        />
        <CircleButton
          provider="Profile"
          iconSrc={Profile}
          onClick={handleProfile}
          size="medium"
          ariaLabel="Profile"
        />
        <CircleButton
          provider="Nova"
          iconSrc={Nova}
          onClick={handleNova}
          size="medium"
          ariaLabel="Notifications"
        />
      </div>
    </div>
  );
};

export default TextPostScreen;