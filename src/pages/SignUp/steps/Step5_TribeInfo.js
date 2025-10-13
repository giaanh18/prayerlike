import React, { useState } from 'react';
import './Step5_TribeInfo.css';

// ✅ IMPORT TỪ src/assets/images
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
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // ✅ SỬ DỤNG BIẾN ĐÃ IMPORT THAY VÌ ĐƯỜNG DẪN STRING
  const tribes = [
    { 
      id: 1, 
      name: 'Judah', 
      icon: judahIcon, // ✅ Sử dụng biến đã import
      description: 'Chi phái Judah - Sư tử của Đức Chúa Trời',
      details: 'Judah là chi phái hoàng gia, từ đó Đấng Mê-si ra đời. Biểu tượng là sư tử, đại diện cho sức mạnh và lãnh đạo.',
      color: '#D4AF37'
    },
    { 
      id: 2, 
      name: 'Reuben', 
      icon: reubenIcon,
      description: 'Chi phái Reuben - Con trưởng',
      details: 'Reuben là con trưởng của Jacob, biểu tượng là nước chảy, đại diện cho sự bất ổn nhưng cũng là nguồn sống.',
      color: '#C85A54'
    },
    { 
      id: 3, 
      name: 'Gad', 
      icon: gadIcon,
      description: 'Chi phái Gad - Chiến binh dũng cảm',
      details: 'Gad là chi phái chiến binh, biểu tượng là quân đội, đại diện cho sức mạnh và lòng dũng cảm trong chiến đấu.',
      color: '#6B8E23'
    },
    { 
      id: 4, 
      name: 'Asher', 
      icon: asherIcon,
      description: 'Chi phái Asher - Phước hạnh dồi dào',
      details: 'Asher là chi phái phước hạnh, biểu tượng là cây ô-liu, đại diện cho sự giàu có và thịnh vượng.',
      color: '#8FBC8F'
    },
    { 
      id: 5, 
      name: 'Naphtali', 
      icon: naphtaliIcon,
      description: 'Chi phái Naphtali - Nai cái tự do',
      details: 'Naphtali là chi phái tự do, biểu tượng là nai cái, đại diện cho sự nhanh nhẹn và tự do.',
      color: '#5F9EA0'
    },
    { 
      id: 6, 
      name: 'Manasseh', 
      icon: manassehIcon,
      description: 'Chi phái Manasseh - Quên đi khổ đau',
      details: 'Manasseh là chi phái của sự quên lãng nỗi đau, biểu tượng là cây nho, đại diện cho sự tái sinh.',
      color: '#4682B4'
    },
    { 
      id: 7, 
      name: 'Simeon', 
      icon: simeonIcon,
      description: 'Chi phái Simeon - Đức Chúa Trời đã nghe',
      details: 'Simeon là chi phái của sự nghe lời, biểu tượng là thanh kiếm, đại diện cho công lý và sự báo thù.',
      color: '#708090'
    },
    { 
      id: 8, 
      name: 'Levi', 
      icon: leviIcon,
      description: 'Chi phái Levi - Thầy tế lễ',
      details: 'Levi là chi phái thầy tế lễ, biểu tượng là bộ ngực và vai, đại diện cho sự phục vụ Đức Chúa Trời.',
      color: '#4169E1'
    },
    { 
      id: 9, 
      name: 'Issachar', 
      icon: issacharIcon,
      description: 'Chi phái Issachar - Phần thưởng',
      details: 'Issachar là chi phái của sự hiểu biết thời đại, biểu tượng là con lừa, đại diện cho sự chăm chỉ.',
      color: '#6495ED'
    },
    { 
      id: 10, 
      name: 'Zebulun', 
      icon: zebulunIcon,
      description: 'Chi phái Zebulun - Nơi ở',
      details: 'Zebulun là chi phái của thương mại, biểu tượng là con tàu, đại diện cho sự thịnh vượng qua buôn bán.',
      color: '#87CEEB'
    },
    { 
      id: 11, 
      name: 'Joseph', 
      icon: josephIcon,
      description: 'Chi phái Joseph - Thêm vào',
      details: 'Joseph là chi phái của sự thịnh vượng, biểu tượng là bó lúa, đại diện cho sự sinh sôi và phước hạnh.',
      color: '#DDA0DD'
    },
    { 
      id: 12, 
      name: 'Benjamin', 
      icon: benjaminIcon,
      description: 'Chi phái Benjamin - Con của tay phải',
      details: 'Benjamin là chi phái của sức mạnh, biểu tượng là con sói, đại diện cho sự dũng cảm và chiến đấu.',
      color: '#9370DB'
    },
  ];

  const handleTribeClick = (tribe) => {
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

  return (
    <div className="tribe-info-container">
      {!showDetail ? (
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
<div className="tribe-detail-view">
  <div className="tribe-detail-header">
    <button className="back-btn" onClick={handleBackToList}>
      ←
    </button>
  </div>

  <div className="tribe-detail-content">
    {/* ✅ THÊM wrapper mới */}
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
    {/* ✅ KẾT THÚC wrapper */}
    
    <p className="tribe-detail-description">{selectedTribe.description}</p>
    
    <div className="tribe-detail-info">
      <h3>Thông tin chi tiết:</h3>
      <p>{selectedTribe.details}</p>
    </div>
  </div>
</div>

      )}
    </div>
  );
};

export default Step5_TribeInfo;
