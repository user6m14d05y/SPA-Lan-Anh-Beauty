import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon, 
  ArrowUpRightIcon 
} from '../../../icons';
import styles from './Booking.module.css';

const API_URL = 'http://localhost:5000/api';
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_BOOKING_DAYS_AHEAD = 90;

const getDateString = (date) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  service: '',
  date: '',
  time: '',
  notes: '',
  customerImage: null,
};

export default function Booking() {
  const [searchParams] = useSearchParams();
  const selectedServiceSlug = searchParams.get('service');
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
  const selectedService = useMemo(() => (
    services.find((service) => service.name === formData.service) || null
  ), [services, formData.service]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_URL}/catalog/services`);
        const result = await response.json();

        if (response.ok && result.success) {
          const nextServices = result.data || [];
          setServices(nextServices);

          if (selectedServiceSlug) {
            const matchedService = nextServices.find((service) => service.slug === selectedServiceSlug);
            if (matchedService) {
              setFormData((current) => ({ ...current, service: matchedService.name }));
            }
          }
        }
      } catch {
        setServices([]);
      }
    };

    fetchServices();
  }, [selectedServiceSlug]);

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
    payload.append('customerEmail', formData.email.trim());
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
          <span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-3">Đặt Lịch 24/7</span>
          <h1 className={styles.heroTitle}>Đặt Lịch Hẹn Trực Tuyến</h1>
          <p className={styles.heroSubtitle}>
            Hãy để Lan Anh Beauty mang tới cho bạn trải nghiệm thư giãn đẳng cấp. Vui lòng điền thông tin bên dưới để giữ khung giờ vàng cùng chuyên gia.
          </p>
        </div>
      </section>

      <div className={styles.bookingContainer}>
        <div className={styles.bookingInfo}>
          <div>
            <span className="eyebrow-badge bg-white/10 text-white border-white/20 mb-4">Lan Anh Beauty Spa</span>
            <h2 className={styles.infoTitle}>Thông Tin Hỗ Trợ</h2>
            <p className={styles.infoDesc}>
              Khách hàng đặt lịch trước sẽ luôn được ưu tiên phục vụ, giảm thời gian chờ đợi và nhận thêm nhiều ưu đãi chăm sóc da đặc biệt.
            </p>
            <ul className={styles.contactList}>
              <li><span className={styles.contactIcon}><MapPinIcon className="w-5 h-5" /></span><span>123 Đường Sắc Đẹp, Quận Hoàn Kiếm, Hà Nội</span></li>
              <li><span className={styles.contactIcon}><PhoneIcon className="w-5 h-5" /></span><span>Hotline: 0987 654 321</span></li>
              <li><span className={styles.contactIcon}><EnvelopeIcon className="w-5 h-5" /></span><span>Email: contact@lananhbeauty.vn</span></li>
              <li><span className={styles.contactIcon}><ClockIcon className="w-5 h-5" /></span><span>Giờ mở cửa: 08:00 - 20:00 (Tất cả các ngày)</span></li>
            </ul>
          </div>
        </div>

        <div className={styles.bookingForm}>
          {/* Reservation Step Bar */}
          <div className={styles.stepProgress}>
            <div className={`${styles.stepItem} ${styles.stepActive}`}>
              <span className={styles.stepNum}>1</span>
              <span>Chọn Ngày & Giờ</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={`${styles.stepItem} ${formData.date && formData.time ? styles.stepActive : ''}`}>
              <span className={styles.stepNum}>2</span>
              <span>Thông Tin Cá Nhân</span>
            </div>
            <div className={styles.stepLine}></div>
            <div className={styles.stepItem}>
              <span className={styles.stepNum}>3</span>
              <span>Xác Nhận</span>
            </div>
          </div>

          <div className={styles.formHeader}>
            <h3>Đăng Ký Liệu Trình Spa</h3>
            <p>Chọn khung giờ phù hợp và để lại thông tin liên hệ để nhận mã giữ chỗ.</p>
          </div>

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
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="service">Dịch Vụ Quan Tâm *</label>
                <select id="service" name="service" value={formData.service} onChange={handleChange} required>
                  <option value="" disabled>-- Chọn dịch vụ làm đẹp --</option>
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
                {selectedService && (
                  <div className={styles.selectedServicePrice}>
                    <span>Giá niêm yết liệu trình</span>
                    <strong>{selectedService.salePriceLabel || selectedService.priceLabel || 'Tư vấn theo tình trạng'}</strong>
                  </div>
                )}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="date">Ngày Hẹn Mong Muốn *</label>
                <input type="date" id="date" name="date" min={today} max={maxBookingDate} value={formData.date} onChange={handleChange} required />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Khung Giờ Còn Trống *</label>
                {loadingAvailability ? (
                  <div className={styles.slotState}>Đang tải danh sách khung giờ trống...</div>
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
                        <span>{slot.isFull ? 'Đã hết chỗ' : 'Còn trống'}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.slotState}>Vui lòng chọn ngày để hiển thị các khung giờ còn nhận lịch.</div>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="customerImage">Hình ảnh tình trạng da (nếu có)</label>
                <input type="file" id="customerImage" name="customerImage" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
                <span className={styles.uploadHint}>Không bắt buộc • Hỗ trợ ảnh JPG, PNG, WEBP tối đa 3MB để bác sĩ soi da trước.</span>
                {imagePreview && <img className={styles.imagePreview} src={imagePreview} alt="Ảnh khách hàng tải lên" />}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label htmlFor="notes">Ghi Chú Thêm</label>
                <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Ghi chú thêm về tiền sử da, mong muốn hoặc yêu cầu đặc biệt..." />
              </div>
            </div>
            
          {message.text && (
            <div className={`${styles.formMessage} ${message.type === 'success' ? styles.successMessage : styles.errorMessage}`}>
              {message.text}
            </div>
          )}

            <button type="submit" className="btn-luxury-primary w-full text-center justify-center py-4" disabled={submitting || availability?.isClosed}>
              {submitting ? 'Đang Gửi Lịch Hẹn...' : (
                <>
                  <span>Hoàn Tất Đặt Lịch Ngay</span>
                  <ArrowUpRightIcon className="w-4 h-4 inline-block ml-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

