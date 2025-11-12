// src/App.js
import React, { useState, useEffect, useCallback } from 'react'; // ✅ 導入 useCallback
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

// ================== 【新增】 ==================
// 1. 檢查是否為開發環境 (npm start 會將此設為 'development')
const isDevelopment = process.env.NODE_ENV === 'development';
// ============================================

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
  }, []); // 👈 這個 useEffect 只在啟動時執行一次，保持原樣

  
  // ✅ 【修改處 1/3】: 登出函式
  // 將 handleLogout 包裹在 useCallback 中
  // 這樣它就可以安全地作為依賴傳入下方的 useEffect，並修復 ESLint 警告
  const handleLogout = useCallback(async () => {
    try {
      console.log('🚪 Logging out from App context...');
      await AuthAPI.logout();
      console.log('✅ API logout successful');
    } catch (error) {
      console.error('❌ Logout API call failed:', error);
    } finally {
      console.log('🧹 Clearing all local auth states...');
      setIsLoggedIn(false);
      setUser(null);
      setPendingSignup(null); // 👈 關鍵：清除待處理的註冊狀態
      localStorage.removeItem('userData');
      // 確保使用者在登出後總是返回登入頁面
      if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
      }
    }
  }, [navigate, location.pathname]); // ✅ 加入依賴


  useEffect(() => {
    // ✅ 【修改處 2/3】: Token 自動刷新
    // 只有在 "已登入" 且 "不是開發環境" 時才自動刷新 Token
    if (isLoggedIn && !isDevelopment) {
      console.log('✅ PRODUCTION: Enabling auto token refresh.');
      const interval = setInterval(async () => {
        try {
          console.log('🔄 Auto refreshing token...');
          const result = await AuthAPI.refreshToken();
          console.log('✅ Token refreshed:', result);
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
          handleLogout(); // 👈 現在呼叫 handleLogout 是安全的
        }
      }, 15 * 60 * 1000); // 15 minutes

      return () => clearInterval(interval);

    } else if (isLoggedIn && isDevelopment) {
      // 在開發模式下 (使用後門登入)，我們不希望刷新 Token
      console.warn('⚠️ DEV MODE: Auto token refresh is disabled.');
    }
  }, [isLoggedIn, handleLogout]); // ✅ 【修改處 3/3】: 加入 handleLogout 依賴


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
            tribe: session.account.tribe || null, 
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
          // 假設 AuthAPI.getProfile() 返回 profile 物件或 null
          const profile = await AuthAPI.getProfile();
          console.log('👤 Profile response:', profile);

          // 註：原始程式碼中對 profileResponse 的 .ok 和 .profile 檢查
          // 已被 AuthAPI.js 內部處理 (如我們之前討論的)
          // 這裡 'profile' 變數就是 API 回傳的 profile 物件本身或 null

          console.log('👤 Final profile:', profile);

          if (!profile || !profile.user_id) {
            console.warn('⚠️ Profile is null or invalid');
            console.log('⚠️ Session exists but no valid profile → redirect to signup');

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

          const email = profile.email || session.account?.email || session.profile?.email || '';

          const userData = {
            id: profile.user_id || profile.id,
            name: profile.name,
            email: email,
            tribe: profile.tribe || null, 
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
          console.log('⚠️ Clearing auth state due to profile error');
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem('userData');
        }
      } else {
        console.log('⚠️ No valid session from backend');
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
    setPendingSignup(null);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleSignUpComplete = (userData) => {
    console.log('✅ App.js - handleSignUpComplete called:', userData);
    setIsLoggedIn(true);
    setUser(userData);
    setPendingSignup(null);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  // (handleLogout 函式已被移到上方並使用 useCallback 包裹)

  const ProtectedRoute = ({ children }) => {
    if (isCheckingAuth) {
      return (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

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
            // ✅ 將 'handleLogout' (已使用 useCallback) 傳遞下去
            <SignUp onSignUpComplete={handleSignUpComplete} onReturnToLogin={handleLogout} />
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