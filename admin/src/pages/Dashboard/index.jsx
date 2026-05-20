import { useEffect, useMemo, useState } from 'react';
import { Calendar, CircleDollarSign, Users, Star, ShieldCheck, CheckCircle } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Dashboard.module.css';

const API_URL = 'http://localhost:5000/api';

const statusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

const todayString = () => new Date().toISOString().slice(0, 10);
const currentMonth = () => todayString().slice(0, 7);
const currentYear = () => todayString().slice(0, 4);
const monthStart = () => `${currentMonth()}-01`;

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDate = (value) => (value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : '—');

const getStatusClass = (status) => {
  if (status === 'CONFIRMED' || status === 'COMPLETED') return styles.statusSuccess;
  if (status === 'PENDING') return styles.statusWarning;
  if (status === 'CANCELLED') return styles.statusDanger;
  return styles.statusDefault;
};

const getChartPercent = (value, maxValue) => (maxValue > 0 ? Math.max((value / maxValue) * 100, 6) : 0);

const DashboardTable = ({ columns, rows, emptyText }) => (
  <div className={styles.tableContainer}>
    {rows.length === 0 ? (
      <div className={styles.emptyState}>{emptyText}</div>
    ) : (
      <table className={styles.table}>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.customerPhone || row.serviceName || index}>
              {columns.map((column) => <td key={column.key}>{column.render(row, index)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default function Dashboard() {
  const { authFetch } = useAuth();
  const [period, setPeriod] = useState('day');
  const [date, setDate] = useState(todayString());
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(currentYear());
  const [startDate, setStartDate] = useState(monthStart());
  const [endDate, setEndDate] = useState(todayString());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (period === 'day') params.set('date', date);
    if (period === 'month') params.set('month', month);
    if (period === 'year') params.set('year', year);
    if (period === 'range') {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    return params.toString();
  }, [period, date, month, year, startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authFetch(`${API_URL}/dashboard/stats?${queryString}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải thống kê dashboard.');
      }

      setDashboardData(result.data);
    } catch (statsError) {
      setError(statsError.message || 'Không thể tải thống kê dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [queryString]);

  const summary = dashboardData?.summary || {};
  const statCards = [
    { label: 'Lịch hẹn trong kỳ', value: summary.totalBookings || 0, icon: <Calendar size={24} />, meta: dashboardData?.filters?.label || 'Đang tải' },
    { label: 'Doanh thu ước tính', value: formatCurrency(summary.estimatedRevenue), icon: <CircleDollarSign size={24} />, meta: 'Theo giá dịch vụ hiện tại' },
    { label: 'Khách mới', value: summary.newCustomers || 0, icon: <Users size={24} />, meta: `${summary.uniqueCustomers || 0} khách duy nhất` },
    { label: 'Đã hoàn thành', value: summary.completedBookings || 0, icon: <ShieldCheck size={24} />, meta: `${summary.pendingBookings || 0} chờ xác nhận` },
    { label: 'Giá trị trung bình', value: formatCurrency(summary.averageBookingValue), icon: <Star size={24} />, meta: `${summary.unpricedBookings || 0} lịch chưa có giá` },
    { label: 'Đã xác nhận', value: summary.confirmedBookings || 0, icon: <CheckCircle size={24} />, meta: `${summary.cancelledBookings || 0} lịch đã hủy` },
  ];

  const statusChart = [
    { label: 'Chờ xác nhận', value: summary.pendingBookings || 0, className: styles.chartWarning },
    { label: 'Đã xác nhận', value: summary.confirmedBookings || 0, className: styles.chartPrimary },
    { label: 'Hoàn thành', value: summary.completedBookings || 0, className: styles.chartSuccess },
    { label: 'Đã hủy', value: summary.cancelledBookings || 0, className: styles.chartDanger },
  ];
  const maxStatusValue = Math.max(...statusChart.map((item) => item.value), 0);
  const topServiceMax = Math.max(...(dashboardData?.topServices || []).map((item) => item.bookingCount), 0);

  const bookingColumns = [
    { key: 'customer', label: 'Khách hàng', render: (row) => <strong>{row.customerName}</strong> },
    { key: 'service', label: 'Dịch vụ', render: (row) => row.serviceName },
    { key: 'time', label: 'Thời gian', render: (row) => `${formatDate(row.bookingDate)} ${String(row.bookingTime || '').slice(0, 5)}` },
    { key: 'status', label: 'Trạng thái', render: (row) => <span className={`${styles.statusBadge} ${getStatusClass(row.status)}`}>{statusLabels[row.status] || row.status}</span> },
    { key: 'price', label: 'Giá trị', render: (row) => <span className={styles.priceText}>{formatCurrency(row.estimatedPrice)}</span> },
  ];

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Tổng quan Dashboard</h2>
          <p className={styles.pageDescription}>Theo dõi hiệu suất đặt lịch, khách hàng và dịch vụ nổi bật theo từng khoảng thời gian.</p>
        </div>
        <button className={styles.btnPrimary} type="button" onClick={fetchStats} disabled={loading}>Làm mới</button>
      </div>

      <div className={styles.filtersBar}>
        <select value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="day">Theo ngày</option>
          <option value="month">Theo tháng</option>
          <option value="year">Theo năm</option>
          <option value="range">Khoảng ngày</option>
        </select>
        {period === 'day' && <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />}
        {period === 'month' && <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />}
        {period === 'year' && <input type="number" min="2020" max="2100" value={year} onChange={(event) => setYear(event.target.value)} />}
        {period === 'range' && (
          <>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </>
        )}
        <span>Số tiền được ước tính theo giá dịch vụ hiện tại.</span>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <div key={stat.label} className={styles.statCard} style={{ '--delay': `${index * 60}ms` }}>
            <div className={styles.statIcon}>{stat.icon}</div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{loading ? '...' : stat.value}</div>
              <div className={styles.statMeta}>{stat.meta}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className={styles.stateBox}>Đang tải thống kê dashboard...</div>
      ) : dashboardData ? (
        <>
          <div className={styles.chartGrid}>
            <section className={styles.chartCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Tình trạng lịch hẹn</h3>
                <span>{summary.totalBookings || 0} lịch</span>
              </div>
              <div className={styles.statusChart}>
                {statusChart.map((item) => (
                  <div key={item.label} className={styles.chartRow}>
                    <div className={styles.chartInfo}>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className={styles.chartTrack}>
                      <div className={`${styles.chartBar} ${item.className}`} style={{ width: `${getChartPercent(item.value, maxStatusValue)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.chartCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Biểu đồ dịch vụ nổi bật</h3>
                <span>Top lượt đặt</span>
              </div>
              {(dashboardData.topServices || []).length === 0 ? (
                <div className={styles.emptyState}>Chưa có dữ liệu dịch vụ để vẽ biểu đồ.</div>
              ) : (
                <div className={styles.serviceChart}>
                  {(dashboardData.topServices || []).slice(0, 5).map((service, index) => (
                    <div key={service.serviceName} className={styles.serviceBarItem} style={{ '--delay': `${index * 80}ms` }}>
                      <div className={styles.serviceBarLabel}>
                        <strong>{service.serviceName}</strong>
                        <span>{service.bookingCount} lượt</span>
                      </div>
                      <div className={styles.serviceBarTrack}>
                        <div className={styles.serviceBar} style={{ width: `${getChartPercent(service.bookingCount, topServiceMax)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className={styles.priceStatsGrid}>
            <div className={styles.priceCard}>
              <span>Giá thấp nhất</span>
              <strong>{dashboardData.priceStats.lowest ? formatCurrency(dashboardData.priceStats.lowest.estimatedPrice) : 'Chưa có'}</strong>
              <p>{dashboardData.priceStats.lowest?.serviceName || 'Chưa có dữ liệu giá trong kỳ này.'}</p>
            </div>
            <div className={styles.priceCard}>
              <span>Giá cao nhất</span>
              <strong>{dashboardData.priceStats.highest ? formatCurrency(dashboardData.priceStats.highest.estimatedPrice) : 'Chưa có'}</strong>
              <p>{dashboardData.priceStats.highest?.serviceName || 'Chưa có dữ liệu giá trong kỳ này.'}</p>
            </div>
          </div>

          <div className={styles.dashboardGrid}>
            <section className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Top khách hàng</h3>
              <DashboardTable
                rows={dashboardData.topCustomers || []}
                emptyText="Chưa có khách hàng trong kỳ này."
                columns={[
                  { key: 'name', label: 'Khách hàng', render: (row) => <strong>{row.customerName}</strong> },
                  { key: 'phone', label: 'SĐT', render: (row) => row.customerPhone },
                  { key: 'count', label: 'Số lịch', render: (row) => row.bookingCount },
                  { key: 'revenue', label: 'Giá trị', render: (row) => <span className={styles.priceText}>{formatCurrency(row.estimatedRevenue)}</span> },
                ]}
              />
            </section>

            <section className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Top dịch vụ được đặt</h3>
              <DashboardTable
                rows={dashboardData.topServices || []}
                emptyText="Chưa có dịch vụ được đặt trong kỳ này."
                columns={[
                  { key: 'service', label: 'Dịch vụ', render: (row) => <strong>{row.serviceName}</strong> },
                  { key: 'count', label: 'Lượt đặt', render: (row) => row.bookingCount },
                  { key: 'revenue', label: 'Giá trị', render: (row) => <span className={styles.priceText}>{formatCurrency(row.estimatedRevenue)}</span> },
                ]}
              />
            </section>

            <section className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Khách hàng mới</h3>
              <DashboardTable
                rows={dashboardData.newCustomers || []}
                emptyText="Chưa có khách hàng mới trong kỳ này."
                columns={[
                  { key: 'name', label: 'Khách hàng', render: (row) => <strong>{row.customerName}</strong> },
                  { key: 'phone', label: 'SĐT', render: (row) => row.customerPhone },
                  { key: 'date', label: 'Ngày đầu tiên', render: (row) => formatDate(row.firstBookingDate) },
                  { key: 'service', label: 'Dịch vụ', render: (row) => row.serviceName },
                ]}
              />
            </section>

            <section className={styles.sectionBlock}>
              <h3 className={styles.sectionTitle}>Lịch hẹn sắp tới</h3>
              <DashboardTable rows={dashboardData.bookings?.upcoming || []} columns={bookingColumns} emptyText="Không có lịch hẹn sắp tới trong kỳ này." />
            </section>
          </div>

          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Lịch gần đây</h3>
            <DashboardTable rows={dashboardData.bookings?.recent || []} columns={bookingColumns} emptyText="Chưa có lịch gần đây trong kỳ này." />
          </section>
        </>
      ) : null}
    </div>
  );
}
