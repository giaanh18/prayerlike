// ./src/pages/Login/login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import useEmailVerification from '../../hooks/useEmailVerification';

// 導入重新命名的元件
import LoginBackground from '../../components/LoginBackground/LoginBackground';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import FormInput from '../../components/FormInput/FormInput';
import ActionButton from '../../components/ActionButton/ActionButton';
import CircleButton from '../../components/CircleButton/CircleButton';

// 導入圖片資源
import logoImage from '../../assets/images/pray-logo.png';
import appleIcon from '../../assets/icons/apple-icon.png';
import facebookIcon from '../../assets/icons/facebook-icon.png';
import googleIcon from '../../assets/icons/google-icon.png';

import './login.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const EMAIL_VERIFICATION_COUNTDOWN_DEFAULT_SECONDS = 90;

  const {
    isVerificationSent,
    isVerificationLoading,
    verificationTimer,
    sendVerificationCode,
    verifyEmailCode,
    resetVerificationState,
  } = useEmailVerification(
    email,
    setError,
    () => {}, // 移除成功訊息設定
    EMAIL_VERIFICATION_COUNTDOWN_DEFAULT_SECONDS 
  );

  const showLoginSuccess = (method, userData) => {
    const messages = {
      'email_verification': '驗證碼登入成功，正在進入系統',
      'google_social': 'Google 登入成功，正在進入系統',
      'facebook_social': 'Facebook 登入成功，正在進入系統',
      'apple_social': 'Apple 登入成功，正在進入系統'
    };
    
    setLoginSuccessMessage(messages[userData.loginMethod] || '登入成功，正在進入系統');
    
    setTimeout(() => {
      setLoginSuccessMessage('');
      onLogin(userData);
      
      setTimeout(() => {
        navigate('/main', { replace: true });
      }, 100);
    }, 1000);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
    setSuccess('');
    setLoginSuccessMessage('');
    if (isVerificationSent) {
      resetVerificationState();
      setVerificationCode('');
    }
  };

  const handleVerificationCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setError('');
  };

  const handleVerify = async () => {
    if (!email) {
      setError('請輸入 Email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('請輸入正確的 Email 格式');
      return;
    }

    await sendVerificationCode();
  };

  // ✅ 修改：驗證完成後跳轉到註冊頁面
  const handleLogin = async () => {
    console.log('🔐 驗證碼確認流程開始');
    console.log('📧 Email:', email);
    console.log('🔢 驗證碼:', verificationCode);

    if (!email) {
      setError('請輸入 Email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('請輸入正確的 Email 格式');
      return;
    }

    if (!isVerificationSent) {
      setError('請先發送驗證碼');
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('請輸入 6 位數驗證碼');
      return;
    }

    // 驗證驗證碼是否正確
    const isCodeValid = await verifyEmailCode(verificationCode);
    if (!isCodeValid) {
      setError('驗證碼錯誤，請重新輸入');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📡 呼叫後端 API 驗證使用者狀態...');

      // ✅ 這裡可以呼叫後端 API 檢查使用者是否已註冊
      // 但根據您的需求，先固定跳轉到註冊頁面
      
      // 模擬 API 呼叫
      // const response = await ApiService.checkUserExists(email, verificationCode);
      
      // 固定為新用戶，跳轉到註冊頁面
      console.log('✅ 驗證碼正確，跳轉到註冊頁面');
      setSuccess('第一次登入，正在前往註冊頁面...');
      
      setTimeout(() => {
        // 將 email 和驗證碼傳遞到註冊頁面
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
      setError('驗證時發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`🔐 Social login with ${provider}`);

    const userData = {
      id: `${provider} User`,
      name: `${provider} User`,
      email: `user@${provider.toLowerCase()}.com`,
      avatar: `https://ui-avatars.com/api/?name=${provider}&background=667eea&color=fff`,
      token: `${provider.toLowerCase()}-token-${Date.now()}`,
      loginMethod: `${provider.toLowerCase()}_social`
    };

    console.log('🚀 Social login successful');
    showLoginSuccess(`${provider} 社交登入`, userData);
  };

  return (
    <LoginBackground
      gradientColors={['#142049', '#848484', '#FFDF9E']}
    >
      <div className="login-page">
        {/* 主要內容區域 */}
        <div className="login-main-content">
          {/* Logo */}
          <BrandLogo 
            logoSrc={logoImage}
            size="medium"
          />
          
          <div className="login-form-new">
            {/* Email 和 Verify 同一欄 */}
            <div className="email-verify-row">
              <FormInput
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={handleEmailChange}
                disabled={!!loginSuccessMessage}
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
                  !!loginSuccessMessage
                }
                loading={isVerificationLoading}
                className={`verify-button ${email ? 'has-email' : ''}`}
              >
                {verificationTimer > 0 ? `${verificationTimer}s` : 
                 isVerificationSent ? 'RESEND' : 'VERIFY'}
              </ActionButton>
            </div>
            
            {/* 驗證碼輸入框 - 只有在發送驗證碼後才顯示 */}
            {isVerificationSent && (
              <FormInput
                placeholder="123456"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                disabled={!!loginSuccessMessage}
                className="verification-code-input"
              />
            )}
            
            {/* 錯誤訊息 */}
            {error && (
              <div className="message-container error-message">
                {error}
              </div>
            )}

            {/* 成功訊息 */}
            {success && (
              <div className="message-container success-message">
                {success}
              </div>
            )}

            {/* 登入成功訊息 */}
            {loginSuccessMessage && (
              <div className="message-container login-success-message">
                {loginSuccessMessage}
              </div>
            )}
            
            {/* ✅ 修改按鈕文字為 CONFIRM */}
            <ActionButton
              onClick={handleLogin}
              variant="primary"
              size="medium"
              disabled={
                isLoading ||
                !email ||
                !isVerificationSent ||
                verificationCode.length !== 6 ||
                !!loginSuccessMessage
              }
              loading={isLoading}
              className={`login-button ${verificationCode.length === 6 ? 'has-code' : ''}`}
            >
              CONFIRM
            </ActionButton>
          </div>
          
          {/* 社交登入按鈕 - 使用重新命名的 CircleButton */}
          <div className="social-login-container">
            <CircleButton
              provider="Apple"
              iconSrc={appleIcon}
              onClick={() => handleSocialLogin('Apple')}
              size="medium"
            />
            <CircleButton
              provider="Facebook"
              iconSrc={facebookIcon}
              onClick={() => handleSocialLogin('Facebook')}
              size="medium"
            />
            <CircleButton
              provider="Google"
              iconSrc={googleIcon}
              onClick={() => handleSocialLogin('Google')}
              size="medium"
            />
          </div>
        </div>
      </div>
    </LoginBackground>
  );
};

export default Login;
