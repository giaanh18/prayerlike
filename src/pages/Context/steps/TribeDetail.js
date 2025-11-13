// ./src/pages/Context/steps/TribeDetail.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TribeDetail.css';

// 導入底部導航圖示（與 Context.js 相同）
import Home from '../../../assets/icons/Homeicon.png';
import Search from '../../../assets/icons/Searchicon.png';
import Add from '../../../assets/icons/Addicon.png';
import Profile from '../../../assets/icons/Profileicon.png';
import Nova from '../../../assets/icons/Nova.png';

// 導入 CircleButton 元件
import CircleButton from '../../../components/CircleButton/CircleButton';
import AppBackground from '../../../components/AppBackground/AppBackground';

const TribeDetail = ({ tribeId, tribeName, tribeIcon, onBack }) => {
  const navigate = useNavigate();
  const [tribeDetails, setTribeDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 支派顏色對照表（與 Step5 一致）
  const tribeColors = {
    1: '#D4AF37', // Judah
    2: '#C85A54', // Reuben
    3: '#6B8E23', // Gad
    4: '#8FBC8F', // Asher
    5: '#5F9EA0', // Naphtali
    6: '#4682B4', // Manasseh
    7: '#708090', // Simeon
    8: '#4169E1', // Levi
    9: '#6495ED', // Issachar
    10: '#87CEEB', // Zebulun
    11: '#DDA0DD', // Joseph
    12: '#9370DB', // Benjamin
  };

  useEffect(() => {
    const fetchTribeDetails = async () => {
      if (!tribeId) {
        setError('無支派資訊');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔍 正在獲取支派 ${tribeId} 的詳細資訊...`);
        const response = await fetch('https://pray-api.yalinelena.church/auth/profile/tribes');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiData = await response.json();
        console.log('--- API Response Received ---', apiData);
        
        const tribeInfo = apiData.tribes.find(t => t.code === tribeId);
        
        if (tribeInfo) {
          setTribeDetails({
            id: tribeId,
            name: tribeName,
            icon: tribeIcon,
            description: tribeInfo.label,
            color: tribeColors[tribeId] || '#808080',
            status: 'Active' // ✅ 新增狀態欄位
          });
          console.log('✅ 支派資訊載入成功:', tribeInfo);
        } else {
          throw new Error('找不到對應的支派資訊');
        }
      } catch (e) {
        console.error("❌ 獲取支派資訊失敗:", e);
        setError(`無法載入支派資訊: ${e.message}`);
        // 使用預設資料
        setTribeDetails({
          id: tribeId,
          name: tribeName,
          icon: tribeIcon,
          description: '支派詳細資訊暫時無法取得，請稍後再試。',
          color: tribeColors[tribeId] || '#808080',
          status: 'Active' // ✅ 新增狀態欄位
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTribeDetails();
  }, [tribeId, tribeName, tribeIcon]);

  // ✅ 修正返回邏輯
  const handleBack = () => {
    console.log('🔙 返回主頁面');
    if (onBack) {
      // 如果有傳入 onBack 回調函數，使用它
      onBack();
    } else {
      // 否則導航到 /main
      navigate('/main', { replace: true });
    }
  };

  const handleCreatePost = () => {
    console.log('🆕 導向新增貼文頁面...');
    navigate('/create-post', { replace: true });
  };

  const handleLogout = () => {
    console.log('🚪 登出');
    navigate('/login', { replace: true });
  };

  const handleImageError = (e) => {
    console.error('圖片載入失敗:', e.target.src);
    e.target.style.display = 'none';
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <AppBackground backgroundColor="#2D3656">
        <div className="tribe-detail-wrapper">
          <div className="tribe-info-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading Tribe Information...</p>
            </div>
          </div>
        </div>
      </AppBackground>
    );
  }

  // 錯誤狀態
  if (error && !tribeDetails) {
    return (
      <AppBackground backgroundColor="#2D3656">
        <div className="tribe-detail-wrapper">
          <div className="tribe-info-container">
            <div className="error-container">
              <h3>❌ {error}</h3>
              <button className="back-btn" onClick={handleBack}>
                ← 返回
              </button>
            </div>
          </div>
        </div>
      </AppBackground>
    );
  }

  // 主要內容
  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="tribe-detail-wrapper">
        <div className="tribe-info-container">
          <div className="tribe-detail-view">
            {/* 頂部返回按鈕 */}
            <div className="tribe-detail-header">
              <button className="back-btn" onClick={handleBack}>
                ←
              </button>
            </div>

            {/* 支派內容 */}
            <div className="tribe-detail-content">
              {/* ✅ 上半部：圖示與名稱 + 狀態 */}
              <div className="tribe-detail-header-row">
                {/* 左側：圖示 */}
                <div 
                  className="tribe-detail-icon" 
                  style={{ backgroundColor: tribeDetails.color }}
                >
                  {tribeDetails.icon ? (
                    <img 
                      src={tribeDetails.icon} 
                      alt={tribeDetails.name}
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="tribe-icon-placeholder">
                      {tribeDetails.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* ✅ 右側：名稱 + 狀態 */}
                <div className="tribe-detail-text-section">
                  <h2 className="tribe-detail-name">{tribeDetails.name}</h2>
                  <div className="tribe-detail-status">Status: {tribeDetails.status}</div>
                </div>
              </div>
              
              {/* 下半部：支派說明（白色卡片） */}
              <div className="tribe-detail-info">
                <p>{tribeDetails.description}</p>
              </div>
            </div>
          </div>

          {/* ✅ 底部導航列（與 Context.js 相同） */}
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
      </div>
    </AppBackground>
  );
};

export default TribeDetail;
