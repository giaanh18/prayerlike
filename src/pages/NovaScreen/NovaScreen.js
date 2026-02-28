import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
      content: 'Hello! I am **Nova**, your AI assistant. How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // ✅ AI Usage State - ONLY STORE DATA FROM API (NO CALCULATION)
  const [aiUsage, setAiUsage] = useState({ 
    used: 0, 
    limit: 10,
    windowHours: 24,
    resetsAt: null,
    isExpired: false
  });
  
  // ✅ Exit Confirmation State
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const usageCheckInterval = useRef(null);

  // ✅ Load AI sessions & usage when component mounts
  useEffect(() => {
    loadAISessions();
    loadAIUsageFromAPI();
    
    // ✅ Check usage from API every 30 seconds
    usageCheckInterval.current = setInterval(() => {
      loadAIUsageFromAPI();
    }, 30000); // 30 seconds
    
    return () => {
      if (usageCheckInterval.current) {
        clearInterval(usageCheckInterval.current);
      }
    };
  }, []);

  // ✅ Load AI Usage FROM API - ONLY STORE, NO CALCULATION
  const loadAIUsageFromAPI = async () => {
    try {
      console.log('📊 Loading AI Usage from API...');
      
      const result = await ApiService.getAIUsage();
      
      if (result.success) {
        // ✅ ONLY STORE DATA FROM API, NO ADDITIONAL CALCULATION
        setAiUsage({
          used: result.used || 0,
          limit: result.limit || 10,
          windowHours: result.windowHours || 24,
          resetsAt: result.resetsAt || null,
          isExpired: result.isExpired || false
        });
        
        console.log('✅ AI Usage loaded from API:', {
          used: result.used,
          limit: result.limit,
          remaining: (result.limit || 10) - (result.used || 0),
          windowHours: result.windowHours,
          resetsAt: result.resetsAt,
          isExpired: result.isExpired
        });
        
      } else {
        console.warn('⚠️ Failed to load AI usage:', result.message);
      }
      
    } catch (error) {
      console.error('❌ Load AI usage error:', error);
    }
  };

  const loadAISessions = async () => {
    console.log('📋 Loading AI sessions...');
    const result = await ApiService.getAISessions();
    
    if (result.success && result.sessions) {
      const formattedSessions = result.sessions.map(session => ({
        id: session.session_uuid,
        title: session.title || 'Untitled Chat',
        preview: session.messages?.[0]?.content?.substring(0, 50) || 'No messages',
        timestamp: new Date(session.last_interaction_at || session.created_at).toLocaleString(),
        expired: session.expired === true
      }));
      
      setConversations(formattedSessions);
      console.log('✅ Loaded', formattedSessions.length, 'sessions');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Handle send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const activeConversationData = conversations.find(conv => conv.id === currentSessionUuid);
    if (activeConversationData?.expired) {
      alert('This conversation has expired. Please start a new chat.');
      return;
    }

    // ✅ Check expired from API
    if (aiUsage.isExpired) {
      alert(
        `⚠️ Conversation has expired!\n\n` +
        `You have been inactive for ${aiUsage.windowHours} hours.\n` +
        `Please click "New Chat" to start a new conversation.`
      );
      return;
    }

    // ✅ Check limit
    if (aiUsage.used >= aiUsage.limit) {
      alert(
        `⚠️ Usage limit reached!\n\n` +
        `You have used ${aiUsage.limit} questions.\n` +
        `Please wait ${aiUsage.windowHours} hours before trying again.`
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
      const result = await ApiService.sendAIMessage(
        [
          { role: 'user', content: userMessage.content }
        ],
        currentSessionUuid
      );

      if (result.success) {
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

        if (result.sessionUuid && !currentSessionUuid) {
          setCurrentSessionUuid(result.sessionUuid);
        }

        // ✅ Reload usage from API
        await loadAIUsageFromAPI();

        console.log('✅ AI response received:', {
          provider: result.provider,
          model: result.model,
          sessionUuid: result.sessionUuid
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

  const handleNewChat = () => {
    setMessages([
      {
        id: 1,
        type: 'assistant',
        content: 'Hello! I am **Nova**, your AI assistant. How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
    setActiveConversation(null);
    setCurrentSessionUuid(null);
    loadAIUsageFromAPI();
  };

  const handleConversationClick = async (conversation) => {
    setActiveConversation(conversation.id);
    setCurrentSessionUuid(conversation.id);
    
    const result = await ApiService.getAISession(conversation.id);
    
    if (result.success && result.messages) {
      const formattedMessages = result.messages.map((msg, index) => ({
        id: index + 1,
        type: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.created_at || new Date().toISOString()
      }));
      
      setMessages(formattedMessages);
      loadAIUsageFromAPI();
    }
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    
    const confirmDelete = window.confirm('Are you sure you want to delete this conversation?');
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
      alert('Unable to delete conversation. Please try again.');
    }
  };

  // ✅ SỬA: Lưu callback thực sự
  const showExitConfirmation = (navigationCallback) => {
    setPendingNavigation(() => navigationCallback);
    setShowExitDialog(true);
  };

  // ✅ SỬA: Thực thi callback đã lưu
  const handleConfirmExit = () => {
    setShowExitDialog(false);
    if (pendingNavigation && typeof pendingNavigation === 'function') {
      pendingNavigation(); // ← THỰC THI CALLBACK
    }
    setPendingNavigation(null);
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
    setPendingNavigation(null);
  };

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

  // ✅ Format reset time - DISPLAY ONLY, NO CALCULATION
  const formatResetTime = () => {
    if (!aiUsage.resetsAt) return null;
    
    try {
      const resetDate = new Date(aiUsage.resetsAt);
      return resetDate.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  };

  const getActiveConversation = () => {
    return conversations.find(conv => conv.id === currentSessionUuid) || null;
  };

  const isActiveConversationExpired = () => {
    const activeConversationData = getActiveConversation();
    return activeConversationData?.expired === true;
  };

  // ✅ Check if can send message
  const canSendMessage = () => {
    return !aiUsage.isExpired &&
      !isActiveConversationExpired() &&
      aiUsage.used < aiUsage.limit &&
      inputText.trim() &&
      !isTyping;
  };

  const isInputDisabled = () => {
    return aiUsage.isExpired ||
      aiUsage.used >= aiUsage.limit ||
      isActiveConversationExpired();
  };

  return (
    <div className="nova-screen">
      {showExitDialog && (
        <div className="exit-dialog-overlay">
          <div className="exit-dialog">
            <div className="exit-dialog-header">
              <h2>Confirm Exit</h2>
            </div>
            <div className="exit-dialog-body">
              <p>Are you sure you want to leave Nova AI Assistant?</p>
              <p className="exit-dialog-subtitle">Your conversation will be saved to history</p>
            </div>
            <div className="exit-dialog-actions">
              <button 
                className="exit-dialog-btn cancel"
                onClick={handleCancelExit}
              >
                Cancel
              </button>
              <button 
                className="exit-dialog-btn confirm"
                onClick={handleConfirmExit}
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* ✅ AI Usage Display - ONLY DISPLAY DATA FROM API */}
        <div className={`ai-usage-display ${aiUsage.isExpired ? 'expired' : ''}`}>
          <div className="usage-header">
            <span className="usage-title">
              {aiUsage.isExpired ? '⏰ Expired' : 'Usage'}
            </span>
            <span className="usage-badge">
              {aiUsage.isExpired ? 'Locked' : `${aiUsage.limit - aiUsage.used} Remaining`}
            </span>
          </div>
          
          {!aiUsage.isExpired && (
            <>
              <div className="usage-bar">
                <div 
                  className={`usage-fill ${aiUsage.used >= aiUsage.limit ? 'full' : ''}`}
                  style={{ width: `${(aiUsage.used / aiUsage.limit) * 100}%` }}
                />
              </div>
              <div className="usage-info">
                <p className="usage-text">
                  <strong>{aiUsage.used}</strong> / {aiUsage.limit} questions
                </p>
                {aiUsage.resetsAt && (
                  <p className="usage-reset">
                    🕐 Resets at: {formatResetTime()}
                  </p>
                )}
                {!aiUsage.resetsAt && (
                  <p className="usage-reset">
                    ℹ️ Timer starts after {aiUsage.windowHours} hours of conversation
                  </p>
                )}
              </div>
            </>
          )}
          
          {aiUsage.isExpired && (
            <div className="usage-expired-message">
              <p>⚠️ Conversation Expired</p>
              <p className="expired-subtitle">
                {aiUsage.windowHours} hours of inactivity
              </p>
              <button 
                className="new-chat-btn-small"
                onClick={handleNewChat}
              >
                Start New Chat
              </button>
            </div>
          )}
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
                  className={`conversation-item ${activeConversation === conv.id ? 'active' : ''} ${conv.expired ? 'expired' : ''}`}
                  onClick={() => handleConversationClick(conv)}
                >
                  <div className="conversation-content">
                    <div className="conversation-icon">💬</div>
                    <div className="conversation-text">
                      <h4>
                        {conv.title}
                        {conv.expired && (
                          <span className="conversation-expired-label">Expired</span>
                        )}
                      </h4>
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

      <div className="nova-main">
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
                <span className={`status-dot ${aiUsage.isExpired ? 'expired' : ''}`}></span>
                {aiUsage.isExpired 
                  ? `Expired • Please start a new conversation` 
                  : `Online • ${aiUsage.limit - aiUsage.used} questions remaining`
                }
              </p>
            </div>
          </div>
        </div>

        <div className="nova-chat-container">
          <div className="nova-messages">
            {isActiveConversationExpired() && (
              <div className="expired-conversation-notice">
                This conversation has expired
              </div>
            )}
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
                  <div className="message-text markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline ? (
                            <pre className="code-block">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          ) : (
                            <code className="inline-code" {...props}>
                              {children}
                            </code>
                          );
                        },
                        a: ({node, ...props}) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
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

        <div className={`nova-input-container ${isActiveConversationExpired() ? 'expired' : ''}`}>
          <div className="nova-input-wrapper">
            <textarea
              ref={inputRef}
              className="nova-input"
              placeholder={(
                isActiveConversationExpired()
                  ? "This conversation has expired..."
                  : aiUsage.isExpired
                    ? "Conversation expired, please start a new chat..." 
                    : aiUsage.used >= aiUsage.limit 
                      ? "Usage limit reached..." 
                      : "Ask Nova anything..."
              )}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              rows="1"
              maxLength="2000"
              disabled={isInputDisabled()}
            />
            <button
              className={`nova-send-btn ${canSendMessage() ? 'active' : ''}`}
              onClick={handleSendMessage}
              disabled={!canSendMessage()}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                />
              </svg>
            </button>
          </div>
          
          {/* ✅ Warning messages */}
          {isActiveConversationExpired() && (
            <p className="usage-limit-warning expired">
              ⚠️ This conversation has expired. Please start a new chat.
            </p>
          )}

          {aiUsage.isExpired && (
            <p className="usage-limit-warning expired">
              ⚠️ Conversation expired ({aiUsage.windowHours} hours of inactivity). Please click "New Chat" to start a new conversation.
            </p>
          )}
          
          {!aiUsage.isExpired && !isActiveConversationExpired() && aiUsage.used >= aiUsage.limit && (
            <p className="usage-limit-warning">
              ⚠️ Usage limit reached ({aiUsage.limit} questions).
              {aiUsage.resetsAt && ` Resets at: ${formatResetTime()}`}
            </p>
          )}
        </div>
      </div>

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
