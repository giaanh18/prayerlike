  // // src/components/PostCard/PostCard.js
  // import React, { useState } from 'react';
  // import AvatarImage from '../AvatarImage/AvatarImage'; // 引入 AvatarImage
  // import './PostCard.css';

  // const PostCard = ({ 
  //   post,
  //   onLike,
  //   onComment,
  //   onShare,
  //   onAudioAction,
  //   currentUserId,
  //   className = '' 
  // }) => {
  //   const [isExpanded, setIsExpanded] = useState(false);
  //   const [isLiking, setIsLiking] = useState(false);

  //   const handleLike = async () => {
  //     if (isLiking || !onLike) return;
  //     setIsLiking(true);
  //     try {
  //       await onLike(post.id || post.docid); // 相容 docid
  //     } finally {
  //       setIsLiking(false);
  //     }
  //   };

  //   const getPrivacyIcon = (privacy) => {
  //     const icons = {
  //       public: '🌐',
  //       family: '👪',
  //       tribe: '👥',
  //       private: '🔒'
  //     };
  //     return icons[privacy] || '🌐';
  //   };

  //   const getPrivacyLabel = (privacy) => {
  //     const labels = {
  //       public: '公開',
  //       family: '家族',
  //       tribe: '支派',
  //       private: '私人'
  //     };
  //     return labels[privacy] || '公開';
  //   };

  //   return (
  //     <div className={`post-card ${className}`}>
  //       {/* 貼文標頭 */}
  //       <div className="post-card-header">
  //         <div className="post-author-info">
  //           {/* 🟢 使用 AvatarImage 取代原本的 img */}
  //           {/* 關鍵：傳入 src={post.avatar_url} 避免 N+1 重複請求 */}
  //           <div className="post-author-avatar">
  //             <AvatarImage 
  //               userId={post.userid}
  //               userName={post.author}
  //               src={post.avatar_url} 
  //               size={40}
  //               clickable={false} // ❌ TẮT CLICK (SỬA TỪ true → false)
  //             />
  //           </div>
  //           <div className="post-author-details">
  //             <div className="post-author-name">{post.author || 'Unknown User'}</div>
  //             <div className="post-time">{post.time || '剛剛'}</div>
  //           </div>
  //         </div>
  //         <div className="post-privacy-badge">
  //           <span className="privacy-icon">{getPrivacyIcon(post.privacy)}</span>
  //           <span className="privacy-label">{getPrivacyLabel(post.privacy)}</span>
  //         </div>
  //       </div>

  //       {/* 貼文內容 */}
  //       <div className="post-card-content">
  //         {post.title && <h3 className="post-title">{post.title}</h3>}
          
  //         <p className={`post-text ${isExpanded ? 'expanded' : ''}`}>
  //           {post.content}
  //         </p>
          
  //         {post.content && post.content.length > 150 && (
  //           <button 
  //             className="post-expand-btn"
  //             onClick={() => setIsExpanded(!isExpanded)}
  //           >
  //             {isExpanded ? '收起' : '展開'}
  //           </button>
  //         )}
          
  //         {/* 貼文附圖 */}
  //         {post.image && (
  //           <div className="post-image-container">
  //             <img src={post.image} alt="貼文內容" loading="lazy" />
  //           </div>
  //         )}

  //         {/* 錄音檔顯示 */}
  //         {post.audioRecordId && (
  //           <div className="post-audio-info">
  //             <span className="audio-icon">🎵</span>
  //             <span className="audio-text">附帶錄音檔案</span>
  //             {onAudioAction && (
  //               <button 
  //                 className="audio-action-btn"
  //                 onClick={() => onAudioAction(post.audioRecordId)}
  //               >
  //                 查看
  //               </button>
  //             )}
  //           </div>
  //         )}
  //       </div>

  //       {/* 貼文操作按鈕 */}
  //       <div className="post-card-actions">
  //         <button
  //           className={`post-action-btn ${isLiking ? 'loading' : ''}`}
  //           onClick={handleLike}
  //           disabled={isLiking}
  //         >
  //           <span className="action-icon">👍</span>
  //           <span className="action-text">Amen</span>
  //           {post.likes > 0 && <span className="action-count">({post.likes})</span>}
  //         </button>

  //         <button
  //           className="post-action-btn"
  //           onClick={() => onComment && onComment(post.id || post.docid)}
  //         >
  //           <span className="action-icon">💬</span>
  //           <span className="action-text">留言</span>
  //           {post.calculatedComments > 0 && (
  //             <span className="action-count">({post.calculatedComments})</span>
  //           )}
  //         </button>

  //         <button
  //           className="post-action-btn"
  //           onClick={() => onShare && onShare(post.id || post.docid)}
  //         >
  //           <span className="action-icon">↗️</span>
  //           <span className="action-text">見證</span>
  //         </button>
  //       </div>
  //     </div>
  //   );
  // };

  // export default PostCard;
  // src/components/PostCard/PostCard.js
  import React, { useState } from 'react';
  import AvatarImage from '../AvatarImage/AvatarImage'; // 引入 AvatarImage
  import './PostCard.css';

  const PostCard = ({ 
    post,
    onLike,
    onComment,
    onShare,
    onAudioAction,
    currentUserId,
    className = '' 
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const formatTime = (timeString) => {
  if (!timeString) return 'Vừa xong';
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return 'Vừa xong';
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60)  return 'Vừa xong';
    if (diffMin < 60)  return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7)   return `${diffDay} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
   return 'Vừa xong';
  }
};


    const handleLike = async () => {
      if (isLiking || !onLike) return;
      setIsLiking(true);
      try {
        await onLike(post.id || post.docid); // 相容 docid
      } finally {
        setIsLiking(false);
      }
    };

    const getPrivacyIcon = (privacy) => {
      const icons = {
        public: '🌐',
        family: '👪',
        tribe: '👥',
        private: '🔒'
      };
      return icons[privacy] || '🌐';
    };

    const getPrivacyLabel = (privacy) => {
      const labels = {
        public: '公開',
        family: '家族',
        tribe: '支派',
        private: '私人'
      };
      return labels[privacy] || '公開';
    };

    return (
      <div className={`post-card ${className}`}>
        {/* 貼文標頭 */}
        <div className="post-card-header">
          <div className="post-author-info">
            {/* 🟢 使用 AvatarImage 取代原本的 img */}
            {/* 關鍵：傳入 src={post.avatar_url} 避免 N+1 重複請求 */}
            <div className="post-author-avatar">
              <AvatarImage 
                userId={post.userid}
                userName={post.author}
                src={post.avatar_url} 
                size={40}
                clickable={false} // ❌ TẮT CLICK (SỬA TỪ true → false)
              />
            </div>
            <div className="post-author-details">
              <div className="post-author-name">{post.author || 'Unknown User'}</div>
              <div className="post-time">{formatTime(post.created_at)}</div>
            </div>
          </div>
          <div className="post-privacy-badge">
            <span className="privacy-icon">{getPrivacyIcon(post.privacy)}</span>
            <span className="privacy-label">{getPrivacyLabel(post.privacy)}</span>
          </div>
        </div>

        {/* 貼文內容 */}
        <div className="post-card-content">
          {post.title && <h3 className="post-title">{post.title}</h3>}
          
          <p className={`post-text ${isExpanded ? 'expanded' : ''}`}>
            {post.content}
          </p>
          
          {post.content && post.content.length > 150 && (
            <button 
              className="post-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '收起' : '展開'}
            </button>
          )}
          
          {/* 貼文附圖 */}
          {post.image && (
            <div className="post-image-container">
              <img src={post.image} alt="貼文內容" loading="lazy" />
            </div>
          )}

          {/* 錄音檔顯示 */}
          {post.audioRecordId && (
            <div className="post-audio-info">
              <span className="audio-icon">🎵</span>
              <span className="audio-text">附帶錄音檔案</span>
              {onAudioAction && (
                <button 
                  className="audio-action-btn"
                  onClick={() => onAudioAction(post.audioRecordId)}
                >
                  查看
                </button>
              )}
            </div>
          )}
        </div>

        {/* 貼文操作按鈕 */}
        <div className="post-card-actions">
          <button
            className={`post-action-btn ${isLiking ? 'loading' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <span className="action-icon">👍</span>
            <span className="action-text">Amen</span>
            {post.likes > 0 && <span className="action-count">({post.likes})</span>}
          </button>

          <button
            className="post-action-btn"
            onClick={() => onComment && onComment(post.id || post.docid)}
          >
            <span className="action-icon">💬</span>
            <span className="action-text">留言</span>
            {post.calculatedComments > 0 && (
              <span className="action-count">({post.calculatedComments})</span>
            )}
          </button>

          <button
            className="post-action-btn"
            onClick={() => onShare && onShare(post.id || post.docid)}
          >
            <span className="action-icon">↗️</span>
            <span className="action-text">見證</span>
          </button>
        </div>
      </div>
    );
  };

  export default PostCard;
