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

  // Receive data
  const transcriptFromAudio = location.state?.transcript || 
                               location.state?.initialContent || '';
  const cameFromAudio = location.state?.fromAudio || false;
  const recordId = location.state?.recordId;

  // ✅ Check if user has tribe
  const [currentTribeId, setCurrentTribeId] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    return storedUser.tribe !== undefined ? storedUser.tribe : user?.tribe;
  });

  const hasTribe = currentTribeId !== null && currentTribeId !== undefined;

  // ✅ Sync tribe from localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (storedUser.tribe !== undefined && storedUser.tribe !== currentTribeId) {
      console.log(`🔄 Syncing tribe from localStorage: ${storedUser.tribe}`);
      setCurrentTribeId(storedUser.tribe);
    }
  }, [user, currentTribeId]);

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

  // Control submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Tab state management
  const [activeTab, setActiveTab] = useState('Add');

  // Refs
  const privacyRef = useRef(null);
  const categoryRef = useRef(null);
  // Logic lock to prevent duplicate clicks
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

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
        console.log("⏳ Duplicate click intercepted: Submission in progress...");
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

    // ✅ BLOCK if Tribe Prayer or Tribe privacy is selected but user has no tribe
    if ((category === 'Tribe Prayer' || privacy === 'Tribe') && !hasTribe) {
      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe-related features.');
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

      console.log("🚀 Sending post Payload:", postPayload);

      const result = await ApiService.createPost(
        user.id, 
        postPayload
      );
      
      if (result.success) {
        setStatusMessage('Success!');
        setTimeout(() => {
          navigate('/main', {state: { category: finalCategory }});
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

  const handleCancel = () => {
    if (isSubmitting) return; 
    navigate('/create-post');
  };

  // ✅ Navigation Handlers
  const handleHome = () => {
    setActiveTab('Home');
    navigate('/main');
  };

  const handleSearch = () => {
    setActiveTab('Search');
    navigate('/prayer-hub');
  };

  const handleCreatePost = () => {
    setActiveTab('Add');
    navigate('/create-post');
  };

  const handleProfile = () => {
    setActiveTab('Profile');
    navigate('/addfriend');
  };

  const handleNova = () => {
    setActiveTab('Nova');
    navigate('/nova');
  };

  // ✅ Block Tribe if user has no tribe
  const privacyOptions = hasTribe 
    ? ['Public', 'Family', 'Tribe', 'Individual']
    : ['Public', 'Family', 'Individual'];

  const categoryOptions = hasTribe 
    ? ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer', 'Tribe Prayer']
    : ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer'];

  return (
    <div className="text-post-screen">
      
      {/* Back button */}
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
                
                {/* ✅ Display locked Tribe if user has no tribe */}
                {!hasTribe && (
                  <div 
                    className="dropdown-item disabled"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Privacy.');
                    }}
                  >
                    Tribe 🔒
                  </div>
                )}
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
                      // ✅ BLOCK selecting Tribe Prayer if user has no tribe
                      if (option === 'Tribe Prayer' && !hasTribe) {
                        alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Prayer feature.');
                        return;
                      }
                      
                      setCategory(option);
                      setIsCategoryOpen(false);
                    }}
                  >
                    {option}
                    {/* ✅ Display 🔒 if Tribe Prayer and user has no tribe */}
                    {option === 'Tribe Prayer' && !hasTribe && ' 🔒'}
                  </div>
                ))}
                
                {/* ✅ Display locked Tribe Prayer if user has no tribe */}
                {!hasTribe && (
                  <div 
                    className="dropdown-item disabled"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Prayer feature.');
                    }}
                  >
                    Tribe Prayer 🔒
                  </div>
                )}
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
            disabled={!title.trim() || !content.trim() || isSubmitting}
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

      {/* ✅ Bottom navigation bar */}
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
};

export default TextPostScreen;
