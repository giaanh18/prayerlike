// ./src/components/BrandLogo/BrandLogo.js
import React from 'react';
import './BrandLogo.css';

const BrandLogo = ({ logoSrc, size = 'medium', className = '' }) => {
  return (
    <div className={`brand-logo brand-logo--${size} ${className}`}>
      <div className="brand-logo__card">
        <div className="brand-logo__image-container">
          <img 
            src={logoSrc} 
            alt="Pray Like Incense Logo" 
            className="brand-logo__image"
          />
        </div>
      </div>
    </div>
  );
};

export default BrandLogo;
