import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, RefreshCw } from '../../icons.jsx';
import styles from './Contact.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Captcha state
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');

  const fetchCaptcha = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/contacts/captcha');
      const data = await res.json();
      setCaptchaSvg(data.svg);
      setCaptchaToken(data.token);
      setCaptchaCode('');
    } catch {
      // nếu không lấy được thì bỏ trống
      setCaptchaSvg('');
    }
  };

  const refreshCaptcha = () => fetchCaptcha();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = requireCaptcha
        ? { ...formData, captchaCode, captchaToken }
        : formData;

      const response = await fetch('http://localhost:5000/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        if ((response.status === 429 || response.status === 400) && result.requireCaptcha) {
          if (!requireCaptcha) {
            setRequireCaptcha(true);
            await fetchCaptcha();
          } else {
            await refreshCaptcha();
          }
          throw new Error(result.message);
        }
        throw new Error(result.message || 'Không thể gửi liên hệ. Vui lòng thử lại.');
      }

      setSuccess(result.message || 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      setRequireCaptcha(false);
      setCaptchaCode('');
      setCaptchaSvg('');
      setCaptchaToken('');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      setError(error.message || 'Không thể gửi liên hệ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
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
                  <div className={styles.icon}><MapPin size={24} /></div>
                  <div>
                    <h4>Địa Chỉ</h4>
                    <p>123 Đường Sắc Đẹp, Quận Hoàn Kiếm, Hà Nội</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}><Phone size={24} /></div>
                  <div>
                    <h4>Điện Thoại</h4>
                    <p>0987 654 321</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}><Mail size={24} /></div>
                  <div>
                    <h4>Email</h4>
                    <p>contact@lananhbeauty.vn</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}><Clock size={24} /></div>
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
                {success && <div className={styles.successMessage}>{success}</div>}
                {error && <div className={styles.errorMessage}>{error}</div>}
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
                
                {requireCaptcha && (
                  <div className={styles.captchaGroup}>
                    <label>Mã xác thực *</label>
                    <div className={styles.captchaContainer}>
                      <div className={styles.captchaImageWrap}>
                        <div
                          className={styles.captchaImage}
                          dangerouslySetInnerHTML={{ __html: captchaSvg }}
                        />
                        <button type="button" onClick={refreshCaptcha} className={styles.btnRefresh} title="Đổi mã khác">
                          <RefreshCw size={18} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={captchaCode}
                        onChange={(e) => setCaptchaCode(e.target.value)}
                        placeholder="Nhập mã xác thực"
                        required
                        className={styles.captchaInput}
                      />
                    </div>
                  </div>
                )}

                <button type="submit" className={styles.btnSubmit} disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Gửi Tin Nhắn'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
