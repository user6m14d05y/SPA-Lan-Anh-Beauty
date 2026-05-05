import React from 'react';
import { Sparkles, Edit, Trash2, Plus } from '../../icons.jsx';
import styles from './Services.module.css';

export default function Services() {
  const services = [
    { id: 1, name: "Phun Thêu Thẩm Mỹ", price: "1.500.000đ", duration: "120 phút", status: "Đang hoạt động" },
    { id: 2, name: "Chăm Sóc Da Chuyên Sâu", price: "500.000đ", duration: "60 phút", status: "Đang hoạt động" },
    { id: 3, name: "Massage Thư Giãn", price: "350.000đ", duration: "45 phút", status: "Đang hoạt động" },
  ];

  const handleAction = (action) => {
    alert(`Đã chọn thao tác: ${action}`);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Quản lý Dịch vụ</h2>
        <button className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Thêm dịch vụ
        </button>
      </div>

      <div className={styles.serviceGrid}>
        {services.map((service) => (
          <div key={service.id} className={styles.serviceCard}>
            <div className={styles.serviceImg}>
              <Sparkles size={48} />
            </div>
            <div className={styles.serviceInfo}>
              <h3>{service.name}</h3>
              <div className={styles.serviceMeta}>
                <span>Giá: <span className={styles.servicePrice}>{service.price}</span></span>
                <span>Thời gian: {service.duration}</span>
              </div>
              <div className={styles.serviceFooter}>
                <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
                  {service.status}
                </span>
                <div>
                  <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => handleAction('Sửa')}><Edit size={16} /> Sửa</button>
                  <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleAction('Xóa')}><Trash2 size={16} /> Xóa</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
