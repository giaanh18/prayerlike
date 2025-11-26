// ./src/pages/Context/Context.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation} from 'react-router-dom';
import ApiService from '../../services/api';
import TRANSCRIPT_API from '../../services/TranscriptAPI';

// 導入新元件
import AppBackground from '../../components/AppBackground/AppBackground';
import UserHeader from '../../components/UserHeader/UserHeader';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import CoinDisplay from '../../components/CoinDisplay/CoinDisplay';
import RectButton from '../../components/RectButton/RectButton';
import CircleButton from '../../components/CircleButton/CircleButton';
import CategoryLabel from '../../components/CategoryLabel/CategoryLabel';
import TribeDetail from './steps/TribeDetail';
import NoTribeDetail from './steps/NoTribeDetail';

// 導入圖片資源
import family_and_personal from '../../assets/icons/family_and_personal.png';
import church from '../../assets/icons/church.png';
import kingdom from '../../assets/icons/kingdom.png';
import tribe from '../../assets/icons/tribe.png';

import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

import Mdi from '../../assets/icons/mdi_family.png';
import Fluent from '../../assets/icons/fluent_people-interwoven-20-filled.png';

// 以下為所有可能的支派
import judahIcon from '../../assets/images/tribes/judah.png';
import reubenIcon from '../../assets/images/tribes/reuben.png';
import gadIcon from '../../assets/images/tribes/gad.png';
import asherIcon from '../../assets/images/tribes/asher.png';
import naphtaliIcon from '../../assets/images/tribes/naphtali.png';
import manassehIcon from '../../assets/images/tribes/manasseh.png';
import simeonIcon from '../../assets/images/tribes/simeon.png';
import leviIcon from '../../assets/images/tribes/levi.png';
import issacharIcon from '../../assets/images/tribes/issachar.png';
import zebulunIcon from '../../assets/images/tribes/zebulun.png';
import josephIcon from '../../assets/images/tribes/joseph.png';
import benjaminIcon from '../../assets/images/tribes/benjamin.png';

import './context.css';

// ==================== 支派 ID 對照表 ====================
const tribeIdMap = {
  1: { name: 'Judah', icon: judahIcon },
  2: { name: 'Reuben', icon: reubenIcon },
  3: { name: 'Gad', icon: gadIcon },
  4: { name: 'Asher', icon: asherIcon },
  5: { name: 'Naphtali', icon: naphtaliIcon },
  6: { name: 'Manasseh', icon: manassehIcon },
  7: { name: 'Simeon', icon: simeonIcon },
  8: { name: 'Levi', icon: leviIcon },
  9: { name: 'Issachar', icon: issacharIcon },
  10: { name: 'Zebulun', icon: zebulunIcon },
  11: { name: 'Joseph', icon: josephIcon },
  12: { name: 'Benjamin', icon: benjaminIcon },
};

