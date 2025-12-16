// // import React, { useState } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import CircleButton from '../../components/CircleButton/CircleButton';
// // import './CreatePostScreen.css';

// // // Import icons
// // import Home from '../../assets/icons/Homeicon.png';
// // import Search from '../../assets/icons/Searchicon.png';
// // import Add from '../../assets/icons/Addicon.png';
// // import Profile from '../../assets/icons/Profileicon.png';
// // import Nova from '../../assets/icons/Nova.png';

// // const CreatePostScreen = ({ onLogout }) => {
// //   const navigate = useNavigate();
  
// //   const [activeTab, setActiveTab] = useState('Add');

// //   const handleCreatePost = () => {
// //     console.log('🆕 Already on create post page');
// //     setActiveTab('Add');
// //   };

// //   const handleHome = () => {
// //     console.log('🏠 Navigate to home');
// //     setActiveTab('Home');
// //     navigate('/');
// //   };

// //   const handleSearch = () => {
// //     console.log('🔍 Navigate to Prayer Hub');
// //     setActiveTab('Search');
// //     navigate('/prayer-hub');
// //   };

// //   // ✅ SỬA HÀM NÀY - THÊM navigate('/friends')
// //   const handleProfile = () => {
// //     console.log('👤 Navigate to Friends List');
// //     setActiveTab('Profile');
// //     navigate('/friends'); // ✅ THÊM DÒNG NÀY
// //   };

// //   const handleLogout = async () => {
// //     console.log('🚪 Logout clicked');
// //     setActiveTab('Nova');
// //     if (onLogout) {
// //       await onLogout();
// //     }
// //     navigate('/login', { replace: true });
// //   };

// //   return (
// //     <div className="create-post-page">
// //       <div className="centered-layout">
// //         <button 
// //           className="back-button" 
// //           onClick={() => navigate('/')} 
// //           aria-label="返回首頁"
// //         >
// //           ←
// //         </button>

// //         <div className="button-container">
// //           <button
// //             className="post-button"
// //             onClick={() => navigate('/create-post/text')}
// //             aria-label="建立文字貼文"
// //           >
// //             Create text post
// //           </button>
          
// //           <button
// //             className="post-button"
// //             onClick={() => navigate('/create-post/audio', { 
// //               state: { autoStart: true }
// //             })}
// //             aria-label="建立音訊貼文"
// //           >
// //             Create voice post
// //           </button>
// //         </div>
// //       </div>

// //       {/* ✅ BOTTOM NAVIGATION */}
// //       <div className="bottom-navigation">
// //         <CircleButton
// //           provider="Home"
// //           iconSrc={Home}
// //           onClick={handleHome}
// //           isActive={activeTab === 'Home'}
// //           size="medium"
// //           ariaLabel="首頁"
// //         />
// //         <CircleButton
// //           provider="Search"
// //           iconSrc={Search}
// //           onClick={handleSearch}
// //           isActive={activeTab === 'Search'}
// //           size="medium"
// //           ariaLabel="Prayer Hub"
// //         />
// //         <CircleButton
// //           provider="Add"
// //           iconSrc={Add}
// //           onClick={handleCreatePost}
// //           isActive={activeTab === 'Add'}
// //           size="medium"
// //           ariaLabel="新增貼文"
// //         />
// //         <CircleButton
// //           provider="Profile"
// //           iconSrc={Profile}
// //           onClick={handleProfile} // ✅ ĐÃ SỬA HÀM NÀY Ở TRÊN
// //           isActive={activeTab === 'Profile'}
// //           size="medium"
// //           ariaLabel="好友列表"
// //         />
// //         <CircleButton
// //           provider="Nova"
// //           iconSrc={Nova}
// //           onClick={handleLogout}
// //           isActive={activeTab === 'Nova'}
// //           size="medium"
// //           ariaLabel="登出"
// //         />
// //       </div>
// //     </div>
// //   );
// // };

// // export default CreatePostScreen;

// import React, { useState, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import CircleButton from '../../components/CircleButton/CircleButton';
// import './CreatePostScreen.css';

// // Import icons
// import Home from '../../assets/icons/Homeicon.png';
// import Search from '../../assets/icons/Searchicon.png';
// import Add from '../../assets/icons/Addicon.png';
// import Profile from '../../assets/icons/Profileicon.png';
// import Nova from '../../assets/icons/Nova.png';

// const CreatePostScreen = ({ onLogout }) => {
//   const navigate = useNavigate();
//   const navigatingRef = useRef(false);
  
//   const [activeTab, setActiveTab] = useState('Add');

//   const handleCreatePost = () => {
//     console.log('🆕 Already on create post page');
//     setActiveTab('Add');
//   };

//   const handleHome = useCallback(() => {
//     if (navigatingRef.current) {
//       console.log('⚠️ Navigation already in progress, ignoring...');
//       return;
//     }

//     console.log('🏠 Navigate to home');
//     navigatingRef.current = true;
//     setActiveTab('Home');
    
//     setTimeout(() => {
//       navigatingRef.current = false;
//     }, 500);
    
//     navigate('/main');
//   }, [navigate]);

//   const handleSearch = useCallback(() => {
//     if (navigatingRef.current) {
//       console.log('⚠️ Navigation already in progress, ignoring...');
//       return;
//     }

//     console.log('🔍 Navigate to Prayer Hub');
//     navigatingRef.current = true;
//     setActiveTab('Search');
    
//     setTimeout(() => {
//       navigatingRef.current = false;
//     }, 500);
    
//     navigate('/prayer-hub');
//   }, [navigate]);

