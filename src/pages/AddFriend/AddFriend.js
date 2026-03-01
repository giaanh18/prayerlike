import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import CircleButton from '../../components/CircleButton/CircleButton';
import AvatarImage from '../../components/AvatarImage/AvatarImage';
import Home from '../../assets/icons/Homeicon.png';
import PrayerHubIcon from '../../assets/icons/Searchicon.png';
import Plus from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';
import './AddFriend.css';

const AddFriend = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const navigatingRef = useRef(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('Search');
  
  const [incomingInvitations, setIncomingInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pendingOutgoingIds, setPendingOutgoingIds] = useState(new Set());
  const [existingFriendIds, setExistingFriendIds] = useState(new Set());

  useEffect(() => {
    loadFriendInvitations();
    loadRelationshipSets();
  }, []);

  const loadRelationshipSets = async () => {
    try {
      const [pendingResult, friendsResult] = await Promise.all([
        fetch('https://pray-api.yalinelena.church/api/friends/pending', {
          method: 'GET',
          credentials: 'include',
          headers: { 'accept': 'application/json' }
        }).then(r => r.json()),
        fetch('https://pray-api.yalinelena.church/api/friends', {
          method: 'GET',
          credentials: 'include',
          headers: { 'accept': 'application/json' }
        }).then(r => r.json())
      ]);

      if (pendingResult?.data?.outgoing) {
        const outgoingIds = new Set(
          pendingResult.data.outgoing.map(inv => inv.target_user_id)
        );
        setPendingOutgoingIds(outgoingIds);
        console.log('📤 Pending outgoing IDs:', [...outgoingIds]);
      }

      if (friendsResult?.data?.friends) {
        const friendIds = new Set(
          friendsResult.data.friends.map(f => f.user_id)
        );
        setExistingFriendIds(friendIds);
        console.log('👥 Existing friend IDs:', [...friendIds]);
      }
    } catch (error) {
      console.error('❌ Error loading relationship sets:', error);
    }
  };

  const loadFriendInvitations = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getFriendInvitations();
      
      if (result.success) {
        console.log('✅ Loaded invitations:', result);
        console.log('📸 First invitation avatar:', result.incoming?.[0]?.requester_avatar);
        
        // ✅ KHÔNG CẦN XỬ LÝ LẠI - API đã xử lý rồi
        setIncomingInvitations(result.incoming || []);
      } else {
        console.error('❌ Load invitations failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter User ID or Email');
      return;
    }
    
    setSearching(true);
    setSearchError('');
    
    try {
      const result = await ApiService.searchUsers(searchQuery);
      
      console.log('🔍 Search result:', result);
      console.log('📸 First user avatar:', result.users?.[0]?.avatar);
      
      if (result.success) {
        const currentUserId = user?.id || user?.userId;
        
        // ✅ KHÔNG CẦN XỬ LÝ LẠI - API đã xử lý rồi
        const filteredResults = result.users
          .filter(u => u.id !== currentUserId);
        
        setSearchResults(filteredResults);
        
        if (filteredResults.length === 0) {
          setSearchError('No user found with this ID');
        }
      } else {
        setSearchResults([]);
        setSearchError(result.message || 'User not found');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
      setSearchError('Error while searching. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (targetUserId) => {
    try {
      const result = await ApiService.sendFriendInvitation(
        targetUserId,
        'Hello! Let\'s be friends!'
      );

      if (result.success) {
        setPendingOutgoingIds(prev => new Set([...prev, targetUserId]));
        loadFriendInvitations();
        alert('✅ Friend invitation sent!');
      } else {
        alert(`❌ Failed to send invitation: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Add friend error:', error);
      alert('❌ Error sending invitation');
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      const result = await ApiService.respondToInvitation(invitationId, true);

      if (result.success) {
        setIncomingInvitations(prev => 
          prev.filter(inv => inv.id !== invitationId)
        );
        alert('✅ Friend invitation accepted!');
      } else {
        alert(`❌ Failed to accept: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Accept error:', error);
      alert('❌ Error accepting invitation');
    }
  };

  const handleCancel = async (invitationId) => {
    try {
      const result = await ApiService.respondToInvitation(invitationId, false);

      if (result.success) {
        setIncomingInvitations(prev => 
          prev.filter(inv => inv.id !== invitationId)
        );
        alert('✅ Invitation declined');
      } else {
        alert(`❌ Failed to decline: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Cancel error:', error);
      alert('❌ Error declining invitation');
    }
  };

  const handleHome = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setActiveTab('Home');
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate('/context');
  }, [navigate]);

  const handlePrayerHub = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setActiveTab('PrayerHub');
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate('/prayer-hub');
  }, [navigate]);

  const handleAdd = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setActiveTab('Add');
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate('/create-post');
  }, [navigate]);

  const handleSearch = useCallback(() => {
    setActiveTab('Search');
  }, []);

  const handleNova = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setActiveTab('Nova');
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate('/nova');
  }, [navigate]);

  const handleBack = useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setTimeout(() => { navigatingRef.current = false; }, 1000);
    navigate(-1);
  }, [navigate]);

  return (
    <div className="add-friend-page">
      <div className="af-header">
        <button className="af-back-button" onClick={handleBack}>
          ←
        </button>
      </div>

      <div className="af-search-container">
        <input
          type="text"
          className="af-search-input"
          placeholder="Search by User ID or Email (e.g., john@example.com)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchError('');
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
          disabled={searching}
        />
        <button 
          className="af-search-button" 
          onClick={handleSearchUsers}
          disabled={searching}
        >
          {searching ? '⏳' : '🔍'}
        </button>
      </div>

      {searchError && (
        <div className="af-search-error">
          ⚠️ {searchError}
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="af-search-results">
          <h2 className="af-section-title">Search Results</h2>
          {searchResults.map(friend => (
            <div key={friend.id} className="af-user-card">
              <div className="af-user-avatar">
                <AvatarImage
                  userId={friend.id}
                  userName={friend.name || friend.username}
                  src={friend.avatar}
                  size={48}
                  clickable={false}
                />
              </div>
              <div className="af-user-info">
                <h3>{friend.name || friend.username || friend.id}</h3>
                
                {friend.username && friend.username !== friend.name && (
                  <p className="af-user-username">@{friend.username}</p>
                )}
                
                {friend.email && friend.email !== friend.username && (
                  <p className="af-user-email">{friend.email}</p>
                )}
              </div>
              {(pendingOutgoingIds.has(friend.id) || existingFriendIds.has(friend.id)) ? (
                <span className="af-sent-badge">sent</span>
              ) : (
                <button 
                  className="af-add-button"
                  onClick={() => handleAddFriend(friend.id)}
                >
                  add friend
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && incomingInvitations.length > 0 && (
        <div className="af-invitations-section">
          <h2 className="af-section-title">Friend Invitation</h2>
          {incomingInvitations.map(invitation => (
            <div key={invitation.id} className="af-invitation-card">
              <div className="af-user-avatar">
                <AvatarImage
                  userId={invitation.requester_user_id}
                  userName={invitation.requester_name || invitation.requester_user_id}
                  src={invitation.requester_avatar}
                  size={48}
                  clickable={false}
                />
              </div>
              <div className="af-invitation-info">
                <h3>{invitation.requester_name || invitation.requester_user_id}</h3>
                <p>{invitation.message || 'Wants to be your friend'}</p>
                <div className="af-invitation-actions">
                  <button 
                    className="af-accept-button"
                    onClick={() => handleAccept(invitation.id)}
                  >
                    accept
                  </button>
                  <button 
                    className="af-cancel-button"
                    onClick={() => handleCancel(invitation.id)}
                  >
                    cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="af-loading">
          <p>Loading...</p>
        </div>
      )}

      {!loading && !searching && incomingInvitations.length === 0 && searchResults.length === 0 && !searchQuery && (
        <div className="af-empty-state">
          <p>🔍 Search for friends by User ID or Email to start connecting!</p>
        </div>
      )}

      <div className="bottom-navigation">
        <CircleButton 
          provider="Home" 
          iconSrc={Home} 
          onClick={handleHome}
          isActive={activeTab === 'Home'}
          size="medium" 
          ariaLabel="Home"
        />
        <CircleButton 
          provider="PrayerHub" 
          iconSrc={PrayerHubIcon} 
          onClick={handlePrayerHub}
          isActive={activeTab === 'PrayerHub'}
          size="medium" 
          ariaLabel="Prayer Hub"
        />
        <CircleButton 
          provider="Add" 
          iconSrc={Plus} 
          onClick={handleAdd}
          isActive={activeTab === 'Add'}
          size="medium" 
          ariaLabel="Create Post"
        />
        <CircleButton 
          provider="Search" 
          iconSrc={Profile} 
          onClick={handleSearch}
          isActive={activeTab === 'Search'}
          size="medium" 
          ariaLabel="Add Friend"
        />
        <CircleButton 
          provider="Nova" 
          iconSrc={Nova} 
          onClick={handleNova}
          isActive={activeTab === 'Nova'}
          size="medium" 
          ariaLabel="nova小天使"
        />
      </div>
    </div>
  );
};

export default AddFriend;
