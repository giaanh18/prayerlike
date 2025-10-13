// ./src/components/NotificationBell/NotificationBell.js
import React from 'react';
import './NotificationBell.css';

const NotificationBell = ({ 
  count = 0,
  onClick,
  size = 'medium',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'notification-bell-small',
    medium: 'notification-bell-medium',
    large: 'notification-bell-large'
  };

  return (
    <button
      className={`notification-bell ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      aria-label={`通知 ${count > 0 ? `(${count})` : ''}`}
    >
      <span className="bell-icon">🔔</span>
      {count > 0 && (
        <span className="notification-badge">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
