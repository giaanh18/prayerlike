// // src/components/AvatarImage/AvatarImage.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import ApiService from '../../services/api';
// import './AvatarImage.css';

// const API_BASE_URL = 'https://pray-api.yalinelena.church';

// const AvatarImage = ({ 
//   userId,           // ✅ ID của user cần hiển thị avatar
//   userName,         // ✅ Tên user (dùng cho fallback)
//   profileData,      // ✅ THÊM: Profile data nếu đã có sẵn
//   size = 48, 
//   editable = false,
//   onUploadSuccess,
//   clickable = false,
//   onClick
// }) => {
//   const navigate = useNavigate();
//   const [avatarUrl, setAvatarUrl] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(false);
//   const [uploading, setUploading] = useState(false);

//   // ✅ Generate initials for fallback
//   const getInitials = () => {
//     if (userName) {
//       return userName.charAt(0).toUpperCase();
//     }
//     if (userId) {
//       return userId.charAt(0).toUpperCase();
//     }
//     return '?';
//   };

//   // ✅ Build full URL từ relative path
//   const buildAvatarUrl = (avatarPath) => {
//     if (!avatarPath) return null;
    
//     // Nếu đã là full URL
//     if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
//       return avatarPath;
//     }
    
//     // Nếu là relative path
//     return `${API_BASE_URL}/${avatarPath.replace(/^\//, '')}`;
//   };

//   // ✅ Load avatar - FIXED để lấy avatar của TỪNG USER
//   useEffect(() => {
//     const loadAvatar = async () => {
//       if (!userId) {
//         console.warn('⚠️ AvatarImage: No userId provided');
//         setLoading(false);
//         return;
//       }

//       try {
//         console.log(`👤 Loading avatar for user: ${userId}`);
        
//         // ✅ CÁCH 1: Nếu đã có profileData, dùng luôn
//         if (profileData && profileData.avatar_url) {
//           const fullAvatarUrl = buildAvatarUrl(profileData.avatar_url);
//           console.log(`✅ Using avatar from profileData: ${fullAvatarUrl}`);
          
//           const img = new Image();
//           img.onload = () => {
//             setAvatarUrl(`${fullAvatarUrl}?t=${Date.now()}`);
//             setError(false);
//             setLoading(false);
//           };
//           img.onerror = () => {
//             console.warn(`⚠️ Avatar from profileData failed to load`);
//             setAvatarUrl(null);
//             setError(false);
//             setLoading(false);
//           };
//           img.src = fullAvatarUrl;
//           return;
//         }

//         // ✅ CÁCH 2: Gọi API lấy avatar của user này
//         const currentUserId = ApiService.getCurrentUserId();
        
//         // Nếu là user hiện tại, lấy từ session
//         if (userId === currentUserId) {
//           console.log(`👤 Loading avatar for current user from session`);
          
//           const sessionResult = await ApiService.getAuthSession();
          
//           if (sessionResult.success && sessionResult.session) {
//             const session = sessionResult.session;
            
//             // Ưu tiên: account.avatar_url (custom avatar)
//             let avatarPath = session.account?.avatar_url;
            
//             // Fallback: profile.picture (Google/OAuth avatar)
//             if (!avatarPath) {
//               avatarPath = session.profile?.picture;
//             }
            
//             if (avatarPath) {
//               const fullAvatarUrl = buildAvatarUrl(avatarPath);
//               console.log(`✅ Found avatar from session: ${fullAvatarUrl}`);
              
//               const img = new Image();
//               img.onload = () => {
//                 setAvatarUrl(`${fullAvatarUrl}?t=${Date.now()}`);
//                 setError(false);
//                 setLoading(false);
//               };
//               img.onerror = () => {
//                 setAvatarUrl(null);
//                 setError(false);
//                 setLoading(false);
//               };
//               img.src = fullAvatarUrl;
//               return;
//             }
//           }
//         } else {
//           // ✅ Nếu là user khác, gọi API getUserAvatar
//           console.log(`👤 Loading avatar for other user: ${userId}`);
          
//           const avatarResult = await ApiService.getUserAvatar(userId);
          
//           if (avatarResult.success && avatarResult.avatar_url) {
//             const fullAvatarUrl = avatarResult.avatar_url;
//             console.log(`✅ Found avatar from API: ${fullAvatarUrl}`);
            
//             const img = new Image();
//             img.onload = () => {
//               setAvatarUrl(`${fullAvatarUrl}?t=${Date.now()}`);
//               setError(false);
//               setLoading(false);
//             };
//             img.onerror = () => {
//               setAvatarUrl(null);
//               setError(false);
//               setLoading(false);
//             };
//             img.src = fullAvatarUrl;
//             return;
//           }
//         }
        
//         // ✅ Không có avatar, dùng initials
//         console.log(`⚠️ No avatar found for ${userId}, using initials`);
//         setAvatarUrl(null);
//         setError(false);
//         setLoading(false);

//       } catch (err) {
//         console.error('❌ Error loading avatar:', err);
//         setAvatarUrl(null);
//         setError(false);
//         setLoading(false);
//       }
//     };

//     loadAvatar();
//   }, [userId, userName, profileData]);

//   // ✅ Handle avatar upload
//   const handleUpload = async (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       alert('⚠️ Vui lòng chỉ chọn file ảnh!');
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       alert('⚠️ Kích thước ảnh không được vượt quá 5MB!');
//       return;
//     }

//     setUploading(true);

//     try {
//       console.log(`📤 Uploading avatar for ${userId}:`, file.name);
      
//       const result = await ApiService.uploadAvatar(userId, file);

//       if (result.success) {
//         console.log('✅ Avatar uploaded successfully:', result);
        
