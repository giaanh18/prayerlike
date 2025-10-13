import React, { useState } from 'react';
import ActionButton from '../../../components/ActionButton/ActionButton';
import './Step2_Terms.css';

const Step2_Terms = ({ onNext, onBack }) => {
  const [agreed, setAgreed] = useState(false);

  const requiredPermissions = [
    { icon: '📡', text: 'Internet access' },
    { icon: '⬇️', text: 'Download content' },
    { icon: '🔄', text: 'Sync preferences' },
    { icon: '🖥️', text: 'Display content' }
  ];

  const optionalPermissions = [
    { icon: '📷', text: 'Camera (QR scan)' },
    { icon: '🔔', text: 'Notifications' },
    { icon: '📍', text: 'Location services' }
  ];

  const handleContinue = () => {
    if (!agreed) {
      alert('Vui lòng đồng ý với điều khoản và chính sách bảo mật');
      return;
    }
    console.log('Step 2 - Terms accepted');
    onNext({ termsAgreed: true, agreedAt: new Date().toISOString() });
  };

  const handleDetailClick = () => {
    console.log('Show permission details');
  };

  return (
    <div className="step2-container">
      {/* ✅ NÚT CHỈ HIỂN THỊ - KHÔNG CÓ HÀNH ĐỘNG */}
      <div className="terms-display-button">
        TERM & PRIVACY
      </div>

      {/* Required Permissions Box */}
      <div className="permissions-box">
        <div className="permissions-header">
          <span className="key-icon">🔑</span>
          <span className="header-text">REQUIRED PERMISSIONS</span>
        </div>
        
        <div className="permissions-list">
          {requiredPermissions.map((perm, index) => (
            <div key={index} className="permission-item">
              <span className="permission-icon">{perm.icon}</span>
              <span className="permission-text">{perm.text}</span>
            </div>
          ))}
        </div>

        {/* Optional Permissions */}
        <div className="optional-section">
          <div className="optional-header">
            <span className="star-icon">⭐</span>
            <span className="optional-text">Optional Permissions</span>
          </div>
          
          <div className="permissions-list">
            {optionalPermissions.map((perm, index) => (
              <div key={index} className="permission-item">
                <span className="permission-icon">{perm.icon}</span>
                <span className="permission-text">{perm.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Link */}
        <div className="detail-link" onClick={handleDetailClick}>
          detail... &gt;
        </div>
      </div>

      {/* Agreement Checkbox */}
      <div className="agreement-section">
        <label className="custom-checkbox">
          <input 
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span className="checkmark"></span>
          <span className="checkbox-label">I agree to terms and privacy policy</span>
        </label>
      </div>

      {/* Continue Button */}
      <div className="step2-buttons">
        <ActionButton 
          onClick={handleContinue}
          variant="primary"
          size="medium"
          className="continue-button"
          disabled={!agreed}
        >
          CONTINUE
        </ActionButton>
      </div>
    </div>
  );
};

export default Step2_Terms;
