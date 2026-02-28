// src/components/AvatarImage/AvatarImage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
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
  const [avatarUrl, setAvatarUrl] = useState(src || defaultAvatar);
  const [loading, setLoading] = useState(!src && !!userId);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ✅ THÊM: Lấy user hiện tại từ localStorage
  const getCurrentUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user.user_id || user.userId; // Tùy cấu trúc của bạn
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

  useEffect(() => {
    console.log('🖼️ AvatarImage useEffect:', { userId, userName, src, hasProfileData: !!profileData });
    
    if (src) {
      const processedUrl = ApiService.processAvatarUrl(src);
      console.log('✅ Using src prop:', src, '→', processedUrl);
      setAvatarUrl(processedUrl);
      setLoading(false);
      return;
    }

    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAvatar = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching avatar for userId:', userId);
        
        if (profileData && profileData.avatar_url) {
          const processedUrl = ApiService.processAvatarUrl(profileData.avatar_url);
          console.log('✅ Using profileData.avatar_url:', profileData.avatar_url, '→', processedUrl);
          if (isMounted) {
            setAvatarUrl(processedUrl);
            setLoading(false);
          }
          return;
        }

        const avatarUrl = await ApiService.getUserAvatar(userId);
        console.log('📥 getUserAvatar result:', avatarUrl);
        
        if (isMounted) {
          if (avatarUrl) {
            console.log('✅ Setting avatar URL:', avatarUrl);
            setAvatarUrl(avatarUrl);
          } else {
            console.log('⚠️ No avatar URL, using fallback');
            setAvatarUrl(null);
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
    
    // 🔒 THÊM: Chỉ cho phép click vào avatar của chính mình
    const currentUserId = getCurrentUserId();
    if (userId && currentUserId && userId !== currentUserId) {
      return; // ❌ Chặn click vào avatar người khác
    }
    
    if (onClick) {
      onClick(userId);
      return;
    }
    
    if (clickable) {
      navigate('/profile', { state: { userId } });
    }
  };

  if (loading) {
    return (
      <div className={`avatar-image-container loading ${className}`} style={{ width: size, height: size }}>
        <div className="avatar-spinner"></div>
      </div>
    );
  }

  // ✅ THÊM: Kiểm tra xem có phải avatar của mình không
  const currentUserId = getCurrentUserId();
  const isOwnAvatar = userId === currentUserId;

  return (
    <div 
      className={`avatar-image-container ${clickable && isOwnAvatar ? 'avatar-clickable' : ''} ${className}`}
      // ☝️ Chỉ thêm class clickable nếu là avatar của mình
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
            setAvatarUrl(null);
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
