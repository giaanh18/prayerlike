// // ./src/pages/PrayerHub/PrayerHub.js
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import ApiService from '../../services/api';
// import AppBackground from '../../components/AppBackground/AppBackground';
// import UserHeader from '../../components/UserHeader/UserHeader';
// import NotificationBell from '../../components/NotificationBell/NotificationBell';
// import CoinDisplay from '../../components/CoinDisplay/CoinDisplay';
// import RectButton from '../../components/RectButton/RectButton';
// import CircleButton from '../../components/CircleButton/CircleButton';
// import CategoryLabel from '../../components/CategoryLabel/CategoryLabel';
// import TribeDetail from '../Context/steps/TribeDetail';
// import NoTribeDetail from '../Context/steps/NoTribeDetail';

// // Import icons
// import choices from '../../assets/icons/Choices.png';
// import category from '../../assets/icons/Category.png';
// import witness from '../../assets/icons/witness.png';

// import Home from '../../assets/icons/Homeicon.png';
// import Search from '../../assets/icons/Searchicon.png';
// import Add from '../../assets/icons/Addicon.png';
// import Profile from '../../assets/icons/Profileicon.png';
// import Nova from '../../assets/icons/Nova.png';

// import Mdi from '../../assets/icons/mdi_family.png';
// import Fluent from '../../assets/icons/fluent_people-interwoven-20-filled.png';

// // Import tribe icons
// import judahIcon from '../../assets/images/tribes/judah.png';
// import reubenIcon from '../../assets/images/tribes/reuben.png';
// import gadIcon from '../../assets/images/tribes/gad.png';
// import asherIcon from '../../assets/images/tribes/asher.png';
// import naphtaliIcon from '../../assets/images/tribes/naphtali.png';
// import manassehIcon from '../../assets/images/tribes/manasseh.png';
// import simeonIcon from '../../assets/images/tribes/simeon.png';
// import leviIcon from '../../assets/images/tribes/levi.png';
// import issacharIcon from '../../assets/images/tribes/issachar.png';
// import zebulunIcon from '../../assets/images/tribes/zebulun.png';
// import josephIcon from '../../assets/images/tribes/joseph.png';
// import benjaminIcon from '../../assets/images/tribes/benjamin.png';

// import './PrayerHub.css';

// // ==================== Tribe ID Map ====================
// const tribeIdMap = {
//   1: { name: 'Judah', icon: judahIcon },
//   2: { name: 'Reuben', icon: reubenIcon },
//   3: { name: 'Gad', icon: gadIcon },
//   4: { name: 'Asher', icon: asherIcon },
//   5: { name: 'Naphtali', icon: naphtaliIcon },
//   6: { name: 'Manasseh', icon: manassehIcon },
//   7: { name: 'Simeon', icon: simeonIcon },
//   8: { name: 'Levi', icon: leviIcon },
//   9: { name: 'Issachar', icon: issacharIcon },
//   10: { name: 'Zebulun', icon: zebulunIcon },
//   11: { name: 'Joseph', icon: josephIcon },
//   12: { name: 'Benjamin', icon: benjaminIcon },
// };

// // ==================== ✅ WITNESS WALL COMPONENT ====================
// const WitnessWall = ({ currentUserId, allPosts }) => {
//   const [witnesses, setWitnesses] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [pagination, setPagination] = useState({
//     current_page: 1,
//     total_pages: 1,
//     total_items: 0,
//     per_page: 10,
//     has_next: false,
//     has_prev: false
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [postStates, setPostStates] = useState({});

//   const loadWitnesses = async (page = 1) => {
//     setLoading(true);
//     try {
//       console.log(`✨ Loading Witness Wall - Page ${page}`);

//       const result = await ApiService.getWitnessList(page, 20);

//       if (result.success) {
//         console.log(`✅ Loaded ${result.witnesses.length} witnesses`);
//         setWitnesses(result.witnesses);
//         setPagination(result.pagination || {});

//         const initialStates = {};
//         result.witnesses.forEach(witness => {
//           const originalPost = witness.original_post ||
//             allPosts?.find(p => p.docid === witness.parent_docid);

//           if (originalPost) {
//             initialStates[originalPost.docid] = {
//               likeCount: originalPost.amen_count || 0,
//               hasLiked: false,
//               isLiking: false,
//               commentCount: originalPost.comment_count || 0,
//               showCommentForm: false,
//               commentText: '',
//               isCommenting: false,
//               comments: [],
//               loadingComments: false
//             };
//           }
//         });
//         setPostStates(initialStates);
//       } else {
//         console.error('❌ Failed to load witnesses:', result.message);
//         setWitnesses([]);
//       }
//     } catch (error) {
//       console.error('❌ Error loading witnesses:', error);
//       setWitnesses([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadWitnesses(currentPage);
//   }, [currentPage]);

