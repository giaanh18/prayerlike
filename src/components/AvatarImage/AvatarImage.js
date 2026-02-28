// src/components/AvatarImage/AvatarImage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ✅ THÊM: Lấy user hiện tại từ localStorage
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.user_id || user.userId;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
    return null;
  };

  const getInitials = () => {
    if (userName) return userName.charAt(0).toUpperCase();
    if (userId) return userId.charAt(0).toUpperCase();
    return '?';
  };

  // 🎯 简化逻辑：只处理 URL，不做额外的 fetch
  useEffect(() => {
    console.log('🖼️ AvatarImage mount:', { 
      userId, 
      userName, 
      src,
      srcType: typeof src
    });
    
    // 如果有 src，处理成绝对 URL
    if (src) {
      const processedUrl = ApiService.processAvatarUrl(src);
      console.log('✅ Processed avatar URL:', {
        original: src,
        processed: processedUrl
      });
      setAvatarUrl(processedUrl);
    } else {
      console.log('⚠️ No src provided for avatar');
      setAvatarUrl(null);
    }
  }, [src, userId, userName]);

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
        const newUrl = result.avatar_url 
          ? ApiService.processAvatarUrl(result.avatar_url) 
          : URL.createObjectURL(file);
        
        setAvatarUrl(`${newUrl}?t=${Date.now()}`);
        
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
    
    // 🔒 只允许点击自己的头像
    const currentUserId = getCurrentUserId();
    if (userId && currentUserId && userId !== currentUserId) {
      return;
    }
    
    if (onClick) {
      onClick(userId);
      return;
    }
    
    if (clickable) {
      navigate('/profile', { state: { userId } });
    }
  };

  // ✅ 检查是否为自己的头像
  const currentUserId = getCurrentUserId();
  const isOwnAvatar = userId === currentUserId;

  return (
    <div 
      className={`avatar-image-container ${clickable && isOwnAvatar ? 'avatar-clickable' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={handleAvatarClick}
      title={userName || userId}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName || userId || 'User avatar'}
          className="avatar-image"
          style={{ width: size, height: size, objectFit: 'cover' }}
          onError={(e) => {
            console.error('❌ Avatar image load failed:', {
              userId,
              userName,
              attemptedUrl: avatarUrl
            });
            // 简单地隐藏图片，显示首字母
            setAvatarUrl(null);
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
            backgroundColor: '#ccc',
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
