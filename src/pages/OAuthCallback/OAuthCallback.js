// src/pages/OAuthCallback/OAuthCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthAPI from '../../services/authApi';
import './OAuthCallback.css';

const OAuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('正在處理登入...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      console.log('📡 Checking OAuth session...');
      setStatus('正在驗證登入狀態...');
      
      // ✅ Đợi 1 giây để backend xử lý xong
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ Kiểm tra session
      const session = await AuthAPI.getSession();
      console.log('📊 Session:', session);

      if (!session.authenticated) {
        setIsError(true);
        setStatus('登入失敗，請重試');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // ✅ Kiểm tra first_login
      if (session.first_login) {
        console.log('🆕 First login → Redirect to signup');
        setStatus('第一次登入，正在前往註冊頁面...');
        
        setTimeout(() => {
          navigate('/signup', { 
            state: { 
              email: session.email || '',
              verified: true,
              sessionData: session,
              provider: 'oauth'
            } 
          });
        }, 1500);
      } else {
        console.log('👤 Returning user → Fetch profile');
        setStatus('正在載入個人資料...');
        
        try {
          const profile = await AuthAPI.getProfile();
          console.log('👤 Profile:', profile);

          const userData = {
            id: profile.user_id || profile.id,
            name: profile.name,
            email: profile.email || session.email,
            avatar: profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}&background=667eea&color=fff`,
            token: session.app_token || 'session-token',
            loginMethod: 'oauth'
          };

          setStatus('登入成功！正在進入系統...');
          
          setTimeout(() => {
            onLogin(userData);
            navigate('/main', { replace: true });
          }, 1500);
        } catch (profileError) {
          console.error('❌ 無法取得 profile:', profileError);
          
          // Nếu không lấy được profile, redirect về signup
          setStatus('需要完成註冊，正在前往註冊頁面...');
          
          setTimeout(() => {
            navigate('/signup', { 
              state: { 
                email: session.email || '',
                verified: true,
                sessionData: session,
                provider: 'oauth'
              } 
            });
          }, 1500);
        }
      }

    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      setIsError(true);
      setStatus('登入過程發生錯誤');
      setTimeout(() => navigate('/login'), 2000);
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
      </div>
    </div>
  );
};

export default OAuthCallback;
