// ./src/pages/Context/Context.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import PostCard from '../../components/PostCard/PostCard';

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
// 支派種類結束


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
  'default': { name: 'TRIBE', icon: reubenIcon } // 預設值 (使用原來的 Reuben)
};


// ==================== Component Dropdown 隱私設定 ====================
const PrivacyDropdown = ({ onChange, initialValue = 'public' }) => {
  // ... (元件內容保持不變) ...
  const [selected, setSelected] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { id: 'all', label: '全部', icon: '🔍' },
    { id: 'public', label: '公開', icon: '🌐' },
    { id: 'family', label: '家族', icon: '👪' },
    { id: 'tribe', label: '支派', icon: '👥' },
    { id: 'private', label: '自己', icon: '🔒' }
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

// ==================== Component 評論 ====================
const Comment = ({ comment, onReply, onEdit, onDelete, onLike, currentUserId, postDocid }) => {
  // ... (元件內容保持不變) ...
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 載入回覆
  const loadReplies = async () => {
    if (loadingReplies || comment.isReply) return;

    setLoadingReplies(true);
    try {
      const result = await ApiService.getComments(postDocid, 1, 50);
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

  // 提交回覆
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await ApiService.replyToComment(
        currentUserId,
        comment.id,
        postDocid,
        replyText.trim()
      );

      if (result.success) {
        console.log('✅ 回覆成功:', result.comment);
        setReplyText('');
        setIsReplying(false);
        setReplies(prev => [result.comment, ...prev]);
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

  // 提交編輯
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
      alert(`編輯時發生錯誤: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 刪除評論
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
      alert(`刪除時發生錯誤: ${error.message}`);
    }
  };

  // 按讚評論
  const handleLike = async () => {
    try {
      const result = await ApiService.likeComment(comment.id, currentUserId);
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

      {/* 回覆表單 */}
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

      {/* 顯示回覆 */}
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

// ==================== Component 貼文（擴展版） ====================
const Post = ({ post, allPosts, onLike, onComment }) => {
  // ... (元件內容保持不變) ...
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // 錄音相關狀態
  const [transcriptData, setTranscriptData] = useState(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);

  const currentUserId = ApiService.getCurrentUserId();

  // 載入留言
  const loadComments = (page = 1, append = false) => {
    if (loadingComments) return;
    setLoadingComments(true);

    try {
      const allReplies = allPosts.filter(p => p.parent_docid === post.id);
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const pagedComments = allReplies.slice(startIndex, startIndex + pageSize);

      setComments(prevComments =>
        append ? [...prevComments, ...pagedComments] : pagedComments
      );
      setHasMoreComments(allReplies.length > page * pageSize);
    } catch (error) {
      console.error('載入評論錯誤:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // 切換留言表單
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

  // 載入更多留言
  const handleLoadMoreComments = () => {
    const nextPage = commentPage + 1;
    setCommentPage(nextPage);
    loadComments(nextPage, true);
  };

  // 查詢轉錄結果
  const handleGetTranscript = async () => {
    if (!post.audioRecordId || isLoadingTranscript) return;

    setIsLoadingTranscript(true);
    try {
      console.log(`🔍 查詢轉錄結果: ${post.audioRecordId}`);
      const result = await TRANSCRIPT_API.getTranscript(post.audioRecordId);

      if (result.success) {
        setTranscriptData(result);
        setShowTranscriptPanel(true);
        console.log('✅ 轉錄結果查詢成功:', result);
      } else {
        alert(`查詢轉錄結果失敗: ${result.error}`);
        console.error('❌ 轉錄結果查詢失敗:', result.error);
      }
    } catch (error) {
      console.error('💥 查詢轉錄結果時發生錯誤:', error);
      alert(`查詢轉錄結果時發生錯誤: ${error.message}`);
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  // 刪除錄音記錄
  const handleDeleteRecord = async () => {
    if (!post.audioRecordId || isDeletingRecord) return;

    const confirmDelete = window.confirm(
      `確定要刪除這個錄音記錄嗎？\n\n錄音 ID: ${post.audioRecordId}\n\n此操作無法復原！`
    );

    if (!confirmDelete) return;

    setIsDeletingRecord(true);
    try {
      console.log(`🗑️ 刪除錄音記錄: ${post.audioRecordId}`);
      const result = await TRANSCRIPT_API.deleteRecord(post.audioRecordId);

      if (result.success) {
        alert(`錄音記錄刪除成功！\n\n錄音 ID: ${post.audioRecordId}\n耗時: ${result.performance}`);
        console.log('✅ 錄音記錄刪除成功:', result);
        setTranscriptData(null);
        setShowTranscriptPanel(false);
      } else {
        alert(`刪除錄音記錄失敗: ${result.error}`);
        console.error('❌ 錄音記錄刪除失敗:', result.error);
      }
    } catch (error) {
      console.error('💥 刪除錄音記錄時發生錯誤:', error);
      alert(`刪除錄音記錄時發生錯誤: ${error.message}`);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  // 轉錄面板元件
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
          <p><strong>查詢耗時:</strong> {transcriptData?.performance}</p>
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
            <audio controls src={transcriptData.audio_url}>
              您的瀏覽器不支援音訊播放
            </audio>
            <a
              href={transcriptData.audio_url}
              target="_blank"
              rel="noopener noreferrer"
              className="audio-download-link"
            >
              📥 下載音檔
            </a>
          </div>
        )}

        {!transcriptData?.transcript && transcriptData?.status && (
          <div className="transcript-status">
            <p>⏳ 轉錄狀態: {transcriptData.status}</p>
            <p>💡 如果轉錄尚未完成，請稍後再查詢</p>
          </div>
        )}
      </div>
    </div>
  );

  // 按讚
  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    try {
      const result = await ApiService.likePost(post.id);
      if (result.success && onLike) {
        onLike(post.id);
      }
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // 提交評論
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      console.log(`💬 新增評論到貼文 sn=${post.sn}:`, commentText.trim());

      const result = await ApiService.addComment({
        userid: currentUserId,
        content: commentText.trim(),
        sn: post.sn
      });

      if (result.success) {
        console.log('✅ 評論新增成功:', result.comment);
        setCommentText('');
        if (onComment) onComment(post.id, commentText.trim());
      } else {
        alert(`評論失敗: ${result.message}`);
        console.error('❌ 評論失敗:', result.message);
      }
    } catch (error) {
      console.error('💥 評論錯誤:', error);
      alert(`評論時發生錯誤: ${error.message}`);
    } finally {
      setIsCommenting(false);
    }
  };

  // 評論操作處理
  const handleCommentReply = (commentId, reply) => {
    console.log(`💬 回覆評論 ${commentId}:`, reply);
  };

  const handleCommentEdit = (commentId, newContent) => {
    console.log(`✏️ 編輯評論 ${commentId}:`, newContent);
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, content: newContent, isEdited: true }
          : comment
      )
    );
  };

  const handleCommentDelete = (commentId) => {
    console.log(`🗑️ 刪除評論 ${commentId}`);
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  const handleCommentLike = (commentId) => {
    console.log(`👍 按讚評論 ${commentId}`);
    setComments(prev =>
      prev.map(comment =>
        comment.id === commentId
          ? { ...comment, likes: (comment.likes || 0) + 1 }
          : comment
      )
    );
  };

  return (
    <div className="post-card">
      {/* 貼文標頭 */}
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
          {post.privacy === 'public' && <span>🌐 公開</span>}
          {post.privacy === 'family' && <span>👪 家族</span>}
          {post.privacy === 'tribe' && <span>👥 支派</span>}
          {post.privacy === 'private' && <span>🔒 私人</span>}
        </div>
      </div>

      {/* 貼文內容 */}
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
                title="查詢此錄音的轉錄結果"
              >
                {isLoadingTranscript ? '查詢中...' : '📝 查詢轉錄'}
              </button>

              <button
                className={`audio-action-button delete-button ${isDeletingRecord ? 'loading' : ''}`}
                onClick={handleDeleteRecord}
                disabled={isDeletingRecord || isLoadingTranscript}
                title="刪除此錄音記錄（無法復原）"
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

      {/* 貼文操作按鈕 */}
      <div className="post-actions">
        <button
          className={`action-button ${isLiking ? 'loading' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <span className="action-icon"></span>
          {isLiking ? '按讚中...' : `Amen (${post.likes || 0})`}
        </button>

        <button
          className="action-button"
          onClick={handleToggleCommentForm}
        >
          <span className="action-icon"></span>
          pray for me ({showCommentForm ? comments.length : post.calculatedComments || post.comments || 0})
        </button>

        <button className="action-button">
          <span className="action-icon"></span> witness
        </button>
      </div>

      {/* 留言區塊 */}
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
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [notificationCount] = useState(0);
  const [coinAmount] = useState(200000);

  // ==================== 【修改處 1/2】 ====================
  // 處理 tribe props 的邏輯
  const userTribeId = user?.tribe;
  let tribeNameProp;
  let tribeLogoProp;

  if (userTribeId === null || userTribeId === undefined) {
    // 情況 1: tribe 為 null 或 undefined
    tribeNameProp = "not tribe";
    tribeLogoProp = null; // 傳遞 null，讓 UserHeader 元件處理
  } else {
    // 情況 2: 有 tribe ID (或使用預設)
    const tribeData = tribeIdMap[userTribeId] || tribeIdMap['default'];
    tribeNameProp = tribeData.name;
    tribeLogoProp = tribeData.icon;
  }
  // ==================== 【修改結束】 ====================


  // 【原始邏輯】
  // const userTribeId = user?.tribe;
  // const currentTribe = tribeIdMap[userTribeId] || tribeIdMap['default'];

  useEffect(() => {
    console.log('🏠 MainApp 載入，使用者:', user);
    console.log('🔧 目前API使用者:', ApiService.getCurrentUser());
    // console.log('🛡️ 當前支派 ID:', userTribeId, '對應:', currentTribe); // 可選的 debug
    
    // ✅ 【修改處 2/2】: 將 fetchPosts 移到 useCallback 中
    // 這樣 ESLint 就不會警告，同時確保 fetchPosts 不會在每次 render 時都重新創建
    // (雖然在這個例子中，直接加入依賴也可以，但 useCallBack 是更標準的做法)
    fetchPosts();
  }, [user]); // 依賴 user 保持不變

  // 取得演示貼文
  const getDemoPosts = useCallback(() => [
    {
      id: 'demo-1',
      title: '演示公開文章',
      content: '這是一篇演示公開文章，當API無法連接時顯示。包含完整的功能展示，如按讚、評論等互動功能。',
      privacy: 'public',
      author: user?.name || '演示用戶',
      time: '剛剛',
      image: null,
      likes: 5,
      comments: 2,
      audioRecordId: 'demo-audio-001'
    },
    {
      id: 'demo-2',
      title: '演示家族文章',
      content: '這是一篇演示家族文章，僅作為範例顯示。展示了家族隱私設定的功能。',
      privacy: 'family',
      author: user?.name || '演示用戶',
      time: '1小時前',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500',
      likes: 3,
      comments: 1,
      audioRecordId: null
    },
    {
      id: 'demo-3',
      title: '支派討論',
      content: '這是支派內部的討論貼文，展示了支派隱私設定功能。',
      privacy: 'tribe',
      author: user?.name || '演示用戶',
      time: '2小時前',
      image: null,
      likes: 8,
      comments: 4,
      audioRecordId: 'demo-audio-002'
    }
  ], [user?.name]);

  // 載入貼文
  // ✅ 【修改處 2/2】: 將 fetchPosts 包裹在 useCallback 中
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 從API取得貼文...');

      let result = await ApiService.getPosts(1, 50, true);

      if (!result || !result.success) {
        console.log('📡 嘗試一般貼文API...');
        result = await ApiService.getPosts();
      }

      if (result && result.success && result.posts && result.posts.length > 0) {
        console.log('✅ 貼文取得成功:', result.posts);

        // 儲存所有貼文
        setAllPosts(result.posts);

        // 計算留言數
        const commentsCountMap = {};
        result.posts.forEach(p => {
          if (p.parent_docid) {
            commentsCountMap[p.parent_docid] = (commentsCountMap[p.parent_docid] || 0) + 1;
          }
        });

        const filteredPosts = result.posts.filter(post => post.docid !== null);

        const transformedPosts = filteredPosts.map(post => ({
          id: post.docid || post.id || `post-${Date.now()}-${Math.random()}`,
          sn: post.sn,
          title: post.title || '',
          content: post.content || '',
          privacy: post.privacy || 'public',
          author: post.author || post.userid || user?.name || '匿名用戶',
          time: post.datetime || post.createdAt || post.time || '剛剛',
          image: post.image || null,
          likes: post.likes || 0,
          comments: post.comments || 0,
          audioRecordId: post.audioRecordId || post.uuid || null,
          parent_docid: post.parent_docid !== undefined ? post.parent_docid : null,
          calculatedComments: commentsCountMap[post.docid] || 0
        }));
        setPosts(transformedPosts);
      } else {
        console.log('⚠️ API 回應為空或失敗，使用演示資料');
        setPosts(getDemoPosts());
      }
    } catch (error) {
      console.error('💥 取得貼文時發生錯誤:', error);
      setPosts(getDemoPosts());
    } finally {
      setLoading(false);
    }
  }, [getDemoPosts, user?.name]); // ✅ 加入 getDemoPosts 和 user.name 作為依賴

  // 處理評論後刷新
  const handleCommentPost = async (postId, commentText) => {
    console.log(`💬 新評論於貼文 ${postId}:`, commentText);
    await fetchPosts();
  };

  // 處理登出
  const handleLogout = async () => {
    try {
      console.log('🚪 使用者登出...');

      setPosts([]);
      setPrivacyFilter('all');

      ApiService.clearCache();

      if (onLogout) {
        await onLogout();
      }

      console.log('🚀 導回 /login ...');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('💥 登出時發生錯誤:', error);
      navigate('/login', { replace: true });
    }
  };

  // 處理新增貼文
  const handleCreatePost = () => {
    console.log('🆕 導向新增貼文頁面...');
    navigate('/create-post', { replace: true });
  };

  // 處理通知點擊
  const handleNotificationClick = () => {
    console.log('🔔 通知被點擊');
    // 可以導航到通知頁面或顯示通知列表
  };

  // 處理金幣點擊
  const handleCoinClick = () => {
    console.log('🪙 金幣被點擊');
    // 可以導航到金幣商店或顯示金幣詳情
  };

  // 處理 Logo 點擊
  const handleLogoClick = () => {
    console.log('🏠 Logo 被點擊');
    // 可以回到頂部或重新整理
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 篩選貼文
  const getFilteredPosts = () => {
    if (privacyFilter === 'all') {
      return posts;
    }
    return posts.filter(post => post.privacy === privacyFilter);
  };

  // 處理按讚
  const handleLikePost = (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, likes: (post.likes || 0) + 1 }
          : post
      )
    );
  };

  // 重新整理貼文
  const handleRefreshPosts = async () => {
    setLoading(true);
    try {
      console.log('🔄 重新載入貼文...');

      ApiService.clearCache();

      const result = await ApiService.getPosts(1, 50, true);

      if (result && result.success && result.posts) {
        // 計算留言數
        const commentsCountMap = {};
        result.posts.forEach(p => {
          if (p.parent_docid) {
            commentsCountMap[p.parent_docid] = (commentsCountMap[p.parent_docid] || 0) + 1;
          }
        });

        const transformedPosts = result.posts
          .filter(post => post.docid !== null)
          .map(post => ({
            id: post.docid || post.id || `post-${Date.now()}-${Math.random()}`,
            sn: post.sn,
            title: post.title || '',
            content: post.content || '',
            privacy: post.privacy || 'public',
            author: post.author || post.userid || user?.name || '匿名用戶',
            time: post.datetime || post.createdAt || post.time || '剛剛',
            image: post.image || null,
            likes: post.likes || 0,
            comments: post.comments || 0,
            audioRecordId: post.audioRecordId || post.uuid || null,
            calculatedComments: commentsCountMap[post.docid] || 0
          }));

        setPosts(transformedPosts);
        setAllPosts(result.posts);
        console.log('✅ 貼文重新載入成功');
      } else {
        console.log('⚠️ 重新載入失敗，保持現有資料');
      }
    } catch (error) {
      console.error('💥 重新載入貼文錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = getFilteredPosts();

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="app-container">
        {/* 頂部使用者資訊列 */}   
       <UserHeader
         user={user}
         coins={coinAmount}
         tribeLogo={tribeLogoProp}  // <-- 【修改】使用新的 logo prop
         tribeName={tribeNameProp} // <-- 【修改】使用新的 name prop
         familyIcon={Mdi}
         blessingIcon={Fluent}
         notificationCount={notificationCount}
         onNotificationClick={handleNotificationClick}
         onCoinClick={handleCoinClick}
         onLogoClick={handleLogoClick}
       />

        {/* 功能列：通知鈴鐺和金幣 */}
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
        {/* 分類按鈕列 */}
        {/* Category Buttons với CategoryLabel hoàn chỉnh */}
<div className="category-buttons">
  <div className="category-item">
    <RectButton
      image={family_and_personal}
      imageAlt="Personal & Family"
      onClick={() => console.log('Personal & Family')}
      size="medium"
    />
    <CategoryLabel 
      text="Personal & Family" 
      enableMarquee={true}
      speed={8}
    />
  </div>

  <div className="category-item">
    <RectButton
      image={church}
      imageAlt="Church & Ministry"
      onClick={() => console.log('Church & Ministry')}
      size="medium"
    />
    <CategoryLabel 
      text="Church & Ministry" 
      enableMarquee={true}
        speed={8}
    />
  </div>

  <div className="category-item">
    <RectButton
      image={kingdom}
      imageAlt="Kingdom Prayer"
      onClick={() => console.log('Kingdom Prayer')}
      size="medium"
    />
    <CategoryLabel 
      text="Kingdom Prayer" 
      enableMarquee={true}
        speed={8}
    />
  </div>

  <div className="category-item">
    <RectButton
      image={tribe}
      imageAlt="Tribes Prayer"
      onClick={() => console.log('Tribes Prayer')}
      size="medium"
    />
    <CategoryLabel 
      text="Tribe Prayer" 
      enableMarquee={true}
        speed={8}
    />
  </div>
</div>

        <hr className="divider-line" />

        {/* 貼文篩選列 */}
        <div className="filter-bar">
          <div className="filter-controls">
           <RectButton
              icon=""
              onClick={handleRefreshPosts}
              disabled={loading}
              size="small"
              variant="secondary"
           >
              {loading ? '載入中...' : 'Original Post'}
           </RectButton>
           <RectButton
              icon=""
              onClick={() => console.log('Show Comments')}
              size="small"
              variant="secondary"
           >
              Witness Wall
           </RectButton>
          </div>

        </div>

        {/* 主要內容區域 */}
        <div className="main-content">
          {/* 貼文列表 */}
          <div className="posts-container">
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
               <p>嘗試切換到其他隱私設定查看現有貼文</p>
             </div>
           ) : null}
          </div>
        </div>

        {/* 底部導航列 */}
        <div className="bottom-navigation">
          <CircleButton
           provider="Home"
           iconSrc={Home}
           onClick={() => console.log('Home')}
           size="medium"
           ariaLabel="首頁"
          />
          <CircleButton
           provider="Search"
           iconSrc={Search}
           onClick={() => console.log('Search')}
           size="medium"
           ariaLabel="搜尋"
          />
          <CircleButton
           provider="Add"
           iconSrc= {Add}
           onClick={handleCreatePost}
           size="medium"
           ariaLabel="新增貼文"
          />
          <CircleButton
           provider="Profile"
           iconSrc={Profile}
           onClick={() => console.log('Profile')}
           size="medium"
           ariaLabel="個人資料"
          />
          <CircleButton
           provider="Nova"
           iconSrc={Nova}
           onClick={handleLogout}
           size="medium"
           ariaLabel="nova小天使"
          />
        </div>

      </div>
    </AppBackground>
  );
};

export default MainApp;