//         ApiService.clearCache();
        
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         console.log('🔄 Refreshing session...');
//         const sessionResult = await ApiService.getAuthSession();
        
//         if (sessionResult.success && sessionResult.session) {
//           const newAvatarPath = sessionResult.session.account?.avatar_url;
          
//           if (newAvatarPath) {
//             const newAvatarUrl = buildAvatarUrl(newAvatarPath);
//             const finalUrl = `${newAvatarUrl}?t=${Date.now()}`;
            
//             console.log('🖼️ New avatar URL from session:', finalUrl);
            
//             const img = new Image();
//             img.onload = () => {
//               console.log('✅ New avatar loaded successfully');
//               setAvatarUrl(finalUrl);
              
//               if (onUploadSuccess) {
//                 onUploadSuccess(finalUrl);
//               }
              
//               alert('✅ Avatar đã được cập nhật thành công!');
//             };
            
//             img.onerror = () => {
//               console.error('❌ New avatar failed to load');
//               alert('⚠️ Upload thành công nhưng không thể hiển thị. Vui lòng refresh trang.');
//               setTimeout(() => {
//                 window.location.reload();
//               }, 1000);
//             };
            
//             img.src = finalUrl;
//           } else {
//             console.warn('⚠️ No avatar_url in refreshed session');
//             alert('⚠️ Upload thành công. Vui lòng refresh trang để thấy avatar mới.');
//             setTimeout(() => {
//               window.location.reload();
//             }, 1000);
//           }
//         } else {
//           console.error('❌ Failed to refresh session');
//           alert('⚠️ Upload thành công. Vui lòng refresh trang để thấy avatar mới.');
//           setTimeout(() => {
//             window.location.reload();
//           }, 1000);
//         }
        
//       } else {
//         throw new Error(result.message || 'Upload failed');
//       }
//     } catch (error) {
//       console.error('❌ Upload avatar failed:', error);
//       alert(`❌ Upload thất bại: ${error.message}`);
//     } finally {
//       setUploading(false);
//       e.target.value = '';
//     }
//   };

//   // ✅ Handle click vào avatar
//   const handleAvatarClick = (e) => {
//     if (uploading) return;
    
//     if (e.target.closest('.avatar-upload-overlay')) return;
    
//     if (onClick) {
//       onClick(userId);
//       return;
//     }
    
//     if (clickable) {
//       console.log('👤 Avatar clicked, navigating to profile:', userId);
//       navigate('/profile', { state: { userId } });
//     }
//   };

//   // ✅ Render loading state
//   if (loading) {
//     return (
//       <div 
//         className="avatar-image-container loading" 
//         style={{ width: size, height: size }}
//       >
//         <div className="avatar-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <div 
//       className={`avatar-image-container ${clickable ? 'avatar-clickable' : ''}`}
//       style={{ width: size, height: size }}
//       onClick={handleAvatarClick}
//       title={clickable ? `View ${userName || userId}'s profile` : undefined}
//     >
//       {avatarUrl ? (
//         <img
//           src={avatarUrl}
//           alt={userName || userId || 'User avatar'}
//           className={`avatar-image ${error ? 'error' : ''}`}
//           style={{ width: size, height: size }}
//           onError={() => {
//             console.warn(`⚠️ Avatar load failed, switching to initials`);
//             setAvatarUrl(null);
//             setError(true);
//           }}
//         />
//       ) : (
//         <div 
//           className="avatar-initials"
//           style={{ 
//             width: size, 
//             height: size,
//             fontSize: size * 0.4,
//             lineHeight: `${size}px`
//           }}
//         >
//           {getInitials()}
//         </div>
//       )}
      
//       {editable && (
//         <label 
//           className="avatar-upload-overlay" 
//           title="Upload avatar"
//           onClick={(e) => e.stopPropagation()}
//         >
//           {uploading ? '⏳' : '📷'}
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleUpload}
//             disabled={uploading}
//             style={{ display: 'none' }}
//           />
//         </label>
//       )}
//     </div>
//   );
// };

// export default AvatarImage;


// src/components/AvatarImage/AvatarImage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api'; // 確保引用路徑正確
import defaultAvatar from '../../assets/icons/Profileicon.png';
import './AvatarImage.css';

const AvatarImage = ({ 
  userId,           
  userName,         
  src,              // 🟢 新增：接收外部傳入的完整圖片網址
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

  // 處理圖片載入邏輯
  useEffect(() => {
    // 🛑 情況 1：外部已經傳入 src (解決 N+1 問題的關鍵)
    if (src) {
      setAvatarUrl(src);
      setLoading(false);
      return;
    }

    // 🛑 情況 2：如果沒有 userId，什麼都做不了，顯示預設圖
    if (!userId) {
      setLoading(false);
      return;
    }

    // 🔄 情況 3：只有 ID，需要去抓取圖片 (保持原有的 Profile 頁面邏輯)
    let isMounted = true;

    const fetchAvatar = async () => {
      try {
        setLoading(true);
        
        // 優先使用 profileData
        if (profileData && profileData.avatar_url) {
          if (isMounted) {
            setAvatarUrl(ApiService.processAvatarUrl(profileData.avatar_url));
            setLoading(false);
          }
          return;
        }

        // 呼叫 API 獲取
        const result = await ApiService.getUserAvatar(userId);
        
        if (isMounted) {
          if (result.success && result.avatar_url) {
            setAvatarUrl(result.avatar_url);
          } else {
            // API 沒回傳圖片，使用預設圖或縮寫
            setAvatarUrl(null); 
          }
        }
      } catch (err) {
        console.error('❌ Error loading avatar:', err);
        if (isMounted) setAvatarUrl(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAvatar();

    return () => {
      isMounted = false;
    };
  }, [userId, src, profileData]); // 監聽 src 變化

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