// src/pages/Login/login.js
import React, { useState, useEffect, useCallback } from 'react';
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

// ================== 開發者後門設定 ==================
const isDevelopment = process.env.NODE_ENV === 'development';
const DEV_BACKDOOR_EMAIL = 'test@example.ucl';

// ================== 測試帳號資訊 ====================
const mockUser = {
  id: 999,
  name: '測試開發者 (Dev)',
  email: DEV_BACKDOOR_EMAIL,
  tribe: null,
  avatar: `https://ui-avatars.com/api/?name=Dev&background=random&color=fff`,
  token: 'dev-mode-fake-token',
  loginMethod: 'dev_backdoor'
};

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

  // ✅ 新增：封裝「登入後續處理」邏輯，供 Email 驗證與 Social Login 共用
  const processLoginSuccess = useCallback(async (sessionData, userEmail = null) => {
    try {
      console.log('👤 Process Login Success...');
      
      // 如果是第一次登入 (依照後端 session 判斷)
      if (sessionData.first_login) {
        console.log('🆕 First login detected → Redirect to /signup');
        setSuccess('第一次登入，正在前往註冊頁面...');
        
        setTimeout(() => {
          navigate('/signup', { 
            state: { 
              email: userEmail,
              verificationCode: 'SOCIAL_LOGIN', // 或是原本的 code
              verified: true,
              sessionData: sessionData
            } 
          });
        }, 1000);
        return;
      }

      console.log('👤 Returning user → Fetch profile');
      const profile = await AuthAPI.getProfile();
      console.log('👤 Profile data:', profile);

      // 建構 User Data
      const userData = {
        id: profile.user_id || profile.id,
        name: profile.name,
        email: userEmail || profile.email, // 優先使用傳入的 email，若無則用 profile 的
        avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=667eea&color=fff`,
        token: sessionData.app_token || 'session-token',
        loginMethod: userEmail ? 'email_verification' : 'social_login',
        tribe: profile.tribe // 確保帶入 tribe 資訊
      };

      setLoginSuccessMessage('登入成功，正在進入系統...');
      
      setTimeout(() => {
        setLoginSuccessMessage('');
        onLogin(userData); // 更新 App 狀態
        
        setTimeout(() => {
          navigate('/main', { replace: true });
        }, 100);
      }, 1000);

    } catch (profileError) {
      console.error('❌ 無法取得 profile:', profileError);
      // 若無法取得 Profile，可能視為需要註冊
      setSuccess('需要完成註冊，正在前往註冊頁面...');
      setTimeout(() => {
        navigate('/signup', { state: { sessionData } });
      }, 1000);
    }
  }, [navigate, onLogin]);

  // ✅ 新增：useEffect 在元件載入時檢查是否從 Social Login 返回
  useEffect(() => {
    const checkSocialLoginStatus = async () => {
      // 檢查 sessionStorage 中是否有標記正在進行 OAuth
      const oauthProvider = sessionStorage.getItem('oauth_provider');
      
      // 或者直接檢查是否有 Session (即使沒有標記，有時 Cookie 仍可能存在)
      // 這裡我們稍微保守一點，如果有標記才顯示 Loading，避免一般進入時畫面閃爍
      
      if (oauthProvider) {
        console.log(`🔄 檢測到從 ${oauthProvider} 登入返回，檢查 Session...`);
        setIsLoading(true);
        sessionStorage.removeItem('oauth_provider'); // 清除標記，避免無限迴圈
        
        try {
          const session = await AuthAPI.getSession();
          console.log('📊 Initial Session Check:', session);

          if (session && session.authenticated) {
            console.log('✅ Social Login Verified!');
            await processLoginSuccess(session);
          } else {
            // 只有在明確是 OAuth 回來卻失敗時才報錯，否則靜默
            setError(`${oauthProvider} 登入未完成或是失敗，請重試`);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Check session error:', err);
          setError('登入狀態確認失敗');
          setIsLoading(false);
        }
      } else {
          // 若沒有 oauth_provider 標記，也可以選擇性地檢查 session (自動登入功能)
          // AuthAPI.getSession().then(session => {
          //    if (session.authenticated) processLoginSuccess(session);
          // }).catch(() => {});
      }
    };

    checkSocialLoginStatus();
  }, [processLoginSuccess]);


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
    // ================== 後門邏輯 ==================
    if (isDevelopment && email === DEV_BACKDOOR_EMAIL) {
      console.warn('⚠️ DEV BACKDOOR: Bypassing login with mock user.');
      onLogin(mockUser);
      return; 
    }
    // ================== 上線需移除 =================

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

      // ✅ 修改：呼叫共用的登入成功處理函式
      await processLoginSuccess(session, email);

    } catch (error) {
      console.error('💥 驗證過程發生錯誤:', error);
      setError(error.message || '驗證時發生錯誤，請稍後再試');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    console.log(`🔐 Starting ${provider} login...`);
    setError('');
    
    try {
      // ✅ 1. Get available providers
      const providers = await AuthAPI.getProviders();
      console.log('📊 Available providers:', providers);
      
      const providerKey = provider.toLowerCase();
      // 注意：部分後端可能回傳 google 而不是 Google，這裡做個防呆
      if (!providers[providerKey] && !providers[provider]) {
        setError(`${provider} 登入目前無法使用`);
        return;
      }

      // ✅ 2. Construct OAuth URL
      const BASE_URL = 'https://pray-api.yalinelena.church';
      const oauthUrl = `${BASE_URL}/auth/${providerKey}/login`;
      
      console.log(`🔗 Redirecting to: ${oauthUrl}`);
      
      // ✅ 3. 儲存當前狀態，以便返回時 useEffect 偵測
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_timestamp', Date.now().toString());
      
      // ✅ 4. Redirect to OAuth
      window.location.href = oauthUrl;
      
    } catch (error) {
      console.error(`❌ ${provider} login error:`, error);
      setError(`${provider} 登入失敗，請稍後再試`);
    }
  };

  return (
    <LoginBackground gradientColors={['#142049', '#848484', '#FFDF9E']}>
      <div className="login-page">
        <div className="login-main-content">
          <BrandLogo logoSrc={logoImage} size="medium" />
          
          <div className="login-form-new">
            <div className="email-verify-row">
              <FormInput
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={handleEmailChange}
                disabled={!!loginSuccessMessage || isLoading}
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
                  !!loginSuccessMessage ||
                  isLoading
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
                disabled={!!loginSuccessMessage || isLoading}
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