import { Outlet, Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import styles from "./MainLayout.module.css";
const logoImg = "/Logo.png";
import { Chat, ChevronDown, Paperclip, Calendar, Facebook, Zalo, TikTok, Instagram, MapPinIcon, PhoneIcon, ClockIcon, ArrowUpRightIcon } from "../icons";

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

const parseChatMessage = (message) => {
  try {
    const parsed = JSON.parse(message || '');
    if (typeof parsed !== 'object' || parsed === null) return { text: message };
    return {
      ...parsed,
      imageUrl: parsed.imageUrl?.startsWith('/uploads') ? `${SOCKET_URL}${parsed.imageUrl}` : parsed.imageUrl,
    };
  } catch {
    return { text: message };
  }
};

const readImageFile = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve('');
    return;
  }

  if (!file.type.startsWith('image/')) {
    reject(new Error('Vui lòng chọn file ảnh.'));
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    reject(new Error('Ảnh không được vượt quá 2MB.'));
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('Không thể đọc ảnh.'));
  reader.readAsDataURL(file);
});

export default function MainLayout() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatTab, setActiveChatTab] = useState("bot");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [staffInput, setStaffInput] = useState("");
  const [staffImage, setStaffImage] = useState('');
  const [staffMessages, setStaffMessages] = useState([]);
  const [staffConversation, setStaffConversation] = useState(null);
  const [staffConnected, setStaffConnected] = useState(false);
  const [startingNewConversation, setStartingNewConversation] = useState(false);
  const [serviceCategories, setServiceCategories] = useState([]);
  const isStaffConversationClosed = staffConversation?.status === 'CLOSED';
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
    const fetchServiceCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/catalog/tree`);
        const result = await response.json();

        if (response.ok && result.success) {
          setServiceCategories(result.data || []);
        }
      } catch {
        setServiceCategories([]);
      }
    };

    fetchServiceCategories();
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
        setStartingNewConversation(false);
      });

      socket.on("chat:visitorId:update", ({ visitorId }) => {
        if (!visitorId) return;
        visitorIdRef.current = visitorId;
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
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
        setStartingNewConversation(false);
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
    if ((!trimmedMessage && !staffImage) || !staffSocketRef.current || isStaffConversationClosed) return;

    staffSocketRef.current.emit("chat:customer:message", {
      visitorId: visitorIdRef.current,
      customerName: "Khách website",
      message: trimmedMessage,
      imageUrl: staffImage,
    });
    setStaffInput("");
    setStaffImage('');
  };

  const handleStaffImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    try {
      setStaffImage(await readImageFile(file));
    } catch (imageError) {
      setStaffMessages((messages) => [
        ...messages,
        {
          id: `error_${Date.now()}`,
          senderType: "SYSTEM",
          message: imageError.message || "Không thể chọn ảnh.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const startNewStaffConversation = () => {
    if (!staffSocketRef.current || startingNewConversation) return;

    setStartingNewConversation(true);
    staffSocketRef.current.emit("chat:customer:newConversation", {
      visitorId: visitorIdRef.current,
      customerName: "Khách website",
    });
    setStaffInput("");
    setStaffImage('');
  };

  const openStaffChat = () => {
    setActiveChatTab("staff");
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className={styles.headerWrapper}>
        <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>

          <Link to="/" className={styles.logo}>
            <img src={logoImg} alt="Lan Anh Beauty Logo" />
          </Link>

          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerActive : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerActive : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${mobileMenuOpen ? styles.hamburgerActive : ''}`}></span>
          </button>

          <ul className={`${styles.navLinks} ${mobileMenuOpen ? styles.mobileNavOpen : ""}`}>
            <li>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Trang Chủ</Link>
            </li>
            <li>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)}>Về Chúng Tôi</Link>
            </li>
            <li className={styles.navItemHasDropdown}>
              <Link to="/services" className={styles.navDropdownTrigger}>
                Dịch Vụ
                <ChevronDown size={14} />
              </Link>
              <div className={styles.servicesDropdown}>
                <div className={styles.dropdownMenu}>
                  {serviceCategories.length > 0 ? serviceCategories.map((category) => (
                    <div key={category.id} className={styles.dropdownItem}>
                      <Link className={styles.dropdownParent} to={`/services?category=${category.slug}`} onClick={() => setMobileMenuOpen(false)}>{category.name}</Link>
                      {(category.children || []).length > 0 && (
                        <div className={styles.dropdownSubmenu}>
                          {(category.children || []).map((child) => (
                            <Link key={child.id} to={`/services?category=${child.slug}`} onClick={() => setMobileMenuOpen(false)}>{child.name}</Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
                    <Link className={styles.dropdownParent} to="/services" onClick={() => setMobileMenuOpen(false)}>Xem tất cả dịch vụ</Link>
                  )}
                </div>
              </div>
            </li>
            <li>
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>Bài Viết</Link>
            </li>
            <li>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Liên Hệ</Link>
            </li>
            <li className={styles.mobileBookLi}>
              <Link to="/booking" className={styles.mobileBtnBook} onClick={() => setMobileMenuOpen(false)}>
                <span>Đặt Lịch Ngay</span>
                <ArrowUpRightIcon className="w-3.5 h-3.5 inline-block ml-1" />
              </Link>
            </li>
          </ul>

          <div className={styles.navActions}>
            <Link to="/booking" className="btn-luxury-primary text-xs px-5 py-2.5">
              <span>Đặt Lịch Ngay</span>
              <ArrowUpRightIcon className="w-3.5 h-3.5 inline-block ml-1" />
            </Link>
          </div>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <div key={`${location.pathname}${location.search}`} className={styles.pageTransition}>
          <Outlet />
        </div>
        <div className={styles.quickContactWidget} aria-label="Liên hệ nhanh">
          <Link to="/booking" title="Đặt lịch"><Calendar size={20} /></Link>
          <a href="https://www.facebook.com/05.thanh" title="Facebook" target="_blank" rel="noopener noreferrer"><Facebook size={20} /></a>
          <a href="https://zalo.me" title="Zalo" target="_blank" rel="noopener noreferrer"><Zalo size={20} /></a>
          <a href="https://www.tiktok.com/@user6m14d05y" title="TikTok" target="_blank" rel="noopener noreferrer"><TikTok size={20} /></a>
        </div>
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
              Chatbot AI
            </button>
            <button
              type="button"
              className={activeChatTab === "staff" ? styles.activeChatTab : ""}
              onClick={() => setActiveChatTab("staff")}
              role="tab"
              aria-selected={activeChatTab === "staff"}
            >
              Nhân viên Tư vấn
            </button>
          </div>

          {activeChatTab === "bot" ? (
            <>
              <div className={styles.chatMessages}>
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`${styles.chatBubble} ${message.sender === "user" ? styles.userBubble : styles.botBubble
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
              <form className={`${styles.chatForm} ${styles.botChatForm}`} onSubmit={handleChatSubmit}>
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
                {isStaffConversationClosed
                  ? 'Hội thoại đã kết thúc. Bạn không thể nhắn tin thêm trong cuộc trò chuyện này.'
                  : staffConnected
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
                      className={`${styles.chatBubble} ${message.senderType === "CUSTOMER"
                        ? styles.userBubble
                        : message.senderType === "SYSTEM"
                          ? styles.systemBubble
                          : styles.botBubble
                        }`}
                    >
                      {(() => {
                        const content = parseChatMessage(message.message);
                        return (
                          <>
                            {content.imageUrl && <img className={styles.chatImage} src={content.imageUrl} alt="Ảnh trong hội thoại" />}
                            {content.text && <span>{content.text}</span>}
                          </>
                        );
                      })()}
                    </div>
                  ))
                )}
                <div ref={staffMessagesEndRef} />
              </div>
              {staffImage && (
                <div className={styles.imagePreview}>
                  <img src={staffImage} alt="Ảnh chuẩn bị gửi" />
                  <button type="button" onClick={() => setStaffImage('')}>Xóa ảnh</button>
                </div>
              )}
              {isStaffConversationClosed && (
                <div className={styles.quickReplies}>
                  <button type="button" onClick={startNewStaffConversation} disabled={!staffConnected || startingNewConversation}>
                    {startingNewConversation ? 'Đang tạo hội thoại...' : 'Bắt đầu hội thoại mới'}
                  </button>
                </div>
              )}
              <form className={styles.chatForm} onSubmit={handleStaffSubmit}>
                <label className={styles.attachImageBtn}>
                  <Paperclip size={20} />
                  <input type="file" accept="image/*" onChange={handleStaffImageChange} disabled={!staffConnected || isStaffConversationClosed} />
                </label>
                <input
                  type="text"
                  value={staffInput}
                  onChange={(event) => setStaffInput(event.target.value)}
                  placeholder={isStaffConversationClosed ? 'Hội thoại đã kết thúc' : 'Nhập tin nhắn cho nhân viên...'}
                  aria-label="Nhập tin nhắn cho nhân viên"
                  disabled={!staffConnected || isStaffConversationClosed}
                />
                <button type="submit" disabled={!staffConnected || isStaffConversationClosed || (!staffInput.trim() && !staffImage)}>Gửi</button>
              </form>
            </div>
          )}
        </div>
      ) : null}

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerColBrand}>
              <h2 className={styles.footerTitle}>LAN ANH BEAUTY</h2>
              <p className={styles.footerBrandDesc}>
                Kiến tạo nét đẹp tự nhiên, hoàn mỹ cho phái đẹp bằng công nghệ làm đẹp hiện đại, không gian thư giãn sang trọng và sự tận tâm hàng đầu từ chuyên gia.
              </p>
              <div className={styles.socialLinks}>
                <a href="https://www.facebook.com/05.thanh" title="Facebook" target="_blank" rel="noopener noreferrer"><Facebook size={22} /></a>
                <a href="https://www.tiktok.com/@user6m14d05y" title="TikTok" target="_blank" rel="noopener noreferrer"><TikTok size={22} /></a>
                <a href="https://zalo.me" title="Zalo" target="_blank" rel="noopener noreferrer"><Zalo size={22} /></a>
                <a href="https://instagram.com/05.thanh" title="Instagram" target="_blank" rel="noopener noreferrer"><Instagram size={22} /></a>
              </div>
            </div>

            <div className={styles.footerCol}>
              <h3 className={styles.footerColTitle}>Khám Phá</h3>
              <ul className={styles.footerNavList}>
                <li><Link to="/">Trang Chủ</Link></li>
                <li><Link to="/about">Về Chúng Tôi</Link></li>
                <li><Link to="/services">Tất Cả Dịch Vụ</Link></li>
                <li><Link to="/blog">Kinh Nghiệm Làm Đẹp</Link></li>
                <li><Link to="/contact">Liên Hệ Spa</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h3 className={styles.footerColTitle}>Dịch Vụ Đột Phá</h3>
              <ul className={styles.footerNavList}>
                <li><Link to="/services?category=cham-soc-da">Chăm Sóc Da Chuyên Sâu</Link></li>
                <li><Link to="/services?category=phun-theu-tham-my">Phun Thêu Thẩm Mỹ</Link></li>
                <li><Link to="/services?category=goi-dau-duong-sinh">Gội Đầu Dưỡng Sinh Trị Liệu</Link></li>
                <li><Link to="/services?category=massage-thu-gian">Massage Thư Giãn</Link></li>
                <li><Link to="/services">Gói Liệu Trình Cao Cấp</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h3 className={styles.footerColTitle}>Giờ Làm Việc & Địa Chỉ</h3>
              <div className={styles.footerContactItem}>
                <span className={styles.footerContactLabel}>
                  <MapPinIcon className="w-4 h-4 inline-block text-[var(--primary-gold-dark)] mr-1" />
                  Địa chỉ:
                </span>
                <p>123 Đường Sắc Đẹp, Quận Hoàn Kiếm, Hà Nội</p>
              </div>
              <div className={styles.footerContactItem}>
                <span className={styles.footerContactLabel}>
                  <PhoneIcon className="w-4 h-4 inline-block text-[var(--primary-gold-dark)] mr-1" />
                  Hotline hỗ trợ:
                </span>
                <p><a href="tel:0987654321">0987 654 321</a></p>
              </div>
              <div className={styles.footerContactItem}>
                <span className={styles.footerContactLabel}>
                  <ClockIcon className="w-4 h-4 inline-block text-[var(--primary-gold-dark)] mr-1" />
                  Giờ mở cửa:
                </span>
                <p>08:00 - 20:00 (Tất cả các ngày trong tuần)</p>
              </div>
            </div>
          </div>

          <div className={styles.footerBottomBar}>
            <p className={styles.copyright}>© 2026 Lan Anh Beauty SPA. Tất cả quyền được bảo lưu.</p>
            <div className={styles.footerBottomLinks}>
              <Link to="/privacy">Chính sách bảo mật</Link>
              <span>•</span>
              <Link to="/terms">Điều khoản sử dụng</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

