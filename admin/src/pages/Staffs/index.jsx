import React, { useState } from 'react';
import { Eye, Edit, Trash2, UserPlus, ShieldCheck, X, User } from '../../icons.jsx';
import styles from './Staffs.module.css';

const ROLES = ['admin', 'staff', 'receptionist'];

const ROLE_LABELS = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  receptionist: 'Lễ tân',
};

const initialStaffs = [
  { id: 1, name: 'Nguyễn Thị Lan Anh', email: 'lananh@spa.vn', phone: '0901234567', role: 'admin', status: 'Đang làm việc', joinDate: '2024-01-15' },
  { id: 2, name: 'Trần Thị Hoa', email: 'hoa.tran@spa.vn', phone: '0912345678', role: 'staff', status: 'Đang làm việc', joinDate: '2024-03-20' },
  { id: 3, name: 'Lê Thị Mai', email: 'mai.le@spa.vn', phone: '0923456789', role: 'receptionist', status: 'Đang làm việc', joinDate: '2024-06-10' },
  { id: 4, name: 'Phạm Văn Bình', email: 'binh.pham@spa.vn', phone: '0934567890', role: 'staff', status: 'Nghỉ phép', joinDate: '2025-01-05' },
];

const emptyForm = { name: '', email: '', phone: '', role: 'staff', status: 'Đang làm việc', password: '' };

