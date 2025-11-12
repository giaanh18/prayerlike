// ./src/components/UserHeader/UserHeader.js
import React from 'react';
import './UserHeader.css';

const UserHeader = ({ 
  user,
  coins = 0,
  tribeLogo,
  tribeName,
  familyIcon,
  blessingIcon,
  onNotificationClick,
  onCoinClick,
  onLogoClick,
  onFamilyClick,
  onBlessingClick,
  notificationCount = 0
}) => {
  const getUserName = () => {
    if (!user) return 'Guest';
    return user.displayName || 
           user.name || 
           user.username || 
           user.email?.split('@')[0] || 
           'Guest';
  };

  // ✅ 處理頭像
  const getAvatarUrl = () => {
    if (user?.avatar) return user.avatar;
    if (user?.photoURL) return user.photoURL;
    
    const name = getUserName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4A5F8C&color=fff&size=128`;
  };

  const isNotTribe = tribeName === 'not tribe';
  
  const displayTribeName = tribeName || 'TRIBE';
  const tribeLogoStyle = isNotTribe ? { backgroundColor: '#D9D9D9' } : {};
  // ==================== 【修改結束】 ====================


  return (
    <div className="user-header">
      {/* 第一行: 頭像 + 名稱 | 通知 + 金幣 */}
      <div className="header-row-1">
        <div className="user-info-section">
          <div className="user-avatar-large">
            <img
              src={getAvatarUrl()}
              alt="User Avatar"
              className="avatar-img"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=User&background=4A5F8C&color=fff&size=128`;
              }}
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
            onClick={onLogoClick}
            aria-label={`${displayTribeName.toUpperCase()} Tribe`}
        >
          {/* ✅ 【修改】將樣式套用在 Logo 圓圈上 */}
          <div 
            className="tribe-logo-circle" 
            style={tribeLogoStyle}
          >
            
            {/* ✅ 【修改】只有在 tribeLogo 存在時才顯示 img */}
            {/* 這樣當 tribeLogo 為 null 時，背景色 #D9D9D9 才能顯示 */}
            {tribeLogo && (
              <img 
                src={tribeLogo} 
                alt={displayTribeName}
                className="tribe-logo-img"
                onError={(e) => {
                  // 如果圖片加載失敗，顯示一個 'R' (Reuben) 備用
                  e.target.src = 'https://via.placeholder.com/60/8B4513/FFFFFF?text=R';
                }}
              />
            )}
            {/* 當 tribeLogo 為 null 時，這裡什麼都不渲染 */}
            
          </div>
          <span 
            className="tribe-name"
          >
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
                // ✅ 如果有傳入圖片，使用圖片
                <img src={familyIcon} alt="Family" className="tribe-action-icon-img" />
            ) : (
                // ✅ 否則使用預設 SVG
                <svg viewBox="0 0 24 24" className="tribe-action-icon">
                    <path d="M12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM18 10C16.9 10 16 10.9 16 12C16 13.1 16.9 14 18 14C19.1 14 20 13.1 20 12C20 10.9 19.1 10 18 10ZM6 10C4.9 10 4 10.9 4 12C4 13.1 4.9 14 6 14C7.1 14 8 13.1 8 12C8 10.9 7.1 10 6 10ZM12 4C10.34 4 9 5.34 9 7C9 8.66 10.34 10 12 10C13.66 10 15 8.66 15 7C15 5.34 13.66 4 12 4ZM6 16C4.34 16 3 17.34 3 19C3 20.66 4.34 22 6 22C7.66 22 9 20.66 9 19C9 17.34 7.66 16 6 16ZM18 16C16.34 16 15 17.34 15 19C15 20.66 16.34 22 18 22C19.66 22 21 20.66 21 19C21 17.34 19.66 16 18 16Z" fill="currentColor"/>
                </svg>
            )}
          </button>

          {/* Blessing 按鈕 */}
          <button 
              className="tribe-action-btn"
              onClick={onBlessingClick}
              title="Blessings & Luck"
          >
            {blessingIcon ? (
                // ✅ 如果有傳入圖片，使用圖片
                <img src={blessingIcon} alt="Blessing" className="tribe-action-icon-img" />
            ) : (
                // ✅ 否則使用預設 SVG
                <svg viewBox="0 0 24 24" className="tribe-action-icon">
                    <path d="M17.5 12C19.43 12 21 10.43 21 8.5C21 6.57 19.43 5 17.5 5C16.37 5 15.37 5.54 14.74 6.38L12 9.88L9.26 6.38C8.63 5.54 7.63 5 6.5 5C4.57 5 3 6.57 3 8.5C3 10.43 4.57 12 6.5 12C7.21 12 7.87 11.79 8.42 11.43L12 14.5L15.58 11.43C16.13 11.79 16.79 12 17.5 12ZM6.5 7C7.33 7 8 7.67 8 8.5C8 9.33 7.33 10 6.5 10C5.67 10 5 9.33 5 8.5C5 7.67 5.67 7 6.5 7ZM17.5 7C18.33 7 19 7.67 19 8.5C19 9.33 18.33 10 17.5 10C16.67 10 16 9.33 16 8.5C16 7.67 16.67 7 17.5 7ZM12 16L7 20H17L12 16Z" fill="currentColor"/>
                </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;