import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
// Icon
import { LayoutDashboard, Calendar, CalendarOff, Users, Sparkles, Mail, MessageCircle, LogOut, User, ShieldCheck, ChevronDown, List } from '../icons.jsx';
import { useAuth } from '../context/AuthContext';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [openMenus, setOpenMenus] = useState({
    accounts: ['/admin/users', '/admin/staffs', '/admin/customers'].includes(location.pathname),
    appointments: ['/admin/bookings', '/admin/closed-periods'].includes(location.pathname),
    services: ['/admin/services', '/admin/category-services'].includes(location.pathname)
  });

  const toggleMenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

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
      case '/admin': return 'Tổng quan';
      case '/admin/customers': return 'Khách hàng';
      case '/admin/staffs': return 'Quản lý Nhân viên';
      case '/admin/users': return 'Quản lý tài khoản';
      case '/admin/bookings': return 'Lịch hẹn';
      case '/admin/closed-periods': return 'Ngày nghỉ';
      case '/admin/services': return 'Dịch vụ';
      case '/admin/category-services': return 'Danh mục dịch vụ';
      case '/admin/contacts': return 'Liên hệ';
      case '/admin/chat': return 'Chat Khách hàng';
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
              to="/admin" 
              end
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><LayoutDashboard size={20} /></span>
              Tổng quan
            </NavLink>
          </li>
          <li className={styles.navGroup}>
            <div 
              className={styles.navLink} 
              onClick={() => toggleMenu('accounts')}
              style={{ cursor: 'pointer', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className={styles.navIcon}><Users size={20} /></span>
                Quản lý tài khoản
              </div>
              <span style={{ 
                display: 'flex',
                transform: openMenus.accounts ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.3s' 
              }}>
                <ChevronDown size={16} />
              </span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateRows: openMenus.accounts ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.3s ease-in-out',
            }}>
              <ul style={{ 
                listStyle: 'none', 
                paddingLeft: '24px', 
                margin: 0,
                overflow: 'hidden'
              }}>
              {hasRole('ADMIN') && (
                <>
                  <li>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                      <span className={styles.navIcon}><ShieldCheck size={18} /></span>
                      Tài khoản hệ thống
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/admin/staffs" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                      <span className={styles.navIcon}><User size={18} /></span>
                      Quản lý nhân viên
                    </NavLink>
                  </li>
                </>
              )}
              <li>
                <NavLink to="/admin/customers" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                  <span className={styles.navIcon}><Users size={18} /></span>
                  Khách hàng
                </NavLink>
              </li>
              </ul>
            </div>
          </li>

          <li className={styles.navGroup}>
            <div 
              className={styles.navLink} 
              onClick={() => toggleMenu('appointments')}
              style={{ cursor: 'pointer', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className={styles.navIcon}><Calendar size={20} /></span>
                Quản lý lịch hẹn
              </div>
              <span style={{ 
                display: 'flex',
                transform: openMenus.appointments ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.3s' 
              }}>
                <ChevronDown size={16} />
              </span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateRows: openMenus.appointments ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.3s ease-in-out',
            }}>
              <ul style={{ 
                listStyle: 'none', 
                paddingLeft: '24px', 
                margin: 0,
                overflow: 'hidden'
              }}>
                <li>
                  <NavLink to="/admin/bookings" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                  <span className={styles.navIcon}><Calendar size={18} /></span>
                  Lịch hẹn
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/closed-periods" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                  <span className={styles.navIcon}><CalendarOff size={18} /></span>
                  Ngày nghỉ
                </NavLink>
              </li>
              </ul>
            </div>
          </li>

          <li className={styles.navGroup}>
            <div 
              className={styles.navLink} 
              onClick={() => toggleMenu('services')}
              style={{ cursor: 'pointer', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className={styles.navIcon}><Sparkles size={20} /></span>
                Quản lý dịch vụ
              </div>
              <span style={{ 
                display: 'flex',
                transform: openMenus.services ? 'rotate(180deg)' : 'rotate(0deg)', 
                transition: 'transform 0.3s' 
              }}>
                <ChevronDown size={16} />
              </span>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateRows: openMenus.services ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.3s ease-in-out',
            }}>
              <ul style={{ 
                listStyle: 'none', 
                paddingLeft: '24px', 
                margin: 0,
                overflow: 'hidden'
              }}>
              <li>
                <NavLink to="/admin/services" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                  <span className={styles.navIcon}><Sparkles size={18} /></span>
                  Dịch vụ
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/category-services" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}>
                  <span className={styles.navIcon}><List size={18} /></span>
                  Danh mục dịch vụ
                </NavLink>
              </li>
              </ul>
            </div>
          </li>
          <li>
            <NavLink
              to="/admin/contacts"
              className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
              <span className={styles.navIcon}><Mail size={20} /></span>
              Liên hệ
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/admin/chat" 
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
                navigate('/admin/login');
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
              <NavLink to="/admin/profile" className={styles.dropdownItem} onClick={() => setIsDropdownOpen(false)}>
                <User size={18} className={styles.dropdownItemIcon} /> Thông tin cá nhân
              </NavLink>
              <button 
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                    logout();
                    navigate('/admin/login');
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
