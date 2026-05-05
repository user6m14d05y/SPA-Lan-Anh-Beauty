import React, { useState } from 'react';
import styles from './Booking.module.css';

export default function Booking() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect with backend API later
    console.log('Booking submitted:', formData);
    alert('Cảm ơn bạn đã đặt lịch! Chúng tôi sẽ liên hệ sớm nhất để xác nhận.');
    setFormData({
      name: '',
      phone: '',
      service: '',
      date: '',
      time: '',
      notes: ''
    });
  };

  return (
    <div className={styles.bookingWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>Đặt Lịch Hẹn</h1>
          <p className={styles.heroSubtitle}>
            Hãy để Lan Anh Beauty chăm sóc vẻ đẹp của bạn. Vui lòng điền thông tin bên dưới để đặt lịch với chuyên gia của chúng tôi.
          </p>
        </div>
      </section>

      <div className={styles.bookingContainer}>
        <div className={styles.bookingInfo}>
          <div>
            <h2 className={styles.infoTitle}>Thông Tin Liên Hệ</h2>
            <p className={styles.infoDesc}>
              Để mang lại trải nghiệm tốt nhất, chúng tôi khuyến khích bạn đặt lịch trước. Đội ngũ nhân viên luôn sẵn sàng hỗ trợ và tư vấn nhiệt tình.
            </p>
            <ul className={styles.contactList}>
              <li>
                <span>📍</span>
                <span>123 Đường Sắc Đẹp, Quận Hoàn Kiếm, Hà Nội</span>
              </li>
              <li>
                <span>📞</span>
                <span>Hotline: 0987 654 321</span>
              </li>
              <li>
                <span>✉️</span>
                <span>Email: contact@lananhbeauty.vn</span>
              </li>
              <li>
                <span>⏰</span>
                <span>Giờ mở cửa: 08:00 - 20:00 (Tất cả các ngày)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.bookingForm}>
          <div className={styles.formHeader}>
            <h3>Đăng Ký Dịch Vụ</h3>
            <p>Điền thông tin của bạn và chúng tôi sẽ giữ chỗ cho bạn</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Họ và Tên *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Vd: Nguyễn Văn A"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Số Điện Thoại *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09xx xxx xxx"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="service">Dịch Vụ Quan Tâm *</label>
                <select
                  id="service"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Chọn dịch vụ</option>
                  <option value="phun-theu">Phun Thêu Thẩm Mỹ</option>
                  <option value="cham-soc-da">Chăm Sóc Da Chuyên Sâu</option>
                  <option value="massage">Massage Thư Giãn</option>
                  <option value="tri-lieu">Trị Liệu Công Nghệ Cao</option>
                  <option value="khac">Dịch Vụ Khác</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="date">Ngày Hẹn *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="time">Giờ Hẹn Mong Muốn *</label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="notes">Ghi Chú Thêm</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Bạn có yêu cầu gì đặc biệt hay thắc mắc về dịch vụ không?"
                ></textarea>
              </div>
            </div>
            
            <button type="submit" className={styles.btnSubmit}>
              Hoàn Tất Đặt Lịch
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
