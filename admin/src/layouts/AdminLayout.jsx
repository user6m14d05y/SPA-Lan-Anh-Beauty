import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
// Icon
import { LayoutDashboard, Calendar, Users, Sparkles, Mail, MessageCircle, LogOut, User } from '../icons.jsx';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const location = useLocation();

  // TODO: Thay bằng auth context khi có hệ thống đăng nhập thật
  const user = { role: 'admin', name: 'Lan Anh Admin' };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Tổng quan';
      case '/appointments': return 'Lịch hẹn';
      case '/customers': return 'Khách hàng';
      case '/services': return 'Dịch vụ';
      case '/contacts': return 'Liên hệ';
      case '/chat': return 'Chat Khách hàng';
      case '/staffs': return 'Quản lý Nhân viên';
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
            {user.role === 'admin' && (
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
          <a href="http://localhost:5173" className={styles.navLink}>
            <span className={styles.navIcon}><LogOut size={20} /></span>
            Đăng xuất
          </a>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
          <div className={styles.topbarRight}>
            <div className={styles.avatar}>LA</div>
          </div>
        </header>
        <div className={styles.pageContent}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
