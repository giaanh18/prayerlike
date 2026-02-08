import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAPI from '../../services/authApi';
import ApiService from '../../services/api';
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

  // ✅ 修改：封裝「登入後續處理」邏輯，供 Email 驗證與 Social Login 共用
  const processLoginSuccess = useCallback(async (sessionData, userEmail = null) => {
    try {
      console.log('👤 Process Login Success...');
      console.log('📊 Session Data:', sessionData);
      
      // ✅ 檢查 session 是否有效
      if (!sessionData || !sessionData.authenticated) {
        console.error('❌ Session 無效');
        setError('登入狀態無效，請重試');
        setIsLoading(false);
        return;
      }

      // ✅ 取得 session 中的 user 資訊
      const sessionUser = sessionData.user || {};
      const sessionEmail = sessionUser.email || userEmail;

      console.log('📧 Session Email:', sessionEmail);
      console.log('🆕 First Login:', sessionData.first_login);
      
      // ✅ 如果是第一次登入 → 導向 /signup
      if (sessionData.first_login === true) {
        console.log('🆕 First login detected → Redirect to /signup');
        setSuccess('第一次登入，正在前往註冊頁面...');
        
        setTimeout(() => {
          navigate('/signup', { 
            state: { 
              email: sessionEmail,
              sessionData: sessionData,
              verified: true,
              existingProfile: sessionUser
            },
            replace: true
          });
        }, 1000);
        return;
      }

      // ✅ 不是第一次登入 → 取得 profile
      console.log('👤 Returning user → Fetch profile');
      
      try {
        const profile = await AuthAPI.getProfile();
        console.log('👤 Profile data:', profile);

        // ✅ 檢查 profile 是否完整
        if (!profile || !profile.user_id) {
          console.warn('⚠️ Profile 不完整，導向 /signup');
          setSuccess('需要完成註冊資訊，正在前往註冊頁面...');
          
          setTimeout(() => {
            navigate('/signup', { 
              state: { 
                email: sessionEmail,
                sessionData: sessionData,
                existingProfile: profile || sessionUser
              },
              replace: true
            });
          }, 1000);
          return;
        }

        // ✅ Profile 完整 → 登入成功
        const rawAvatar =
          sessionData?.account?.avatar_url ||
          sessionData?.profile?.avatar_url ||
          sessionData?.profile?.picture ||
          profile?.avatar_url ||
          profile?.avatar ||
          profile?.picture;
        const processedAvatar = ApiService.processAvatarUrl(rawAvatar);

        const userData = {
          id: profile.user_id || profile.id,
          name: profile.name,
          email: sessionEmail || profile.email,
          avatar: processedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=667eea&color=fff`,
          avatar_url: processedAvatar || null,
          token: sessionData.app_token || 'session-token',
          loginMethod: userEmail ? 'email_verification' : 'social_login',
          tribe: profile.tribe
        };

        console.log('✅ Login Success - User Data:', userData);
        setLoginSuccessMessage('登入成功，正在進入系統...');
        
        setTimeout(() => {
          setLoginSuccessMessage('');
          onLogin(userData, userData.token);
          
          setTimeout(() => {
            navigate('/main', { replace: true });
          }, 100);
        }, 1000);

      } catch (profileError) {
        console.error('❌ 無法取得 profile:', profileError);
        
        // ✅ 如果是 404 或 profile 不存在 → 導向 signup
        if (profileError.message?.includes('404') || profileError.message?.includes('not found')) {
          console.log('⚠️ Profile 不存在，導向 /signup');
          setSuccess('需要建立新帳號，正在前往註冊頁面...');
          
          setTimeout(() => {
            navigate('/signup', { 
              state: { 
                email: sessionEmail,
                sessionData: sessionData,
                existingProfile: sessionUser
              },
              replace: true
            });
          }, 1000);
        } else {
          setError('無法取得帳號資訊，請重試');
          setIsLoading(false);
        }
      }

    } catch (error) {
      console.error('💥 processLoginSuccess 發生錯誤:', error);
      setError(error.message || '登入失敗，請重試');
      setIsLoading(false);
    }
  }, [navigate, onLogin]);

  // ✅ useEffect: 檢查從 Social Login 返回的狀態
  useEffect(() => {
    const checkSocialLoginStatus = async () => {
      const oauthProvider = sessionStorage.getItem('oauth_provider');
      
      if (oauthProvider) {
        console.log(`🔄 檢測到從 ${oauthProvider} 登入返回，檢查 Session...`);
        setIsLoading(true);
        sessionStorage.removeItem('oauth_provider');
        
        try {
          const session = await AuthAPI.getSession();
          console.log('📊 Initial Session Check:', session);

          if (session && session.authenticated) {
            console.log('✅ Social Login Verified!');
            await processLoginSuccess(session);
          } else {
            setError(`${oauthProvider} 登入未完成或失敗，請重試`);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('❌ Check session error:', err);
          setError('登入狀態確認失敗');
          setIsLoading(false);
        }
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

      // ✅ 呼叫共用的登入成功處理函式
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
      const providers = await AuthAPI.getProviders();
      console.log('📊 Available providers:', providers);
      
      const providerKey = provider.toLowerCase();
      if (!providers[providerKey] && !providers[provider]) {
        setError(`${provider} 登入目前無法使用`);
        return;
      }

      const BASE_URL = 'https://pray-api.yalinelena.church';
      const oauthUrl = `${BASE_URL}/auth/${providerKey}/login`;
      
      console.log(`🔗 Redirecting to: ${oauthUrl}`);
      
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_timestamp', Date.now().toString());
      
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
