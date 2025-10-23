// ./src/components/CategoryLabel/CategoryLabel.js
import React from 'react';
import './CategoryLabel.css';

const CategoryLabel = ({ text }) => {
  return (
    <div className="category-label-wrapper">
      <div className="category-label-arrow"></div>
      <div className="category-label">
        <span className="category-label-text">{text}</span>
      </div>
    </div>
  );
};

export default CategoryLabel;
