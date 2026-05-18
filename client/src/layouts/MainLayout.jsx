import { Outlet, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import styles from "./MainLayout.module.css";
import logoImg from "../../public/Logo.png";
import { Chat } from "../icons";

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';
const VISITOR_ID_KEY = 'spa_staff_chat_visitor_id';

const getVisitorId = () => {
  const existingVisitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (existingVisitorId) return existingVisitorId;

  const nextVisitorId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(VISITOR_ID_KEY, nextVisitorId);
  return nextVisitorId;
};

export default function MainLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState("bot");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [staffInput, setStaffInput] = useState("");
  const [staffMessages, setStaffMessages] = useState([]);
  const [staffConversation, setStaffConversation] = useState(null);
  const [staffConnected, setStaffConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Chào bạn, Lan Anh Beauty có thể hỗ trợ gì cho bạn hôm nay?",
    },
  ]);
  const chatMessagesEndRef = useRef(null);
  const staffMessagesEndRef = useRef(null);
  const staffSocketRef = useRef(null);
  const visitorIdRef = useRef(getVisitorId());

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isChatOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsChatOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChatOpen]);

  useEffect(() => {
    if (!isChatOpen || activeChatTab !== "bot") return;
    chatMessagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeChatTab, chatMessages, isChatOpen]);

  useEffect(() => {
    if (!isChatOpen || activeChatTab !== "staff") return;
    staffMessagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeChatTab, staffMessages, isChatOpen]);

  useEffect(() => {
    if (!isChatOpen || activeChatTab !== "staff") return undefined;

    if (!staffSocketRef.current) {
      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
      });

      staffSocketRef.current = socket;

      socket.on("connect", () => {
        setStaffConnected(true);
        socket.emit("chat:customer:join", {
          visitorId: visitorIdRef.current,
          customerName: "Khách website",
        });
      });

      socket.on("disconnect", () => {
        setStaffConnected(false);
      });

      socket.on("chat:conversation", ({ conversation, messages }) => {
        setStaffConversation(conversation);
        setStaffMessages(messages || []);
      });

      socket.on("chat:conversation:update", (conversation) => {
        setStaffConversation(conversation);
      });

      socket.on("chat:message", (message) => {
        setStaffMessages((messages) => (
          messages.some((item) => item.id === message.id) ? messages : [...messages, message]
        ));
      });

      socket.on("chat:error", (error) => {
        setStaffMessages((messages) => [
          ...messages,
          {
            id: `error_${Date.now()}`,
            senderType: "SYSTEM",
            message: error.message || "Không thể kết nối nhân viên.",
            createdAt: new Date().toISOString(),
          },
        ]);
      });
    } else {
      staffSocketRef.current.emit("chat:customer:join", {
        visitorId: visitorIdRef.current,
        customerName: "Khách website",
      });
    }

    return undefined;
  }, [activeChatTab, isChatOpen]);

  const closeChatModal = () => setIsChatOpen(false);

  const openChatModal = () => {
    setActiveChatTab("bot");
    setIsChatOpen(true);
  };

  const getFallbackReply = () => {
    return "Hiện chatbot AI chưa phản hồi được. Bạn có thể chuyển sang tab Nhân viên hoặc thử lại sau ít phút.";
  };

  const sendChatMessage = async (message) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || chatLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedMessage,
    };

    const nextMessages = [...chatMessages, userMessage];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedMessage,
          history: nextMessages.slice(-8),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Không thể gửi tin nhắn.");
      }

      setChatMessages((messages) => [
        ...messages,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: result.data?.reply || getFallbackReply(),
        },
      ]);
    } catch {
      setChatMessages((messages) => [
        ...messages,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: getFallbackReply(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = (event) => {
    event.preventDefault();
    sendChatMessage(chatInput);
  };

  const handleStaffSubmit = (event) => {
    event.preventDefault();
    const trimmedMessage = staffInput.trim();
    if (!trimmedMessage || !staffSocketRef.current) return;

    staffSocketRef.current.emit("chat:customer:message", {
      visitorId: visitorIdRef.current,
      customerName: "Khách website",
      message: trimmedMessage,
    });
    setStaffInput("");
  };

  const openStaffChat = () => {
    setActiveChatTab("staff");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
          <Link to="/" className={styles.logo}>
            <img src={logoImg} alt="Logo" />
          </Link>
          <ul className={styles.navLinks}>
            <li>
              <Link to="/">Trang Chủ</Link>
            </li>
            <li>
              <Link to="/services">Dịch Vụ</Link>
            </li>
            <li>
              <Link to="/about">Về Chúng Tôi</Link>
            </li>
            <li>
              <Link to="/contact">Liên Hệ</Link>
            </li>
          </ul>

          <div className={styles.navActions}>
            <Link to="/booking" className={styles.btnBook}>
              Đặt Lịch Ngay
            </Link>
          </div>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <Outlet />
        <button
          type="button"
          className={styles.chat}
          onClick={openChatModal}
          aria-label="Mở chat"
        >
          <Chat />
        </button>
      </main>

      {isChatOpen ? (
        <div className={styles.chatWidget} role="dialog" aria-label="Chat hỗ trợ Lan Anh Beauty">
          <div className={styles.chatHeader}>
            <div>
              <h2>Lan Anh Beauty</h2>
              <span>Thường phản hồi trong vài phút</span>
            </div>
            <button type="button" className={styles.chatClose} onClick={closeChatModal} aria-label="Đóng chat">
              ×
            </button>
          </div>

          <div className={styles.chatTabs} role="tablist" aria-label="Chọn kiểu chat">
            <button
              type="button"
              className={activeChatTab === "bot" ? styles.activeChatTab : ""}
              onClick={() => setActiveChatTab("bot")}
              role="tab"
              aria-selected={activeChatTab === "bot"}
            >
              Chatbot
            </button>
            <button
              type="button"
              className={activeChatTab === "staff" ? styles.activeChatTab : ""}
              onClick={() => setActiveChatTab("staff")}
              role="tab"
              aria-selected={activeChatTab === "staff"}
            >
              Nhân viên
            </button>
          </div>

          {activeChatTab === "bot" ? (
            <>
              <div className={styles.chatMessages}>
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.chatBubble} ${
                      message.sender === "user" ? styles.userBubble : styles.botBubble
                    }`}
                  >
                    {message.text}
                  </div>
                ))}
                {chatLoading ? (
                  <div className={`${styles.chatBubble} ${styles.botBubble} ${styles.typingBubble}`}>
                    Đang tư vấn...
                  </div>
                ) : null}
                <div ref={chatMessagesEndRef} />
              </div>
              <div className={styles.quickReplies}>
                <button type="button" onClick={() => sendChatMessage("Tôi muốn đặt lịch")} disabled={chatLoading}>
                  Đặt lịch
                </button>
                <button type="button" onClick={() => sendChatMessage("Tư vấn giá dịch vụ")} disabled={chatLoading}>
                  Giá dịch vụ
                </button>
                <button type="button" onClick={() => sendChatMessage("Địa chỉ spa ở đâu?")} disabled={chatLoading}>
                  Địa chỉ
                </button>
              </div>
              <div className={styles.quickReplies}>
                <button type="button" onClick={openStaffChat}>
                  Chat với nhân viên
                </button>
              </div>
              <form className={styles.chatForm} onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Nhập tin nhắn..."
                  aria-label="Nhập tin nhắn chat"
                  disabled={chatLoading}
                />
                <button type="submit" disabled={chatLoading}>Gửi</button>
              </form>
            </>
          ) : (
            <div className={styles.staffChatLive}>
              <div className={styles.staffStatus}>
                {staffConnected
                  ? `Đã kết nối với bộ phận tư vấn${staffConversation?.id ? ` #${staffConversation.id}` : ''}`
                  : 'Đang kết nối nhân viên...'}
              </div>
              <div className={styles.chatMessages}>
                {staffMessages.length === 0 ? (
                  <div className={styles.staffEmpty}>
                    Gửi tin nhắn để nhân viên Lan Anh Beauty hỗ trợ trực tiếp.
                  </div>
                ) : (
                  staffMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`${styles.chatBubble} ${
                        message.senderType === "CUSTOMER"
                          ? styles.userBubble
                          : message.senderType === "SYSTEM"
                            ? styles.systemBubble
                            : styles.botBubble
                      }`}
                    >
                      {message.message}
                    </div>
                  ))
                )}
                <div ref={staffMessagesEndRef} />
              </div>
              <form className={styles.chatForm} onSubmit={handleStaffSubmit}>
                <input
                  type="text"
                  value={staffInput}
                  onChange={(event) => setStaffInput(event.target.value)}
                  placeholder="Nhập tin nhắn cho nhân viên..."
                  aria-label="Nhập tin nhắn cho nhân viên"
                  disabled={!staffConnected}
                />
                <button type="submit" disabled={!staffConnected || !staffInput.trim()}>Gửi</button>
              </form>
            </div>
          )}
        </div>
      ) : null}

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <h2 className={styles.footerTitle}>LAN ANH BEAUTY</h2>
          <div className={styles.socialLinks}>
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
            <a href="#">Zalo</a>
          </div>
          <p className={styles.copyright}>© 2026 Lan Anh Beauty SPA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
