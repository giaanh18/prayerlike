import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import LoginBackground from '../../components/LoginBackground/LoginBackground';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import FormInput from '../../components/FormInput/FormInput';
import ActionButton from '../../components/ActionButton/ActionButton';
import Step2_Terms from './steps/Step2_Terms';
import Step4_Transition from './steps/Step4_Transition';
import Step5_TribeInfo from './steps/Step5_TribeInfo';
import Step6_TribeSelection from './steps/Step6_TribeSelection';

import logoImage from '../../assets/images/pray-logo.png';
import './SignUp.css';

const SignUp = ({ onSignUpComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  
  // ✅ 從 login 頁面接收已驗證的 email（不顯示，但保存在 formData 中）
  const verifiedEmail = location.state?.email || '';
  const verificationCode = location.state?.verificationCode || '';
  
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: verifiedEmail, // ✅ 保存已驗證的 email
    termsAccepted: false,
    emailVerified: true,
    tribe: null
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.userId.trim()) {
      newErrors.userId = '請輸入 User ID';
    } else if (formData.userId.length < 3) {
      newErrors.userId = 'User ID 必須至少 3 個字元';
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入您的名稱';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      console.log('✅ Step 1 Data:', formData);
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/login');
    } else if (currentStep === 4) {
      return;
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStep2Next = (termsData) => {
    setFormData(prev => ({ 
      ...prev, 
      ...termsData,
      emailVerified: true
    }));
    console.log('✅ Step 2 Data:', termsData);
    console.log('✅ Email auto-verified (skipped Step 3)');
    setCurrentStep(4);
  };

  const handleStep4Complete = () => {
    console.log('✅ Step 4: Transition complete');
    setCurrentStep(5);
  };

  const handleStep5Next = () => {
    console.log('✅ Step 5: Viewing tribe info complete');
    setCurrentStep(6);
  };

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const prevStep = () => {
    if (currentStep > 1 && currentStep !== 4) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStep6Next = () => {
    console.log('✅ Step 6 Data:', formData.tribe);
    handleFinalComplete();
  };

  const handleFinalComplete = () => {
    const finalData = { 
      ...formData,
      id: formData.userId,
      avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=667eea&color=fff`,
      token: `signup-token-${Date.now()}`,
      loginMethod: 'email_verification'
    };
    
    console.log('🎉 FINAL SIGN UP DATA:', finalData);
    
    // 儲存到 localStorage
    localStorage.setItem('userData', JSON.stringify(finalData));
    
    // ✅ 呼叫 onSignUpComplete 來更新 App.js 的登入狀態
    if (typeof onSignUpComplete === 'function') {
      console.log('✅ 呼叫 onSignUpComplete，自動登入...');
      onSignUpComplete(finalData);
      
      // 顯示成功訊息後跳轉
      setTimeout(() => {
        navigate('/main', { replace: true });
      }, 500);
    } else {
      console.error('❌ onSignUpComplete is not a function');
      alert('註冊成功！請重新登入。');
      navigate('/login');
    }
  };

  const renderStep1 = () => (
    <div className="signup-content">
      <BrandLogo logoSrc={logoImage} size="medium" />
      
      <div className="signup-form">
        {/* ✅ 移除 Email 顯示，只保留 USER ID 和 NAME */}
        <div className="input-group">
          <FormInput
            type="text"
            placeholder="USER ID"
            value={formData.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            className="signup-input"
          />
          {errors.userId && <span className="error-text">{errors.userId}</span>}
        </div>

        <div className="input-group">
          <FormInput
            type="text"
            placeholder="ENTER YOUR NAME"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="signup-input"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>
        
        <ActionButton
          onClick={handleNext}
          variant="primary"
          size="medium"
          className="create-account-button"
        >
          Create account
        </ActionButton>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return (
          <Step2_Terms 
            onNext={handleStep2Next}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4_Transition 
            onComplete={handleStep4Complete}
          />
        );
      case 5:
        return (
          <Step5_TribeInfo 
            formData={formData}
            updateFormData={updateFormData}
            nextStep={handleStep5Next}
            prevStep={prevStep}
          />
        );
      case 6:
        return (
          <Step6_TribeSelection 
            formData={formData}
            updateFormData={updateFormData}
            nextStep={handleStep6Next}
            prevStep={prevStep}
          />
        );
      default:
        return renderStep1();
    }
  };

  return (
    <LoginBackground gradientColors={['#142049', '#848484', '#FFDF9E']}>
      <div className="signup-container">
        {currentStep > 0 && currentStep !== 4 && currentStep !== 5 && currentStep !== 6 && (
          <div className="signup-progress">
            <div className={`progress-dot ${currentStep >= 1 ? 'active' : ''}`}></div>
            <div className={`progress-dot ${currentStep >= 2 ? 'active' : ''}`}></div>
          </div>
        )}
        
        {renderCurrentStep()}
      </div>
    </LoginBackground>
  );
};

export default SignUp;
