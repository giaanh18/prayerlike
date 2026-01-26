import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TribesList.css';

// 導入圖示
import prayLogo from '../../../assets/images/pray-logo.png';
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

// 導入底部導航圖示
import Home from '../../../assets/icons/Homeicon.png';
import Search from '../../../assets/icons/Searchicon.png';
import Add from '../../../assets/icons/Addicon.png';
import Profile from '../../../assets/icons/Profileicon.png';
import Nova from '../../../assets/icons/Nova.png';

// 導入元件
import CircleButton from '../../../components/CircleButton/CircleButton';
import AppBackground from '../../../components/AppBackground/AppBackground';

// ✅ NHẬN THÊM PROPS: onTribeSelected và user
const TribesList = ({ onBack, onTribeSelected, user }) => {
  const navigate = useNavigate();
  
  // --- 狀態管理 ---
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 支派資料
  const tribes = [
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

  // --- 分頁邏輯 ---
  const tribesPerPage = 6;
  const totalPages = Math.ceil(tribes.length / tribesPerPage);
  const currentTribes = tribes.slice(
    currentPage * tribesPerPage,
    (currentPage + 1) * tribesPerPage
  );

  // --- 事件處理函式 ---
  const handleTribeSelect = (tribe) => {
    setSelectedTribe(tribe);
    console.log('🔘 [TribesList] 使用者點選了 Tribe:', {
      id: tribe.id,
      name: tribe.name
    });
  };

  const handleContinue = () => {
    if (selectedTribe) {
      console.log('➡️ [TribesList] 點擊 "CONTINUE"，開啟確認 Modal');
      setShowWarning(true);
    } else {
      alert('⚠️ 請先選擇一個支派！');
    }
  };

  // ✅ API 提交函式
  const handleTribeSubmission = async (tribeData) => {
    const tribeId = tribeData?.id;

    if (!tribeId) {
      console.log('🟡 [TribesList] 沒有選擇 Tribe，跳過 API 提交。');
      return true;
    }

    const apiEndpoint = 'https://pray-api.yalinelena.church/auth/profile/tribe';
    const postData = { tribe: tribeId };

    console.log(`🚀 [TribesList] 準備發送 API 請求...`);
    console.log(`   [TribesList] API: POST ${apiEndpoint}`);
    console.log(`   [TribesList] Body: ${JSON.stringify(postData)}`);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(postData),
        credentials: 'include',
        mode: 'cors'
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`🔴 [TribesList] API 請求失敗 (Status: ${response.status})。回應:`, responseText);
        if (response.status === 401 || response.status === 404) {
          throw new Error(`(Status ${response.status}) 會話過期或帳號不存在 (Tribe)。`);
        }
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.message || `API 錯誤：無法儲存支派 (${response.status})`);
        } catch (e) {
          throw new Error(`API 錯誤 (Status ${response.status})，無法解析 JSON 回應 (Tribe)。`);
        }
      }

      console.log('✅ [TribesList] API 請求成功。回應:', responseText);
      return true;

    } catch (error) {
      console.error('💥 [TribesList] 儲存支派時發生 JavaScript 錯誤:', error);
      throw error;
    }
  };

  // ✅ 確認按鈕處理（使用 callback 而不是 reload）
  const handleConfirm = async () => {
    if (isLoading) return;

    console.log('✅ [TribesList] 在 Modal 中點擊 "agree" (handleConfirm 觸發)');
    console.log('🔎 [TribesList] 選定的 Tribe 資料:', selectedTribe);

    setIsLoading(true);

    try {
      // ✅ 1. 呼叫 API 更新支派
      console.log('📤 [TribesList] 準備呼叫 handleTribeSubmission...');
      await handleTribeSubmission(selectedTribe);
      console.log('✅ [TribesList] handleTribeSubmission 完成');

      // ✅ 2. 更新本地 userData
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          userData.tribe = selectedTribe.id;
          localStorage.setItem('userData', JSON.stringify(userData));
          console.log('💾 [TribesList] 本地 userData 已更新:', userData);
        } catch (e) {
          console.error('❌ [TribesList] 無法解析 localStorage 的 userData:', e);
        }
      }

      // ✅ 3. 關閉 Modal
      setShowWarning(false);

      console.log('🔙 [TribesList] 支派更新成功');

      // ✅ 4. 呼叫 callback 通知 MainApp 更新 UI
      if (onTribeSelected) {
        console.log('📢 [TribesList] 呼叫 onTribeSelected callback...');
        await onTribeSelected(selectedTribe.id);
      }

      // ✅ 5. 返回上一頁（MainApp 會自動顯示新的 tribe）
      if (onBack) {
        onBack();
      }

    } catch (error) {
      console.error('💥 [TribesList] 更新支派失敗:', error);

      let errorMessage = error.message || '未知錯誤';

      // 處理會話過期的情況
      if (error.message.includes('Unauthorized') || 
          error.message.includes('Session') || 
          error.message.includes('會話過期')) {
        errorMessage = '會話已過期，請重新登入。';
        alert(`❌ ${errorMessage}`);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
        return;
      }

      alert(`❌ 更新支派失敗\n\n錯誤訊息：${errorMessage}\n\n請稍後再試或聯繫管理員`);

    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    console.log('↩️ [TribesList] 在 Modal 中點擊 "cancel"');
    setShowWarning(false);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleImageError = (e) => {
    console.error('❌ 無法載入圖片:', e.target.src);
    e.target.style.display = 'none';
  };

  const handleCreatePost = () => {
    navigate('/create-post', { replace: true });
  };

  const handleLogout = () => {
    navigate('/login', { replace: true });
  };

  // --- 渲染邏輯 ---
  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="tribe-selection-container">
        {/* Header */}
        <div className="tribe-selection-header">
          <button className="back-btn" onClick={onBack} disabled={isLoading}>
            ←
          </button>
          <div className="tribe-title-section">
            <div className="center-icon">
              <img 
                src={prayLogo} 
                alt="Pray"
                onError={handleImageError}
              />
            </div>
            <h2 className="main-title">Discover Your Spiritual Heritage</h2>
            <p className="sub-title">Choose from 12 Sacred Tribes</p>
          </div>
        </div>

        {/* 支派選擇網格 */}
        <div className="tribes-selection-grid">
          {currentTribes.map((tribe) => (
            <div
              key={tribe.id}
              className={`tribe-item ${selectedTribe?.id === tribe.id ? 'selected' : ''}`}
              onClick={() => !isLoading && handleTribeSelect(tribe)}
            >
              <div 
                className="tribe-coin"
                style={{ backgroundColor: tribe.color }}
              >
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

        {/* 分頁控制 */}
        <div className="pagination-controls">
          <button
            className="page-arrow left-arrow"
            onClick={handlePrevPage}
            disabled={currentPage === 0 || isLoading}
          >
            ◀
          </button>
          <div className="page-indicators">
            {Array.from({ length: totalPages }).map((_, index) => (
              <span
                key={index}
                className={`page-dot ${currentPage === index ? 'active' : ''}`}
              />
            ))}
          </div>
          <button
            className="page-arrow right-arrow"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1 || isLoading}
          >
            ▶
          </button>
        </div>

        {/* Continue 按鈕 */}
        <div className="tribe-selection-buttons">
          <button 
            className="continue-btn" 
            onClick={handleContinue} 
            disabled={isLoading || !selectedTribe}
          >
            CONTINUE
          </button>
        </div>

        {/* ✅ Warning Modal */}
        {showWarning && (
          <div className="warning-modal-overlay">
            <div className="warning-modal-new">
              <h2 className="modal-title">Your Sacred Calling</h2>
              <div className="modal-card">
                <h3 className="card-title">FINAL WARNING</h3>
                <p className="card-subtitle">
                  Your Selection <span className="highlight-tribe">"{selectedTribe?.name}"</span>
                </p>
                <p className="card-warning">PLEASE READ CAREFULLY</p>
                <div className="warning-list">
                  <div className="warning-item">
                    <span className="warning-icon">🚫</span>
                    <span>No changes allowed</span>
                  </div>
                  <div className="warning-item">
                    <span className="warning-icon">🚫</span>
                    <span>No second chances</span>
                  </div>
                  <div className="warning-item">
                    <span className="warning-icon">🚫</span>
                    <span>No undo option</span>
                  </div>
                </div>
                <p className="final-text">This is your final choice</p>
                <p className="think-text">Think twice before confirming</p>
              </div>
              <div className="modal-buttons">
                <button 
                  className="cancel-btn-new" 
                  onClick={handleCancel} 
                  disabled={isLoading}
                >
                  cancel
                </button>
                <button 
                  className="agree-btn-new" 
                  onClick={handleConfirm} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'agree'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 底部導航列 */}
        <div className="bottom-navigation">
          <CircleButton
            provider="Home"
            iconSrc={Home}
            onClick={() => navigate('/context')}
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

        {/* ✅ Loading Overlay */}
        {isLoading && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'white', padding: '40px', borderRadius: '16px',
              textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              minWidth: '200px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px', animation: 'spin 1s linear infinite' }}>⏳</div>
              <div style={{ fontSize: '16px', color: '#333', fontWeight: '500' }}>處理中，請稍候...</div>
            </div>
          </div>
        )}
      </div>
    </AppBackground>
  );
};

export default TribesList;
