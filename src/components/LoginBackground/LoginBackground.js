// ./src/components/LoginBackground/LoginBackground.js
import React from 'react';
import './LoginBackground.css';

const LoginBackground = ({ 
  children, 
  gradientColors = ['#667eea', '#764ba2'],
  className = '' 
}) => {
  const gradientStyle = {
    background: `linear-gradient(135deg, ${gradientColors.join(', ')})`
  };

  return (
    <div 
      className={`login-background ${className}`}
      style={gradientStyle}
    >
      {children}
    </div>
  );
};

export default LoginBackground;
