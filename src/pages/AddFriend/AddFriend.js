import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import CircleButton from '../../components/CircleButton/CircleButton';
import Home from '../../assets/icons/Homeicon.png';
import PrayerHubIcon from '../../assets/icons/Searchicon.png';
import Plus from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';
import './AddFriend.css';

const AddFriend = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('Search');
  
  // ✅ STATE CHO FRIEND INVITATIONS
  const [incomingInvitations, setIncomingInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // ✅ LOAD INVITATIONS KHI COMPONENT MOUNT
  useEffect(() => {
    loadFriendInvitations();
  }, []);

  // ✅ HÀM LOAD DANH SÁCH LỜI MỜI
  const loadFriendInvitations = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getFriendInvitations();
      
      if (result.success) {
        setIncomingInvitations(result.incoming || []);
        console.log('✅ Loaded invitations:', result);
      } else {
        console.error('❌ Load invitations failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ HÀM TÌM KIẾM NGƯỜI DÙNG (ĐÃ SỬA - THÊM DEBUG LOGS)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Vui lòng nhập User ID hoặc Email');
      return;
    }
    
    console.log('🔍 Step 1: Search query =', searchQuery);
    
    setSearching(true);
    setSearchError('');
    
    try {
      const result = await ApiService.searchUsers(searchQuery);
      
      console.log('🔍 Step 2: API result =', result);
      console.log('🔍 Step 3: Users =', result.users);
      
      // ✅ THÊM: Log chi tiết từng user
      if (result.users && result.users.length > 0) {
        result.users.forEach((foundUser, index) => {
          console.log(`👤 User ${index + 1}:`, {
            id: foundUser.id,
            name: foundUser.name,
            username: foundUser.username,
            email: foundUser.email,
            tribe: foundUser.tribe
          });
        });
      }
      
      if (result.success) {
        // ✅ FILTER OUT CURRENT USER
        const currentUserId = user?.id || user?.userId;
        console.log('🔍 Step 4: Current user ID =', currentUserId);
        
        const filteredResults = result.users.filter(u => u.id !== currentUserId);
        
        console.log('🔍 Step 5: Filtered results =', filteredResults);
        
        setSearchResults(filteredResults);
        
        // ✅ THÔNG BÁO NẾU KHÔNG TÌM THẤY
        if (filteredResults.length === 0) {
          setSearchError('Không tìm thấy người dùng với ID này');
        }
      } else {
        console.warn('⚠️ Search failed:', result.message);
        setSearchResults([]);
        setSearchError(result.message || 'Không tìm thấy người dùng');
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
      setSearchError('Lỗi khi tìm kiếm. Vui lòng thử lại.');
    } finally {
      setSearching(false);
    }
  };

  // ✅ HÀM GỬI LỜI MỜI KẾT BẠN
  const handleAddFriend = async (targetUserId) => {
    try {
      console.log('👥 Sending friend invitation to:', targetUserId);
      
      const result = await ApiService.sendFriendInvitation(
        targetUserId,
        'Hello! Let\'s be friends!'
      );

      console.log('📥 Send invitation result:', result);

      if (result.success) {
        // ✅ CẬP NHẬT UI - HIỂN THỊ "sent"
        setSearchResults(prev =>
          prev.map(friend =>
            friend.id === targetUserId
              ? { ...friend, requestSent: true }
              : friend
          )
        );

        // ✅ RELOAD INVITATIONS
        loadFriendInvitations();
        
        alert('✅ Đã gửi lời mời kết bạn!');
      } else {
        alert(`❌ Gửi lời mời thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Add friend error:', error);
      alert('❌ Lỗi khi gửi lời mời');
    }
  };

  // ✅ HÀM CHẤP NHẬN LỜI MỜI
  const handleAccept = async (invitationId) => {
    try {
      console.log('✅ Accepting invitation:', invitationId);
      
      const result = await ApiService.respondToInvitation(invitationId, true);

      console.log('📥 Accept result:', result);

      if (result.success) {
        setIncomingInvitations(prev => 
          prev.filter(inv => inv.id !== invitationId)
        );
        
        alert('✅ Đã chấp nhận lời mời kết bạn!');
      } else {
        alert(`❌ Chấp nhận thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Accept error:', error);
      alert('❌ Lỗi khi chấp nhận lời mời');
    }
  };

  // ✅ HÀM TỪ CHỐI LỜI MỜI
  const handleCancel = async (invitationId) => {
    try {
      console.log('❌ Declining invitation:', invitationId);
      
      const result = await ApiService.respondToInvitation(invitationId, false);

      console.log('📥 Decline result:', result);

      if (result.success) {
        setIncomingInvitations(prev => 
          prev.filter(inv => inv.id !== invitationId)
        );
        
        alert('✅ Đã từ chối lời mời');
      } else {
        alert(`❌ Từ chối thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Cancel error:', error);
      alert('❌ Lỗi khi từ chối lời mời');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch(tab) {
      case 'Home':
        navigate('/context');
        break;
      case 'PrayerHub':
        navigate('/prayer-hub');
        break;
      case 'Add':
        navigate('/create-post');
        break;
      case 'Search':
        break;
      case 'Nova':
        console.log('🤖 Nova clicked - No action');
        break;
      default:
        break;
    }
  };

  return (
    <div className="add-friend-page">
      {/* ✅ Header với nút Back */}
      <div className="af-header">
        <button className="af-back-button" onClick={() => navigate(-1)}>
          ←
        </button>
      </div>

      {/* ✅ Search Bar */}
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
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={searching}
        />
        <button 
          className="af-search-button" 
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? '⏳' : '🔍'}
        </button>
      </div>

      {/* ✅ HIỂN THỊ LỖI SEARCH */}
      {searchError && (
        <div className="af-search-error">
          ⚠️ {searchError}
        </div>
      )}

      {/* ✅ Search Results - ĐÃ SỬA HIỂN THỊ TÊN */}
      {searchResults.length > 0 && (
        <div className="af-search-results">
          <h2 className="af-section-title">Search Results</h2>
          {searchResults.map(friend => (
            <div key={friend.id} className="af-user-card">
              <div className="af-user-avatar">
                <img 
                  src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name || friend.username || 'User')}&background=4A5F8C&color=fff`}
                  alt={friend.name || friend.username}
                />
              </div>
              <div className="af-user-info">
                {/* ✅ SỬA: Hiển thị tên đầy đủ với fallback */}
                <h3>{friend.name || friend.username || friend.id}</h3>
                
                {/* ✅ SỬA: Hiển thị username nếu khác name */}
                {friend.username && friend.username !== friend.name && (
                  <p className="af-user-username">@{friend.username}</p>
                )}
                
                {/* ✅ SỬA: Hiển thị email nếu khác username */}
                {friend.email && friend.email !== friend.username && (
                  <p className="af-user-email">{friend.email}</p>
                )}
              </div>
              {!friend.requestSent ? (
                <button 
                  className="af-add-button"
                  onClick={() => handleAddFriend(friend.id)}
                >
                  add friend
                </button>
              ) : (
                <span className="af-sent-badge">sent</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ Friend Invitations */}
      {!loading && incomingInvitations.length > 0 && (
        <div className="af-invitations-section">
          <h2 className="af-section-title">Friend Invitation</h2>
          {incomingInvitations.map(invitation => (
            <div key={invitation.id} className="af-invitation-card">
              <div className="af-user-avatar">
                <img 
                  src={invitation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.requester_user_id)}&background=4A5F8C&color=fff`}
                  alt={invitation.requester_user_id}
                />
              </div>
              <div className="af-invitation-info">
                <h3>{invitation.requester_user_id}</h3>
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

      {/* ✅ Loading State */}
      {loading && (
        <div className="af-loading">
          <p>Loading...</p>
        </div>
      )}

      {/* ✅ Empty State */}
      {!loading && !searching && incomingInvitations.length === 0 && searchResults.length === 0 && !searchQuery && (
        <div className="af-empty-state">
          <p>🔍 Search for friends by User ID or Email to start connecting!</p>
        </div>
      )}

      {/* ✅ Bottom Navigation */}
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
          iconSrc={PrayerHubIcon} 
          onClick={() => handleTabChange('PrayerHub')}
          isActive={activeTab === 'PrayerHub'}
          size="medium" 
          ariaLabel="Prayer Hub"
        />
        <CircleButton 
          provider="Add" 
          iconSrc={Plus} 
          onClick={() => handleTabChange('Add')}
          isActive={activeTab === 'Add'}
          size="medium" 
          ariaLabel="Create Post"
        />
        <CircleButton 
          provider="Search" 
          iconSrc={Profile} 
          onClick={() => handleTabChange('Search')}
          isActive={activeTab === 'Search'}
          size="medium" 
          ariaLabel="Add Friend"
        />
        <CircleButton 
          provider="Nova" 
          iconSrc={Nova} 
          onClick={() => handleTabChange('Nova')}
          isActive={activeTab === 'Nova'}
          size="medium" 
          ariaLabel="nova小天使"
        />
      </div>
    </div>
  );
};

export default AddFriend;
