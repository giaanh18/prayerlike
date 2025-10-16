// ./src/components/CategoryLabel/CategoryLabel.js
import React, { useRef, useEffect, useState } from 'react';
import './CategoryLabel.css';

const CategoryLabel = ({ 
  text,
  speed = 10  // Tốc độ (giây)
}) => {
  const textRef = useRef(null);
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    if (textRef.current) {
      // ✅ Đo chính xác độ rộng của text
      const width = textRef.current.offsetWidth;
      setTextWidth(width);
    }
  }, [text]);

  return (
    <div className="category-label-wrapper">
      <div className="category-label-arrow"></div>
      <div className="category-label">
        <div 
          className="category-label-scroll-container"
          style={{ 
            '--text-width': `${textWidth}px`,
            '--animation-duration': `${speed}s`
          }}
        >
          {/* ✅ Text gốc để đo kích thước */}
          <span ref={textRef} className="category-label-text category-label-text-measure">
            {text}
          </span>
          
          {/* ✅ Text chạy animation */}
          <div className="category-label-scroll">
            <span className="category-label-text">{text}</span>
            <span className="category-label-text">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryLabel;
