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

  const privacyPolicyText = `《禱告如香 Pray Like Incense》

個人資料保護與隱私權政策（台灣個資法版）

一、前言

《禱告如香 Pray Like Incense》（以下簡稱「本服務」）重視每一位使用者的隱私與個人資料保護。本政策依據《個人資料保護法》及相關法令訂定，說明本服務如何蒐集、處理、利用及保護使用者的個人資料。

⸻

二、個人資料之蒐集目的

本服務蒐集個人資料之目的，僅限於下列用途：
  1. 使用者帳號建立與身分識別
  2. 禱告事項發布、回應（Amen）、代禱互動功能
  3. 多語翻譯、系統通知與服務優化
  4. 帳務管理、系統維護與安全控管
  5. 與本服務宗旨相關之內部統計與分析（不涉及個人識別）

蒐集目的均屬於合理、必要且與宗教及社群服務直接相關之範圍。

⸻

三、蒐集之個人資料類別

本服務可能蒐集的個人資料包含但不限於：
  • 基本資料：
  • 電子郵件信箱
  • 使用者名稱（暱稱）
  • 語言偏好
  • 使用紀錄資料：
  • 登入時間
  • 禱告與回應紀錄
  • 系統操作行為（僅作為技術與安全用途）

⚠️ 本服務不主動蒐集身分證字號、地址、電話、金融帳戶、醫療或其他敏感性個人資料。

⸻

四、個人資料之利用期間、地區、對象與方式
  1. 期間：
自使用者註冊起，至帳號刪除或服務終止為止。
  2. 地區：
主要於台灣地區進行處理，若因雲端服務需要跨境儲存，亦將採取合理之安全防護措施。
  3. 對象：
僅限本服務之必要管理人員或依法受委託之技術服務提供者，不會出售、交換或出租予第三方。
  4. 方式：
以自動化或非自動化方式，於合法、安全之系統環境中進行。

⸻

五、資料安全與保護措施

本服務採取合理之技術及管理措施，以防止個人資料遭未授權存取、竄改、洩漏或毀損，包括但不限於：
  • 存取權限控管
  • 系統防護與加密傳輸
  • 管理人員保密義務
  • 定期檢視與改善安全措施

⸻

六、使用者之權利

依《個人資料保護法》第三條規定，使用者得就其個人資料行使以下權利：
  1. 查詢或請求閱覽
  2. 請求製給複製本
  3. 請求補充或更正
  4. 請求停止蒐集、處理或利用
  5. 請求刪除

使用者可透過本服務提供之聯絡方式提出申請。

⸻

七、資料自主與公開設定

使用者於本服務中所發布之禱告內容，可自行選擇：
  • 公開顯示
  • 僅限特定群組
  • 個人私密紀錄

所有公開行為均基於使用者自主設定，本服務不會擅自變更其公開範圍。

⸻

八、政策修訂

本服務保留隨法令調整或服務需求修訂本政策之權利，修訂後將公告於本服務相關頁面，不另行個別通知。

⸻

九、聯絡方式（更新版）

如對本政策、個人資料保護事項，或欲行使《個人資料保護法》所定之相關權利，請透過以下官方管道與我們聯繫：

官方聯絡信箱：
📧 info@yalinelena.church

本服務將於合理期間內回覆並協助處理相關申請。`;

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