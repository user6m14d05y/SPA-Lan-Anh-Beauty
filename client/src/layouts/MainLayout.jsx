import { Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./MainLayout.module.css";
import logoImg from "../../public/Logo.png";
import Login from "../pages/Auth/login";
import Register from "../pages/Auth/register";
import Forgot from "../pages/Auth/forgot";

export default function MainLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authView, setAuthView] = useState("login");
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsAuthOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthOpen]);

  const closeAuthModal = () => setIsAuthOpen(false);

  const openAuthModal = (view) => {
    setAuthView(view);
    setIsAuthOpen(true);
  };

  const handleLoginSuccess = (user) => {
    setAuthUser(user);
    closeAuthModal();
  };

  const handleRegisterSuccess = (user) => {
    setAuthUser(user);
    closeAuthModal();
  };

  const userDisplayName = authUser?.fullName || authUser?.email || authUser?.phone || authUser?.label;

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/users/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error(error);
    }

    setAuthUser(null);
  };

  const renderAuthContent = () => {
    if (authView === "register") {
      return <Register onSuccess={handleRegisterSuccess} onSwitchToLogin={() => setAuthView("login")} />;
    }

    if (authView === "forgot") {
      return <Forgot onSwitchToLogin={() => setAuthView("login")} />;
    }

    return (
      <Login
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setAuthView("register")}
        onSwitchToForgot={() => setAuthView("forgot")}
      />
    );
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
            {authUser ? (
              <>
                <span className={styles.userBadge}>Xin chào, {userDisplayName}</span>
                <button type="button" className={styles.authButton} onClick={handleLogout}>
                  Đăng xuất
                </button>
              </>
            ) : (
              <button type="button" className={styles.authButton} onClick={() => openAuthModal("login")}>
                Đăng nhập
              </button>
            )}
            <Link to="/booking" className={styles.btnBook}>
              Đặt Lịch Ngay
            </Link>
          </div>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {isAuthOpen ? (
        <div className={styles.modalOverlay} onClick={closeAuthModal}>
          <div className={styles.modalPanel} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={closeAuthModal} aria-label="Đóng modal">
              ×
            </button>
            {renderAuthContent()}
          </div>
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


