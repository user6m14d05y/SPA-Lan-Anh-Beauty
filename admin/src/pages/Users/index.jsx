import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, User, X } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext';
import styles from './Users.module.css';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  role: 'STAFF',
  isActive: true,
  password: '',
};

const formatDateTime = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Users() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authFetch('http://localhost:5000/api/users');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh sách tài khoản.');
      }

      setUsers(result.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((item) =>
      item.fullName?.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword) ||
      item.phone?.toLowerCase().includes(keyword) ||
      item.role?.toLowerCase().includes(keyword)
    );
  }, [users, search]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setForm({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'STAFF',
      isActive: Boolean(user.isActive),
      password: '',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
    setEditingUser(null);
    setForm(emptyForm);
    setFormError('');
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setFormError('');

      const payload = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        role: form.role,
        isActive: form.isActive,
      };

      if (!editingUser || form.password.trim()) {
        payload.password = form.password;
      }

      const url = editingUser
        ? `http://localhost:5000/api/users/${editingUser.id}`
        : 'http://localhost:5000/api/users';

      const response = await authFetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể lưu tài khoản.');
      }

      await loadUsers();
      closeModal();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAdmins = users.filter((item) => item.role === 'ADMIN').length;
  const totalStaffs = users.filter((item) => item.role === 'STAFF').length;
  const totalActive = users.filter((item) => item.isActive).length;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Quản lý tài khoản</h2>
        <div className={styles.headerActions}>
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            className={styles.searchInput}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className={styles.btnPrimary} onClick={openCreateModal}>
            <Plus size={18} /> Tạo tài khoản
          </button>
        </div>
      </div>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><User size={22} /></div>
          <div>
            <div className={styles.summaryCount}>{users.length}</div>
            <div className={styles.summaryLabel}>Tổng tài khoản</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><User size={22} /></div>
          <div>
            <div className={styles.summaryCount}>{totalAdmins}</div>
            <div className={styles.summaryLabel}>Quản trị viên</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><User size={22} /></div>
          <div>
            <div className={styles.summaryCount}>{totalStaffs}</div>
            <div className={styles.summaryLabel}>Nhân viên</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><User size={22} /></div>
          <div>
            <div className={styles.summaryCount}>{totalActive}</div>
            <div className={styles.summaryLabel}>Đang hoạt động</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Cập nhật gần nhất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className={styles.emptyRow}>Không tìm thấy tài khoản nào.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}>{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</div>
                        <div>
                          <div className={styles.userName}>{user.fullName}</div>
                          <div className={styles.userId}>#{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{user.email}</div>
                      <div className={styles.subtleText}>{user.phone}</div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${user.role === 'ADMIN' ? styles.roleAdmin : styles.roleStaff}`}>
                        {user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.isActive ? styles.statusActive : styles.statusInactive}`}>
                        {user.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>{formatDateTime(user.createdAt)}</td>
                    <td className={styles.dateCell}>{formatDateTime(user.updatedAt)}</td>
                    <td>
                      <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => openEditModal(user)}>
                        <Edit size={15} /> Sửa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingUser ? 'Cập nhật tài khoản' : 'Tạo tài khoản mới'}</h3>
              <button className={styles.closeBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Họ và tên</label>
                  <input
                    className={styles.formInput}
                    value={form.fullName}
                    onChange={(event) => handleChange('fullName', event.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    className={styles.formInput}
                    type="email"
                    value={form.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    placeholder="Nhập email"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Số điện thoại</label>
                  <input
                    className={styles.formInput}
                    value={form.phone}
                    onChange={(event) => handleChange('phone', event.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Vai trò</label>
                  <select
                    className={styles.formInput}
                    value={form.role}
                    onChange={(event) => handleChange('role', event.target.value)}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Trạng thái</label>
                  <select
                    className={styles.formInput}
                    value={String(form.isActive)}
                    onChange={(event) => handleChange('isActive', event.target.value === 'true')}
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Đã khóa</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{editingUser ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}</label>
                  <input
                    className={styles.formInput}
                    type="password"
                    value={form.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder={editingUser ? 'Để trống nếu không đổi' : 'Nhập mật khẩu'}
                  />
                </div>
              </div>

              {editingUser && (
                <div className={styles.auditBox}>
                  <div><strong>Ngày tạo:</strong> {formatDateTime(editingUser.createdAt)}</div>
                  <div><strong>Cập nhật gần nhất:</strong> {formatDateTime(editingUser.updatedAt)}</div>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeModal}>Hủy</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Đang lưu...' : editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
