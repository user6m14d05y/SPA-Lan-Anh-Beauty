import { useEffect, useMemo, useState } from 'react';
import { Eye, X } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext';
import styles from './Appointments.module.css';

const API_URL = 'http://localhost:5000/api';
const ASSET_URL = 'http://localhost:5000';

const statusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

const statusOptions = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const getStatusClass = (status) => {
  if (status === 'CONFIRMED' || status === 'COMPLETED') return styles.statusSuccess;
  if (status === 'PENDING') return styles.statusWarning;
  if (status === 'CANCELLED') return styles.statusDanger;
  return styles.statusDefault;
};

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${ASSET_URL}${path}`;
};

export default function Appointments() {
  const { authFetch } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authFetch(`${API_URL}/bookings?page=${pagination.page}&limit=${pagination.limit}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh sách lịch hẹn.');
      }

      setAppointments(result.data || []);
      setPagination((current) => ({ ...current, ...(result.pagination || {}) }));
    } catch (error) {
      setError(error.message || 'Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [pagination.page, pagination.limit]);

  const filteredAppointments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch = !keyword
        || appointment.customerName?.toLowerCase().includes(keyword)
        || appointment.customerPhone?.toLowerCase().includes(keyword)
        || appointment.serviceName?.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      const matchesDate = !dateFilter || appointment.bookingDate === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  const handleStatusUpdate = async (appointment, status) => {
    const confirmMessages = {
      CONFIRMED: `Xác nhận lịch hẹn #${appointment.id} của ${appointment.customerName}?`,
      COMPLETED: `Đánh dấu lịch hẹn #${appointment.id} là đã hoàn thành?`,
      CANCELLED: `Hủy lịch hẹn #${appointment.id} của ${appointment.customerName}?`,
    };

    if (confirmMessages[status] && !window.confirm(confirmMessages[status])) return;

    try {
      setUpdatingId(appointment.id);
      const response = await authFetch(`${API_URL}/bookings/${appointment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể cập nhật trạng thái.');
      }

      setAppointments((current) => current.map((item) => (
        item.id === appointment.id ? result.data : item
      )));
      setSelectedAppointment((current) => (
        current?.id === appointment.id ? result.data : current
      ));
    } catch (error) {
      alert(error.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Quản lý Lịch hẹn</h2>
          <p className={styles.pageDescription}>Theo dõi lịch hẹn khách đặt từ website và xử lý trạng thái nhanh chóng.</p>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <input
          className={styles.searchInput}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Tìm tên, SĐT hoặc dịch vụ..."
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        <button type="button" className={styles.btnPrimary} onClick={fetchAppointments}>Làm mới</button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.stateBox}>Đang tải lịch hẹn...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className={styles.stateBox}>Không có lịch hẹn phù hợp.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã LH</th>
                <th>Khách hàng</th>
                <th>SĐT</th>
                <th>Dịch vụ</th>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Trạng thái</th>
                <th>Ảnh</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className={styles.mutedText}>#{appointment.id}</td>
                  <td className={styles.customerName}>{appointment.customerName}</td>
                  <td>{appointment.customerPhone}</td>
                  <td>{appointment.serviceName}</td>
                  <td>{appointment.bookingDate}</td>
                  <td>{String(appointment.bookingTime).slice(0, 5)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(appointment.status)}`}>
                      {statusLabels[appointment.status] || appointment.status}
                    </span>
                  </td>
                  <td>
                    {appointment.customerImage ? (
                      <img className={styles.thumbImage} src={getImageUrl(appointment.customerImage)} alt="Ảnh khách gửi" />
                    ) : (
                      <span className={styles.mutedText}>Không có</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button className={`${styles.actionBtn} ${styles.actionView}`} onClick={() => setSelectedAppointment(appointment)}><Eye size={16} /> Xem</button>
                      {appointment.status === 'PENDING' && (
                        <button className={`${styles.actionBtn} ${styles.actionEdit}`} disabled={updatingId === appointment.id} onClick={() => handleStatusUpdate(appointment, 'CONFIRMED')}>Xác nhận</button>
                      )}
                      {appointment.status === 'CONFIRMED' && (
                        <button className={`${styles.actionBtn} ${styles.actionEdit}`} disabled={updatingId === appointment.id} onClick={() => handleStatusUpdate(appointment, 'COMPLETED')}>Hoàn thành</button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                        <button className={`${styles.actionBtn} ${styles.actionDelete}`} disabled={updatingId === appointment.id} onClick={() => handleStatusUpdate(appointment, 'CANCELLED')}>Hủy</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.paginationBar}>
        <span>Hiển thị {appointments.length} / {pagination.total} lịch hẹn</span>
        <div>
          <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}>Trước</button>
          <strong>{pagination.page} / {pagination.totalPages || 1}</strong>
          <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}>Sau</button>
        </div>
      </div>

      {selectedAppointment && (
        <div className={styles.modalOverlay} onClick={() => setSelectedAppointment(null)}>
          <div className={styles.detailModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span>Lịch hẹn #{selectedAppointment.id}</span>
                <h3>{selectedAppointment.customerName}</h3>
              </div>
              <button type="button" className={styles.closeBtn} onClick={() => setSelectedAppointment(null)}><X size={18} /></button>
            </div>

            <div className={styles.detailGrid}>
              <div><span>Số điện thoại</span><strong>{selectedAppointment.customerPhone}</strong></div>
              <div><span>Dịch vụ</span><strong>{selectedAppointment.serviceName}</strong></div>
              <div><span>Ngày hẹn</span><strong>{selectedAppointment.bookingDate}</strong></div>
              <div><span>Giờ hẹn</span><strong>{String(selectedAppointment.bookingTime).slice(0, 5)}</strong></div>
              <div><span>Trạng thái</span><strong>{statusLabels[selectedAppointment.status] || selectedAppointment.status}</strong></div>
              <div><span>Ngày tạo</span><strong>{new Date(selectedAppointment.createdAt).toLocaleString('vi-VN')}</strong></div>
            </div>

            {selectedAppointment.notes && (
              <div className={styles.noteBox}>
                <span>Ghi chú</span>
                <p>{selectedAppointment.notes}</p>
              </div>
            )}

            {selectedAppointment.customerImage && (
              <div className={styles.imageBox}>
                <span>Ảnh khách gửi</span>
                <img src={getImageUrl(selectedAppointment.customerImage)} alt="Ảnh khách gửi" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
