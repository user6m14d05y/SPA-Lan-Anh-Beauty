import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'spa_auth';
const API_URL = 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true); // Đang kiểm tra token lưu sẵn

  // Khôi phục session khi refresh trang
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { user: storedUser, accessToken: storedToken, expiresAt } = JSON.parse(stored);
        // Kiểm tra token còn hạn không
        if (expiresAt && Date.now() < expiresAt) {
          setUser(storedUser);
          setAccessToken(storedToken);
        } else {
          // Token hết hạn → xóa
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Đăng nhập thất bại');
    }

    const { user: userData, accessToken: token, refreshToken, expiresIn } = data.data;

    // Tính thời điểm hết hạn
    const expiresAt = Date.now() + expiresIn * 1000;

    // Lưu vào localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      user: userData,
      accessToken: token,
      refreshToken,
      expiresAt,
    }));

    setUser(userData);
    setAccessToken(token);

    return userData;
  }, []);

  const logout = useCallback(async () => {
    // Gửi refreshToken lên backend để xóa khỏi DB
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { refreshToken } = JSON.parse(stored);
        if (refreshToken) {
          await fetch(`${API_URL}/users/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
        }
      } catch { /* Bỏ qua lỗi mạng khi logout */ }
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setAccessToken(null);
  }, []);

  const hasRole = useCallback((...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  // Tạo axios-like fetch với token tự động
  const authFetch = useCallback(async (url, options = {}) => {
    if (!accessToken) throw new Error('Chưa đăng nhập');
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
  }, [accessToken]);

  const value = {
    user,
    accessToken,
    loading,
    isAuthenticated: !!user && !!accessToken,
    login,
    logout,
    hasRole,
    authFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook để dùng AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
}