export default function Staffs() {
  const [staffs, setStaffs] = useState(initialStaffs);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Filtered list
  const filtered = staffs.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  // Open add modal
  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  };

  // Open edit modal
  const openEdit = (staff) => {
    setForm({ name: staff.name, email: staff.email, phone: staff.phone, role: staff.role, status: staff.status, password: '' });
    setEditingId(staff.id);
    setShowModal(true);
  };

  // Open role change modal
  const openRoleChange = (staff) => {
    setRoleTarget(staff);
    setSelectedRole(staff.role);
    setShowRoleModal(true);
  };

  // Save staff (add or edit)
  const handleSave = () => {
    if (!form.name || !form.email) {
      alert('Vui lòng điền đầy đủ Họ tên và Email!');
      return;
    }
    if (editingId) {
      setStaffs(prev => prev.map(s => s.id === editingId ? { ...s, ...form } : s));
      alert('✅ Đã cập nhật thông tin nhân viên!');
    } else {
      const newStaff = {
        id: Date.now(),
        ...form,
        joinDate: new Date().toISOString().slice(0, 10),
      };
      setStaffs(prev => [...prev, newStaff]);
      alert('✅ Đã tạo tài khoản nhân viên mới!');
    }
    setShowModal(false);
  };

  // Save role change
  const handleRoleSave = () => {
    setStaffs(prev => prev.map(s => s.id === roleTarget.id ? { ...s, role: selectedRole } : s));
    alert(`✅ Đã đổi quyền "${roleTarget.name}" sang "${ROLE_LABELS[selectedRole]}"!`);
    setShowRoleModal(false);
  };

  // Delete staff
  const handleDelete = (id) => {
    setStaffs(prev => prev.filter(s => s.id !== id));
    setConfirmDelete(null);
    alert('🗑️ Đã xóa nhân viên!');
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'admin') return `${styles.roleBadge} ${styles.roleAdmin}`;
    if (role === 'receptionist') return `${styles.roleBadge} ${styles.roleReceptionist}`;
    return `${styles.roleBadge} ${styles.roleStaff}`;
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Quản lý Nhân viên</h2>
        <div className={styles.headerActions}>
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.btnPrimary} onClick={openAdd}>
            <UserPlus size={18} /> Thêm nhân viên
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        {ROLES.map(role => (
          <div key={role} className={styles.summaryCard}>
            <div className={styles.summaryIcon}><ShieldCheck size={22} /></div>
            <div>
              <div className={styles.summaryCount}>{staffs.filter(s => s.role === role).length}</div>
              <div className={styles.summaryLabel}>{ROLE_LABELS[role]}</div>
            </div>
          </div>
        ))}
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}><User size={22} /></div>
          <div>
            <div className={styles.summaryCount}>{staffs.length}</div>
            <div className={styles.summaryLabel}>Tổng nhân viên</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Liên hệ</th>
              <th>Quyền hạn</th>
              <th>Trạng thái</th>
              <th>Ngày vào làm</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Không tìm thấy nhân viên.</td></tr>
            )}
            {filtered.map(staff => (
              <tr key={staff.id}>
                <td>
                  <div className={styles.staffInfo}>
                    <div className={styles.avatar}>{staff.name.charAt(0)}</div>
                    <span style={{ fontWeight: 600 }}>{staff.name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.88rem' }}>{staff.email}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{staff.phone}</div>
                </td>
                <td>
                  <span className={getRoleBadgeClass(staff.role)}>{ROLE_LABELS[staff.role]}</span>
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${staff.status === 'Đang làm việc' ? styles.statusActive : styles.statusLeave}`}>
                    {staff.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{staff.joinDate}</td>
                <td>
                  <div className={styles.actionGroup}>
                    <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => openEdit(staff)} title="Xem & Sửa">
                      <Edit size={15} /> Sửa
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionRole}`} onClick={() => openRoleChange(staff)} title="Đổi quyền">
                      <ShieldCheck size={15} /> Quyền
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => setConfirmDelete(staff)} title="Xóa">
                      <Trash2 size={15} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== MODAL: Thêm / Sửa nhân viên ===== */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingId ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Họ và tên <span className={styles.required}>*</span></label>
                  <input className={styles.formInput} placeholder="Nguyễn Thị A" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Email <span className={styles.required}>*</span></label>
                  <input className={styles.formInput} type="email" placeholder="email@spa.vn" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Số điện thoại</label>
                  <input className={styles.formInput} placeholder="09xxxxxxxx" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Quyền hạn</label>
                  <select className={styles.formInput} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Trạng thái</label>
                  <select className={styles.formInput} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Nghỉ phép">Nghỉ phép</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>{editingId ? 'Đặt lại mật khẩu (để trống nếu không đổi)' : 'Mật khẩu'}</label>
                  <input className={styles.formInput} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Hủy</button>
              <button className={styles.btnPrimary} onClick={handleSave}>
                {editingId ? '💾 Lưu thay đổi' : '✅ Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Đổi quyền ===== */}
      {showRoleModal && roleTarget && (
        <div className={styles.modalOverlay} onClick={() => setShowRoleModal(false)}>
          <div className={styles.modalSmall} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Thay đổi quyền hạn</h3>
              <button className={styles.closeBtn} onClick={() => setShowRoleModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
                Nhân viên: <strong style={{ color: 'var(--primary)' }}>{roleTarget.name}</strong>
              </p>
              <div className={styles.roleOptions}>
                {ROLES.map(r => (
                  <label key={r} className={`${styles.roleOption} ${selectedRole === r ? styles.roleOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={selectedRole === r}
                      onChange={() => setSelectedRole(r)}
                    />
                    <ShieldCheck size={18} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{ROLE_LABELS[r]}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {r === 'admin' && 'Toàn quyền quản lý'}
                        {r === 'staff' && 'Quản lý dịch vụ, lịch hẹn'}
                        {r === 'receptionist' && 'Tiếp đón khách, xem lịch'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowRoleModal(false)}>Hủy</button>
              <button className={styles.btnPrimary} onClick={handleRoleSave}>✅ Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: Xác nhận xóa ===== */}
      {confirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.modalSmall} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận xóa</h3>
              <button className={styles.closeBtn} onClick={() => setConfirmDelete(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <p>Bạn có chắc muốn xóa nhân viên <strong style={{ color: '#b91c1c' }}>{confirmDelete.name}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Hành động này không thể hoàn tác.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setConfirmDelete(null)}>Hủy</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(confirmDelete.id)}>🗑️ Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
