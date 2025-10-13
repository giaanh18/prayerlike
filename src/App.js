import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/login';
import SignUp from './pages/SignUp/SignUp';  // ✅ Đúng đường dẫn
import MainApp from './pages/Context/context';
import CreatePostScreen from './pages/CreatePostScreen/CreatePostScreen';
import TextPostScreen from './pages/CreatePostScreen/TextPostScreen';
import AudioPostScreen from './pages/CreatePostScreen/AudioPostScreen';

import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

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
            element={isLoggedIn ? <Navigate to="/main" replace /> : <SignUp />} 
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
