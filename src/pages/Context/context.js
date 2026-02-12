import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import ActivityForm from './ActivityForm';
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

// ==================== 🖼️ IMAGE HELPER ====================
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

  console.log('🔗 Converted image URL:', {
    original: imagePath,
    full: fullUrl
  });

  return fullUrl;
};

// ==================== 🖼️ WITNESS IMAGE HELPER ====================
const getWitnessImageUrl = (imagePath) => {
  if (!imagePath) {
    console.warn('⚠️ getWitnessImageUrl: No image path provided');
    return null;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('✅ Witness image already full URL:', imagePath);
    return imagePath;
  }

  const baseUrl = 'https://pray-api.yalinelena.church';
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const fullUrl = `${baseUrl}${cleanPath}`;

  console.log('🔗 Converted witness image URL:', {
    original: imagePath,
    full: fullUrl
  });

  return fullUrl;
};

// ==================== 🌐 TRANSLATE ICON COMPONENT ====================
const TranslateIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
    <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor" />
  </svg>
);

// ==================== 🌍 LANGUAGE NAMES ====================
const getLanguageName = (code) => {
  const languages = {
    'en': 'English',
    'vi': 'Tiếng Việt',
    'zh-TW': '繁體中文',
    'zh-CN': '简体中文',
    'ja': '日本語',
    'ko': '한국어',
    'th': 'ภาษาไทย',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ar': 'العربية',
    'hi': 'हिन्दी'
  };
  return languages[code] || code;
};

