// src/pages/OAuthCallback/OAuthCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthAPI from '../../services/authApi';
import ApiService from '../../services/api';
import './OAuthCallback.css';

const OAuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('正在處理登入...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    handleOAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


const handleOAuthCallback = async () => {
  try {
    console.log('🔐 OAuth Callback started');
    console.log('📍 Current URL:', window.location.href);
    
    // ✅ 1. Check for errors in URL
    const error = searchParams.get('error');
    if (error) {
      console.error('❌ OAuth error from URL:', error);
      setIsError(true);
      setStatus(decodeURIComponent(error));
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    console.log('📡 Checking OAuth session...');
    setStatus('正在驗證登入狀態...');
    
    // ✅ 2. Wait for backend to set cookie
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ✅ 3. Check session
    const session = await AuthAPI.getSession();
    console.log('📊 Session:', session);

    if (!session.authenticated) {
      throw new Error('Session not authenticated');
    }

    // ✅ 優先從 account 取得 email，其次 profile
    const email = session.account?.email || session.profile?.email || session.email || '';
    const provider = session.provider || 'oauth';
    
    console.log('📧 Email from session:', email);
    console.log('🔐 Provider:', provider);

    // ✅ 4. Check first_login
    if (session.first_login) {
      console.log('🆕 First login → Redirect to signup');
      setStatus('第一次登入，正在前往註冊頁面...');
      
      setTimeout(() => {
        navigate('/signup', { 
          state: { 
            email: email,
            verified: true,
            sessionData: session,
            provider: provider,
            fromOAuth: true
          },
          replace: true
        });
      }, 1500);
      return;
    }

    // ✅ 5. Returning user → Get profile
    console.log('👤 Returning user → Fetch profile');
    setStatus('正在載入個人資料...');
    
    try {
      const profileResponse = await AuthAPI.getProfile();
      console.log('👤 Profile response:', profileResponse);
      
      // ✅ 處理不同的回傳格式 (getProfile 已經處理，但這裡再確認一次)
      let profile = profileResponse;
      if (profileResponse.ok && profileResponse.profile) {
        profile = profileResponse.profile;
        console.log('👤 Extracted profile from nested structure');
      }
      
      console.log('👤 Final profile:', profile);

      // ✅ 檢查 profile 是否有效
      if (!profile || !profile.user_id) {
        throw new Error('Profile is null or invalid');
      }

      const rawAvatar =
        session.account?.avatar_url ||
        session.profile?.avatar_url ||
        session.profile?.picture ||
        profile?.avatar_url ||
        profile?.avatar ||
        profile?.picture;
      const processedAvatar = ApiService.processAvatarUrl(rawAvatar);

      const userData = {
        id: profile.user_id || profile.id,
        name: profile.name,
        email: profile.email || email,
        avatar: processedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=667eea&color=fff`,
        avatar_url: processedAvatar || null,
        token: session.app_token || 'session-token',
        loginMethod: provider
      };

      console.log('✅ Login successful, user data:', userData);
      setStatus('登入成功！正在進入系統...');
      
      // ✅ 6. Call onLogin callback
      onLogin(userData, userData.token);
      
      // ✅ 7. Navigate to main
      setTimeout(() => {
        navigate('/main', { replace: true });
      }, 1500);
      
    } catch (profileError) {
      console.error('❌ Failed to get profile:', profileError);
      
      // Profile 不存在 → redirect to signup
      setStatus('需要完成註冊，正在前往註冊頁面...');
      
      setTimeout(() => {
        navigate('/signup', { 
          state: { 
            email: email,
            verified: true,
            sessionData: session,
            provider: provider,
            fromOAuth: true
          },
          replace: true
        });
      }, 1500);
    }

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    setIsError(true);
    setStatus(error.message || '登入過程發生錯誤');
    setTimeout(() => navigate('/login', { replace: true }), 3000);
  }
};

  return (
    <div className="oauth-callback-container">
      <div className="oauth-callback-content">
        <div className={`oauth-spinner ${isError ? 'error' : ''}`}>
          {!isError && (
            <div className="spinner-circle"></div>
          )}
          {isError && (
            <div className="error-icon">✕</div>
          )}
        </div>
        <h2 className={`oauth-status ${isError ? 'error' : ''}`}>
          {status}
        </h2>
        {!isError && (
          <p className="oauth-subtitle">請稍候...</p>
        )}
        {isError && (
          <p className="oauth-subtitle">正在返回登入頁面...</p>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
