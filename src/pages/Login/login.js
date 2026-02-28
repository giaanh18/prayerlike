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
import { AppBridge } from '../../services/appbridge';

// ================== Developer Backdoor Settings ==================
const isDevelopment = process.env.NODE_ENV === 'development';
const DEV_BACKDOOR_EMAIL = 'test@example.ucl';

// ================== Test Account Information ====================
const mockUser = {
  id: 999,
  name: 'Test Developer (Dev)',
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

  // ✅ CHANGE: Encapsulate "login success handling" logic, shared by Email verification and Social Login
  const processLoginSuccess = useCallback(async (sessionData, userEmail = null) => {
    try {
      console.log('👤 Process Login Success...');
      console.log('📊 Session Data:', sessionData);
      
      // ✅ Check if session is valid
      if (!sessionData || !sessionData.authenticated) {
        console.error('❌ Invalid session');
        setError('Invalid login status, please try again');
        setIsLoading(false);
        return;
      }

      // ✅ Get user info from session
      const sessionUser = sessionData.user || {};
      const sessionEmail = sessionUser.email || userEmail;

      console.log('📧 Session Email:', sessionEmail);
      console.log('🆕 First Login:', sessionData.first_login);
      
      // ✅ If first login → Redirect to /signup
      if (sessionData.first_login === true) {
        console.log('🆕 First login detected → Redirect to /signup');
        setSuccess('First login detected, redirecting to registration page...');
        
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

      // ✅ Not first login → Fetch profile
      console.log('👤 Returning user → Fetch profile');
      
      try {
        const profile = await AuthAPI.getProfile();
        console.log('👤 Profile data:', profile);

        // ✅ Check if profile is complete
        if (!profile || !profile.user_id) {
          console.warn('⚠️ Profile incomplete, redirecting to /signup');
          setSuccess('Registration information needed, redirecting to registration page...');
          
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

        // ✅ Profile complete → Login success
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

        // ==========================================
        // 👇 ✅ 新增：通知 Flutter 綁定 OneSignal 推播
        // ==========================================
        if (userData && userData.id) {
          AppBridge.syncLogin(userData.id);
        }
        // ==========================================

        setLoginSuccessMessage('Login successful, entering system...');
        
        setTimeout(() => {
          setLoginSuccessMessage('');
          onLogin(userData, userData.token);
          
          setTimeout(() => {
            navigate('/main', { replace: true });
          }, 100);
        }, 1000);

      } catch (profileError) {
        console.error('❌ Unable to fetch profile:', profileError);
        
        // ✅ If 404 or profile does not exist → Redirect to signup
        if (profileError.message?.includes('404') || profileError.message?.includes('not found')) {
          console.log('⚠️ Profile does not exist, redirecting to /signup');
          setSuccess('New account needed, redirecting to registration page...');
          
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
          setError('Unable to fetch account information, please try again');
          setIsLoading(false);
        }
      }

    } catch (error) {
      console.error('💥 Error in processLoginSuccess:', error);
      setError(error.message || 'Login failed, please try again');
      setIsLoading(false);
    }
  }, [navigate, onLogin]);

  // ✅ useEffect: Check Social Login return status
  useEffect(() => {
    const checkSocialLoginStatus = async () => {
      const oauthProvider = sessionStorage.getItem('oauth_provider');
      
      if (oauthProvider) {
        console.log(`🔄 Detected return from ${oauthProvider} login, checking Session...`);
        setIsLoading(true);
        sessionStorage.removeItem('oauth_provider');
        
        try {
          const session = await AuthAPI.getSession();
          console.log('📊 Initial Session Check:', session);

          if (session && session.authenticated) {
            console.log('✅ Social Login Verified!');
            await processLoginSuccess(session);
          } else {
            setError(`${oauthProvider} login incomplete or failed, please try again`);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('❌ Check session error:', err);
          setError('Login status verification failed');
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
    // ================== Backdoor Logic ==================
    if (isDevelopment && email === DEV_BACKDOOR_EMAIL) {
      console.warn('⚠️ DEV BACKDOOR: Bypassing login with mock user.');

      // 👇 新增這行：讓開發者後門也能測試推播
      if (mockUser && mockUser.id) {
        AppBridge.syncLogin(mockUser.id);
      }

      onLogin(mockUser);
      return; 
    }
    // ================== Remove before production =================

    if (!email) {
      setError('Please enter email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email format');
      return;
    }

    try {
      setError('');
      setSuccess('');
      console.log('📧 Sending OTP to:', email);
      
      await AuthAPI.requestOTP(email);
      
      setSuccess('Verification code sent to your email');
      sendVerificationCode();
      
      console.log('✅ OTP sent successfully');
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      setError(error.message || 'Failed to send verification code, please try again later');
    }
  };

  const handleLogin = async () => {
    console.log('🔐 Verification code confirmation process started');
    console.log('📧 Email:', email);
    console.log('🔢 Verification code:', verificationCode);

    if (!email) {
      setError('Please enter email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email format');
      return;
    }

    if (!isVerificationSent) {
      setError('Please send verification code first');
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📡 Calling /auth/otp/verify...');
      const verifyResult = await AuthAPI.verifyOTP(email, verificationCode);
      console.log('📊 Verify result:', verifyResult);
      
      if (!verifyResult.ok) {
        setError('Incorrect verification code, please re-enter');
        setIsLoading(false);
        return;
      }

      console.log('✅ OTP verification successful');
      console.log('📡 Calling /auth/session...');
      const session = await AuthAPI.getSession();
      console.log('📊 Session data:', session);

      if (!session.authenticated) {
        setError('Verification failed, please try again');
        setIsLoading(false);
        return;
      }

      // ✅ Call shared login success handler function
      await processLoginSuccess(session, email);

    } catch (error) {
      console.error('💥 Error during verification process:', error);
      setError(error.message || 'Error occurred during verification, please try again later');
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
        setError(`${provider} login is currently unavailable`);
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
      setError(`${provider} login failed, please try again later`);
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
