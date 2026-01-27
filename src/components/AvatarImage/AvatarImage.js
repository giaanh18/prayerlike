// src/components/AvatarImage/AvatarImage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api';
import defaultAvatar from '../../assets/icons/Profileicon.png';
import './AvatarImage.css';

const AvatarImage = ({ 
  userId,           
  userName,         
  src,
  profileData,      
  size = 48, 
  editable = false,
  onUploadSuccess,
  clickable = false,
  onClick,
  className = ''
}) => {
  const navigate = useNavigate();
  // 如果有傳入 src，預設就直接顯示，不用等待
  const [avatarUrl, setAvatarUrl] = useState(src || defaultAvatar);
  const [loading, setLoading] = useState(!src && !!userId); // 如果有 src，就不需要 loading
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 取得姓名縮寫 (Fallback)
  const getInitials = () => {
    if (userName) return userName.charAt(0).toUpperCase();
    if (userId) return userId.charAt(0).toUpperCase();
    return '?';
  };

  useEffect(() => {
    // 1. 如果外部已經傳入 src (例如貼文列表)，直接顯示，不呼叫 API
    if (src) {
      setAvatarUrl(src);
      setLoading(false);
      return;
    }

    // 2. 如果沒有 userId，無法查詢
    if (!userId) {
      setLoading(false);
      return;
    }

    // 3. 沒有 src，必須自行查詢 (例如 UserHeader)
    let isMounted = true;
    const fetchAvatar = async () => {
      try {
        setLoading(true);
        
        // 優先檢查 profileData
        if (profileData && profileData.avatar_url) {
          if (isMounted) {
            setAvatarUrl(ApiService.processAvatarUrl(profileData.avatar_url));
            setLoading(false);
          }
          return;
        }

        // 呼叫 API (這裡會依賴 api.js 的智慧判斷)
        const result = await ApiService.getUserAvatar(userId);
        
        if (isMounted) {
          if (result.success && result.avatar_url) {
            setAvatarUrl(result.avatar_url);
          } else {
            setAvatarUrl(null); // 沒頭貼，顯示縮寫
          }
        }
      } catch (err) {
        console.error('❌ Error loading avatar:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAvatar();
    return () => { isMounted = false; };
  }, [userId, src, profileData]);

  // 處理上傳 (保持原有功能)
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('⚠️ 請選擇圖片檔案！');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ 圖片大小不能超過 5MB！');
      return;
    }

    setUploading(true);

    try {
      const result = await ApiService.uploadAvatar(userId, file);

      if (result.success) {
        // 強制重新整理快取並顯示新圖片
        const newUrl = result.avatar_url 
          ? ApiService.processAvatarUrl(result.avatar_url) 
          : URL.createObjectURL(file);
        
        setAvatarUrl(`${newUrl}?t=${Date.now()}`); // 加 timestamp 避免快取
        
        if (onUploadSuccess) onUploadSuccess(newUrl);
        alert('✅ 頭像更新成功！');
      } else {
        throw new Error(result.message || '上傳失敗');
      }
    } catch (error) {
      console.error('❌ Upload avatar failed:', error);
      alert(`❌ 更新失敗: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAvatarClick = (e) => {
    if (uploading) return;
    if (e.target.closest('.avatar-upload-overlay')) return;
    
    if (onClick) {
      onClick(userId);
      return;
    }
    
    if (clickable) {
      navigate('/profile', { state: { userId } });
    }
  };

  // 渲染 Loading 狀態
  if (loading) {
    return (
      <div className={`avatar-image-container loading ${className}`} style={{ width: size, height: size }}>
        <div className="avatar-spinner"></div>
      </div>
    );
  }

  return (
    <div 
      className={`avatar-image-container ${clickable ? 'avatar-clickable' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={handleAvatarClick}
      title={userName || userId}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName || userId || 'User avatar'}
          className={`avatar-image ${error ? 'error' : ''}`}
          style={{ width: size, height: size, objectFit: 'cover' }}
          onError={() => {
            setAvatarUrl(null); // 載入失敗時切換回縮寫模式
            setError(true);
          }}
          loading="lazy"
        />
      ) : (
        <div 
          className="avatar-initials"
          style={{ 
            width: size, 
            height: size,
            fontSize: size * 0.4,
            lineHeight: `${size}px`,
            backgroundColor: '#ccc', // 預設背景色
            color: '#fff'
          }}
        >
          {getInitials()}
        </div>
      )}
      
      {editable && (
        <label className="avatar-upload-overlay">
          {uploading ? '⏳' : '📷'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
};

export default AvatarImage;