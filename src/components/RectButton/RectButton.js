// ./src/components/RectButton/RectButton.js
import React from 'react';
import './RectButton.css';

const RectButton = ({ 
  children,
  icon,
  image, // 新增：圖片 URL
  imageAlt = '', // 新增：圖片替代文字
  onClick,
  variant = 'primary',
  size = 'medium',
  active = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  // 判斷是否有圖示或圖片
  const hasIconOrImage = icon || image;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rect-button rect-button--${variant} rect-button--${size} ${active ? 'active' : ''} ${!children ? 'icon-only' : ''} ${className}`}
      {...props}
    >
      {/* 優先顯示圖片，如果沒有圖片則顯示 icon */}
      {hasIconOrImage && (
        <span className="rect-button-icon">
          {image ? (
            <img 
              src={image} 
              alt={imageAlt} 
              className="rect-button-image"
            />
          ) : (
            icon
          )}
        </span>
      )}
      {children && <span className="rect-button-text">{children}</span>}
    </button>
  );
};

export default RectButton;
