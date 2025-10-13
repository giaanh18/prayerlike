// src/components/ActionButton/ActionButton.js
import React from 'react';
import './ActionButton.css';

const ActionButton = ({ 
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  className = '',
  disabled = false,
  loading = false,
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`action-button action-button--${variant} action-button--${size} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="action-button__spinner"></div>
      ) : (
        children
      )}
    </button>
  );
};

export default ActionButton;
