import React from 'react';
import { Eye, MessageSquareReply, Trash2, Phone, Mail } from '../../icons.jsx';
import styles from './Contacts.module.css';

export default function Contacts() {
  const messages = [
    { id: 1, name: "Trần Thu Hà", email: "thuha@gmail.com", phone: "0901234567", content: "Tôi muốn tư vấn về liệu trình trị mụn ẩn.", date: "2026-05-05 14:20", status: "Chưa đọc" },
    { id: 2, name: "Lê Văn B", email: "levanb@gmail.com", phone: "0912233445", content: "Spa có nhận thanh toán bằng thẻ tín dụng không?", date: "2026-05-04 09:15", status: "Đã phản hồi" },
    { id: 3, name: "Nguyễn Ngọc Mai", email: "mai.nguyen@gmail.com", phone: "0988776655", content: "Cho tôi hỏi bảng giá chi tiết tắm trắng phi thuyền.", date: "2026-05-03 16:45", status: "Đã phản hồi" }
  ];

  const handleAction = (action) => {
    alert(`Đã thực hiện: ${action}`);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Liên hệ từ Khách hàng</h2>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Liên lạc</th>
              <th>Nội dung</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td style={{ fontWeight: '500' }}>{msg.name}</td>
                <td>
                  <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Phone size={14} /> {msg.phone}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} /> {msg.email}
                  </div>
                </td>
                <td style={{ maxWidth: '250px' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {msg.content}
                  </div>
                </td>
                <td>{msg.date}</td>
                <td>
                  <span className={`${styles.statusBadge} ${msg.status === 'Chưa đọc' ? styles.statusWarning : styles.statusSuccess}`}>
                    {msg.status}
                  </span>
                </td>
                <td>
                  <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => handleAction('Xem chi tiết')}><Eye size={16} /> Xem</button>
                  <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => handleAction('Phản hồi')}><MessageSquareReply size={16} /> Trả lời</button>
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