// ==================== ✅ WITNESS WALL COMPONENT ====================
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
    per_page: 100, // ✅ THAY ĐỔI: 10 → 100
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
        [postId]: {
          ...prev[postId],
          translatedContent: null,
          detectedLanguage: null
        }
      }));
      return;
    }

    setTranslationStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isTranslating: true,
        translationError: null
      }
    }));

    try {
      console.log(`🌐 Translating original post ${postId} in Witness Wall...`);
      
      const result = await ApiService.translate(content, 'zh-TW');
      
      if (result.success) {
        setTranslationStates(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            translatedContent: result.translatedText,
            detectedLanguage: result.detectedSourceLanguage,
            isTranslating: false
          }
        }));

        console.log(`✅ Original post ${postId} translation completed:`, {
          from: result.detectedSourceLanguage,
          text: result.translatedText.substring(0, 50) + '...'
        });
      } else {
        throw new Error(result.message || 'Translation failed');
      }

    } catch (error) {
      console.error(`❌ Original post ${postId} translation error:`, error);
      setTranslationStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          translationError: '翻譯失敗，請稍後再試',
          isTranslating: false
        }
      }));
    }
  };

  const loadWitnesses = async (page = 1) => {
    setLoading(true);
    try {
      console.log(`✨ Loading Witness Wall - Page ${page}, Category: ${selectedCategory}, ViewScope: ${viewScope}`);

      // ✅ THAY ĐỔI: limit = 100
      const result = await ApiService.getWitnessList(page, 100);

      if (result.success) {
        console.log('📦 Raw witnesses data:', result.witnesses);
        console.log('🖼️ Witnesses with images:');
        result.witnesses.forEach((w, idx) => {
          console.log(`  Witness ${idx + 1}:`, {
            id: w.docid,
            content: w.content?.substring(0, 30) + '...',
            image_url: w.image_url || 'NO IMAGE_URL',
            images: w.images || 'NO IMAGES'
          });
        });

        const witnessesWithFullUrls = result.witnesses.map(witness => {
          let imageUrls = [];
          
          if (witness.image_url) {
            imageUrls.push(getWitnessImageUrl(witness.image_url));
          }
          
          if (witness.images && Array.isArray(witness.images)) {
            imageUrls = [...imageUrls, ...witness.images.map(img => getWitnessImageUrl(img))];
          }
          
          return {
            ...witness,
            images: imageUrls
          };
        });

        console.log('✅ Witnesses with full URLs:', witnessesWithFullUrls);

        const filteredWitnesses = witnessesWithFullUrls.filter(witness => {
          const originalPost = witness.original_post ||
            allPosts?.find(p => p.docid === witness.parent_docid);

          if (!originalPost) {
            console.log(`⚠️ Witness ${witness.docid} không tìm thấy original post`);
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

          if (!selectedCategory) {
            console.log(`✅ Witness ${witness.docid} - No category filter, showing all`);
            return true;
          }

          const postCategory = originalPost.category;
          const isMatch = postCategory === selectedCategory;

          console.log(`🔍 Witness ${witness.docid}: Original Post Category="${postCategory}", Selected="${selectedCategory}", Match=${isMatch}`);

          return isMatch;
        });

        console.log(`✅ Filtered ${filteredWitnesses.length}/${result.witnesses.length} witnesses for category: ${selectedCategory}${viewScope === 'my' ? ' (MY POSTS ONLY)' : ''}`);

        // ✅ THAY ĐỔI: perPage = 100
        const perPage = 100;
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
              isLiked: originalPost.amened || false,
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
              detectedLanguage: null,
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
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadWitnesses(nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (pagination.has_prev) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      loadWitnesses(prevPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleLikeOriginalPost = async (postId) => {
    const currentState = postStates[postId];
    if (!currentState || currentState.isLiking) return;

    const prevCount = currentState.likeCount;
    const prevLiked = currentState.isLiked;
    
    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isLiked: newLiked,
        likeCount: newCount,
        isLiking: true
      }
    }));

    try {
      const result = await ApiService.likePost(postId, currentUserId);

      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;
        const finalLiked = result.data?.amened !== undefined ? result.data.amened : newLiked;

        setPostStates(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            likeCount: finalCount,
            isLiked: finalLiked,
            isLiking: false
          }
        }));

        console.log(`✅ Amen ${newLiked ? 'added' : 'removed'} for original post ${postId}:`, finalCount);

        if (refreshBalance) {
          await refreshBalance();
        }
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Like error:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isLiked: prevLiked,
          likeCount: prevCount,
          isLiking: false
        }
      }));
    }
  };

  const handleLikeComment = async (commentId) => {
    const currentState = commentStates[commentId];
    if (!currentState || currentState.isLiking) return;

    const prevCount = currentState.likeCount;
    const prevLiked = currentState.isLiked;
    
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
      const result = await ApiService.likeComment(commentId, currentUserId);

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
      console.error('❌ Comment amen error:', error);
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

  const loadComments = async (postId) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        loadingComments: true
      }
    }));

    try {
      const allReplies = allPosts.filter(
        p => p.parent_docid === postId && p.event !== 'witness'
      );

      const formattedComments = allReplies.map(c => ({
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

      setCommentStates(prev => ({
        ...prev,
        ...newCommentStates
      }));

      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: formattedComments,
          loadingComments: false
        }
      }));
    } catch (error) {
      console.error('❌ Load comments error:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          loadingComments: false
        }
      }));
    }
  };

  const handleToggleCommentForm = (postId) => {
    const currentState = postStates[postId];
    const newShowState = !currentState?.showCommentForm;

    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        showCommentForm: newShowState
      }
    }));

    if (newShowState && currentState?.comments.length === 0) {
      loadComments(postId);
    }
  };

  const handleCommentTextChange = (postId, text) => {
    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        commentText: text
      }
    }));
  };

  const handleCommentSubmit = async (e, postId, postSn) => {
    e.preventDefault();
    const currentState = postStates[postId];

    if (!currentState?.commentText.trim() || currentState.isCommenting) return;

    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        isCommenting: true
      }
    }));

    try {
      console.log(`💬 新增評論到貼文 docid=${postId}:`, currentState.commentText.trim());

      const result = await ApiService.addComment({
        userid: currentUserId,
        content: currentState.commentText.trim(),
        docid: postId,
        sn: postSn
      });

      if (result.success) {
        console.log('✅ 評論新增成功:', result.comment);

        const newCommentId = result.comment?.docid || `temp-${Date.now()}`;

        const newComment = {
          id: newCommentId,
          author: currentUserId,
          content: currentState.commentText.trim(),
          time: '剛剛',
          likes: 0,
          isLiked: false,
          isReply: true,
          userid: currentUserId
        };

        setCommentStates(prev => ({
          ...prev,
          [newCommentId]: {
            likeCount: 0,
            isLiked: false,
            isLiking: false
          }
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

        console.log('✅ Comment đã được thêm vào UI');

        if (refreshBalance) {
          await refreshBalance();
        }

      } else {
        alert(`評論失敗: ${result.message}`);
        setPostStates(prev => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            isCommenting: false
          }
        }));
      }
    } catch (error) {
      console.error('💥 評論錯誤:', error);
      alert(`評論時發生錯誤: ${error.message}`);
      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isCommenting: false
        }
      }));
    }
  };

  if (loading) {
    return (
      <div className="witness-wall-loading">
        <div className="witness-wall-loading-spinner"></div>
        <p className="witness-wall-loading-text">載入見證中...</p>
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

          const postState = postStates[originalPost?.docid] || {
            likeCount: originalPost?.amen_count || 0,
            isLiked: originalPost?.amened || false,
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
            detectedLanguage: null,
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
                      <div className="post-time">{originalPost.datetime || '剛剛'}</div>
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
                      title={translationState.translatedContent ? '隱藏翻譯' : '翻譯此貼文'}
                    >
                      <TranslateIcon size={18} />
                    </button>

                    {translationState.translatedContent && (
                      <div className="post-translated-content">
                        <span className="translate-label">
                          🌐 翻譯 {translationState.detectedLanguage && `(從 ${getLanguageName(translationState.detectedLanguage)})`}:
                        </span>
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
                      className={`action-button action-amen ${postState.isLiked ? 'active-amen' : ''}`}
                      onClick={() => handleLikeOriginalPost(originalPost.docid)}
                      disabled={postState.isLiking}
                      title={postState.isLiked ? '取消 Amen' : 'Amen 此貼文'}
                    >
                      {postState.isLiking ? 'Processing...' : `AMEN (${postState.likeCount})`}
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
                            placeholder="寫下您的評論..."
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

                        <div className="form-actions">
                          <button
                            type="submit"
                            disabled={!postState.commentText.trim() || postState.isCommenting}
                            className="submit-btn comment-submit-btn"
                          >
                            {postState.isCommenting ? '發送中...' : '發送評論'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleCommentForm(originalPost.docid)}
                            className="cancel-btn"
                          >
                            取消
                          </button>
                        </div>
                      </form>

                      <div className="comments-section">
                        <div className="comments-header">
                          <h4>💬 評論 ({postState.comments.length})</h4>
                          {postState.loadingComments && <span className="loading-indicator">載入中...</span>}
                        </div>

                        <div className="comments-list">
                          {postState.comments.length > 0 ? (
                            postState.comments.map(comment => {
                              const commentState = commentStates[comment.id] || {
                                likeCount: comment.likes || 0,
                                isLiked: comment.isLiked || false,
                                isLiking: false
                              };

                              return (
                                <div key={comment.id} className="comment comment-reply">
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
                                    <p>{comment.content}</p>
                                  </div>

                                  <div className="comment-actions">
                                    <button
                                      className={`comment-like-btn ${commentState.isLiked ? 'active-amen' : ''}`}
                                      onClick={() => handleLikeComment(comment.id)}
                                      disabled={commentState.isLiking}
                                      title={commentState.isLiked ? '取消 Amen' : 'Amen 評論'}
                                    >
                                      {commentState.isLiking ? 'Processing...' : `AMEN (${commentState.likeCount})`}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="no-comments">
                              <p>尚無評論，成為第一個留言的人！</p>
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
                    <div className="witness-wall-time">{witness.datetime || '剛剛'}</div>
                  </div>
                </div>

                <div className="witness-wall-content">
                  {witness.title && <h4>{witness.title}</h4>}
                  <p>{witness.content}</p>
                  
                  {witness.images && witness.images.length > 0 && (
                    <div className="witness-images-container">
                      {witness.images.map((imageUrl, index) => (
                        <div key={index} className="witness-image-wrapper">
                          <img 
                            src={imageUrl} 
                            alt={`Witness image ${index + 1}`}
                            className="witness-image"
                            onError={(e) => {
                              console.error('❌ Witness image load failed:', imageUrl);
                              e.target.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('✅ Witness image loaded:', imageUrl);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
            ← 上一頁
          </button>

          <span className="pagination-info">
            第 {pagination.current_page} / {pagination.total_pages} 頁 (共 {pagination.total_items} 筆見證)
          </span>

          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={!pagination.has_next || loading}
          >
            下一頁 →
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

// ==================== COMMENT COMPONENT ====================
const Comment = ({ comment, onReply, onLike, currentUserId, postDocid, commentState }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translationError, setTranslationError] = useState(null);

  useEffect(() => {
    setIsTranslating(false);
    setTranslatedContent(null);
    setDetectedLanguage(null);
    setTranslationError(null);
  }, [comment.id]);

  const handleTranslate = async () => {
    if (isTranslating) return;

    if (translatedContent) {
      setTranslatedContent(null);
      setDetectedLanguage(null);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      console.log(`🌐 Translating comment ${comment.id} content...`);
      
      const result = await ApiService.translate(comment.content, 'zh-TW');
      
      if (result.success) {
        setTranslatedContent(result.translatedText);
        setDetectedLanguage(result.detectedSourceLanguage);
        console.log(`✅ Comment ${comment.id} translation completed:`, {
          from: result.detectedSourceLanguage,
          text: result.translatedText.substring(0, 50) + '...'
        });
      } else {
        throw new Error(result.message || 'Translation failed');
      }

    } catch (error) {
      console.error(`❌ Comment ${comment.id} translation error:`, error);
      setTranslationError('翻譯失敗，請稍後再試');
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

        {/* ✅ GIỮ LẠI NÚT DỊCH */}
        <button
          className={`comment-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
          title={translatedContent ? '隱藏翻譯' : '翻譯此評論'}
        >
          <TranslateIcon size={14} />
        </button>

        {translatedContent && (
          <div className="comment-translated-content">
            <span className="translate-label">
              🌐 翻譯 {detectedLanguage && `(從 ${getLanguageName(detectedLanguage)})`}:
            </span>
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
                onReply={onReply}
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
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [commentStates, setCommentStates] = useState({});

  const isLikingRef = useRef(false);

  const [likeCount, setLikeCount] = useState(post.amen_count || post.likes || 0);
  const [isLiked, setIsLiked] = useState(post.amened || post.isLiked || false);
  const [isLiking, setIsLiking] = useState(false);

  const [witnessText, setWitnessText] = useState('');
  const [isSubmittingWitness, setIsSubmittingWitness] = useState(false);
  const [witnessCount, setWitnessCount] = useState(0);

  const [hasWitnessed, setHasWitnessed] = useState(false);

  const [witnessImageFile, setWitnessImageFile] = useState(null);
  const [witnessImagePreview, setWitnessImagePreview] = useState(null);

  const [activeForm, setActiveForm] = useState(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [translationError, setTranslationError] = useState(null);

  useEffect(() => {
    setLikeCount(post.amen_count || post.likes || 0);
    setIsLiked(post.amened || post.isLiked || false);
  }, [post.amen_count, post.likes, post.amened, post.isLiked]);

  useEffect(() => {
    const userWitness = allPosts.find(
      p => p.parent_docid === post.id && 
           p.event === 'witness' && 
           (p.userid === currentUserId || p.author === currentUserId)
    );
    setHasWitnessed(!!userWitness);
    
    console.log(`🔍 Post ${post.id} - User ${currentUserId} witnessed:`, !!userWitness);
  }, [allPosts, post.id, currentUserId]);

  useEffect(() => {
    setIsTranslating(false);
    setTranslatedContent(null);
    setDetectedLanguage(null);
    setTranslationError(null);
  }, [post.id]);

  const handleTranslate = async () => {
    if (isTranslating) return;

    if (translatedContent) {
      setTranslatedContent(null);
      setDetectedLanguage(null);
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      console.log(`🌐 Translating post ${post.id} content...`);
      
      const result = await ApiService.translate(post.content, 'zh-TW');
      
      if (result.success) {
        setTranslatedContent(result.translatedText);
        setDetectedLanguage(result.detectedSourceLanguage);
        console.log(`✅ Post ${post.id} translation completed:`, {
          from: result.detectedSourceLanguage,
          text: result.translatedText.substring(0, 50) + '...'
        });
      } else {
        throw new Error(result.message || 'Translation failed');
      }

    } catch (error) {
      console.error(`❌ Post ${post.id} translation error:`, error);
      setTranslationError('翻譯失敗，請稍後再試');
    } finally {
      setIsTranslating(false);
    }
  };

  useEffect(() => {
    const postWitnesses = allPosts.filter(
      p => p.parent_docid === post.id && p.event === 'witness'
    );
    setWitnessCount(postWitnesses.length);
  }, [allPosts, post.id]);

  const [transcriptData, setTranscriptData] = useState(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);
  const [showTranscriptPanel, setShowTranscriptPanel] = useState(false);

  const handleWitnessImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('⚠️ Vui lòng chỉ chọn file ảnh!');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('⚠️ Kích thước ảnh không được vượt quá 5MB!');
        return;
      }
      
      setWitnessImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setWitnessImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      console.log('📸 Witness image selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleWitnessSubmit = async (e) => {
    e.preventDefault();
    if (!witnessText.trim() || isSubmittingWitness) return;

    setIsSubmittingWitness(true);
    try {
      console.log(`✨ 新增見證到貼文 docid=${post.id}:`, witnessText.trim());
      console.log(`📸 Has image: ${!!witnessImageFile}`);

      const result = await ApiService.createWitness(
        currentUserId,
        witnessText.trim(),
        post.id,
        witnessImageFile
      );

      if (result.success) {
        console.log('✅ 見證新增成功:', result.witness);

        setWitnessText('');
        setWitnessImageFile(null);
        setWitnessImagePreview(null);
        setActiveForm(null);
        
        setHasWitnessed(true);
        setWitnessCount(prev => prev + 1);

        if (refreshBalance) {
          await refreshBalance();
        }

        if (onWitnessCreated && typeof onWitnessCreated === 'function') {
          console.log('🔄 Chuyển sang Tribe Prayer - Witness Wall...');
          onWitnessCreated(post.id);
        }

      } else {
        alert(`見證新增失敗: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ 見證錯誤:', error);
      alert(`見證時發生錯誤: ${error.message}`);
    } finally {
      setIsSubmittingWitness(false);
    }
  };

  const handleToggleWitnessForm = () => {
    if (hasWitnessed && activeForm !== 'witness') {
      alert('⚠️ 您已經為此貼文建立過見證了！\n每個貼文只能建立一次見證。');
      return;
    }

    if (activeForm === 'witness') {
      setActiveForm(null);
      setWitnessText('');
      setWitnessImageFile(null);
      setWitnessImagePreview(null);
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
    if (activeForm === 'comment') {
      setActiveForm(null);
      setCommentText('');
      setComments([]);
      setCommentPage(1);
      setHasMoreComments(false);
    } else {
      setActiveForm('comment');
      setWitnessText('');
      setWitnessImageFile(null);
      setWitnessImagePreview(null);
      if (comments.length === 0) {
        loadComments(1, false);
        setCommentPage(1);
      }
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

  const TranscriptPanel = ()=> (
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
    const prevLiked = currentState.isLiked;
    
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
      const result = await ApiService.likeComment(commentId, currentUserId);

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
      console.error('❌ Comment amen error:', error);
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
        {post.title && <h3>{post.title}</h3>}
        <p>{post.content}</p>

        <button
          className={`post-translate-button ${isTranslating ? 'translating' : ''} ${translatedContent ? 'active' : ''}`}
          onClick={handleTranslate}
          disabled={isTranslating}
          title={translatedContent ? '隱藏翻譯' : '翻譯此貼文'}
        >
          <TranslateIcon size={18} />
        </button>

        {translatedContent && (
          <div className="post-translated-content">
            <span className="translate-label">
              🌐 翻譯 {detectedLanguage && `(從 ${getLanguageName(detectedLanguage)})`}:
            </span>
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
          className={`action-button action-comment ${activeForm === 'comment' ? 'active-comment' : ''}`}
          onClick={handleToggleCommentForm}
        >
          PRAY FOR ME ({post.calculatedComments || 0})
        </button>

        <button
          className={`action-button action-witness ${activeForm === 'witness' ? 'active-witness' : ''} ${hasWitnessed ? 'witnessed-done' : ''}`}
          onClick={handleToggleWitnessForm}
          disabled={hasWitnessed}
          title={hasWitnessed ? '您已經為此貼文建立過見證' : '分享見證'}
        >
          {hasWitnessed ? `✓ WITNESSED (${witnessCount})` : `WITNESS (${witnessCount})`}
        </button>
      </div>

      {activeForm === 'witness' && (
        <div className="form-container witness-form-wrapper">
          <form className="witness-form" onSubmit={handleWitnessSubmit}>
            <textarea
              value={witnessText}
              onChange={(e) => setWitnessText(e.target.value)}
              placeholder="分享您的見證..."
              rows="4"
              maxLength="1000"
            />
            
            <div className="witness-image-upload">
              <label htmlFor={`witness-image-${post.id}`} className="image-upload-label">
                📷 Thêm ảnh
              </label>
              <input
                id={`witness-image-${post.id}`}
                type="file"
                accept="image/*"
                onChange={handleWitnessImageChange}
                style={{ display: 'none' }}
              />
              
              {witnessImagePreview && (
                <div className="image-preview-container">
                  <img 
                    src={witnessImagePreview} 
                    alt="Preview" 
                    className="image-preview"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => {
                      setWitnessImageFile(null);
                      setWitnessImagePreview(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-info">
              {witnessImageFile && (
                <span className="file-info">
                  📎 {witnessImageFile.name} ({(witnessImageFile.size / 1024).toFixed(2)} KB)
                </span>
              )}
            </div>
            
            <div className="form-actions">
              <button
                type="submit"
                disabled={!witnessText.trim() || isSubmittingWitness}
                className="submit-btn witness-submit-btn"
              >
                {isSubmittingWitness ? '提交中...' : '✨ 提交見證'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveForm(null);
                  setWitnessText('');
                  setWitnessImageFile(null);
                  setWitnessImagePreview(null);
                }}
                className="cancel-btn"
              >
                取消
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
                  setActiveForm(null);
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
                    onReply={(commentId, reply) => console.log(`💬 回覆評論 ${commentId}:`, reply)}
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
  const [notificationCount] = useState(0);

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

  // ✅ THÊM: State cho pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
        console.warn('⚠️ Không tìm thấy user ID');
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
      console.log('💾 Tribe đã được lưu vào localStorage:', storedUser);
    } catch (error) {
      console.error('❌ Lỗi khi lưu tribe vào localStorage:', error);
    }

    setShowTribeDetail(false);

    setTimeout(() => {
      alert('支派選擇成功！您的支派已更新。');
    }, 100);
  };

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

  const handleNotificationClick = () => { };

  const handleCoinClick = () => {
    console.log('💰 Coin clicked from context - navigating to YB History');
    navigate('/yb-history');
  };

  const handleLogoClick = () => {
    handleTabChange('Home');
  };

  const handleFamilyClick = () => {
    console.log('👨‍👩‍👧‍👦 Navigate to Friends List');
    navigate('/friends');
  };

  const handleBlessingClick = () => {
    console.log('🍀 Blessings & Luck clicked - Logout');
    handleLogout();
  };

  const handleShowActivityForm = () => {
    if (!hasTribe) {
      alert('⚠️ 您尚未選擇支派！\n請先選擇您的支派才能建立活動。');
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
      console.log('⚠️ User chưa có tribe, không fetch activities');
      setActivities([]);
      setLoading(false);
      return;
    }

    console.log('📡 Fetching activities from API...');
    setLoading(true);

    try {
      const params = {
        page: 1,
        limit: 50,
        tribe: currentTribeId,
        is_published: true
      };

      const result = await ApiService.getActivities(params);

      if (result.success) {
        console.log('✅ Activities loaded:', result.activities);

        console.log('📸 Activities with images:');
        result.activities.forEach((activity, index) => {
          console.log(`Activity ${index + 1}:`, {
            id: activity.id,
            title: activity.title,
            cover_image: activity.cover_image,
            cover_image_full: getActivityImageUrl(activity.cover_image),
            images: activity.images,
            images_full: activity.images?.map(img => getActivityImageUrl(img)) || []
          });
        });

        const transformedActivities = result.activities.map(activity => ({
          id: activity.id,
          author: activity.created_by || activity.userid || 'Unknown',
          datetime: activity.created_at || activity.datetime || '剛剛',
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

  const handleWitnessCreated = async (postId) => {
    console.log(`✨ Witness created for post ${postId}`);

    try {
      const witnessedPost = posts.find(p => p.id === postId) ||
        allPosts.find(p => p.docid === postId);

      if (!witnessedPost) {
        console.error('❌ Không tìm thấy post được witness');
        return;
      }

      const postCategory = witnessedPost.category || selectedCategory;

      console.log(`📂 Post category: ${postCategory}, keeping same category...`);

      if (postCategory !== selectedCategory) {
        setSelectedCategory(postCategory);
      }

      console.log('👁️ Setting view mode to witness...');
      setViewMode('witness');

      console.log('🗑️ Clearing cache...');
      ApiService.clearCache();

      console.log(`🔄 Fetching posts for ${postCategory}...`);
      await fetchPosts(postCategory, 1, false);

      await refreshBalance();

      setTimeout(() => {
        console.log('⬆️ Scrolling to top...');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);

      console.log(`✅ Đã chuyển sang ${postCategory} - Witness Wall`);
    } catch (error) {
      console.error('❌ Lỗi khi chuyển trang:', error);
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
      setCurrentPage(1);
      setHasMorePosts(false);
      await fetchPosts(selectedCategory, 1, false);
    } catch (error) {
      console.error('💥 重新載入貼文錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    console.log(`📂 切換分類至: ${category}`);

    if (category === 'Tribe Prayer' && !hasTribe) {
      alert('⚠️ 您尚未選擇支派！\n請先選擇您的支派才能使用 Tribe Prayer 功能。');
      return;
    }

    if (selectedCategory === category) {
      return;
    }

    setSelectedCategory(category);
    setCurrentPage(1);
    setHasMorePosts(false);
    fetchPosts(category, 1, false);
  };

  const getDemoPosts = useCallback(() => [], [user?.name]);

  // ✅ SỬA: fetchPosts với pagination support
  const fetchPosts = useCallback(async (categoryOverride, pageNumber = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      console.log(`📡 從API取得貼文 - Page ${pageNumber}...`);

      const categoryToFetch = categoryOverride !== undefined ? categoryOverride : selectedCategory;
      const currentUserId = user?.id || user?.userId || ApiService.getCurrentUserId();

      const filters = {
        viewer_userid: currentUserId
      };

      if (categoryToFetch) {
        filters.category = categoryToFetch;
      }

      if (viewScope === 'my') {
        filters.userid = currentUserId;
        console.log('🏠 Home mode: Filtering posts by current user only');
      } else {
        console.log('🌍 Prayer Hub mode: Showing all posts');
      }

      // ✅ THAY ĐỔI: Gọi API với page number và limit 100
      let result = await ApiService.getPosts(pageNumber, 100, true, filters);

      if (result && result.success && result.posts && result.posts.length > 0) {
        console.log(`✅ 貼文取得成功 - Page ${pageNumber}:`, result.posts.length, 'posts');

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
          privacy: post.privacy ? post.privacy.toLowerCase() : mapCategoryToPrivacy(post.category),
          category: post.category || categoryToFetch,
          author: post.author || post.userid || user?.name || '匿名用戶',
          time: post.datetime || '剛剛',
          image: post.image || null,
          audioRecordId: post.uuid || null,
          comments: 0,
          amen_count: post.amen_count,
          amened: post.amened,
          avatar_url: post.avatar_url
        }));

        // ✅ THAY ĐỔI: Append hoặc replace posts
        if (append) {
          setPosts(prevPosts => [...prevPosts, ...transformedPosts]);
          setAllPosts(prevPosts => [...prevPosts, ...result.posts]);
        } else {
          setPosts(transformedPosts);
          setAllPosts(result.posts);
        }

        // ✅ THAY ĐỔI: Kiểm tra có thêm posts không
        const pagination = result.pagination || {};
        setHasMorePosts(pagination.has_next || result.posts.length === 100);
        
      } else {
        console.log('⚠️ API 回應為空或失敗');
        if (!append) {
          setPosts([]);
          setAllPosts([]);
        }
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('💥 取得貼文時發生錯誤:', error);
      if (!append) {
        setPosts([]);
      }
      setHasMorePosts(false);
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [getDemoPosts, user, selectedCategory, mapCategoryToPrivacy, viewScope]);
  

  // ✅ THÊM: Hàm load more posts
  const handleLoadMorePosts = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchPosts(selectedCategory, nextPage, true);
  };

  const handleNextPage = () => {
    if (hasMorePosts) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchPosts(selectedCategory, nextPage, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchPosts(selectedCategory, prevPage, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    console.log('🏠 MainApp 載入，使用者:', user);
    setCurrentPage(1);
    setHasMorePosts(false);
    fetchPosts(initialCategory, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseTribeDetail = () => {
    setShowTribeDetail(false);
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
          <NotificationBell
            count={notificationCount}
            onClick={handleNotificationClick}
            size="medium"
          />
          <CoinDisplay
            amount={loadingBalance ? '...' : coinAmount}
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
            style={{ opacity: hasTribe ? 1 : 0.5 }}
          >
            <RectButton
              image={tribe}
              imageAlt="Tribes Prayer"
              size="medium"
              active={selectedCategory === 'Tribe Prayer'}
            />
            <CategoryLabel
              text={hasTribe ? "Tribe Prayer" : "Tribe Prayer 🔒"}
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
              active={viewMode === 'original'}
            >
              {loading ? '載入中...' : 'Original Post'}
            </RectButton>

            <RectButton
              icon=""
              onClick={() => {
                setViewMode('witness');
                console.log('Show Witness Wall');
              }}
              size="small"
              variant="secondary"
              active={viewMode === 'witness'}
            >
              Witness Wall
            </RectButton>

            {hasTribe && selectedCategory === 'Tribe Prayer' && (
              <RectButton
                icon=""
                onClick={() => {
                  setViewMode('activity');
                  fetchActivities();
                }}
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
                <p>載入中...</p>
              </div>
            )}

            {!loading && viewMode === 'activity' ? (
              !hasTribe ? (
                <div className="no-tribe-message">
                  <div className="no-tribe-icon">🏛️</div>
                  <h3>尚未選擇支派</h3>
                  <p>請先選擇您的支派才能查看和建立活動</p>
                  <button
                    className="select-tribe-btn"
                    onClick={handleTribeLogoClick}
                  >
                    選擇支派
                  </button>
                </div>
              ) : showActivityForm ? (
                <ActivityForm
                  user={user}
                  onBack={handleCloseActivityForm}
                />
              ) : (
                <div className="activity-view">
                  <button
                    className="add-activity-button"
                    onClick={handleShowActivityForm}
                  >
                    +
                  </button>

                  <div className="activities-list">
                    {activities.length > 0 ? (
                      activities.map(activity => (
                        <div key={activity.id} className="activity-card">
                          <div className="activity-header">
                            <div className="activity-avatar">
                              <AvatarImage 
                                userId={activity.author}
                                userName={activity.author}
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
                                onError={(e) => {
                                  console.error('❌ Cover image failed to load:', activity.coverImage);
                                  e.target.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('✅ Cover image loaded:', activity.coverImage);
                                }}
                              />
                            </div>
                          )}

                          <div className="activity-content">
                            <h3>{activity.eventName}</h3>
                            <p className="activity-date">📅 {activity.eventDate}</p>
                            <p className="activity-location">📍 {activity.eventLocation}</p>
                            {activity.activityTime && (
                              <p className="activity-time">⏰ {activity.activityTime}</p>
                            )}
                            {activity.description && (
                              <p className="activity-description">{activity.description}</p>
                            )}
                            {activity.maxParticipants && (
                              <p className="activity-participants">👥 最多 {activity.maxParticipants} 人</p>
                            )}
                          </div>

                          {activity.images && activity.images.length > 0 && (
                            <div className="activity-images-gallery">
                              {activity.images.map((imgUrl, idx) => (
                                <img
                                  key={idx}
                                  src={getActivityImageUrl(imgUrl)}
                                  alt={`Activity ${idx + 1}`}
                                  onClick={() => {
                                    const fullUrl = getActivityImageUrl(imgUrl);
                                    window.open(fullUrl, '_blank');
                                  }}
                                  onError={(e) => {
                                    console.error(`❌ Image ${idx + 1} failed to load:`, imgUrl);
                                    e.target.style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    console.log(`✅ Image ${idx + 1} loaded:`, imgUrl);
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-activities">
                        <div className="no-activities-icon">📅</div>
                        <h3>尚無活動</h3>
                        <p>目前沒有活動，成為第一個建立活動的人！</p>
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
                
                {/* ✅ THÊM: Nút Load More */}
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '20px 0' }}>
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1 || loading}
                    className="pagination-btn"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: currentPage === 1 ? '#ccc' : '#4CAF50',
                      color: 'white',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ← 上一頁
                  </button>

                  <span style={{ color: 'white', alignSelf: 'center' }}>第 {currentPage} 頁</span>

                  <button
                    onClick={handleNextPage}
                    disabled={!hasMorePosts || loading}
                    className="pagination-btn"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: 'none',
                      backgroundColor: !hasMorePosts ? '#ccc' : '#4CAF50',
                      color: 'white',
                      cursor: !hasMorePosts ? 'not-allowed' : 'pointer'
                    }}
                  >
                    下一頁 →
                  </button>
                </div>
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

        <div className="bottom-navigation">
          <CircleButton
            provider="Home"
            iconSrc={Home}
            onClick={() => {
              console.log('🏠 Home clicked - Showing MY posts only');
              setViewScope('my');
              handleTabChange('Home');
              setCurrentPage(1);
              setHasMorePosts(false);
              fetchPosts(selectedCategory, 1, false);
            }}
            isActive={activeTab === 'Home'}
            size="medium"
            ariaLabel="首頁"
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
            ariaLabel="新增貼文"
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
            ariaLabel="搜尋好友"
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