// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import ApiService from '../../services/api';
// import CircleButton from '../../components/CircleButton/CircleButton';
// import Home from '../../assets/icons/Homeicon.png';
// import PrayerHubIcon from '../../assets/icons/Searchicon.png';
// import Plus from '../../assets/icons/Addicon.png';
// import Profile from '../../assets/icons/Profileicon.png';
// import Nova from '../../assets/icons/Nova.png';
// import './AddFriend.css';

// const AddFriend = ({ user, onLogout }) => {
//   const navigate = useNavigate();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [activeTab, setActiveTab] = useState('Search');
  
//   // ✅ STATE CHO FRIEND INVITATIONS
//   const [incomingInvitations, setIncomingInvitations] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [searching, setSearching] = useState(false);

//   // ✅ LOAD INVITATIONS KHI COMPONENT MOUNT
//   useEffect(() => {
//     loadFriendInvitations();
//   }, []);

//   // ✅ HÀM LOAD DANH SÁCH LỜI MỜI
//   const loadFriendInvitations = async () => {
//     setLoading(true);
//     try {
//       const result = await ApiService.getFriendInvitations();
      
//       if (result.success) {
//         setIncomingInvitations(result.incoming || []);
//         console.log('✅ Loaded invitations:', result);
//       } else {
//         console.error('❌ Load invitations failed:', result.message);
//       }
//     } catch (error) {
//       console.error('❌ Error loading invitations:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ HÀM TÌM KIẾM NGƯỜI DÙNG
//   const handleSearch = async () => {
//     if (!searchQuery.trim()) {
//       return;
//     }
    
//     setSearching(true);
//     try {
//       const result = await ApiService.searchUsers(searchQuery);
      
//       if (result.success) {
//         // ✅ FILTER OUT CURRENT USER
//         const currentUserId = user?.id || user?.userId;
//         const filteredResults = result.users.filter(u => u.id !== currentUserId);
        
//         setSearchResults(filteredResults);
//         console.log('✅ Search results:', filteredResults);
//       }
//     } catch (error) {
//       console.error('❌ Search error:', error);
//     } finally {
//       setSearching(false);
//     }
//   };

//   // ✅ HÀM GỬI LỜI MỜI KẾT BẠN
//   const handleAddFriend = async (targetUserId) => {
//     try {
//       const result = await ApiService.sendFriendInvitation(
//         targetUserId,
//         'Hello! Let\'s be friends!'
//       );

//       if (result.success) {
//         // ✅ CẬP NHẬT UI - HIỂN THỊ "sent"
//         setSearchResults(prev =>
//           prev.map(friend =>
//             friend.id === targetUserId
//               ? { ...friend, requestSent: true }
//               : friend
//           )
//         );

//         // ✅ RELOAD INVITATIONS
//         loadFriendInvitations();
//       } else {
//         alert(`Failed to send invitation: ${result.message}`);
//       }
//     } catch (error) {
//       console.error('❌ Add friend error:', error);
//       alert('Error sending invitation');
//     }
//   };

//   // ✅ HÀM CHẤP NHẬN LỜI MỜI
//   const handleAccept = async (invitationId) => {
//     try {
//       const result = await ApiService.respondToInvitation(invitationId, true);

//       if (result.success) {
//         // ✅ XÓA KHỎI DANH SÁCH SAU KHI CHẤP NHẬN
//         setIncomingInvitations(prev => 
//           prev.filter(inv => inv.id !== invitationId)
//         );
//       } else {
//         alert(`Failed to accept: ${result.message}`);
//       }
//     } catch (error) {
//       console.error('❌ Accept error:', error);
//       alert('Error accepting invitation');
//     }
//   };

//   // ✅ HÀM TỪ CHỐI LỜI MỜI
//   const handleCancel = async (invitationId) => {
//     try {
//       const result = await ApiService.respondToInvitation(invitationId, false);

//       if (result.success) {
//         // ✅ XÓA KHỎI DANH SÁCH SAU KHI TỪ CHỐI
//         setIncomingInvitations(prev => 
//           prev.filter(inv => inv.id !== invitationId)
//         );
//       } else {
//         alert(`Failed to decline: ${result.message}`);
//       }
//     } catch (error) {
//       console.error('❌ Cancel error:', error);
//       alert('Error declining invitation');
//     }
//   };

