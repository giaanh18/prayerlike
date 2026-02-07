// src/pages/Profile/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';
import AppBackground from '../../components/AppBackground/AppBackground';
import AvatarImage from '../../components/AvatarImage/AvatarImage';
import './Profile.css';

const ProviderIcon = ({ provider }) => {
  const icons = {
    google: '📧',
    gmail: '📧',
    facebook: '📘',
    apple: '🍎',
    email: '✉️'
  };
  
  const labels = {
    google: 'Google',
    gmail: 'Gmail',
    facebook: 'Facebook',
    apple: 'Apple',
    email: 'Email'
  };
  
  const providerLower = provider?.toLowerCase() || 'email';
  
  return (
    <div className="provider-badge">
      <span className="provider-icon">{icons[providerLower] || '🔐'}</span>
      <span className="provider-label">{labels[providerLower] || provider}</span>
    </div>
  );
};

const Profile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const targetUserId = location.state?.userId;
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [targetUserId]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading profile...');
      
      const sessionResult = await ApiService.getAuthSession();
      
      if (!sessionResult.success || !sessionResult.user) {
        throw new Error('未登入或 session 已過期');
      }
      
      const currentUserId = sessionResult.user.id || sessionResult.user.userId;
      console.log('✅ Current user ID:', currentUserId);
      console.log('🎯 Target user ID:', targetUserId);
      
      const viewingOwnProfile = !targetUserId || targetUserId === currentUserId;
      setIsOwnProfile(viewingOwnProfile);
      
      console.log('👤 Viewing own profile:', viewingOwnProfile);
      
      setSession(sessionResult.session);
      
      if (!viewingOwnProfile) {
        // 檢視他人檔案
        setProfile({
          id: targetUserId,
          name: targetUserId,
          email: 'Hidden',
          tribe: null,
          provider: 'unknown',
          avatar_url: null, 
          isPublicView: true
        });
        // ❌ 已移除 setNewName('');
      } else {
        // 檢視自己檔案
        const userData = sessionResult.user;
        const rawAccount = sessionResult.session?.account || {};
        const rawProfile = sessionResult.session?.profile || {};

        // 從 account 或 profile 取得原始頭像路徑
        const rawAvatarUrl = rawAccount.avatar_url || rawProfile.avatar_url || rawProfile.picture;
        
        // 使用 ApiService 進行路徑補全
        const finalAvatarUrl = ApiService.processAvatarUrl(rawAvatarUrl);

        setProfile({
          id: userData.id || userData.userId,
          name: userData.name,
          email: userData.email,
          tribe: userData.tribe,
          provider: sessionResult.session?.provider || 'email',
          avatar_url: finalAvatarUrl, // 將處理後的網址存入 state
          isPublicView: false
        });
        // ❌ 已移除 setNewName(userData.name || '');
      }
      
    } catch (err) {
      console.error('❌ Load profile error:', err);
      setError(err.message);
      
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.id) {
          console.log('📦 Using cached user data');
          setProfile({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            tribe: userData.tribe,
            provider: userData.provider || 'email',
            isPublicView: false
          });
          // ❌ 已移除 setNewName(userData.name || '');
          setError(null);
          setIsOwnProfile(true);
        }
      } catch (cacheErr) {
        console.error('❌ Cache read error:', cacheErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (!isOwnProfile) {
      alert('⚠️ 您無法更改其他用戶的頭像');
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = handleAvatarUpload;
    input.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('⚠️ 請選擇圖片檔案');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('⚠️ 圖片大小不能超過 10MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      console.log('📸 Uploading avatar:', file.name);
      
      const result = await ApiService.uploadAvatar(profile.id, file);

      if (result.success) {
        console.log('✅ Avatar uploaded successfully');
        alert('✅ 頭像更新成功！');
        window.location.reload();
      } else {
        throw new Error(result.message || '上傳失敗');
      }
    } catch (err) {
      console.error('❌ Upload avatar error:', err);
      alert(`❌ 上傳頭像失敗: ${err.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = async () => {
    if (!isOwnProfile) {
      handleBack();
      return;
    }
    
    const confirmLogout = window.confirm('確定要登出嗎？');
    if (!confirmLogout) return;

    try {
      await ApiService.logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('❌ Logout error:', err);
      navigate('/login', { replace: true });
    }
  };

  // Terms & Conditions Handlers
  const handlePrivacyPolicy = () => {
    window.open('https://your-website.com/privacy-policy', '_blank');
  };

  const handleTermsOfUse = () => {
    window.open('https://your-website.com/terms-of-use', '_blank');
  };

  const handleDeleteAccount = () => {
    if (!isOwnProfile) {
      alert('⚠️ 您無法刪除其他用戶的帳號');
      return;
    }

    const confirmDelete = window.confirm(
      '⚠️ 確定要刪除帳號嗎？\n\n此操作無法復原，所有資料將被永久刪除。'
    );
    
    if (confirmDelete) {
      const doubleConfirm = window.confirm(
        '🚨 最後確認：真的要刪除帳號嗎？'
      );
      
      if (doubleConfirm) {
        // TODO: 實作刪除帳號 API
        console.log('🗑️ Delete account requested');
        alert('此功能尚未開放');
      }
    }
  };

  if (loading) {
    return (
      <AppBackground backgroundColor="#2D3656">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>載入個人資料中...</p>
        </div>
      </AppBackground>
    );
  }

  if (error && !profile) {
    return (
      <AppBackground backgroundColor="#2D3656">
        <div className="profile-error">
          <div className="error-icon">⚠️</div>
          <h3>載入失敗</h3>
          <p>{error}</p>
          <button onClick={loadProfile} className="retry-btn">
            重試
          </button>
          <button onClick={handleBack} className="back-btn">
            返回
          </button>
        </div>
      </AppBackground>
    );
  }

  const provider = session?.provider || profile?.provider || 'email';

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="profile-container">
        {/* HEADER */}
        <div className="profile-header">
          <button className="back-button" onClick={handleBack}>
            ← 
          </button>
          <h1>{isOwnProfile ? '個人資料' : `${profile?.name} 的資料`}</h1>
          <button className="logout-button" onClick={handleLogout}>
            {isOwnProfile ? '登出' : '關閉'}
          </button>
        </div>

        {/* AVATAR SECTION */}
        <div className="profile-avatar-section">
          <div 
            className="avatar-wrapper" 
            onClick={handleAvatarClick}
            style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
          >
            <AvatarImage 
              userId={profile?.id}
              userName={profile?.name}
              src={profile?.avatar_url}
              size={120}
              clickable={false}
              editable={isOwnProfile}
            />
            {isOwnProfile && !uploadingAvatar && (
              <div className="avatar-edit-overlay">
                <span>📷</span>
              </div>
            )}
            {uploadingAvatar && (
              <div className="avatar-uploading-overlay">
                <div className="spinner-small"></div>
              </div>
            )}
          </div>
          
          {isOwnProfile && <ProviderIcon provider={provider} />}
        </div>

        {/* INFO SECTION */}
        <div className="profile-info-section">
          {isOwnProfile && (
            <div className="info-item">
              <label>Email</label>
              <div className="info-value">
                <span className="masked-email">{profile?.email}</span>
              </div>
            </div>
          )}

          <div className="info-item">
            <label>暱稱 (Nickname)</label>
            <div className="info-value">
              <span>{profile?.name || '未設定'}</span>
            </div>
          </div>

          <div className="info-item">
            <label>用戶 ID (User ID)</label>
            <div className="info-value">
              <span>{profile?.id}</span>
            </div>
          </div>

          {profile?.tribe !== null && profile?.tribe !== undefined && (
            <div className="info-item">
              <label>支派 (Tribe)</label>
              <div className="info-value">
                <span>Tribe {profile.tribe}</span>
              </div>
            </div>
          )}
        </div>

        {/* TERMS & CONDITIONS SECTION */}
        {isOwnProfile && (
          <div className="terms-section">
            <h2 className="terms-title">TERMS & CONDITIONS</h2>
            
            <div className="terms-item">
              <span className="terms-label">Privacy Policy</span>
              <button className="terms-read-btn" onClick={handlePrivacyPolicy}>
                Read in detail →
              </button>
            </div>

            <div className="terms-item">
              <span className="terms-label">Terms of Use</span>
              <button className="terms-read-btn" onClick={handleTermsOfUse}>
                Read in detail →
              </button>
            </div>

            <button className="delete-account-btn" onClick={handleDeleteAccount}>
              Delete Weverse Account
            </button>
          </div>
        )}

        {/* PUBLIC VIEW NOTICE */}
        {!isOwnProfile && (
          <div className="public-view-notice">
            <p>🔒 這是公開資料頁面，僅顯示基本資訊</p>
          </div>
        )}
      </div>
    </AppBackground>
  );
};

export default Profile;