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
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

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

  const privacyPolicyText = `Pray Like Incense

Personal Data Protection and Privacy Policy (Taiwan PDPA Version)

1. Introduction

Pray Like Incense (hereinafter referred to as “the Service”) values the privacy and personal data protection of every user.
This Policy is established in accordance with the Personal Data Protection Act of Taiwan and relevant regulations, and explains how the Service collects, processes, uses, and protects users’ personal data.

⸻

2. Purposes of Personal Data Collection

The Service collects personal data solely for the following purposes:
	1.	User account registration and identity verification
	2.	Publishing prayer requests, responses (Amen), and intercessory interaction features
	3.	Multilingual translation, system notifications, and service optimization
	4.	Account management, system maintenance, and security control
	5.	Internal statistics and analysis related to the Service’s mission (without personal identification)

All collection purposes are reasonable, necessary, and directly related to religious and community services.

⸻

3. Categories of Personal Data Collected

The personal data collected by the Service may include, but is not limited to, the following:

Basic Information:
	•	Email address
	•	Username (nickname)
	•	Language preference

Usage Records:
	•	Login time
	•	Prayer and response records
	•	System operation behavior (for technical and security purposes only)

⚠️ The Service does not proactively collect national identification numbers, physical addresses, phone numbers, financial account information, medical data, or other sensitive personal data.

⸻

4. Period, Area, Subjects, and Methods of Personal Data Use
	1.	Period:
From the date of user registration until account deletion or termination of the Service.
	2.	Area:
Primarily processed within Taiwan. If cross-border data storage is required due to cloud services, reasonable security protection measures will be implemented.
	3.	Subjects:
Limited to necessary administrative personnel of the Service or legally commissioned technical service providers. The Service will not sell, exchange, or rent personal data to any third party.
	4.	Methods:
Personal data is processed by automated or non-automated means within lawful and secure system environments.

⸻

5. Data Security and Protection Measures

The Service adopts reasonable technical and administrative measures to prevent unauthorized access, alteration, leakage, or destruction of personal data, including but not limited to:
	•	Access control management
	•	System protection and encrypted data transmission
	•	Confidentiality obligations for administrators
	•	Regular review and improvement of security measures

⸻

6. User Rights

In accordance with Article 3 of the Personal Data Protection Act, users may exercise the following rights regarding their personal data:
	1.	Request access or review
	2.	Request a copy
	3.	Request supplementation or correction
	4.	Request cessation of collection, processing, or use
	5.	Request deletion

Users may submit such requests through the contact channels provided by the Service.

⸻

7. Data Autonomy and Privacy Settings

Users may choose the visibility of prayer content published within the Service, including:
	•	Public display
	•	Limited to specific groups
	•	Personal private records

All disclosure settings are determined by the user. The Service will not alter visibility settings without user authorization.

⸻

8. Policy Amendments

The Service reserves the right to revise this Policy in response to legal amendments or service requirements. Revised versions will be announced on relevant Service pages without individual notice.

⸻

9. Contact Information

If you have any questions regarding this Policy, personal data protection matters, or wish to exercise rights under the Personal Data Protection Act, please contact us through the following official channel:

Official Contact Email:
📧 info@yalinelena.church

The Service will respond and assist with related requests within a reasonable timeframe.`;

  const handlePrivacyPolicy = () => {
    setShowPrivacyDialog(true);
  };

  const handleClosePrivacyPolicy = () => {
    setShowPrivacyDialog(false);
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
      {showPrivacyDialog && (
        <div className="privacy-dialog-overlay" onClick={handleClosePrivacyPolicy}>
          <div className="privacy-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="privacy-dialog-header">
              <h2>Privacy Policy</h2>
              <button
                className="privacy-dialog-close"
                onClick={handleClosePrivacyPolicy}
                aria-label="Close privacy policy"
              >
                ✕
              </button>
            </div>
            <div className="privacy-dialog-body">
              <pre className="privacy-dialog-text">{privacyPolicyText}</pre>
            </div>
          </div>
        </div>
      )}
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