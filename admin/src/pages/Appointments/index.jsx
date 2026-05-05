import React from 'react';
import { Eye, Edit, Trash2 } from '../../icons.jsx';
import styles from './Appointments.module.css';

export default function Appointments() {
  const appointments = [
    { id: 1, customer: "Nguyễn Văn A", service: "Chăm sóc da chuyên sâu", date: "2026-05-06", time: "09:00", status: "Chờ xác nhận" },
    { id: 2, customer: "Trần Thị B", service: "Phun thêu thẩm mỹ", date: "2026-05-06", time: "14:30", status: "Đã xác nhận" },
    { id: 3, customer: "Lê Văn C", service: "Massage thư giãn", date: "2026-05-07", time: "10:00", status: "Đã hoàn thành" },
  ];

  const handleAction = (action) => {
    alert(`Đã chọn thao tác: ${action}`);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Quản lý Lịch hẹn</h2>
        <button className={styles.btnPrimary}>+ Thêm lịch hẹn mới</button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã LH</th>
              <th>Khách hàng</th>
              <th>Dịch vụ</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt.id}>
                <td style={{ color: 'var(--text-muted)' }}>#{apt.id}</td>
                <td style={{ fontWeight: '500' }}>{apt.customer}</td>
                <td>{apt.service}</td>
                <td>{apt.time} - {apt.date}</td>
                <td>
                  <span className={`${styles.statusBadge} ${
                    apt.status === 'Đã xác nhận' || apt.status === 'Đã hoàn thành' ? styles.statusSuccess :
                    apt.status === 'Chờ xác nhận' ? styles.statusWarning : styles.statusDefault
                  }`}>
                    {apt.status}
                  </span>
                </td>
                <td>
                  <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => handleAction('Xem chi tiết')}><Eye size={16} /> Xem</button>
                  <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => handleAction('Sửa')}><Edit size={16} /> Sửa</button>
                  <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleAction('Xóa')}><Trash2 size={16} /> Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
