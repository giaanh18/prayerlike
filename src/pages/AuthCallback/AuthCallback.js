// src/pages/AuthCallback/AuthCallback.js

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import './AuthCallback.css';

const AuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('正在處理登入...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      console.log('🔐 OAuth Callback - Starting...');
      console.log('📍 Current URL:', window.location.href);
      console.log('📦 Location search:', location.search);

      // ✅ Parse URL parameters
      const urlParams = new URLSearchParams(location.search);
      
      console.log('📋 URL Params:');
      for (const [key, value] of urlParams.entries()) {
        console.log(`  • ${key}:`, value);
      }

      // ✅ Kiểm tra có error từ backend không
      const error = urlParams.get('error');
      if (error) {
        console.error('❌ OAuth Error:', error);
        setStatus('error');
        setMessage(decodeURIComponent(error));
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        return;
      }

      // ✅ Lấy token và user từ URL
      const token = urlParams.get('token') || urlParams.get('access_token');
      const userJson = urlParams.get('user');
      const provider = urlParams.get('provider');

      console.log('🔑 Token:', token ? 'Found' : 'Missing');
      console.log('👤 User data:', userJson ? 'Found' : 'Missing');
      console.log('🔐 Provider:', provider);

      // ✅ Kiểm tra token
      if (!token) {
        console.error('❌ No token in callback URL');
        setStatus('error');
        setMessage('未收到登入憑證，請重新登入');
        
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
        return;
      }

      // ✅ Parse user data
      let user = null;
      if (userJson) {
        try {
          user = JSON.parse(decodeURIComponent(userJson));
          console.log('✅ Parsed user:', user);
        } catch (e) {
          console.error('❌ Failed to parse user data:', e);
          console.log('📄 Raw user JSON:', userJson);
        }
      }

      // ✅ Nếu không có user data, tạo user object cơ bản
      if (!user) {
        console.warn('⚠️ No user data in URL, creating basic user object');
        user = {
          id: 'user_' + Date.now(),
          provider: provider || 'oauth',
          loginMethod: 'oauth',
          createdAt: new Date().toISOString()
        };
      }

      // ✅ Thêm thông tin provider và loginMethod
      user.provider = provider || user.provider || 'oauth';
      user.loginMethod = 'oauth';
      user.access_token = token;

      // ✅ Lưu session vào sessionStorage
      const sessionData = {
        access_token: token,
        user: user,
        provider: provider,
        timestamp: Date.now()
      };

      sessionStorage.setItem('auth_session', JSON.stringify(sessionData));
      console.log('💾 Session saved to sessionStorage');

      // ✅ Lưu vào localStorage (để persistent)
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('userData', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
      console.log('💾 User data saved to localStorage');

      // ✅ Hiển thị thông báo thành công
      setStatus('success');
      
      const providerNames = {
        'google': 'Google',
        'facebook': 'Facebook',
        'apple': 'Apple'
      };
      
      const providerName = providerNames[provider] || 'OAuth';
      setMessage(`${providerName} 登入成功！正在進入系統...`);

      console.log('✅ OAuth login successful!');
      console.log('👤 User:', user);

      // ✅ Gọi callback onLogin
      if (onLogin) {
        onLogin(user);
      }

      // ✅ Lấy return path (nếu có)
      const returnPath = sessionStorage.getItem('oauth_return_path') || '/main';
      sessionStorage.removeItem('oauth_return_path');

      console.log('🔄 Redirecting to:', returnPath);

      // ✅ Redirect sau 1.5 giây
      setTimeout(() => {
        navigate(returnPath, { replace: true });
      }, 1500);

    } catch (error) {
      console.error('❌ AuthCallback Error:', error);
      
      setStatus('error');
      setMessage('登入處理失敗，請重新登入');

      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  };

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-content">
        {status === 'processing' && (
          <>
            <div className="spinner"></div>
            <h2>{message}</h2>
            <p>請稍候...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>{message}</h2>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✕</div>
            <h2>登入失敗</h2>
            <p>{message}</p>
            <p className="redirect-hint">即將返回登入頁面...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
