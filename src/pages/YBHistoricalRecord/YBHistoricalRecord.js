// // src/pages/YBHistoricalRecord/YBHistoricalRecord.jsx
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import AppBackground from '../../components/AppBackground/AppBackground';
// import CircleButton from '../../components/CircleButton/CircleButton';

// // Import bottom navigation icons
// import Home from '../../assets/icons/Homeicon.png';
// import Search from '../../assets/icons/Searchicon.png';
// import Add from '../../assets/icons/Addicon.png';
// import Profile from '../../assets/icons/Profileicon.png';
// import Nova from '../../assets/icons/Nova.png';

// import './YBHistoricalRecord.css';

// const YBHistoricalRecord = () => {
//   const navigate = useNavigate();

//   // Mock data - bạn có thể thay bằng API call
//   const recentRecord = {
//     date: 'September 8th',
//     time: '5:25 PM',
//     count: 5,
//     multiplier: 5
//   };

//   const pastRecords = [
//     { date: 'June 15th', time: '5:25 PM', action: 'Posted 2 prayers', multiplier: 2 },
//     { date: 'June 20th', time: '8:25 PM', action: 'Amen 2 prayers', multiplier: 0.4 },
//     { date: 'June 25th', time: '8:25 AM', action: 'Posted 2 prayer messages', multiplier: 2 },
//     { date: 'June 30th', time: '8:25 AM', action: 'Five prayer requests will be posted on the testimony wall', multiplier: 5 }
//   ];

//   return (
//     <AppBackground backgroundColor="#2D3656">
//       <div className="yb-historical-container">
//         {/* Header */}
//         <div className="yb-header">
//           <button className="yb-back-button" onClick={() => navigate(-1)}>
//             ←
//           </button>
//           <h1 className="yb-title">YB historical record</h1>
//           <div className="yb-coin-display">
//             <span className="yb-coin-icon">💰</span>
//             <span className="yb-coin-amount">14.4</span>
//           </div>
//         </div>

//         {/* Recent Achievement */}
//         <div className="yb-section">
//           <h2 className="yb-section-title">YB recently achieved a record.</h2>
//           <div className="yb-record-card yb-recent">
//             <p className="yb-record-text">
//               On {recentRecord.date}, at {recentRecord.time}, {recentRecord.count} prayer messages were posted.
//             </p>
//             <span className="yb-multiplier">x {recentRecord.multiplier}</span>
//           </div>
//         </div>

//         {/* Past Historical Record */}
//         <div className="yb-section">
//           <h2 className="yb-section-title">Past historical record</h2>
//           <div className="yb-records-list">
//             {pastRecords.map((record, index) => (
//               <div key={index} className="yb-record-card">
//                 <p className="yb-record-text">{record.action} at {record.time} on {record.date}</p>
//                 <span className="yb-multiplier">x {record.multiplier}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Bottom Navigation - GIỐNG HỆT CÁC TRANG KHÁC */}
//         <div className="bottom-navigation">
//           <CircleButton 
//             provider="Home" 
//             iconSrc={Home} 
//             onClick={() => navigate('/')}
//             size="medium" 
//             ariaLabel="首頁" 
//           />
          
//           <CircleButton 
//             provider="PrayerHub" 
//             iconSrc={Search} 
//             onClick={() => navigate('/prayer-hub')}
//             size="medium" 
//             ariaLabel="Prayer Hub" 
//           />
          
//           <CircleButton 
//             provider="Add" 
//             iconSrc={Add} 
//             onClick={() => navigate('/create-post')}
//             size="medium" 
//             ariaLabel="新增貼文" 
//           />
          
//           <CircleButton 
//             provider="Search" 
//             iconSrc={Profile} 
//             onClick={() => navigate('/addfriend')}
//             size="medium" 
//             ariaLabel="搜尋好友" 
//           />
          
//           <CircleButton 
//             provider="Nova" 
//             iconSrc={Nova} 
//             onClick={() => console.log('Nova clicked')}
//             size="medium" 
//             ariaLabel="nova小天使" 
//           />
//         </div>
//       </div>
//     </AppBackground>
//   );
// };

// export default YBHistoricalRecord;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import AppBackground from '../../components/AppBackground/AppBackground';
import CircleButton from '../../components/CircleButton/CircleButton';

// Import bottom navigation icons
import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

import './YBHistoricalRecord.css';

