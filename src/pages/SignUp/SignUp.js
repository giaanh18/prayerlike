import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  
  const verifiedEmail = location.state?.email || '';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: verifiedEmail,
    termsAccepted: false,
    emailVerified: !!verifiedEmail, // ✅ SỬA: Nếu có email từ login thì đã verified
    tribe: null
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  // ========================================
  // 🎉 FINAL COMPLETION - GỌI API
  // ========================================
  const handleFinalComplete = async () => {
    setIsLoading(true);
    
    try {
      // ✅ Validate dữ liệu cuối cùng
      if (!formData.email || !formData.email.trim()) {
        alert('❌ 請輸入 Email 地址');
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }

      if (!formData.userId || !formData.userId.trim()) {
        alert('❌ 請輸入 User ID');
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }

      if (!formData.name || !formData.name.trim()) {
        alert('❌ 請輸入名稱');
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }

      // ✅ Chuẩn bị data để gửi lên API
      const signupData = {
        userId: formData.userId.trim(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        termsAccepted: formData.termsAccepted,
        tribe: formData.tribe ? {
          id: formData.tribe.id,
          name: formData.tribe.name
        } : null
      };

      console.log('📤 Sending signup data to API:', signupData);

      // ✅ GỌI API ĐĂNG KÝ (gửi email verification)
      const result = await authService.register(signupData);
      
      console.log('✅ API Response:', result);

      // ✅ Kiểm tra kết quả
      if (result.success) {
        // Đăng ký thành công, cần verify email
        if (result.requireEmailVerification) {
          console.log('📧 Email verification required');
          
          // ✅ CHUYỂN ĐẾN TRANG CHECK EMAIL
          navigate('/check-email', { 
            state: { 
              email: formData.email,
              message: result.message || '我們已發送驗證郵件到您的信箱',
              userData: signupData // ✅ THÊM: Truyền userData để hiển thị
            },
            replace: true
          });
        } else {
          // Trường hợp không cần verify (hiếm khi xảy ra)
          console.log('✅ Registration complete without email verification');
          
          const finalData = {
            ...formData,
            id: result.data?.userId || formData.userId,
            userId: result.data?.userId || formData.userId,
            avatar: result.data?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=667eea&color=fff`,
            token: result.data?.token,
            loginMethod: 'email_verification',
            emailVerified: true,
            registeredAt: new Date().toISOString()
          };

          // Lưu vào localStorage
          localStorage.setItem('userData', JSON.stringify(finalData));
          localStorage.setItem('currentUser', JSON.stringify(finalData));
          localStorage.setItem('isAuthenticated', 'true');

          console.log('✅ User data saved:', finalData);

          // Gọi callback
          if (typeof onSignUpComplete === 'function') {
            onSignUpComplete(finalData);
          }

          // Redirect
          navigate('/main', { replace: true });
        }
      } else {
        // Đăng ký thất bại
        throw new Error(result.error || '註冊失敗');
      }

    } catch (error) {
      console.error('❌ Signup Error:', error);
      
      // ✅ Xử lý lỗi chi tiết
      let errorMessage = '註冊失敗，請稍後再試';
      let shouldGoBackToStep1 = false;

      // ✅ Kiểm tra loại lỗi
      if (error.message) {
        errorMessage = error.message;
        
        // Các lỗi liên quan đến email/userId
        if (error.message.includes('Email') || 
            error.message.includes('email') ||
            error.message.includes('已被使用')) {
          shouldGoBackToStep1 = true;
          setErrors({ email: errorMessage });
        } else if (error.message.includes('User ID') || 
                   error.message.includes('userId')) {
          shouldGoBackToStep1 = true;
          setErrors({ userId: errorMessage });
        } else if (error.message.includes('Name') || 
                   error.message.includes('name')) {
          shouldGoBackToStep1 = true;
          setErrors({ name: errorMessage });
        }
      }

      if (error.response) {
        // Server trả về lỗi
        const status = error.response.status;
        const data = error.response.data;

        switch (status) {
          case 400:
            errorMessage = data?.detail || data?.message || '資料格式錯誤';
            shouldGoBackToStep1 = true;
            break;
          
          case 409:
            errorMessage = 'User ID 或 Email 已被使用';
            shouldGoBackToStep1 = true;
            setErrors({ 
              userId: 'User ID 可能已被使用',
              email: 'Email 可能已被使用'
            });
            break;
          
          case 422:
            errorMessage = '資料驗證失敗，請檢查輸入格式';
            shouldGoBackToStep1 = true;
            break;
          
          case 500:
            errorMessage = '伺服器錯誤，請稍後再試';
            break;
          
          default:
            errorMessage = data?.detail || data?.message || `錯誤代碼: ${status}`;
        }
      } else if (error.request) {
        // Không nhận được response
        errorMessage = '無法連接到伺服器\n請檢查網路連線';
      }

      // Hiển thị lỗi
      alert('❌ 註冊失敗\n\n' + errorMessage);

      // Quay lại step 1 nếu cần
      if (shouldGoBackToStep1) {
        setCurrentStep(1);
      }

    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // 🎨 RENDER STEPS
  // ========================================
  const renderStep1 = () => (
    <div className="signup-content">
      <BrandLogo logoSrc={logoImage} size="medium" />
      
      <div className="signup-form">
        {/* USER ID */}
        <div className="input-group">
          <FormInput
            type="text"
            placeholder="USER ID"
            value={formData.userId}
            onChange={(e) => handleChange('userId', e.target.value)}
            className="signup-input"
            disabled={isLoading}
            autoComplete="username"
            maxLength={30}
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
            disabled={isLoading}
            autoComplete="name"
            maxLength={50}
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
          disabled={isLoading}
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
