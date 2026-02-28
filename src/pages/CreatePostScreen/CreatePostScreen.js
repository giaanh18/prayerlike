import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CircleButton from '../../components/CircleButton/CircleButton';
import './CreatePostScreen.css';

// Import icons
import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

const CreatePostScreen = ({ onLogout }) => {
  const navigate = useNavigate();
  const navigatingRef = useRef(false);
  
  const [activeTab, setActiveTab] = useState('Add');

  const handleCreatePost = () => {
    console.log('🆕 Already on create post page');
    setActiveTab('Add');
  };

  const handleHome = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('🏠 Navigate to home');
    navigatingRef.current = true;
    setActiveTab('Home');
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/context');
  }, [navigate]);

  const handleSearch = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('🔍 Navigate to Prayer Hub');
    navigatingRef.current = true;
    setActiveTab('Search');
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/prayer-hub');
  }, [navigate]);

  const handleProfile = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('👤 Navigate to Add Friend');
    navigatingRef.current = true;
    setActiveTab('Profile');
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/addfriend');
  }, [navigate]);

  const handleNova = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('🤖 Navigate to Nova');
    navigatingRef.current = true;
    setActiveTab('Nova');
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 1000);
    
    navigate('/nova');
  }, [navigate]);

  // ✅ SỬA: Create text post → Navigate to /create-post/text
  const handleCreateTextPost = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('📝 Create text post - Navigate to TextPostScreen');
    navigatingRef.current = true;
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/create-post/text');
  }, [navigate]);

  // ✅ SỬA: Create voice post → Navigate to /create-post/audio
  const handleCreateVoicePost = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('🎤 Create voice post - Navigate to AudioPostScreen');
    navigatingRef.current = true;
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/create-post/audio', { 
      state: { autoStart: true }
    });
  }, [navigate]);

  return (
    <div className="create-post-page">
      <div className="centered-layout">
        <button 
          className="back-button" 
          onClick={() => {
            if (navigatingRef.current) return;
            navigatingRef.current = true;
            navigate('/context');
            setTimeout(() => { navigatingRef.current = false; }, 1000);
          }}
          aria-label="Back to Home"
        >
          ←
        </button>

        <div className="button-container">
          {/* ✅ SỬA: Create text post → /create-post/text */}
          <button
            className="post-button"
            onClick={handleCreateTextPost}
            aria-label="Create text post"
          >
            Create text post
          </button>
          
          {/* ✅ SỬA: Create voice post → /create-post/audio */}
          <button
            className="post-button"
            onClick={handleCreateVoicePost}
            aria-label="Create voice post"
          >
            Create voice post
          </button>
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
          ariaLabel="Prayer Hub"
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
          ariaLabel="Add Friend"
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

export default CreatePostScreen;
