  // src/App.js
  import React, { useState, useEffect, useCallback } from 'react';
  import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
  import AuthAPI from './services/authApi';
  import ApiService from './services/api';
  import Login from './pages/Login/login';
  import SignUp from './pages/SignUp/SignUp';
  import OAuthCallback from './pages/OAuthCallback/OAuthCallback';
  import MainApp from './pages/Context/context';
  import CreatePostScreen from './pages/CreatePostScreen/CreatePostScreen';
  import TextPostScreen from './pages/CreatePostScreen/TextPostScreen';
  import AudioPostScreen from './pages/CreatePostScreen/AudioPostScreen';
  import PrayerHub from './pages/PrayerHub/PrayerHub';
  import FriendList from './components/FriendList/FriendList';
  import AddFriend from './pages/AddFriend/AddFriend';
  import YBHistoricalRecord from './pages/YBHistoricalRecord/YBHistoricalRecord';
  import ActivityForm from './pages/Context/ActivityForm';
  import NovaScreen from './pages/NovaScreen/NovaScreen';
  import Profile from './pages/Profile/Profile';
  import Notifications from './pages/Notifications/Notifications'; // ✅ THÊM IMPORT

  import './App.css';

  const isDevelopment = process.env.NODE_ENV === 'development';

  function AppRoutes() {
    const navigate = useNavigate();
    const location = useLocation();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [pendingSignup, setPendingSignup] = useState(null);

    const ProtectedRoute = ({ children }) => {
      if (isCheckingAuth) {
        return <div>Loading...</div>;
      }
      
      if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
      }
      
      return children;
    };

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const token = localStorage.getItem('token');
          const localUserData = localStorage.getItem('user') || localStorage.getItem('userData');
          
          // 1. 先載入本地資料，讓畫面快速呈現 (Optimistic UI)
          if (token && localUserData) {
            const parsedUser = JSON.parse(localUserData);
            setUser(parsedUser);
            setIsLoggedIn(true);
          }

          // 2. 🟢 [關鍵修正] 主動向伺服器確認 Session 並獲取最新資料
          if (token) {
            console.log('🔄 Verifying session with server...');
            try {
              const sessionData = await AuthAPI.getSession();
              
              if (sessionData && sessionData.authenticated) {
                console.log('✅ Session verified:', sessionData);

                const account = sessionData.account || {};
                const profile = sessionData.profile || {};

                // 🟢 [解析頭貼] 優先順序：Account (自訂) > Profile (Google)
                const rawAvatar = account.avatar_url || profile.avatar_url || profile.picture;
                // 🟢 [處理路徑] 轉為絕對路徑
                const processedAvatar = ApiService.processAvatarUrl(rawAvatar);

                // 整合最新的 User 物件
                const freshUser = {
                  id: account.user_id || account.id, // 確保 ID 正確
                  name: account.name || profile.name,
                  email: account.email || profile.email,
                  tribe: account.tribe || profile.tribe,
                  avatar: processedAvatar, // 給 UI 顯示用
                  avatar_url: processedAvatar, // 同步欄位
                  token: token // 保留 Token
                };

                // 更新 State 與 LocalStorage
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
                localStorage.setItem('userData', JSON.stringify(freshUser));
                localStorage.setItem('currentUser', JSON.stringify(freshUser));
                setIsLoggedIn(true);
                
                if (isDevelopment) {
                  console.log('✅ User data refreshed from server:', freshUser);
                }
              } else {
                // Session 無效 (例如 Token 過期)
                console.warn('❌ Session invalid/expired');
                throw new Error('Session expired');
              }
            } catch (serverError) {
              console.error('❌ Server auth check failed:', serverError);
              // 如果是 401/403 錯誤，代表 Token 失效，強制登出
              if (serverError.message && (serverError.message.includes('401') || serverError.message.includes('403'))) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userData');
                localStorage.removeItem('currentUser');
                setUser(null);
                setIsLoggedIn(false);
              }
              // 其他網路錯誤則保留本地登入狀態 (Offline mode)
            }
          }
        } catch (error) {
          console.error('❌ Auth check error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userData');
          localStorage.removeItem('currentUser');
          setUser(null);
          setIsLoggedIn(false);
        } finally {
          setIsCheckingAuth(false);
        }
      };

      checkAuth();
    }, []);

    const handleLogin = useCallback((userData, token) => {
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('currentUser', JSON.stringify(userData));
        setUser(userData);
        setIsLoggedIn(true);
        setPendingSignup(null);
        
        if (isDevelopment) {
          console.log('✅ Login successful:', userData);
        }
        
        navigate('/main', { replace: true });
      } catch (error) {
        console.error('❌ Login error:', error);
      }
    }, [navigate]);

    const handleLogout = useCallback(() => {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        localStorage.removeItem('currentUser');
        setUser(null);
        setIsLoggedIn(false);
        setPendingSignup(null);
        
        if (isDevelopment) {
          console.log('✅ Logout successful');
        }
        
        navigate('/login', { replace: true });
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
    }, [navigate]);

    const handleSignUpComplete = useCallback((userData, token) => {
      try {
        if (isDevelopment) {
          console.log('✅ Signup complete:', userData);
        }
        
        handleLogin(userData, token);
      } catch (error) {
        console.error('❌ Signup complete error:', error);
      }
    }, [handleLogin]);

    const handleReturnToLogin = useCallback(() => {
      setPendingSignup(null);
      navigate('/login', { replace: true });
    }, [navigate]);

    return (
      <Routes>
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

        <Route
          path="/signup"
          element={
            isLoggedIn ?
              <Navigate to="/main" replace /> :
              <SignUp 
                onSignUpComplete={handleSignUpComplete} 
                onReturnToLogin={handleReturnToLogin} 
              />
          }
        />

        <Route
          path="/auth/callback"
          element={<OAuthCallback onLogin={handleLogin} />}
        />

        <Route
          path="/main"
          element={
            <ProtectedRoute>
              <MainApp user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/prayer-hub"
          element={
            <ProtectedRoute>
              <PrayerHub user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <FriendList user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/addfriend"
          element={
            <ProtectedRoute>
              <AddFriend user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/yb-history"
          element={
            <ProtectedRoute>
              <YBHistoricalRecord user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity-form"
          element={
            <ProtectedRoute>
              <ActivityForm user={user} onBack={() => navigate('/main')} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/nova"
          element={
            <ProtectedRoute>
              <NovaScreen user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* ✅✅✅ THÊM ROUTE MỚI - NOTIFICATIONS PAGE */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications user={user} />
            </ProtectedRoute>
          }
        />

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
