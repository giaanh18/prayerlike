// src/pages/PrayerHub/PrayerHub.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import TribeDetail from '../Context/steps/TribeDetail';
import NoTribeDetail from '../Context/steps/NoTribeDetail';
import VoiceRecordButton from '../../components/VoiceRecordButton/VoiceRecordButton';
import AvatarImage from '../../components/AvatarImage/AvatarImage';

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

import './PrayerHub.css';

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

// ==================== 🌐 TRANSLATE ICON COMPONENT ====================
const TranslateIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" />
  </svg>
);

// ==================== ✅ WITNESS WALL COMPONENT ====================
const WitnessWall = ({ currentUserId, allPosts, privacyFilter, categoryFilter, refreshBalance }) => {
  const [witnesses, setWitnesses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWitnesses = async () => {
      setLoading(true);
      try {
        const filters = {};
        
        if (privacyFilter && privacyFilter !== 'Public') {
          filters.privacy = privacyFilter.toLowerCase();
        }
        
        if (categoryFilter) {
          filters.category = categoryFilter;
        }

        console.log('📡 Fetching witnesses with filters:', filters);
        
        const result = await ApiService.getWitnessList(1, 100, filters);
        
        if (result.success) {
          let filteredWitnesses = result.witnesses;

          if (privacyFilter && privacyFilter !== 'Public') {
            filteredWitnesses = filteredWitnesses.filter(w => {
              const originalPost = w.original_post || allPosts?.find(p => p.docid === w.parent_docid);
              return originalPost?.privacy?.toLowerCase() === privacyFilter.toLowerCase();
            });
          }

          if (categoryFilter) {
            filteredWitnesses = filteredWitnesses.filter(w => {
              const originalPost = w.original_post || allPosts?.find(p => p.docid === w.parent_docid);
              return originalPost?.category === categoryFilter;
            });
          }

          console.log(`✅ Loaded ${filteredWitnesses.length} witnesses`);
          setWitnesses(filteredWitnesses);
        }
      } catch (error) {
        console.error('❌ Error loading witnesses:', error);
        setWitnesses([]);
      } finally {
        setLoading(false);
      }
    };

    loadWitnesses();
  }, [allPosts, privacyFilter, categoryFilter]);

  if (loading) {
    return (
      <div className="witness-wall-loading">
        <div className="witness-wall-loading-spinner"></div>
        <p>載入見證中...</p>
      </div>
    );
  }

  if (!witnesses || witnesses.length === 0) {
    return (
      <div className="witness-wall-empty">
        <div className="witness-wall-empty-icon">✨</div>
        <h3>尚無見證</h3>
        <p>此分類目前沒有見證，成為第一個分享見證的人！</p>
      </div>
    );
  }

  return (
    <div className="witness-wall">
      <div className="witness-wall-grid">
        {witnesses.map(witness => {
          const originalPost = witness.original_post || 
            allPosts?.find(p => p.docid === witness.parent_docid);

          return (
            <div key={witness.docid} className="witness-wall-post-card">
              {originalPost && (
                <div className="witness-original-post-section">
                  <div className="post-header">
                    <div className="post-avatar">
                      <AvatarImage 
                        userId={originalPost.userid || originalPost.author}
                        userName={originalPost.userid || originalPost.author}
                        size={48}
                        clickable={true}
                      />
                    </div>
                    <div className="post-info">
                      <div className="post-author">{originalPost.userid || originalPost.author}</div>
                      <div className="post-time">{originalPost.datetime || '剛剛'}</div>
                    </div>
                  </div>

                  <div className="post-content">
                    {originalPost.title && <h3>{originalPost.title}</h3>}
                    <p>{originalPost.content}</p>
                  </div>
                </div>
              )}

              <div className="witness-section">
                <div className="witness-wall-header">
                  <div className="witness-wall-avatar">
                    <AvatarImage 
                      userId={witness.userid}
                      userName={witness.userid}
                      size={48}
                      clickable={true}
                    />
                  </div>
                  <div className="witness-wall-info">
                    <div className="witness-wall-author">{witness.userid}</div>
                    <div className="witness-wall-time">{witness.datetime || '剛剛'}</div>
                  </div>
                </div>
                
                <div className="witness-wall-content">
                  {witness.title && <h4>{witness.title}</h4>}
                  <p>{witness.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== ✅ COMMENT COMPONENT (ĐÃ XÓA NÚT EDIT, DELETE VÀ CHAR COUNT) ====================
const Comment = ({ comment, onReply, onEdit, onDelete, onLike, currentUserId, postDocid, commentState }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translationError, setTranslationError] = useState(null);

  useEffect(() => {
    setIsTranslating(false);
    setTranslatedContent(null);
    setTranslationError(null);
  }, [comment.id]);

  const handleTranslate = async () => {
    if (isTranslating) return;

    if (translatedContent) {
      setTranslatedContent(null);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      console.log(`🌐 Translating comment ${comment.id}...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockTranslation = `[Translated] ${comment.content}`;
      setTranslatedContent(mockTranslation);
      console.log(`✅ Comment ${comment.id} translation completed`);
    } catch (error) {
      console.error(`❌ Comment ${comment.id} translation error:`, error);
      setTranslationError('翻譯失敗');
    } finally {
      setIsTranslating(false);
    }
  };

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

  return (
    <div className={`comment ${comment.isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-avatar">
          <AvatarImage 
            userId={comment.userid || comment.author}
            userName={comment.author}
            size={32}
            clickable={true}
          />
        </div>
        <div className="comment-info">
          <div className="comment-author">{comment.author}</div>
          <div className="comment-time">{comment.time}</div>
        </div>
      </div>

      <div className="comment-content">
        {/* ✅ GIỮ LẠI NÚT DỊCH */}
        <button
          className={`comment-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
          title={translatedContent ? '隱藏翻譯' : '翻譯此評論'}
        >
          <TranslateIcon size={14} />
        </button>

        <p>{comment.content}</p>

        {translatedContent && (
          <div className="comment-translated-content">
            <span className="translate-label">🌐 翻譯:</span>
            <p>{translatedContent}</p>
          </div>
        )}

        {translationError && (
          <div className="comment-translation-error">
            ⚠️ {translationError}
          </div>
        )}
      </div>

      <div className="comment-actions">
        <button
          className={`comment-action-btn like ${commentState?.isLiked ? 'active-amen' : ''}`}
          onClick={() => onLike(comment.id)}
          disabled={commentState?.isLiking}
          title={commentState?.isLiked ? '取消 Amen' : 'Amen 評論'}
        >
          {commentState?.isLiking ? 'Processing...' : `AMEN (${commentState?.likeCount || 0})`}
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

      {/* ✅ ĐÃ XÓA PHẦN CHAR COUNT (0/300) */}
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
                commentState={commentState}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ==================== ✅ POST COMPONENT ====================
const Post = ({ post, allPosts, onLike, onComment, currentUserId, selectedCategory, refreshBalance }) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [commentStates, setCommentStates] = useState({});

  const isLikingRef = useRef(false);

  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);

  const [showCommentForm, setShowCommentForm] = useState(false);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translationError, setTranslationError] = useState(null);

  useEffect(() => {
    setLikeCount(post.likes || 0);
    setIsLiked(post.isLiked || false);
  }, [post.likes, post.isLiked]);

  useEffect(() => {
    setIsTranslating(false);
    setTranslatedContent(null);
    setTranslationError(null);
  }, [post.id]);

  const handleTranslate = async () => {
    if (isTranslating) return;

    if (translatedContent) {
      setTranslatedContent(null);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      console.log(`🌐 Translating post ${post.id}...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockTranslation = `[Translated] ${post.content}`;
      setTranslatedContent(mockTranslation);
      console.log(`✅ Post ${post.id} translation completed`);
    } catch (error) {
      console.error(`❌ Post ${post.id} translation error:`, error);
      setTranslationError('翻譯失敗');
    } finally {
      setIsTranslating(false);
    }
  };

  const [transcriptData, setTranscriptData] = useState(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);

  const loadComments = (page = 1, append = false) => {
    if (loadingComments) return;
    setLoadingComments(true);

    try {
      const allReplies = allPosts.filter(p => p.parent_docid === post.id && p.event !== 'witness');
      const pageSize = 10;
      const startIndex = (page - 1) * pageSize;
      const pagedComments = allReplies.slice(startIndex, startIndex + pageSize);

      const formattedComments = pagedComments.map(c => ({
        id: c.docid,
        author: c.userid,
        content: c.content,
        time: c.datetime || '剛剛',
        likes: c.amen_count || 0,
        isLiked: c.amened || false,
        isReply: true,
        userid: c.userid
      }));

      const newCommentStates = {};
      formattedComments.forEach(comment => {
        newCommentStates[comment.id] = {
          likeCount: comment.likes || 0,
          isLiked: comment.isLiked || false,
          isLiking: false
        };
      });

      if (!append) {
        setCommentStates(newCommentStates);
      } else {
        setCommentStates(prev => ({
          ...prev,
          ...newCommentStates
        }));
      }

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
    const newShowState = !showCommentForm;
    setShowCommentForm(newShowState);

    if (newShowState && comments.length === 0) {
      loadComments(1, false);
      setCommentPage(1);
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
    setIsLiking(true);

    const prevCount = likeCount;
    const prevLiked = isLiked;
    
    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsLiked(newLiked);
    setLikeCount(newCount);

    try {
      const result = await ApiService.likePost(post.id, currentUserId);

      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newLiked;

        setLikeCount(finalCount);
        setIsLiked(finalLiked);

        if (onLike) {
          onLike(post.id, finalLiked, finalCount);
        }

        if (refreshBalance) {
          await refreshBalance();
        }

        console.log(`✅ Amen ${newLiked ? 'added' : 'removed'} for post ${post.id}:`, finalCount);
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Amen error:', error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      isLikingRef.current = false;
      setIsLiking(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    const currentState = commentStates[commentId];
    if (!currentState || currentState.isLiking) return;

    const prevCount = currentState.likeCount;
    const prevLiked = currentState.isLiked || false;
    
    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setCommentStates(prev => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        isLiked: newLiked,
        likeCount: newCount,
        isLiking: true
      }
    }));

    try {
      const result = await ApiService.likePost(commentId, currentUserId);

      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newLiked;

        setCommentStates(prev => ({
          ...prev,
          [commentId]: {
            ...prev[commentId],
            likeCount: finalCount,
            isLiked: finalLiked,
            isLiking: false
          }
        }));

        console.log(`✅ Comment amen ${newLiked ? 'added' : 'removed'} ${commentId}:`, finalCount);

        if (refreshBalance) {
          await refreshBalance();
        }
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Like comment error:', error);
      setCommentStates(prev => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          isLiked: prevLiked,
          likeCount: prevCount,
          isLiking: false
        }
      }));
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

        const newCommentId = result.comment?.docid || `temp-${Date.now()}`;

        setCommentStates(prev => ({
          ...prev,
          [newCommentId]: {
            likeCount: 0,
            isLiked: false,
            isLiking: false
          }
        }));

        setCommentText('');
        loadComments(1, false);
        if (onComment) onComment(post.id, commentText.trim());

        if (refreshBalance) {
          await refreshBalance();
        }
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

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-avatar">
          <AvatarImage 
            userId={post.userid || post.author}
            userName={post.author}
            size={48}
            clickable={true}
          />
        </div>
        <div className="post-info">
          <div className="post-author">{post.author}</div>
          <div className="post-time">{post.time || post.datetime || '剛剛'}</div>
        </div>

        <div className="post-badges-container">
          <div className="post-privacy-badge">
            {(!post.privacy || post.privacy === 'public') && <span>Public</span>}
            {post.privacy === 'family' && <span>Family</span>}
            {post.privacy === 'tribe' && <span>Tribe</span>}
            {(post.privacy === 'individual' || post.privacy === 'private') && <span>Individual</span>}
          </div>

          <div className="post-category-badge">
            {post.category === 'Personal & Family' && <span>Personal & Family</span>}
            {post.category === 'Church & Ministry' && <span>Church & Ministry</span>}
            {post.category === 'Kingdom Prayer' && <span>Kingdom Prayer</span>}
            {post.category === 'Tribe Prayer' && <span>Tribe Prayer</span>}
            {!post.category && <span>{selectedCategory}</span>}
          </div>
        </div>
      </div>

      <div className="post-content">
        <button
          className={`post-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
          title={translatedContent ? '隱藏翻譯' : '翻譯此貼文'}
        >
          <TranslateIcon size={18} />
        </button>

        {post.title && <h3>{post.title}</h3>}
        <p>{post.content}</p>

        {translatedContent && (
          <div className="post-translated-content">
            <span className="translate-label">🌐 翻譯:</span>
            <p>{translatedContent}</p>
          </div>
        )}

        {translationError && (
          <div className="post-translation-error">
            ⚠️ {translationError}
          </div>
        )}

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
          className={`action-button action-amen ${isLiked ? 'active-amen' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
          title={isLiked ? '取消 Amen' : 'Amen 此貼文'}
        >
          {isLiking ? 'Processing...' : `AMEN (${likeCount})`}
        </button>

        <button
          className={`action-button action-comment ${showCommentForm ? 'active-comment' : ''}`}
          onClick={handleToggleCommentForm}
        >
          PRAY FOR ME ({post.calculatedComments || 0})
        </button>
      </div>

      {showCommentForm && (
        <div className="form-container comment-form-wrapper">
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <div className="comment-input-container">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="寫下您的評論..."
                rows="3"
                maxLength="500"
              />

              <VoiceRecordButton
                onTranscriptComplete={(transcript) => {
                  setCommentText(prev => prev + (prev ? ' ' : '') + transcript);
                }}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={!commentText.trim() || isCommenting}
                className="submit-btn comment-submit-btn"
              >
                {isCommenting ? '發送中...' : '發送評論'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCommentForm(false);
                  setCommentText('');
                }}
                className="cancel-btn"
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
                    onLike={handleLikeComment}
                    currentUserId={currentUserId}
                    postDocid={post.id}
                    commentState={commentStates[comment.id]}
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
        </div>
      )}
    </div>
  );
};

// ==================== MAIN PRAYER HUB COMPONENT ====================
const PrayerHub = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [notificationCount] = useState(0);
  const [coinAmount, setCoinAmount] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [showTribeDetail, setShowTribeDetail] = useState(false);

  const [privacyFilterActive, setPrivacyFilterActive] = useState(false);
  const [categoryFilterActive, setCategoryFilterActive] = useState(false);
  const [witnessWallActive, setWitnessWallActive] = useState(false);

  const [selectedPrivacy, setSelectedPrivacy] = useState(null);
  const [selectedPrayerCategory, setSelectedPrayerCategory] = useState(null);

  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPrayerCategoryOpen, setIsPrayerCategoryOpen] = useState(false);

  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const privacyRef = useRef(null);
  const prayerCategoryRef = useRef(null);
  const navigatingRef = useRef(false);

  const [currentTribeId, setCurrentTribeId] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    return storedUser.tribe !== undefined ? storedUser.tribe : user?.tribe;
  });

  const hasTribe = currentTribeId !== null && currentTribeId !== undefined;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (storedUser.tribe !== undefined && storedUser.tribe !== currentTribeId) {
      console.log(`🔄 Syncing tribe from localStorage: ${storedUser.tribe}`);
      setCurrentTribeId(storedUser.tribe);
    }
  }, [user, currentTribeId]);

  const userTribeId = currentTribeId;
  let tribeNameProp, tribeLogoProp;

  if (userTribeId === null || userTribeId === undefined) {
    tribeNameProp = "not tribe";
    tribeLogoProp = null;
  } else {
    const tribeData = tribeIdMap[userTribeId];
    tribeNameProp = tribeData?.name || 'Unknown';
    tribeLogoProp = tribeData?.icon || null;
  }

  useEffect(() => {
    const fetchBalance = async () => {
      const userId = user?.id || user?.userId || ApiService.getCurrentUserId();
      if (!userId) {
        setLoadingBalance(false);
        return;
      }

      const result = await ApiService.getUserBalance(userId);
      
      if (result.success) {
        setCoinAmount(result.balance);
      } else {
        setCoinAmount(0);
      }
      
      setLoadingBalance(false);
    };

    fetchBalance();
  }, [user]);

  const refreshBalance = async () => {
    const userId = user?.id || user?.userId || ApiService.getCurrentUserId();
    if (!userId) return;

    const result = await ApiService.getUserBalance(userId);
    
    if (result.success) {
      setCoinAmount(result.balance);
    }
  };

  const fetchPosts = useCallback(async () => {
    if (selectedPrayerCategory === 'Tribe Prayer' && !hasTribe) {
      alert('⚠️ 無法載入 Tribe Prayer：您尚未選擇支派！');
      setSelectedPrayerCategory(null);
      return;
    }

    setLoading(true);
    try {
      const currentUserId = user?.id || user?.userId || ApiService.getCurrentUserId();
      
      const filters = {
        viewer_userid: currentUserId
      };

      if (selectedPrivacy && selectedPrivacy !== 'Public') {
        filters.privacy = selectedPrivacy.toLowerCase();
      }

      if (selectedPrayerCategory) {
        filters.category = selectedPrayerCategory;
      }

      console.log('📡 Fetching posts with filters:', filters);

      let result = await ApiService.getPosts(1, 50, true, filters);

      if (result && result.success && result.posts && result.posts.length > 0) {
        const commentsCountMap = {};
        result.posts.forEach(p => {
          if (p.parent_docid && p.event !== 'witness') {
            commentsCountMap[p.parent_docid] = (commentsCountMap[p.parent_docid] || 0) + 1;
          }
        });

        const filteredPosts = result.posts.filter(post => !post.parent_docid && post.docid);

        const transformedPosts = filteredPosts.map(post => ({
          id: post.docid,
          sn: post.sn,
          userid: post.userid,
          likes: post.amen_count !== undefined ? post.amen_count : 0,
          isLiked: (post.amened === true || post.amened === 1 || post.amened === 'true'),
          calculatedComments: commentsCountMap[post.docid] || 0,
          title: post.title || '',
          content: post.content || '',
          privacy: post.privacy ? post.privacy.toLowerCase() : 'public',
          category: post.category || 'General',
          author: post.author || post.userid || user?.name || '匿名用戶',
          time: post.datetime || '剛剛',
          image: post.image || null,
          audioRecordId: post.uuid || null,
        }));
        
        console.log(`✅ Loaded ${transformedPosts.length} posts`);
        setPosts(transformedPosts);
        setAllPosts(result.posts); 
      } else {
        console.log('ℹ️ No posts found');
        setPosts([]);
        setAllPosts([]);
      }
    } catch (error) {
      console.error('💥 取得貼文時發生錯誤:', error);
      setPosts([]);
      setAllPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user, selectedPrivacy, selectedPrayerCategory, hasTribe]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (privacyRef.current && !privacyRef.current.contains(event.target)) {
        setIsPrivacyOpen(false);
      }
      if (prayerCategoryRef.current && !prayerCategoryRef.current.contains(event.target)) {
        setIsPrayerCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTribeLogoClick = () => setShowTribeDetail(true);
  const handleCloseTribeDetail = () => setShowTribeDetail(false);

  const handleTribeSelected = async (newTribeId) => {
    console.log(`✅ Tribe selected: ${newTribeId}`);
    
    setCurrentTribeId(newTribeId);
    
    if (user) {
      user.tribe = newTribeId;
    }
    
    try {
      const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      storedUser.tribe = newTribeId;
      localStorage.setItem('userData', JSON.stringify(storedUser));
      console.log('💾 Tribe saved to localStorage');
    } catch (error) {
      console.error('❌ Lỗi khi lưu tribe vào localStorage:', error);
    }
    
    setShowTribeDetail(false);
    
    setTimeout(() => {
      alert('支派選擇成功！您的支派已更新。');
    }, 100);
  };

  const handleCoinClick = () => {
    console.log('💰 Coin clicked - navigating to YB History');
    navigate('/yb-history');
  };

  const handleBack = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    navigate('/main');
    setTimeout(() => { navigatingRef.current = false; }, 1000);
  };

  const handleFamilyClick = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    navigate('/friends');
    setTimeout(() => { navigatingRef.current = false; }, 1000);
  };

  const handleBlessingClick = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    if (onLogout) onLogout();
    navigate('/login', { replace: true });
    setTimeout(() => { navigatingRef.current = false; }, 1000);
  };

  const handleTabChange = (tab) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;

    switch (tab) {
      case 'Home':
        navigate('/main');
        break;
      case 'Add':
        navigate('/create-post');
        break;
      case 'AddFriend':
        navigate('/addfriend');
        break;
      case 'Nova':
        navigate('/nova');
        break;
      default:
        break;
    }
    
    setTimeout(() => { navigatingRef.current = false; }, 1000);
  };

  const handleCategoryClick = (categoryName) => {
    if (categoryName === 'Privacy Choices') {
      setPrivacyFilterActive(!privacyFilterActive);
      setIsPrivacyOpen(!privacyFilterActive);
      setCategoryFilterActive(false);
      setWitnessWallActive(false);
      setIsPrayerCategoryOpen(false);
    } else if (categoryName === 'Prayer Category') {
      setCategoryFilterActive(!categoryFilterActive);
      setIsPrayerCategoryOpen(!categoryFilterActive);
      setPrivacyFilterActive(false);
      setWitnessWallActive(false);
      setIsPrivacyOpen(false);
    } else if (categoryName === 'Witness Wall') {
      setWitnessWallActive(!witnessWallActive);
      setPrivacyFilterActive(false);
      setCategoryFilterActive(false);
      setIsPrivacyOpen(false);
      setIsPrayerCategoryOpen(false);
    }
  };

  const getFilteredPosts = () => {
    return posts;
  };

  const handleLikePost = async (postId, newLikedStatus, newCount) => {
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

    await refreshBalance();
  };

  const handleCommentPost = async (postId, commentText) => {
    console.log(`💬 新評論於貼文 ${postId}:`, commentText);
    await fetchPosts();
    await refreshBalance();
  };

  if (showTribeDetail) {
    if (userTribeId === null || userTribeId === undefined) {
      return (
        <NoTribeDetail 
          onBack={handleCloseTribeDetail}
          onTribeSelected={handleTribeSelected}
          user={user}
        />
      );
    }
    return (
      <TribeDetail
        tribeId={userTribeId}
        tribeName={tribeNameProp}
        tribeIcon={tribeLogoProp}
        onBack={handleCloseTribeDetail}
        onTribeSelected={handleTribeSelected}
        user={user}
      />
    );
  }

  const filteredPosts = getFilteredPosts();
  
  const prayerCategoryOptions = hasTribe 
    ? ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer', 'Tribe Prayer']
    : ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer'];

  const privacyOptions = ['Public', 'Family', 'Tribe', 'Individual'];

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="app-container">
        <UserHeader
          user={user}
          coins={loadingBalance ? '...' : coinAmount}
          tribeLogo={tribeLogoProp}
          tribeName={tribeNameProp}
          familyIcon={Mdi}
          blessingIcon={Fluent}
          notificationCount={notificationCount}
          onNotificationClick={() => {}}
          onCoinClick={handleCoinClick}
          onLogoClick={handleBack}
          onTribeLogoClick={handleTribeLogoClick}
          onFamilyClick={handleFamilyClick}
          onBlessingClick={handleBlessingClick}
        />

        <div className="top-action-bar">
          <NotificationBell count={notificationCount} size="medium" />
          <CoinDisplay 
            amount={loadingBalance ? '...' : coinAmount} 
            size="medium"
            onClick={handleCoinClick}
          />
        </div>

        <hr className="divider-line" />

        <div className="category-buttons">
          <div className="category-item" ref={privacyRef}>
            <RectButton
              image={family_and_personal}
              imageAlt="Privacy Choices"
              size="medium"
              active={privacyFilterActive}
              onClick={() => handleCategoryClick('Privacy Choices')}
            />
            <CategoryLabel
              text={selectedPrivacy || 'Privacy Choices'}
              isActive={privacyFilterActive}
            />

            {privacyFilterActive && isPrivacyOpen && (
              <div className="category-dropdown-menu">
                {privacyOptions.map((option) => (
                  <div
                    key={option}
                    className={`category-dropdown-item ${selectedPrivacy === option ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPrivacy(option);
                      setIsPrivacyOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="category-item" ref={prayerCategoryRef}>
            <RectButton
              image={church}
              imageAlt="Prayer Category"
              size="medium"
              active={categoryFilterActive}
              onClick={() => handleCategoryClick('Prayer Category')}
            />
            <CategoryLabel
              text={selectedPrayerCategory || 'Prayer Category'}
              isActive={categoryFilterActive}
            />

            {categoryFilterActive && isPrayerCategoryOpen && (
              <div className="category-dropdown-menu">
                {prayerCategoryOptions.map((option) => (
                  <div
                    key={option}
                    className={`category-dropdown-item ${selectedPrayerCategory === option ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      if (option === 'Tribe Prayer' && !hasTribe) {
                        alert('⚠️ 您尚未選擇支派！\n請先選擇您的支派才能使用 Tribe Prayer 功能。');
                        return;
                      }
                      
                      setSelectedPrayerCategory(option);
                      setIsPrayerCategoryOpen(false);
                    }}
                  >
                    {option}
                    {option === 'Tribe Prayer' && !hasTribe && ' 🔒'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="category-item" onClick={() => handleCategoryClick('Witness Wall')}>
            <RectButton
              image={kingdom}
              imageAlt="Witness Wall"
              size="medium"
              active={witnessWallActive}
            />
            <CategoryLabel
              text="Witness Wall"
              isActive={witnessWallActive}
            />
          </div>
        </div>

        <hr className="divider-line" />

        <div className="main-content">
          <div className="posts-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>載入中...</p>
              </div>
            ) : witnessWallActive ? (
              <WitnessWall
                currentUserId={user?.id}
                allPosts={allPosts}
                privacyFilter={privacyFilterActive ? selectedPrivacy : null}
                categoryFilter={categoryFilterActive ? selectedPrayerCategory : null}
                refreshBalance={refreshBalance}
              />
            ) : filteredPosts.length > 0 ? (
              <div className="posts-feed">
                {filteredPosts.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    allPosts={allPosts}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    currentUserId={user?.id}
                    selectedCategory={selectedPrayerCategory}
                    refreshBalance={refreshBalance}
                  />
                ))}
              </div>
            ) : (
              <div className="no-posts">
                <div className="no-posts-icon">📭</div>
                <h4>沒有符合條件的貼文</h4>
                <p>嘗試切換到其他篩選條件查看現有貼文</p>
              </div>
            )}
          </div>
        </div>

        <div className="bottom-navigation">
          <CircleButton 
            provider="Home" 
            iconSrc={Home} 
            onClick={() => handleTabChange('Home')} 
            isActive={false} 
            size="medium" 
            ariaLabel="首頁"
          />
          
          <CircleButton 
            provider="PrayerHub" 
            iconSrc={Search} 
            onClick={() => {}} 
            isActive={true} 
            size="medium" 
            ariaLabel="Prayer Hub"
          />
          
          <CircleButton 
            provider="Add" 
            iconSrc={Add} 
            onClick={() => handleTabChange('Add')} 
            isActive={false} 
            size="medium"
            ariaLabel="新增貼文"
          />
          
          <CircleButton 
            provider="AddFriend" 
            iconSrc={Profile} 
            onClick={() => handleTabChange('AddFriend')} 
            isActive={false} 
            size="medium" 
            ariaLabel="新增好友"
          />
          
          <CircleButton 
            provider="Nova"
            iconSrc={Nova} 
            onClick={() => handleTabChange('Nova')} 
            isActive={false} 
            size="medium" 
            ariaLabel="nova小天使"
          />
        </div>
      </div>
    </AppBackground>
  );
};

export default PrayerHub;

