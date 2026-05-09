import React, { useState, useEffect } from 'react';
import { Eye, MessageSquareReply, Trash2, Phone, Mail } from '../../icons.jsx';
import styles from './Contacts.module.css';
import { useAuth } from '../../context/AuthContext';

export default function Contacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await authFetch('http://localhost:5000/api/contacts');
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching contacts:", err);
      setError("Không thể tải danh sách liên hệ.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action) => {
    alert(`Đã thực hiện: ${action}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Liên hệ từ Khách hàng</h2>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải dữ liệu...</div>
        ) : error ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>
        ) : (
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
              {messages.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Không có liên hệ nào.</td>
                </tr>
              )}
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
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={msg.message}>
                      {msg.message}
                    </div>
                  </td>
                  <td>{formatDate(msg.createdAt)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${msg.status === 'resolved' ? styles.statusSuccess : styles.statusWarning}`}>
                      {msg.status === 'resolved' ? 'Đã phản hồi' : 'Chưa đọc'}
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
        )}
      </div>
    </div>
  );
}
