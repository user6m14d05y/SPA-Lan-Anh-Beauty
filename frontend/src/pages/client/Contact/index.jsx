import React, { useState } from 'react';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon, 
  ArrowPathIcon,
  ArrowUpRightIcon
} from '../../../icons';
import { useToast } from '../../../context/ToastContext';
import styles from './Contact.module.css';

export default function Contact() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

      toast.success(result.message || 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.');
      setRequireCaptcha(false);
      setCaptchaCode('');
      setCaptchaSvg('');
      setCaptchaToken('');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error(error.message || 'Không thể gửi liên hệ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.contactWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-3">Hỗ Trợ Khách Hàng</span>
          <h1 className={styles.heroTitle}>Liên Hệ Lan Anh Beauty</h1>
          <p className={styles.heroSubtitle}>
            Chúng tôi luôn lắng nghe và sẵn sàng giải đáp mọi thắc mắc của bạn về liệu trình làm đẹp, dịch vụ và chính sách chăm sóc.
          </p>
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <span className="eyebrow-badge bg-white/10 text-white border-white/20 mb-3">Thông Tin Spa</span>
              <h2 className={styles.sectionTitle}>Hệ Thống Trực Thuộc</h2>
              <p className={styles.sectionDesc}>
                Hãy tới trực tiếp cơ sở hoặc liên hệ với bộ phận chăm sóc khách hàng để được bác sĩ chuyên khoa thăm khám và tư vấn hoàn toàn miễn phí.
              </p>

              <ul className={styles.infoList}>
                <li>
                  <div className={styles.icon}><MapPinIcon className="w-6 h-6" /></div>
                  <div>
                    <h4>Địa Chỉ</h4>
                    <p>123 Đường Sắc Đẹp, Quận Hoàn Kiếm, Hà Nội</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}><PhoneIcon className="w-6 h-6" /></div>
                  <div>
                    <h4>Hotline Tư Vấn</h4>
                    <p>0987 654 321</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}><EnvelopeIcon className="w-6 h-6" /></div>
                  <div>
                    <h4>Email Hỗ Trợ</h4>
                    <p>contact@lananhbeauty.vn</p>
                  </div>
                </li>
                <li>
                  <div className={styles.icon}><ClockIcon className="w-6 h-6" /></div>
                  <div>
                    <h4>Giờ Phục Vụ</h4>
                    <p>Thứ 2 - Chủ Nhật: 08:00 - 20:00</p>
                  </div>
                </li>
              </ul>

              <div className={styles.mapContainer}>
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
              <span className="eyebrow-badge mb-3">Gửi Thắc Mắc</span>
              <h2 className={styles.formTitle}>Gửi Tin Nhắn Cho Spa</h2>
              <p className={styles.formDesc}>
                Nhập thông tin bên dưới, chuyên viên tư vấn của Lan Anh Beauty sẽ phản hồi qua Zalo hoặc SĐT trong ít phút.
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
                  <label htmlFor="message">Nội Dung Cần Tư Vấn *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Nhập thắc mắc hoặc yêu cầu riêng của bạn..."
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
                          <ArrowPathIcon className="w-4 h-4 text-stone-600" />
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



                <button type="submit" className="btn-luxury-primary w-full text-center justify-center py-4" disabled={submitting}>
                  {submitting ? 'Đang Gửi...' : (
                    <>
                      <span>Gửi Tin Nhắn Cho Spa</span>
                      <ArrowUpRightIcon className="w-4 h-4 inline-block ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

