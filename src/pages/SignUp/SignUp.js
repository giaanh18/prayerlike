// src/pages/SignUp/SignUp.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAPI from '../../services/authApi';

import LoginBackground from '../../components/LoginBackground/LoginBackground';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import FormInput from '../../components/FormInput/FormInput';
import ActionButton from '../../components/ActionButton/ActionButton';
import Step2Terms from './steps/Step2_Terms';
import Step4Transition from './steps/Step4_Transition';
import Step5TribeInfo from './steps/Step5_TribeInfo';
import Step6TribeSelection from './steps/Step6_TribeSelection';

// ✅ IMPORT API SERVICE
import authService from '../../services/authService';

import logoImage from '../../assets/images/pray-logo.png';
import './SignUp.css';

const SignUp = ({ onSignUpComplete }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Nhận data từ login hoặc OAuth callback
  const verifiedEmail = location.state?.email || '';
  const verificationCode = location.state?.verificationCode || '';
  const sessionData = location.state?.sessionData || null;
  const provider = location.state?.provider || 'email'; // ✅ THÊM
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: verifiedEmail,
    termsAccepted: false,
    emailVerified: true,
    tribe: null,
    provider: provider // ✅ THÊM
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========================================
  // 📝 FORM HANDLERS
  // ========================================
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // ========================================
  // ✅ VALIDATION
  // ========================================
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.userId.trim()) {
      newErrors.userId = '請輸入 User ID';
    } else if (formData.userId.length < 3) {
      newErrors.userId = 'User ID 必須至少 3 個字元';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.userId)) {
      newErrors.userId = 'User ID 只能包含英文、數字、底線和連字號';
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入您的名稱';
    } else if (formData.name.length < 2) {
      newErrors.name = '名稱必須至少 2 個字元';
    }

    if (!formData.email.trim()) {
      newErrors.email = '請輸入 Email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email 格式不正確';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========================================
  // 🔄 NAVIGATION HANDLERS
  // ========================================
  const handleNext = () => {
    if (validateForm()) {
      console.log('✅ Step 1 Data:', formData);
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/login');
    } else if (currentStep !== 4) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && currentStep !== 4) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ========================================
  // 📍 STEP HANDLERS
  // ========================================
  const handleStep2Next = (termsData) => {
    setFormData(prev => ({ 
      ...prev, 
      ...termsData,
      termsAccepted: true // ✅ SỬA: Đảm bảo termsAccepted = true
    }));
    console.log('✅ Step 2 Data:', termsData);
    console.log('✅ Moving to Step 4 (Transition)');
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

  const handleStep6Next = () => {
    console.log('✅ Step 6 Data:', formData.tribe);
    handleFinalComplete();
  };

  const handleFinalComplete = async () => {
    setIsSubmitting(true);

    try {
      console.log('📡 呼叫 /auth/profile (POST)...');
      console.log('📊 Data to send:', {
        name: formData.name,
        user_id: formData.userId
      });
      
      const updateResult = await AuthAPI.updateProfile(formData.name, formData.userId);
      console.log('✅ Profile updated successfully:', updateResult);

      console.log('📡 呼叫 /auth/profile (GET)...');
      const profile = await AuthAPI.getProfile();
      console.log('👤 Profile data:', profile);
      
      const finalData = { 
        id: profile.user_id || formData.userId,
        name: profile.name || formData.name,
        email: formData.email,
        avatar: profile.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=667eea&color=fff`,
        token: sessionData?.app_token || 'session-token',
        loginMethod: formData.provider === 'oauth' ? 'oauth' : 'email_verification', // ✅ SỬA
        tribe: formData.tribe
      };
      
      console.log('🎉 FINAL SIGN UP DATA:', finalData);
      
      localStorage.setItem('userData', JSON.stringify(finalData));
      
      if (typeof onSignUpComplete === 'function') {
        console.log('✅ 呼叫 onSignUpComplete，自動登入...');
        onSignUpComplete(finalData);
        
        setTimeout(() => {
          navigate('/main', { replace: true });
        }, 500);
      } else {
        console.error('❌ onSignUpComplete is not a function');
        alert('註冊成功！請重新登入。');
        navigate('/login');
      }

    } catch (error) {
      console.error('💥 更新 profile 失敗:', error);
      
      let errorMessage = '註冊失敗，請稍後再試';
      
      if (error.message.includes('Unauthorized')) {
        errorMessage = 'Session 已過期，請重新登入';
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========================================
  // 🎨 RENDER STEPS
  // ========================================
  const renderStep1 = () => (
    <div className="signup-content">
      <BrandLogo logoSrc={logoImage} size="medium" />
      
      <div className="signup-form">
        <div className="input-group">
          <FormInput
            type="text"
            placeholder="USER ID"
            value={formData.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            className="signup-input"
            disabled={isSubmitting}
          />
          {errors.userId && <span className="error-text">{errors.userId}</span>}
          <small style={{ color: '#999', fontSize: '11px', marginTop: '3px', display: 'block' }}>
            3-30 個字元，僅限英文、數字、底線和連字號
          </small>
        </div>

        {/* NAME */}
        <div className="input-group">
          <FormInput
            type="text"
            placeholder="ENTER YOUR NAME"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="signup-input"
            disabled={isSubmitting}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
          <small style={{ color: '#999', fontSize: '11px', marginTop: '3px', display: 'block' }}>
            您的顯示名稱（2-50 個字元）
          </small>
        </div>

        {/* EMAIL */}
        <div className="input-group">
          <FormInput
            type="email"
            placeholder="EMAIL ADDRESS"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="signup-input"
            disabled={isLoading || !!verifiedEmail} // ✅ SỬA: Nếu đã có email từ login thì disable
            autoComplete="email"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
          <small style={{ color: '#999', fontSize: '11px', marginTop: '3px', display: 'block' }}>
            {verifiedEmail ? '✅ Email 已驗證' : '我們將發送驗證郵件到此地址'}
          </small>
        </div>
        
        {/* CREATE ACCOUNT BUTTON */}
        <ActionButton
          onClick={handleNext}
          variant="primary"
          size="medium"
          className="create-account-button"
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {isLoading ? '處理中...' : 'Create account'}
        </ActionButton>

        {/* BACK TO LOGIN */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
              padding: '5px 10px'
            }}
            disabled={isLoading}
          >
            已有帳號？返回登入
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      
      case 2:
        return (
          <Step2Terms 
            onNext={handleStep2Next}
            onBack={handleBack}
          />
        );
      
      case 4:
        return (
          <Step4Transition 
            onComplete={handleStep4Complete}
          />
        );
      
      case 5:
        return (
          <Step5TribeInfo 
            formData={formData}
            updateFormData={updateFormData}
            nextStep={handleStep5Next}
            prevStep={prevStep}
          />
        );
      
      case 6:
        return (
          <Step6TribeSelection 
            formData={formData}
            updateFormData={updateFormData}
            nextStep={handleStep6Next}
            prevStep={prevStep}
            isLoading={isLoading}
          />
        );
      
      default:
        return renderStep1();
    }
  };

  // ========================================
  // 🎯 MAIN RENDER
  // ========================================
  const shouldShowProgress = currentStep === 1 || currentStep === 2;

  return (
    <LoginBackground gradientColors={['#142049', '#848484', '#FFDF9E']}>
      <div className="signup-container">
        {shouldShowProgress && (
          <div className="signup-progress">
            <div className={`progress-dot ${currentStep >= 1 ? 'active' : ''}`}></div>
            <div className={`progress-dot ${currentStep >= 2 ? 'active' : ''}`}></div>
          </div>
        )}
        
        {renderCurrentStep()}

        {/* ✅ LOADING OVERLAY */}
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              minWidth: '200px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '15px',
                animation: 'spin 1s linear infinite'
              }}>⏳</div>
              <div style={{ 
                fontSize: '16px', 
                color: '#333',
                fontWeight: '500'
              }}>處理中，請稍候...</div>
            </div>
          </div>
        )}
      </div>
    </LoginBackground>
  );
};

export default SignUp;
