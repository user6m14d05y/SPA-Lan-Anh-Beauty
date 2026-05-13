import React, { useEffect, useState } from 'react';
import { Eye, Mail, MessageSquareReply, Phone, Trash2 } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext';
import styles from './Contacts.module.css';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [replyContact, setReplyContact] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [actionError, setActionError] = useState('');
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authFetch('http://localhost:5000/api/contacts');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh sách liên hệ.');
      }

      setContacts(result.data || []);
    } catch (error) {
      setError(error.message || 'Không thể tải danh sách liên hệ.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusLabel = (status) => (status === 'REPLIED' ? 'Đã phản hồi' : 'Chưa phản hồi');

  const openReplyModal = (contact) => {
    if (contact.status === 'REPLIED') {
      setActionError('Liên hệ này đã được trả lời trước đó.');
      return;
    }

    setReplyContact(contact);
    setReplyMessage('');
    setActionError('');
  };

  const closeReplyModal = () => {
    setReplyContact(null);
    setReplyMessage('');
    setActionError('');
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyContact) return;

    try {
      setSubmittingReply(true);
      setActionError('');
      const response = await authFetch(`http://localhost:5000/api/contacts/${replyContact.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ replyMessage }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể gửi phản hồi.');
      }

      closeReplyModal();
      await fetchContacts();
    } catch (error) {
      setActionError(error.message || 'Không thể gửi phản hồi.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (contact) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa liên hệ của ${contact.name}?`);
    if (!confirmed) return;

    try {
      setActionError('');
      const response = await authFetch(`http://localhost:5000/api/contacts/${contact.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể xóa liên hệ.');
      }

      await fetchContacts();
    } catch (error) {
      setActionError(error.message || 'Không thể xóa liên hệ.');
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Liên hệ từ Khách hàng</h2>
      </div>

      {actionError && <div className={styles.errorBox}>{actionError}</div>}

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.emptyState}>Đang tải dữ liệu...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
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
              {contacts.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.emptyCell}>Không có liên hệ nào.</td>
                </tr>
              )}
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className={styles.customerName}>{contact.name}</td>
                  <td>
                    <div className={styles.contactLine}>
                      <Phone size={14} /> {contact.phone}
                    </div>
                    <div className={styles.contactLineMuted}>
                      <Mail size={14} /> {contact.email}
                    </div>
                  </td>
                  <td className={styles.messageCell}>
                    <div className={styles.messagePreview} title={contact.message}>
                      {contact.message}
                    </div>
                  </td>
                  <td>{formatDate(contact.createdAt)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${contact.status === 'REPLIED' ? styles.statusSuccess : styles.statusWarning}`}>
                      {getStatusLabel(contact.status)}
                    </span>
                  </td>
                  <td>
                    <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => setSelectedContact(contact)}>
                      <Eye size={16} /> Xem
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionEdit}`}
                      onClick={() => openReplyModal(contact)}
                      disabled={contact.status === 'REPLIED'}
                      title={contact.status === 'REPLIED' ? 'Liên hệ này đã được trả lời' : 'Trả lời liên hệ'}
                    >
                      <MessageSquareReply size={16} /> {contact.status === 'REPLIED' ? 'Đã trả lời' : 'Trả lời'}
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleDelete(contact)}>
                      <Trash2 size={16} /> Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedContact && (
        <div className={styles.modalOverlay} onClick={() => setSelectedContact(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Chi tiết liên hệ</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedContact(null)}>×</button>
            </div>
            <div className={styles.detailGrid}>
              <div><strong>Khách hàng:</strong> {selectedContact.name}</div>
              <div><strong>Email:</strong> {selectedContact.email}</div>
              <div><strong>Số điện thoại:</strong> {selectedContact.phone}</div>
              <div><strong>Ngày gửi:</strong> {formatDate(selectedContact.createdAt)}</div>
              <div><strong>Trạng thái:</strong> {getStatusLabel(selectedContact.status)}</div>
              <div><strong>Ngày phản hồi:</strong> {formatDate(selectedContact.repliedAt)}</div>
            </div>
            <div className={styles.detailBlock}>
              <strong>Nội dung khách gửi:</strong>
              <p>{selectedContact.message}</p>
            </div>
            {selectedContact.replyMessage && (
              <div className={styles.detailBlock}>
                <strong>Nội dung đã phản hồi:</strong>
                <p>{selectedContact.replyMessage}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {replyContact && (
        <div className={styles.modalOverlay} onClick={closeReplyModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Trả lời {replyContact.name}</h3>
              <button type="button" className={styles.closeBtn} onClick={closeReplyModal}>×</button>
            </div>
            {actionError && <div className={styles.errorBox}>{actionError}</div>}
            <form onSubmit={handleReplySubmit} className={styles.replyForm}>
              <label htmlFor="replyMessage">Nội dung phản hồi</label>
              <textarea
                id="replyMessage"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Nhập nội dung phản hồi gửi tới email khách hàng"
                required
              />
              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={closeReplyModal}>Hủy</button>
                <button type="submit" className={styles.btnPrimary} disabled={submittingReply}>
                  {submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