const YBHistoricalRecord = ({ user }) => {
  const navigate = useNavigate();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const userId = user?.id || user?.userId || ApiService.getCurrentUserId();

  // ✅ Load balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!userId) {
        setError('Không tìm thấy user ID');
        setLoading(false);
        return;
      }

      console.log('💰 Fetching balance for user:', userId);
      const result = await ApiService.getUserBalance(userId);
      
      if (result.success) {
        setBalance(result.balance);
        console.log('✅ Balance loaded:', result.balance);
      } else {
        setError(result.message);
        console.error('❌ Balance error:', result.message);
      }
    };

    fetchBalance();
  }, [userId]);

  // ✅ Load transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return;

      setLoading(true);
      console.log(`📜 Fetching transactions - Page ${page}`);
      
      const result = await ApiService.getYCoinTransactions({
        user_id: userId,
        page: page,
        limit: 20
      });

      if (result.success) {
        console.log(`✅ Loaded ${result.transactions.length} transactions`);
        
        const formatted = result.transactions.map(ApiService.formatYCoinTransaction);
        
        if (page === 1) {
          setTransactions(formatted);
        } else {
          setTransactions(prev => [...prev, ...formatted]);
        }

        setHasMore(formatted.length === 20);
        setError(null);
      } else {
        setError(result.message);
        console.error('❌ Transactions error:', result.message);
      }
      setLoading(false);
    };

    fetchTransactions();
  }, [userId, page]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      console.log('📄 Loading more transactions...');
      setPage(prev => prev + 1);
    }
  };

  // ✅ Lấy recent record (transaction đầu tiên)
  const recentRecord = transactions.length > 0 ? transactions[0] : null;

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="yb-historical-container">
        {/* Header */}
        <div className="yb-header">
          <button className="yb-back-button" onClick={() => navigate(-1)}>
            ←
          </button>
          <h1 className="yb-title">YB historical record</h1>
          <div className="yb-coin-display">
            <span className="yb-coin-icon">💰</span>
            <span className="yb-coin-amount">{balance.toFixed(1)}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="yb-error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Recent Achievement */}
        {recentRecord && (
          <div className="yb-section">
            <h2 className="yb-section-title">YB recently achieved a record.</h2>
            <div className="yb-record-card yb-recent">
              <div className="yb-record-icon" style={{ color: recentRecord.eventColor }}>
                {recentRecord.eventLabel.split(' ')[0]}
              </div>
              <div className="yb-record-content">
                <p className="yb-record-text">{recentRecord.eventLabel}</p>
                <p className="yb-record-date">{recentRecord.formattedDate}</p>
              </div>
              <span 
                className={`yb-multiplier ${recentRecord.isPositive ? 'positive' : 'negative'}`}
              >
                {recentRecord.formattedAmount}
              </span>
            </div>
          </div>
        )}

        {/* Past Historical Record */}
        <div className="yb-section">
          <h2 className="yb-section-title">Past historical record</h2>
          
          {loading && page === 1 ? (
            <div className="yb-loading">
              <div className="yb-loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : (
            <div className="yb-records-list">
              {transactions.slice(1).map((record, index) => (
                <div key={record.id || index} className="yb-record-card">
                  <div className="yb-record-icon" style={{ color: record.eventColor }}>
                    {record.eventLabel.split(' ')[0]}
                  </div>
                  <div className="yb-record-content">
                    <p className="yb-record-text">{record.eventLabel}</p>
                    <p className="yb-record-date">{record.formattedDate}</p>
                  </div>
                  <span 
                    className={`yb-multiplier ${record.isPositive ? 'positive' : 'negative'}`}
                  >
                    {record.formattedAmount}
                  </span>
                </div>
              ))}

              {hasMore && (
                <button 
                  className="yb-load-more"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              )}

              {!loading && transactions.length === 0 && (
                <div className="yb-no-data">
                  <p>📭 Chưa có giao dịch nào</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-navigation">
          <CircleButton 
            provider="Home" 
            iconSrc={Home} 
            onClick={() => navigate('/')}
            size="medium" 
            ariaLabel="首頁" 
          />
          
          <CircleButton 
            provider="PrayerHub" 
            iconSrc={Search} 
            onClick={() => navigate('/prayer-hub')}
            size="medium" 
            ariaLabel="Prayer Hub" 
          />
          
          <CircleButton 
            provider="Add" 
            iconSrc={Add} 
            onClick={() => navigate('/create-post')}
            size="medium" 
            ariaLabel="新增貼文" 
          />
          
          <CircleButton 
            provider="Search" 
            iconSrc={Profile} 
            onClick={() => navigate('/addfriend')}
            size="medium" 
            ariaLabel="搜尋好友" 
          />
          
          <CircleButton 
            provider="Nova" 
            iconSrc={Nova} 
            onClick={() => console.log('Nova clicked')}
            size="medium" 
            ariaLabel="nova小天使" 
          />
        </div>
      </div>
    </AppBackground>
  );
};

export default YBHistoricalRecord;