//   const handleProfile = useCallback(() => {
//     if (navigatingRef.current) {
//       console.log('⚠️ Navigation already in progress, ignoring...');
//       return;
//     }

//     console.log('👤 Navigate to Add Friend');
//     navigatingRef.current = true;
//     setActiveTab('Profile');
    
//     setTimeout(() => {
//       navigatingRef.current = false;
//     }, 500);
    
//     navigate('/addfriend');
//   }, [navigate]);

//   const handleLogout = async () => {
//     console.log('🚪 Logout clicked');
//     setActiveTab('Nova');
//     if (onLogout) {
//       await onLogout();
//     }
//     navigate('/login', { replace: true });
//   };

//   return (
//     <div className="create-post-page">
//       <div className="centered-layout">
//         <button 
//           className="back-button" 
//           onClick={() => navigate('/main')}
//           aria-label="返回首頁"
//         >
//           ←
//         </button>

//         <div className="button-container">
//           <button
//             className="post-button"
//             onClick={() => navigate('/create-post/text')}
//             aria-label="建立文字貼文"
//           >
//             Create text post
//           </button>
          
//           <button
//             className="post-button"
//             onClick={() => navigate('/create-post/audio', { 
//               state: { autoStart: true }
//             })}
//             aria-label="建立音訊貼文"
//           >
//             Create voice post
//           </button>
//         </div>
//       </div>

//       <div className="bottom-navigation">
//         <CircleButton
//           provider="Home"
//           iconSrc={Home}
//           onClick={handleHome}
//           isActive={activeTab === 'Home'}
//           size="medium"
//           ariaLabel="首頁"
//         />
//         <CircleButton
//           provider="Search"
//           iconSrc={Search}
//           onClick={handleSearch}
//           isActive={activeTab === 'Search'}
//           size="medium"
//           ariaLabel="Prayer Hub"
//         />
//         <CircleButton
//           provider="Add"
//           iconSrc={Add}
//           onClick={handleCreatePost}
//           isActive={activeTab === 'Add'}
//           size="medium"
//           ariaLabel="新增貼文"
//         />
//         <CircleButton
//           provider="Profile"
//           iconSrc={Profile}
//           onClick={handleProfile}
//           isActive={activeTab === 'Profile'}
//           size="medium"
//           ariaLabel="新增好友"
//         />
//         <CircleButton
//           provider="Nova"
//           iconSrc={Nova}
//           onClick={handleLogout}
//           isActive={activeTab === 'Nova'}
//           size="medium"
//           ariaLabel="登出"
//         />
//       </div>
//     </div>
//   );
// };

// export default CreatePostScreen;

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CircleButton from '../../components/CircleButton/CircleButton';
import './CreatePostScreen.css';

// Import icons
import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

const CreatePostScreen = ({ onLogout }) => {
  const navigate = useNavigate();
  const navigatingRef = useRef(false);
  
  const [activeTab, setActiveTab] = useState('Add');

  const handleCreatePost = () => {
    console.log('🆕 Already on create post page');
    setActiveTab('Add');
  };

  const handleHome = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('🏠 Navigate to home');
    navigatingRef.current = true;
    setActiveTab('Home');
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/context');
  }, [navigate]);

  const handleSearch = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('🔍 Navigate to Prayer Hub');
    navigatingRef.current = true;
    setActiveTab('Search');
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/prayer-hub');
  }, [navigate]);

  const handleProfile = useCallback(() => {
    if (navigatingRef.current) {
      console.log('⚠️ Navigation already in progress, ignoring...');
      return;
    }

    console.log('👤 Navigate to Add Friend');
    navigatingRef.current = true;
    setActiveTab('Profile');
    
    setTimeout(() => {
      navigatingRef.current = false;
    }, 500);
    
    navigate('/addfriend');
  }, [navigate]);

  return (
    <div className="create-post-page">
      <div className="centered-layout">
        <button 
          className="back-button" 
          onClick={() => navigate('/context')}
          aria-label="返回首頁"
        >
          ←
        </button>

        <div className="button-container">
          <button
            className="post-button"
            onClick={() => navigate('/create-post/text')}
            aria-label="建立文字貼文"
          >
            Create text post
          </button>
          
          <button
            className="post-button"
            onClick={() => navigate('/create-post/audio', { 
              state: { autoStart: true }
            })}
            aria-label="建立音訊貼文"
          >
            Create voice post
          </button>
        </div>
      </div>

      <div className="bottom-navigation">
        <CircleButton
          provider="Home"
          iconSrc={Home}
          onClick={handleHome}
          isActive={activeTab === 'Home'}
          size="medium"
          ariaLabel="首頁"
        />
        <CircleButton
          provider="Search"
          iconSrc={Search}
          onClick={handleSearch}
          isActive={activeTab === 'Search'}
          size="medium"
          ariaLabel="Prayer Hub"
        />
        <CircleButton
          provider="Add"
          iconSrc={Add}
          onClick={handleCreatePost}
          isActive={activeTab === 'Add'}
          size="medium"
          ariaLabel="新增貼文"
        />
        <CircleButton
          provider="Profile"
          iconSrc={Profile}
          onClick={handleProfile}
          isActive={activeTab === 'Profile'}
          size="medium"
          ariaLabel="新增好友"
        />
        {/* ✅ NÚT NOVA - BỎ CHỨC NĂNG LOGOUT */}
        <CircleButton
          provider="Nova"
          iconSrc={Nova}
          onClick={() => {
            console.log('🤖 Nova clicked - No action');
          }}
          isActive={activeTab === 'Nova'}
          size="medium"
          ariaLabel="nova小天使"
        />
      </div>
    </div>
  );
};

export default CreatePostScreen;
