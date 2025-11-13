// ./src/pages/Context/steps/TribesIntroduction.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TribesIntroduction.css';

// 導入支派圖示
import judahIcon from '../../../assets/images/tribes/judah.png';
import reubenIcon from '../../../assets/images/tribes/reuben.png';
import gadIcon from '../../../assets/images/tribes/gad.png';
import asherIcon from '../../../assets/images/tribes/asher.png';
import naphtaliIcon from '../../../assets/images/tribes/naphtali.png';
import manassehIcon from '../../../assets/images/tribes/manasseh.png';
import simeonIcon from '../../../assets/images/tribes/simeon.png';
import leviIcon from '../../../assets/images/tribes/levi.png';
import issacharIcon from '../../../assets/images/tribes/issachar.png';
import zebulunIcon from '../../../assets/images/tribes/zebulun.png';
import josephIcon from '../../../assets/images/tribes/joseph.png';
import benjaminIcon from '../../../assets/images/tribes/benjamin.png';

// 導入 pray-logo
import prayLogo from '../../../assets/images/pray-logo.png';

// 導入底部導航圖示
import Home from '../../../assets/icons/Homeicon.png';
import Search from '../../../assets/icons/Searchicon.png';
import Add from '../../../assets/icons/Addicon.png';
import Profile from '../../../assets/icons/Profileicon.png';
import Nova from '../../../assets/icons/Nova.png';

// 導入元件
import CircleButton from '../../../components/CircleButton/CircleButton';
import AppBackground from '../../../components/AppBackground/AppBackground';

const TribesIntroduction = ({ onBack }) => {
  const navigate = useNavigate();
  
  // 狀態管理
  const [tribes, setTribes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // 本地支派資料
  const localTribesData = [
    { id: 1, name: 'Judah', icon: judahIcon, color: '#D4AF37' },
    { id: 2, name: 'Reuben', icon: reubenIcon, color: '#C85A54' },
    { id: 3, name: 'Gad', icon: gadIcon, color: '#6B8E23' },
    { id: 4, name: 'Asher', icon: asherIcon, color: '#8FBC8F' },
    { id: 5, name: 'Naphtali', icon: naphtaliIcon, color: '#5F9EA0' },
    { id: 6, name: 'Manasseh', icon: manassehIcon, color: '#4682B4' },
    { id: 7, name: 'Simeon', icon: simeonIcon, color: '#708090' },
    { id: 8, name: 'Levi', icon: leviIcon, color: '#4169E1' },
    { id: 9, name: 'Issachar', icon: issacharIcon, color: '#6495ED' },
    { id: 10, name: 'Zebulun', icon: zebulunIcon, color: '#87CEEB' },
    { id: 11, name: 'Joseph', icon: josephIcon, color: '#DDA0DD' },
    { id: 12, name: 'Benjamin', icon: benjaminIcon, color: '#9370DB' },
  ];

  // 獲取並合併支派資料
  useEffect(() => {
    const fetchAndMergeTribes = async () => {
      try {
        const response = await fetch('https://pray-api.yalinelena.church/auth/profile/tribes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiData = await response.json();
        console.log('--- API Response Received ---', apiData);

        const mergedTribes = localTribesData.map(localTribe => {
          const apiTribe = apiData.tribes.find(t => t.code === localTribe.id);
          return {
            ...localTribe,
            details: apiTribe ? apiTribe.label : 'Description not available.',
          };
        });
        
        console.log('--- Merged Tribe Data for UI ---', mergedTribes);
        setTribes(mergedTribes);
      } catch (e) {
        console.error("Failed to fetch or merge tribes data:", e);
        setError("Could not load tribe information. Please try again later.");
        setTribes(localTribesData.map(t => ({ ...t, details: 'Failed to load details.' })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndMergeTribes();
  }, []);

  // 事件處理
  const handleTribeClick = (tribe) => {
    console.log('--- Tribe Clicked ---', tribe);
    setSelectedTribe(tribe);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedTribe(null);
  };

  const handleImageError = (e) => {
    console.error('無法載入圖片:', e.target.src);
    e.target.style.display = 'none';
  };

  const handleCreatePost = () => {
    navigate('/create-post', { replace: true });
  };

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  // 渲染邏輯
  if (isLoading) {
    return (
      <AppBackground backgroundColor="#2D3656">
        <div className="loading-container">Loading Spiritual Tribes...</div>
      </AppBackground>
    );
  }

  if (error) {
    return (
      <AppBackground backgroundColor="#2D3656">
        <div className="error-container">Error: {error}</div>
      </AppBackground>
    );
  }

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="tribe-info-container">
        {!showDetail ? (
          // ===== 支派列表視圖 =====
          <>
            <div className="tribe-info-header">
              {/* ✅ 新增返回鍵 */}
              <button className="back-btn" onClick={onBack}>
                ←
              </button>
              <div className="tribe-title-section">
                <span className="choose-text">CHOOSE YOUR</span>
                <div className="center-icon-round">
                  <img 
                    src={prayLogo} 
                    alt="Pray"
                    onError={handleImageError}
                  />
                </div>
                <span className="spiritual-text">SPIRITUAL TRIBE</span>
              </div>
            </div>

            {/* 支派網格 */}
            <div className="tribes-info-grid">
              {tribes.map((tribe) => (
                <div
                  key={tribe.id}
                  className="tribe-item"
                  onClick={() => handleTribeClick(tribe)}
                >
                  <div className="tribe-coin" style={{ backgroundColor: tribe.color }}>
                    <img 
                      src={tribe.icon} 
                      alt={tribe.name}
                      onError={handleImageError}
                    />
                  </div>
                  <span className="tribe-label">{tribe.name}</span>
                </div>
              ))}
            </div>

            {/* ✅ 移除 CONTINUE 按鈕 */}
          </>
        ) : (
          // ===== 支派詳情視圖 =====
          <div className="tribe-detail-view">
            <div className="tribe-detail-header">
              {/* ✅ 保留詳情視圖的返回鍵 */}
              <button className="back-btn" onClick={handleBackToList}>
                ←
              </button>
            </div>

            <div className="tribe-detail-content">
              {/* 上半部：圖示與名稱 */}
              <div className="tribe-detail-header-row">
                <div className="tribe-detail-icon" style={{ backgroundColor: selectedTribe.color }}>
                  <img 
                    src={selectedTribe.icon} 
                    alt={selectedTribe.name}
                    onError={handleImageError}
                  />
                </div>
                <h2 className="tribe-detail-name">{selectedTribe.name}</h2>
              </div>
              
              {/* 下半部：介紹文字 */}
              <div className="tribe-detail-info">
                <p>{selectedTribe.details}</p>
              </div>
            </div>
          </div>
        )}

        {/* 底部導航列 */}
        <div className="bottom-navigation">
          <CircleButton
            provider="Home"
            iconSrc={Home}
            onClick={() => navigate('/main')}
            size="medium"
            ariaLabel="首頁"
          />
          <CircleButton
            provider="Search"
            iconSrc={Search}
            onClick={() => console.log('Search')}
            size="medium"
            ariaLabel="搜尋"
          />
          <CircleButton
            provider="Add"
            iconSrc={Add}
            onClick={handleCreatePost}
            size="medium"
            ariaLabel="新增貼文"
          />
          <CircleButton
            provider="Profile"
            iconSrc={Profile}
            onClick={() => console.log('Profile')}
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
    </AppBackground>
  );
};

export default TribesIntroduction;
