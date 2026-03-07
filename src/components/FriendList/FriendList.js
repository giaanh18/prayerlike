// ./src/components/FriendList/FriendList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import './FriendList.css';

// Import components
import CircleButton from '../CircleButton/CircleButton';
import AvatarImage from '../AvatarImage/AvatarImage';

import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

const FriendList = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [family, setFamily] = useState([]);
  const [loading, setLoading] = useState(true);

  // Set initial state to Profile (corresponding to Search icon position)
  const [activeTab, setActiveTab] = useState(null);
  const [viewMode, setViewMode] = useState('friends');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [viewMode, user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = user?.id || user?.userId || ApiService.getCurrentUserId();

      // Try loading even without userId (api may have mock data)
      if (viewMode === 'friends') {
        const result = await ApiService.getFriends(userId);
        console.log('👥 Friends API result:', result);
        if (result.success) {
          console.log('📥 Friends data:', result.friends);
          setFriends(result.friends || []);
        }
      } else {
        const result = await ApiService.getFamily(userId);
        console.log('👨‍👩‍👧‍👦 Family API result:', result);
        if (result.success) {
          console.log('📥 Family data:', result.family);
          setFamily(result.family || []);
        }
      }
    } catch (error) {
      console.error('💥 Data loading error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ❌ ĐÃ XÓA: handlePersonClick function

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'Home':
        navigate('/main');
        break;
      case 'PrayerHub':
        navigate('/prayer-hub');
        break;
      case 'Add':
        navigate('/create-post');
        break;
      case 'Search':
        // Already on friends page, no action
        break;
      case 'Nova':
        if (onLogout) onLogout();
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const currentList = viewMode === 'friends' ? friends : family;
  const emptyMessage = viewMode === 'friends'
    ? 'No friends yet, start adding friends to build your prayer network!'
    : 'No family members yet, invite your family to join!';

  return (
    <div className="friend-list-page">
      <div className="fl-header">
        <button className="fl-back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className="fl-page-title">
          {viewMode === 'friends' ? 'Friends List' : 'Family List'}
        </h1>
      </div>

      <div className="fl-container">
        {loading ? (
          <div className="fl-loading">
            <div className="fl-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="fl-error">
            <div className="fl-error-icon">⚠️</div>
            <h3>Loading Failed</h3>
            <p>{error}</p>
          </div>
        ) : currentList.length > 0 ? (
          <div className="fl-grid">
            {currentList.map(person => (
              <div
                key={person.id}
                className="fl-card"
                style={{ cursor: 'default' }}
              >
                <div className="fl-avatar">
                  <AvatarImage
                    userId={person.id || person.username}
                    userName={person.name}
                    src={person.avatar}
                    size={64}
                    clickable={false}
                  />
                </div>
                <div className="fl-info">
                  <div className="fl-name">{person.id}</div>
                  <div className="fl-nickname">{person.name && person.name !== person.id ? person.name : ''}</div>
                  {person.relationship && (
                    <div className="fl-relationship">{person.relationship}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="fl-empty">
            <div className="fl-empty-icon">
              {viewMode === 'friends' ? '👥' : '👨‍👩‍👧‍👦'}
            </div>
            <h3>
              {viewMode === 'friends' ? 'No Friends' : 'No Family Members'}
            </h3>
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* Unified bottom navigation: Using same structure and classes as Context */}
      <div className="bottom-navigation">
        <CircleButton
          provider="Home"
          iconSrc={Home}
          onClick={() => handleTabChange('Home')}
          isActive={activeTab === 'Home'}
          size="medium"
          ariaLabel="Home"
        />
        <CircleButton
          provider="PrayerHub"
          iconSrc={Search}
          onClick={() => handleTabChange('PrayerHub')}
          isActive={activeTab === 'PrayerHub'}
          size="medium"
          ariaLabel="Prayer Hub"
        />
        <CircleButton
          provider="Add"
          iconSrc={Add}
          onClick={() => handleTabChange('Add')}
          isActive={activeTab === 'Add'}
          size="medium"
          ariaLabel="Add Post"
        />
        <CircleButton
          provider="Search"
          iconSrc={Profile}
          onClick={() => handleTabChange('Search')}
          isActive={activeTab === 'Search'}
          size="medium"
          ariaLabel="Profile"
        />
        <CircleButton
          provider="Nova"
          iconSrc={Nova}
          onClick={() => handleTabChange('Nova')}
          isActive={activeTab === 'Nova'}
          size="medium"
          ariaLabel="Nova Assistant"
        />
      </div>
    </div>
  );
};

export default FriendList;
