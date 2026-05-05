import React, { useState } from 'react';
import styles from './Contact.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
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
    console.log('Contact form submitted:', formData);
    alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  return (
    <div className={styles.contactWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>Liên Hệ</h1>
          <p className={styles.heroSubtitle}>
            Chúng tôi luôn lắng nghe và sẵn sàng hỗ trợ mọi thắc mắc của bạn về các dịch vụ chăm sóc sắc đẹp.
          </p>
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <h2 className={styles.sectionTitle}>Thông Tin Liên Hệ</h2>
              <p className={styles.sectionDesc}>
                Hãy đến trực tiếp hoặc liên hệ với chúng tôi qua các kênh dưới đây để được tư vấn miễn phí và trải nghiệm dịch vụ đẳng cấp.
              </p>
              
              <ul className={styles.infoList}>
                <li>
                  <div className={styles.icon}>📍</div>
                  <div>
                    <h4>Địa Chỉ</h4>
                    <p>123 Đường Sắc Đẹp, Quận Hoàn Kiếm, Hà Nội</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}>📞</div>
                  <div>
                    <h4>Điện Thoại</h4>
                    <p>0987 654 321</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}>✉️</div>
                  <div>
                    <h4>Email</h4>
                    <p>contact@lananhbeauty.vn</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}>⏰</div>
                  <div>
                    <h4>Giờ Mở Cửa</h4>
                    <p>Thứ 2 - Chủ Nhật: 08:00 - 20:00</p>
                  </div>
                </li>
              </ul>

              <div className={styles.mapContainer}>
                {/* Google Maps Embed iframe */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.096814183571!2d105.82475921540227!3d21.028811893153835!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab7384c750a9%3A0x1d372572186dfc79!2zSMOgIE7hu5lp!5e0!3m2!1svi!2s!4v1683900000000!5m2!1svi!2s"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps Lan Anh Beauty"
                ></iframe>
              </div>
            </div>

            <div className={styles.contactFormContainer}>
              <h2 className={styles.formTitle}>Gửi Tin Nhắn</h2>
              <p className={styles.formDesc}>
                Bạn có câu hỏi? Vui lòng điền vào biểu mẫu dưới đây và chúng tôi sẽ liên hệ lại với bạn.
              </p>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Họ và Tên *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
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
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ email"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="message">Nội Dung Tin Nhắn *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Bạn muốn hỏi gì..."
                    required
                  ></textarea>
                </div>
                <button type="submit" className={styles.btnSubmit}>
                  Gửi Tin Nhắn
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
