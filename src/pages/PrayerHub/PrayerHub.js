// src/pages/PrayerHub/PrayerHub.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import TRANSCRIPT_API from '../../services/TranscriptAPI';

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

// ==================== 🕐 GLOBAL TIME UTILITY ====================
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const formatTime = (timeString) => {
  if (!timeString) return 'Just now';
  try {
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

// ==================== TRIBE ID MAPPING TABLE ====================
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

// ==================== TRANSLATE ICON COMPONENT ====================
const TranslateIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" />
  </svg>
);

// ==================== WITNESS WALL COMPONENT ====================
const WitnessWall = ({ currentUserId, allPosts, privacyFilter, categoryFilter, refreshBalance }) => {
  const [witnesses, setWitnesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const getNormalizedImageUrl = (rawUrl) => {
    if (!rawUrl) return null;
    if (ApiService.processMediaUrl) return ApiService.processMediaUrl(rawUrl);
    if (ApiService.processAvatarUrl) return ApiService.processAvatarUrl(rawUrl);
    return rawUrl;
  };

  const formatPrivacyLabel = (privacy) => {
    if (!privacy) return null;
    const stringPrivacy = privacy.toString();
    return stringPrivacy.charAt(0).toUpperCase() + stringPrivacy.slice(1);
  };

  const renderMediaBlock = (imageUrl, label, category, privacy) => {
    if (!imageUrl) return null;
    return (
      <div className="witness-media">
        <img src={imageUrl} alt={label} loading="lazy" />
        <div className="witness-media-caption">
          <span className="witness-media-label">{label}</span>
          <div className="witness-media-tags">
            {category && <span className="media-tag">{category}</span>}
            {privacy && <span className="media-tag privacy">{formatPrivacyLabel(privacy)}</span>}
          </div>
        </div>
      </div>
    );
  };

  const loadWitnesses = async (page = 1) => {
    setLoading(true);
    try {
      const filters = {};
      if (privacyFilter) filters.privacy = privacyFilter.toLowerCase();
      if (categoryFilter) filters.category = categoryFilter;

      console.log(`📡 Fetching witnesses — page ${page}, filters:`, filters);
      const result = await ApiService.getWitnessList(page, ITEMS_PER_PAGE, filters);

      if (result.success) {
        let fetchedWitnesses = result.witnesses || [];

        if (privacyFilter) {
          fetchedWitnesses = fetchedWitnesses.filter(w => {
            const originalPost = w.original_post || allPosts?.find(p => p.docid === w.parent_docid);
            const postPrivacy = (originalPost?.privacy || 'public').toLowerCase();
            return postPrivacy === privacyFilter.toLowerCase();
          });
        }

        if (categoryFilter) {
          fetchedWitnesses = fetchedWitnesses.filter(w => {
            const originalPost = w.original_post || allPosts?.find(p => p.docid === w.parent_docid);
            return originalPost?.category === categoryFilter;
          });
        }

        const hasActiveFilter = !!(privacyFilter || categoryFilter);

        if (hasActiveFilter) {
          if (fetchedWitnesses.length === 0) {
            const safePage = Math.max(page - 1, 1);
            setCurrentPage(safePage);
            setTotalPages(safePage);
            setTotalItems(0);
            setWitnesses([]);
          } else {
            const isLastPage = fetchedWitnesses.length < ITEMS_PER_PAGE;
            const pages = isLastPage ? page : page + 1;
            setWitnesses(fetchedWitnesses);
            setTotalItems(fetchedWitnesses.length);
            setTotalPages(pages);
          }
        } else {
          const total = result.pagination?.total_items ?? result.total ?? fetchedWitnesses.length;
          const pages = result.pagination?.total_pages ?? Math.ceil(total / ITEMS_PER_PAGE) ?? 1;
          setWitnesses(fetchedWitnesses);
          setTotalItems(total);
          setTotalPages(Math.max(pages, 1));
        }

        console.log(`✅ Witnesses: ${fetchedWitnesses.length} items | Page ${page} | HasFilter: ${hasActiveFilter}`);
      }
    } catch (error) {
      console.error('❌ Error loading witnesses:', error);
      setWitnesses([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadWitnesses(1);
  }, [privacyFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrevPage = () => {
    if (currentPage <= 1 || loading) return;
    const prev = currentPage - 1;
    setCurrentPage(prev);
    loadWitnesses(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPage = () => {
    if (currentPage >= totalPages || loading) return;
    const next = currentPage + 1;
    setCurrentPage(next);
    loadWitnesses(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="witness-wall-loading">
        <div className="witness-wall-loading-spinner"></div>
        <p>Loading witnesses...</p>
      </div>
    );
  }

  if (!witnesses || witnesses.length === 0) {
    return (
      <div className="witness-wall-empty">
        <div className="witness-wall-empty-icon">✨</div>
        <h3>No Witnesses</h3>
        <p>No witnesses in this category yet. Be the first to share!</p>
        {currentPage > 1 && (
          <div className="witness-wall-pagination">
            <button className="pagination-btn" onClick={handlePrevPage} disabled={loading}>← Previous</button>
            <span className="pagination-info">Page {currentPage}</span>
            <button className="pagination-btn" disabled={true}>Next →</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="witness-wall">
      <div className="witness-wall-grid">
        {witnesses.map(witness => {
          const originalPost = witness.original_post || allPosts?.find(p => p.docid === witness.parent_docid);
          const originalImageUrl = originalPost
            ? getNormalizedImageUrl(originalPost.image || originalPost.image_url)
            : null;
          const witnessImageUrl = getNormalizedImageUrl(witness.image || witness.image_url);

          return (
            <div key={witness.docid} className="witness-wall-post-card">
              {originalPost && (
                <div className="witness-original-post-section">
                  <div className="post-header">
                    <div className="post-avatar">
                      <AvatarImage
                        userId={originalPost.userid || originalPost.author}
                        userName={originalPost.userid || originalPost.author}
                        src={originalPost.avatar_url}
                        size={48}
                        clickable={true}
                      />
                    </div>
                    <div className="post-info">
                      <div className="post-author">{originalPost.userid || originalPost.author}</div>
                      {/* ✅ FIX 1 */}
                      <div className="post-time">{formatTime(originalPost.datetime)}</div>
                    </div>
                  </div>
                  <div className="post-content">
                    {originalPost.title && <h3>{originalPost.title}</h3>}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{originalPost.content}</p>
                  </div>
                  {renderMediaBlock(
                    originalImageUrl,
                    'Original Post Image',
                    originalPost?.category,
                    originalPost?.privacy
                  )}
                </div>
              )}

              <div className="witness-section">
                <div className="witness-wall-header">
                  <div className="witness-wall-avatar">
                    <AvatarImage
                      userId={witness.userid}
                      userName={witness.userid}
                      src={witness.avatar_url}
                      size={48}
                      clickable={true}
                    />
                  </div>
                  <div className="witness-wall-info">
                    <div className="witness-wall-author">{witness.userid}</div>
                    {/* ✅ FIX 2 */}
                    <div className="witness-wall-time">{formatTime(witness.datetime)}</div>
                  </div>
                </div>
                <div className="witness-wall-content">
                  {witness.title && <h4>{witness.title}</h4>}
                  <p style={{ whiteSpace: 'pre-wrap' }}>{witness.content}</p>
                </div>
                {renderMediaBlock(
                  witnessImageUrl,
                  'Witness Image',
                  witness.category,
                  witness.privacy
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <div className="witness-wall-pagination">
          <button
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
          >
            ← Previous
          </button>
          <span className="pagination-info">Page {currentPage} / {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== COMMENT COMPONENT ====================
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
    if (translatedContent) { setTranslatedContent(null); return; }
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const result = await ApiService.translate(comment.content, 'en');
      if (result.success) {
        setTranslatedContent(result.translatedText);
      } else {
        throw new Error(result.message || 'Translation failed');
      }
    } catch (error) {
      console.error(`❌ Comment ${comment.id} translation error:`, error);
      setTranslationError('Translation failed, please try again later');
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
        const commentReplies = result.comments.filter(c => c.parent_comment_id === comment.id);
        setReplies(commentReplies);
      }
    } catch (error) {
      console.error('❌ Error loading replies:', error);
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
        setReplyText('');
        setIsReplying(false);
        setShowReplies(true);
        if (onReply) onReply(comment.id, result.comment);
      } else {
        alert(`Reply failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Reply error:', error);
      alert(`Error posting reply: ${error.message}`);
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
            src={comment.avatar_url}
            size={32}
            clickable={true}
          />
        </div>
        <div className="comment-info">
          <div className="comment-author">{comment.author}</div>
          {/* ✅ FIX 3: comment.time đã được formatTime() khi map trong loadComments */}
          <div className="comment-time">{comment.time}</div>
        </div>
      </div>

      <div className="comment-content">
        <p>{comment.content}</p>
        <button
          className={`comment-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
          title={translatedContent ? 'Hide Translation' : 'Translate this comment'}
        >
          <TranslateIcon size={14} />
        </button>
        {translatedContent && (
          <div className="comment-translated-content">
            <span className="translate-label">🌐 Translation:</span>
            <p>{translatedContent}</p>
          </div>
        )}
        {translationError && (
          <div className="comment-translation-error">⚠️ {translationError}</div>
        )}
      </div>

      <div className="comment-actions">
        <button
          className={`comment-action-btn like ${commentState?.isLiked ? 'active-amen' : ''}`}
          onClick={() => onLike(comment.id)}
          disabled={commentState?.isLiking}
          title={commentState?.isLiked ? 'Remove Amen' : 'Amen Comment'}
        >
          {commentState?.isLiking ? 'Processing...' : `AMEN (${commentState?.likeCount || 0})`}
        </button>

        {!comment.isReply && (
          <button
            className="comment-action-btn reply"
            onClick={() => setIsReplying(!isReplying)}
            title="Reply to comment"
          >
            💬 Reply
          </button>
        )}

        {!comment.isReply && replies.length > 0 && (
          <button
            className="comment-action-btn show-replies"
            onClick={() => {
              setShowReplies(!showReplies);
              if (!showReplies && replies.length === 0) loadReplies();
            }}
            title={showReplies ? 'Hide replies' : 'Show replies'}
          >
            {showReplies ? 'Hide' : 'Show'} {replies.length} replies
          </button>
        )}
      </div>

      {isReplying && (
        <form onSubmit={handleReplySubmit} className="comment-reply-form">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write your reply..."
            rows="2"
            maxLength="300"
          />
          <div className="comment-reply-actions">
            <button type="submit" disabled={!replyText.trim() || isSubmitting} className="comment-reply-submit">
              {isSubmitting ? 'Replying...' : 'Reply'}
            </button>
            <button type="button" onClick={() => { setIsReplying(false); setReplyText(''); }} className="comment-reply-cancel">
              Cancel
            </button>
          </div>
        </form>
      )}

      {showReplies && (
        <div className="comment-replies">
          {loadingReplies ? (
            <div className="loading-replies">Loading replies...</div>
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

// ==================== POST COMPONENT ====================
const Post = ({ post, allPosts, onLike, onComment, currentUserId, selectedCategory, refreshBalance }) => {
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentStates, setCommentStates] = useState({});
  const isLikingRef = useRef(false);
  const commentsEndRef = useRef(null);
  const commentFormRef = useRef(null);
  const [localComments, setLocalComments] = useState([]);
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
    if (translatedContent) { setTranslatedContent(null); return; }
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const result = await ApiService.translate(post.content, 'en');
      if (result.success) {
        setTranslatedContent(result.translatedText);
      } else {
        throw new Error(result.message || 'Translation failed');
      }
    } catch (error) {
      console.error(`❌ Post ${post.id} translation error:`, error);
      setTranslationError('Translation failed, please try again later');
    } finally {
      setIsTranslating(false);
    }
  };

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
        // ✅ FIX 3: formatTime thay vì raw string
        time: formatTime(c.datetime),
        likes: c.amen_count || 0,
        isLiked: c.amened || false,
        isReply: true,
        userid: c.userid,
        avatar_url: c.avatar_url
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
        setCommentStates(prev => ({ ...prev, ...newCommentStates }));
      }

      setComments(prevComments => append ? [...prevComments, ...formattedComments] : formattedComments);
      setHasMoreComments(allReplies.length > page * pageSize);
    } catch (error) {
      console.error('Error loading comments:', error);
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
        if (onLike) onLike(post.id, finalLiked, finalCount);
        if (refreshBalance) await refreshBalance();
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
      [commentId]: { ...prev[commentId], isLiked: newLiked, likeCount: newCount, isLiking: true }
    }));
    try {
      const result = await ApiService.likePost(commentId, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newLiked;
        setCommentStates(prev => ({
          ...prev,
          [commentId]: { ...prev[commentId], likeCount: finalCount, isLiked: finalLiked, isLiking: false }
        }));
        if (refreshBalance) await refreshBalance();
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Like comment error:', error);
      setCommentStates(prev => ({
        ...prev,
        [commentId]: { ...prev[commentId], isLiked: prevLiked, likeCount: prevCount, isLiking: false }
      }));
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    const submittedText = commentText.trim();
    try {
      const result = await ApiService.addComment({
        userid: currentUserId,
        content: submittedText,
        docid: post.id,
        sn: post.sn
      });
      if (result.success) {
        setCommentText('');
        const newComment = {
          id: result.comment?.docid || `temp-${Date.now()}`,
          author: currentUserId,
          content: submittedText,
          time: 'Just now',
          likes: 0,
          isLiked: false,
          isReply: true,
          userid: currentUserId,
          avatar_url: null
        };
        setLocalComments(prev => [newComment, ...prev]);
        setCommentStates(prev => ({
          ...prev,
          [newComment.id]: { likeCount: 0, isLiked: false, isLiking: false }
        }));
        if (onComment) await onComment(post.id);
        if (refreshBalance) await refreshBalance();
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      } else {
        alert(`Comment failed: ${result.message}`);
      }
    } catch (error) {
      console.error('💥 Comment error:', error);
      alert(`Error posting comment: ${error.message}`);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentReply = (commentId, reply) => { console.log(`💬 Reply to comment ${commentId}:`, reply); };
  const handleCommentEdit = (commentId, newContent) => { console.log(`✏️ Edit comment ${commentId}:`, newContent); };
  const handleCommentDelete = (commentId) => { console.log(`🗑️ Delete comment ${commentId}`); };

  const serverCommentIds = new Set(comments.map(c => c.id));
  const filteredLocal = localComments.filter(c => !serverCommentIds.has(c.id));
  const mergedComments = [...filteredLocal, ...comments];

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-avatar">
          <AvatarImage
            userId={post.userid || post.author}
            userName={post.author}
            src={post.avatar_url}
            size={48}
            clickable={true}
          />
        </div>
        <div className="post-info">
          <div className="post-author">{post.author}</div>
          {/* ✅ FIX 4: formatTime thay vì raw string */}
          <div className="post-time">{formatTime(post.time || post.datetime)}</div>
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
        {post.title && <h3>{post.title}</h3>}
        <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>

        <button
          className={`post-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
          title={translatedContent ? 'Hide Translation' : 'Translate this post'}
        >
          <TranslateIcon size={18} />
        </button>

        {translatedContent && (
          <div className="post-translated-content">
            <span className="translate-label">🌐 Translation:</span>
            <p>{translatedContent}</p>
          </div>
        )}

        {translationError && (
          <div className="post-translation-error">⚠️ {translationError}</div>
        )}

        {post.image && (
          <div className="post-image">
            <img src={post.image} alt="Post image" />
          </div>
        )}
      </div>

      <div className="post-actions">
        <button
          className={`action-button action-amen ${isLiked ? 'active-amen' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
          title={isLiked ? 'Remove Amen' : 'Amen this post'}
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
        <div className="form-container comment-form-wrapper" ref={commentFormRef}>
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <div className="comment-input-container">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment..."
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
                {isCommenting ? 'Sending...' : 'Pray For You'}
              </button>
              <button
                type="button"
                onClick={() => { setShowCommentForm(false); setCommentText(''); }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="comments-section">
            <div className="comments-header">
              <h4>💬 Prayers ({mergedComments.length})</h4>
              {loadingComments && <span className="loading-indicator">Loading...</span>}
            </div>
            <div className="comments-list">
              {mergedComments.length > 0 ? (
                mergedComments.map(comment => (
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
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
              <div ref={commentsEndRef} />
            </div>
            {hasMoreComments && (
              <div className="load-more-comments">
                <button onClick={handleLoadMoreComments} disabled={loadingComments} className="load-more-btn">
                  {loadingComments ? 'Loading...' : 'Load More Comments'}
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
  const [notificationCount, setNotificationCount] = useState(0);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
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
      setCurrentTribeId(storedUser.tribe);
    }
  }, [user, currentTribeId]);

  useEffect(() => {
    let isActive = true;
    const fetchNotificationCount = async () => {
      try {
        const result = await ApiService.getNotifications({ limit: 1, offset: 0, unread_only: false });
        if (isActive) setNotificationCount(result.success ? (result.unread_count ?? 0) : 0);
      } catch (error) {
        console.error('❌ Failed to load notification count:', error);
        if (isActive) setNotificationCount(0);
      }
    };
    fetchNotificationCount();
    return () => { isActive = false; };
  }, []);

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
      if (!userId) { setLoadingBalance(false); return; }
      const result = await ApiService.getUserBalance(userId);
      setCoinAmount(result.success ? result.balance : 0);
      setLoadingBalance(false);
    };
    fetchBalance();
  }, [user]);

  const refreshBalance = async () => {
    const userId = user?.id || user?.userId || ApiService.getCurrentUserId();
    if (!userId) return;
    const result = await ApiService.getUserBalance(userId);
    if (result.success) setCoinAmount(result.balance);
  };

  const fetchPosts = useCallback(async (page = 1) => {
    if (selectedPrayerCategory === 'Tribe Prayer' && !hasTribe) {
      alert('⚠️ Cannot load Tribe Prayer: You haven\'t selected a tribe!');
      setSelectedPrayerCategory(null);
      return;
    }
    setCurrentPage(page);
    setLoading(true);
    try {
      const currentUserId = user?.id || user?.userId || ApiService.getCurrentUserId();
      const filters = { viewer_userid: currentUserId };
      if (selectedPrivacy) filters.privacy = selectedPrivacy.toLowerCase();
      if (selectedPrayerCategory) filters.category = selectedPrayerCategory;

      const [postsResult, commentsResult] = await Promise.all([
        ApiService.getPosts(page, 100, true, filters),
        ApiService.getCommentsPage(page, 100, filters)
      ]);

      const rawPosts = postsResult?.success ? (postsResult.posts || []) : [];
      const rawComments = commentsResult?.success ? (commentsResult.comments || []) : [];

      const commentsCountMap = {};
      rawComments.forEach(c => {
        if (c.parent_docid) commentsCountMap[c.parent_docid] = (commentsCountMap[c.parent_docid] || 0) + 1;
      });

      if (rawPosts.length > 0) {
        const transformedPosts = rawPosts.map(post => ({
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
          author: post.author || post.userid || user?.name || 'Anonymous User',
          // ✅ Giữ raw datetime — formatTime xử lý khi render
          time: post.datetime || post.created_at || null,
          image: post.image || null,
          avatar_url: ApiService.processAvatarUrl(post.avatar_url)
        }));
        setPosts(transformedPosts);
        setAllPosts([...rawPosts, ...rawComments]);
        setHasNextPage(postsResult.pagination?.has_next === true);
      } else {
        setPosts([]);
        setAllPosts([]);
        setHasNextPage(false);
      }
    } catch (error) {
      console.error('💥 Error fetching posts:', error);
      setPosts([]);
      setAllPosts([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [user, selectedPrivacy, selectedPrayerCategory, hasTribe]);

  useEffect(() => {
    setCurrentPage(1);
    fetchPosts(1);
  }, [fetchPosts]);

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchPosts(prevPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (privacyRef.current && !privacyRef.current.contains(event.target)) setIsPrivacyOpen(false);
      if (prayerCategoryRef.current && !prayerCategoryRef.current.contains(event.target)) setIsPrayerCategoryOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleTribeLogoClick = () => setShowTribeDetail(true);
  const handleCloseTribeDetail = () => setShowTribeDetail(false);

  const handleTribeSelected = async (newTribeId) => {
    setCurrentTribeId(newTribeId);
    if (user) user.tribe = newTribeId;
    try {
      const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      storedUser.tribe = newTribeId;
      localStorage.setItem('userData', JSON.stringify(storedUser));
    } catch (error) {
      console.error('❌ Error saving tribe to localStorage:', error);
    }
    setShowTribeDetail(false);
    setTimeout(() => { alert('Tribe selected successfully! Your tribe has been updated.'); }, 100);
  };

  const handleCoinClick = () => navigate('/yb-history');

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

  const handleNotificationClick = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate('/notifications');
  }, [navigate]);

  const handleTabChange = (tab) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    switch (tab) {
      case 'Home': navigate('/main'); break;
      case 'Add': navigate('/create-post'); break;
      case 'AddFriend': navigate('/addfriend'); break;
      case 'Nova': navigate('/nova'); break;
      default: break;
    }
    setTimeout(() => { navigatingRef.current = false; }, 1000);
  };

  const handleCategoryClick = (categoryName) => {
    if (categoryName === 'Privacy Choices') {
      if (witnessWallActive) {
        setPrivacyFilterActive(true);
        setIsPrivacyOpen(true);
        setCategoryFilterActive(false);
        setIsPrayerCategoryOpen(false);
      } else {
        setPrivacyFilterActive(!privacyFilterActive);
        setIsPrivacyOpen(!privacyFilterActive);
        setCategoryFilterActive(false);
        setIsPrayerCategoryOpen(false);
      }
    } else if (categoryName === 'Prayer Category') {
      if (witnessWallActive) {
        setCategoryFilterActive(true);
        setIsPrayerCategoryOpen(true);
        setPrivacyFilterActive(false);
        setIsPrivacyOpen(false);
      } else {
        setCategoryFilterActive(!categoryFilterActive);
        setIsPrayerCategoryOpen(!categoryFilterActive);
        setPrivacyFilterActive(false);
        setIsPrivacyOpen(false);
      }
    } else if (categoryName === 'Witness Wall') {
      setWitnessWallActive(prev => !prev);
      setIsPrivacyOpen(false);
      setIsPrayerCategoryOpen(false);
    }
  };

  const getFilteredPosts = () => posts;

  const handleLikePost = async (postId, newLikedStatus, newCount) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, likes: newCount, isLiked: newLikedStatus, amen_count: newCount, amened: newLikedStatus }
          : post
      )
    );
    await refreshBalance();
  };

  const handleCommentPost = async (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, calculatedComments: (post.calculatedComments || 0) + 1 }
          : post
      )
    );
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
          onNotificationClick={handleNotificationClick}
          onCoinClick={handleCoinClick}
          onLogoClick={handleBack}
          onTribeLogoClick={handleTribeLogoClick}
          onFamilyClick={handleFamilyClick}
          onBlessingClick={handleBlessingClick}
        />

        <div className="top-action-bar">
          <NotificationBell count={notificationCount} size="medium" onClick={handleNotificationClick} />
          <CoinDisplay amount={loadingBalance ? '...' : coinAmount} size="medium" onClick={handleCoinClick} />
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
            <CategoryLabel text={selectedPrivacy || 'Privacy Choices'} isActive={privacyFilterActive} />
            {privacyFilterActive && isPrivacyOpen && (
              <div className="category-dropdown-menu">
                {privacyOptions.map((option) => (
                  <div
                    key={option}
                    className={`category-dropdown-item ${selectedPrivacy === option ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedPrivacy(option); setIsPrivacyOpen(false); }}
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
            <CategoryLabel text={selectedPrayerCategory || 'Prayer Category'} isActive={categoryFilterActive} />
            {categoryFilterActive && isPrayerCategoryOpen && (
              <div className="category-dropdown-menu">
                {prayerCategoryOptions.map((option) => (
                  <div
                    key={option}
                    className={`category-dropdown-item ${selectedPrayerCategory === option ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (option === 'Tribe Prayer' && !hasTribe) {
                        alert('⚠️ You haven\'t selected a tribe!\nPlease select your tribe first to use the Tribe Prayer feature.');
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
            <RectButton image={kingdom} imageAlt="Witness Wall" size="medium" active={witnessWallActive} />
            <CategoryLabel text="Witness Wall" isActive={witnessWallActive} />
          </div>
        </div>

        <hr className="divider-line" />

        <div className="main-content">
          <div className="posts-container">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            ) : witnessWallActive ? (
              <WitnessWall
                currentUserId={user?.id}
                allPosts={allPosts}
                privacyFilter={selectedPrivacy || null}
                categoryFilter={selectedPrayerCategory || null}
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

                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px 0' }}>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                    className="pagination-btn"
                    style={{
                      padding: '8px 16px', borderRadius: '20px', border: 'none',
                      backgroundColor: currentPage === 1 ? '#ccc' : '#4CAF50',
                      color: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ← Previous
                  </button>
                  <span style={{ color: 'white', alignSelf: 'center' }}>Page {currentPage}</span>
                  <button
                    onClick={handleNextPage}
                    disabled={!hasNextPage || loading}
                    className="pagination-btn"
                    style={{
                      padding: '8px 16px', borderRadius: '20px', border: 'none',
                      backgroundColor: !hasNextPage ? '#ccc' : '#4CAF50',
                      color: 'white', cursor: !hasNextPage ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <div className="no-posts">
                <div className="no-posts-icon">📭</div>
                <h4>No matching posts</h4>
                <p>Try switching to other filters to view existing posts</p>
              </div>
            )}
          </div>
        </div>

        <div className="bottom-navigation">
          <CircleButton provider="Home" iconSrc={Home} onClick={() => handleTabChange('Home')} isActive={false} size="medium" ariaLabel="Home" />
          <CircleButton provider="PrayerHub" iconSrc={Search} onClick={() => { }} isActive={true} size="medium" ariaLabel="Prayer Hub" />
          <CircleButton provider="Add" iconSrc={Add} onClick={() => handleTabChange('Add')} isActive={false} size="medium" ariaLabel="Add Post" />
          <CircleButton provider="AddFriend" iconSrc={Profile} onClick={() => handleTabChange('AddFriend')} isActive={false} size="medium" ariaLabel="Add Friend" />
          <CircleButton provider="Nova" iconSrc={Nova} onClick={() => handleTabChange('Nova')} isActive={false} size="medium" ariaLabel="Nova Assistant" />
        </div>
      </div>
    </AppBackground>
  );
};

export default PrayerHub;
