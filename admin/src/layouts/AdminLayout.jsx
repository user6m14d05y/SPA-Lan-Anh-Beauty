import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
// Icon
import { LayoutDashboard, Calendar, Users, Sparkles, Mail, MessageCircle, LogOut, User } from '../icons.jsx';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Tổng quan';
      case '/customers': return 'Khách hàng';
      case '/staffs': return 'Quản lý Nhân viên';
      case '/appointments': return 'Lịch hẹn';
      case '/services': return 'Dịch vụ';
      case '/contacts': return 'Liên hệ';
      case '/chat': return 'Chat Khách hàng';
      default: return 'Admin Panel';
    }
  };

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          Lan Anh Admin
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
            onClick={() => { logout(); navigate('/login'); }}
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
          <div className={styles.topbarRight}>
            <div className={styles.avatar}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>{user?.fullName}</span>
          </div>
        </header>
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
