import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';

import AppBackground from '../../components/AppBackground/AppBackground';
import UserHeader from '../../components/UserHeader/UserHeader';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import CoinDisplay from '../../components/CoinDisplay/CoinDisplay';
import RectButton from '../../components/RectButton/RectButton';
import CircleButton from '../../components/CircleButton/CircleButton';
import CategoryLabel from '../../components/CategoryLabel/CategoryLabel';
import TribeDetail from './steps/TribeDetail';
import NoTribeDetail from './steps/NoTribeDetail';
import ActivityForm from './ActivityForm';
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

import './context.css';

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
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay < 7) return `${diffDay} days ago`;
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

const getActivityImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const baseUrl = 'https://pray-api.yalinelena.church';
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
};

const TranslateIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" />
  </svg>
);

// ==================== WITNESS WALL ====================
const WitnessWall = ({ selectedCategory, currentUserId, allPosts, refreshBalance, viewScope = 'my' }) => {
  const [witnesses, setWitnesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1, total_pages: 1, total_items: 0,
    per_page: 20, has_next: false, has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [postStates, setPostStates] = useState({});
  const [commentStates, setCommentStates] = useState({});
  const [translationStates, setTranslationStates] = useState({});
  const [myWitnessedPostIds, setMyWitnessedPostIds] = useState(new Set());
  const [witnessFormStates, setWitnessFormStates] = useState({});
  const isFirstMount = useRef(true);

  const handleTranslateOriginalPost = async (postId, content) => {
    const currentState = translationStates[postId];
    if (currentState?.isTranslating) return;
    if (currentState?.translatedContent) {
      setTranslationStates(prev => ({ ...prev, [postId]: { ...prev[postId], translatedContent: null } }));
      return;
    }
    setTranslationStates(prev => ({ ...prev, [postId]: { ...prev[postId], isTranslating: true, translationError: null } }));
    try {
      const result = await ApiService.translate(content, 'en');
      if (result.success) {
        setTranslationStates(prev => ({ ...prev, [postId]: { ...prev[postId], translatedContent: result.translatedText, isTranslating: false } }));
      } else throw new Error(result.message || 'Translation failed');
    } catch (error) {
      setTranslationStates(prev => ({ ...prev, [postId]: { ...prev[postId], translationError: 'Translation failed, please try again later', isTranslating: false } }));
    }
  };

  const loadWitnesses = async (page = 1) => {
    setLoading(true);
    try {
      const result = await ApiService.getWitnessList(page, 100);
      if (result.success) {
        setMyWitnessedPostIds(prev => {
          const fromApi = new Set(
            result.witnesses.filter(w => w.userid === currentUserId).map(w => w.parent_docid)
          );
          return new Set([...fromApi, ...prev]);
        });

        // 🛡️ BỘ LỌC ĐÃ ĐƯỢC CHÈN VÀO ĐÂY:
        // ĐOẠN MỚI - Hãy DÁN đoạn này vào
        const filteredWitnesses = result.witnesses.filter(witness => {
          const originalPost = witness.original_post || allPosts?.find(p => p.docid === witness.parent_docid);

          if (!originalPost) return false;

          // 🛡️ LỚP BẢO MẬT: CHẶN BÀI INDIVIDUAL CỦA NGƯỜI KHÁC
          // Nếu privacy là 'individual' VÀ người xem (currentUserId) không phải là chủ bài viết (userid)
          const isIndividual = String(originalPost.privacy || '').toLowerCase() === 'individual';
          const isOwner = String(originalPost.userid || '') === String(currentUserId || '');

          if (isIndividual && !isOwner) {
            return false; // Loại bỏ ngay lập tức
          }

          // Logic lọc cũ: Kiểm tra viewScope ('my')
          if (viewScope === 'my') {
            const isMyPost = String(originalPost.userid || '') === String(currentUserId || '') || String(originalPost.author || '') === String(currentUserId || '');
            if (!isMyPost) return false;
          }

          // Logic lọc cũ: Kiểm tra Category
          if (!selectedCategory) return true;
          return originalPost.category === selectedCategory;
        });

        const perPage = 20;
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        const paginatedWitnesses = filteredWitnesses.slice(startIndex, endIndex);
        setWitnesses(paginatedWitnesses);
        setPagination({
          current_page: page,
          total_pages: Math.ceil(filteredWitnesses.length / perPage),
          total_items: filteredWitnesses.length,
          per_page: perPage,
          has_next: endIndex < filteredWitnesses.length,
          has_prev: page > 1
        });
        const initialStates = {};
        const initialTranslationStates = {};
        const initialWitnessFormStates = {};
        paginatedWitnesses.forEach(witness => {
          const originalPost = witness.original_post || allPosts?.find(p => p.docid === witness.parent_docid);
          if (originalPost) {
            const commentCount = allPosts.filter(p => p.parent_docid === originalPost.docid && p.event !== 'witness').length;
            initialStates[originalPost.docid] = {
              likeCount: originalPost.amen_count || 0,
              isLiked: originalPost.amened === true || originalPost.amened === 1 || originalPost.amened === 'true',
              isLiking: false,
              commentCount,
              showCommentForm: false,
              commentText: '',
              isCommenting: false,
              comments: [],
              loadingComments: false
            };
            initialTranslationStates[originalPost.docid] = { isTranslating: false, translatedContent: null, translationError: null };
            initialWitnessFormStates[originalPost.docid] = { showWitnessForm: false, witnessText: '', witnessImage: null, isSubmitting: false };
          }
        });
        setPostStates(initialStates);
        setTranslationStates(initialTranslationStates);
        setWitnessFormStates(prev => {
          const merged = { ...initialWitnessFormStates };
          Object.keys(prev).forEach(postId => { if (prev[postId]?.showWitnessForm) merged[postId] = prev[postId]; });
          return merged;
        });
      } else {
        setWitnesses([]);
      }
    } catch (error) {
      console.error('❌ Error loading witnesses:', error);
      setWitnesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadWitnesses(1);
  }, [selectedCategory, viewScope]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    loadWitnesses(currentPage);
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextPage = () => {
    if (pagination.has_next) { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const handlePrevPage = () => {
    if (pagination.has_prev) { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const handleLikeOriginalPost = async (postId) => {
    const currentState = postStates[postId];
    if (!currentState || currentState.isLiking) return;
    const prevCount = currentState.likeCount;
    const prevIsLiked = currentState.isLiked || false;
    const newIsLiked = !prevIsLiked;
    const newCount = newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], isLiked: newIsLiked, likeCount: newCount, isLiking: true }
    }));
    try {
      const result = await ApiService.likePost(postId, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newIsLiked;
        setPostStates(prev => ({
          ...prev,
          [postId]: { ...prev[postId], likeCount: finalCount, isLiked: finalLiked, isLiking: false }
        }));
        if (refreshBalance) await refreshBalance();
      } else throw new Error(result.message || 'API Error');
    } catch (error) {
      setPostStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], isLiked: prevIsLiked, likeCount: prevCount, isLiking: false }
      }));
    }
  };

  const handleLikeComment = async (commentId) => {
    const currentState = commentStates[commentId];
    if (!currentState || currentState.isLiking) return;
    const prevCount = currentState.likeCount;
    const prevIsLiked = currentState.isLiked || false;
    const newIsLiked = !prevIsLiked;
    const newCount = newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setCommentStates(prev => ({ ...prev, [commentId]: { ...prev[commentId], isLiked: newIsLiked, likeCount: newCount, isLiking: true } }));
    try {
      const result = await ApiService.likeComment(commentId, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newIsLiked;
        setTimeout(() => { setCommentStates(prev => ({ ...prev, [commentId]: { ...prev[commentId], likeCount: finalCount, isLiked: finalLiked, isLiking: false } })); }, 300);
        if (refreshBalance) await refreshBalance();
      } else throw new Error(result.message || 'API Error');
    } catch (error) {
      setCommentStates(prev => ({ ...prev, [commentId]: { ...prev[commentId], isLiked: prevIsLiked, likeCount: prevCount, isLiking: false } }));
    }
  };

  const loadComments = (postId) => {
    const commentsFromAllPosts = allPosts
      .filter(c => c.parent_docid === postId && c.event !== 'witness')
      .map(c => ({
        id: c.docid, author: c.userid, content: c.content,
        time: formatTime(c.datetime),
        likes: c.amen_count || 0, isReply: true, userid: c.userid, avatar_url: c.avatar_url
      }));
    const newCommentStates = {};
    commentsFromAllPosts.forEach(comment => { newCommentStates[comment.id] = { likeCount: comment.likes || 0, isLiked: false, isLiking: false }; });
    setCommentStates(prev => ({ ...prev, ...newCommentStates }));
    setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], comments: commentsFromAllPosts, commentCount: commentsFromAllPosts.length, loadingComments: false } }));
  };

  const handleToggleCommentForm = (postId) => {
    const currentState = postStates[postId];
    const newShowState = !currentState?.showCommentForm;
    setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], showCommentForm: newShowState } }));
    if (newShowState) loadComments(postId);
  };

  const handleCommentTextChange = (postId, text) => {
    setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], commentText: text } }));
  };

  const handleCommentSubmit = async (e, postId, postSn) => {
    e.preventDefault();
    const currentState = postStates[postId];
    if (!currentState?.commentText.trim() || currentState.isCommenting) return;
    setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], isCommenting: true } }));
    try {
      const result = await ApiService.addComment({ userid: currentUserId, content: currentState.commentText.trim(), docid: postId, sn: postSn });
      if (result.success) {
        const newCommentId = result.comment?.docid || `temp-${Date.now()}`;
        const newComment = {
          id: newCommentId, author: currentUserId,
          content: currentState.commentText.trim(),
          time: 'Just now', likes: 0, isReply: true,
          userid: currentUserId, avatar_url: result.comment?.avatar_url
        };
        setCommentStates(prev => ({ ...prev, [newCommentId]: { likeCount: 0, isLiked: false, isLiking: false } }));
        setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], commentText: '', isCommenting: false, commentCount: prev[postId].commentCount + 1, comments: [newComment, ...prev[postId].comments] } }));
        if (refreshBalance) await refreshBalance();
      } else {
        alert(`Comment failed: ${result.message}`);
        setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], isCommenting: false } }));
      }
    } catch (error) {
      alert(`Error occurred while commenting: ${error.message}`);
      setPostStates(prev => ({ ...prev, [postId]: { ...prev[postId], isCommenting: false } }));
    }
  };

  const handleToggleWitnessForm = (postId) => {
    if (myWitnessedPostIds.has(postId)) return;
    setWitnessFormStates(prev => ({ ...prev, [postId]: { ...prev[postId], showWitnessForm: !prev[postId]?.showWitnessForm, witnessText: '', witnessImage: null } }));
  };

  const handleWitnessSubmit = async (e, postId) => {
    e.preventDefault();
    const formState = witnessFormStates[postId];
    if (!formState?.witnessText?.trim() || formState?.isSubmitting) return;
    setWitnessFormStates(prev => ({ ...prev, [postId]: { ...prev[postId], isSubmitting: true } }));
    try {
      const result = await ApiService.createWitness(currentUserId, formState.witnessText.trim(), postId, formState.witnessImage);
      if (result.success) {
        setMyWitnessedPostIds(prev => new Set([...prev, postId]));
        setWitnessFormStates(prev => ({ ...prev, [postId]: { showWitnessForm: false, witnessText: '', witnessImage: null, isSubmitting: false } }));
        await loadWitnesses(currentPage);
        if (refreshBalance) await refreshBalance();
      } else {
        const msg = result.message || '';
        if (msg.includes('already') || msg.toLowerCase().includes('witness')) {
          setMyWitnessedPostIds(prev => new Set([...prev, postId]));
          setWitnessFormStates(prev => ({ ...prev, [postId]: { showWitnessForm: false, witnessText: '', witnessImage: null, isSubmitting: false } }));
        } else {
          alert(`Failed to add testimony: ${msg}`);
          setWitnessFormStates(prev => ({ ...prev, [postId]: { ...prev[postId], isSubmitting: false } }));
        }
      }
    } catch (error) {
      alert(`Error occurred while adding testimony: ${error.message}`);
      setWitnessFormStates(prev => ({ ...prev, [postId]: { ...prev[postId], isSubmitting: false } }));
    }
  };

  if (loading) {
    return (
      <div className="witness-wall-loading">
        <div className="witness-wall-loading-spinner"></div>
        <p className="witness-wall-loading-text">Loading testimonies...</p>
      </div>
    );
  }

  if (!witnesses || witnesses.length === 0) {
    return (
      <div className="witness-wall-empty">
        <div className="witness-wall-empty-icon">✨</div>
        <h3>No testimonies yet</h3>
        <p>There are currently no testimonies in this category. Be the first to share!</p>
      </div>
    );
  }

  return (
    <div className="witness-wall">
      <div className="witness-wall-grid">
        {witnesses.map(witness => {
          const originalPost = witness.original_post || allPosts?.find(p => p.docid === witness.parent_docid);
          const hasWitnessed = myWitnessedPostIds.has(originalPost?.docid);
          const postState = postStates[originalPost?.docid] || {
            likeCount: originalPost?.amen_count || 0,
            isLiked: originalPost?.amened === true || originalPost?.amened === 1 || originalPost?.amened === 'true',
            isLiking: false,
            commentCount: originalPost?.comment_count || allPosts.filter(p => p.parent_docid === originalPost?.docid && p.event !== 'witness').length,
            showCommentForm: false, commentText: '', isCommenting: false, comments: [], loadingComments: false
          };
          const translationState = translationStates[originalPost?.docid] || { isTranslating: false, translatedContent: null, translationError: null };
          const witnessFormState = witnessFormStates[originalPost?.docid] || { showWitnessForm: false, witnessText: '', witnessImage: null, isSubmitting: false };

          return (
            <div key={witness.docid} className="witness-wall-post-card">
              {originalPost && (
                <div className="witness-original-post-section">
                  <div className="post-header">
                    <div className="post-avatar">
                      <AvatarImage userId={originalPost.userid || originalPost.author} userName={originalPost.userid || originalPost.author} src={originalPost.avatar_url} size={48} clickable={true} />
                    </div>
                    <div className="post-info">
                      <div className="post-author">{originalPost.userid || originalPost.author}</div>
                      <div className="post-time">{formatTime(originalPost.datetime)}</div>
                    </div>
                    <div className="post-badges-container">
                      <div className="post-privacy-badge">
                        {(!originalPost.privacy || originalPost.privacy === 'public') && <span>Public</span>}
                        {originalPost.privacy === 'family' && <span>Family</span>}
                        {originalPost.privacy === 'tribe' && <span>Tribe</span>}
                        {(originalPost.privacy === 'individual' || originalPost.privacy === 'private') && <span>Individual</span>}
                      </div>
                      <div className="post-category-badge"><span>{originalPost.category || 'General'}</span></div>
                    </div>
                  </div>
                  <div className="post-content">
                    {originalPost.title && <h3>{originalPost.title}</h3>}
                    <p style={{ whiteSpace: 'pre-wrap' }}>{originalPost.content}</p>
                    <button
                      className={`post-translate-button ${translationState.isTranslating ? 'translating' : ''} ${translationState.translatedContent ? 'active' : ''}`}
                      onClick={() => handleTranslateOriginalPost(originalPost.docid, originalPost.content)}
                      disabled={translationState.isTranslating}
                    >
                      <TranslateIcon size={18} />
                    </button>
                    {translationState.translatedContent && (<div className="post-translated-content"><span className="translate-label">🌐 Translation:</span><p>{translationState.translatedContent}</p></div>)}
                    {translationState.translationError && (<div className="post-translation-error">⚠️ {translationState.translationError}</div>)}
                  </div>
                  <div className="post-actions">
                    <button
                      className={`action-button action-amen ${postState.isLiked ? 'active-amen' : ''}`}
                      onClick={() => handleLikeOriginalPost(originalPost.docid)}
                      disabled={postState.isLiking}
                    >
                      {postState.isLiking ? 'Processing...' : postState.isLiked ? `AMENED (${postState.likeCount})` : `AMEN (${postState.likeCount})`}
                    </button>
                    <button
                      className={`action-button action-comment ${postState.showCommentForm ? 'active-comment' : ''}`}
                      onClick={() => handleToggleCommentForm(originalPost.docid)}
                    >
                      PRAY FOR ME ({postState.commentCount || 0})
                    </button>
                    <button
                      className={`action-button action-witness ${hasWitnessed ? 'witnessed-done' : (witnessFormState.showWitnessForm ? 'active-witness' : '')}`}
                      onClick={() => handleToggleWitnessForm(originalPost.docid)}
                      disabled={hasWitnessed}
                      title={hasWitnessed ? 'You have already witnessed this post' : 'Add your testimony'}
                      style={{ backgroundColor: hasWitnessed ? '#FFD700' : undefined, cursor: hasWitnessed ? 'not-allowed' : 'pointer' }}
                    >
                      {hasWitnessed ? `✨ WITNESSED` : `WITNESS`}
                    </button>
                  </div>
                  {witnessFormState.showWitnessForm && !hasWitnessed && (
                    <div className="form-container witness-form-wrapper">
                      <form className="witness-form" onSubmit={(e) => handleWitnessSubmit(e, originalPost.docid)}>
                        <textarea
                          value={witnessFormState.witnessText}
                          onChange={(e) => setWitnessFormStates(prev => ({ ...prev, [originalPost.docid]: { ...prev[originalPost.docid], witnessText: e.target.value } }))}
                          placeholder="Share your testimony..."
                          rows="4"
                          maxLength="1000"
                        />
                        <div className="witness-image-picker" style={{ marginTop: '8px' }}>
                          <label htmlFor={`witness-image-wall-${originalPost.docid}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', border: '1px dashed #aaa', fontSize: '13px', color: '#555', backgroundColor: '#f9f9f9' }}>
                            📷 {witnessFormState.witnessImage ? witnessFormState.witnessImage.name : 'Add photo (optional)'}
                          </label>
                          <input
                            id={`witness-image-wall-${originalPost.docid}`}
                            type="file" accept="image/*" style={{ display: 'none' }}
                            onChange={(e) => setWitnessFormStates(prev => ({ ...prev, [originalPost.docid]: { ...prev[originalPost.docid], witnessImage: e.target.files[0] || null } }))}
                          />
                          {witnessFormState.witnessImage && (
                            <button type="button" onClick={() => setWitnessFormStates(prev => ({ ...prev, [originalPost.docid]: { ...prev[originalPost.docid], witnessImage: null } }))} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '13px' }}>✕ Remove</button>
                          )}
                        </div>
                        <div className="form-actions">
                          <button type="submit" disabled={!witnessFormState.witnessText?.trim() || witnessFormState.isSubmitting} className="submit-btn witness-submit-btn">
                            {witnessFormState.isSubmitting ? 'Submitting...' : '✨ Submit Testimony'}
                          </button>
                          <button type="button" onClick={() => setWitnessFormStates(prev => ({ ...prev, [originalPost.docid]: { showWitnessForm: false, witnessText: '', witnessImage: null, isSubmitting: false } }))} className="cancel-btn">Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}
                  {postState.showCommentForm && (
                    <div className="form-container comment-form-wrapper">
                      <form className="comment-form" onSubmit={(e) => handleCommentSubmit(e, originalPost.docid, originalPost.sn)}>
                        <div className="comment-input-container">
                          <textarea
                            value={postState.commentText}
                            onChange={(e) => handleCommentTextChange(originalPost.docid, e.target.value)}
                            placeholder="Write your comment..."
                            rows="3"
                            maxLength="500"
                          />
                          <VoiceRecordButton onTranscriptComplete={(transcript) => { handleCommentTextChange(originalPost.docid, postState.commentText + (postState.commentText ? ' ' : '') + transcript); }} />
                        </div>
                        <div className="form-actions">
                          <button type="submit" disabled={!postState.commentText.trim() || postState.isCommenting} className="submit-btn comment-submit-btn">
                            {postState.isCommenting ? 'Sending...' : 'Pray For You'}
                          </button>
                          <button type="button" onClick={() => handleToggleCommentForm(originalPost.docid)} className="cancel-btn">Cancel</button>
                        </div>
                      </form>
                      <div className="comments-section">
                        <div className="comments-header">
                          <h4>💬 Prayers ({postState.comments.length})</h4>
                          {postState.loadingComments && <span className="loading-indicator">Loading...</span>}
                        </div>
                        <div className="comments-list">
                          {postState.comments.length > 0 ? (
                            postState.comments.map(comment => {
                              const commentState = commentStates[comment.id] || { likeCount: comment.likes || 0, isLiked: false, isLiking: false };
                              const commentTransState = translationStates[comment.id] || { isTranslating: false, translatedContent: null, translationError: null };
                              return (
                                <div key={comment.id} className="comment comment-reply">
                                  <div className="comment-header">
                                    <div className="comment-avatar">
                                      <AvatarImage userId={comment.userid || comment.author} userName={comment.author} src={comment.avatar_url} size={32} clickable={true} />
                                    </div>
                                    <div className="comment-info">
                                      <div className="comment-author">{comment.author}</div>
                                      <div className="comment-time">{comment.time}</div>
                                    </div>
                                  </div>
                                  <div className="comment-content">
                                    <p>{comment.content}</p>
                                    <button
                                      className={`comment-translate-button ${commentTransState.isTranslating ? 'translating' : ''} ${commentTransState.translatedContent ? 'active' : ''}`}
                                      onClick={() => handleTranslateOriginalPost(comment.id, comment.content)}
                                      disabled={commentTransState.isTranslating}
                                    >
                                      <TranslateIcon size={14} />
                                    </button>
                                    {commentTransState.translatedContent && (<div className="comment-translated-content"><span className="translate-label">🌐 Translation:</span><p>{commentTransState.translatedContent}</p></div>)}
                                    {commentTransState.translationError && (<div className="comment-translation-error">⚠️ {commentTransState.translationError}</div>)}
                                  </div>
                                  <div className="comment-actions">
                                    <button
                                      className={`comment-action-btn like ${commentState.isLiked ? 'active-amen' : ''}`}
                                      onClick={() => handleLikeComment(comment.id)}
                                      disabled={commentState.isLiking}
                                    >
                                      {commentState.isLiking ? 'Processing...' : (commentState.isLiked ? `AMENED (${commentState.likeCount})` : `AMEN (${commentState.likeCount})`)}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="no-comments"><p>No comments yet. Be the first to leave a message!</p></div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="witness-section">
                <div className="witness-wall-header">
                  <div className="witness-wall-avatar">
                    <AvatarImage userId={witness.userid} userName={witness.userid} src={witness.avatar_url} size={48} clickable={true} />
                  </div>
                  <div className="witness-wall-info">
                    <div className="witness-wall-author">{witness.userid}</div>
                    <div className="witness-wall-time">{formatTime(witness.datetime)}</div>
                  </div>
                </div>
                <div className="witness-wall-content">
                  {witness.title && <h4>{witness.title}</h4>}
                  <p style={{ whiteSpace: 'pre-wrap' }}>{witness.content}</p>
                  {witness.image_url && (
                    <div className="witness-media">
                      <img src={witness.image_url} alt="Witness image" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                      <div className="witness-media-caption">
                        <span className="witness-media-label">Witness Image</span>
                        <div className="witness-media-tags">
                          {witness.category && <span className="media-tag">{witness.category}</span>}
                          {witness.privacy && <span className="media-tag privacy">{witness.privacy.charAt(0).toUpperCase() + witness.privacy.slice(1)}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {pagination.total_items > 0 && (
        <div className="witness-wall-pagination">
          <button className="pagination-btn" onClick={handlePrevPage} disabled={!pagination.has_prev || loading}>← Previous</button>
          <span className="pagination-info">Page {pagination.current_page} / {pagination.total_pages}</span>
          <button className="pagination-btn" onClick={handleNextPage} disabled={!pagination.has_next || loading}>Next →</button>
        </div>
      )}
    </div>
  );
};

// ==================== PRIVACY DROPDOWN ====================
const PrivacyDropdown = ({ onChange, initialValue = 'public' }) => {
  const [selected, setSelected] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { id: 'all', label: 'All', icon: '' }, { id: 'public', label: 'Public', icon: '' },
    { id: 'family', label: 'Family', icon: '' }, { id: 'tribe', label: 'Tribe', icon: '' },
    { id: 'private', label: 'Private', icon: '' }
  ];
  const selectedOption = options.find(option => option.id === selected);
  const handleSelect = (optionId) => { setSelected(optionId); setIsOpen(false); if (onChange) onChange(optionId); };
  return (
    <div className="privacy-dropdown">
      <div className="selected-option" onClick={() => setIsOpen(!isOpen)}>
        <span className="privacy-icon">{selectedOption.icon}</span>
        <span className="privacy-label">{selectedOption.label}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="dropdown-options">
          {options.map((option) => (
            <div key={option.id} className={`dropdown-option ${selected === option.id ? 'selected' : ''}`} onClick={() => handleSelect(option.id)}>
              <span className="privacy-icon">{option.icon}</span>
              <span className="privacy-label">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== COMMENT COMPONENT ====================
const Comment = ({ comment, onReply, onEdit, onLike, currentUserId, postDocid, commentState }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
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
    setIsTranslating(true); setTranslationError(null);
    try {
      const result = await ApiService.translate(comment.content, 'en');
      if (result.success) setTranslatedContent(result.translatedText);
      else throw new Error(result.message || 'Translation failed');
    } catch (error) { setTranslationError('Translation failed, please try again later'); }
    finally { setIsTranslating(false); }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await ApiService.editPost(comment.id, { content: editText.trim() });
      if (result.success) { setIsEditing(false); if (onEdit) onEdit(comment.id, editText.trim()); }
      else alert(`Edit failed: ${result.message}`);
    } catch (error) { console.error('❌ Edit error:', error); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className={`comment ${comment.isReply ? 'comment-reply' : ''}`}>
      <div className="comment-header">
        <div className="comment-avatar">
          <AvatarImage userId={comment.userid || comment.author} userName={comment.author} src={comment.avatar_url} size={32} clickable={true} />
        </div>
        <div className="comment-info">
          <div className="comment-author">{comment.author}</div>
          <div className="comment-time">{comment.time}</div>
        </div>
      </div>
      <div className="comment-content">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="comment-edit-form">
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} placeholder="Edit your comment..." rows="2" maxLength="500" />
            <div className="comment-edit-actions">
              <button type="submit" disabled={!editText.trim() || isSubmitting} className="comment-save-btn">{isSubmitting ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => { setIsEditing(false); setEditText(comment.content); }} className="comment-cancel-btn">Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <p>{comment.content}</p>
            <button
              className={`comment-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
              onClick={handleTranslate}
              disabled={isTranslating}
            >
              <TranslateIcon size={14} />
            </button>
            {translatedContent && <div className="comment-translated-content"><span className="translate-label">🌐 Translation:</span><p>{translatedContent}</p></div>}
            {translationError && <div className="comment-translation-error">⚠️ {translationError}</div>}
          </>
        )}
      </div>
      <div className="comment-actions">
        <button
          className={`comment-action-btn like ${commentState?.isLiked ? 'active-amen' : ''}`}
          onClick={() => onLike(comment.id)}
          disabled={commentState?.isLiking}
        >
          {commentState?.isLiking ? 'Processing...' : (commentState?.isLiked ? `AMENED (${commentState?.likeCount || 0})` : `AMEN (${commentState?.likeCount || 0})`)}
        </button>
      </div>
    </div>
  );
};

// ==================== POST COMPONENT ====================
const Post = ({ post, allPosts, onLike, onComment, onWitnessCreated, onPostEdited, onLoadComments, currentUserId, selectedCategory, refreshBalance }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentStates, setCommentStates] = useState({});
  const isLikingRef = useRef(false);
  const commentsEndRef = useRef(null);
  const commentFormRef = useRef(null);
  const [localComments, setLocalComments] = useState([]);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [hasLiked, setHasLiked] = useState(false);
  const [witnessText, setWitnessText] = useState('');
  const [witnessImage, setWitnessImage] = useState(null);
  const [isSubmittingWitness, setIsSubmittingWitness] = useState(false);
  const [witnessCount, setWitnessCount] = useState(0);
  const [activeForm, setActiveForm] = useState(null);
  const WITNESSED_KEY = `witnessed_${currentUserId}`;

  const preservedLikesRef = useRef({ likes: post.likes || 0, isLiked: post.isLiked || false });

  const getWitnessedSet = () => { try { return new Set(JSON.parse(localStorage.getItem(WITNESSED_KEY) || '[]')); } catch { return new Set(); } };
  const [hasWitnessed, setHasWitnessed] = useState(() => getWitnessedSet().has(post.id));
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translationError, setTranslationError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(post.content || '');
      setEditTitle(post.title || '');
    }
  }, [post.content, post.title]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const witnessed = allPosts.some(p => p.parent_docid === post.id && p.event === 'witness' && p.userid === currentUserId);
    if (witnessed) {
      setHasWitnessed(true);
      try { const set = new Set(JSON.parse(localStorage.getItem(WITNESSED_KEY) || '[]')); set.add(post.id); localStorage.setItem(WITNESSED_KEY, JSON.stringify([...set])); } catch { }
    }
  }, [post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setIsTranslating(false); setTranslatedContent(null); setTranslationError(null); }, [post.id]);

  const serverComments = allPosts
    .filter(c => c.parent_docid === post.id && c.event !== 'witness')
    .map(c => ({
      id: c.docid, author: c.userid, content: c.content,
      time: formatTime(c.datetime),
      likes: c.amen_count || 0, isLiked: c.amened || false,
      userid: c.userid, avatar_url: c.avatar_url
    }));
  const serverCommentIds = new Set(serverComments.map(c => c.id));
  const filteredLocal = localComments.filter(c => !serverCommentIds.has(c.id));
  const postComments = [...filteredLocal, ...serverComments];

  useEffect(() => {
    setCommentStates(prev => {
      const next = {};
      postComments.forEach(c => { next[c.id] = prev[c.id] || { likeCount: c.likes || 0, isLiked: c.isLiked || false, isLiking: false }; });
      return next;
    });
  }, [allPosts, post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isLikingRef.current) {
      const safeLikes = Math.max(post.likes || 0, preservedLikesRef.current.likes || 0);
      const safeIsLiked = post.isLiked || preservedLikesRef.current.isLiked || false;
      setLikeCount(safeLikes);
      setIsLiked(safeIsLiked);
      preservedLikesRef.current = { likes: safeLikes, isLiked: safeIsLiked };
    }
  }, [post.id, post.likes, post.isLiked]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const postWitnesses = allPosts.filter(p => p.parent_docid === post.id && p.event === 'witness');
    setWitnessCount(postWitnesses.length);
  }, [post.likes, allPosts, post.id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim() || isSubmittingEdit) return;
    setIsSubmittingEdit(true);
    try {
      const result = await ApiService.editPost(post.id, { content: editContent.trim(), title: editTitle.trim() || null });
      if (result.success) {
        const updatedPost = result.post || result.data || {};
        const newContent = updatedPost.content || editContent.trim();
        const newTitle = updatedPost.title ?? editTitle.trim();
        setEditContent(newContent);
        setEditTitle(newTitle);
        setIsEditing(false);
        if (onPostEdited) onPostEdited(post.id, post.id, {
          content: newContent,
          title: newTitle,
          userid: post.userid,
          time: post.time,
        });
      } else { alert(`Edit failed: ${result.message}`); }
    } catch (error) { alert(`Error: ${error.message}`); }
    finally { setIsSubmittingEdit(false); }
  };

  const handleTranslate = async () => {
    if (isTranslating) return;
    if (translatedContent) { setTranslatedContent(null); return; }
    setIsTranslating(true); setTranslationError(null);
    try {
      const result = await ApiService.translate(post.content, 'en');
      if (result.success) setTranslatedContent(result.translatedText);
      else throw new Error(result.message || 'Translation failed');
    } catch (error) { setTranslationError('Translation failed, please try again later'); }
    finally { setIsTranslating(false); }
  };

  const handleWitnessSubmit = async (e) => {
    e.preventDefault();
    if (!witnessText.trim() || isSubmittingWitness) return;
    setIsSubmittingWitness(true);
    try {
      const result = await ApiService.createWitness(currentUserId, witnessText.trim(), post.id, witnessImage);
      if (result.success) {
        setWitnessText(''); setWitnessImage(null); setActiveForm(null); setHasWitnessed(true);
        try { const set = new Set(JSON.parse(localStorage.getItem(WITNESSED_KEY) || '[]')); set.add(post.id); localStorage.setItem(WITNESSED_KEY, JSON.stringify([...set])); } catch { }
        if (refreshBalance) await refreshBalance();
        if (onWitnessCreated && typeof onWitnessCreated === 'function') onWitnessCreated(post.id);
      } else {
        const msg = result.message || '';
        if (msg.includes('已為此貼文建立過見證') || msg.includes('already') || msg.toLowerCase().includes('witness')) {
          setHasWitnessed(true); setActiveForm(null); setWitnessText(''); setWitnessImage(null);
          try { const set = new Set(JSON.parse(localStorage.getItem(WITNESSED_KEY) || '[]')); set.add(post.id); localStorage.setItem(WITNESSED_KEY, JSON.stringify([...set])); } catch { }
        } else { alert(`Failed to add testimony: ${msg}`); }
      }
    } catch (error) { alert(`Error occurred while adding testimony: ${error.message}`); }
    finally { setIsSubmittingWitness(false); }
  };

  const handleToggleWitnessForm = () => {
    if (hasWitnessed) return;
    if (activeForm === 'witness') { setActiveForm(null); setWitnessText(''); }
    else { setActiveForm('witness'); setCommentText(''); }
  };

  const handleToggleCommentForm = () => {
    if (activeForm === 'comment') {
      setActiveForm(null); setCommentText('');
    } else {
      setActiveForm('comment'); setWitnessText('');
      if (onLoadComments && serverComments.length === 0) onLoadComments(post.id);
    }
  };

  const handleLike = async () => {
    if (isLikingRef.current) return;
    isLikingRef.current = true; setIsLiking(true);
    const prevCount = likeCount; const prevLiked = isLiked;
    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setIsLiked(newLiked); setLikeCount(newCount); setHasLiked(true);
    preservedLikesRef.current = { likes: newCount, isLiked: newLiked };
    try {
      const result = await ApiService.likePost(post.id, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newLiked;
        setLikeCount(finalCount); setIsLiked(finalLiked);
        preservedLikesRef.current = { likes: finalCount, isLiked: finalLiked };
        setTimeout(() => setHasLiked(false), 300);
        if (onLike) onLike(post.id, finalLiked, finalCount);
        if (refreshBalance) await refreshBalance();
      } else throw new Error(result.message || 'API Error');
    } catch (error) {
      console.error('❌ Like error:', error);
      setIsLiked(prevLiked); setLikeCount(prevCount); setHasLiked(false);
      preservedLikesRef.current = { likes: prevCount, isLiked: prevLiked };
    }
    finally { isLikingRef.current = false; setIsLiking(false); }
  };

  const handleLikeComment = async (commentId) => {
    const currentState = commentStates[commentId];
    if (!currentState || currentState.isLiking) return;
    const prevCount = currentState.likeCount; const prevIsLiked = currentState.isLiked || false;
    const newIsLiked = !prevIsLiked;
    const newCount = newIsLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setCommentStates(prev => ({ ...prev, [commentId]: { ...prev[commentId], isLiked: newIsLiked, likeCount: newCount, isLiking: true } }));
    try {
      const result = await ApiService.likeComment(commentId, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newIsLiked;
        setTimeout(() => { setCommentStates(prev => ({ ...prev, [commentId]: { ...prev[commentId], likeCount: finalCount, isLiked: finalLiked, isLiking: false } })); }, 300);
        if (refreshBalance) await refreshBalance();
      } else throw new Error(result.message || 'API Error');
    } catch (error) {
      setCommentStates(prev => ({ ...prev, [commentId]: { ...prev[commentId], isLiked: prevIsLiked, likeCount: prevCount, isLiking: false } }));
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    const submittedText = commentText.trim();
    try {
      const result = await ApiService.addComment({ userid: currentUserId, content: submittedText, docid: post.id, sn: post.sn });
      if (result.success) {
        setCommentText('');
        const newComment = {
          id: result.comment?.docid || `temp-${Date.now()}`,
          author: currentUserId, content: submittedText,
          time: 'Just now', likes: 0, isLiked: false,
          userid: currentUserId, avatar_url: null
        };
        setLocalComments(prev => [newComment, ...prev]);
        setCommentStates(prev => ({ ...prev, [newComment.id]: { likeCount: 0, isLiked: false, isLiking: false } }));
        if (onComment) await onComment(post.id);
        if (refreshBalance) await refreshBalance();
        setTimeout(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
      } else { alert(`Comment failed: ${result.message}`); }
    } catch (error) { alert(`Error occurred while commenting: ${error.message}`); }
    finally { setIsCommenting(false); }
  };

  const handleCommentReply = (commentId, reply) => { console.log(`💬 Reply to comment ${commentId}:`, reply); };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-avatar">
          <AvatarImage userId={post.userid || post.author} userName={post.author} src={post.avatar_url} size={48} clickable={true} />
        </div>
        <div className="post-info">
          <div className="post-author">{post.author}</div>
          <div className="post-time">{formatTime(post.time || post.datetime || post.created_at)}</div>
        </div>
        <div className="post-badges-container post-badges-with-edit">
          <div className="badges-row">
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
          {String(post.userid) === String(currentUserId) && (
            <button className="post-edit-btn" onClick={() => setIsEditing(!isEditing)} title="Edit post">✏️</button>
          )}
        </div>



      </div>
      <div className="post-content">
        {post.title && <h3>{post.title}</h3>}
        <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
        <button
          className={`post-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
        >
          <TranslateIcon size={18} />
        </button>
        {translatedContent && <div className="post-translated-content"><span className="translate-label">🌐 Translation:</span><p>{translatedContent}</p></div>}
        {translationError && <div className="post-translation-error">⚠️ {translationError}</div>}
        {post.image && <div className="post-image"><img src={post.image} alt="Post image" /></div>}
      </div>
      {isEditing && String(post.userid) === String(currentUserId) && (
        <div className="post-edit-form-wrapper">
          <form onSubmit={handleEditSubmit} className="post-edit-form">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title (optional)"
              className="post-edit-title-input"
              maxLength={255}
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your post..."
              rows="4"
              maxLength="2000"
              required
            />
            <div className="form-actions">
              <button type="submit" disabled={!editContent.trim() || isSubmittingEdit} className="submit-btn">
                {isSubmittingEdit ? 'Saving...' : '💾 Save'}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditContent(post.content || ''); setEditTitle(post.title || ''); }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="post-actions">
        <button
          className={`action-button action-amen ${isLiked || hasLiked ? 'active-amen' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          {isLiking ? 'Processing...' : (isLiked ? `AMENED (${likeCount})` : `AMEN (${likeCount})`)}
        </button>
        <button
          className={`action-button action-comment ${activeForm === 'comment' ? 'active-comment' : ''}`}
          onClick={handleToggleCommentForm}
        >
          PRAY FOR ME ({Math.max(
            post.serverCommentCount || 0,
            post.calculatedComments || 0,
            postComments.length || 0
          )})
        </button>
        <button
          className={`action-button action-witness ${hasWitnessed ? 'witnessed-done' : (activeForm === 'witness' ? 'active-witness' : '')}`}
          onClick={handleToggleWitnessForm}
          disabled={hasWitnessed}
          title={hasWitnessed ? 'You have already witnessed this post' : 'Add your testimony'}
        >
          {hasWitnessed ? `✨ WITNESSED` : `WITNESS`}
        </button>
      </div>
      {activeForm === 'witness' && (
        <div className="form-container witness-form-wrapper">
          <form className="witness-form" onSubmit={handleWitnessSubmit}>
            <textarea
              value={witnessText}
              onChange={(e) => setWitnessText(e.target.value)}
              placeholder="Share your testimony..."
              rows="4"
              maxLength="1000"
            />
            <div className="witness-image-picker" style={{ marginTop: '8px' }}>
              <label htmlFor={`witness-image-${post.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', border: '1px dashed #aaa', fontSize: '13px', color: '#555', backgroundColor: '#f9f9f9' }}>
                📷 {witnessImage ? witnessImage.name : 'Add photo (optional)'}
              </label>
              <input
                id={`witness-image-${post.id}`}
                type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => setWitnessImage(e.target.files[0] || null)}
              />
              {witnessImage && (
                <button type="button" onClick={() => setWitnessImage(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '13px' }}>✕ Remove</button>
              )}
            </div>
            <div className="form-actions">
              <button type="submit" disabled={!witnessText.trim() || isSubmittingWitness} className="submit-btn witness-submit-btn">
                {isSubmittingWitness ? 'Submitting...' : '✨ Submit Testimony'}
              </button>
              <button type="button" onClick={() => { setActiveForm(null); setWitnessText(''); setWitnessImage(null); }} className="cancel-btn">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {activeForm === 'comment' && (
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
              <VoiceRecordButton onTranscriptComplete={(transcript) => { setCommentText(prev => prev + (prev ? ' ' : '') + transcript); }} />
            </div>
            <div className="form-actions">
              <button type="submit" disabled={!commentText.trim() || isCommenting} className="submit-btn comment-submit-btn">
                {isCommenting ? 'Sending...' : 'Pray For You'}
              </button>
              <button type="button" onClick={() => { setActiveForm(null); setCommentText(''); }} className="cancel-btn">Cancel</button>
            </div>
          </form>
          <div className="comments-section">
            <div className="comments-header">
              <h4>💬 Prayers ({postComments.length})</h4>
            </div>
            <div className="comments-list">
              {postComments.length > 0 ? (
                postComments.map(comment => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    onReply={handleCommentReply}
                    onLike={handleLikeComment}
                    currentUserId={currentUserId}
                    postDocid={post.id}
                    commentState={commentStates[comment.id]}
                  />
                ))
              ) : (
                <div className="no-comments"><p>No comments yet. Be the first to leave a message!</p></div>
              )}
              <div ref={commentsEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN APP ====================
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [coinAmount, setCoinAmount] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [currentTribeId, setCurrentTribeId] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    return storedUser.tribe !== undefined ? storedUser.tribe : user?.tribe;
  });
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [viewMode, setViewMode] = useState('original');
  const [viewScope, setViewScope] = useState('my');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityHasNext, setActivityHasNext] = useState(false);
  const ACTIVITY_PER_PAGE = 20;
  const [newlyWitnessedPostId, setNewlyWitnessedPostId] = useState(null);
  const navigatingRef = useRef(false);
  const selectedCategoryRef = useRef(selectedCategory);
  const currentPageRef = useRef(currentPage);
  const allPostsRef = useRef([]);
  const postsRef = useRef([]);
  const hasTribe = currentTribeId !== null && currentTribeId !== undefined;

  useEffect(() => { allPostsRef.current = allPosts; }, [allPosts]);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { selectedCategoryRef.current = selectedCategory; }, [selectedCategory]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    if (storedUser.tribe !== undefined && storedUser.tribe !== currentTribeId) setCurrentTribeId(storedUser.tribe);
  }, [user, currentTribeId]);

  const userTribeId = currentTribeId;
  let tribeNameProp, tribeLogoProp;
  if (userTribeId === null || userTribeId === undefined) {
    tribeNameProp = "not tribe"; tribeLogoProp = null;
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

  const fetchNotificationCount = useCallback(async () => {
    try {
      const result = await ApiService.getNotifications({ limit: 1, offset: 0, unread_only: false });
      setNotificationCount(result.success ? (result.unread_count ?? 0) : 0);
    } catch (error) { setNotificationCount(0); }
  }, [user?.id]);

  useEffect(() => { fetchNotificationCount(); }, [fetchNotificationCount]);

  const handleTribeSelected = async (newTribeId) => {
    setCurrentTribeId(newTribeId);
    if (user) user.tribe = newTribeId;
    try {
      const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      storedUser.tribe = newTribeId;
      localStorage.setItem('userData', JSON.stringify(storedUser));
    } catch (error) { console.error('❌ Error saving tribe:', error); }
    setShowTribeDetail(false);
    setTimeout(() => alert('Tribe selection successful! Your tribe has been updated.'), 100);
  };

  const handleTribeLogoClick = () => setShowTribeDetail(true);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setViewMode('original');
    if (tabName === 'Home') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    setActiveTab('Nova');
    try {
      setPosts([]); setPrivacyFilter('all');
      ApiService.clearCache();
      if (onLogout) await onLogout();
      navigate('/login', { replace: true });
    } catch (error) { navigate('/login', { replace: true }); }
  };

  const handleCreatePost = () => { setActiveTab('Add'); navigate('/create-post', { replace: true }); };

  const handleNotificationClick = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate('/notifications');
  }, [navigate]);

  const handleCoinClick = () => navigate('/yb-history');
  const handleLogoClick = () => handleTabChange('Home');
  const handleFamilyClick = () => navigate('/friends');
  const handleBlessingClick = () => handleLogout();

  const handleShowActivityForm = () => {
    if (!hasTribe) {
      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to create an activity.');
      return;
    }
    setShowActivityForm(true);
  };

  const handleCloseActivityForm = () => { setShowActivityForm(false); fetchActivities(1); setActivityPage(1); };

  const fetchActivities = async (page = 1) => {
    if (!hasTribe) { setActivities([]); setLoading(false); return; }
    setLoading(true);
    try {
      const params = { page, limit: ACTIVITY_PER_PAGE, tribe: currentTribeId, is_published: true };
      const result = await ApiService.getActivities(params);
      if (result.success) {
        const transformedActivities = result.activities
          .filter(activity => {
            if (Number(currentTribeId) === 0) return true;
            return Number(activity.tribe) === Number(currentTribeId);
          })
          .map(activity => {
            const rawDesc = activity.description || '';
            const cleanDescription = rawDesc
              .split(/\r?\n/)
              .filter(line => !line.startsWith('Activity time:') && !line.startsWith('Max participants:'))
              .join('\n').trim();
            return {
              id: activity.id,
              author: activity.created_by || 'Unknown',
              avatar_url: ApiService.processAvatarUrl(activity.creator_avatar_url),
              datetime: formatTime(activity.created_at),
              eventName: activity.title,
              eventDate: activity.event_date,
              eventLocation: activity.location,
              activityTime: activity.event_time,
              maxParticipants: activity.max_participants || null,
              description: cleanDescription,
              privacy: activity.privacy || 'public',
              tribe: activity.tribe,
              coverImage: getActivityImageUrl(activity.cover_image),
              images: (activity.images || []).map(img => getActivityImageUrl(img)).filter(Boolean),
              isPublished: activity.is_published || false,
            };
          });
        setActivities(transformedActivities);
        setActivityPage(page);
        const pageinfo = result.pageinfo || {};
        const rawCount = result.activities?.length || 0;
        const hasNext =
          pageinfo.has_next === true ||
          pageinfo.next_page != null ||
          (pageinfo.total_pages != null && pageinfo.current_page != null
            ? pageinfo.current_page < pageinfo.total_pages
            : rawCount >= ACTIVITY_PER_PAGE);
        setActivityHasNext(hasNext);
      } else {
        setActivities([]);
        setActivityHasNext(false);
      }
    } catch (error) {
      setActivities([]);
      setActivityHasNext(false);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPosts = () => {
    if (privacyFilter === 'all') return posts;
    return posts.filter(post => post.privacy === privacyFilter);
  };

  const handleLikePost = async (postId, newLikedStatus, newCount) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === postId
        ? { ...post, likes: newCount, isLiked: newLikedStatus, amen_count: newCount, amened: newLikedStatus }
        : post
    ));
    await refreshBalance();
  };

  const handleCommentPost = async (postId) => {
    setPosts(prevPosts => prevPosts.map(post =>
      post.id === postId
        ? { ...post, calculatedComments: (post.calculatedComments || 0) + 1 }
        : post
    ));
    await refreshBalance();
  };

  const handleWitnessCreated = async (postId) => {
    try {
      ApiService.clearCache();
      await fetchPosts(selectedCategory, currentPage);
      await refreshBalance();
      setViewMode('witness');
      setNewlyWitnessedPostId(postId);
    } catch (error) { console.error('❌ Error after witness:', error); }
  };

  const mapCategoryToPrivacy = useCallback((category) => {
    if (!category) return 'public';
    const cat = category.toLowerCase();
    if (cat.includes('family')) return 'family';
    if (cat.includes('tribe')) return 'tribe';
    if (cat.includes('personal')) return 'private';
    return 'public';
  }, []);

  const handleRefreshPosts = async () => {
    setLoading(true);
    try { ApiService.clearCache(); await fetchPosts(selectedCategory, 1); }
    catch (error) { console.error('💥 Error reloading posts:', error); }
    finally { setLoading(false); }
  };

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(selectedCategory, nextPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchPosts(selectedCategory, prevPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCategoryClick = (category) => {
    if (category === 'Tribe Prayer' && !hasTribe) {
      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Prayer.');
      return;
    }
    if (selectedCategory === category) return;
    setSelectedCategory(category);
    setViewMode('original');
    setCurrentPage(1);
    setHasNextPage(false);
    fetchPosts(category, 1);
  };

  const fetchPosts = useCallback(async (categoryOverride, page = 1) => {
    const likesBeforeFetch = {};
    postsRef.current.forEach(p => {
      likesBeforeFetch[p.id] = { likes: p.likes || 0, isLiked: p.isLiked || false };
    });

    setLoading(true);
    setCurrentPage(page);
    try {
      const categoryToFetch = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const currentUserId = user?.user_id || user?.id || user?.userId || ApiService.getCurrentUserId();
      const postFilters = {};
      if (categoryToFetch) postFilters.category = categoryToFetch;
      if (viewScope === 'my') postFilters.userid = currentUserId;

      const postsResult = await ApiService.getPosts(page, 50, true, postFilters);
      const rawPosts = postsResult?.success ? (postsResult.posts || []) : [];

      if (rawPosts.length > 0) {
        const filteredPosts = rawPosts.filter(post => !post.parent_docid && post.docid);
        const currentAllPosts = allPostsRef.current;

        const transformedPosts = filteredPosts.map(post => ({
          id: post.docid,
          sn: post.sn,
          userid: post.userid || post.author_id,
          avatar_url: post.avatar_url,
          likes: post.amen_count !== undefined ? post.amen_count : 0,
          isLiked: (post.amened === true || post.amened === 1 || post.amened === 'true'),
          serverCommentCount: post.comment_count || 0,
          calculatedComments: Math.max(
            post.comment_count || 0,
            currentAllPosts.filter(p => p.parent_docid === post.docid && p.event !== 'witness').length
          ),
          title: post.title || '',
          content: post.content || '',
          privacy: post.privacy ? post.privacy.toLowerCase() : mapCategoryToPrivacy(post.category),
          category: post.category || categoryToFetch,
          author: post.author || post.userid || user?.name || 'Anonymous',
          time: post.datetime || post.created_at || null,
          image: post.image || null,
          audioRecordId: post.uuid || null,
          comments: 0
        }));

        setPosts(prev => {
          const prevMap = new Map(prev.map(p => [p.id, p]));
          return transformedPosts.map(newPost => {
            const existing = prevMap.get(newPost.id);
            const snap = likesBeforeFetch[newPost.id];
            const serverLikes = newPost.likes || 0;
            const snapLikes = snap?.likes || 0;
            const localLikes = existing?.likes || 0;
            const finalLikes = serverLikes > 0 ? serverLikes : snapLikes > 0 ? snapLikes : localLikes;
            const finalIsLiked = serverLikes > 0 ? newPost.isLiked : (snap?.isLiked || existing?.isLiked || newPost.isLiked);
            return {
              ...newPost,
              time: newPost.time || existing?.time || null,
              likes: finalLikes,
              isLiked: finalIsLiked,
              serverCommentCount: Math.max(newPost.serverCommentCount || 0, existing?.serverCommentCount || 0),
              calculatedComments: Math.max(
                newPost.serverCommentCount || 0,
                newPost.calculatedComments || 0,
                existing?.calculatedComments || 0,
                existing?.serverCommentCount || 0
              ),
            };
          });
        });

        setAllPosts(prev => {
          const existingChildren = prev.filter(p => p.parent_docid != null);
          const newChildren = rawPosts.filter(p => p.parent_docid != null);
          const newChildDocids = new Set(newChildren.map(p => p.docid));
          const mergedChildren = [
            ...newChildren,
            ...existingChildren.filter(p => !newChildDocids.has(p.docid))
          ];
          const rootPosts = rawPosts.filter(p => !p.parent_docid);
          return [...rootPosts, ...mergedChildren];
        });

        setHasNextPage(postsResult.pagination?.has_next === true);
      } else {
        setPosts([]);
        setAllPosts(prev => prev.filter(p => p.parent_docid != null));
        setHasNextPage(false);
      }
    } catch (error) {
      console.error('💥 Error fetching posts:', error);
      setPosts([]); setAllPosts([]); setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [user, selectedCategory, mapCategoryToPrivacy, viewScope]);

  const handleLoadComments = useCallback(async (postId) => {
    try {
      const result = await ApiService.getCommentsPage(1, 100, { parent_docid: postId })
        .catch(() => ({ success: false, comments: [] }));
      if (result?.success && result.comments?.length > 0) {
        setAllPosts(prev => {
          const withoutOld = prev.filter(p => p.parent_docid !== postId);
          return [...withoutOld, ...result.comments];
        });
      }
    } catch (e) {
      console.error('❌ Error loading comments for post:', postId, e);
    }
  }, []);

  const handlePostEdited = useCallback((oldDocid, newDocid, newPostData) => {
    setPosts(prev => prev.map(p =>
      p.id === oldDocid
        ? {
          ...p,
          content: newPostData?.content || p.content,
          title: newPostData?.title ?? p.title,
          userid: newPostData?.userid || p.userid,
          time: newPostData?.time ?? p.time ?? p.datetime ?? null,
          calculatedComments: Math.max(p.calculatedComments || 0, p.serverCommentCount || 0),
          serverCommentCount: Math.max(p.serverCommentCount || 0, p.calculatedComments || 0),
        }
        : p
    ));
    setAllPosts(prev => prev.map(p =>
      p.docid === oldDocid
        ? { ...p, content: newPostData?.content || p.content, title: newPostData?.title ?? p.title }
        : p
    ));
  }, []);

  useEffect(() => {
    fetchPosts(initialCategory, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchPosts(selectedCategory, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewScope]);

  const handleCloseTribeDetail = () => setShowTribeDetail(false);

  if (showTribeDetail) {
    if (userTribeId === null || userTribeId === undefined) {
      return <NoTribeDetail onBack={handleCloseTribeDetail} onTribeSelected={handleTribeSelected} user={user} />;
    }
    return <TribeDetail tribeId={userTribeId} tribeName={tribeNameProp} tribeIcon={tribeLogoProp} onBack={handleCloseTribeDetail} onTribeSelected={handleTribeSelected} user={user} />;
  }

  const filteredPosts = getFilteredPosts();

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="app-container">
        <UserHeader
          user={user} coins={loadingBalance ? '...' : coinAmount}
          tribeLogo={tribeLogoProp} tribeName={tribeNameProp} familyIcon={Mdi}
          notificationCount={notificationCount}
          onNotificationClick={handleNotificationClick} onCoinClick={handleCoinClick}
          onLogoClick={handleLogoClick} onTribeLogoClick={handleTribeLogoClick}
          onFamilyClick={handleFamilyClick} onBlessingClick={handleBlessingClick}
        />
        <div className="top-action-bar">
          <NotificationBell count={notificationCount} onClick={handleNotificationClick} size="medium" />
          <CoinDisplay amount={loadingBalance ? '...' : coinAmount} onClick={handleCoinClick} size="medium" />
        </div>
        <hr className="divider-line" />
        <div className="category-buttons">
          <div className="category-item" onClick={() => handleCategoryClick('Personal & Family')}>
            <RectButton image={family_and_personal} imageAlt="Personal & Family" size="medium" active={selectedCategory === 'Personal & Family'} />
            <CategoryLabel text="Personal & Family" isActive={selectedCategory === 'Personal & Family'} />
          </div>
          <div className="category-item" onClick={() => handleCategoryClick('Church & Ministry')}>
            <RectButton image={church} imageAlt="Church & Ministry" size="medium" active={selectedCategory === 'Church & Ministry'} />
            <CategoryLabel text="Church & Ministry" isActive={selectedCategory === 'Church & Ministry'} />
          </div>
          <div className="category-item" onClick={() => handleCategoryClick('Kingdom Prayer')}>
            <RectButton image={kingdom} imageAlt="Kingdom Prayer" size="medium" active={selectedCategory === 'Kingdom Prayer'} />
            <CategoryLabel text="Kingdom Prayer" isActive={selectedCategory === 'Kingdom Prayer'} />
          </div>
          <div className="category-item" onClick={() => handleCategoryClick('Tribe Prayer')} style={{ opacity: hasTribe ? 1 : 0.5 }}>
            <RectButton image={tribe} imageAlt="Tribes Prayer" size="medium" active={selectedCategory === 'Tribe Prayer'} />
            <CategoryLabel text={hasTribe ? "Tribe Prayer" : "Tribe Prayer 🔒"} isActive={selectedCategory === 'Tribe Prayer'} />
          </div>
        </div>
        <hr className="divider-line" />
        <div className="filter-bar">
          <div className="filter-controls">
            <RectButton icon="" onClick={() => { setViewMode('original'); handleRefreshPosts(); }} disabled={loading} size="small" variant="secondary" active={viewMode === 'original'}>
              {loading ? 'Loading...' : 'Original Post'}
            </RectButton>
            <RectButton icon="" onClick={() => setViewMode('witness')} size="small" variant="secondary" active={viewMode === 'witness'}>
              Witness Wall
            </RectButton>
            {hasTribe && selectedCategory === 'Tribe Prayer' && (
              <RectButton icon="" onClick={() => { setViewMode('activity'); fetchActivities(); }} size="small" variant="secondary" active={viewMode === 'activity'}>
                Activity
              </RectButton>
            )}
          </div>
        </div>
        <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '50vh', alignItems: 'stretch' }}>
          <div className="posts-container" style={{ flex: 1, width: '100%' }}>
            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
              </div>
            )}
            {!loading && viewMode === 'activity' ? (
              !hasTribe ? (
                <div className="no-tribe-message">
                  <div className="no-tribe-icon">🏛️</div>
                  <h3>No tribe selected yet</h3>
                  <p>Please select your tribe first to view and create activities</p>
                  <button className="select-tribe-btn" onClick={handleTribeLogoClick}>Select Tribe</button>
                </div>
              ) : showActivityForm ? (
                <ActivityForm user={user} onBack={handleCloseActivityForm} />
              ) : (
                <div className="activity-view">
                  <button className="add-activity-button" onClick={handleShowActivityForm}>+</button>
                  <div className="activities-list">
                    {activities.length > 0 ? (
                      activities.map(activity => (
                        <div key={activity.id} className="activity-card">
                          <div className="activity-header">
                            <div className="activity-avatar">
                              <AvatarImage userId={activity.author} userName={activity.author} src={activity.avatar_url} size={48} clickable={true} />
                            </div>
                            <div className="activity-info">
                              <div className="activity-author">{activity.author}</div>
                              <div className="activity-time">{activity.datetime}</div>
                            </div>
                            <div className="activity-privacy-badge"><span>{activity.privacy}</span></div>
                          </div>
                          {activity.coverImage && (
                            <div className="activity-cover-image">
                              <img src={activity.coverImage} alt={activity.eventName} onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                          )}
                          <div className="activity-content">
                            <h3>{activity.eventName}</h3>
                            <p className="activity-date">📅 {activity.eventDate}</p>
                            <p className="activity-location">📍 {activity.eventLocation}</p>
                            {activity.activityTime && <p className="activity-time">⏰ {activity.activityTime}</p>}
                            {activity.description && <p className="activity-description">{activity.description}</p>}
                            {activity.maxParticipants && <p className="activity-participants">👥 Max {activity.maxParticipants} people</p>}
                          </div>
                          {activity.images && activity.images.length > 0 && (
                            <div className="activity-images-gallery">
                              {activity.images.map((imgUrl, idx) => (
                                <img key={idx} src={imgUrl} alt={`Activity ${idx + 1}`}
                                  onClick={() => window.open(imgUrl, '_blank')}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-activities">
                        <div className="no-activities-icon">📅</div>
                        <h3>No activities yet</h3>
                        <p>There are currently no activities. Be the first to create one!</p>
                      </div>
                    )}
                  </div>
                  <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
                    <button onClick={() => { fetchActivities(activityPage - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={activityPage === 1 || loading} className="pagination-btn" style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: activityPage === 1 ? '#ccc' : '#4CAF50', color: 'white', cursor: activityPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>← Previous</button>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>Page {activityPage}</span>
                    <button onClick={() => { fetchActivities(activityPage + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={!activityHasNext || loading} className="pagination-btn" style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: !activityHasNext ? '#ccc' : '#4CAF50', color: 'white', cursor: !activityHasNext ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Next →</button>
                  </div>
                </div>
              )
            ) : !loading && viewMode === 'witness' ? (
              <WitnessWall
                selectedCategory={selectedCategory}
                currentUserId={user?.user_id || user?.userId || user?.id}
                allPosts={allPosts}
                refreshBalance={refreshBalance}
                viewScope={viewScope}
                newlyWitnessedPostId={newlyWitnessedPostId}
                onScrollDone={() => setNewlyWitnessedPostId(null)}
              />
            ) : !loading && filteredPosts.length > 0 ? (
              <div className="posts-feed">
                {filteredPosts.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    allPosts={allPosts}
                    onLike={handleLikePost}
                    onComment={handleCommentPost}
                    onWitnessCreated={handleWitnessCreated}
                    onPostEdited={handlePostEdited}
                    onLoadComments={handleLoadComments}
                    currentUserId={user?.user_id || user?.userId || user?.id}
                    selectedCategory={selectedCategory}
                    refreshBalance={refreshBalance}
                  />
                ))}
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', padding: '20px 0' }}>
                  <button onClick={handlePrevPage} disabled={currentPage === 1 || loading} className="pagination-btn" style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: currentPage === 1 ? '#ccc' : '#4CAF50', color: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>← Previous</button>
                  <span style={{ color: 'white', fontWeight: 'bold' }}>Page {currentPage}</span>
                  <button onClick={handleNextPage} disabled={!hasNextPage || loading} className="pagination-btn" style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: !hasNextPage ? '#ccc' : '#4CAF50', color: 'white', cursor: !hasNextPage ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>Next →</button>
                </div>
              </div>
            ) : !loading ? (
              <div className="no-posts">
                <div className="no-posts-icon">📭</div>
                <h4>No posts matching this filter</h4>
                <p>{selectedCategory ? `Current category: ${selectedCategory} - No data available` : 'Try switching to other settings to view existing posts'}</p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="bottom-navigation">
          <CircleButton provider="Home" iconSrc={Home}
            onClick={() => { setViewScope('my'); handleTabChange('Home'); setCurrentPage(1); setHasNextPage(false); fetchPosts(selectedCategory, 1); }}
            isActive={activeTab === 'Home'} size="medium" ariaLabel="Home"
          />
          <CircleButton provider="PrayerHub" iconSrc={Search}
            onClick={() => { setViewScope('all'); setActiveTab('PrayerHub'); navigate('/prayer-hub'); }}
            isActive={activeTab === 'PrayerHub'} size="medium" ariaLabel="Prayer Hub"
          />
          <CircleButton provider="Add" iconSrc={Add}
            onClick={() => handleCreatePost()}
            isActive={activeTab === 'Add'} size="medium" ariaLabel="Create Post"
          />
          <CircleButton provider="Search" iconSrc={Profile}
            onClick={() => { setActiveTab('Search'); navigate('/addfriend'); }}
            isActive={activeTab === 'Search'} size="medium" ariaLabel="Search Friends"
          />
          <CircleButton provider="Nova" iconSrc={Nova}
            onClick={() => { setActiveTab('Nova'); navigate('/nova'); }}
            isActive={activeTab === 'Nova'} size="medium" ariaLabel="Nova AI Assistant"
          />
        </div>
      </div>
    </AppBackground>
  );
};

export default MainApp;

