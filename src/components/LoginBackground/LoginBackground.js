// ./src/components/LoginBackground/LoginBackground.js
import React from 'react';
import './LoginBackground.css';

const LoginBackground = ({ 
  children, 
  gradientColors = ['#142049', '#848484', '#FFDF9E'],
  className = '' 
}) => {
  const colorStops = [
    `${gradientColors[0] || '#142049'} 0%`,
    `${gradientColors[1] || '#848484'} 50%`,
    `${gradientColors[2] || '#FFDF9E'} 100%`,
  ].join(', ');

  const gradientStyle = {
    background: `linear-gradient(to bottom, ${colorStops})`
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