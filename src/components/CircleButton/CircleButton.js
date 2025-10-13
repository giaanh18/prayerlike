// ./src/components/CircleButton/CircleButton.js
import React from 'react';
import './CircleButton.css';

const CircleButton = ({ 
  provider, 
  iconSrc, 
  onClick, 
  size = 'medium',
  disabled = false,
  ariaLabel // ✅ 新增 aria-label 支援
}) => {
  const sizeClasses = {
    small: 'circle-button-small',
    medium: 'circle-button-medium',
    large: 'circle-button-large'
  };

  return (
    <button
      className={`circle-button ${sizeClasses[size]} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || `${provider} 按鈕`}
    >
      <img 
        src={iconSrc} 
        alt={`${provider} icon`}
        className="circle-button-icon"
      />
    </button>
  );
};

export default CircleButton;
