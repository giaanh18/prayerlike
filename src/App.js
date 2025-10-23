// src/App.js


import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/login';
import SignUp from './pages/SignUp/SignUp.js';  // ✅ SignUp/SignUp.js (cả hai đều viết hoa)
import AuthCallback from './pages/AuthCallback/AuthCallback';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const authStatus = localStorage.getItem('isAuthenticated');
      const userData = localStorage.getItem('userData');
      
      if (authStatus === 'true' && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('❌ Check auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    console.log('✅ App: User logged in:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('userData', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
    if (userData.token) {
      localStorage.setItem('accessToken', userData.token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.clear();
    sessionStorage.clear();
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  const MainPage = () => (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🎉 歡迎來到主頁面！</h1>
      {user && (
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          padding: '30px',
          borderRadius: '15px',
          marginTop: '30px',
          backdropFilter: 'blur(10px)'
        }}>
          <img src={user.avatar} alt={user.name} style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            marginBottom: '15px',
            border: '3px solid white'
          }} />
          <p style={{ fontSize: '18px', marginTop: '15px' }}>
            <strong>姓名:</strong> {user.name}
          </p>
          <p style={{ fontSize: '16px' }}>
            <strong>Email:</strong> {user.email}
          </p>
          <p style={{ fontSize: '14px', opacity: 0.8 }}>
            <strong>用戶ID:</strong> {user.userId}
          </p>
          {user.loginMethod && (
            <p style={{ fontSize: '14px', opacity: 0.8 }}>
              <strong>登入方式:</strong> {user.loginMethod}
            </p>
          )}
          {user.provider && (
            <p style={{ fontSize: '14px', opacity: 0.8 }}>
              <strong>提供商:</strong> {user.provider}
            </p>
          )}
          <button onClick={handleLogout} style={{
            marginTop: '30px',
            padding: '12px 40px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            🚪 登出
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>載入中...</h2>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/main" replace /> : <Login onLogin={handleLogin} />
        } />
        
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/main" replace /> : <SignUp onLogin={handleLogin} />
        } />
        
        <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />
        
        <Route path="/main" element={
          <ProtectedRoute><MainPage /></ProtectedRoute>
        } />
        
        <Route path="/" element={
          <Navigate to={isAuthenticated ? "/main" : "/login"} replace />
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
