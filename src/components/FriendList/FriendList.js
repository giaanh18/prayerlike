// ./src/components/FriendList/FriendList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import './FriendList.css';

// 導入 CircleButton
import CircleButton from '../CircleButton/CircleButton';

import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

const FriendList = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ 設定初始狀態為 Profile (對應 Search 圖示的位置)
  const [activeTab, setActiveTab] = useState('Search');
  const [viewMode, setViewMode] = useState('friends');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [viewMode, user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = user?.id || user?.userId || ApiService.getCurrentUserId();
      
      // 即使沒有 userId，也嘗試載入 (可能 api 有 mock 數據)
      if (viewMode === 'friends') {
        const result = await ApiService.getFriends(userId);
        if (result.success) {
          setFriends(result.friends || []);
        }
      } else {
        const result = await ApiService.getFamily(userId);
        if (result.success) {
          setFamily(result.family || []);
        }
      }
    } catch (error) {
      console.error('💥 載入資料錯誤:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonClick = (person) => {
    alert(`查看 ${person.name} 的個人資料`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'Home':
        navigate('/main');
        break;
      case 'PrayerHub':
        navigate('/prayer-hub');
        break;
      case 'Add':
        navigate('/create-post');
        break;
      case 'Search':
        // 已經在好友頁面，不動作
        break;
      case 'Nova':
        if (onLogout) onLogout();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const currentList = viewMode === 'friends' ? friends : family;
  const emptyMessage = viewMode === 'friends' 
    ? '尚無好友，開始添加好友，建立您的禱告網絡！'
    : '尚無家族成員，邀請您的家人加入！';

  return (
    <div className="friend-list-page">
      <div className="fl-header">
        <button className="fl-back-button" onClick={() => navigate('/main')}>
          ← 
        </button>
        <h1 className="fl-page-title">
          {viewMode === 'friends' ? '好友列表' : '家族列表'}
        </h1>
      </div>

      

      <div className="fl-container">
        {loading ? (
          <div className="fl-loading">
            <div className="fl-spinner"></div>
            <p>載入中...</p>
          </div>
        ) : error ? (
          <div className="fl-error">
            <div className="fl-error-icon">⚠️</div>
            <h3>載入失敗</h3>
            <p>{error}</p>
            
          </div>
        ) : currentList.length > 0 ? (
          <div className="fl-grid">
            {currentList.map(person => (
              <div 
                key={person.id} 
                className="fl-card"
                onClick={() => handlePersonClick(person)}
              >
                <div className="fl-avatar">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random&size=64`}
                    alt={person.name}
                  />
                </div>
                <div className="fl-info">
                  <div className="fl-name">{person.name}</div>
                  {person.relationship && (
                    <div className="fl-relationship">{person.relationship}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fl-empty">
            <div className="fl-empty-icon">
              {viewMode === 'friends' ? '👥' : '👨‍👩‍👧‍👦'}
            </div>
            <h3>
              {viewMode === 'friends' ? '尚無好友' : '尚無家族成員'}
            </h3>
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* ✅ 統一底部導航列：使用與 Context 相同的結構與 class */}
      <div className="bottom-navigation">
        <CircleButton 
          provider="Home" 
          iconSrc={Home} 
          onClick={() => handleTabChange('Home')} 
          isActive={activeTab === 'Home'} 
          size="medium" 
          ariaLabel="首頁" 
        />
        <CircleButton 
          provider="PrayerHub" 
          iconSrc={Search} 
          onClick={() => handleTabChange('PrayerHub')} 
          isActive={activeTab === 'PrayerHub'} 
          size="medium" 
          ariaLabel="Prayer Hub" 
        />
        <CircleButton 
          provider="Add" 
          iconSrc={Add} 
          onClick={() => handleTabChange('Add')} 
          isActive={activeTab === 'Add'} 
          size="medium" 
          ariaLabel="新增貼文" 
        />
        <CircleButton 
          provider="Search" 
          iconSrc={Profile} 
          onClick={() => handleTabChange('Search')} 
          isActive={activeTab === 'Search'} 
          size="medium" 
          ariaLabel="個人資料" 
        />
        <CircleButton 
          provider="Nova" 
          iconSrc={Nova} 
          onClick={() => handleTabChange('Nova')} 
          isActive={activeTab === 'Nova'} 
          size="medium" 
          ariaLabel="nova小天使" 
        />
      </div>
    </div>
  );
};

export default FriendList;