const PrivacyDropdown = ({ onChange, initialValue = 'public' }) => {
  const [selected, setSelected] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { id: 'all', label: '全部', icon: '' },
    { id: 'public', label: '公開', icon: '' },
    { id: 'family', label: '家族', icon: '' },
    { id: 'tribe', label: '支派', icon: '' },
    { id: 'private', label: '自己', icon: '' }
  ];

  const selectedOption = options.find(option => option.id === selected);

  const handleSelect = (optionId) => {
    setSelected(optionId);
    setIsOpen(false);
    if (onChange) onChange(optionId);
  };

  return (
    <div className="privacy-dropdown">
      <div
        className="selected-option"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="privacy-icon">{selectedOption.icon}</span>
        <span className="privacy-label">{selectedOption.label}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="dropdown-options">
          {options.map((option) => (
            <div
              key={option.id}
              className={`dropdown-option ${selected === option.id ? 'selected' : ''}`}
              onClick={() => handleSelect(option.id)}
            >
              <span className="privacy-icon">{option.icon}</span>
              <span className="privacy-label">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Comment = ({ comment, onReply, onEdit, onDelete, onLike, currentUserId, postDocid }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReplies = async () => {
    if (loadingReplies || comment.isReply) return;

    setLoadingReplies(true);
    try {
      const result = await ApiService.getComments(postDocid);
      if (result.success) {
        const commentReplies = result.comments.filter(
          c => c.parent_comment_id === comment.id
        );
        setReplies(commentReplies);
      }
    } catch (error) {
      console.error('❌ 載入回覆錯誤:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await ApiService.addComment({
        userid: currentUserId,
        content: replyText.trim(),
        docid: postDocid
      });

      if (result.success) {
        console.log('✅ 回覆成功:', result.comment);
        setReplyText('');
        setIsReplying(false);
        setShowReplies(true);
        if (onReply) onReply(comment.id, result.comment);
      } else {
        alert(`回覆失敗: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ 回覆錯誤:', error);
      alert(`回覆時發生錯誤: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await ApiService.editComment(
        comment.id,
        currentUserId,
        editText.trim()
      );

      if (result.success) {
        console.log('✅ 編輯成功:', result.comment);
        setIsEditing(false);
        if (onEdit) onEdit(comment.id, editText.trim());
      } else {
        alert(`編輯失敗: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ 編輯錯誤:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('確定要刪除這則評論嗎？此操作無法復原！');
    if (!confirmDelete) return;

    try {
      const result = await ApiService.deleteComment(comment.id, currentUserId);
      if (result.success) {
        console.log('✅ 刪除成功');
        if (onDelete) onDelete(comment.id);
      } else {
        alert(`刪除失敗: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ 刪除錯誤:', error);
    }
  };

  const handleLike = async () => {
    try {
      const result = await ApiService.likePost(comment.id, currentUserId);
      if (result.success) {
        console.log('✅ 按讚成功');
        if (onLike) onLike(comment.id);
      } else {
        alert(`按讚失敗: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ 按讚錯誤:', error);
    }
  };

  const isOwner = comment.userid === currentUserId || comment.userid === String(currentUserId);

  return (
    <div className={`comment ${comment.isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-avatar">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=random&size=32`}
            alt="評論者頭像"
          />
        </div>
        <div className="comment-info">
          <div className="comment-author">{comment.author}</div>
          <div className="comment-time">{comment.time}</div>
        </div>
        {isOwner && (
          <div className="comment-owner-actions">
            <button
              className="comment-action-btn edit"
              onClick={() => setIsEditing(!isEditing)}
              title="編輯評論"
            >
              ✏️
            </button>
            <button
              className="comment-action-btn delete"
              onClick={handleDelete}
              title="刪除評論"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="comment-content">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="comment-edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="編輯您的評論..."
              rows="2"
              maxLength="500"
            />
            <div className="comment-edit-actions">
              <button
                type="submit"
                disabled={!editText.trim() || isSubmitting}
                className="comment-save-btn"
              >
                {isSubmitting ? '儲存中...' : '儲存'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(comment.content);
                }}
                className="comment-cancel-btn"
              >
                取消
              </button>
            </div>
          </form>
        ) : (
          <p>{comment.content}</p>
        )}
      </div>

      <div className="comment-actions">
        <button
          className="comment-action-btn like"
          onClick={handleLike}
          title="按讚評論"
        >
          👍 {comment.likes || 0}
        </button>

        {!comment.isReply && (
          <button
            className="comment-action-btn reply"
            onClick={() => setIsReplying(!isReplying)}
            title="回覆評論"
          >
            💬 回覆
          </button>
        )}

        {!comment.isReply && replies.length > 0 && (
          <button
            className="comment-action-btn show-replies"
            onClick={() => {
              setShowReplies(!showReplies);
              if (!showReplies && replies.length === 0) {
                loadReplies();
              }
            }}
            title={showReplies ? '隱藏回覆' : '顯示回覆'}
          >
            {showReplies ? '隱藏' : '顯示'} {replies.length} 則回覆
          </button>
        )}
      </div>

      {isReplying && (
        <form onSubmit={handleReplySubmit} className="comment-reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="寫下您的回覆..."
            rows="2"
            maxLength="300"
          />
          <div className="comment-reply-actions">
            <button
              type="submit"
              disabled={!replyText.trim() || isSubmitting}
              className="comment-reply-submit"
            >
              {isSubmitting ? '回覆中...' : '回覆'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                setReplyText('');
              }}
              className="comment-reply-cancel"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {showReplies && (
        <div className="comment-replies">
          {loadingReplies ? (
            <div className="loading-replies">載入回覆中...</div>
          ) : (
            replies.map(reply => (
              <Comment
                key={reply.id}
                comment={reply}
                onEdit={onEdit}
                onDelete={onDelete}
                onLike={onLike}
                currentUserId={currentUserId}
                postDocid={postDocid}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const Post = ({ post, allPosts, onLike, onComment }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const isLikingRef = useRef(false);

  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(post.isLiked || false);

  useEffect(() => {
    if (post.likes !== undefined) setLikeCount(post.likes);
    if (post.isLiked !== undefined) setHasLiked(post.isLiked);
  }, [post.likes, post.isLiked]);

  const [transcriptData, setTranscriptData] = useState(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);

  const currentUserId = ApiService.getCurrentUserId();

  const loadComments = (page = 1, append = false) => {
    if (loadingComments) return;
    setLoadingComments(true);

    try {
      const allReplies = allPosts.filter(p => p.parent_docid === post.id);
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const pagedComments = allReplies.slice(startIndex, startIndex + pageSize);

      const formattedComments = pagedComments.map(c => ({
          id: c.docid,
          author: c.userid,
          content: c.content,
          time: c.datetime || '剛剛',
          likes: c.amen_count || 0,
          isReply: true,
          userid: c.userid
      }));

      setComments(prevComments =>
        append ? [...prevComments, ...formattedComments] : formattedComments
      );
      setHasMoreComments(allReplies.length > page * pageSize);
    } catch (error) {
      console.error('載入評論錯誤:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleCommentForm = () => {
    if (!showCommentForm) {
      if (comments.length === 0) {
        loadComments(1, false);
        setCommentPage(1);
      }
      setShowCommentForm(true);
    } else {
      setShowCommentForm(false);
      setCommentText('');
      setComments([]);
      setCommentPage(1);
      setHasMoreComments(false);
    }
  };

  const handleLoadMoreComments = () => {
    const nextPage = commentPage + 1;
    setCommentPage(nextPage);
    loadComments(nextPage, true);
  };

  const handleGetTranscript = async () => {
    if (!post.audioRecordId || isLoadingTranscript) return;

    setIsLoadingTranscript(true);
    try {
      console.log(`🔍 查詢轉錄結果: ${post.audioRecordId}`);
      const result = await TRANSCRIPT_API.getTranscript(post.audioRecordId);

      if (result.success) {
        setTranscriptData(result);
        setShowTranscriptPanel(true);
      } else {
        alert(`查詢轉錄結果失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 查詢轉錄結果時發生錯誤:', error);
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!post.audioRecordId || isDeletingRecord) return;

    const confirmDelete = window.confirm(
      `確定要刪除這個錄音記錄嗎？\n\n錄音 ID: ${post.audioRecordId}\n\n此操作無法復原！`
    );
    if (!confirmDelete) return;

    setIsDeletingRecord(true);
    try {
      const result = await TRANSCRIPT_API.deleteRecord(post.audioRecordId);
      if (result.success) {
        alert(`錄音記錄刪除成功！\n耗時: ${result.performance}`);
        setTranscriptData(null);
        setShowTranscriptPanel(false);
      } else {
        alert(`刪除錄音記錄失敗: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 刪除錄音記錄時發生錯誤:', error);
      alert(`刪除錄音記錄時發生錯誤: ${error.message}`);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const TranscriptPanel = () => (
    <div className="transcript-panel">
      <div className="transcript-header">
        <h4>🎵 錄音轉錄結果</h4>
        <button
          className="close-transcript-button"
          onClick={() => setShowTranscriptPanel(false)}
        >
          ✕
        </button>
      </div>
      <div className="transcript-content">
        <div className="transcript-info">
          <p><strong>錄音 ID:</strong> {transcriptData?.recordId}</p>
          <p><strong>狀態:</strong> {transcriptData?.status}</p>
        </div>
        {transcriptData?.transcript && (
          <div className="transcript-text">
            <h5>📝 轉錄內容:</h5>
            <div className="transcript-content-text">
              {transcriptData.transcript}
            </div>
          </div>
        )}
        {transcriptData?.audio_url && (
          <div className="transcript-audio">
            <h5>🎧 音檔播放:</h5>
            <audio controls src={transcriptData.audio_url}>您的瀏覽器不支援音訊播放</audio>
          </div>
        )}
      </div>
    </div>
  );

  const handleLike = async () => {
    if (isLikingRef.current) return;
    isLikingRef.current = true;
    
    const prevLiked = hasLiked;
    const prevCount = likeCount;

    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setHasLiked(newLiked);
    setLikeCount(newCount);

    try {
      const result = await ApiService.likePost(post.id, currentUserId);
      
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newLiked;

        if (finalCount !== newCount) setLikeCount(finalCount);
        
        if (onLike) {
          onLike(post.id, finalLiked, finalCount);
        }
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('Like error:', error);
      setHasLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      isLikingRef.current = false;
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      console.log(`💬 新增評論到貼文 docid=${post.id}:`, commentText.trim());
      const result = await ApiService.addComment({
        userid: currentUserId,
        content: commentText.trim(),
        docid: post.id, 
        sn: post.sn 
      });

      if (result.success) {
        console.log('✅ 評論新增成功:', result.comment);
        setCommentText('');
        loadComments(1, false);
        if (onComment) onComment(post.id, commentText.trim());
      } else {
        alert(`評論失敗: ${result.message}`);
      }
    } catch (error) {
      console.error('💥 評論錯誤:', error);
      alert(`評論時發生錯誤: ${error.message}`);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentReply = (commentId, reply) => { console.log(`💬 回覆評論 ${commentId}:`, reply); };
  const handleCommentEdit = (commentId, newContent) => { console.log(`✏️ 編輯評論 ${commentId}:`, newContent); };
  const handleCommentDelete = (commentId) => { console.log(`🗑️ 刪除評論 ${commentId}`); };
  const handleCommentLike = (commentId) => { console.log(`👍 按讚評論 ${commentId}`); };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-avatar">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=random`}
            alt="用戶頭像"
          />
        </div>
        <div className="post-info">
          <div className="post-author">{post.author}</div>
          <div className="post-time">{post.time || post.datetime || '剛剛'}</div>
        </div>
        
        <div className="post-privacy-badge">
          {(!post.privacy || post.privacy === 'public') && <span>Public</span>}
          {post.privacy === 'family' && <span>Family</span>}
          {post.privacy === 'tribe' && <span>Tribe</span>}
          {(post.privacy === 'individual' || post.privacy === 'private') && <span>Individual</span>}
        </div>
        
      </div>

      <div className="post-content">
        {post.title && <h3>{post.title}</h3>}
        <p>{post.content}</p>
        {post.image && (
          <div className="post-image">
            <img src={post.image} alt="貼文圖片" />
          </div>
        )}
        {post.audioRecordId && (
          <div className="post-audio-info">
            <p>🎵 附帶錄音檔案 (UUID: {post.audioRecordId})</p>
            <div className="audio-management-buttons">
              <button
                className={`audio-action-button ${isLoadingTranscript ? 'loading' : ''}`}
                onClick={handleGetTranscript}
                disabled={isLoadingTranscript || isDeletingRecord}
              >
                {isLoadingTranscript ? '查詢中...' : '📝 查詢轉錄'}
              </button>
              <button
                className={`audio-action-button delete-button ${isDeletingRecord ? 'loading' : ''}`}
                onClick={handleDeleteRecord}
                disabled={isDeletingRecord || isLoadingTranscript}
              >
                {isDeletingRecord ? '刪除中...' : '🗑️ 刪除錄音'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showTranscriptPanel && transcriptData && (
        <TranscriptPanel />
      )}

      <div className="post-actions">
        <button
          className={`action-button ${isLiking ? 'loading' : ''} ${hasLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          <span className="action-icon"></span>
          {isLiking ? 'Processing...' : (hasLiked ? `Amened (${likeCount})` : `Amen (${likeCount})`)}
        </button>

        <button
          className="action-button"
          onClick={handleToggleCommentForm}
        >
          <span className="action-icon"></span>
          pray for me ({post.calculatedComments || 0})
        </button>

        <button className="action-button">
          <span className="action-icon"></span> witness
        </button>
      </div>

      {showCommentForm && (
        <>
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="寫下您的評論..."
              rows="3"
              maxLength="500"
            />
            <div className="comment-form-info">
              <span className="char-count">{commentText.length}/500</span>
            </div>
            <div className="comment-actions">
              <button
                type="submit"
                disabled={!commentText.trim() || isCommenting}
                className="comment-submit"
              >
                {isCommenting ? '發送中...' : '發送評論'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCommentForm(false);
                  setCommentText('');
                }}
                className="comment-cancel"
              >
                取消
              </button>
            </div>
          </form>

          <div className="comments-section">
            <div className="comments-header">
              <h4>💬 評論 ({comments.length})</h4>
              {loadingComments && <span className="loading-indicator">載入中...</span>}
            </div>

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onReply={handleCommentReply}
                    onEdit={handleCommentEdit}
                    onDelete={handleCommentDelete}
                    onLike={handleCommentLike}
                    currentUserId={currentUserId}
                    postDocid={post.id}
                  />
                ))
              ) : (
                <div className="no-comments">
                  <p>尚無評論，成為第一個留言的人！</p>
                </div>
              )}
            </div>

            {hasMoreComments && (
              <div className="load-more-comments">
                <button
                  onClick={handleLoadMoreComments}
                  disabled={loadingComments}
                  className="load-more-btn"
                >
                  {loadingComments ? '載入中...' : '載入更多評論'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== 主應用元件 ====================
const MainApp = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialCategory = location.state?.category || 'Personal & Family';
  
  const [activeTab, setActiveTab] = useState('Home');
  const [showTribeDetail, setShowTribeDetail] = useState(false);
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [notificationCount] = useState(0);
  const [coinAmount] = useState(200000);
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  
  // 新增：檢視模式狀態 ('original' 或 'witness')
  const [viewMode, setViewMode] = useState('original');

  const userTribeId = user?.tribe;
  let tribeNameProp;
  let tribeLogoProp;

  if (userTribeId === null || userTribeId === undefined) {
    tribeNameProp = "not tribe";
    tribeLogoProp = null;
  } else {
    const tribeData = tribeIdMap[userTribeId];
    tribeNameProp = tribeData?.name || 'Unknown';
    tribeLogoProp = tribeData?.icon || null;
  }

  const handleTribeLogoClick = () => {
    console.log('🏛️ 支派 Logo 被點擊');
    setShowTribeDetail(true);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    console.log(`切換到頁籤: ${tabName}`);
    if (tabName === 'Home') {
       window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    setActiveTab('Nova');
    try {
      console.log('🚪 使用者登出...');
      setPosts([]);
      setPrivacyFilter('all');
      ApiService.clearCache();
      if (onLogout) await onLogout();
      navigate('/login', { replace: true });
    } catch (error) {
      navigate('/login', { replace: true });
    }
  };

  const handleCreatePost = () => {
    setActiveTab('Add');
    navigate('/create-post', { replace: true });
  };

  const handleNotificationClick = () => {};
  const handleCoinClick = () => {};
  const handleLogoClick = () => { 
    handleTabChange('Home');
  };

  const getFilteredPosts = () => {
    if (privacyFilter === 'all') return posts;
    return posts.filter(post => post.privacy === privacyFilter);
  };

  const handleLikePost = (postId, newLikedStatus, newCount) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { 
              ...post, 
              likes: newCount, 
              isLiked: newLikedStatus, 
              amen_count: newCount,
              amened: newLikedStatus
            } 
          : post
      )
    );
  };

  const handleCommentPost = async (postId, commentText) => {
    console.log(`💬 新評論於貼文 ${postId}:`, commentText);
    await fetchPosts();
  };

  const mapCategoryToPrivacy = (category) => {
    if (!category) return 'public';
    const cat = category.toLowerCase();
    if (cat.includes('family')) return 'family';
    if (cat.includes('tribe')) return 'tribe';
    if (cat.includes('personal')) return 'private';
    return 'public';
  };

  const handleRefreshPosts = async () => {
    setLoading(true);
    // 注意：這裡不再將 selectedCategory 設為 null，以保持分類選取狀態
    try {
      ApiService.clearCache();
      await fetchPosts(selectedCategory); // 依據當前選取的分類重新載入
    } catch (error) {
      console.error('💥 重新載入貼文錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    console.log(`📂 切換分類至: ${category}`);
    
    // 修改：如果點擊已選取的分類，不做任何改變 (防止取消選取)
    if (selectedCategory === category) {
        return;
    }
    
    setSelectedCategory(category);
    fetchPosts(category);
  };

  const getDemoPosts = useCallback(() => [], [user?.name]);

  const fetchPosts = useCallback(async (categoryOverride) => {
    setLoading(true);
    try {
      console.log('📡 從API取得貼文...');

      const categoryToFetch = categoryOverride !== undefined ? categoryOverride : selectedCategory;

      const filters = {};
      if (categoryToFetch) {
        filters.category = categoryToFetch;
      }

      let result = await ApiService.getPosts(1, 50, true, filters);

      if (result && result.success && result.posts && result.posts.length > 0) {
        console.log('✅ 貼文取得成功:', result.posts);

        const commentsCountMap = {};
        result.posts.forEach(p => {
          if (p.parent_docid) {
            commentsCountMap[p.parent_docid] = (commentsCountMap[p.parent_docid] || 0) + 1;
          }
        });

        const filteredPosts = result.posts.filter(post => !post.parent_docid && post.docid);

        const transformedPosts = filteredPosts.map(post => ({
          id: post.docid,
          sn: post.sn,
          likes: post.amen_count !== undefined ? post.amen_count : 0, 
          isLiked: post.amened || false, 
          calculatedComments: commentsCountMap[post.docid] || 0,
          title: post.title || '',
          content: post.content || '',
          privacy: post.privacy ? post.privacy.toLowerCase() : mapCategoryToPrivacy(post.category),
          author: post.author || post.userid || user?.name || '匿名用戶',
          time: post.datetime || '剛剛',
          image: post.image || null,
          audioRecordId: post.uuid || null,
          comments: 0 
        }));
        
        setPosts(transformedPosts);
        setAllPosts(result.posts); 
      } else {
        console.log('⚠️ API 回應為空或失敗，使用演示資料');
        setPosts([]); 
        setAllPosts([]);
      }
    } catch (error) {
      console.error('💥 取得貼文時發生錯誤:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [getDemoPosts, user?.name, selectedCategory]);

  useEffect(() => {
    console.log('🏠 MainApp 載入，使用者:', user);
    fetchPosts(initialCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleCloseTribeDetail = () => {
    setShowTribeDetail(false);
  };

  if (showTribeDetail) {
    if (userTribeId === null || userTribeId === undefined) {
      return <NoTribeDetail onBack={handleCloseTribeDetail} />;
    }
    return (
      <TribeDetail
        tribeId={userTribeId}
        tribeName={tribeNameProp}
        tribeIcon={tribeLogoProp}
        onBack={handleCloseTribeDetail}
      />
    );
  }

  const filteredPosts = getFilteredPosts();

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="app-container">
        <UserHeader
          user={user}
          coins={coinAmount}
          tribeLogo={tribeLogoProp}
          tribeName={tribeNameProp}
          familyIcon={Mdi}
          blessingIcon={Fluent}
          notificationCount={notificationCount}
          onNotificationClick={handleNotificationClick}
          onCoinClick={handleCoinClick}
          onLogoClick={handleLogoClick}
          onTribeLogoClick={handleTribeLogoClick}
        />

        <div className="top-action-bar">
          <NotificationBell
            count={notificationCount}
            onClick={handleNotificationClick}
            size="medium"
          />
          <CoinDisplay
            amount={coinAmount}
            onClick={handleCoinClick}
            size="medium"
          />
        </div>

        <hr className="divider-line" />

        <div className="category-buttons">
           <div 
             className="category-item" 
             onClick={() => handleCategoryClick('Personal & Family')}
           >
            <RectButton
              image={family_and_personal}
              imageAlt="Personal & Family"
              size="medium"
              active={selectedCategory === 'Personal & Family'}
            />
            <CategoryLabel 
              text="Personal & Family" 
              isActive={selectedCategory === 'Personal & Family'} 
            />
          </div>
          <div 
              className="category-item"
              onClick={() => handleCategoryClick('Church & Ministry')}
            >
              <RectButton 
                image={church} 
                imageAlt="Church & Ministry" 
                size="medium" 
                active={selectedCategory === 'Church & Ministry'}
              />
              <CategoryLabel 
                text="Church & Ministry" 
                isActive={selectedCategory === 'Church & Ministry'}
              />
          </div>
          <div 
              className="category-item"
              onClick={() => handleCategoryClick('Kingdom Prayer')}
            >
              <RectButton 
                image={kingdom} 
                imageAlt="Kingdom Prayer" 
                size="medium" 
                active={selectedCategory === 'Kingdom Prayer'}
              />
              <CategoryLabel 
                text="Kingdom Prayer" 
                isActive={selectedCategory === 'Kingdom Prayer'}
              />
          </div>
          <div 
              className="category-item"
              onClick={() => handleCategoryClick('Tribe Prayer')}
            >
              <RectButton 
                image={tribe} 
                imageAlt="Tribes Prayer" 
                size="medium" 
                active={selectedCategory === 'Tribe Prayer'}
              />
              <CategoryLabel 
                text="Tribe Prayer" 
                isActive={selectedCategory === 'Tribe Prayer'}
              />
          </div>
        </div>
        
        <hr className="divider-line" />
        
        <div className="filter-bar">
          <div className="filter-controls">
            <RectButton 
              icon="" 
              onClick={() => {
                setViewMode('original');
                handleRefreshPosts();
              }} 
              disabled={loading} 
              size="small" 
              variant="secondary"
              active={viewMode === 'original'} // 加入 active 判斷
            >
              {loading ? '載入中...' : 'Original Post'}
            </RectButton>
            <RectButton 
              icon="" 
              onClick={() => {
                setViewMode('witness');
                console.log('Show Comments');
              }} 
              size="small" 
              variant="secondary"
              active={viewMode === 'witness'} // 加入 active 判斷
            >
              Witness Wall
            </RectButton>
          </div>
        </div>

        <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '50vh', alignItems: 'stretch' }}>
          <div className="posts-container" style={{ flex: 1, width: '100%' }}>
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>載入中...</p>
              </div>
            )}

            {!loading && filteredPosts.length > 0 ? (
              <div className="posts-feed">
                {filteredPosts.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    allPosts={allPosts}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                  />
                ))}
              </div>
            ) : !loading ? (
              <div className="no-posts">
                <div className="no-posts-icon">📭</div>
                <h4>沒有符合此隱私設定的貼文</h4>
                <p>
                  {selectedCategory 
                    ? `目前分類：${selectedCategory} 尚無資料` 
                    : '嘗試切換到其他隱私設定查看現有貼文'}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* ✅ BOTTOM NAVIGATION - NÚT 2 LÀ PRAYER HUB */}
        <div className="bottom-navigation">
           {/* Nút 1: Home */}
           <CircleButton 
             provider="Home" 
             iconSrc={Home} 
             onClick={() => {
               console.log('🏠 Home clicked');
               handleTabChange('Home');
             }}
             isActive={activeTab === 'Home'}
             size="medium" 
             ariaLabel="首頁" 
           />
           
           {/* Nút 2: Prayer Hub ✅ */}
           <CircleButton 
             provider="PrayerHub" 
             iconSrc={Search} 
             onClick={() => {
               console.log('🙏 Prayer Hub clicked');
               setActiveTab('PrayerHub');
               navigate('/prayer-hub');
             }}
             isActive={activeTab === 'PrayerHub'}
             size="medium" 
             ariaLabel="Prayer Hub" 
           />
           
           {/* Nút 3: Add */}
           <CircleButton 
             provider="Add" 
             iconSrc={Add} 
             onClick={() => {
               console.log('➕ Add clicked');
               handleCreatePost();
             }}
             isActive={activeTab === 'Add'}
             size="medium" 
             ariaLabel="新增貼文" 
           />
           
           {/* Nút 4: Search (đã dời từ nút 2) */}
           <CircleButton 
             provider="Search" 
             iconSrc={Profile} 
             onClick={() => {
               console.log('🔍 Search clicked');
               handleTabChange('Search');
             }}
             isActive={activeTab === 'Search'}
             size="medium" 
             ariaLabel="搜尋" 
           />
           
           {/* Nút 5: Nova */}
           <CircleButton 
             provider="Nova" 
             iconSrc={Nova} 
             onClick={() => {
               console.log('🚪 Logout clicked');
               handleLogout();
             }}
             isActive={activeTab === 'Nova'}
             size="medium" 
             ariaLabel="nova小天使" 
           />
        </div>
      </div>
    </AppBackground>
  );
};

export default MainApp;