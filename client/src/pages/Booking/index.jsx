import { useEffect, useMemo, useState } from 'react';
import styles from './Booking.module.css';

const API_URL = 'http://localhost:5000/api';
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_BOOKING_DAYS_AHEAD = 90;

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const MapPinIcon = () => (
  <svg {...iconProps}><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

const PhoneIcon = () => (
  <svg {...iconProps}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.33 2 2 0 0 1 3.56 1.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11l-.9.84a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
);

const MailIcon = () => (
  <svg {...iconProps}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);

const ClockIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
);

const getDateString = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const emptyForm = {
  name: '',
  phone: '',
  service: '',
  date: '',
  time: '',
  notes: '',
  customerImage: null,
};

export default function Booking() {
  const [formData, setFormData] = useState(emptyForm);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState('');

  const today = useMemo(() => getDateString(new Date()), []);
  const maxBookingDate = useMemo(() => getDateString(addDays(new Date(), MAX_BOOKING_DAYS_AHEAD)), []);
  const selectedSlot = useMemo(() => (
    availability?.slots?.find((slot) => slot.time === formData.time)
  ), [availability, formData.time]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_URL}/catalog/services`);
        const result = await response.json();

        if (response.ok && result.success) {
          setServices(result.data || []);
        }
      } catch {
        setServices([]);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    if (!formData.date) {
      setAvailability(null);
      return;
    }

    const fetchAvailability = async () => {
      if (formData.date < today || formData.date > maxBookingDate) {
        setAvailability(null);
        setFormData((current) => ({ ...current, time: '' }));
        setMessage({ type: 'error', text: `Vui lòng chọn ngày hẹn từ hôm nay đến ${maxBookingDate}.` });
        return;
      }

      try {
        setLoadingAvailability(true);
        setMessage({ type: '', text: '' });
        const response = await fetch(`${API_URL}/bookings/availability?date=${formData.date}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải khung giờ hẹn.');
        }

        setAvailability(result.data);
        setFormData((current) => ({ ...current, time: '' }));

        if (result.data.isClosed) {
          setMessage({ type: 'error', text: result.data.message });
        }
      } catch (error) {
        setAvailability(null);
        setMessage({ type: 'error', text: error.message || 'Không thể tải khung giờ hẹn.' });
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [formData.date, today, maxBookingDate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setFormData((current) => ({ ...current, customerImage: null }));
      setImagePreview('');
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMessage({ type: 'error', text: 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.' });
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setMessage({ type: 'error', text: 'Ảnh tải lên phải nhỏ hơn 3MB.' });
      event.target.value = '';
      return;
    }

    setFormData((current) => ({ ...current, customerImage: file }));
    setImagePreview(URL.createObjectURL(file));
    setMessage({ type: '', text: '' });
  };

  const handleSelectSlot = (slot) => {
    if (slot.isDisabled || availability?.isClosed) return;
    setFormData((current) => ({ ...current, time: slot.time }));
    setMessage({ type: '', text: '' });
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setAvailability(null);
    setImagePreview('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.date < today || formData.date > maxBookingDate) {
      setMessage({ type: 'error', text: `Vui lòng chọn ngày hẹn từ hôm nay đến ${maxBookingDate}.` });
      return;
    }

    if (availability?.isClosed) {
      setMessage({ type: 'error', text: 'Ngày này spa nghỉ, vui lòng chọn ngày khác.' });
      return;
    }

    if (!formData.time || selectedSlot?.isDisabled) {
      setMessage({ type: 'error', text: 'Vui lòng chọn khung giờ còn trống.' });
      return;
    }

    const payload = new FormData();
    payload.append('customerName', formData.name.trim());
    payload.append('customerPhone', formData.phone.trim());
    payload.append('serviceName', formData.service);
    payload.append('bookingDate', formData.date);
    payload.append('bookingTime', formData.time);
    payload.append('notes', formData.notes.trim());

    if (formData.customerImage) {
      payload.append('customerImage', formData.customerImage);
    }

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        body: payload,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể đặt lịch.');
      }

      setMessage({ type: 'success', text: result.message || 'Đặt lịch thành công.' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể đặt lịch.' });
    } finally {
      setSubmitting(false);
    }
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
              <li><span className={styles.contactIcon}><MapPinIcon /></span><span>123 Đường Sắc Đẹp, Quận Hoàn Kiếm, Hà Nội</span></li>
              <li><span className={styles.contactIcon}><PhoneIcon /></span><span>Hotline: 0987 654 321</span></li>
              <li><span className={styles.contactIcon}><MailIcon /></span><span>Email: contact@lananhbeauty.vn</span></li>
              <li><span className={styles.contactIcon}><ClockIcon /></span><span>Giờ mở cửa: 08:00 - 20:00 (Tất cả các ngày)</span></li>
            </ul>
          </div>
        </div>

        <div className={styles.bookingForm}>
          <div className={styles.formHeader}>
            <h3>Đăng Ký Dịch Vụ</h3>
            <p>Chọn ngày, khung giờ còn trống và gửi thông tin để được xác nhận lịch hẹn.</p>
          </div>

          {message.text && (
            <div className={`${styles.formMessage} ${message.type === 'success' ? styles.successMessage : styles.errorMessage}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Họ và Tên *</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Vd: Nguyễn Văn A" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Số Điện Thoại *</label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="09xx xxx xxx" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="service">Dịch Vụ Quan Tâm *</label>
                <select id="service" name="service" value={formData.service} onChange={handleChange} required>
                  <option value="" disabled>Chọn dịch vụ</option>
                  {services.length > 0 ? services.map((service) => (
                    <option key={service.id} value={service.name}>{service.name}</option>
                  )) : (
                    <>
                      <option value="Phun Thêu Thẩm Mỹ">Phun Thêu Thẩm Mỹ</option>
                      <option value="Chăm Sóc Da Chuyên Sâu">Chăm Sóc Da Chuyên Sâu</option>
                      <option value="Massage Thư Giãn">Massage Thư Giãn</option>
                      <option value="Trị Liệu Công Nghệ Cao">Trị Liệu Công Nghệ Cao</option>
                    </>
                  )}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="date">Ngày Hẹn *</label>
                <input type="date" id="date" name="date" min={today} max={maxBookingDate} value={formData.date} onChange={handleChange} required />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Giờ Hẹn Mong Muốn *</label>
                {loadingAvailability ? (
                  <div className={styles.slotState}>Đang tải khung giờ...</div>
                ) : availability?.isClosed ? (
                  <div className={styles.closedMessage}>{availability.message}</div>
                ) : availability?.slots?.length > 0 ? (
                  <div className={styles.slotGrid}>
                    {availability.slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        className={`${styles.slotButton} ${formData.time === slot.time ? styles.slotSelected : ''} ${slot.isFull ? styles.slotFull : ''}`}
                        onClick={() => handleSelectSlot(slot)}
                        disabled={slot.isDisabled}
                      >
                        <strong>{slot.time}</strong>
                        <span>{slot.message || 'Còn chỗ'}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.slotState}>Vui lòng chọn ngày để xem khung giờ còn trống.</div>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="customerImage">Hình ảnh kèm theo</label>
                <input type="file" id="customerImage" name="customerImage" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
                <span className={styles.uploadHint}>Không bắt buộc • JPG, PNG, WEBP • tối đa 3MB.</span>
                {imagePreview && <img className={styles.imagePreview} src={imagePreview} alt="Ảnh khách hàng tải lên" />}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="notes">Ghi Chú Thêm</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Bạn có yêu cầu gì đặc biệt hay thắc mắc về dịch vụ không?" />
              </div>
            </div>

            <button type="submit" className={styles.btnSubmit} disabled={submitting || availability?.isClosed}>
              {submitting ? 'Đang gửi lịch hẹn...' : 'Hoàn Tất Đặt Lịch'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
