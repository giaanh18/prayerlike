// ./src/components/AppBackground/AppBackground.js
import React from 'react';
import './AppBackground.css';

const AppBackground = ({ 
  children, 
  backgroundColor = '#3D4A6B',
  className = '' 
}) => {
  const backgroundStyle = {
    backgroundColor: backgroundColor
  };

  return (
    <div 
      className={`app-background ${className}`}
      style={backgroundStyle}
    >
      {children}
    </div>
  );
};

export default AppBackground;
