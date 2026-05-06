import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Bảo vệ route — chỉ cho phép user đã đăng nhập với role phù hợp
 * @param {string[]} roles - Danh sách role được phép (mặc định: ADMIN và STAFF)
 */
export default function ProtectedRoute({ children, roles = ['ADMIN', 'STAFF'] }) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  // Đang kiểm tra token trong localStorage → hiển thị loading
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0f172a',
        color: '#94a3b8',
        fontSize: '16px',
        gap: '12px',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #334155',
          borderTop: '3px solid #a78bfa',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        Đang xác thực...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Chưa đăng nhập → về trang login, lưu lại URL để sau login redirect đúng
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Đã đăng nhập nhưng không đúng role → trang 403
  if (!hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
