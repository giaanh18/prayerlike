import React from 'react';
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

  // ✅ Handler functions
  const handleCreatePost = () => {
    console.log('🆕 Already on create post page');
    // Có thể scroll to top hoặc refresh
  };

  const handleHome = () => {
    console.log('🏠 Navigate to home');
    navigate('/');
  };

  const handleSearch = () => {
    console.log('🔍 Search clicked');
    alert('功能開發中');
  };

  const handleProfile = () => {
    console.log('👤 Profile clicked');
    alert('功能開發中');
  };

  const handleLogout = async () => {
    console.log('🚪 Logout clicked');
    if (onLogout) {
      await onLogout();
    }
    navigate('/login', { replace: true });
  };

  return (
    <div className="create-post-page">
      <div className="centered-layout">
        {/* ✅ NÚT BACK VỀ TRANG CONTEXT (Route /) */}
        <button 
          className="back-button" 
          onClick={() => navigate('/')} 
          aria-label="返回首頁"
        >
          ←
        </button>

        <div className="button-container">
          <button
            className="post-button"
            onClick={() => navigate('/create-post/text')}
            aria-label="建立文字貼文"
          >
            Create text post
          </button>
          
          <button
            className="post-button"
            onClick={() => navigate('/create-post/audio', { 
              state: { autoStart: true }
            })}
            aria-label="建立音訊貼文"
          >
            Create voice post
          </button>
        </div>
      </div>

      {/* ✅ BOTTOM NAVIGATION - THÊM TRỰC TIẾP */}
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
          className="nav-active"  // ✅ Active state vì đang ở trang create
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
          onClick={handleLogout}
          size="medium"
          ariaLabel="nova小天使"
        />
      </div>
    </div>
  );
};

export default CreatePostScreen;