//   const handleNextPage = () => {
//     if (pagination.has_next) {
//       setCurrentPage(prev => prev + 1);
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const handlePrevPage = () => {
//     if (pagination.has_prev) {
//       setCurrentPage(prev => Math.max(1, prev - 1));
//       window.scrollTo({ top: 0, behavior: 'smooth' });
//     }
//   };

//   const handleLikeOriginalPost = async (postId) => {
//     const currentState = postStates[postId];
//     if (!currentState || currentState.isLiking) return;

//     const prevCount = currentState.likeCount;
//     const newCount = prevCount + 1;

//     setPostStates(prev => ({
//       ...prev,
//       [postId]: {
//         ...prev[postId],
//         hasLiked: true,
//         likeCount: newCount,
//         isLiking: true
//       }
//     }));

//     try {
//       const result = await ApiService.likePost(postId, currentUserId);

//       if (result.success) {
//         const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;

//         setTimeout(() => {
//           setPostStates(prev => ({
//             ...prev,
//             [postId]: {
//               ...prev[postId],
//               likeCount: finalCount,
//               hasLiked: false,
//               isLiking: false
//             }
//           }));
//         }, 300);
//       } else {
//         throw new Error(result.message || 'API Error');
//       }
//     } catch (error) {
//       console.error('❌ Like error:', error);
//       setPostStates(prev => ({
//         ...prev,
//         [postId]: {
//           ...prev[postId],
//           hasLiked: false,
//           likeCount: prevCount,
//           isLiking: false
//         }
//       }));
//     }
//   };

//   const loadComments = async (postId) => {
//     setPostStates(prev => ({
//       ...prev,
//       [postId]: {
//         ...prev[postId],
//         loadingComments: true
//       }
//     }));

//     try {
//       const allReplies = allPosts.filter(
//         p => p.parent_docid === postId && p.event !== 'witness'
//       );

//       const formattedComments = allReplies.map(c => ({
//         id: c.docid,
//         author: c.userid,
//         content: c.content,
//         time: c.datetime || '剛剛',
//         likes: c.amen_count || 0,
//         isReply: true,
//         userid: c.userid
//       }));

//       setPostStates(prev => ({
//         ...prev,
//         [postId]: {
//           ...prev[postId],
//           comments: formattedComments,
//           loadingComments: false
//         }
//       }));
//     } catch (error) {
//       console.error('❌ Load comments error:', error);
//       setPostStates(prev => ({
//         ...prev,
//         [postId]: {
//           ...prev[postId],
//           loadingComments: false
//         }
//       }));
//     }
//   };

//   const handleToggleCommentForm = (postId) => {
//     const currentState = postStates[postId];
//     const newShowState = !currentState?.showCommentForm;

//     setPostStates(prev => ({
//       ...prev,
//       [postId]: {
//         ...prev[postId],
//         showCommentForm: newShowState
//       }
//     }));

//     if (newShowState && currentState?.comments.length === 0) {
//       loadComments(postId);
//     }
//   };

//   const handleCommentTextChange = (postId, text) => {
//     setPostStates(prev => ({
//       ...prev,
//       [postId]: {
//         ...prev[postId],
//         commentText: text
//       }
//     }));
//   };

//   const handleCommentSubmit = async (e, postId, postSn) => {
//     e.preventDefault();
//     const currentState = postStates[postId];

//     if (!currentState?.commentText.trim() || currentState.isCommenting) return;

//     setPostStates(prev => ({
//       ...prev,
//       [postId]: {
//         ...prev[postId],
//         isCommenting: true
//       }
//     }));

//     try {
//       const result = await ApiService.addComment({
//         userid: currentUserId,
//         content: currentState.commentText.trim(),
//         docid: postId,
//         sn: postSn
//       });

//       if (result.success) {
//         const newComment = {
//           id: result.comment?.docid || `temp-${Date.now()}`,
//           author: currentUserId,
//           content: currentState.commentText.trim(),
//           time: '剛剛',
//           likes: 0,
//           isReply: true,
//           userid: currentUserId
//         };

//         setPostStates(prev => ({
//           ...prev,
//           [postId]: {
//             ...prev[postId],
//             commentText: '',
//             isCommenting: false,
//             commentCount: prev[postId].commentCount + 1,
//             comments: [newComment, ...prev[postId].comments]
//           }
//         }));
//       } else {
//         alert(`評論失敗: ${result.message}`);
//         setPostStates(prev => ({
//           ...prev,
//           [postId]: {
//             ...prev[postId],
//             isCommenting: false
//           }
//         }));
//       }
//     } catch (error) {
//       console.error('💥 評論錯誤:', error);
//       alert(`評論時發生錯誤: ${error.message}`);
//       setPostStates(prev => ({
//         ...prev,
//         [postId]: {
//           ...prev[postId],
//           isCommenting: false
//         }
//       }));
//     }
//   };

//   if (loading) {
//     return (
//       <div className="witness-wall-loading">
//         <div className="witness-wall-loading-spinner"></div>
//         <p className="witness-wall-loading-text">載入見證中...</p>
//       </div>
//     );
//   }

//   if (!witnesses || witnesses.length === 0) {
//     return (
//       <div className="witness-wall-empty">
//         <div className="witness-wall-empty-icon">✨</div>
//         <h3>尚無見證</h3>
//         <p>成為第一個分享見證的人！</p>
//       </div>
//     );
//   }

//   return (
//     <div className="witness-wall">
//       <div className="witness-wall-grid">
//         {witnesses.map(witness => {
//           const originalPost = witness.original_post ||
//             allPosts?.find(p => p.docid === witness.parent_docid);

//           const postState = postStates[originalPost?.docid] || {
//             likeCount: originalPost?.amen_count || 0,
//             hasLiked: false,
//             isLiking: false,
//             commentCount: originalPost?.comment_count || 0,
//             showCommentForm: false,
//             commentText: '',
//             isCommenting: false,
//             comments: [],
//             loadingComments: false
//           };

//           return (
//             <div key={witness.docid} className="witness-wall-post-card">
//               {originalPost && (
//                 <div className="witness-original-post-section">
//                   <div className="post-header">
//                     <div className="post-avatar">
//                       <img
//                         src={`https://ui-avatars.com/api/?name=${encodeURIComponent(originalPost.userid || originalPost.author)}&background=random&size=48`}
//                         alt="Original post avatar"
//                       />
//                     </div>
//                     <div className="post-info">
//                       <div className="post-author">{originalPost.userid || originalPost.author}</div>
//                       <div className="post-time">{originalPost.datetime || '剛剛'}</div>
//                     </div>

//                     {/* ✅ 2 BADGES */}
//                     <div className="post-badges-container">
//                       <div className="post-privacy-badge">
//                         <span>
//                           {(!originalPost.privacy || originalPost.privacy === 'public') && 'PUBLIC'}
//                           {originalPost.privacy === 'family' && 'FAMILY'}
//                           {originalPost.privacy === 'tribe' && 'TRIBE'}
//                           {(originalPost.privacy === 'individual' || originalPost.privacy === 'private') && 'INDIVIDUAL'}
//                         </span>
//                       </div>
//                       <div className="post-category-badge">
//                         <span>
//                           {(originalPost.category === 'Personal & Family' || originalPost.category === 'personal') && 'Personal & Family'}
//                           {(originalPost.category === 'Church & Ministry' || originalPost.category === 'church') && 'Church & Ministry'}
//                           {(originalPost.category === 'Kingdom Prayer' || originalPost.category === 'kingdom') && 'Kingdom Prayer'}
//                           {(originalPost.category === 'Tribe Prayer' || originalPost.category === 'tribe') && 'Tribe Prayer'}
//                           {!originalPost.category && 'Personal & Family'}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="post-content">
//                     {originalPost.title && <h3>{originalPost.title}</h3>}
//                     <p>{originalPost.content}</p>
//                   </div>

//                   <div className="post-actions">
//                     <button
//                       className={`action-button action-amen ${postState.hasLiked ? 'active-amen' : ''}`}
//                       onClick={() => handleLikeOriginalPost(originalPost.docid)}
//                       disabled={postState.isLiking}
//                     >
//                       {postState.isLiking ? 'Processing...' :
//                         (postState.hasLiked ? `AMENED (${postState.likeCount})` : `AMEN (${postState.likeCount})`)}
//                     </button>

//                     <button
//                       className={`action-button action-comment ${postState.showCommentForm ? 'active-comment' : ''}`}
//                       onClick={() => handleToggleCommentForm(originalPost.docid)}
//                     >
//                       PRAY FOR ME ({postState.commentCount})
//                     </button>
//                   </div>

//                   {postState.showCommentForm && (
//                     <div className="form-container comment-form-wrapper">
//                       <form
//                         className="comment-form"
//                         onSubmit={(e) => handleCommentSubmit(e, originalPost.docid, originalPost.sn)}
//                       >
//                         <textarea
//                           value={postState.commentText}
//                           onChange={(e) => handleCommentTextChange(originalPost.docid, e.target.value)}
//                           placeholder="寫下您的評論..."
//                           rows="3"
//                           maxLength="500"
//                         />
//                         <div className="form-info">
//                           <span className="char-count">{postState.commentText.length}/500</span>
//                         </div>
//                         <div className="form-actions">
//                           <button
//                             type="submit"
//                             disabled={!postState.commentText.trim() || postState.isCommenting}
//                             className="submit-btn comment-submit-btn"
//                           >
//                             {postState.isCommenting ? '發送中...' : '發送評論'}
//                           </button>
//                           <button
//                             type="button"
//                             onClick={() => handleToggleCommentForm(originalPost.docid)}
//                             className="cancel-btn"
//                           >
//                             取消
//                           </button>
//                         </div>
//                       </form>

//                       <div className="comments-section">
//                         <div className="comments-header">
//                           <h4>💬 評論 ({postState.comments.length})</h4>
//                           {postState.loadingComments && <span className="loading-indicator">載入中...</span>}
//                         </div>

//                         <div className="comments-list">
//                           {postState.comments.length > 0 ? (
//                             postState.comments.map(comment => (
//                               <div key={comment.id} className="comment">
//                                 <div className="comment-header">
//                                   <div className="comment-avatar">
//                                     <img
//                                       src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=random&size=32`}
//                                       alt="評論者頭像"
//                                     />
//                                   </div>
//                                   <div className="comment-info">
//                                     <div className="comment-author">{comment.author}</div>
//                                     <div className="comment-time">{comment.time}</div>
//                                   </div>
//                                 </div>
//                                 <div className="comment-content">
//                                   <p>{comment.content}</p>
//                                 </div>
//                               </div>
//                             ))
//                           ) : (
//                             <div className="no-comments">
//                               <p>尚無評論，成為第一個留言的人！</p>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               <div className="witness-section">
//                 <div className="witness-wall-header">
//                   <div className="witness-wall-avatar">
//                     <img
//                       src={`https://ui-avatars.com/api/?name=${encodeURIComponent(witness.userid)}&background=random&size=48`}
//                       alt="Witness avatar"
//                     />
//                   </div>
//                   <div className="witness-wall-info">
//                     <div className="witness-wall-author">{witness.userid}</div>
//                     <div className="witness-wall-time">{witness.datetime || '剛剛'}</div>
//                   </div>
//                 </div>

//                 <div className="witness-wall-content">
//                   {witness.title && <h4>{witness.title}</h4>}
//                   <p>{witness.content}</p>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {(pagination.has_prev || pagination.has_next) && (
//         <div className="witness-wall-pagination">
//           <button
//             className="pagination-btn"
//             onClick={handlePrevPage}
//             disabled={!pagination.has_prev || loading}
//           >
//             ← 上一頁
//           </button>

//           <span className="pagination-info">
//             第 {pagination.current_page} / {pagination.total_pages} 頁
//           </span>

//           <button
//             className="pagination-btn"
//             onClick={handleNextPage}
//             disabled={!pagination.has_next || loading}
//           >
//             下一頁 →
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// // ==================== Comment Component ====================
// const Comment = ({ comment, currentUserId, postDocid }) => {
//   return (
//     <div className="comment">
//       <div className="comment-header">
//         <div className="comment-avatar">
//           <img
//             src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=random&size=32`}
//             alt="評論者頭像"
//           />
//         </div>
//         <div className="comment-info">
//           <div className="comment-author">{comment.author}</div>
//           <div className="comment-time">{comment.time || '剛剛'}</div>
//         </div>
//       </div>
//       <div className="comment-content">
//         <p>{comment.content}</p>
//       </div>
//     </div>
//   );
// };

// // ==================== Post Component ====================
// const Post = ({ post, allPosts, onLike, onComment, currentUserId }) => {
//   const [isLiking, setIsLiking] = useState(false);
//   const [commentText, setCommentText] = useState('');
//   const [comments, setComments] = useState([]);
//   const [showCommentForm, setShowCommentForm] = useState(false);
//   const [isCommenting, setIsCommenting] = useState(false);
//   const [loadingComments, setLoadingComments] = useState(false);

//   const [likeCount, setLikeCount] = useState(post.likes || 0);
//   const [hasLiked, setHasLiked] = useState(false);

//   const isLikingRef = useRef(false);

//   useEffect(() => {
//     if (post.likes !== undefined) setLikeCount(post.likes);
//   }, [post.likes]);

//   const loadComments = useCallback(() => {
//     if (loadingComments) return;
//     setLoadingComments(true);

//     try {
//       const allReplies = allPosts.filter(
//         p => p.parent_docid === post.id && p.event !== 'witness'
//       );

//       const formattedComments = allReplies.map(c => ({
//         id: c.docid,
//         author: c.userid,
//         content: c.content,
//         time: c.datetime || '剛剛',
//         likes: c.amen_count || 0,
//         isReply: true,
//         userid: c.userid
//       }));

//       setComments(formattedComments);
//     } catch (error) {
//       console.error('❌ Load comments error:', error);
//     } finally {
//       setLoadingComments(false);
//     }
//   }, [allPosts, post.id, loadingComments]);

//   const handleLike = async () => {
//     if (isLikingRef.current) return;
//     isLikingRef.current = true;

//     const prevCount = likeCount;
//     const optimisticCount = prevCount + 1;

//     setHasLiked(true);
//     setLikeCount(optimisticCount);

//     try {
//       const result = await ApiService.likePost(post.id, currentUserId);

//       if (result.success) {
//         const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : optimisticCount;
//         setLikeCount(finalCount);

//         setTimeout(() => {
//           setHasLiked(false);
//         }, 300);

//         if (onLike) onLike(post.id, true, finalCount);
//       } else {
//         throw new Error(result.message || 'API Error');
//       }
//     } catch (error) {
//       console.error('❌ Like error:', error);
//       setHasLiked(false);
//       setLikeCount(prevCount);
//     } finally {
//       isLikingRef.current = false;
//       setIsLiking(false);
//     }
//   };

//   const handleToggleCommentForm = () => {
//     const newShowState = !showCommentForm;
//     setShowCommentForm(newShowState);

//     if (newShowState && comments.length === 0) {
//       loadComments();
//     }
//   };

//   const handleCommentSubmit = async (e) => {
//     e.preventDefault();
//     if (!commentText.trim() || isCommenting) return;

//     setIsCommenting(true);
//     try {
//       const result = await ApiService.addComment({
//         userid: currentUserId,
//         content: commentText.trim(),
//         docid: post.id,
//         sn: post.sn
//       });

//       if (result.success) {
//         const newComment = {
//           id: result.comment?.docid || `temp-${Date.now()}`,
//           author: currentUserId,
//           content: commentText.trim(),
//           time: '剛剛',
//           likes: 0,
//           isReply: true,
//           userid: currentUserId
//         };

//         setComments([newComment, ...comments]);
//         setCommentText('');

//         if (onComment) onComment(post.id, commentText.trim());
//       } else {
//         alert(`評論失敗: ${result.message}`);
//       }
//     } catch (error) {
//       console.error('💥 評論錯誤:', error);
//       alert(`評論時發生錯誤: ${error.message}`);
//     } finally {
//       setIsCommenting(false);
//     }
//   };

//   return (
//     <div className="post-card">
//       <div className="post-header">
//         <div className="post-avatar">
//           <img
//             src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=random`}
//             alt="用戶頭像"
//           />
//         </div>
//         <div className="post-info">
//           <div className="post-author">{post.author}</div>
//           <div className="post-time">{post.time}</div>
//         </div>

//         {/* ✅ 2 BADGES */}
//         <div className="post-badges-container">
//           <div className="post-privacy-badge">
//             <span>
//               {(!post.privacy || post.privacy === 'public') && 'PUBLIC'}
//               {post.privacy === 'family' && 'FAMILY'}
//               {post.privacy === 'tribe' && 'TRIBE'}
//               {(post.privacy === 'individual' || post.privacy === 'private') && 'INDIVIDUAL'}
//             </span>
//           </div>
//           <div className="post-category-badge">
//             <span>
//               {(post.category === 'Personal & Family' || post.category === 'personal') && 'Personal & Family'}
//               {(post.category === 'Church & Ministry' || post.category === 'church') && 'Church & Ministry'}
//               {(post.category === 'Kingdom Prayer' || post.category === 'kingdom') && 'Kingdom Prayer'}
//               {(post.category === 'Tribe Prayer' || post.category === 'tribe') && 'Tribe Prayer'}
//               {!post.category && 'Personal & Family'}
//             </span>
//           </div>
//         </div>
//       </div>

//       <div className="post-content">
//         {post.title && <h3>{post.title}</h3>}
//         <p>{post.content}</p>
//       </div>

//       <div className="post-actions">
//         <button
//           className={`action-button ${hasLiked ? 'liked' : ''}`}
//           onClick={handleLike}
//           disabled={isLiking}
//         >
//           {hasLiked ? `Amened (${likeCount})` : `Amen (${likeCount})`}
//         </button>

//         <button
//           className="action-button"
//           onClick={handleToggleCommentForm}
//         >
//           Pray for me ({comments.length})
//         </button>
//       </div>

//       {showCommentForm && (
//         <>
//           <form className="comment-form" onSubmit={handleCommentSubmit}>
//             <textarea
//               value={commentText}
//               onChange={(e) => setCommentText(e.target.value)}
//               placeholder="寫下您的禱告..."
//               rows="3"
//             />
//             <div className="comment-actions">
//               <button type="submit" className="comment-submit" disabled={isCommenting}>
//                 {isCommenting ? '發送中...' : '發送'}
//               </button>
//               <button type="button" onClick={() => setShowCommentForm(false)} className="comment-cancel">
//                 取消
//               </button>
//             </div>
//           </form>

//           <div className="comments-section">
//             {loadingComments && <p>載入評論中...</p>}
//             {comments.length > 0 && (
//               <div className="comments-list">
//                 {comments.map(c => (
//                   <Comment key={c.id} comment={c} currentUserId={currentUserId} postDocid={post.id} />
//                 ))}
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// // ==================== Main Prayer Hub Component ====================
// const PrayerHub = ({ user, onLogout }) => {
//   const navigate = useNavigate();
//   const [notificationCount] = useState(0);
//   const [coinAmount] = useState(200000);
//   const [showTribeDetail, setShowTribeDetail] = useState(false);

//   // ✅ THAY ĐỔI: TÁCH RIÊNG 2 STATE CHO PRIVACY VÀ CATEGORY
//   const [privacyFilterActive, setPrivacyFilterActive] = useState(false);
//   const [categoryFilterActive, setCategoryFilterActive] = useState(false);
//   const [witnessWallActive, setWitnessWallActive] = useState(false);

//   const [selectedPrivacy, setSelectedPrivacy] = useState(null); // ✅ NULL = chưa chọn
//   const [selectedPrayerCategory, setSelectedPrayerCategory] = useState(null); // ✅ NULL = chưa chọn


//   const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
//   const [isPrayerCategoryOpen, setIsPrayerCategoryOpen] = useState(false);

//   const [posts, setPosts] = useState([]);
//   const [allPosts, setAllPosts] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const privacyRef = useRef(null);
//   const prayerCategoryRef = useRef(null);

//   const userTribeId = user?.tribe;
//   let tribeNameProp, tribeLogoProp;

//   if (userTribeId === null || userTribeId === undefined) {
//     tribeNameProp = "not tribe";
//     tribeLogoProp = null;
//   } else {
//     const tribeData = tribeIdMap[userTribeId];
//     tribeNameProp = tribeData?.name || 'Unknown';
//     tribeLogoProp = tribeData?.icon || null;
//   }

//   const handleBack = () => navigate('/context');

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (privacyRef.current && !privacyRef.current.contains(event.target)) {
//         setIsPrivacyOpen(false);
//       }
//       if (prayerCategoryRef.current && !prayerCategoryRef.current.contains(event.target)) {
//         setIsPrayerCategoryOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const fetchPosts = useCallback(async () => {
//     setLoading(true);
//     try {
//       console.log('📡 Fetching posts from API...');

//       const currentUserId = user?.id || user?.userId || ApiService.getCurrentUserId();
//       const filters = { viewer_userid: currentUserId };
//       const result = await ApiService.getPosts(1, 50, true, filters);

//       if (result && result.success && result.posts && result.posts.length > 0) {
//         console.log('✅ Posts fetched successfully:', result.posts);

//         const commentsCountMap = {};
//         result.posts.forEach(p => {
//           if (p.parent_docid && p.event !== 'witness') {
//             commentsCountMap[p.parent_docid] = (commentsCountMap[p.parent_docid] || 0) + 1;
//           }
//         });

//         const filteredPosts = result.posts.filter(post => !post.parent_docid && post.docid);

//         const transformedPosts = filteredPosts.map(post => ({
//           id: post.docid,
//           sn: post.sn,
//           likes: post.amen_count !== undefined ? post.amen_count : 0,
//           isLiked: (post.amened === true || post.amened === 1 || post.amened === 'true'),
//           calculatedComments: commentsCountMap[post.docid] || 0,
//           title: post.title || '',
//           content: post.content || '',
//           privacy: post.privacy ? post.privacy.toLowerCase() : 'public',
//           category: post.category || 'Personal & Family',
//           author: post.author || post.userid || user?.name || '匿名用戶',
//           time: post.datetime || '剛剛',
//           image: post.image || null,
//           audioRecordId: post.uuid || null
//         }));

//         setPosts(transformedPosts);
//         setAllPosts(result.posts);
//       } else {
//         console.log('⚠️ No posts found');
//         setPosts([]);
//         setAllPosts([]);
//       }
//     } catch (error) {
//       console.error('💥 Error fetching posts:', error);
//       setPosts([]);
//     } finally {
//       setLoading(false);
//     }
//   }, [user]);

//   useEffect(() => {
//     fetchPosts();
//   }, [fetchPosts]);

//   const getFilteredPosts = () => {
//   let filtered = posts;

//   // ✅ LỌC THEO PRIVACY (NẾU ĐÃ BẬT VÀ ĐÃ CHỌN OPTION)
//   if (privacyFilterActive && selectedPrivacy) {
//     const privacyMap = {
//       'Public': 'public',
//       'Family': 'family',
//       'Tribe': 'tribe',
//       'Individual': 'individual'
//     };
//     const mappedPrivacy = privacyMap[selectedPrivacy];
//     filtered = filtered.filter(p => p.privacy === mappedPrivacy);
//   }

//   // ✅ LỌC THEO PRAYER CATEGORY (NẾU ĐÃ BẬT VÀ ĐÃ CHỌN OPTION)
//   if (categoryFilterActive && selectedPrayerCategory) {
//     const categoryMap = {
//       'Personal & Family': ['Personal & Family', 'personal'],
//       'Church & Ministry': ['Church & Ministry', 'church'],
//       'Kingdom Prayer': ['Kingdom Prayer', 'kingdom'],
//       'Tribe Prayer': ['Tribe Prayer', 'tribe']
//     };
//     const mappedCategories = categoryMap[selectedPrayerCategory];
//     filtered = filtered.filter(p => mappedCategories.includes(p.category));
//   }

//   return filtered;
// };


//   const handleCategoryClick = (category) => {
//   console.log(`📂 Category clicked: ${category}`);
  
//   if (category === 'Privacy Choices') {
//     const newState = !privacyFilterActive;
//     setPrivacyFilterActive(newState);
//     setIsPrivacyOpen(newState);
    
//     // ✅ NẾU TẮT → RESET SELECTION
//     if (!newState) {
//       setSelectedPrivacy(null);
//     }
    
//     setIsPrayerCategoryOpen(false);
//     setWitnessWallActive(false);
//   } else if (category === 'Prayer Category') {
//     const newState = !categoryFilterActive;
//     setCategoryFilterActive(newState);
//     setIsPrayerCategoryOpen(newState);
    
//     // ✅ NẾU TẮT → RESET SELECTION
//     if (!newState) {
//       setSelectedPrayerCategory(null);
//     }
    
//     setIsPrivacyOpen(false);
//     setWitnessWallActive(false);
//   } else if (category === 'Witness Wall') {
//     const newState = !witnessWallActive;
//     setWitnessWallActive(newState);
//     setPrivacyFilterActive(false);
//     setCategoryFilterActive(false);
//     setIsPrivacyOpen(false);
//     setIsPrayerCategoryOpen(false);
//   }
// };


//   const handleTabChange = (tabName) => {
//     if (tabName === 'Home') navigate('/context');
//     else if (tabName === 'Add') navigate('/create-post');
//   };

//   const handleLogout = async () => {
//     ApiService.clearCache();
//     if (onLogout) await onLogout();
//     navigate('/login', { replace: true });
//   };

//   const handleTribeLogoClick = () => setShowTribeDetail(true);
//   const handleCloseTribeDetail = () => setShowTribeDetail(false);

//   if (showTribeDetail) {
//     if (userTribeId === null || userTribeId === undefined) {
//       return <NoTribeDetail onBack={handleCloseTribeDetail} />;
//     }
//     return (
//       <TribeDetail
//         tribeId={userTribeId}
//         tribeName={tribeNameProp}
//         tribeIcon={tribeLogoProp}
//         onBack={handleCloseTribeDetail}
//       />
//     );
//   }

//   const filteredPosts = getFilteredPosts();
//   const privacyOptions = ['Public', 'Family', 'Tribe', 'Individual'];
//   const prayerCategoryOptions = ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer', 'Tribe Prayer'];

//   return (
//     <AppBackground backgroundColor="#2D3656">
//       <div className="app-container">
//         <UserHeader
//           user={user}
//           coins={coinAmount}
//           tribeLogo={tribeLogoProp}
//           tribeName={tribeNameProp}
//           familyIcon={Mdi}
//           blessingIcon={Fluent}
//           notificationCount={notificationCount}
//           onNotificationClick={() => { }}
//           onCoinClick={() => { }}
//           onLogoClick={handleBack}
//           onTribeLogoClick={handleTribeLogoClick}
//         />

//         <div className="top-action-bar">
//           <NotificationBell count={notificationCount} size="medium" />
//           <CoinDisplay amount={coinAmount} size="medium" />
//         </div>

//         <hr className="divider-line" />

//         <div className="category-buttons">
//           {/* Privacy Choices Button với Dropdown */}
//           <div className="category-item" ref={privacyRef}>
//             <RectButton
//               image={choices}
//               imageAlt="Privacy Choices"
//               size="medium"
//               active={privacyFilterActive}
//               onClick={() => handleCategoryClick('Privacy Choices')}
//             />
//             <CategoryLabel
//               text={selectedPrivacy || 'All'}
//               isActive={privacyFilterActive}
//             />



//             {privacyFilterActive && isPrivacyOpen && (
//               <div className="category-dropdown-menu">
//                 {privacyOptions.map((option) => (
//                   <div
//                     key={option}
//                     className={`category-dropdown-item ${selectedPrivacy === option ? 'selected' : ''}`}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setSelectedPrivacy(option);
//                       setIsPrivacyOpen(false);
//                     }}
//                   >
//                     {option}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Prayer Category Button với Dropdown */}
//           <div className="category-item" ref={prayerCategoryRef}>
//             <RectButton
//               image={category}
//               imageAlt="Prayer Category"
//               size="medium"
//               active={categoryFilterActive}
//               onClick={() => handleCategoryClick('Prayer Category')}
//             />
//             <CategoryLabel
//               text={selectedPrayerCategory || 'All'}
//               isActive={categoryFilterActive}
//             />


//             {categoryFilterActive && isPrayerCategoryOpen && (
//               <div className="category-dropdown-menu">
//                 {prayerCategoryOptions.map((option) => (
//                   <div
//                     key={option}
//                     className={`category-dropdown-item ${selectedPrayerCategory === option ? 'selected' : ''}`}
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       setSelectedPrayerCategory(option);
//                       setIsPrayerCategoryOpen(false);
//                     }}
//                   >
//                     {option}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Witness Wall Button */}
//           <div className="category-item" onClick={() => handleCategoryClick('Witness Wall')}>
//             <RectButton
//               image={witness}
//               imageAlt="Witness Wall"
//               size="medium"
//               active={witnessWallActive}
//             />
//             <CategoryLabel
//               text="Witness Wall"
//               isActive={witnessWallActive}
//             />
//           </div>
//         </div>



//         <hr className="divider-line" />

//         <div className="main-content">
//           <div className="posts-container">
//             {loading ? (
//               <div className="loading-container">
//                 <div className="loading-spinner"></div>
//                 <p>載入中...</p>
//               </div>
//             ) : witnessWallActive ? (
//               <WitnessWall
//                 currentUserId={user?.id}
//                 allPosts={allPosts}
//               />
//             ) : filteredPosts.length > 0 ? (
//               <div className="posts-feed">
//                 {filteredPosts.map(post => (
//                   <Post
//                     key={post.id}
//                     post={post}
//                     allPosts={allPosts}
//                     onLike={(postId, liked, count) => {
//                       setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: count, isLiked: liked } : p));
//                     }}
//                     onComment={(postId) => {
//                       fetchPosts();
//                     }}
//                     currentUserId={user?.id}
//                   />
//                 ))}
//               </div>
//             ) : (
//               <div className="no-posts">
//                 <div className="no-posts-icon">📭</div>
//                 <h4>沒有符合條件的貼文</h4>
//                 <p>嘗試切換到其他篩選條件查看現有貼文</p>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="bottom-navigation">
//           <CircleButton provider="Home" iconSrc={Home} onClick={() => handleTabChange('Home')} isActive={false} size="medium" />
//           <CircleButton provider="PrayerHub" iconSrc={Search} onClick={() => handleTabChange('PrayerHub')} isActive={true} size="medium" />
//           <CircleButton provider="Add" iconSrc={Add} onClick={() => handleTabChange('Add')} isActive={false} size="medium" />
//           <CircleButton provider="Search" iconSrc={Profile} onClick={() => handleTabChange('Search')} isActive={false} size="medium" />
//           <CircleButton provider="Nova" iconSrc={Nova} onClick={handleLogout} isActive={false} size="medium" />
//         </div>
//       </div>
//     </AppBackground>
//   );
// };

// export default PrayerHub;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import AppBackground from '../../components/AppBackground/AppBackground';
import UserHeader from '../../components/UserHeader/UserHeader';
import NotificationBell from '../../components/NotificationBell/NotificationBell';
import CoinDisplay from '../../components/CoinDisplay/CoinDisplay';
import RectButton from '../../components/RectButton/RectButton';
import CircleButton from '../../components/CircleButton/CircleButton';
import CategoryLabel from '../../components/CategoryLabel/CategoryLabel';
import TribeDetail from '../Context/steps/TribeDetail';
import NoTribeDetail from '../Context/steps/NoTribeDetail';

// Import icons
import choices from '../../assets/icons/Choices.png';
import category from '../../assets/icons/Category.png';
import witness from '../../assets/icons/witness.png';

import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

import Mdi from '../../assets/icons/mdi_family.png';
import Fluent from '../../assets/icons/fluent_people-interwoven-20-filled.png';

// Import tribe icons
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

// ==================== Tribe ID Map ====================
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

// ==================== ✅ WITNESS WALL COMPONENT (CÓ COLLAPSE/EXPAND) ====================
const WitnessWall = ({ currentUserId, allPosts, privacyFilter, categoryFilter }) => {
  const [witnesses, setWitnesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [postStates, setPostStates] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({}); // ✅ Track expanded state

  // ✅ HÀM LỌC WITNESSES THEO PRIVACY VÀ CATEGORY
  const filterWitnesses = useCallback((witnessesData) => {
    let filtered = witnessesData;

    if (privacyFilter) {
      const privacyMap = {
        'Public': 'public',
        'Family': 'family',
        'Tribe': 'tribe',
        'Individual': 'individual'
      };
      const mappedPrivacy = privacyMap[privacyFilter];
      
      filtered = filtered.filter(witness => {
        const originalPost = witness.original_post || 
          allPosts?.find(p => p.docid === witness.parent_docid);
        return originalPost?.privacy === mappedPrivacy;
      });
    }

    if (categoryFilter) {
      const categoryMap = {
        'Personal & Family': ['Personal & Family', 'personal'],
        'Church & Ministry': ['Church & Ministry', 'church'],
        'Kingdom Prayer': ['Kingdom Prayer', 'kingdom'],
        'Tribe Prayer': ['Tribe Prayer', 'tribe']
      };
      const mappedCategories = categoryMap[categoryFilter];
      
      filtered = filtered.filter(witness => {
        const originalPost = witness.original_post || 
          allPosts?.find(p => p.docid === witness.parent_docid);
        return mappedCategories.includes(originalPost?.category);
      });
    }

    return filtered;
  }, [privacyFilter, categoryFilter, allPosts]);

  const loadWitnesses = useCallback(async () => {
    setLoading(true);
    try {
      console.log(`✨ Loading Witness Wall from allPosts`);
      console.log(`📦 Total allPosts: ${allPosts?.length || 0}`);

      const witnessesFromPosts = allPosts?.filter(post => post.event === 'witness') || [];
      
      console.log(`✅ Found ${witnessesFromPosts.length} witnesses in allPosts`);

      const transformedWitnesses = witnessesFromPosts.map(post => ({
        docid: post.docid,
        userid: post.userid,
        content: post.content,
        title: post.title,
        datetime: post.datetime,
        parent_docid: post.parent_docid,
        original_post: allPosts.find(p => p.docid === post.parent_docid)
      }));

      const filteredWitnesses = filterWitnesses(transformedWitnesses);
      
      console.log(`🎯 After filtering: ${filteredWitnesses.length} witnesses`);
      
      setWitnesses(filteredWitnesses);

      const initialStates = {};
      filteredWitnesses.forEach(witness => {
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
        }
      });
      setPostStates(initialStates);

    } catch (error) {
      console.error('❌ Error loading witnesses:', error);
      setWitnesses([]);
    } finally {
      setLoading(false);
    }
  }, [privacyFilter, categoryFilter, filterWitnesses, allPosts]);

  useEffect(() => {
    if (allPosts && allPosts.length > 0) {
      loadWitnesses();
    }
  }, [privacyFilter, categoryFilter, allPosts, loadWitnesses]);

  // ✅ TOGGLE EXPAND/COLLAPSE
  const toggleExpand = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // ✅ GROUP WITNESSES BY ORIGINAL POST
  const groupedWitnesses = witnesses.reduce((acc, witness) => {
    const postId = witness.parent_docid;
    if (!acc[postId]) {
      acc[postId] = [];
    }
    acc[postId].push(witness);
    return acc;
  }, {});

  const handleLikeOriginalPost = async (postId) => {
    const currentState = postStates[postId];
    if (!currentState || currentState.isLiking) return;

    const prevCount = currentState.likeCount;
    const newCount = prevCount + 1;

    setPostStates(prev => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        hasLiked: true,
        likeCount: newCount,
        isLiking: true
      }
    }));

    try {
      const result = await ApiService.likePost(postId, currentUserId);

      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : newCount;

        setTimeout(() => {
          setPostStates(prev => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              likeCount: finalCount,
              hasLiked: false,
              isLiking: false
            }
          }));
        }, 300);
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Like error:', error);
      setPostStates(prev => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          hasLiked: false,
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
        isReply: true,
        userid: c.userid
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
      const result = await ApiService.addComment({
        userid: currentUserId,
        content: currentState.commentText.trim(),
        docid: postId,
        sn: postSn
      });

      if (result.success) {
        const newComment = {
          id: result.comment?.docid || `temp-${Date.now()}`,
          author: currentUserId,
          content: currentState.commentText.trim(),
          time: '剛剛',
          likes: 0,
          isReply: true,
          userid: currentUserId
        };

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
        <p>
          {privacyFilter || categoryFilter 
            ? '沒有符合篩選條件的見證' 
            : '成為第一個分享見證的人！'}
        </p>
      </div>
    );
  }

  return (
    <div className="witness-wall">

      <div className="witness-wall-grid">
        {Object.entries(groupedWitnesses).map(([postId, postWitnesses]) => {
          const originalPost = postWitnesses[0]?.original_post ||
            allPosts?.find(p => p.docid === postId);

          if (!originalPost) return null;

          const postState = postStates[originalPost.docid] || {
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

          const isExpanded = expandedPosts[postId];
          const witnessesToShow = isExpanded ? postWitnesses : [postWitnesses[0]];
          const hasMoreWitnesses = postWitnesses.length > 1;

          return (
            <div key={postId} className="witness-wall-post-card">
              {/* ORIGINAL POST */}
              <div className="witness-original-post-section">
                <div className="post-header">
                  <div className="post-avatar">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(originalPost.userid || originalPost.author)}&background=random&size=48`}
                      alt="Original post avatar"
                    />
                  </div>
                  <div className="post-info">
                    <div className="post-author">{originalPost.userid || originalPost.author}</div>
                    <div className="post-time">{originalPost.datetime || '剛剛'}</div>
                  </div>

                  <div className="post-badges-container">
                    <div className="post-privacy-badge">
                      <span>
                        {(!originalPost.privacy || originalPost.privacy === 'public') && 'PUBLIC'}
                        {originalPost.privacy === 'family' && 'FAMILY'}
                        {originalPost.privacy === 'tribe' && 'TRIBE'}
                        {(originalPost.privacy === 'individual' || originalPost.privacy === 'private') && 'INDIVIDUAL'}
                      </span>
                    </div>
                    <div className="post-category-badge">
                      <span>
                        {(originalPost.category === 'Personal & Family' || originalPost.category === 'personal') && 'Personal & Family'}
                        {(originalPost.category === 'Church & Ministry' || originalPost.category === 'church') && 'Church & Ministry'}
                        {(originalPost.category === 'Kingdom Prayer' || originalPost.category === 'kingdom') && 'Kingdom Prayer'}
                        {(originalPost.category === 'Tribe Prayer' || originalPost.category === 'tribe') && 'Tribe Prayer'}
                        {!originalPost.category && 'Personal & Family'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="post-content">
                  {originalPost.title && <h3>{originalPost.title}</h3>}
                  <p>{originalPost.content}</p>
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
                      <textarea
                        value={postState.commentText}
                        onChange={(e) => handleCommentTextChange(originalPost.docid, e.target.value)}
                        placeholder="寫下您的評論..."
                        rows="3"
                        maxLength="500"
                      />
                      <div className="form-info">
                        <span className="char-count">{postState.commentText.length}/500</span>
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
                          postState.comments.map(comment => (
                            <div key={comment.id} className="comment">
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
                              </div>
                              <div className="comment-content">
                                <p>{comment.content}</p>
                              </div>
                            </div>
                          ))
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

              {/* ✅ WITNESSES SECTION */}
              <div className="witnesses-list">
                {witnessesToShow.map(witness => (
                  <div key={witness.docid} className="witness-section">
                    <div className="witness-wall-header">
                      <div className="witness-wall-avatar">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(witness.userid)}&background=random&size=48`}
                          alt="Witness avatar"
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
                ))}

                {/* ✅ EXPAND/COLLAPSE BUTTON */}
                {hasMoreWitnesses && (
                  <button
                    className="witness-toggle-btn"
                    onClick={() => toggleExpand(postId)}
                  >
                    {isExpanded ? (
                      <>
                        <span>▲ Thu gọn</span>
                      </>
                    ) : (
                      <>
                        <span>▼ Xem thêm {postWitnesses.length - 1} witnesses</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== Comment Component ====================
const Comment = ({ comment, currentUserId, postDocid }) => {
  return (
    <div className="comment">
      <div className="comment-header">
        <div className="comment-avatar">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author)}&background=random&size=32`}
            alt="評論者頭像"
          />
        </div>
        <div className="comment-info">
          <div className="comment-author">{comment.author}</div>
          <div className="comment-time">{comment.time || '剛剛'}</div>
        </div>
      </div>
      <div className="comment-content">
        <p>{comment.content}</p>
      </div>
    </div>
  );
};

// ==================== Post Component ====================
const Post = ({ post, allPosts, onLike, onComment, currentUserId }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);

  const isLikingRef = useRef(false);

  useEffect(() => {
    if (post.likes !== undefined) setLikeCount(post.likes);
  }, [post.likes]);

  const loadComments = useCallback(() => {
    if (loadingComments) return;
    setLoadingComments(true);

    try {
      const allReplies = allPosts.filter(
        p => p.parent_docid === post.id && p.event !== 'witness'
      );

      const formattedComments = allReplies.map(c => ({
        id: c.docid,
        author: c.userid,
        content: c.content,
        time: c.datetime || '剛剛',
        likes: c.amen_count || 0,
        isReply: true,
        userid: c.userid
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error('❌ Load comments error:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [allPosts, post.id, loadingComments]);

  const handleLike = async () => {
    if (isLikingRef.current) return;
    isLikingRef.current = true;

    const prevCount = likeCount;
    const optimisticCount = prevCount + 1;

    setHasLiked(true);
    setLikeCount(optimisticCount);

    try {
      const result = await ApiService.likePost(post.id, currentUserId);

      if (result.success) {
        const finalCount = result.data?.amen_count !== undefined ? result.data.amen_count : optimisticCount;
        setLikeCount(finalCount);

        setTimeout(() => {
          setHasLiked(false);
        }, 300);

        if (onLike) onLike(post.id, true, finalCount);
      } else {
        throw new Error(result.message || 'API Error');
      }
    } catch (error) {
      console.error('❌ Like error:', error);
      setHasLiked(false);
      setLikeCount(prevCount);
    } finally {
      isLikingRef.current = false;
      setIsLiking(false);
    }
  };

  const handleToggleCommentForm = () => {
    const newShowState = !showCommentForm;
    setShowCommentForm(newShowState);

    if (newShowState && comments.length === 0) {
      loadComments();
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
        const newComment = {
          id: result.comment?.docid || `temp-${Date.now()}`,
          author: currentUserId,
          content: commentText.trim(),
          time: '剛剛',
          likes: 0,
          isReply: true,
          userid: currentUserId
        };

        setComments([newComment, ...comments]);
        setCommentText('');

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
          <div className="post-time">{post.time}</div>
        </div>

        <div className="post-badges-container">
          <div className="post-privacy-badge">
            <span>
              {(!post.privacy || post.privacy === 'public') && 'PUBLIC'}
              {post.privacy === 'family' && 'FAMILY'}
              {post.privacy === 'tribe' && 'TRIBE'}
              {(post.privacy === 'individual' || post.privacy === 'private') && 'INDIVIDUAL'}
            </span>
          </div>
          <div className="post-category-badge">
            <span>
              {(post.category === 'Personal & Family' || post.category === 'personal') && 'Personal & Family'}
              {(post.category === 'Church & Ministry' || post.category === 'church') && 'Church & Ministry'}
              {(post.category === 'Kingdom Prayer' || post.category === 'kingdom') && 'Kingdom Prayer'}
              {(post.category === 'Tribe Prayer' || post.category === 'tribe') && 'Tribe Prayer'}
              {!post.category && 'Personal & Family'}
            </span>
          </div>
        </div>
      </div>

      <div className="post-content">
        {post.title && <h3>{post.title}</h3>}
        <p>{post.content}</p>
      </div>

      <div className="post-actions">
        <button
          className={`action-button ${hasLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          {hasLiked ? `Amened (${likeCount})` : `Amen (${likeCount})`}
        </button>

        <button
          className="action-button"
          onClick={handleToggleCommentForm}
        >
          Pray for me ({comments.length})
        </button>
      </div>

      {showCommentForm && (
        <>
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="寫下您的禱告..."
              rows="3"
            />
            <div className="comment-actions">
              <button type="submit" className="comment-submit" disabled={isCommenting}>
                {isCommenting ? '發送中...' : '發送'}
              </button>
              <button type="button" onClick={() => setShowCommentForm(false)} className="comment-cancel">
                取消
              </button>
            </div>
          </form>

          <div className="comments-section">
            {loadingComments && <p>載入評論中...</p>}
            {comments.length > 0 && (
              <div className="comments-list">
                {comments.map(c => (
                  <Comment key={c.id} comment={c} currentUserId={currentUserId} postDocid={post.id} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== Main Prayer Hub Component ====================
const PrayerHub = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [notificationCount] = useState(0);
  const [coinAmount] = useState(200000);
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

  const userTribeId = user?.tribe;
  let tribeNameProp, tribeLogoProp;

  if (userTribeId === null || userTribeId === undefined) {
    tribeNameProp = "not tribe";
    tribeLogoProp = null;
  } else {
    const tribeData = tribeIdMap[userTribeId];
    tribeNameProp = tribeData?.name || 'Unknown';
    tribeLogoProp = tribeData?.icon || null;
  }

  const handleBack = () => navigate('/context');

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

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📡 Fetching posts from API...');

      const currentUserId = user?.id || user?.userId || ApiService.getCurrentUserId();
      const filters = { viewer_userid: currentUserId };
      const result = await ApiService.getPosts(1, 50, true, filters);

      if (result && result.success && result.posts && result.posts.length > 0) {
        console.log('✅ Posts fetched successfully:', result.posts);

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
          likes: post.amen_count !== undefined ? post.amen_count : 0,
          isLiked: (post.amened === true || post.amened === 1 || post.amened === 'true'),
          calculatedComments: commentsCountMap[post.docid] || 0,
          title: post.title || '',
          content: post.content || '',
          privacy: post.privacy ? post.privacy.toLowerCase() : 'public',
          category: post.category || 'Personal & Family',
          author: post.author || post.userid || user?.name || '匿名用戶',
          time: post.datetime || '剛剛',
          image: post.image || null,
          audioRecordId: post.uuid || null
        }));

        setPosts(transformedPosts);
        setAllPosts(result.posts);
      } else {
        console.log('⚠️ No posts found');
        setPosts([]);
        setAllPosts([]);
      }
    } catch (error) {
      console.error('💥 Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const getFilteredPosts = () => {
    let filtered = posts;

    if (privacyFilterActive && selectedPrivacy) {
      const privacyMap = {
        'Public': 'public',
        'Family': 'family',
        'Tribe': 'tribe',
        'Individual': 'individual'
      };
      const mappedPrivacy = privacyMap[selectedPrivacy];
      filtered = filtered.filter(p => p.privacy === mappedPrivacy);
    }

    if (categoryFilterActive && selectedPrayerCategory) {
      const categoryMap = {
        'Personal & Family': ['Personal & Family', 'personal'],
        'Church & Ministry': ['Church & Ministry', 'church'],
        'Kingdom Prayer': ['Kingdom Prayer', 'kingdom'],
        'Tribe Prayer': ['Tribe Prayer', 'tribe']
      };
      const mappedCategories = categoryMap[selectedPrayerCategory];
      filtered = filtered.filter(p => mappedCategories.includes(p.category));
    }

    return filtered;
  };

  const handleCategoryClick = (category) => {
    console.log(`📂 Category clicked: ${category}`);
    
    if (category === 'Privacy Choices') {
      const newState = !privacyFilterActive;
      setPrivacyFilterActive(newState);
      setIsPrivacyOpen(newState);
      
      if (!newState) {
        setSelectedPrivacy(null);
      }
      
      setIsPrayerCategoryOpen(false);
      setWitnessWallActive(false);
    } else if (category === 'Prayer Category') {
      const newState = !categoryFilterActive;
      setCategoryFilterActive(newState);
      setIsPrayerCategoryOpen(newState);
      
      if (!newState) {
        setSelectedPrayerCategory(null);
      }
      
      setIsPrivacyOpen(false);
      setWitnessWallActive(false);
    } else if (category === 'Witness Wall') {
      const newState = !witnessWallActive;
      setWitnessWallActive(newState);
      
      setIsPrivacyOpen(false);
      setIsPrayerCategoryOpen(false);
    }
  };

  const handleTabChange = (tabName) => {
    if (tabName === 'Home') navigate('/context');
    else if (tabName === 'Add') navigate('/create-post');
  };

  const handleLogout = async () => {
    ApiService.clearCache();
    if (onLogout) await onLogout();
    navigate('/login', { replace: true });
  };

  const handleTribeLogoClick = () => setShowTribeDetail(true);
  const handleCloseTribeDetail = () => setShowTribeDetail(false);

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
  const privacyOptions = ['Public', 'Family', 'Tribe', 'Individual'];
  const prayerCategoryOptions = ['Personal & Family', 'Church & Ministry', 'Kingdom Prayer', 'Tribe Prayer'];

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
          onNotificationClick={() => { }}
          onCoinClick={() => { }}
          onLogoClick={handleBack}
          onTribeLogoClick={handleTribeLogoClick}
        />

        <div className="top-action-bar">
          <NotificationBell count={notificationCount} size="medium" />
          <CoinDisplay amount={coinAmount} size="medium" />
        </div>

        <hr className="divider-line" />

        <div className="category-buttons">
          <div className="category-item" ref={privacyRef}>
            <RectButton
              image={choices}
              imageAlt="Privacy Choices"
              size="medium"
              active={privacyFilterActive}
              onClick={() => handleCategoryClick('Privacy Choices')}
            />
            <CategoryLabel
              text={selectedPrivacy || 'All'}
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
              image={category}
              imageAlt="Prayer Category"
              size="medium"
              active={categoryFilterActive}
              onClick={() => handleCategoryClick('Prayer Category')}
            />
            <CategoryLabel
              text={selectedPrayerCategory || 'All'}
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
                      setSelectedPrayerCategory(option);
                      setIsPrayerCategoryOpen(false);
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="category-item" onClick={() => handleCategoryClick('Witness Wall')}>
            <RectButton
              image={witness}
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
              />
            ) : filteredPosts.length > 0 ? (
              <div className="posts-feed">
                {filteredPosts.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    allPosts={allPosts}
                    onLike={(postId, liked, count) => {
                      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: count, isLiked: liked } : p));
                    }}
                    onComment={(postId) => {
                      fetchPosts();
                    }}
                    currentUserId={user?.id}
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
          <CircleButton provider="Home" iconSrc={Home} onClick={() => handleTabChange('Home')} isActive={false} size="medium" />
          <CircleButton provider="PrayerHub" iconSrc={Search} onClick={() => handleTabChange('PrayerHub')} isActive={true} size="medium" />
          <CircleButton provider="Add" iconSrc={Add} onClick={() => handleTabChange('Add')} isActive={false} size="medium" />
          <CircleButton provider="Search" iconSrc={Profile} onClick={() => handleTabChange('Search')} isActive={false} size="medium" />
          <CircleButton provider="Nova" iconSrc={Nova} onClick={handleLogout} isActive={false} size="medium" />
        </div>
      </div>
    </AppBackground>
  );
};

export default PrayerHub;



