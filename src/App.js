// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import AuthAPI from './services/authApi';
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
import Profile from './pages/Profile/Profile'; // ✅ THÊM IMPORT PROFILE

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
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsLoggedIn(true);
          
          if (isDevelopment) {
            console.log('✅ User authenticated:', parsedUser);
          }
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
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

      {/* ✅✅✅ THÊM ROUTE MỚI - PROFILE PAGE */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile user={user} onLogout={handleLogout} />
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
