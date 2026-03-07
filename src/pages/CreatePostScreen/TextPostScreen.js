import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';
import CircleButton from '../../components/CircleButton/CircleButton';
import './TextPostScreen.css';

import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

const TextPostScreen = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const transcriptFromAudio = location.state?.transcript || 
                               location.state?.initialContent || '';
  const cameFromAudio = location.state?.fromAudio || false;
  const recordId = location.state?.recordId;

  const [currentTribeId, setCurrentTribeId] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    return storedUser.tribe !== undefined ? storedUser.tribe : user?.tribe;
  });

  const hasTribe = currentTribeId !== null && currentTribeId !== undefined;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    if (storedUser.tribe !== undefined && storedUser.tribe !== currentTribeId) {
      setCurrentTribeId(storedUser.tribe);
    }
  }, [user, currentTribeId]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(transcriptFromAudio);
  const [privacy, setPrivacy] = useState('Public');
  const [category, setCategory] = useState('Personal & Family');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('Add');

  // ✅ NEW: validation error states
  const [titleError, setTitleError] = useState(false);
  const [contentError, setContentError] = useState(false);

  const privacyRef = useRef(null);
  const categoryRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const charCount = content.length;
  const maxChars = 500;

  useEffect(() => {
    if (transcriptFromAudio) setContent(transcriptFromAudio);
  }, [transcriptFromAudio]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (privacyRef.current && !privacyRef.current.contains(event.target)) setIsPrivacyOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setIsCategoryOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContentChange = (e) => {
    if (e.target.value.length <= maxChars) {
      setContent(e.target.value);
      // ✅ Clear content error when user starts typing
      if (contentError) setContentError(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    // ✅ Validate — show red errors instead of just disabling button
    let hasError = false;
    if (!title.trim()) {
      setTitleError(true);
      hasError = true;
    }
    if (!content.trim()) {
      setContentError(true);
      hasError = true;
    }
    if (hasError) return;

    if (!user || !user.id) {
      setStatusMessage('User not logged in');
      return;
    }

    if ((category === 'Tribe Prayer' || privacy === 'Tribe') && !hasTribe) {
      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe-related features.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setStatusMessage('Posting...');

    const finalCategory = category || 'Personal & Family';
    const privacyMap = {
      'Public': 'public', 'Family': 'family',
      'Tribe': 'tribe', 'Individual': 'individual'
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

      const result = await ApiService.createPost(user.id, postPayload);

      if (result.success) {
        setStatusMessage('Success!');
        setTimeout(() => navigate('/main', { state: { category: finalCategory } }), 600);
      } else {
        setStatusMessage(`Failed: ${result.message || 'Unknown error'}`);
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    } catch (err) {
      setStatusMessage('Error occurred, please try again');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    navigate('/create-post');
  };

  const handleHome = () => { setActiveTab('Home'); navigate('/main'); };
  const handleSearch = () => { setActiveTab('Search'); navigate('/prayer-hub'); };
  const handleCreatePost = () => { setActiveTab('Add'); navigate('/create-post'); };
  const handleProfile = () => { setActiveTab('Profile'); navigate('/addfriend'); };
  const handleNova = () => { setActiveTab('Nova'); navigate('/nova'); };

  const privacyOptions = hasTribe
    ? ['Public', 'Family', 'Tribe', 'Individual']
    : ['Public', 'Family', 'Individual'];

  const categoryOptions = hasTribe
    ? ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer', 'Tribe Prayer']
    : ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer'];

  return (
    <div className="text-post-screen">

      <button
        className="back-button"
        onClick={() => navigate('/create-post')}
        aria-label="Back to previous page"
        disabled={isSubmitting}
      >
        ←
      </button>

      <div className="text-post-content">

        {cameFromAudio && (
          <div className="audio-import-notice">✓ Imported from audio</div>
        )}

        {/* Dropdown Row */}
        <div className="dropdown-row">

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
                    onClick={() => { setPrivacy(option); setIsPrivacyOpen(false); }}
                  >
                    {option}
                  </div>
                ))}
                {!hasTribe && (
                  <div className="dropdown-item disabled" onClick={(e) => {
                    e.stopPropagation();
                    alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Privacy.');
                  }}>
                    Tribe 🔒
                  </div>
                )}
              </div>
            )}
          </div>

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
                      if (option === 'Tribe Prayer' && !hasTribe) {
                        alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Prayer feature.');
                        return;
                      }
                      setCategory(option);
                      setIsCategoryOpen(false);
                    }}
                  >
                    {option}
                    {option === 'Tribe Prayer' && !hasTribe && ' 🔒'}
                  </div>
                ))}
                {!hasTribe && (
                  <div className="dropdown-item disabled" onClick={(e) => {
                    e.stopPropagation();
                    alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Prayer feature.');
                  }}>
                    Tribe Prayer 🔒
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Prayer Card */}
        <div className="prayer-card">

          {/* ✅ Title field with validation */}
          <div className="field-wrapper">
            <input
              type="text"
              className={`prayer-title ${titleError ? 'input-error' : ''}`}
              placeholder="Title *"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // ✅ Clear error as soon as user types
                if (titleError) setTitleError(false);
              }}
              maxLength={100}
              disabled={isSubmitting}
            />
            {/* ✅ Red error message below title */}
            {titleError && (
              <span className="field-error-msg">Title is required.</span>
            )}
          </div>

          <div className="textarea-wrapper">
            <textarea
              className={contentError ? 'input-error' : ''}
              placeholder="Write your prayer here... (Max 500 words)"
              value={content}
              onChange={handleContentChange}
              maxLength={maxChars}
              disabled={isSubmitting}
            />
            <div className="char-count">{charCount}/{maxChars}</div>
            {/* ✅ Red error message below textarea */}
            {contentError && (
              <span className="field-error-msg">Content is required.</span>
            )}
          </div>

        </div>

        {statusMessage && (
          <div className="status-message">{statusMessage}</div>
        )}

        {/* Buttons */}
        <div className="button-row">
          <button
            className="action-btn submit-btn"
            onClick={handleSubmit}
            // ✅ Only disable during actual submission — let user click to see errors
            disabled={isSubmitting}
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

      <div className="bottom-navigation">
        <CircleButton provider="Home" iconSrc={Home} onClick={handleHome} isActive={activeTab === 'Home'} size="medium" ariaLabel="Home" />
        <CircleButton provider="Search" iconSrc={Search} onClick={handleSearch} isActive={activeTab === 'Search'} size="medium" ariaLabel="Search" />
        <CircleButton provider="Add" iconSrc={Add} onClick={handleCreatePost} isActive={activeTab === 'Add'} size="medium" ariaLabel="Create Post" />
        <CircleButton provider="Profile" iconSrc={Profile} onClick={handleProfile} isActive={activeTab === 'Profile'} size="medium" ariaLabel="Profile" />
        <CircleButton provider="Nova" iconSrc={Nova} onClick={handleNova} isActive={activeTab === 'Nova'} size="medium" ariaLabel="Nova Assistant" />
      </div>

    </div>
  );
};

export default TextPostScreen;
