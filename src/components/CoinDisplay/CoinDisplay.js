// ./src/components/CoinDisplay/CoinDisplay.js
import React from 'react';
import './CoinDisplay.css';

const CoinDisplay = ({ 
  amount = 0,
  onClick,
  size = 'medium',
  className = '' 
}) => {
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

  return (
    <button
      className={`coin-display ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      aria-label={`金幣: ${amount}`}
    >
      <span className="coin-icon">🪙</span>
      <span className="coin-amount">{formatAmount(amount)}</span>
    </button>
  );
};

export default CoinDisplay;
