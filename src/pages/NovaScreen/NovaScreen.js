import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import CircleButton from '../../components/CircleButton/CircleButton';
import './NovaScreen.css';

// Icon imports
import Home from '../../assets/icons/Homeicon.png';
import Search from '../../assets/icons/Searchicon.png';
import Add from '../../assets/icons/Addicon.png';
import Profile from '../../assets/icons/Profileicon.png';
import Nova from '../../assets/icons/Nova.png';

function NovaScreen({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Nova');
  
  // ✅ AI State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [currentSessionUuid, setCurrentSessionUuid] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I am Nova, your AI assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // ✅ AI Usage State - DAILY LIMIT
  const [aiUsage, setAiUsage] = useState({ 
    used: 0, 
    limit: 10,
    resetTime: null // Thời gian reset (midnight)
  });
  
  // ✅ Exit Confirmation State
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Load AI sessions khi component mount
  useEffect(() => {
    loadAISessions();
    loadAIUsage();
    
    // ✅ Check reset time mỗi phút
    const checkResetInterval = setInterval(() => {
      checkDailyReset();
    }, 60000); // Check every minute
    
    return () => clearInterval(checkResetInterval);
  }, []);

  // ✅ Check if need to reset daily counter
  const checkDailyReset = () => {
    const now = new Date();
    const today = now.toDateString();
    const lastResetDate = localStorage.getItem('aiUsageResetDate');
    
    if (lastResetDate !== today) {
      console.log('🔄 Resetting daily AI usage counter');
      localStorage.setItem('aiUsageResetDate', today);
      localStorage.setItem('aiUsageCount', '0');
      loadAIUsage();
    }
  };

  // ✅ Get time until reset
  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, timestamp: tomorrow };
  };

  // ✅ Load danh sách conversations
  const loadAISessions = async () => {
    console.log('📋 Loading AI sessions...');
    const result = await ApiService.getAISessions();
    
    if (result.success && result.sessions) {
      const formattedSessions = result.sessions.map(session => ({
        id: session.session_uuid,
        title: session.title || 'Untitled Chat',
        preview: session.messages?.[0]?.content?.substring(0, 50) || 'No messages',
        timestamp: new Date(session.last_interaction_at || session.created_at).toLocaleString()
      }));
      
      setConversations(formattedSessions);
      console.log('✅ Loaded', formattedSessions.length, 'sessions');
    }
  };

  // ✅ Load AI usage - DAILY BASED
  const loadAIUsage = async () => {
    // Check if need to reset
    checkDailyReset();
    
    // Get from localStorage (for daily tracking)
    const today = new Date().toDateString();
    const lastResetDate = localStorage.getItem('aiUsageResetDate');
    
    let usedCount = 0;
    
    if (lastResetDate === today) {
      usedCount = parseInt(localStorage.getItem('aiUsageCount') || '0');
    } else {
      // New day, reset
      localStorage.setItem('aiUsageResetDate', today);
      localStorage.setItem('aiUsageCount', '0');
    }
    
    const resetInfo = getTimeUntilReset();
    
    setAiUsage({
      used: usedCount,
      limit: 10,
      resetTime: resetInfo.timestamp,
      hoursUntilReset: resetInfo.hours,
      minutesUntilReset: resetInfo.minutes
    });
    
    console.log('📊 Daily AI Usage:', {
      used: usedCount,
      limit: 10,
      remaining: 10 - usedCount,
      resetIn: `${resetInfo.hours}h ${resetInfo.minutes}m`
    });
  };

  // ✅ Increment usage count
  const incrementUsageCount = () => {
    const newCount = aiUsage.used + 1;
    localStorage.setItem('aiUsageCount', newCount.toString());
    loadAIUsage();
  };

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Handle send message với DAILY LIMIT
  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    // ✅ Check DAILY usage limit
    if (aiUsage.used >= aiUsage.limit) {
      const resetInfo = getTimeUntilReset();
      alert(
        `⚠️ Bạn đã sử dụng hết ${aiUsage.limit} câu hỏi trong ngày hôm nay!\n\n` +
        `Giới hạn sẽ được làm mới sau: ${resetInfo.hours} giờ ${resetInfo.minutes} phút\n` +
        `(Vào lúc 00:00 ngày mai)`
      );
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // ✅ Gọi API thực
      const result = await ApiService.sendAIMessage(
        [
          { role: 'user', content: userMessage.content }
        ],
        currentSessionUuid
      );

      if (result.success) {
        // ✅ Lấy response từ AI
        const aiContent = result.message?.content || 
                         result.message?.additionalProp1 || 
                         'Sorry, I could not generate a response.';

        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: aiContent,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // ✅ Lưu session UUID
        if (result.sessionUuid && !currentSessionUuid) {
          setCurrentSessionUuid(result.sessionUuid);
        }

        // ✅ INCREMENT DAILY USAGE COUNT
        incrementUsageCount();

        console.log('✅ AI response received:', {
          provider: result.provider,
          model: result.model,
          sessionUuid: result.sessionUuid,
          dailyUsage: `${aiUsage.used + 1}/${aiUsage.limit}`
        });

      } else {
        throw new Error(result.message || 'AI API error');
      }

    } catch (error) {
      console.error('❌ Send message error:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: `⚠️ Error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✅ Handle new chat
  const handleNewChat = () => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'Hello! I am Nova, your AI assistant. How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
    setActiveConversation(null);
    setCurrentSessionUuid(null);
  };

  // ✅ Handle conversation click
  const handleConversationClick = async (conversation) => {
    setActiveConversation(conversation.id);
    setCurrentSessionUuid(conversation.id);
    
    // Load conversation messages
    const result = await ApiService.getAISession(conversation.id);
    
    if (result.success && result.messages) {
      const formattedMessages = result.messages.map((msg, index) => ({
        id: index + 1,
        type: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.created_at || new Date().toISOString()
      }));
      
      setMessages(formattedMessages);
    }
  };

  // ✅ Handle delete conversation
  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?');
    if (!confirmDelete) return;

    try {
      const result = await ApiService.endAISession(conversationId);
      
      if (result.success) {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        
        if (activeConversation === conversationId) {
          handleNewChat();
        }
        
        console.log('✅ Conversation deleted:', conversationId);
      }
    } catch (error) {
      console.error('❌ Delete conversation error:', error);
      alert('Không thể xóa cuộc trò chuyện. Vui lòng thử lại.');
    }
  };

  // ✅ NEW: Function to show exit confirmation
  const showExitConfirmation = (navigationCallback) => {
    setPendingNavigation(() => navigationCallback);
    setShowExitDialog(true);
  };

  // ✅ NEW: Handle confirm exit
  const handleConfirmExit = () => {
    setShowExitDialog(false);
    // Navigate to 記錄歷史 (History page)
    navigate('/history'); // ⚠️ Thay đổi route này theo route thực tế của bạn
  };

  // ✅ NEW: Handle cancel exit
  const handleCancelExit = () => {
    setShowExitDialog(false);
    setPendingNavigation(null);
  };

  // ✅ UPDATED: Navigation handlers with confirmation
  const handleHome = () => {
    showExitConfirmation(() => {
      setActiveTab('Home');
      navigate('/main');
    });
  };

  const handlePrayerHub = () => {
    showExitConfirmation(() => {
      setActiveTab('PrayerHub');
      navigate('/prayer-hub');
    });
  };

  const handleCreatePost = () => {
    showExitConfirmation(() => {
      setActiveTab('Add');
      navigate('/create-post');
    });
  };

  const handleAddFriend = () => {
    showExitConfirmation(() => {
      setActiveTab('Search');
      navigate('/addfriend');
    });
  };

  const handleNova = () => {
    setActiveTab('Nova');
  };

  return (
    <div className="nova-screen">
      {/* ✅ Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="exit-dialog-overlay">
          <div className="exit-dialog">
            <div className="exit-dialog-header">
              <h2>確認離開</h2>
            </div>
            <div className="exit-dialog-body">
              <p>您確定要離開 Nova AI 助手嗎？</p>
              <p className="exit-dialog-subtitle">您的對話將被保存到歷史記錄中</p>
            </div>
            <div className="exit-dialog-actions">
              <button 
                className="exit-dialog-btn cancel"
                onClick={handleCancelExit}
              >
                取消
              </button>
              <button 
                className="exit-dialog-btn confirm"
                onClick={handleConfirmExit}
              >
                確認離開
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`nova-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={Nova} alt="Nova" />
            <span>Nova AI</span>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* ✅ UPDATED: Daily AI Usage Display */}
        <div className="ai-usage-display">
          <div className="usage-header">
            <span className="usage-title">每日使用量</span>
            <span className="usage-badge">
              {aiUsage.limit - aiUsage.used} 剩餘
            </span>
          </div>
          <div className="usage-bar">
            <div 
              className={`usage-fill ${aiUsage.used >= aiUsage.limit ? 'full' : ''}`}
              style={{ width: `${(aiUsage.used / aiUsage.limit) * 100}%` }}
            />
          </div>
          <div className="usage-info">
            <p className="usage-text">
              <strong>{aiUsage.used}</strong> / {aiUsage.limit} 次提問
            </p>
            {aiUsage.hoursUntilReset !== undefined && (
              <p className="usage-reset">
                🕐 重置於 {aiUsage.hoursUntilReset}小時 {aiUsage.minutesUntilReset}分鐘後
              </p>
            )}
          </div>
        </div>

        <button className="new-chat-btn" onClick={handleNewChat}>
          <span className="plus-icon">+</span>
          New Chat
        </button>

        <div className="conversations-section">
          <h3 className="section-title">Conversations</h3>
          <div className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
                  onClick={() => handleConversationClick(conv)}
                >
                  <div className="conversation-content">
                    <div className="conversation-icon">💬</div>
                    <div className="conversation-text">
                      <h4>{conv.title}</h4>
                      <p>{conv.preview}</p>
                    </div>
                  </div>
                  <div className="conversation-actions">
                    <button 
                      className="delete-btn"
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      title="Delete conversation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-conversations">
                <p>No conversations yet. Start a new chat!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="nova-main">
        {/* Header */}
        <div className="nova-header">
          <div className="nova-header-content">
            <button 
              className="menu-toggle"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
            <div className="nova-title">
              <h1>Nova AI Assistant</h1>
              <p className="nova-status">
                <span className="status-dot"></span>
                Online • {aiUsage.limit - aiUsage.used} questions remaining today
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="nova-chat-container">
          <div className="nova-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message-bubble ${message.type}`}
              >
                <div className="message-avatar">
                  {message.type === 'assistant' ? (
                    <img src={Nova} alt="Nova" />
                  ) : (
                    <div className="user-avatar">
                      {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">{message.content}</div>
                  <div className="message-footer">
                    <div className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-bubble assistant typing-indicator">
                <div className="message-avatar">
                  <img src={Nova} alt="Nova" />
                </div>
                <div className="message-content">
                  <div className="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="nova-input-container">
          <div className="nova-input-wrapper">
            <textarea
              ref={inputRef}
              className="nova-input"
              placeholder={
                aiUsage.used >= aiUsage.limit 
                  ? "Daily limit reached. Try again tomorrow..." 
                  : "Ask Nova anything..."
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              maxLength="2000"
              disabled={aiUsage.used >= aiUsage.limit}
            />
            <button
              className={`nova-send-btn ${inputText.trim() && !isTyping ? 'active' : ''}`}
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping || aiUsage.used >= aiUsage.limit}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                />
              </svg>
            </button>
          </div>
          {aiUsage.used >= aiUsage.limit && (
            <p className="usage-limit-warning">
              ⚠️ Bạn đã hết lượt hỏi hôm nay ({aiUsage.limit} câu hỏi/ngày). 
              Làm mới sau {aiUsage.hoursUntilReset}h {aiUsage.minutesUntilReset}m.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
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
          iconSrc={Search} 
          onClick={handlePrayerHub} 
          isActive={activeTab === 'PrayerHub'} 
          size="medium" 
          ariaLabel="Prayer Hub" 
        />
        <CircleButton 
          provider="Add" 
          iconSrc={Add} 
          onClick={handleCreatePost} 
          isActive={activeTab === 'Add'} 
          size="medium" 
          ariaLabel="Create Post" 
        />
        <CircleButton 
          provider="Search" 
          iconSrc={Profile} 
          onClick={handleAddFriend} 
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
          ariaLabel="Nova AI Assistant" 
        />
      </div>
    </div>
  );
}

export default NovaScreen;
