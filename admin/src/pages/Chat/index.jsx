import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Paperclip, Send, MoreVertical } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Chat.module.css';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getInitial = (name = 'K') => name.trim().charAt(0).toUpperCase() || 'K';

const upsertConversation = (items, conversation) => {
  const nextItems = items.filter((item) => item.id !== conversation.id);
  return [conversation, ...nextItems].sort((first, second) => (
    new Date(second.lastMessageAt || second.updatedAt) - new Date(first.lastMessageAt || first.updatedAt)
  ));
};

export default function Chat() {
  const { authFetch, accessToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(null);

  const activeConversation = useMemo(() => (
    conversations.find((conversation) => conversation.id === activeConversationId) || null
  ), [activeConversationId, conversations]);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return conversations;

    return conversations.filter((conversation) => (
      conversation.customerName?.toLowerCase().includes(normalizedSearch)
      || conversation.customerPhone?.toLowerCase().includes(normalizedSearch)
      || conversation.customerEmail?.toLowerCase().includes(normalizedSearch)
      || conversation.lastMessage?.toLowerCase().includes(normalizedSearch)
    ));
  }, [conversations, search]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await authFetch(`${API_URL}/chat/conversations`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải danh sách chat.');
        }

        const nextConversations = result.data || [];
        setConversations(nextConversations);
        setActiveConversationId((currentId) => currentId || nextConversations[0]?.id || null);
      } catch (fetchError) {
        setError(fetchError.message || 'Không thể tải danh sách chat.');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [authFetch]);

  useEffect(() => {
    if (!accessToken) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('chat:staff:join');
    });

    socket.on('chat:conversation:upsert', (conversation) => {
      setConversations((items) => {
        const nextItems = upsertConversation(items, conversation);
        setActiveConversationId((currentId) => currentId || conversation.id);
        return nextItems;
      });
    });

    socket.on('chat:conversation:update', (conversation) => {
      setConversations((items) => upsertConversation(items, conversation));
    });

    socket.on('chat:message', (message) => {
      if (message.conversationId !== activeConversationIdRef.current) return;
      setMessages((items) => (
        items.some((item) => item.id === message.id) ? items : [...items, message]
      ));
      socket.emit('chat:staff:joinConversation', { conversationId: message.conversationId });
    });

    socket.on('chat:error', (socketError) => {
      setError(socketError.message || 'Không thể kết nối socket chat.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setError('');
        const response = await authFetch(`${API_URL}/chat/conversations/${activeConversationId}/messages`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải tin nhắn.');
        }

        setMessages(result.data?.messages || []);
        if (result.data?.conversation) {
          setConversations((items) => upsertConversation(items, result.data.conversation));
        }
        socketRef.current?.emit('chat:staff:joinConversation', { conversationId: activeConversationId });
      } catch (fetchError) {
        setError(fetchError.message || 'Không thể tải tin nhắn.');
      }
    };

    fetchMessages();
  }, [activeConversationId, authFetch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const handleSendMessage = (event) => {
    event.preventDefault();
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || !activeConversationId || !socketRef.current) return;

    socketRef.current.emit('chat:staff:message', {
      conversationId: activeConversationId,
      message: trimmedMessage,
    });
    setMessageInput('');
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatSidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Tin nhắn khách hàng</h3>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className={styles.chatList}>
          {loading ? (
            <div className={styles.emptyState}>Đang tải hội thoại...</div>
          ) : filteredConversations.length === 0 ? (
            <div className={styles.emptyState}>Chưa có hội thoại nào.</div>
          ) : (
            filteredConversations.map((chat) => (
              <button
                key={chat.id}
                type="button"
                className={`${styles.chatItem} ${activeConversationId === chat.id ? styles.chatItemActive : ''}`}
                onClick={() => setActiveConversationId(chat.id)}
              >
                <div className={styles.avatarWrapper}>
                  <div className={styles.avatar}>{getInitial(chat.customerName)}</div>
                  {chat.status === 'OPEN' && <div className={styles.onlineDot}></div>}
                </div>
                <div className={styles.chatItemInfo}>
                  <div className={styles.chatItemTop}>
                    <span className={styles.chatName}>{chat.customerName}</span>
                    <span className={styles.chatTime}>{formatTime(chat.lastMessageAt)}</span>
                  </div>
                  <div className={styles.chatItemBottom}>
                    <span className={styles.chatLastMsg}>{chat.lastMessage || 'Khách vừa mở chat'}</span>
                    {chat.unreadByStaff > 0 && <span className={styles.unreadBadge}>{chat.unreadByStaff}</span>}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={styles.chatMain}>
        {activeConversation ? (
          <>
            <div className={styles.chatMainHeader}>
              <div className={styles.chatMainTitle}>
                <div className={styles.avatar}>{getInitial(activeConversation.customerName)}</div>
                <div>
                  <h4>{activeConversation.customerName}</h4>
                  <span className={styles.statusText}>Đang hoạt động</span>
                </div>
              </div>
              <button type="button" className={styles.btnAction}><MoreVertical size={20} /></button>
            </div>

            {error ? <div className={styles.errorBanner}>{error}</div> : null}

            <div className={styles.messagesArea}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.messageWrapper} ${
                    msg.senderType === 'STAFF' ? styles.messageRight : styles.messageLeft
                  }`}
                >
                  <div className={styles.messageBubble}>
                    {msg.message}
                  </div>
                  <div className={styles.messageTime}>{formatTime(msg.createdAt)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className={styles.chatInputArea} onSubmit={handleSendMessage}>
              <button type="button" className={styles.attachBtn}><Paperclip size={20} /></button>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                className={styles.messageInput}
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
              />
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!messageInput.trim()}
              >
                Gửi <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.noChatSelected}>
            Chọn một hội thoại để bắt đầu tư vấn.
          </div>
        )}
      </div>
    </div>
  );
}
