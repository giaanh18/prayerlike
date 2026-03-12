import React, { useState } from 'react';
import AvatarImage from '../AvatarImage/AvatarImage';
import './PostCard.css';

// ✅ Đặt ngoài component — chỉ tạo 1 lần, không re-create mỗi render
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const formatTime = (timeString) => {
  if (!timeString) return 'Just now';
  try {
    // Normalize: nếu DB trả về string không có 'Z' thì ép thành UTC
    const normalized = timeString.endsWith('Z') || timeString.includes('+')
      ? timeString
      : timeString + 'Z';

    const date = new Date(normalized);
    if (isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const diffMs = now - date;
    const diffMin  = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay  = Math.floor(diffMs / 86400000);

    if (diffMin < 1)   return 'Just now';
    if (diffMin < 60)  return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 7)   return `${diffDay} days ago`;

    // Hiển thị ngày theo timezone của user (format: 2025/03/12)
    return date.toLocaleDateString('en-CA', {
      timeZone: userTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch (e) {
    return 'Just now';
  }
};

// ==================== COMPONENT ====================
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
      public:  '🌐',
      family:  '👪',
      tribe:   '👥',
      private: '🔒'
    };
    return icons[privacy] || '🌐';
  };

  const getPrivacyLabel = (privacy) => {
    const labels = {
      public:  '公開',
      family:  '家族',
      tribe:   '支派',
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
              clickable={false}
            />
          </div>
          <div className="post-author-details">
            <div className="post-author-name">{post.author || 'Unknown User'}</div>
            {/* ✅ v3: dùng formatTime với timezone browser */}
            <div className="post-time">
              {formatTime(post.time || post.datetime || post.created_at)}
            </div>
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
