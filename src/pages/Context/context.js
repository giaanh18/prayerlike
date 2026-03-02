import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../services/api';
import TRANSCRIPT_API from '../../services/TranscriptAPI';

// Import new components
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

// Import image resources
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

// All possible tribes
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

// ==================== Tribe ID Mapping Table ====================
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

// ==================== IMAGE HELPER ====================
const getActivityImageUrl = (imagePath) => {
  if (!imagePath) {
    console.warn('⚠️ getActivityImageUrl: No image path provided');
    return null;
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('✅ Image already full URL:', imagePath);
    return imagePath;
  }
  const baseUrl = 'https://pray-api.yalinelena.church';
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const fullUrl = `${baseUrl}${cleanPath}`;
  console.log('🔗 Converted image URL:', { original: imagePath, full: fullUrl });
  return fullUrl;
};

// ==================== TRANSLATE ICON COMPONENT ====================
const TranslateIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" />
  </svg>
);

// ==================== WITNESS WALL COMPONENT ====================
const WitnessWall = ({
  selectedCategory,
  currentUserId,
  allPosts,
  refreshBalance,
  viewScope = 'my'
}) => {
  const [witnesses, setWitnesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    per_page: 10,
    has_next: false,
    has_prev: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [postStates, setPostStates] = useState({});
  const [commentStates, setCommentStates] = useState({});
  const [translationStates, setTranslationStates] = useState({});

  const handleTranslateOriginalPost = async (postId, content) => {
    const currentState = translationStates[postId];
    if (currentState?.isTranslating) return;

    if (currentState?.translatedContent) {
      setTranslationStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], translatedContent: null }
      }));
      return;
    }

    setTranslationStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], isTranslating: true, translationError: null }
    }));

    try {
      console.log(`🌐 Translating original post ${postId} in Witness Wall...`);
      const result = await ApiService.translate(content, 'en');

      if (result.success) {
        setTranslationStates(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            translatedContent: result.translatedText,
            isTranslating: false
          }
        }));
      } else {
        throw new Error(result.message || 'Translation failed');
      }
    } catch (error) {
      console.error(`❌ Original post ${postId} translation error:`, error);
      setTranslationStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          translationError: 'Translation failed, please try again later',
          isTranslating: false
        }
      }));
    }
  };

  const loadWitnesses = async (page = 1) => {
    setLoading(true);
    try {
      console.log(`✨ Loading Witness Wall - Page ${page}, Category: ${selectedCategory}, ViewScope: ${viewScope}`);
      const result = await ApiService.getWitnessList(page, 100);

      if (result.success) {
        const filteredWitnesses = result.witnesses.filter(witness => {
          const originalPost = witness.original_post ||
            allPosts?.find(p => p.docid === witness.parent_docid);

          if (!originalPost) {
            console.log(`⚠️ Witness ${witness.docid} original post not found`);
            return false;
          }

          if (viewScope === 'my') {
            const isMyPost = originalPost.userid === currentUserId ||
              originalPost.author === currentUserId;
            if (!isMyPost) {
              console.log(`🏠 Home mode: Skipping witness ${witness.docid} (not my post)`);
              return false;
            }
          }

          if (!selectedCategory) return true;

          const postCategory = originalPost.category;
          const isMatch = postCategory === selectedCategory;
          console.log(`🔍 Witness ${witness.docid}: Category="${postCategory}", Selected="${selectedCategory}", Match=${isMatch}`);
          return isMatch;
        });

        console.log(`✅ Filtered ${filteredWitnesses.length}/${result.witnesses.length} witnesses`);

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

        paginatedWitnesses.forEach(witness => {
          const originalPost = witness.original_post ||
            allPosts?.find(p => p.docid === witness.parent_docid);

          if (originalPost) {
            initialStates[originalPost.docid] = {
              likeCount: originalPost.amen_count || 0,
              hasLiked: false,
              isLiking: false,
              commentCount: originalPost.comment_count || 0,
              showCommentForm: false,
              commentText: '',
              isCommenting: false,
              comments: [],
              loadingComments: false
            };
            initialTranslationStates[originalPost.docid] = {
              isTranslating: false,
              translatedContent: null,
              translationError: null
            };
          }
        });

        setPostStates(initialStates);
        setTranslationStates(initialTranslationStates);
      } else {
        console.error('❌ Failed to load witnesses:', result.message);
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
    loadWitnesses(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    loadWitnesses(1);
  }, [selectedCategory, viewScope]);

  const handleNextPage = () => {
    if (pagination.has_next) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (pagination.has_prev) {
      setCurrentPage(prev => Math.max(1, prev - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLikeOriginalPost = async (postId) => {
    const currentState = postStates[postId];
    if (!currentState || currentState.isLiking) return;

    const prevCount = currentState.likeCount;
    const newCount = prevCount + 1;

    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], hasLiked: true, likeCount: newCount, isLiking: true }
    }));

    try {
      const result = await ApiService.likePost(postId, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        setTimeout(() => {
          setPostStates(prev => ({
            ...prev,
            [postId]: { ...prev[postId], likeCount: finalCount, hasLiked: false, isLiking: false }
          }));
        }, 300);
        if (refreshBalance) await refreshBalance();
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Like error:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], hasLiked: false, likeCount: prevCount, isLiking: false }
      }));
    }
  };

  const handleLikeComment = async (commentId) => {
    const currentState = commentStates[commentId];
    if (!currentState || currentState.isLiking) return;

    const prevCount = currentState.likeCount;
    const newCount = prevCount + 1;

    setCommentStates(prev => ({
      ...prev,
      [commentId]: { ...prev[commentId], hasLiked: true, likeCount: newCount, isLiking: true }
    }));

    try {
      const result = await ApiService.likeComment(commentId, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        setTimeout(() => {
          setCommentStates(prev => ({
            ...prev,
            [commentId]: { ...prev[commentId], likeCount: finalCount, hasLiked: false, isLiking: false }
          }));
        }, 300);
        if (refreshBalance) await refreshBalance();
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Like comment error:', error);
      setCommentStates(prev => ({
        ...prev,
        [commentId]: { ...prev[commentId], hasLiked: false, likeCount: prevCount, isLiking: false }
      }));
    }
  };

  const loadComments = async (postId) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], loadingComments: true }
    }));

    try {
      const allReplies = allPosts.filter(
        p => p.parent_docid === postId && p.event !== 'witness'
      );

      const formattedComments = allReplies.map(c => ({
        id: c.docid,
        author: c.userid,
        content: c.content,
        time: c.datetime || 'Just now',
        likes: c.amen_count || 0,
        isReply: true,
        userid: c.userid,
        avatar_url: c.avatar_url
      }));

      const newCommentStates = {};
      formattedComments.forEach(comment => {
        newCommentStates[comment.id] = { likeCount: comment.likes || 0, hasLiked: false, isLiking: false };
      });

      setCommentStates(prev => ({ ...prev, ...newCommentStates }));
      setPostStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], comments: formattedComments, loadingComments: false }
      }));
    } catch (error) {
      console.error('❌ Load comments error:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], loadingComments: false }
      }));
    }
  };

  const handleToggleCommentForm = (postId) => {
    const currentState = postStates[postId];
    const newShowState = !currentState?.showCommentForm;
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], showCommentForm: newShowState }
    }));
    if (newShowState && currentState?.comments.length === 0) {
      loadComments(postId);
    }
  };

  const handleCommentTextChange = (postId, text) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], commentText: text }
    }));
  };

  const handleCommentSubmit = async (e, postId, postSn) => {
    e.preventDefault();
    const currentState = postStates[postId];
    if (!currentState?.commentText.trim() || currentState.isCommenting) return;

    setPostStates(prev => ({
      ...prev,
      [postId]: { ...prev[postId], isCommenting: true }
    }));

    try {
      console.log(`💬 Adding comment to post docid=${postId}:`, currentState.commentText.trim());
      const result = await ApiService.addComment({
        userid: currentUserId,
        content: currentState.commentText.trim(),
        docid: postId,
        sn: postSn
      });

      if (result.success) {
        console.log('✅ Comment added successfully:', result.comment);
        const newCommentId = result.comment?.docid || `temp-${Date.now()}`;
        const newComment = {
          id: newCommentId,
          author: currentUserId,
          content: currentState.commentText.trim(),
          time: 'Just now',
          likes: 0,
          isReply: true,
          userid: currentUserId,
          avatar_url: result.comment?.avatar_url
        };

        setCommentStates(prev => ({
          ...prev,
          [newCommentId]: { likeCount: 0, hasLiked: false, isLiking: false }
        }));

        setPostStates(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            commentText: '',
            isCommenting: false,
            commentCount: prev[postId].commentCount + 1,
            comments: [newComment, ...prev[postId].comments]
          }
        }));

        if (refreshBalance) await refreshBalance();
      } else {
        alert(`Comment failed: ${result.message}`);
        setPostStates(prev => ({
          ...prev,
          [postId]: { ...prev[postId], isCommenting: false }
        }));
      }
    } catch (error) {
      console.error('💥 Comment error:', error);
      alert(`Error occurred while commenting: ${error.message}`);
      setPostStates(prev => ({
        ...prev,
        [postId]: { ...prev[postId], isCommenting: false }
      }));
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
          const originalPost = witness.original_post ||
            allPosts?.find(p => p.docid === witness.parent_docid);

          const postState = postStates[originalPost?.docid] || {
            likeCount: originalPost?.amen_count || 0,
            hasLiked: false,
            isLiking: false,
            commentCount: originalPost?.comment_count || 0,
            showCommentForm: false,
            commentText: '',
            isCommenting: false,
            comments: [],
            loadingComments: false
          };

          const translationState = translationStates[originalPost?.docid] || {
            isTranslating: false,
            translatedContent: null,
            translationError: null
          };

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
                      <div className="post-time">{originalPost.datetime || 'Just now'}</div>
                    </div>
                    <div className="post-badges-container">
                      <div className="post-privacy-badge">
                        {(!originalPost.privacy || originalPost.privacy === 'public') && <span>Public</span>}
                        {originalPost.privacy === 'family' && <span>Family</span>}
                        {originalPost.privacy === 'tribe' && <span>Tribe</span>}
                        {(originalPost.privacy === 'individual' || originalPost.privacy === 'private') && <span>Individual</span>}
                      </div>
                      <div className="post-category-badge">
                        <span>{originalPost.category || 'General'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="post-content">
                    {originalPost.title && <h3>{originalPost.title}</h3>}
                    <p>{originalPost.content}</p>

                    <button
                      className={`post-translate-button ${translationState.isTranslating ? 'translating' : ''} ${translationState.translatedContent ? 'active' : ''}`}
                      onClick={() => handleTranslateOriginalPost(originalPost.docid, originalPost.content)}
                      disabled={translationState.isTranslating}
                      title={translationState.translatedContent ? 'Hide translation' : 'Translate this post'}
                    >
                      <TranslateIcon size={18} />
                    </button>

                    {translationState.translatedContent && (
                      <div className="post-translated-content">
                        <span className="translate-label">🌐 Translation:</span>
                        <p>{translationState.translatedContent}</p>
                      </div>
                    )}

                    {translationState.translationError && (
                      <div className="post-translation-error">
                        ⚠️ {translationState.translationError}
                      </div>
                    )}
                  </div>

                  <div className="post-actions">
                    <button
                      className={`action-button action-amen ${postState.hasLiked ? 'active-amen' : ''}`}
                      onClick={() => handleLikeOriginalPost(originalPost.docid)}
                      disabled={postState.isLiking}
                    >
                      {postState.isLiking ? 'Processing...' :
                        (postState.hasLiked ? `AMENED (${postState.likeCount})` : `AMEN (${postState.likeCount})`)}
                    </button>

                    <button
                      className={`action-button action-comment ${postState.showCommentForm ? 'active-comment' : ''}`}
                      onClick={() => handleToggleCommentForm(originalPost.docid)}
                    >
                      PRAY FOR ME ({postState.commentCount})
                    </button>
                  </div>

                  {postState.showCommentForm && (
                    <div className="form-container comment-form-wrapper">
                      <form
                        className="comment-form"
                        onSubmit={(e) => handleCommentSubmit(e, originalPost.docid, originalPost.sn)}
                      >
                        <div className="comment-input-container">
                          <textarea
                            value={postState.commentText}
                            onChange={(e) => handleCommentTextChange(originalPost.docid, e.target.value)}
                            placeholder="Write your comment..."
                            rows="3"
                            maxLength="500"
                          />
                          <VoiceRecordButton
                            onTranscriptComplete={(transcript) => {
                              handleCommentTextChange(
                                originalPost.docid,
                                postState.commentText + (postState.commentText ? ' ' : '') + transcript
                              );
                            }}
                          />
                        </div>
                        <div className="form-info">
                          <span className="char-count">{postState.commentText.length}/500</span>
                        </div>
                        <div className="form-actions">
                          <button
                            type="submit"
                            disabled={!postState.commentText.trim() || postState.isCommenting}
                            className="submit-btn comment-submit-btn"
                          >
                            {postState.isCommenting ? 'Sending...' : 'Pray For You'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCommentForm(originalPost.docid)}
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
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
                              const commentState = commentStates[comment.id] || {
                                likeCount: comment.likes || 0,
                                hasLiked: false,
                                isLiking: false
                              };
                              return (
                                <div key={comment.id} className="comment comment-reply">
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
                                      <div className="comment-time">{comment.time}</div>
                                    </div>
                                  </div>
                                  <div className="comment-content">
                                    <p>{comment.content}</p>
                                  </div>
                                  <div className="comment-actions">
                                    <button
                                      className={`comment-like-btn ${commentState.hasLiked ? 'active-amen' : ''}`}
                                      onClick={() => handleLikeComment(comment.id)}
                                      disabled={commentState.isLiking}
                                    >
                                      {commentState.isLiking ? 'Processing...' :
                                        (commentState.hasLiked ? `AMENED (${commentState.likeCount})` : `AMEN (${commentState.likeCount})`)}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="no-comments">
                              <p>No comments yet. Be the first to leave a message!</p>
                            </div>
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
                    <div className="witness-wall-time">{witness.datetime || 'Just now'}</div>
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

      {(pagination.has_prev || pagination.has_next) && (
        <div className="witness-wall-pagination">
          <button
            className="pagination-btn"
            onClick={handlePrevPage}
            disabled={!pagination.has_prev || loading}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {pagination.current_page} / {pagination.total_pages} ({pagination.total_items} testimonies)
          </span>
          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={!pagination.has_next || loading}
          >
            Next →
          </button>
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
    { id: 'all', label: 'All', icon: '' },
    { id: 'public', label: 'Public', icon: '' },
    { id: 'family', label: 'Family', icon: '' },
    { id: 'tribe', label: 'Tribe', icon: '' },
    { id: 'private', label: 'Private', icon: '' }
  ];

  const selectedOption = options.find(option => option.id === selected);

  const handleSelect = (optionId) => {
    setSelected(optionId);
    setIsOpen(false);
    if (onChange) onChange(optionId);
  };

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

// ==================== COMMENT COMPONENT ====================
const Comment = ({ comment, onReply, onEdit, onDelete, onLike, currentUserId, postDocid, commentState }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(comment.content);
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
      alert(`Error occurred while replying: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await ApiService.editComment(comment.id, currentUserId, editText.trim());
      if (result.success) {
        setIsEditing(false);
        if (onEdit) onEdit(comment.id, editText.trim());
      } else {
        alert(`Edit failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Edit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this comment? This action cannot be undone!');
    if (!confirmDelete) return;
    try {
      const result = await ApiService.deleteComment(comment.id, currentUserId);
      if (result.success) {
        if (onDelete) onDelete(comment.id);
      } else {
        alert(`Delete failed: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
    }
  };

  const isOwner = comment.userid === currentUserId || comment.userid === String(currentUserId);

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
          <div className="comment-time">{comment.time}</div>
        </div>
      </div>

      <div className="comment-content">
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="comment-edit-form">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Edit your comment..."
              rows="2"
              maxLength="500"
            />
            <div className="comment-edit-actions">
              <button type="submit" disabled={!editText.trim() || isSubmitting} className="comment-save-btn">
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => { setIsEditing(false); setEditText(comment.content); }} className="comment-cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p>{comment.content}</p>
            <button
              className={`comment-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
              onClick={handleTranslate}
              disabled={isTranslating}
              title={translatedContent ? 'Hide translation' : 'Translate this comment'}
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
          </>
        )}
      </div>

      <div className="comment-actions">
        <button
          className={`comment-action-btn like ${commentState?.hasLiked ? 'active-amen' : ''}`}
          onClick={() => onLike(comment.id)}
          disabled={commentState?.isLiking}
          title="Amen comment"
        >
          {commentState?.isLiking ? 'Processing...' :
            (commentState?.hasLiked ? `AMENED (${commentState?.likeCount || 0})` : `AMEN (${commentState?.likeCount || 0})`)}
        </button>

        {!comment.isReply && (
          <button className="comment-action-btn reply" onClick={() => setIsReplying(!isReplying)} title="Reply to comment">
            💬 Reply
          </button>
        )}

        {!comment.isReply && replies.length > 0 && (
          <button
            className="comment-action-btn show-replies"
            onClick={() => { setShowReplies(!showReplies); if (!showReplies && replies.length === 0) loadReplies(); }}
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
const Post = ({ post, allPosts, onLike, onComment, onWitnessCreated, currentUserId, selectedCategory, refreshBalance }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentStates, setCommentStates] = useState({});
  const isLikingRef = useRef(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [witnessText, setWitnessText] = useState('');
  const [isSubmittingWitness, setIsSubmittingWitness] = useState(false);
  const [witnessCount, setWitnessCount] = useState(0);
  const [activeForm, setActiveForm] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translationError, setTranslationError] = useState(null);

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
      setTranslationError('Translation failed, please try again later');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    if (post.likes !== undefined) setLikeCount(post.likes);
    const postWitnesses = allPosts.filter(p => p.parent_docid === post.id && p.event === 'witness');
    setWitnessCount(postWitnesses.length);
  }, [post.likes, allPosts, post.id]);

  const [transcriptData, setTranscriptData] = useState(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);

  const handleWitnessSubmit = async (e) => {
    e.preventDefault();
    if (!witnessText.trim() || isSubmittingWitness) return;
    setIsSubmittingWitness(true);
    try {
      const result = await ApiService.createWitness(currentUserId, witnessText.trim(), post.id);
      if (result.success) {
        setWitnessText('');
        setActiveForm(null);
        if (refreshBalance) await refreshBalance();
        if (onWitnessCreated && typeof onWitnessCreated === 'function') {
          onWitnessCreated(post.id);
        }
      } else {
        alert(`Failed to add testimony: ${result.message}`);
      }
    } catch (error) {
      alert(`Error occurred while adding testimony: ${error.message}`);
    } finally {
      setIsSubmittingWitness(false);
    }
  };

  const handleToggleWitnessForm = () => {
    if (activeForm === 'witness') {
      setActiveForm(null);
      setWitnessText('');
    } else {
      setActiveForm('witness');
      setCommentText('');
      setComments([]);
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
        time: c.datetime || 'Just now',
        likes: c.amen_count || 0,
        isReply: true,
        userid: c.userid,
        avatar_url: c.avatar_url
      }));

      const newCommentStates = {};
      formattedComments.forEach(comment => {
        newCommentStates[comment.id] = { likeCount: comment.likes || 0, hasLiked: false, isLiking: false };
      });

      if (!append) {
        setCommentStates(newCommentStates);
      } else {
        setCommentStates(prev => ({ ...prev, ...newCommentStates }));
      }

      setComments(prev => append ? [...prev, ...formattedComments] : formattedComments);
      setHasMoreComments(allReplies.length > page * pageSize);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleCommentForm = () => {
    if (activeForm === 'comment') {
      setActiveForm(null);
      setCommentText('');
      setComments([]);
      setCommentPage(1);
      setHasMoreComments(false);
    } else {
      setActiveForm('comment');
      setWitnessText('');
      if (comments.length === 0) { loadComments(1, false); setCommentPage(1); }
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
      const result = await TRANSCRIPT_API.getTranscript(post.audioRecordId);
      if (result.success) {
        setTranscriptData(result);
        setShowTranscriptPanel(true);
      } else {
        alert(`Failed to query transcript: ${result.error}`);
      }
    } catch (error) {
      console.error('💥 Error querying transcript:', error);
    } finally {
      setIsLoadingTranscript(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!post.audioRecordId || isDeletingRecord) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this audio record?\n\nAudio ID: ${post.audioRecordId}\n\nThis action cannot be undone!`
    );
    if (!confirmDelete) return;
    setIsDeletingRecord(true);
    try {
      const result = await TRANSCRIPT_API.deleteRecord(post.audioRecordId);
      if (result.success) {
        alert(`Audio record deleted successfully!\nTime taken: ${result.performance}`);
        setTranscriptData(null);
        setShowTranscriptPanel(false);
      } else {
        alert(`Failed to delete audio record: ${result.error}`);
      }
    } catch (error) {
      alert(`Error occurred while deleting audio record: ${error.message}`);
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const TranscriptPanel = () => (
    <div className="transcript-panel">
      <div className="transcript-header">
        <h4>🎵 Audio Transcription Result</h4>
        <button className="close-transcript-button" onClick={() => setShowTranscriptPanel(false)}>✕</button>
      </div>
      <div className="transcript-content">
        <div className="transcript-info">
          <p><strong>Audio ID:</strong> {transcriptData?.recordId}</p>
          <p><strong>Status:</strong> {transcriptData?.status}</p>
        </div>
        {transcriptData?.transcript && (
          <div className="transcript-text">
            <h5>📝 Transcription Content:</h5>
            <div className="transcript-content-text">{transcriptData.transcript}</div>
          </div>
        )}
        {transcriptData?.audio_url && (
          <div className="transcript-audio">
            <h5>🎧 Audio Playback:</h5>
            <audio controls src={transcriptData.audio_url}>Your browser does not support audio playback</audio>
          </div>
        )}
      </div>
    </div>
  );

  const handleLike = async () => {
    if (isLikingRef.current) return;
    isLikingRef.current = true;
    const prevCount = likeCount;
    const optimisticCount = !post.isLiked ? prevCount + 1 : Math.max(0, prevCount - 1);
    setHasLiked(true);
    setLikeCount(optimisticCount);
    try {
      const result = await ApiService.likePost(post.id, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : optimisticCount;
        setLikeCount(finalCount);
        setTimeout(() => setHasLiked(false), 300);
        if (onLike) onLike(post.id, result.data?.amened ?? !post.isLiked, finalCount);
        if (refreshBalance) await refreshBalance();
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      setHasLiked(false);
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
    const newCount = prevCount + 1;
    setCommentStates(prev => ({
      ...prev,
      [commentId]: { ...prev[commentId], hasLiked: true, likeCount: newCount, isLiking: true }
    }));
    try {
      const result = await ApiService.likeComment(commentId, currentUserId);
      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        setTimeout(() => {
          setCommentStates(prev => ({
            ...prev,
            [commentId]: { ...prev[commentId], likeCount: finalCount, hasLiked: false, isLiking: false }
          }));
        }, 300);
        if (refreshBalance) await refreshBalance();
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      setCommentStates(prev => ({
        ...prev,
        [commentId]: { ...prev[commentId], hasLiked: false, likeCount: prevCount, isLiking: false }
      }));
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const result = await ApiService.addComment({
        userid: currentUserId,
        content: commentText.trim(),
        docid: post.id,
        sn: post.sn
      });
      if (result.success) {
        const newCommentId = result.comment?.docid || `temp-${Date.now()}`;
        setCommentStates(prev => ({
          ...prev,
          [newCommentId]: { likeCount: 0, hasLiked: false, isLiking: false }
        }));
        setCommentText('');
        loadComments(1, false);
        if (onComment) onComment(post.id, commentText.trim());
        if (refreshBalance) await refreshBalance();
      } else {
        alert(`Comment failed: ${result.message}`);
      }
    } catch (error) {
      alert(`Error occurred while commenting: ${error.message}`);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleCommentReply = (commentId, reply) => {
    console.log(`💬 Reply to comment ${commentId}:`, reply);
  };

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
          <div className="post-time">{post.time || post.datetime || 'Just now'}</div>
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
        <p>{post.content}</p>

        <button
          className={`post-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
          title={translatedContent ? 'Hide translation' : 'Translate this post'}
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

        {post.audioRecordId && (
          <div className="post-audio-info">
            <p>🎵 Includes audio file (UUID: {post.audioRecordId})</p>
            <div className="audio-management-buttons">
              <button
                className={`audio-action-button ${isLoadingTranscript ? 'loading' : ''}`}
                onClick={handleGetTranscript}
                disabled={isLoadingTranscript || isDeletingRecord}
              >
                {isLoadingTranscript ? 'Querying...' : '📝 Query Transcription'}
              </button>
              <button
                className={`audio-action-button delete-button ${isDeletingRecord ? 'loading' : ''}`}
                onClick={handleDeleteRecord}
                disabled={isDeletingRecord || isLoadingTranscript}
              >
                {isDeletingRecord ? 'Deleting...' : '🗑️ Delete Recording'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showTranscriptPanel && transcriptData && <TranscriptPanel />}

      <div className="post-actions">
        <button
          className={`action-button action-amen ${hasLiked ? 'active-amen' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          {isLiking ? 'Processing...' : (hasLiked ? `AMENED (${likeCount})` : `AMEN (${likeCount})`)}
        </button>

        <button
          className={`action-button action-comment ${activeForm === 'comment' ? 'active-comment' : ''}`}
          onClick={handleToggleCommentForm}
        >
          PRAY FOR ME ({post.calculatedComments || 0})
        </button>

        <button
          className={`action-button action-witness ${activeForm === 'witness' ? 'active-witness' : ''}`}
          onClick={handleToggleWitnessForm}
        >
          WITNESS ({witnessCount})
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
            <div className="form-actions">
              <button
                type="submit"
                disabled={!witnessText.trim() || isSubmittingWitness}
                className="submit-btn witness-submit-btn"
              >
                {isSubmittingWitness ? 'Submitting...' : '✨ Submit Testimony'}
              </button>
              <button
                type="button"
                onClick={() => { setActiveForm(null); setWitnessText(''); }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeForm === 'comment' && (
        <div className="form-container comment-form-wrapper">
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
                onClick={() => { setActiveForm(null); setCommentText(''); }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="comments-section">
            <div className="comments-header">
              <h4>💬 Prayers ({comments.length})</h4>
              {loadingComments && <span className="loading-indicator">Loading...</span>}
            </div>
            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map(comment => (
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
                <div className="no-comments">
                  <p>No comments yet. Be the first to leave a message!</p>
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
                  {loadingComments ? 'Loading...' : 'Load more comments'}
                </button>
              </div>
            )}
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

  const [currentTribeId, setCurrentTribeId] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    return storedUser.tribe !== undefined ? storedUser.tribe : user?.tribe;
  });

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [viewMode, setViewMode] = useState('original');
  const [viewScope, setViewScope] = useState('my');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activities, setActivities] = useState([]);

  const navigatingRef = useRef(false);

  const hasTribe = currentTribeId !== null && currentTribeId !== undefined;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    if (storedUser.tribe !== undefined && storedUser.tribe !== currentTribeId) {
      console.log(`🔄 Syncing tribe from localStorage: ${storedUser.tribe}`);
      setCurrentTribeId(storedUser.tribe);
    }
  }, [user, currentTribeId]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
    console.log('🔍 DEBUG - Current State:');
    console.log('   - currentTribeId:', currentTribeId);
    console.log('   - hasTribe:', hasTribe);
    console.log('   - user.tribe:', user?.tribe);
    console.log('   - localStorage.tribe:', storedUser.tribe);
  }, [currentTribeId, user, hasTribe]);

  const userTribeId = currentTribeId;
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

  useEffect(() => {
    const fetchBalance = async () => {
      const userId = user?.id || user?.userId || ApiService.getCurrentUserId();
      if (!userId) {
        console.warn('⚠️ User ID not found');
        setLoadingBalance(false);
        return;
      }
      console.log('💰 Loading YCoin balance for user:', userId);
      const result = await ApiService.getUserBalance(userId);
      if (result.success) {
        setCoinAmount(result.balance);
        console.log('✅ Balance loaded:', result.balance);
      } else {
        console.error('❌ Failed to load balance:', result.message);
        setCoinAmount(0);
      }
      setLoadingBalance(false);
    };
    fetchBalance();
  }, [user]);

  const refreshBalance = async () => {
    const userId = user?.id || user?.userId || ApiService.getCurrentUserId();
    if (!userId) return;
    console.log('💰 Refreshing YCoin balance...');
    const result = await ApiService.getUserBalance(userId);
    if (result.success) {
      setCoinAmount(result.balance);
      console.log('✅ Balance refreshed:', result.balance);
    }
  };

  const fetchNotificationCount = useCallback(async () => {
    try {
      console.log('🔔 Fetching notification count...');
      const result = await ApiService.getNotifications({ limit: 1, offset: 0, unread_only: false });
      if (result.success) {
        const count = result.unread_count ?? 0;
        setNotificationCount(count);
        console.log('🔔 Unread notifications:', count);
      } else {
        setNotificationCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching notification count:', error);
      setNotificationCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  const handleTribeSelected = async (newTribeId) => {
    console.log(`✅ Tribe selected: ${newTribeId}`);
    setCurrentTribeId(newTribeId);
    if (user) user.tribe = newTribeId;
    try {
      const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      storedUser.tribe = newTribeId;
      localStorage.setItem('userData', JSON.stringify(storedUser));
      console.log('💾 Tribe saved to localStorage:', storedUser);
    } catch (error) {
      console.error('❌ Error saving tribe to localStorage:', error);
    }
    setShowTribeDetail(false);
    setTimeout(() => {
      alert('Tribe selection successful! Your tribe has been updated.');
    }, 100);
  };

  const handleTribeLogoClick = () => {
    console.log('🏛️ Tribe Logo clicked');
    setShowTribeDetail(true);
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setViewMode('original');
    console.log(`Switch to tab: ${tabName}`);
    if (tabName === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    setActiveTab('Nova');
    try {
      console.log('🚪 User logging out...');
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

  const handleNotificationClick = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }
    console.log('🔔 Navigate to Notifications');
    navigatingRef.current = true;
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate('/notifications');
  }, [navigate]);

  const handleCoinClick = () => {
    console.log('💰 Coin clicked - navigating to YB History');
    navigate('/yb-history');
  };

  const handleLogoClick = () => { handleTabChange('Home'); };

  const handleFamilyClick = () => {
    console.log('👨‍👩‍👧‍👦 Navigate to Friends List');
    navigate('/friends');
  };

  const handleBlessingClick = () => {
    console.log('🍀 Blessings clicked - Logout');
    handleLogout();
  };

  const handleShowActivityForm = () => {
    if (!hasTribe) {
      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to create an activity.');
      return;
    }
    setShowActivityForm(true);
  };

  const handleCloseActivityForm = () => {
    setShowActivityForm(false);
    fetchActivities();
  };

  const fetchActivities = async () => {
    if (!hasTribe) {
      console.log('⚠️ User has no tribe, skipping activity fetch');
      setActivities([]);
      setLoading(false);
      return;
    }
    console.log('📡 Fetching activities from API...');
    setLoading(true);
    try {
      const params = { page: 1, limit: 50, tribe: currentTribeId, is_published: true };
      const result = await ApiService.getActivities(params);
      if (result.success) {
        console.log('✅ Activities loaded:', result.activities);
        const transformedActivities = result.activities.map(activity => ({
          id: activity.id,
          author: activity.created_by || activity.userid || 'Unknown',
          datetime: activity.created_at || activity.datetime || 'Just now',
          eventName: activity.title,
          eventDate: activity.event_date,
          eventLocation: activity.location,
          activityTime: activity.event_time,
          privacy: activity.privacy || 'public',
          description: activity.description || '',
          maxParticipants: activity.max_participants || null,
          tribe: activity.tribe,
          coverImage: activity.cover_image || null,
          images: activity.images || []
        }));
        setActivities(transformedActivities);
      } else {
        console.error('❌ Failed to load activities:', result.message);
        setActivities([]);
      }
    } catch (error) {
      console.error('💥 Error fetching activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPosts = () => {
    if (privacyFilter === 'all') return posts;
    return posts.filter(post => post.privacy === privacyFilter);
  };

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

  const handleCommentPost = async (postId, commentText) => {
    console.log(`💬 New comment on post ${postId}:`, commentText);
    await fetchPosts();
    await refreshBalance();
  };

  const handleWitnessCreated = async (postId) => {
    console.log(`✨ Witness created for post ${postId}`);
    try {
      const witnessedPost = posts.find(p => p.id === postId) || allPosts.find(p => p.docid === postId);
      if (!witnessedPost) { console.error('❌ Could not find the witnessed post'); return; }

      const postCategory = witnessedPost.category || selectedCategory;
      if (postCategory !== selectedCategory) setSelectedCategory(postCategory);

      setViewMode('witness');
      ApiService.clearCache();
      await fetchPosts(postCategory);
      await refreshBalance();

      setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
      console.log(`✅ Switched to ${postCategory} - Witness Wall`);
    } catch (error) {
      console.error('❌ Error switching view:', error);
    }
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
    try {
      ApiService.clearCache();
      await fetchPosts(selectedCategory);
    } catch (error) {
      console.error('💥 Error reloading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    console.log(`📂 Switch category to: ${category}`);
    if (category === 'Tribe Prayer' && !hasTribe) {
      alert('⚠️ You have not selected a tribe yet!\nPlease select your tribe first to use Tribe Prayer.');
      return;
    }
    if (selectedCategory === category) return;
    setSelectedCategory(category);
    setViewMode('original');
    fetchPosts(category);
  };

  const getDemoPosts = useCallback(() => [], [user?.name]);

  const fetchPosts = useCallback(async (categoryOverride) => {
    setLoading(true);
    try {
      console.log('📡 Fetching posts from API...');
      const categoryToFetch = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const currentUserId = user?.id || user?.userId || ApiService.getCurrentUserId();

      const filters = { viewer_userid: currentUserId };
      if (categoryToFetch) filters.category = categoryToFetch;

      if (viewScope === 'my') {
        filters.userid = currentUserId;
        console.log('🏠 Home mode: Filtering posts by current user only');
      } else {
        console.log('🌍 Prayer Hub mode: Showing all posts');
      }

      let result = await ApiService.getPosts(1, 50, true, filters);

      if (result && result.success && result.posts && result.posts.length > 0) {
        console.log('✅ Posts fetched successfully:', result.posts.length);

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
          userid: post.userid || post.author_id,
          avatar_url: post.avatar_url,
          likes: post.amen_count !== undefined ? post.amen_count : 0,
          isLiked: (post.amened === true || post.amened === 1 || post.amened === 'true'),
          calculatedComments: commentsCountMap[post.docid] || 0,
          title: post.title || '',
          content: post.content || '',
          privacy: post.privacy ? post.privacy.toLowerCase() : mapCategoryToPrivacy(post.category),
          category: post.category || categoryToFetch,
          author: post.author || post.userid || user?.name || 'Anonymous',
          time: post.datetime || 'Just now',
          image: post.image || null,
          audioRecordId: post.uuid || null,
          comments: 0
        }));

        setPosts(transformedPosts);
        setAllPosts(result.posts);
      } else {
        console.log('⚠️ API response is empty or failed');
        setPosts([]);
        setAllPosts([]);
      }
    } catch (error) {
      console.error('💥 Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [getDemoPosts, user, selectedCategory, mapCategoryToPrivacy, viewScope]);

  useEffect(() => {
    console.log('🏠 MainApp mounted, user:', user);
    fetchPosts(initialCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseTribeDetail = () => { setShowTribeDetail(false); };

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

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="app-container">
        <UserHeader
          user={user}
          coins={loadingBalance ? '...' : coinAmount}
          tribeLogo={tribeLogoProp}
          tribeName={tribeNameProp}
          familyIcon={Mdi}
          notificationCount={notificationCount}
          onNotificationClick={handleNotificationClick}
          onCoinClick={handleCoinClick}
          onLogoClick={handleLogoClick}
          onTribeLogoClick={handleTribeLogoClick}
          onFamilyClick={handleFamilyClick}
          onBlessingClick={handleBlessingClick}
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
            <RectButton
              icon=""
              onClick={() => { setViewMode('original'); handleRefreshPosts(); }}
              disabled={loading}
              size="small"
              variant="secondary"
              active={viewMode === 'original'}
            >
              {loading ? 'Loading...' : 'Original Post'}
            </RectButton>

            <RectButton
              icon=""
              onClick={() => { setViewMode('witness'); console.log('Show Witness Wall'); }}
              size="small"
              variant="secondary"
              active={viewMode === 'witness'}
            >
              Witness Wall
            </RectButton>

            {hasTribe && selectedCategory === 'Tribe Prayer' && (
              <RectButton
                icon=""
                onClick={() => { setViewMode('activity'); fetchActivities(); }}
                size="small"
                variant="secondary"
                active={viewMode === 'activity'}
              >
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
                  <button className="select-tribe-btn" onClick={handleTribeLogoClick}>
                    Select Tribe
                  </button>
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
                              <AvatarImage
                                userId={activity.author}
                                userName={activity.author}
                                src={ApiService.processAvatarUrl(activity.avatar_url)}
                                size={48}
                                clickable={true}
                              />
                            </div>
                            <div className="activity-info">
                              <div className="activity-author">{activity.author}</div>
                              <div className="activity-time">{activity.datetime}</div>
                            </div>
                            <div className="activity-privacy-badge">
                              <span>{activity.privacy}</span>
                            </div>
                          </div>

                          {activity.coverImage && (
                            <div className="activity-cover-image">
                              <img
                                src={getActivityImageUrl(activity.coverImage)}
                                alt={activity.eventName}
                                onError={(e) => { console.error('❌ Cover image failed:', activity.coverImage); e.target.style.display = 'none'; }}
                                onLoad={() => console.log('✅ Cover image loaded:', activity.coverImage)}
                              />
                            </div>
                          )}

                          <div className="activity-content">
                            <h3>{activity.eventName}</h3>
                            <p className="activity-date">📅 {activity.eventDate}</p>
                            <p className="activity-location">📍 {activity.eventLocation}</p>
                            {activity.activityTime && <p className="activity-time">⏰ {activity.activityTime}</p>}
                            {activity.description && <p className="activity-description">{activity.description}</p>}
                            {activity.maxParticipants && (
                              <p className="activity-participants">👥 Max {activity.maxParticipants} people</p>
                            )}
                          </div>

                          {activity.images && activity.images.length > 0 && (
                            <div className="activity-images-gallery">
                              {activity.images.map((imgUrl, idx) => (
                                <img
                                  key={idx}
                                  src={getActivityImageUrl(imgUrl)}
                                  alt={`Activity ${idx + 1}`}
                                  onClick={() => window.open(getActivityImageUrl(imgUrl), '_blank')}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                  onLoad={() => console.log(`✅ Image ${idx + 1} loaded`)}
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
                </div>
              )
            ) : !loading && viewMode === 'witness' ? (
              <WitnessWall
                selectedCategory={selectedCategory}
                currentUserId={user?.id}
                allPosts={allPosts}
                refreshBalance={refreshBalance}
                viewScope={viewScope}
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
                    currentUserId={user?.id}
                    selectedCategory={selectedCategory}
                    refreshBalance={refreshBalance}
                  />
                ))}
              </div>
            ) : !loading ? (
              <div className="no-posts">
                <div className="no-posts-icon">📭</div>
                <h4>No posts matching this filter</h4>
                <p>
                  {selectedCategory
                    ? `Current category: ${selectedCategory} - No data available`
                    : 'Try switching to other settings to view existing posts'}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="bottom-navigation">
          <CircleButton
            provider="Home"
            iconSrc={Home}
            onClick={() => {
              console.log('🏠 Home clicked - Showing MY posts only');
              setViewScope('my');
              handleTabChange('Home');
              fetchPosts(selectedCategory);
            }}
            isActive={activeTab === 'Home'}
            size="medium"
            ariaLabel="Home"
          />

          <CircleButton
            provider="PrayerHub"
            iconSrc={Search}
            onClick={() => {
              console.log('🙏 Prayer Hub clicked - Showing ALL posts');
              setViewScope('all');
              setActiveTab('PrayerHub');
              navigate('/prayer-hub');
            }}
            isActive={activeTab === 'PrayerHub'}
            size="medium"
            ariaLabel="Prayer Hub"
          />

          <CircleButton
            provider="Add"
            iconSrc={Add}
            onClick={() => {
              console.log('➕ Add clicked');
              handleCreatePost();
            }}
            isActive={activeTab === 'Add'}
            size="medium"
            ariaLabel="Create Post"
          />

          <CircleButton
            provider="Search"
            iconSrc={Profile}
            onClick={() => {
              console.log('👥 Navigate to Friends List');
              setActiveTab('Search');
              navigate('/addfriend');
            }}
            isActive={activeTab === 'Search'}
            size="medium"
            ariaLabel="Search Friends"
          />

          <CircleButton
            provider="Nova"
            iconSrc={Nova}
            onClick={() => {
              console.log('🤖 Nova AI clicked');
              setActiveTab('Nova');
              navigate('/nova');
            }}
            isActive={activeTab === 'Nova'}
            size="medium"
            ariaLabel="Nova AI Assistant"
          />
        </div>
      </div>
    </AppBackground>
  );
};

export default MainApp;

