import { Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import styles from "./MainLayout.module.css";
import logoImg from "../../public/Logo.png";

export default function MainLayout() {
  const [scrolled, setScrolled] = useState(false);

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
          <Link to="/booking" className={styles.btnBook}>
            Đặt Lịch Ngay
          </Link>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <Outlet />
      </main>

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


