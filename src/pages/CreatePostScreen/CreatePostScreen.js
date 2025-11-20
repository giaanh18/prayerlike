import React, { useState } from 'react'; // ✅ 引入 useState
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
  
  // ✅ 新增: 頁籤狀態管理，進入此頁面時預設 "Add" 為激活狀態
  const [activeTab, setActiveTab] = useState('Add');

  // ✅ Handler functions
  const handleCreatePost = () => {
    console.log('🆕 Already on create post page');
    setActiveTab('Add'); // 確保保持在 Add 狀態
  };

  const handleHome = () => {
    console.log('🏠 Navigate to home');
    setActiveTab('Home'); // 視覺上切換
    navigate('/'); // 跳轉回首頁
  };

  const handleSearch = () => {
    console.log('🔍 Search clicked');
    setActiveTab('Search'); // 視覺上切換
    alert('功能開發中');
  };

  const handleProfile = () => {
    console.log('👤 Profile clicked');
    setActiveTab('Profile'); // 視覺上切換
    alert('功能開發中');
  };

  const handleLogout = async () => {
    console.log('🚪 Logout clicked');
    setActiveTab('Nova'); // 視覺上切換
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

      {/* ✅ BOTTOM NAVIGATION - 使用 isActive 控制黃色樣式 */}
      <div className="bottom-navigation">
        <CircleButton
          provider="Home"
          iconSrc={Home}
          onClick={handleHome}
          isActive={activeTab === 'Home'} // ✅ 判斷狀態
          size="medium"
          ariaLabel="首頁"
        />
        <CircleButton
          provider="Search"
          iconSrc={Search}
          onClick={handleSearch}
          isActive={activeTab === 'Search'} // ✅ 判斷狀態
          size="medium"
          ariaLabel="搜尋"
        />
        <CircleButton
          provider="Add"
          iconSrc={Add}
          onClick={handleCreatePost}
          isActive={activeTab === 'Add'} // ✅ 預設為 true，顯示黃色大按鈕
          size="medium"
          ariaLabel="新增貼文"
        />
        <CircleButton
          provider="Profile"
          iconSrc={Profile}
          onClick={handleProfile}
          isActive={activeTab === 'Profile'} // ✅ 判斷狀態
          size="medium"
          ariaLabel="個人資料"
        />
        <CircleButton
          provider="Nova"
          iconSrc={Nova}
          onClick={handleLogout}
          isActive={activeTab === 'Nova'} // ✅ 判斷狀態
          size="medium"
          ariaLabel="nova小天使"
        />
      </div>
    </div>
  );
};

export default CreatePostScreen;