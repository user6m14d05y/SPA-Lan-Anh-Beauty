import { useEffect, useMemo, useState } from 'react';
import { Eye } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Customers.module.css';

const API_URL = 'http://localhost:5000/api';

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
};

export default function Customers() {
  const { authFetch } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authFetch(`${API_URL}/customers`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh sách khách hàng.');
      }

      setCustomers(result.data || []);
    } catch (customerError) {
      setError(customerError.message || 'Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return customers;

    return customers.filter((customer) => (
      customer.name?.toLowerCase().includes(keyword)
      || customer.phone?.toLowerCase().includes(keyword)
    ));
  }, [customers, searchTerm]);

  const topCustomer = customers[0];

  const handleAction = (customer) => {
    alert(`Khách hàng: ${customer.name}\nSĐT: ${customer.phone}\nTổng chi tiêu: ${formatCurrency(customer.totalSpent)}`);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Danh sách Khách hàng</h2>
          <p className={styles.pageDescription}>Dữ liệu được tổng hợp từ lịch hẹn thực tế, sắp xếp theo tổng chi tiêu.</p>
        </div>
        <div className={styles.headerActions}>
          <input
            type="text"
            placeholder="Tìm tên hoặc số điện thoại..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button className={styles.btnPrimary} type="button" onClick={fetchCustomers} disabled={loading}>
            Làm mới
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {topCustomer && !loading ? (
        <div className={styles.topCustomerCard}>
          <span>Khách chi tiêu cao nhất</span>
          <div>
            <h3>{topCustomer.name}</h3>
            <strong>{formatCurrency(topCustomer.totalSpent)}</strong>
          </div>
          <p>{topCustomer.phone} • {topCustomer.completedBookingCount} lịch hoàn thành</p>
        </div>
      ) : null}

      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.stateBox}>Đang tải khách hàng...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className={styles.stateBox}>Không có khách hàng phù hợp.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ và tên</th>
                <th>Số điện thoại</th>
                <th>Số lịch</th>
                <th>Lịch hoàn thành</th>
                <th>Lần đặt gần nhất</th>
                <th>Tổng chi tiêu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.phone}>
                  <td style={{ color: 'var(--text-muted)' }}>#{customer.id}</td>
                  <td style={{ fontWeight: '500' }}>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.bookingCount}</td>
                  <td>{customer.completedBookingCount}</td>
                  <td>{formatDate(customer.latestBookingDate)}</td>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>{formatCurrency(customer.totalSpent)}</td>
                  <td>
                    <button className={`${styles.actionBtn} ${styles.actionView}`} type="button" onClick={() => handleAction(customer)}>
                      <Eye size={16} /> Chi tiết
                    </button>
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
