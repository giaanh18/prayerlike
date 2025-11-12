// ./src/pages/SignUp/steps/Step5_TribeInfo.js
import React, { useState, useEffect } from 'react';
import './Step5_TribeInfo.css';

// ✅ IMPORT TỪ src/assets/images (您的原始導入，皆予以保留)
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


const Step5_TribeInfo = ({ formData, updateFormData, nextStep, prevStep }) => {
  // --- 狀態管理 ---
  const [tribes, setTribes] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [selectedTribe, setSelectedTribe] = useState(null); 
  const [showDetail, setShowDetail] = useState(false); 

  // --- 數據獲取與整合 ---
  useEffect(() => {
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

    const fetchAndMergeTribes = async () => {
      try {
        const response = await fetch('https://pray-api.yalinelena.church/auth/profile/tribes');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const apiData = await response.json();

        // ✅ 新增：在 Console 中印出從 API 收到的原始資料
        console.log('--- API Response Received ---', apiData);

        const mergedTribes = localTribesData.map(localTribe => {
          const apiTribe = apiData.tribes.find(t => t.code === localTribe.id);
          return {
            ...localTribe,
            details: apiTribe ? apiTribe.label : 'Description not available.',
          };
        });
        
        // ✅ 新增：在 Console 中印出合併後的最終資料
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

  // --- 事件處理函式 ---
  const handleTribeClick = (tribe) => {
    // ✅ 新增：在 Console 中印出當前點擊的支派物件
    console.log('--- Tribe Clicked ---', tribe);
    setSelectedTribe(tribe);
    setShowDetail(true);
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedTribe(null);
  };

  const handleImageError = (e) => {
    console.error('Không load được ảnh:', e.target.src);
    e.target.style.display = 'none';
  };

  // --- 渲染邏輯 ---
  if (isLoading) {
    return <div className="loading-container">Loading Spiritual Tribes...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className="tribe-info-container">
      {!showDetail ? (
        // --- 支派列表視圖 ---
        <>
          <div className="tribe-info-header">
            <button className="back-btn" onClick={prevStep}>
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

          <div className="tribe-info-buttons">
            <button className="continue-btn" onClick={nextStep}>
              CONTINUE
            </button>
          </div>
        </>
      ) : (
        // --- 支派詳情視圖 (已根據您的圖片和需求調整) ---
        <div className="tribe-detail-view">
          <div className="tribe-detail-header">
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
            
            {/* ✅ 修改：下半部：僅顯示從 API 來的介紹文字 */}
            <div className="tribe-detail-info">
              <p>{selectedTribe.details}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step5_TribeInfo;