// ./src/components/CoinDisplay/CoinDisplay.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CoinDisplay.css';

const CoinDisplay = ({ 
  amount = 0,
  onClick,
  size = 'medium',
  className = '' 
}) => {
  const navigate = useNavigate();

  const sizeClasses = {
    small: 'coin-display-small',
    medium: 'coin-display-medium',
    large: 'coin-display-large'
  };

  const formatAmount = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const handleClick = (e) => {
    console.log('💰💰💰 COIN CLICKED - NAVIGATING TO YB HISTORY 💰💰💰');
    
    // Gọi onClick từ props nếu có
    if (onClick) {
      onClick(e);
    }
    
    // Navigate đến trang YB History
    try {
      navigate('/yb-history');
      console.log('✅ Navigate called successfully');
    } catch (error) {
      console.error('❌ Navigate error:', error);
    }
  };

  return (
    <button
      className={`coin-display ${sizeClasses[size]} ${className}`}
      onClick={handleClick}
      aria-label={`金幣: ${amount}`}
      title="查看 YB 歷史記錄"
      type="button"
    >
      <span className="coin-icon">🪙</span>
      <span className="coin-amount">{formatAmount(amount)}</span>
    </button>
  );
};

export default CoinDisplay;
