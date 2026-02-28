import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import AppBackground from '../../components/AppBackground/AppBackground';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await ApiService.getNotifications({
        limit: 100,
        offset: 0,
        unread_only: filter === 'unread'
      });

      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unread_count);
        console.log('✅ Notifications loaded:', result.notifications.length);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHỈ ĐÁNH DẤU ĐÃ ĐỌC - KHÔNG NAVIGATE
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      const result = await ApiService.markNotificationAsRead(notification.id);
      
      if (result.success) {
        console.log('✅ Notification marked as read:', notification.id);
        
        // Cập nhật UI - xóa chấm đỏ
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }

    // ❌ ĐÃ XÓA PHẦN NAVIGATE
    // if (notification.post_docid) {
    //   navigate(`/post/${notification.post_docid}`);
    // }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'comment': '💬',
      'amen': '🙏',
      'witness': '✨',
      'friend_request': '👥',
      'friend_accept': '✅',
      'mention': '@',
      'system': '🔔'
    };
    return icons[type] || '📢';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <AppBackground backgroundColor="#2D3656">
      <div className="notifications-container">
        {/* HEADER */}
        <div className="notifications-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← 
          </button>
          <h1>🔔 Notifications</h1>
        </div>

        {/* CONTROLS */}
        <div className="notifications-controls">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>You'll see notifications here when someone interacts with your posts</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.notification_type)}
                </div>

                <div className="notification-content">
                  <div className="notification-header">
                    <span className="notification-actor">
                      {notification.actor_user_id}
                    </span>
                    <span className="notification-time">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>

                  <div className="notification-reason">
                    {notification.reason}
                  </div>

                  {notification.post_title && (
                    <div className="notification-post-preview">
                      <strong>"{notification.post_title}"</strong>
                      {notification.post_preview && (
                        <p>{notification.post_preview}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* ✅ CHẤM ĐỎ CHỈ HIỆN KHI CHƯA ĐỌC */}
                {!notification.is_read && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppBackground>
  );
};

export default Notifications;
