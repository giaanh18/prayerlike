// src/components/UserHeader/UserHeader.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ THÊM
import AvatarImage from '../AvatarImage/AvatarImage';
import ApiService from '../../services/api';
import './UserHeader.css';

const UserHeader = ({ 
  user,
  coins = 0,
  tribeLogo,
  tribeName,
  familyIcon,
  blessingIcon,
  blessingText = null,
  onNotificationClick,
  onCoinClick,
  onLogoClick,
  onTribeLogoClick,
  onFamilyClick,
  onBlessingClick,
  notificationCount = 0
}) => {
  const navigate = useNavigate(); // ✅ THÊM

  const getUserName = () => {
    if (!user) return 'Guest';
    return user.displayName || 
           user.name || 
           user.username || 
           user.email?.split('@')[0] || 
           'Guest';
  };

  // ✅ LẤY USER ID CHO AVATAR
  const getUserId = () => {
    return user?.id || user?.userId || user?.uid || user?.email;
  };

  // ✅ THÊM: Handle click vào avatar để vào Profile
  const handleAvatarClick = () => {
    const userId = getUserId();
    console.log('👤 Avatar clicked in UserHeader, navigating to profile:', userId);
    navigate('/profile', { 
      state: { 
        userId: userId
      } 
    });
  };

  const isNotTribe = tribeName === 'not tribe';
  const displayTribeName = tribeName || 'TRIBE';
  const tribeLogoStyle = isNotTribe ? { backgroundColor: '#D9D9D9' } : {};
  const processedAvatarUrl = ApiService.processAvatarUrl(user?.avatar_url || user?.avatar);

  return (
    <div className="user-header">
      {/* 第一行: 頭像 + 名稱 | 通知 + 金幣 */}
      <div className="header-row-1">
        <div className="user-info-section">
          {/* ✅ SỬA: Thêm onClick để navigate đến Profile */}
          <div 
            className="user-avatar-large" 
            onClick={handleAvatarClick}
            style={{ cursor: 'pointer' }}
            title="View Profile"
          >
            <AvatarImage
              userId={getUserId()}
              userName={getUserName()}
              src={processedAvatarUrl}
              size={64}
              clickable={false} // ✅ Set false vì đã có onClick wrapper
              editable={false}  // ✅ Không cho edit ở đây, chỉ edit trong Profile page
            />
          </div>

          <div className="user-name-tag">
             {getUserName()}
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="notification-btn"
            onClick={onNotificationClick}
            aria-label="Notifications"
          >
            <svg viewBox="0 0 24 24" className="notification-icon">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
            </svg>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          <button 
            className="coin-display"
            onClick={onCoinClick}
            aria-label="Coins"
          >
            <div className="coin-icon">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#FFD700"/>
                <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#8B6F47">¥</text>
              </svg>
            </div>
            <span className="coin-amount">{coins.toLocaleString()}</span>
          </button>
        </div>
      </div>

      {/* 第二行: 部落 Logo | 2 個圓形按鈕 */}
      <div className="header-row-2">
        <button 
          className="tribe-section"
          onClick={onTribeLogoClick || onLogoClick}
          aria-label={`${displayTribeName.toUpperCase()} Tribe`}
          style={{ cursor: tribeLogo ? 'pointer' : 'default' }}
        >
          <div 
            className="tribe-logo-circle" 
            style={tribeLogoStyle}
          >
            {tribeLogo && (
              <img 
                src={tribeLogo} 
                alt={displayTribeName}
                className="tribe-logo-img"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/60/8B4513/FFFFFF?text=R';
                }}
              />
            )}
          </div>
          <span className="tribe-name">
            {displayTribeName.toUpperCase()}
          </span>
        </button>

        <div className="tribe-actions">
          {/* Family 按鈕 */}
          <button 
            className="tribe-action-btn"
            onClick={onFamilyClick}
            title="Family & Community"
          >
            {familyIcon ? (
              <img src={familyIcon} alt="Family" className="tribe-action-icon-img" />
            ) : (
              <svg viewBox="0 0 24 24" className="tribe-action-icon">
                <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM18 10C16.9 10 16 10.9 16 12C16 13.1 16.9 14 18 14C19.1 14 20 13.1 20 12C20 10.9 19.1 10 18 10ZM6 10C4.9 10 4 10.9 4 12C4 13.1 4.9 14 6 14C7.1 14 8 13.1 8 12C8 10.9 7.1 10 6 10ZM12 4C10.34 4 9 5.34 9 7C9 8.66 10.34 10 12 10C13.66 10 15 8.66 15 7C15 5.34 13.66 4 12 4ZM6 16C4.34 16 3 17.34 3 19C3 20.66 4.34 22 6 22C7.66 22 9 20.66 9 19C9 17.34 7.66 16 6 16ZM18 16C16.34 16 15 17.34 15 19C15 20.66 16.34 22 18 22C19.66 22 21 20.66 21 19C21 17.34 19.66 16 18 16Z" fill="currentColor"/>
              </svg>
            )}
          </button>

          {/* Blessing/Logout 按鈕 */}
          <button 
            className={blessingText ? "tribe-action-btn logout-button" : "tribe-action-btn"}
            onClick={onBlessingClick}
            title="Logout"
          >
            <span style={{ 
              color: '#8B6F47',      // 設定為與金幣文字相同的深棕色
              fontSize: '10px',      // 稍微縮小字體以適應圓圈
              fontWeight: 'bold',    // 加粗讓文字更清晰
              lineHeight: '1' 
            }}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
