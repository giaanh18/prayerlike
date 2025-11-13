// ./src/pages/Context/steps/NoTribeDetail.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NoTribeDetail.css';

// 導入底部導航圖示
import Home from '../../../assets/icons/Homeicon.png';
import Search from '../../../assets/icons/Searchicon.png';
import Add from '../../../assets/icons/Addicon.png';
import Profile from '../../../assets/icons/Profileicon.png';
import Nova from '../../../assets/icons/Nova.png';

// 導入元件
import CircleButton from '../../../components/CircleButton/CircleButton';
import AppBackground from '../../../components/AppBackground/AppBackground';
import TribesIntroduction from './TribesIntroduction';
import TribesList from './TribesList'; // ✅ 新增

const NoTribeDetail = ({ onBack }) => {
  const navigate = useNavigate();
  
  // 狀態管理
  const [hasViewedIntroduction, setHasViewedIntroduction] = useState(false);
  const [showIntroduction, setShowIntroduction] = useState(false);
  const [showTribesList, setShowTribesList] = useState(false); // ✅ 新增

  // 返回主頁面
  const handleBack = () => {
    console.log('🔙 返回主頁面');
    if (onBack) {
      onBack();
    } else {
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

  // 導向 12 支派介紹頁面
  const handleTribesIntroduction = () => {
    console.log('📖 導向 12 支派介紹');
    setShowIntroduction(true);
    setHasViewedIntroduction(true);
  };

  // 從介紹頁面返回
  const handleBackFromIntroduction = () => {
    setShowIntroduction(false);
  };

  // ✅ 導向 12 支派列表頁面
  const handleTribesList = () => {
    if (!hasViewedIntroduction) {
      console.log('⚠️ 請先查看 Tribes Introduction');
      alert('請先查看 Tribes Introduction');
      return;
    }
    console.log('📋 導向 12 支派列表');
    setShowTribesList(true);
  };

  // ✅ 從列表頁面返回
  const handleBackFromTribesList = () => {
    setShowTribesList(false);
  };

  // ✅ 如果顯示支派列表，則渲染 TribesList
  if (showTribesList) {
    return <TribesList onBack={handleBackFromTribesList} />;
  }

  // 如果顯示介紹頁面，則渲染 TribesIntroduction
  if (showIntroduction) {
    return <TribesIntroduction onBack={handleBackFromIntroduction} />;
  }

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="no-tribe-wrapper">
        <div className="no-tribe-container">
          {/* 返回按鈕 */}
          <button className="back-btn" onClick={handleBack}>
            ←
          </button>

          {/* 主要內容 */}
          <div className="no-tribe-content">
            {/* 上半部：圖示 + 狀態 */}
            <div className="no-tribe-header-row">
              {/* 左側：空白圓形圖示 */}
              <div className="no-tribe-icon">
                <div className="no-tribe-placeholder">?</div>
              </div>

              {/* 右側：狀態資訊（灰色長條） */}
              <div className="no-tribe-info-section">
                <div className="no-tribe-info-box">not have</div>
                <div className="no-tribe-info-box">Status: not Active</div>
              </div>
            </div>

            {/* 下半部：操作按鈕（長條矩形） */}
            <div className="no-tribe-actions">
              {/* Tribes Introduction */}
              <div 
                className={`no-tribe-action-box ${!hasViewedIntroduction ? 'active' : 'disabled'}`}
                onClick={handleTribesIntroduction}
              >
                12 Tribes Introduction
              </div>
              
              {/* Tribes List */}
              <div 
                className={`no-tribe-action-box ${hasViewedIntroduction ? 'active' : 'disabled'}`}
                onClick={handleTribesList}
              >
                12 Tribes List
              </div>
            </div>
          </div>

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
      </div>
    </AppBackground>
  );
};

export default NoTribeDetail;
