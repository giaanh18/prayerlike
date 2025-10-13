import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginBackground from '../../components/LoginBackground/LoginBackground';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import FormInput from '../../components/FormInput/FormInput';
import ActionButton from '../../components/ActionButton/ActionButton';
import Step2_Terms from './steps/Step2_Terms';
import Step3_VerifyEmail from './steps/Step3_VerifyEmail';
import Step4_Transition from './steps/Step4_Transition';
import Step5_TribeInfo from './steps/Step5_TribeInfo';
import Step6_TribeSelection from './steps/Step6_TribeSelection';
import logoImage from '../../assets/images/pray-logo.png';
import './SignUp.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    name: '',
    termsAccepted: false,
    emailVerified: false,
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
      newErrors.userId = 'Vui lòng nhập User ID';
    } else if (formData.userId.length < 3) {
      newErrors.userId = 'User ID phải có ít nhất 3 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập Email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên của bạn';
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
    setFormData(prev => ({ ...prev, ...termsData }));
    console.log('✅ Step 2 Data:', termsData);
    setCurrentStep(3);
  };

  const handleStep3Next = () => {
    setFormData(prev => ({ ...prev, emailVerified: true }));
    console.log('✅ Step 3: Email verified');
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
    const finalData = { ...formData };
    console.log('🎉 FINAL SIGN UP DATA:', finalData);
    
    localStorage.setItem('userData', JSON.stringify(finalData));
    
    alert(
      '🎉 ĐĂNG KÝ THÀNH CÔNG!\n\n' +
      '📋 Thông tin tài khoản:\n' +
      `👤 User ID: ${finalData.userId}\n` +
      `📧 Email: ${finalData.email}\n` +
      `✨ Tên: ${finalData.name}\n` +
      `🏛️ Chi phái: ${finalData.tribe?.name || 'Không chọn'}\n\n` +
      'Vui lòng đăng nhập để tiếp tục!'
    );
    
    navigate('/login');
  };

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

        <div className="input-group">
          <FormInput
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className="signup-input"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
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
      case 3:
        return (
          <Step3_VerifyEmail 
            email={formData.email}
            onNext={handleStep3Next}
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
            formData={formData}           // ✅ Thêm
            updateFormData={updateFormData} // ✅ Thêm
            nextStep={handleStep5Next}    // ✅ Đổi onNext → nextStep
            prevStep={prevStep}           // ✅ Đổi onBack → prevStep
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
            <div className={`progress-dot ${currentStep >= 3 ? 'active' : ''}`}></div>
          </div>
        )}
        
        {renderCurrentStep()}
      </div>
    </LoginBackground>
  );
};

export default SignUp;