//   const handleTabChange = (tab) => {
//     setActiveTab(tab);
//     switch(tab) {
//       case 'Home':
//         navigate('/main');
//         break;
//       case 'PrayerHub':
//         navigate('/prayer-hub');
//         break;
//       case 'Add':
//         navigate('/create-post');
//         break;
//       case 'Search':
//         break;
//       case 'Nova':
//         if (onLogout) onLogout();
//         navigate('/login');
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div className="add-friend-page">
//       {/* ✅ Header với nút Back - GIỮ NGUYÊN STYLE */}
//       <div className="af-header">
//         <button className="af-back-button" onClick={() => navigate(-1)}>
//           ←
//         </button>
//       </div>

//       {/* ✅ Search Bar - GIỮ NGUYÊN STYLE */}
//       <div className="af-search-container">
//         <input
//           type="text"
//           className="af-search-input"
//           placeholder="Family (Friend) Search and Add..."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//           disabled={searching}
//         />
//         <button 
//           className="af-search-button" 
//           onClick={handleSearch}
//           disabled={searching}
//         >
//           {searching ? '⏳' : '🔍'}
//         </button>
//       </div>

//       {/* ✅ Search Results - GIỮ NGUYÊN STYLE */}
//       {searchResults.length > 0 && (
//         <div className="af-search-results">
//           {searchResults.map(friend => (
//             <div key={friend.id} className="af-user-card">
//               <div className="af-user-avatar">
//                 <img 
//                   src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=4A5F8C&color=fff`}
//                   alt={friend.name}
//                 />
//               </div>
//               <div className="af-user-info">
//                 <h3>{friend.name}</h3>
//                 <p>{friend.username}</p>
//               </div>
//               {!friend.requestSent ? (
//                 <button 
//                   className="af-add-button"
//                   onClick={() => handleAddFriend(friend.id)}
//                 >
//                   add friend
//                 </button>
//               ) : (
//                 <span className="af-sent-badge">sent</span>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ✅ Friend Invitations - GIỮ NGUYÊN STYLE */}
//       {!loading && incomingInvitations.length > 0 && (
//         <div className="af-invitations-section">
//           <h2 className="af-section-title">Friend Invitation</h2>
//           {incomingInvitations.map(invitation => (
//             <div key={invitation.id} className="af-invitation-card">
//               <div className="af-user-avatar">
//                 <img 
//                   src={invitation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.requester_user_id)}&background=4A5F8C&color=fff`}
//                   alt={invitation.requester_user_id}
//                 />
//               </div>
//               <div className="af-invitation-info">
//                 <h3>{invitation.requester_user_id}</h3>
//                 <p>{invitation.requester_user_id}</p>
//                 <div className="af-invitation-actions">
//                   <button 
//                     className="af-accept-button"
//                     onClick={() => handleAccept(invitation.id)}
//                   >
//                     accepted
//                   </button>
//                   <button 
//                     className="af-cancel-button"
//                     onClick={() => handleCancel(invitation.id)}
//                   >
//                     cancel
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ✅ Loading State */}
//       {loading && (
//         <div className="af-loading">
//           <p>Loading...</p>
//         </div>
//       )}

//       {/* ✅ Empty State - CHI HIỂN THỊ KHI KHÔNG CÓ DỮ LIỆU */}
//       {!loading && incomingInvitations.length === 0 && searchResults.length === 0 && !searchQuery && (
//         <div className="af-empty-state">
//           <p>Search for friends to start connecting!</p>
//         </div>
//       )}

