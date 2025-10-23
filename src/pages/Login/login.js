// src/pages/Login/login.js

// ========================================
// 📦 IMPORT CÁC THƯ VIỆN VÀ COMPONENTS
// ========================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useEmailVerification from '../../hooks/useEmailVerification';
import authService from '../../services/authService';

// Các component UI đã được tái sử dụng
import LoginBackground from '../../components/LoginBackground/LoginBackground';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import FormInput from '../../components/FormInput/FormInput';
import ActionButton from '../../components/ActionButton/ActionButton';
import CircleButton from '../../components/CircleButton/CircleButton';

// Các file ảnh
import logoImage from '../../assets/images/pray-logo.png';
import appleIcon from '../../assets/icons/apple-icon.png';
import facebookIcon from '../../assets/icons/facebook-icon.png';
import googleIcon from '../../assets/icons/google-icon.png';

import './login.css';

// ========================================
// 🎯 COMPONENT CHÍNH
// ========================================

const Login = ({ onLogin }) => {
  
  // ========================================
  // 🔧 KHỞI TẠO HOOKS
  // ========================================
  
  const navigate = useNavigate();

  // ========================================
  // 📊 STATE MANAGEMENT
  // ========================================
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // ✅ State cho OAuth providers
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  
  // ✅ GỘP TẤT CẢ MESSAGE VÀO 1 STATE
  const [message, setMessage] = useState({
    type: '', // 'error' | 'success' | 'login-success'
    text: ''
  });

  // Thời gian đếm ngược mặc định: 90 giây
  const EMAIL_VERIFICATION_COUNTDOWN_DEFAULT_SECONDS = 90;

  // ========================================
  // 🎣 CUSTOM HOOK XỬ LÝ XÁC THỰC EMAIL
  // ========================================
  
  const {
    isVerificationSent,
    isVerificationLoading,
    verificationTimer,
    sendVerificationCode,
    verifyEmailCode,
    resetVerificationState,
  } = useEmailVerification(
    email,
    (errorMsg) => setMessage({ type: 'error', text: errorMsg }),
    () => {},
    EMAIL_VERIFICATION_COUNTDOWN_DEFAULT_SECONDS
  );

  // ========================================
  // ✅ useEffect để load OAuth providers
  // ========================================
  
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    console.log('🔄 Loading OAuth providers...');
    setLoadingProviders(true);
    
    try {
      const result = await authService.getProviders();
      
      console.log('📦 Providers result:', result);
      
      if (result.success && result.providers && result.providers.length > 0) {
        console.log('✅ Available providers:', result.providers);
        
        // ✅ Log chi tiết từng provider
        result.providers.forEach(p => {
          console.log(`  • ${p.display_name || p.name}: ${p.enabled !== false ? 'enabled' : 'disabled'}`);
        });
        
        setProviders(result.providers);
        
        // ✅ Hiển thị warning nếu dùng fallback
        if (result.fallback) {
          console.warn('⚠️ Đang dùng default providers (backend không khả dụng)');
        }
      } else {
        console.error('❌ Failed to load providers:', result.error);
        
        // ✅ Set empty array nếu thất bại hoàn toàn
        setProviders([]);
      }
      
    } catch (error) {
      console.error('❌ Load providers error:', error);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  // ========================================
  // 🔧 HÀM VALIDATE EMAIL
  // ========================================
  
  const validateEmail = (emailToValidate) => {
    if (!emailToValidate) {
      setMessage({ type: 'error', text: '請輸入 Email' });
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      setMessage({ type: 'error', text: '請輸入正確的 Email 格式' });
      return false;
    }
    
    return true;
  };

  // ========================================
  // 🎉 HÀM HIỂN THỊ THÔNG BÁO ĐĂNG NHẬP THÀNH CÔNG
  // ========================================
  
  const showLoginSuccess = (userData) => {
    const messages = {
      'email_verification': '驗證碼登入成功，正在進入系統',
      'oauth': 'OAuth 登入成功，正在進入系統',
      'google': 'Google 登入成功，正在進入系統',
      'facebook': 'Facebook 登入成功，正在進入系統',
      'apple': 'Apple 登入成功，正在進入系統'
    };
    
    const messageKey = userData.loginMethod || userData.provider || 'oauth';
    
    setMessage({
      type: 'login-success',
      text: messages[messageKey] || '登入成功，正在進入系統'
    });
    
    setTimeout(() => {
      setMessage({ type: '', text: '' });
      onLogin(userData);
      
      setTimeout(() => {
        navigate('/main', { replace: true });
      }, 100);
    }, 1000);
  };

  // ========================================
  // 📧 XỬ LÝ KHI NGƯỜI DÙNG THAY ĐỔI EMAIL
  // ========================================
  
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setMessage({ type: '', text: '' });
    
    if (isVerificationSent) {
      resetVerificationState();
      setVerificationCode('');
    }
  };

  // ========================================
  // 🔢 XỬ LÝ KHI NGƯỜI DÙNG NHẬP MÃ XÁC THỰC
  // ========================================
  
  const handleVerificationCodeChange = (e) => {
    const value = e.target.value
      .replace(/\D/g, '')
      .slice(0, 6);
    
    setVerificationCode(value);
    setMessage({ type: '', text: '' });
  };

  // ========================================
  // ✉️ XỬ LÝ KHI NHẤN NÚT "VERIFY"
  // ========================================
  
  const handleVerify = async () => {
    if (!validateEmail(email)) return;
    await sendVerificationCode();
  };

  // ========================================
  // 🔐 XỬ LÝ KHI NHẤN NÚT "CONFIRM"
  // ========================================
  
  const handleLogin = async () => {
    console.log('🔐 驗證碼確認流程開始');
    console.log('📧 Email:', email);
    console.log('🔢 驗證碼:', verificationCode);

    if (!validateEmail(email)) return;

    if (!isVerificationSent) {
      setMessage({ type: 'error', text: '請先發送驗證碼' });
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setMessage({ type: 'error', text: '請輸入 6 位數驗證碼' });
      return;
    }

    const isCodeValid = await verifyEmailCode(verificationCode);
    
    if (!isCodeValid) {
      setMessage({ type: 'error', text: '驗證碼錯誤，請重新輸入' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('📡 呼叫後端 API 驗證使用者狀態...');

      console.log('✅ 驗證碼正確，跳轉到註冊頁面');
      setMessage({ type: 'success', text: '第一次登入，正在前往註冊頁面...' });
      
      setTimeout(() => {
        navigate('/signup', { 
          state: { 
            email: email,
            verificationCode: verificationCode,
            verified: true
          } 
        });
      }, 1000);

    } catch (error) {
      console.error('💥 驗證過程發生錯誤:', error);
      setMessage({ type: 'error', text: '驗證時發生錯誤，請稍後再試' });
    } finally {
      setIsLoading(false);
    }
  };

  // ========================================
  // ✅ XỬ LÝ ĐĂNG NHẬP BẰNG OAUTH
  // ========================================
  
  const handleSocialLogin = (providerName) => {
    console.log(`🔐 Starting OAuth login with ${providerName}`);
    console.log('📍 Current location:', window.location.href);
    
    // ✅ Kiểm tra provider có enabled không
    const provider = providers.find(p => p.name.toLowerCase() === providerName.toLowerCase());
    
    if (provider && provider.enabled === false) {
      console.warn(`⚠️ Provider ${providerName} is disabled`);
      alert(`${providerName} 登入暫時無法使用`);
      return;
    }
    
    // ✅ Gọi authService để bắt đầu OAuth flow
    authService.startOAuthLogin(providerName.toLowerCase());
  };

  // ========================================
  // 🎨 RENDER GIAO DIỆN
  // ========================================
  
  return (
    <LoginBackground
      gradientColors={['#142049', '#848484', '#FFDF9E']}
    >
      <div className="login-page">
        <div className="login-main-content">
          
          <BrandLogo 
            logoSrc={logoImage}
            size="medium"
          />
          
          <div className="login-form-new">
            
            {/* ========================================
                📧 HÀNG EMAIL + NÚT VERIFY
                ======================================== */}
            <div className="email-verify-row">
              <FormInput
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={handleEmailChange}
                disabled={message.type === 'login-success'}
                className="email-input email-left-align"
              />
              
              <ActionButton
                onClick={handleVerify}
                variant="primary"
                size="medium"
                disabled={
                  !email ||
                  isVerificationLoading ||
                  verificationTimer > 0 ||
                  message.type === 'login-success'
                }
                loading={isVerificationLoading}
                className={`verify-button ${email ? 'has-email' : ''}`}
              >
                {verificationTimer > 0 ? `${verificationTimer}s` : 
                 isVerificationSent ? 'RESEND' : 'VERIFY'}
              </ActionButton>
            </div>
            
            {/* ========================================
                🔢 INPUT MÃ XÁC THỰC
                ======================================== */}
            {isVerificationSent && (
              <FormInput
                placeholder="123456"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                disabled={message.type === 'login-success'}
                className="verification-code-input"
              />
            )}
            
            {/* ========================================
                💬 THÔNG BÁO
                ======================================== */}
            {message.text && (
              <div className={`message-container ${message.type}-message`}>
                {message.text}
              </div>
            )}
            
            {/* ========================================
                🔐 NÚT CONFIRM
                ======================================== */}
            <ActionButton
              onClick={handleLogin}
              variant="primary"
              size="medium"
              disabled={
                isLoading ||
                !email ||
                !isVerificationSent ||
                verificationCode.length !== 6 ||
                message.type === 'login-success'
              }
              loading={isLoading}
              className={`login-button ${verificationCode.length === 6 ? 'has-code' : ''}`}
            >
              CONFIRM
            </ActionButton>
          </div>
          
          {/* ========================================
              ✅ CÁC NÚT ĐĂNG NHẬP OAUTH
              ======================================== */}
          <div className="social-login-container">
            {loadingProviders ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#999',
                fontSize: '14px'
              }}>
                載入中...
              </div>
            ) : providers.length > 0 ? (
              <>
                {providers.find(p => p.name === 'apple') && (
                  <CircleButton
                    provider="Apple"
                    iconSrc={appleIcon}
                    onClick={() => {
                      console.log('🍎 Apple button clicked');
                      handleSocialLogin('apple');
                    }}
                    size="medium"
                    disabled={message.type === 'login-success'}
                  />
                )}
                
                {providers.find(p => p.name === 'facebook') && (
                  <CircleButton
                    provider="Facebook"
                    iconSrc={facebookIcon}
                    onClick={() => {
                      console.log('📘 Facebook button clicked');
                      handleSocialLogin('facebook');
                    }}
                    size="medium"
                    disabled={message.type === 'login-success'}
                  />
                )}
                
                {providers.find(p => p.name === 'google') && (
                  <CircleButton
                    provider="Google"
                    iconSrc={googleIcon}
                    onClick={() => {
                      console.log('🔍 Google button clicked');
                      handleSocialLogin('google');
                    }}
                    size="medium"
                    disabled={message.type === 'login-success'}
                  />
                )}
              </>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#999',
                fontSize: '14px'
              }}>
                暫無可用的社交登入方式
              </div>
            )}
          </div>
        </div>
      </div>
    </LoginBackground>
  );
};

export default Login;
