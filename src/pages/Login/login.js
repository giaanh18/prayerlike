// src/pages/Login/login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAPI from '../../services/authApi';
import useEmailVerification from '../../hooks/useEmailVerification';

import LoginBackground from '../../components/LoginBackground/LoginBackground';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import FormInput from '../../components/FormInput/FormInput';
import ActionButton from '../../components/ActionButton/ActionButton';
import CircleButton from '../../components/CircleButton/CircleButton';

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
    resetVerificationState,
  } = useEmailVerification(
    email,
    setError,
    () => {},
    EMAIL_VERIFICATION_COUNTDOWN_DEFAULT_SECONDS 
  );

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

    try {
      setError('');
      setSuccess('');
      console.log('📧 發送 OTP 到:', email);
      
      await AuthAPI.requestOTP(email);
      
      setSuccess('驗證碼已發送到您的信箱');
      sendVerificationCode();
      
      console.log('✅ OTP 發送成功');
    } catch (error) {
      console.error('❌ 發送 OTP 失敗:', error);
      setError(error.message || '發送驗證碼失敗，請稍後再試');
    }
  };

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

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📡 呼叫 /auth/otp/verify...');
      const verifyResult = await AuthAPI.verifyOTP(email, verificationCode);
      console.log('📊 Verify result:', verifyResult);
      
      if (!verifyResult.ok) {
        setError('驗證碼錯誤，請重新輸入');
        setIsLoading(false);
        return;
      }

      console.log('✅ OTP 驗證成功');

      console.log('📡 呼叫 /auth/session...');
      const session = await AuthAPI.getSession();
      console.log('📊 Session data:', session);

      if (!session.authenticated) {
        setError('驗證失敗，請重試');
        setIsLoading(false);
        return;
      }

      if (session.first_login) {
        console.log('🆕 First login detected → Redirect to /signup');
        setSuccess('第一次登入，正在前往註冊頁面...');
        
        setTimeout(() => {
          navigate('/signup', { 
            state: { 
              email: email,
              verificationCode: verificationCode,
              verified: true,
              sessionData: session
            } 
          });
        }, 1000);
      } else {
        console.log('👤 Returning user → Fetch profile');
        
        try {
          const profile = await AuthAPI.getProfile();
          console.log('👤 Profile data:', profile);

          const userData = {
            id: profile.user_id || profile.id,
            name: profile.name,
            email: email,
            avatar: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=667eea&color=fff`,
            token: session.app_token || 'session-token',
            loginMethod: 'email_verification'
          };

          setLoginSuccessMessage('登入成功，正在進入系統...');
          
          setTimeout(() => {
            setLoginSuccessMessage('');
            onLogin(userData);
            
            setTimeout(() => {
              navigate('/main', { replace: true });
            }, 100);
          }, 1000);
        } catch (profileError) {
          console.error('❌ 無法取得 profile:', profileError);
          
          setSuccess('需要完成註冊，正在前往註冊頁面...');
          
          setTimeout(() => {
            navigate('/signup', { 
              state: { 
                email: email,
                verificationCode: verificationCode,
                verified: true,
                sessionData: session
              } 
            });
          }, 1000);
        }
      }

    } catch (error) {
      console.error('💥 驗證過程發生錯誤:', error);
      setError(error.message || '驗證時發生錯誤，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SỬA LẠI: Thêm BASE_URL
  const handleSocialLogin = async (provider) => {
    console.log(`🔐 Social login with ${provider}`);
    
    try {
      const providers = await AuthAPI.getProviders();
      console.log('📊 Available providers:', providers);
      
      const providerKey = provider.toLowerCase();
      if (!providers[providerKey]) {
        setError(`${provider} login is not available`);
        return;
      }

      // ✅ THÊM BASE_URL
      const BASE_URL = 'https://pray-api.yalinelena.church';
      
      // ✅ Redirect đến OAuth URL
      console.log(`🔗 Redirecting to: ${BASE_URL}/auth/${providerKey}/login`);
      window.location.href = `${BASE_URL}/auth/${providerKey}/login`;
      
    } catch (error) {
      console.error(`❌ ${provider} login error:`, error);
      setError(`${provider} 登入失敗，請稍後再試`);
    }
  };

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
            
            {isVerificationSent && (
              <FormInput
                placeholder="123456"
                value={verificationCode}
                onChange={handleVerificationCodeChange}
                disabled={!!loginSuccessMessage}
                className="verification-code-input"
              />
            )}
            
            {error && (
              <div className="message-container error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="message-container success-message">
                {success}
              </div>
            )}

            {loginSuccessMessage && (
              <div className="message-container login-success-message">
                {loginSuccessMessage}
              </div>
            )}
            
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
