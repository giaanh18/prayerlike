// src/pages/SignUp/steps/Step4_Transition.js
import React, { useEffect, useState } from 'react';
import transitionImage from '../../../assets/images/transition-prayer.png';
import './Step4_Transition.css';

const Step4_Transition = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Sau 4.5 giây bắt đầu fade out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Sau 5 giây chuyển sang bước tiếp theo
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`step4-fullscreen ${fadeOut ? 'fade-out' : ''}`}>
      <img 
        src={transitionImage} 
        alt="Prayer Transition" 
        className="fullscreen-image"
      />
    </div>
  );
};

export default Step4_Transition;
