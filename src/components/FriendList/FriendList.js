// ./src/components/FriendList/FriendList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import './FriendList.css';

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
      
      if (!userId) {
        throw new Error('無法取得使用者 ID');
      }

      if (viewMode === 'friends') {
        const result = await ApiService.getFriends(userId);
        if (result.success) {
          setFriends(result.friends || []);
        } else {
          throw new Error(result.message || '載入好友列表失敗');
        }
      } else {
        const result = await ApiService.getFamily(userId);
        if (result.success) {
          setFamily(result.family || []);
        } else {
          throw new Error(result.message || '載入家族列表失敗');
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
    alert(`查看 ${person.name} 的個人資料 (功能開發中)`);
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
      {/* ✅ HEADER */}
      <div className="fl-header">
        <button className="fl-back-button" onClick={() => navigate(-1)}>
          ← 
        </button>
        <h1 className="fl-page-title">
          {viewMode === 'friends' ? '好友列表' : '家族列表'}
        </h1>
      </div>

      {/* ✅ VIEW MODE TOGGLE */}
      <div className="fl-view-toggle">
        <button 
          className={`fl-toggle-btn ${viewMode === 'friends' ? 'active' : ''}`}
          onClick={() => setViewMode('friends')}
        >
          👥 好友
        </button>
        <button 
          className={`fl-toggle-btn ${viewMode === 'family' ? 'active' : ''}`}
          onClick={() => setViewMode('family')}
        >
          👨‍👩‍👧‍👦 家族
        </button>
      </div>

      {/* ✅ CONTENT */}
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
            <button className="fl-retry-btn" onClick={loadData}>
              重試
            </button>
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
                  {person.avatar ? (
                    <img src={person.avatar} alt={person.name} />
                  ) : (
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random&size=64`}
                      alt={person.name}
                    />
                  )}
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

      {/* ✅ BOTTOM NAVIGATION */}
      <div className="fl-bottom-nav">
        <button 
          className={`fl-nav-btn ${activeTab === 'Home' ? 'active' : ''}`}
          onClick={() => handleTabChange('Home')}
          aria-label="首頁"
        >
          <img src={Home} alt="Home" />
        </button>
        
        <button 
          className={`fl-nav-btn ${activeTab === 'PrayerHub' ? 'active' : ''}`}
          onClick={() => handleTabChange('PrayerHub')}
          aria-label="Prayer Hub"
        >
          <img src={Search} alt="Prayer Hub" />
        </button>
        
        <button 
          className={`fl-nav-btn ${activeTab === 'Add' ? 'active' : ''}`}
          onClick={() => handleTabChange('Add')}
          aria-label="新增貼文"
        >
          <img src={Add} alt="Add" />
        </button>
        
        <button 
          className={`fl-nav-btn ${activeTab === 'Search' ? 'active' : ''}`}
          onClick={() => handleTabChange('Search')}
          aria-label="搜尋"
        >
          <img src={Profile} alt="Profile" />
        </button>
        
        <button 
          className={`fl-nav-btn ${activeTab === 'Nova' ? 'active' : ''}`}
          onClick={() => handleTabChange('Nova')}
          aria-label="nova小天使"
        >
          <img src={Nova} alt="Nova" />
        </button>
      </div>
    </div>
  );
};

export default FriendList;
