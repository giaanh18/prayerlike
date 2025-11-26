// ./src/pages/PrayerHub/PrayerHub.js
import React, { useState, useEffect, useRef } from 'react';
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

// Import tribe icons (省略 icons 導入以節省篇幅，請保留原有的 import)
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

// ==================== Components from Context (Simplified for PrayerHub) ====================

const Comment = ({ comment }) => {
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

const Post = ({ post, onLike, onComment }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  // 為了示範，這裡使用本地狀態模擬評論
  const [comments, setComments] = useState([]);

  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [hasLiked, setHasLiked] = useState(post.isLiked || false);

  const handleLike = () => {
    // 模擬按讚邏輯
    const newLiked = !hasLiked;
    setHasLiked(newLiked);
    setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);
    if (onLike) onLike(post.id);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // 模擬新增評論
    const newComment = {
      id: Date.now(),
      author: 'Me',
      content: commentText,
      time: '剛剛'
    };
    setComments([...comments, newComment]);
    setCommentText('');
    if (onComment) onComment(post.id, commentText);
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

        <div className="post-privacy-badge">
          {post.privacy && <span>{post.privacy}</span>}
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
        >
          <span className="action-icon"></span>
          {hasLiked ? `Amened (${likeCount})` : `Amen (${likeCount})`}
        </button>

        <button
          className="action-button"
          onClick={() => setShowCommentForm(!showCommentForm)}
        >
          <span className="action-icon"></span>
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
              <button type="submit" className="comment-submit">發送</button>
              <button type="button" onClick={() => setShowCommentForm(false)} className="comment-cancel">取消</button>
            </div>
          </form>

          <div className="comments-section">
            {comments.length > 0 && (
              <div className="comments-list">
                {comments.map(c => <Comment key={c.id} comment={c} />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ==================== My Prayers Tab ====================
const MyPrayersTab = ({ selectedPrivacy, selectedPrayerCategory }) => {
  const [prayers] = useState([
    {
      id: 1,
      author: 'Leo',
      privacy: 'public',
      category: 'personal',
      title: 'I can do it',
      content: 'Amen pray for me',
      date: '2025.09.10 10:10:03',
      likes: 12,
      isLiked: true
    },
    {
      id: 2,
      author: 'Leo',
      privacy: 'family',
      category: 'church',
      title: 'I hope everything will be beautiful',
      content: 'Amen pray for me',
      date: '2025.09.10 10:10:03',
      likes: 8,
      isLiked: false
    },
    {
      id: 3,
      author: 'Leo',
      privacy: 'tribe',
      category: 'kingdom',
      title: 'Pray for my tribe',
      content: 'God bless our tribe',
      date: '2025.09.10 10:10:03',
      likes: 15,
      isLiked: false
    },
    {
      id: 4,
      author: 'Leo',
      privacy: 'individual',
      category: 'tribe',
      title: 'Personal prayer',
      content: 'Only for me',
      date: '2025.09.10 10:10:03',
      likes: 5,
      isLiked: true
    }
  ]);

  // 篩選邏輯
  let filteredPrayers = prayers;
  if (selectedPrivacy !== 'all') {
    filteredPrayers = filteredPrayers.filter(p => p.privacy === selectedPrivacy);
  }
  if (selectedPrayerCategory !== 'all') {
    filteredPrayers = filteredPrayers.filter(p => p.category === selectedPrayerCategory);
  }

  // 轉換資料格式以符合 Post 元件
  const mappedPrayers = filteredPrayers.map(p => ({
    id: p.id,
    author: p.author,
    time: p.date,
    privacy: p.privacy,
    title: p.title,
    content: p.content,
    likes: p.likes,
    isLiked: p.isLiked
  }));

  return (
    <div className="posts-feed">
      {mappedPrayers.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

// ==================== Pray For Others Tab ====================
const PrayForOthersTab = ({ selectedPrivacy, selectedPrayerCategory }) => {
  const [othersPrayers] = useState([
    {
      id: 1,
      author: 'John Doe',
      privacy: 'public',
      category: 'personal',
      title: 'Healing for my mother',
      content: 'My mother is in the hospital. Please pray for her recovery.',
      date: '2024-01-15',
      likes: 25,
      isLiked: false
    },
    {
      id: 2,
      author: 'Jane Smith',
      privacy: 'family',
      category: 'church',
      title: 'Financial breakthrough',
      content: 'Struggling with finances. Need prayers for breakthrough.',
      date: '2024-01-14',
      likes: 18,
      isLiked: true
    }
  ]);

  let filteredPrayers = othersPrayers;
  if (selectedPrivacy !== 'all') {
    filteredPrayers = filteredPrayers.filter(p => p.privacy === selectedPrivacy);
  }
  if (selectedPrayerCategory !== 'all') {
    filteredPrayers = filteredPrayers.filter(p => p.category === selectedPrayerCategory);
  }

  const mappedPrayers = filteredPrayers.map(p => ({
    id: p.id,
    author: p.author,
    time: p.date,
    privacy: p.privacy,
    title: p.title,
    content: p.content,
    likes: p.likes,
    isLiked: p.isLiked
  }));

  return (
    <div className="posts-feed">
      <div className="prayers-header" style={{ marginBottom: '16px', padding: '0 8px' }}>
        <h2 style={{ fontSize: '20px', color: '#FFF' }}>Prayer Requests</h2>
      </div>
      {mappedPrayers.map(post => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  );
};

// ==================== Main Prayer Hub Component ====================
const PrayerHub = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('myPrayers');
  const [notificationCount] = useState(0);
  const [coinAmount] = useState(200000);
  const [showTribeDetail, setShowTribeDetail] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Privacy Choices');
  const [showPrivacyFilter, setShowPrivacyFilter] = useState(true);
  const [selectedPrivacy, setSelectedPrivacy] = useState('public');
  const [showPrayerCategoryFilter, setShowPrayerCategoryFilter] = useState(false);
  const [selectedPrayerCategory, setSelectedPrayerCategory] = useState('all');

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

  const handleBack = () => {
    navigate('/context');
  };

  const handleCategoryClick = (category) => {
    console.log(`📂 Category clicked: ${category}`);

    // ✅ 修正重點：如果點擊的是當前已選中的分類，則不進行任何動作 (防止取消選取並隱藏選項)
    if (selectedCategory === category) {
      return;
    }

    // ✅ 如果 click 到 Privacy Choices
    if (category === 'Privacy Choices') {
      setShowPrivacyFilter(true);        // 強制開啟
      setShowPrayerCategoryFilter(false);
      setSelectedCategory('Privacy Choices'); // 強制設定為此分類

      // 開啟時，預設選取 Public，並重置 Prayer Category 以避免篩選衝突
      setSelectedPrivacy('public');
      setSelectedPrayerCategory('all');
      return;
    }

    // ✅ 如果 click 到 Prayer Category
    if (category === 'Prayer Category') {
      setShowPrayerCategoryFilter(true); // 強制開啟
      setShowPrivacyFilter(false);
      setSelectedCategory('Prayer Category'); // 強制設定為此分類

      // 開啟時，預設選取 Personal & Family，並重置 Privacy 篩選
      setSelectedPrayerCategory('personal');
      setSelectedPrivacy('all');
      return;
    }

    // 其他 Category 點擊邏輯 (如 Witness Wall)
    setSelectedCategory(category);
    setShowPrivacyFilter(false);
    setShowPrayerCategoryFilter(false);

    // 切換到其他分類時，重置篩選
    setSelectedPrivacy('all');
    setSelectedPrayerCategory('all');
  };

  const handlePrivacySelect = (privacyType) => setSelectedPrivacy(privacyType);
  const handlePrayerCategorySelect = (categoryType) => setSelectedPrayerCategory(categoryType);

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
          <div className="category-item" onClick={() => handleCategoryClick('Privacy Choices')}>
            <RectButton image={choices} imageAlt="Privacy Choices" size="medium" active={selectedCategory === 'Privacy Choices'} />
            <CategoryLabel text="Privacy Choices" isActive={selectedCategory === 'Privacy Choices'} />
          </div>
          <div className="category-item" onClick={() => handleCategoryClick('Prayer Category')}>
            <RectButton image={category} imageAlt="Prayer Category" size="medium" active={selectedCategory === 'Prayer Category'} />
            <CategoryLabel text="Prayer Category" isActive={selectedCategory === 'Prayer Category'} />
          </div>
          <div className="category-item" onClick={() => handleCategoryClick('Witness Wall')}>
            <RectButton image={witness} imageAlt="Witness Wall" size="medium" active={selectedCategory === 'Witness Wall'} />
            <CategoryLabel text="Witness Wall" isActive={selectedCategory === 'Witness Wall'} />
          </div>
        </div>

        <hr className="divider-line" />

        {showPrivacyFilter && (
          <div className="privacy-filter-bar">
            {['public', 'family', 'tribe', 'individual'].map(type => (
              <button
                key={type}
                className={`privacy-filter-btn ${selectedPrivacy === type ? 'active' : ''}`}
                onClick={() => handlePrivacySelect(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        )}

        {showPrayerCategoryFilter && (
          <div className="privacy-filter-bar">
            <button className={`privacy-filter-btn ${selectedPrayerCategory === 'personal' ? 'active' : ''}`} onClick={() => handlePrayerCategorySelect('personal')}>Personal & Family</button>
            <button className={`privacy-filter-btn ${selectedPrayerCategory === 'church' ? 'active' : ''}`} onClick={() => handlePrayerCategorySelect('church')}>Church & Ministry</button>
            <button className={`privacy-filter-btn ${selectedPrayerCategory === 'kingdom' ? 'active' : ''}`} onClick={() => handlePrayerCategorySelect('kingdom')}>Kingdom Prayer</button>
            <button className={`privacy-filter-btn ${selectedPrayerCategory === 'tribe' ? 'active' : ''}`} onClick={() => handlePrayerCategorySelect('tribe')}>Tribe Prayer</button>
          </div>
        )}

        <div className="main-content">
          <div className="posts-container">
            {activeTab === 'myPrayers' ? (
              <MyPrayersTab selectedPrivacy={selectedPrivacy} selectedPrayerCategory={selectedPrayerCategory} />
            ) : (
              <PrayForOthersTab selectedPrivacy={selectedPrivacy} selectedPrayerCategory={selectedPrayerCategory} />
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