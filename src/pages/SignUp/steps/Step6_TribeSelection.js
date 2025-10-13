import React, { useState } from 'react';
import './Step6_TribeSelection.css';

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

const Step6_TribeSelection = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [selectedTribe, setSelectedTribe] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0 = trang 1, 1 = trang 2

  // ✅ SỬ DỤNG BIẾN IMPORT THAY VÌ STRING PATH
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

  // Chia thành 2 trang, mỗi trang 6 chi phái
  const tribesPerPage = 6;
  const totalPages = Math.ceil(tribes.length / tribesPerPage);
  const currentTribes = tribes.slice(
    currentPage * tribesPerPage,
    (currentPage + 1) * tribesPerPage
  );

  const handleTribeSelect = (tribe) => {
    setSelectedTribe(tribe);
  };

  const handleContinue = () => {
    if (selectedTribe) {
      setShowWarning(true);
    } else {
      alert('⚠️ Vui lòng chọn một chi phái!');
    }
  };

  const handleSkipAll = () => {
    updateFormData({ tribe: null });
    nextStep();
  };

  const handleConfirm = () => {
    updateFormData({ tribe: selectedTribe });
    nextStep();
  };

  const handleCancel = () => {
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

  // ✅ HÀM XỬ LÝ LỖI ẢNH
  const handleImageError = (e) => {
    console.error('Không load được ảnh:', e.target.src);
    e.target.style.display = 'none';
  };

  return (
    <div className="tribe-selection-container">
      <div className="tribe-selection-header">
        <button className="back-btn" onClick={prevStep}>
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

      {/* Grid 2x3 (6 chi phái) */}
      <div className="tribes-selection-grid">
        {currentTribes.map((tribe) => (
          <div
            key={tribe.id}
            className={`tribe-item ${selectedTribe?.id === tribe.id ? 'selected' : ''}`}
            onClick={() => handleTribeSelect(tribe)}
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

      {/* Nút chuyển trang */}
      <div className="pagination-controls">
        <button
          className="page-arrow left-arrow"
          onClick={handlePrevPage}
          disabled={currentPage === 0}
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
          disabled={currentPage === totalPages - 1}
        >
          ▶
        </button>
      </div>

      {/* Nút hành động */}
      <div className="tribe-selection-buttons">
        <button className="continue-btn" onClick={handleContinue}>
          CONTINUE
        </button>
        <button className="skip-btn" onClick={handleSkipAll}>
          [no need to select]
        </button>
      </div>

      {/* Warning Modal */}
{/* ✅ Warning Modal - Thiết kế mới */}
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
        <button className="cancel-btn-new" onClick={handleCancel}>
          cancel
        </button>
        <button className="agree-btn-new" onClick={handleConfirm}>
          agree
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default Step6_TribeSelection;
