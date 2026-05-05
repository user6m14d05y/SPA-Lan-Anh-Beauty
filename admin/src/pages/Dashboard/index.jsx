import React from 'react';
import { Calendar, CircleDollarSign, Users, Star } from '../../icons.jsx';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const stats = [
    { label: "Lịch hẹn hôm nay", value: "12", icon: <Calendar size={24} /> },
    { label: "Doanh thu ngày", value: "5.2M", icon: <CircleDollarSign size={24} /> },
    { label: "Khách hàng mới", value: "4", icon: <Users size={24} /> },
    { label: "Đánh giá 5 sao", value: "8", icon: <Star size={24} /> }
  ];

  return (
    <div>
      <div className={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statCard}>
            <div className={styles.statIcon}>
              {stat.icon}
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={styles.statValue}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.sectionBlock}>
        <h2 className={styles.sectionTitle}>Lịch hẹn sắp tới</h2>
        <div className={styles.emptyState}>
          Chưa có dữ liệu. Vui lòng kết nối API backend.
        </div>
      </div>
    </div>
  );
}
