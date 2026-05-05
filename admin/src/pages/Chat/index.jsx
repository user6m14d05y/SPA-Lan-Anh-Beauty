import React, { useState } from 'react';
import { Paperclip, Send, MoreVertical } from '../../icons.jsx';
import styles from './Chat.module.css';

export default function Chat() {
  const [activeChat, setActiveChat] = useState(1);

  const chatList = [
    { id: 1, name: "Nguyễn Văn A", lastMessage: "Chào bạn, mình muốn đặt lịch...", time: "10:30", unread: 2, online: true },
    { id: 2, name: "Trần Thị B", lastMessage: "Giá dịch vụ phun mày là bao nhiêu?", time: "Hôm qua", unread: 0, online: false },
    { id: 3, name: "Lê Văn C", lastMessage: "Cảm ơn spa nhé!", time: "Thứ 2", unread: 0, online: true },
  ];

  const currentMessages = [
    { id: 1, sender: "customer", text: "Chào bạn, mình muốn đặt lịch chăm sóc da vào thứ 7 tuần này.", time: "10:25" },
    { id: 2, sender: "admin", text: "Chào bạn A, dạ thứ 7 bên mình còn trống khung giờ 9h sáng và 2h chiều. Bạn muốn đi giờ nào ạ?", time: "10:28" },
    { id: 3, sender: "customer", text: "Cho mình book 9h sáng nhé.", time: "10:30" },
  ];

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatSidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Tin nhắn khách hàng</h3>
          <input type="text" placeholder="Tìm kiếm..." className={styles.searchInput} />
        </div>
        <div className={styles.chatList}>
          {chatList.map((chat) => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${activeChat === chat.id ? styles.chatItemActive : ''}`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>{chat.name.charAt(0)}</div>
                {chat.online && <div className={styles.onlineDot}></div>}
              </div>
              <div className={styles.chatItemInfo}>
                <div className={styles.chatItemTop}>
                  <span className={styles.chatName}>{chat.name}</span>
                  <span className={styles.chatTime}>{chat.time}</span>
                </div>
                <div className={styles.chatItemBottom}>
                  <span className={styles.chatLastMsg}>{chat.lastMessage}</span>
                  {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.chatMain}>
        <div className={styles.chatMainHeader}>
          <div className={styles.chatMainTitle}>
            <div className={styles.avatar}>A</div>
            <div>
              <h4>Nguyễn Văn A</h4>
              <span className={styles.statusText}>Đang hoạt động</span>
            </div>
          </div>
          <button className={styles.btnAction}><MoreVertical size={20} /></button>
        </div>

        <div className={styles.messagesArea}>
          {currentMessages.map(msg => (
            <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender === 'admin' ? styles.messageRight : styles.messageLeft}`}>
              <div className={styles.messageBubble}>
                {msg.text}
              </div>
              <div className={styles.messageTime}>{msg.time}</div>
            </div>
          ))}
        </div>

        <div className={styles.chatInputArea}>
          <button className={styles.attachBtn}><Paperclip size={20} /></button>
          <input type="text" placeholder="Nhập tin nhắn..." className={styles.messageInput} />
          <button className={styles.sendBtn} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Gửi <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
