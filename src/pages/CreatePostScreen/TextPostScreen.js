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

  // 接收資料
  const transcriptFromAudio = location.state?.transcript || 
                               location.state?.initialContent || '';
  const cameFromAudio = location.state?.fromAudio || false;
  const recordId = location.state?.recordId;

  // State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(transcriptFromAudio);
  
  // Dropdown Values
  const [privacy, setPrivacy] = useState('Public');
  const [category, setCategory] = useState('Personal & Family');
  
  // Dropdown Open/Close State
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 控制送出狀態
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const privacyRef = useRef(null);
  const categoryRef = useRef(null);
  // 防止連點的邏輯鎖
  const isSubmittingRef = useRef(false);

  const charCount = content.length;
  const maxChars = 500;

  // useEffects
  useEffect(() => {
    if (transcriptFromAudio) {
      setContent(transcriptFromAudio);
    }
  }, [transcriptFromAudio]);

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

  // ==================== 🔧 核心修改區域 START ====================
  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
        console.log("⏳ 重複點擊攔截：正在送出中...");
        return;
    }

    if (!content.trim()) {
      setStatusMessage('Content cannot be empty');
      return;
    }
    if (!user || !user.id) {
      setStatusMessage('User not logged in');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setStatusMessage('Posting...');

    const finalCategory = category || 'Personal & Family';

    const privacyMap = {
      'Public': 'public',
      'Family': 'family',
      'Tribe': 'tribe',
      'Individual': 'individual'
    };
    const finalPrivacy = privacyMap[privacy] || 'public';

    try {
      const postPayload = {
        title: title.trim(),
        content: content.trim(),
        category: finalCategory,
        privacy: finalPrivacy,
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
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setStatusMessage('Error occurred, please try again');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };
  // ==================== 🔧 核心修改區域 END ====================

  const handleCancel = () => {
    if (isSubmitting) return; 
    navigate('/create-post');
  };

  // Navigation
  const handleHome = () => navigate('/main');
  const handleSearch = () => navigate('/tribe');
  const handleCreatePost = () => navigate('/create-post');
  const handleProfile = () => navigate('/profile');
  const handleNova = () => navigate('/notifications');

  const privacyOptions = ['Public', 'Family', 'Tribe', 'Individual'];
  const categoryOptions = ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer', 'Tribe Prayer'];

  return (
    <div className="text-post-screen">
      
      {/* ✅ 新增：返回按鈕 (使用 CreatePostScreen 的樣式) */}
      <button 
        className="back-button" 
        onClick={() => navigate('/create-post')} 
        aria-label="返回上一頁"
        disabled={isSubmitting} // 防止送出中誤觸
      >
        ←
      </button>

      <div className="text-post-content">
        
        {cameFromAudio && (
          <div className="audio-import-notice">
            ✓ Imported from audio
          </div>
        )}

        {/* Dropdown Row */}
        <div className="dropdown-row">
          
          {/* Privacy Dropdown */}
          <div className="custom-dropdown" ref={privacyRef}>
            <div 
              className={`dropdown-trigger ${isSubmitting ? 'disabled' : ''}`} 
              onClick={() => !isSubmitting && setIsPrivacyOpen(!isPrivacyOpen)}
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
              className={`dropdown-trigger ${isSubmitting ? 'disabled' : ''}`} 
              onClick={() => !isSubmitting && setIsCategoryOpen(!isCategoryOpen)}
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
            placeholder="Title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={isSubmitting} 
          />

          <div className="textarea-wrapper">
            <textarea
              placeholder="Write your prayer here... (Max 500 words)"
              value={content}
              onChange={handleContentChange}
              maxLength={maxChars}
              disabled={isSubmitting} 
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
            className="action-btn submit-btn"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? 'posting...' : 'post'}
          </button>
          <button 
            className="action-btn"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            cancel
          </button>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="bottom-navigation">
        <CircleButton provider="Home" iconSrc={Home} onClick={handleHome} size="medium" ariaLabel="Home" />
        <CircleButton provider="Search" iconSrc={Search} onClick={handleSearch} size="medium" ariaLabel="Search" />
        <CircleButton provider="Add" iconSrc={Add} onClick={handleCreatePost} size="medium" ariaLabel="Add Post" className="nav-active" isActive={true} />
        <CircleButton provider="Profile" iconSrc={Profile} onClick={handleProfile} size="medium" ariaLabel="Profile" />
        <CircleButton provider="Nova" iconSrc={Nova} onClick={handleNova} size="medium" ariaLabel="Notifications" />
      </div>
    </div>
  );
};

export default TextPostScreen;