import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
// Icon
import { LayoutDashboard, Calendar, CalendarOff, Users, Sparkles, Mail, MessageCircle, LogOut, User } from '../icons.jsx';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Tổng quan';
      case '/customers': return 'Khách hàng';
      case '/staffs': return 'Quản lý Nhân viên';
      case '/users': return 'Quản lý tài khoản';
      case '/appointments': return 'Lịch hẹn';
      case '/closed-periods': return 'Ngày nghỉ';
      case '/services': return 'Dịch vụ';
      case '/category-services': return 'Danh mục dịch vụ';
      case '/contacts': return 'Liên hệ';
      case '/chat': return 'Chat Khách hàng';
      default: return 'Admin Panel';
    }
  };

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          ADMIN
        </div>
        <ul className={styles.navList}>
          <li>
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><LayoutDashboard size={20} /></span>
              Tổng quan
            </NavLink>
          </li>
          <li>
            {hasRole('ADMIN') && (
              <NavLink
                to="/users"
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              >
                <span className={styles.navIcon}><User size={20} /></span>
                Quản lý tài khoản
              </NavLink>
            )}
          </li>
          <li>
            {hasRole('ADMIN') && (
              <NavLink
                to="/staffs"
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              >
                <span className={styles.navIcon}><User size={20} /></span>
                Quản lý nhân viên
              </NavLink>
            )}
          </li>
          <li>
            <NavLink
              to="/appointments"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><Calendar size={20} /></span>
              Lịch hẹn
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/closed-periods"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><CalendarOff size={20} /></span>
              Ngày nghỉ
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/customers" 
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><Users size={20} /></span>
              Khách hàng
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/services"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><Sparkles size={20} /></span>
              Dịch vụ
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/category-services"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><Sparkles size={20} /></span>
              Danh mục dịch vụ
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contacts"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><Mail size={20} /></span>
              Liên hệ
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/chat" 
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><MessageCircle size={20} /></span>
              Chat
            </NavLink>
          </li>
        </ul>
        <div className={styles.sidebarFooter}>
          <button
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                logout();
                // navigate('/login');
                 window.location.href = 'http://localhost:5173';
              }
            }}
            className={styles.navLink}
            style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}
          >
            <span className={styles.navIcon}><LogOut size={20} /></span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
          <div className={styles.topbarRight} ref={dropdownRef}>
            <div 
              className={styles.userInfo} 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className={styles.avatar}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user?.fullName || 'User'}</span>
                <span className={styles.userRole}>{hasRole('ADMIN') ? 'Quản trị viên' : 'Nhân viên'}</span>
              </div>
              <svg 
                className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.dropdownIconOpen : ''}`} 
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>

            <div className={`${styles.dropdownMenu} ${isDropdownOpen ? styles.dropdownMenuOpen : ''}`}>
              <div className={styles.dropdownHeader}>
                <strong>{user?.fullName || 'User'}</strong>
                <span className={styles.dropdownEmail}>{user?.email || ''}</span>
              </div>
              <div className={styles.dropdownDivider}></div>
              <NavLink to="/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <User size={18} className={styles.dropdownItemIcon} /> Thông tin cá nhân
              </NavLink>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                    logout();
                    navigate('/login');
                  }
                }}
                className={`${styles.dropdownItem} ${styles.logoutItem}`}
              >
                <LogOut size={18} className={styles.dropdownItemIcon} /> Đăng xuất
              </button>
            </div>
          </div>
        </header>
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
