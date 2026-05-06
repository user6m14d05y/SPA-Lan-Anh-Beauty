import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0f1e',
      color: '#f1f5f9',
      textAlign: 'center',
      padding: '20px',
      gap: '16px',
    }}>
      <div style={{ fontSize: '72px', lineHeight: 1 }}>🚫</div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#f87171' }}>
        Không có quyền truy cập
      </h1>
      <p style={{ color: '#64748b', fontSize: '16px', margin: 0, maxWidth: '400px' }}>
        Tài khoản <strong style={{ color: '#94a3b8' }}>{user?.email}</strong> với role{' '}
        <strong style={{ color: '#f59e0b' }}>{user?.role}</strong> không được phép vào trang này.
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Quay lại
        </button>
        <button
          onClick={logout}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
