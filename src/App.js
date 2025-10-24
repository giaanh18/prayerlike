// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthAPI from './services/authApi';
import Login from './pages/Login/login';
import SignUp from './pages/SignUp/SignUp';
import OAuthCallback from './pages/OAuthCallback/OAuthCallback'; // ✅ THÊM
import MainApp from './pages/Context/context';
import CreatePostScreen from './pages/CreatePostScreen/CreatePostScreen';
import TextPostScreen from './pages/CreatePostScreen/TextPostScreen';
import AudioPostScreen from './pages/CreatePostScreen/AudioPostScreen';

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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

  const checkAuthStatus = async () => {
    try {
      const savedUser = localStorage.getItem('userData');
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        console.log('📦 Found saved user data:', userData);
        
        try {
          const session = await AuthAPI.getSession();
          console.log('📊 Session check:', session);
          
          if (session.authenticated) {
            setIsLoggedIn(true);
            setUser(userData);
            console.log('✅ User authenticated from saved session');
          } else {
            localStorage.removeItem('userData');
            console.log('⚠️ Session expired, cleared localStorage');
          }
        } catch (error) {
          console.error('❌ Session check failed:', error);
          localStorage.removeItem('userData');
        }
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogin = (userData) => {
    console.log('✅ App.js - handleLogin called:', userData);
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const handleSignUpComplete = (userData) => {
    console.log('✅ App.js - handleSignUpComplete called:', userData);
    setIsLoggedIn(true);
    setUser(userData);
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
      localStorage.removeItem('userData');
    }
  };

  const ProtectedRoute = ({ children }) => {
    if (isCheckingAuth) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '18px',
          color: '#666'
        }}>
          Loading...
        </div>
      );
    }

    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* 登入頁 */}
          <Route 
            path="/login" 
            element={isLoggedIn ? <Navigate to="/main" replace /> : <Login onLogin={handleLogin} />} 
          />

          {/* 註冊頁 */}
          <Route 
            path="/signup" 
            element={
              isLoggedIn ? 
              <Navigate to="/main" replace /> : 
              <SignUp onSignUpComplete={handleSignUpComplete} />
            } 
          />

          {/* ✅ THÊM: OAuth Callback Route */}
          <Route 
            path="/auth/callback" 
            element={<OAuthCallback onLogin={handleLogin} />} 
          />

          {/* 主頁 */}
          <Route 
            path="/main" 
            element={
              <ProtectedRoute>
                <MainApp user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* 建立貼文選擇頁 */}
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

          {/* 預設導向 */}
          <Route path="/" element={<Navigate to="/main" replace />} />
          {/* 404 導回登入 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