//       {/* ✅ Bottom Navigation - GIỮ NGUYÊN */}
//       <div className="bottom-navigation">
//         <CircleButton 
//           provider="Home" 
//           iconSrc={Home} 
//           onClick={() => handleTabChange('Home')}
//           isActive={activeTab === 'Home'}
//           size="medium" 
//           ariaLabel="Home"
//         />
//         <CircleButton 
//           provider="PrayerHub" 
//           iconSrc={PrayerHubIcon} 
//           onClick={() => handleTabChange('PrayerHub')}
//           isActive={activeTab === 'PrayerHub'}
//           size="medium" 
//           ariaLabel="Prayer Hub"
//         />
//         <CircleButton 
//           provider="Add" 
//           iconSrc={Plus} 
//           onClick={() => handleTabChange('Add')}
//           isActive={activeTab === 'Add'}
//           size="medium" 
//           ariaLabel="Create Post"
//         />
//         <CircleButton 
//           provider="Search" 
//           iconSrc={Profile} 
//           onClick={() => handleTabChange('Search')}
//           isActive={activeTab === 'Search'}
//           size="medium" 
//           ariaLabel="Add Friend"
//         />
//         <CircleButton 
//           provider="Nova" 
//           iconSrc={Nova} 
//           onClick={() => handleTabChange('Nova')}
//           isActive={activeTab === 'Nova'}
//           size="medium" 
//           ariaLabel="Nova AI"
//         />
//       </div>
//     </div>
//   );
// };

// export default AddFriend;

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

  // ✅ HÀM TÌM KIẾM NGƯỜI DÙNG
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }
    
    setSearching(true);
    try {
      const result = await ApiService.searchUsers(searchQuery);
      
      if (result.success) {
        // ✅ FILTER OUT CURRENT USER
        const currentUserId = user?.id || user?.userId;
        const filteredResults = result.users.filter(u => u.id !== currentUserId);
        
        setSearchResults(filteredResults);
        console.log('✅ Search results:', filteredResults);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // ✅ HÀM GỬI LỜI MỜI KẾT BẠN
  const handleAddFriend = async (targetUserId) => {
    try {
      const result = await ApiService.sendFriendInvitation(
        targetUserId,
        'Hello! Let\'s be friends!'
      );

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
      } else {
        alert(`Failed to send invitation: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Add friend error:', error);
      alert('Error sending invitation');
    }
  };

  // ✅ HÀM CHẤP NHẬN LỜI MỜI
  const handleAccept = async (invitationId) => {
    try {
      const result = await ApiService.respondToInvitation(invitationId, true);

      if (result.success) {
        // ✅ XÓA KHỎI DANH SÁCH SAU KHI CHẤP NHẬN
        setIncomingInvitations(prev => 
          prev.filter(inv => inv.id !== invitationId)
        );
      } else {
        alert(`Failed to accept: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Accept error:', error);
      alert('Error accepting invitation');
    }
  };

  // ✅ HÀM TỪ CHỐI LỜI MỜI
  const handleCancel = async (invitationId) => {
    try {
      const result = await ApiService.respondToInvitation(invitationId, false);

      if (result.success) {
        // ✅ XÓA KHỎI DANH SÁCH SAU KHI TỪ CHỐI
        setIncomingInvitations(prev => 
          prev.filter(inv => inv.id !== invitationId)
        );
      } else {
        alert(`Failed to decline: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Cancel error:', error);
      alert('Error declining invitation');
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
        // ✅ Đã ở trang này rồi, không làm gì
        break;
      case 'Nova':
        // ✅ BỎ CHỨC NĂNG LOGOUT - CHỈ LOG
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
          placeholder="Family (Friend) Search and Add..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* ✅ Search Results */}
      {searchResults.length > 0 && (
        <div className="af-search-results">
          {searchResults.map(friend => (
            <div key={friend.id} className="af-user-card">
              <div className="af-user-avatar">
                <img 
                  src={friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=4A5F8C&color=fff`}
                  alt={friend.name}
                />
              </div>
              <div className="af-user-info">
                <h3>{friend.name}</h3>
                <p>{friend.username}</p>
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
                <p>{invitation.requester_user_id}</p>
                <div className="af-invitation-actions">
                  <button 
                    className="af-accept-button"
                    onClick={() => handleAccept(invitation.id)}
                  >
                    accepted
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
      {!loading && incomingInvitations.length === 0 && searchResults.length === 0 && !searchQuery && (
        <div className="af-empty-state">
          <p>Search for friends to start connecting!</p>
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
        {/* ✅ NÚT NOVA - BỎ CHỨC NĂNG LOGOUT */}
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
