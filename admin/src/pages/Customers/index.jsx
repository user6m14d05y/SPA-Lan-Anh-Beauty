import React from 'react';
import { Eye, Edit, Lock } from '../../icons.jsx';
import styles from './Customers.module.css';

export default function Customers() {
  const customers = [
    { id: 1, name: "Nguyễn Văn A", phone: "0987654321", email: "nguyenvana@gmail.com", totalSpent: "5.000.000đ" },
    { id: 2, name: "Trần Thị B", phone: "0912345678", email: "tranthib@gmail.com", totalSpent: "2.500.000đ" },
    { id: 3, name: "Lê Văn C", phone: "0901234567", email: "levanc@gmail.com", totalSpent: "1.200.000đ" },
  ];

  const handleAction = (action) => {
    alert(`Đã chọn thao tác: ${action}`);
  };
  

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Danh sách Khách hàng</h2>
        <div className={styles.headerActions}>
          <input
            type="text"
            placeholder="Tìm kiếm số điện thoại..."
            className={styles.searchInput}
          />
          <button className={styles.btnPrimary} onClick={() => handleAction('Thêm mới')}>Thêm mới</button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ và tên</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Tổng chi tiêu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td style={{ color: 'var(--text-muted)' }}>#{customer.id}</td>
                <td style={{ fontWeight: '500' }}>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{customer.totalSpent}</td>
                <td>
                  <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => handleAction('Chi tiết')}><Eye size={16} /> Chi tiết</button>
                  <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => handleAction('Sửa')}><Edit size={16} /> Sửa</button>
                  <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleAction('Khóa')}><Lock size={16} /> Khóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
