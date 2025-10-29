// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AuthAPI from './services/authApi';
import Login from './pages/Login/login';
import SignUp from './pages/SignUp/SignUp';
import OAuthCallback from './pages/OAuthCallback/OAuthCallback';
import MainApp from './pages/Context/context';
import CreatePostScreen from './pages/CreatePostScreen/CreatePostScreen';
import TextPostScreen from './pages/CreatePostScreen/TextPostScreen';
import AudioPostScreen from './pages/CreatePostScreen/AudioPostScreen';

import './App.css';

// ✅ 創建內部組件來使用 useNavigate
function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pendingSignup, setPendingSignup] = useState(null); // ✅ 新增：追蹤待註冊狀態

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(async () => {
        try {
          console.log('🔄 Auto refreshing token...');
          const result = await AuthAPI.refreshToken();
          console.log('✅ Token refreshed:', result);
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          handleLogout();
        }
      }, 15 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // ✅ 當 pendingSignup 改變時，跳轉到註冊頁面
  useEffect(() => {
    if (pendingSignup && location.pathname !== '/signup' && location.pathname !== '/auth/callback') {
      console.log('🔄 Redirecting to signup with pending data:', pendingSignup);
      navigate('/signup', { 
        state: pendingSignup,
        replace: true 
      });
    }
  }, [pendingSignup, location.pathname, navigate]);

// src/App.js (只替換 checkAuthStatus 函數)

const checkAuthStatus = async () => {
  console.log('🔍 Starting auth check...');
  setIsCheckingAuth(true);
  
  try {
    // ✅ 1. 檢查 session
    console.log('📡 Checking session from backend...');
    const session = await AuthAPI.getSession();
    console.log('📊 Session response:', session);
    
    if (session.authenticated) {
      console.log('✅ Valid session found');
      
      // ✅ 2. 檢查是否為第一次登入
      if (session.first_login) {
        console.log('🆕 First login detected in checkAuthStatus');
        
        // ✅ 優先從 account 取得 email，其次 profile
        const email = session.account?.email || session.profile?.email || session.email || '';
        const provider = session.provider || 'oauth';
        
        console.log('📧 Email for signup:', email);
        
        setPendingSignup({
          email: email,
          verified: true,
          sessionData: session,
          provider: provider,
          fromOAuth: true
        });
        
        setIsCheckingAuth(false);
        return;
      }
      
      // ✅ 3. 已註冊用戶 → 優先檢查 session.account
      if (session.account && session.account.user_id) {
        console.log('✅ User has account data in session');
        
        const email = session.account.email || session.profile?.email || '';
        
        const userData = {
          id: session.account.user_id,
          name: session.account.name,
          email: email,
          avatar: session.account.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.account.name)}&background=667eea&color=fff`,
          token: session.app_token || 'session-token',
          loginMethod: session.provider || 'unknown'
        };
        
        setIsLoggedIn(true);
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('✅ User authenticated successfully from session.account');
        
        setIsCheckingAuth(false);
        return;
      }
      
      // ✅ 4. 沒有 account 資料 → 嘗試獲取 profile
      try {
        console.log('📡 Fetching profile from API...');
        const profileResponse = await AuthAPI.getProfile();
        console.log('👤 Profile response:', profileResponse);
        
        // ✅ 處理不同的回傳格式 (getProfile 已經處理，但這裡再確認一次)
        let profile = profileResponse;
        
        // 如果還是 {ok: true, profile: {...}} 格式
        if (profileResponse.ok && profileResponse.profile) {
          profile = profileResponse.profile;
          console.log('👤 Extracted profile from nested structure');
        }
        
        console.log('👤 Final profile:', profile);
        
        // ✅ 檢查 profile 是否有效
        if (!profile || !profile.user_id) {
          console.warn('⚠️ Profile is null or invalid');
          console.log('⚠️ Session exists but no valid profile → redirect to signup');
          
          // ✅ 優先從 account 取得 email
          const email = session.account?.email || session.profile?.email || session.email || '';
          const provider = session.provider || 'oauth';
          
          console.log('📧 Email for signup:', email);
          
          setPendingSignup({
            email: email,
            verified: true,
            sessionData: session,
            provider: provider,
            fromOAuth: true
          });
          
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem('userData');
          setIsCheckingAuth(false);
          return;
        }
        
        // ✅ Profile 有效 → 建立 userData
        const email = profile.email || session.account?.email || session.profile?.email || '';
        
        const userData = {
          id: profile.user_id || profile.id,
          name: profile.name,
          email: email,
          avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=667eea&color=fff`,
          token: session.app_token || 'session-token',
          loginMethod: profile.provider || session.provider || 'unknown'
        };
        
        setIsLoggedIn(true);
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        console.log('✅ User authenticated successfully from profile API');
        
      } catch (profileError) {
        console.error('❌ Failed to get profile:', profileError);
        
        // Profile 錯誤 → 清除狀態
        console.log('⚠️ Clearing auth state due to profile error');
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('userData');
      }
    } else {
      console.log('⚠️ No valid session from backend');
      
      // ✅ Fallback: Check localStorage
      const savedUser = localStorage.getItem('userData');
      if (savedUser) {
        console.log('📦 Found cached user data, but session invalid - clearing...');
        localStorage.removeItem('userData');
      }
      
      setIsLoggedIn(false);
      setUser(null);
    }
    
  } catch (error) {
    console.error('❌ Auth check error:', error);
    
    // ✅ Network error → Fallback localStorage
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('📦 Using cached user data due to network error:', userData);
        setIsLoggedIn(true);
        setUser(userData);
      } catch (parseError) {
        console.error('❌ Invalid cached user data');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  } finally {
    setIsCheckingAuth(false);
    console.log('✅ Auth check completed');
  }
};

  const handleLogin = (userData) => {
    console.log('✅ App.js - handleLogin called:', userData);
    setIsLoggedIn(true);
    setUser(userData);
    setPendingSignup(null); // ✅ 清除待註冊狀態
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleSignUpComplete = (userData) => {
    console.log('✅ App.js - handleSignUpComplete called:', userData);
    setIsLoggedIn(true);
    setUser(userData);
    setPendingSignup(null); // ✅ 清除待註冊狀態
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await AuthAPI.logout();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setPendingSignup(null);
      localStorage.removeItem('userData');
    }
  };

  const ProtectedRoute = ({ children }) => {
    if (isCheckingAuth) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    // ✅ 如果有待註冊狀態，跳轉到註冊頁面
    if (pendingSignup && location.pathname !== '/signup') {
      return <Navigate to="/signup" replace />;
    }

    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  if (isCheckingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login page */}
      <Route 
        path="/login" 
        element={
          isLoggedIn ? 
          <Navigate to="/main" replace /> : 
          pendingSignup ? 
          <Navigate to="/signup" replace /> :
          <Login onLogin={handleLogin} />
        } 
      />

      {/* Signup page */}
      <Route 
        path="/signup" 
        element={
          isLoggedIn ? 
          <Navigate to="/main" replace /> : 
          <SignUp onSignUpComplete={handleSignUpComplete} />
        } 
      />

      {/* OAuth Callback */}
      <Route 
        path="/auth/callback" 
        element={<OAuthCallback onLogin={handleLogin} />} 
      />

      {/* Main page */}
      <Route 
        path="/main" 
        element={
          <ProtectedRoute>
            <MainApp user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />

      {/* Create post pages */}
      <Route 
        path="/create-post" 
        element={
          <ProtectedRoute>
            <CreatePostScreen user={user} />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/create-post/text" 
        element={
          <ProtectedRoute>
            <TextPostScreen user={user} />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/create-post/audio" 
        element={
          <ProtectedRoute>
            <AudioPostScreen user={user} />
          </ProtectedRoute>
        } 
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/main" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
