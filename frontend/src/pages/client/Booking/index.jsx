import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon, 
  ArrowUpRightIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  CreditCardIcon,
  QrCodeIcon,
  SparklesIcon,
  XMarkIcon
} from '../../../icons';
import { useToast } from '../../../context/ToastContext';
import styles from './Booking.module.css';
import CustomDatePicker from '../../../components/common/CustomDatePicker';

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
  customerImages: [],
  paymentMethod: 'CASH', // 'CASH' | 'BANK_TRANSFER'
};

const generate12DigitCode = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ''); // 6 digits (YYMMDD)
  const randStr = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
  return `${dateStr}${randStr}`; // Exactly 12 digits!
};

export default function Booking() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const selectedServiceSlug = searchParams.get('service');

  const [step, setStep] = useState(1); // 1: Date & Service, 2: Customer Info, 3: Confirmation & Payment
  const [formData, setFormData] = useState(emptyForm);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedBooking, setCompletedBooking] = useState(null);

  const [showSepayModal, setShowSepayModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);

  const today = useMemo(() => getDateString(new Date()), []);
  const maxBookingDate = useMemo(() => getDateString(addDays(new Date(), MAX_BOOKING_DAYS_AHEAD)), []);

  const selectedSlot = useMemo(() => (
    availability?.slots?.find((slot) => slot.time === formData.time)
  ), [availability, formData.time]);

  const selectedService = useMemo(() => (
    services.find((service) => service.name === formData.service) || null
  ), [services, formData.service]);

  const imagePreviews = useMemo(() => {
    if (!formData.customerImages || formData.customerImages.length === 0) return [];
    return formData.customerImages.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [formData.customerImages]);

  const transferAmount = useMemo(() => {
    const priceText = selectedService?.salePriceLabel || selectedService?.priceLabel || '300000';
    const numeric = priceText.replace(/\D/g, '');
    return numeric || '300000';
  }, [selectedService]);

  const qrCodeUrl = useMemo(() => {
    const code12 = pendingBookingData?.code || '260910839201';
    return `https://img.vietqr.io/image/MB-1414062005-compact2.png?amount=${transferAmount}&addInfo=LAB%20${code12}&accountName=BUI%20TRONG%20THANH`;
  }, [pendingBookingData, transferAmount]);

  // Polling payment status when modal is open
  useEffect(() => {
    if (!showSepayModal || (!formData.phone && !pendingBookingData?.code)) return;

    const interval = setInterval(async () => {
      try {
        const codeQuery = pendingBookingData?.code ? `&code=${pendingBookingData.code}` : '';
        const bookingIdQuery = pendingBookingData?.id ? `&bookingId=${pendingBookingData.id}` : '';
        const response = await fetch(`${API_URL}/payment/check-status?phone=${formData.phone}${codeQuery}${bookingIdQuery}`);
        const result = await response.json();

        if (response.ok && result.success && result.isPaid) {
          clearInterval(interval);
          setShowSepayModal(false);
          toast.success('Thanh toán SePay thành công! Đã xác nhận đơn đặt lịch hẹn.');
          
          setCompletedBooking({
            id: pendingBookingData?.id,
            code: pendingBookingData?.code || generate12DigitCode(),
            service: formData.service,
            date: formData.date,
            time: formData.time,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            price: selectedService?.salePriceLabel || selectedService?.priceLabel || 'Tư vấn trực tiếp',
            paymentMethod: 'BANK_TRANSFER',
            paymentStatus: 'PAID',
          });
        }
      } catch {
        // silent polling catch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showSepayModal, formData, selectedService, pendingBookingData, toast]);

  const handleSimulatePayment = async () => {
    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/payment/simulate-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: pendingBookingData?.code, 
          bookingId: pendingBookingData?.id,
          phone: formData.phone 
        }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setShowSepayModal(false);
        toast.success('Thanh toán SePay thành công! Đã xác nhận đơn đặt lịch hẹn.');
        setCompletedBooking({
          id: pendingBookingData?.id,
          code: pendingBookingData?.code || generate12DigitCode(),
          service: formData.service,
          date: formData.date,
          time: formData.time,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          price: selectedService?.salePriceLabel || selectedService?.priceLabel || 'Tư vấn trực tiếp',
          paymentMethod: 'BANK_TRANSFER',
          paymentStatus: 'PAID',
        });
      } else {
        toast.error(result.message || 'Không thể xác nhận thanh toán.');
      }
    } catch {
      toast.error('Không thể mô phỏng thanh toán.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.info(`Đã sao chép ${label}: ${text}`);
    }
  };

  // Load Services from Backend API
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
          } else if (nextServices.length > 0) {
            setFormData((current) => ({ ...current, service: nextServices[0].name }));
          }
        }
      } catch {
        setServices([]);
      }
    };

    fetchServices();
  }, [selectedServiceSlug]);

  // Load Availability when Date Changes
  useEffect(() => {
    if (!formData.date) {
      setAvailability(null);
      return;
    }

    const fetchAvailability = async () => {
      if (formData.date < today || formData.date > maxBookingDate) {
        setAvailability(null);
        setFormData((current) => ({ ...current, time: '' }));
        toast.error(`Vui lòng chọn ngày hẹn từ hôm nay đến ${maxBookingDate}.`);
        return;
      }

      try {
        setLoadingAvailability(true);
        const response = await fetch(`${API_URL}/bookings/availability?date=${formData.date}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải khung giờ hẹn.');
        }

        setAvailability(result.data);
        setFormData((current) => ({ ...current, time: '' }));

        if (result.data.isClosed) {
          toast.warning(result.data.message || 'Spa tạm nghỉ vào ngày này.');
        }
      } catch (error) {
        setAvailability(null);
        toast.error(error.message || 'Không thể tải khung giờ hẹn.');
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [formData.date, today, maxBookingDate, toast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles = [];
    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`Tệp "${file.name}" không phải JPG, PNG hoặc WEBP.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(`Ảnh "${file.name}" quá dung lượng 3MB.`);
        continue;
      }
      validFiles.push(file);
    }

    setFormData((current) => {
      const combined = [...(current.customerImages || []), ...validFiles];
      if (combined.length > 5) {
        toast.warning('Chỉ hỗ trợ tải lên tối đa 5 ảnh.');
        return { ...current, customerImages: combined.slice(0, 5) };
      }
      return { ...current, customerImages: combined };
    });

    event.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((current) => ({
      ...current,
      customerImages: (current.customerImages || []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSelectSlot = (slot) => {
    if (slot.isDisabled || availability?.isClosed) return;
    setFormData((current) => ({ ...current, time: slot.time }));
  };

  // Step 1 Validation -> Move to Step 2
  const goToStep2 = () => {
    if (!formData.service) {
      toast.error('Vui lòng chọn dịch vụ bạn quan tâm.');
      return;
    }
    if (!formData.date) {
      toast.error('Vui lòng chọn ngày hẹn mong muốn.');
      return;
    }
    if (!formData.time) {
      toast.error('Vui lòng chọn khung giờ còn trống.');
      return;
    }
    if (availability?.isClosed) {
      toast.error('Spa nghỉ vào ngày này, vui lòng chọn ngày khác.');
      return;
    }
    setStep(2);
  };

  // Step 2 Validation -> Move to Step 3
  const goToStep3 = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập Họ và Tên của bạn.');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập Số điện thoại liên hệ.');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Vui lòng nhập Email.');
      return;
    }
    setStep(3);
  };

  // Step 3 Final Submit
  const handleFinalSubmit = async () => {
    const bookingCode12 = generate12DigitCode();
    const payload = new FormData();
    payload.append('customerName', formData.name.trim());
    payload.append('customerPhone', formData.phone.trim());
    payload.append('customerEmail', formData.email.trim());
    payload.append('serviceName', formData.service);
    payload.append('bookingDate', formData.date);
    payload.append('bookingTime', formData.time);
    payload.append('notes', formData.notes.trim());
    payload.append('paymentMethod', formData.paymentMethod);
    payload.append('bookingCode', bookingCode12);

    if (formData.customerImages && formData.customerImages.length > 0) {
      formData.customerImages.forEach((file) => {
        payload.append('customerImage', file);
      });
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        body: payload,
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể gửi yêu cầu đặt lịch.');
      }

      const code = result.data?.bookingCode || bookingCode12;
      const bookingInfo = {
        id: result.data?.id,
        code,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        price: selectedService?.salePriceLabel || selectedService?.priceLabel || 'Tư vấn trực tiếp',
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'BANK_TRANSFER' ? 'PENDING' : 'CASH',
      };

      if (formData.paymentMethod === 'BANK_TRANSFER') {
        setPendingBookingData(bookingInfo);
        setShowSepayModal(true);
        toast.info('Vui lòng quét mã QR SePay để hoàn tất thanh toán.');
      } else {
        toast.success('Đặt lịch hẹn thành công!');
        setCompletedBooking(bookingInfo);
      }
    } catch (error) {
      toast.error(error.message || 'Không thể đặt lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setFormData(emptyForm);
    setAvailability(null);
    setCompletedBooking(null);
    setStep(1);
  };

  return (
    <div className={styles.bookingWrapper}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-3 z-10">Đặt Lịch 24/7</span>
          <h1 className={styles.heroTitle}>Đặt Lịch Hẹn Trực Tuyến</h1>
          <p className={styles.heroSubtitle}>
            Trải nghiệm dịch vụ làm đẹp chuẩn y khoa tại Lan Anh Beauty. Đặt lịch giữ chỗ ngay hôm nay chỉ với 3 bước đơn giản.
          </p>
        </div>
      </section>

      <div className={styles.bookingContainer}>
        {/* Sidebar Info Box */}
        <aside className={styles.bookingInfo}>
          <div>
            <span className="eyebrow-badge bg-white/10 text-white border-white/20 mb-4">Lan Anh Beauty Spa</span>
            <h2 className={styles.infoTitle}>Thông Tin Hỗ Trợ</h2>
            <p className={styles.infoDesc}>
              Khách hàng đặt lịch trước sẽ luôn được ưu tiên phục vụ, giảm thời gian chờ đợi và nhận thêm nhiều ưu đãi chăm sóc da đặc biệt.
            </p>
            <ul className={styles.contactList}>
              <li><span className={styles.contactIcon}><MapPinIcon className="w-5 h-5" /></span><span>123 Đường Sắc Đẹp, Hoàn Kiếm, Hà Nội</span></li>
              <li><span className={styles.contactIcon}><PhoneIcon className="w-5 h-5" /></span><span>Hotline: 0987 654 321</span></li>
              <li><span className={styles.contactIcon}><EnvelopeIcon className="w-5 h-5" /></span><span>Email: contact@lananhbeauty.vn</span></li>
              <li><span className={styles.contactIcon}><ClockIcon className="w-5 h-5" /></span><span>Mở cửa: 08:00 - 20:00 (Hàng ngày)</span></li>
            </ul>
          </div>
        </aside>

        {/* Main Form Content */}
        <div className={styles.bookingFormCard}>
          {completedBooking ? (
            /* Success Screen */
            <div className={styles.successBox}>
              <div className={styles.successIconWrap}>
                <CheckCircleIcon className="w-12 h-12 text-[var(--primary-gold)]" />
              </div>
              <span className="eyebrow-badge bg-[var(--primary-gold)]/10 text-[var(--primary-gold-dark)] border-[var(--primary-gold)]/30 mb-2">Đặt Lịch Thành Công</span>
              <h2>Cảm Ơn Quý Khách!</h2>
              <p className="text-stone-600 text-sm max-w-md mx-auto mb-6">
                Yêu cầu đặt lịch của bạn đã được ghi nhận. Mã giữ chỗ của bạn là <strong className="text-[var(--primary-gold-dark)] text-base">{completedBooking.code}</strong>.
              </p>

              <div className={styles.summaryCard}>
                <h3>Chi Tiết Lịch Hẹn</h3>
                <div className={styles.summaryRow}><span>Dịch vụ:</span><strong>{completedBooking.service}</strong></div>
                <div className={styles.summaryRow}><span>Thời gian:</span><strong>{completedBooking.time} - {completedBooking.date}</strong></div>
                <div className={styles.summaryRow}><span>Khách hàng:</span><strong>{completedBooking.name} ({completedBooking.phone})</strong></div>
                <div className={styles.summaryRow}><span>Chi phí dự kiến:</span><strong className="text-[var(--primary-gold-dark)]">{completedBooking.price}</strong></div>
                <div className={styles.summaryRow}>
                  <span>Thanh toán:</span>
                  <strong>{completedBooking.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản Ngân hàng (QR Code)' : 'Thanh toán Tiền mặt tại Spa'}</strong>
                </div>
              </div>

              {completedBooking.paymentMethod === 'BANK_TRANSFER' && (
                <div className={styles.bankTransferBox}>
                  <div className="flex items-center gap-2 mb-3">
                    <QrCodeIcon className="w-5 h-5 text-[var(--primary-gold-dark)]" />
                    <h4 className="font-bold text-stone-800 text-sm uppercase">Thông Tin Thanh Toán Qua SePay QR</h4>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-200 text-left text-xs space-y-2">
                    <p><strong>Ngân hàng nhận:</strong> MBBank (Ngân Hàng Quân Đội)</p>
                    <p><strong>Số tài khoản:</strong> 1414062005</p>
                    <p><strong>Chủ tài khoản:</strong> BUI TRONG THANH</p>
                    <p><strong>Cú pháp CK:</strong> <code className="bg-amber-50 px-2 py-1 rounded text-amber-800 font-bold font-mono">LAB {completedBooking.code}</code></p>
                    {completedBooking.paymentStatus === 'PAID' && (
                      <p className="text-emerald-700 font-bold text-xs pt-1 flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4 inline" /> Trạng thái: Đã xác nhận thanh toán thành công SePay QR
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                <button type="button" onClick={handleResetBooking} className="btn-luxury-secondary text-sm">
                  Đặt Thêm Lịch Mới
                </button>
                <Link to="/" className="btn-luxury-primary text-sm">
                  Về Trang Chủ
                </Link>
              </div>
            </div>
          ) : (
            /* Multi-Step Form Wizard */
            <>
              {/* Step Progress Header */}
              <div className={styles.stepProgress}>
                <div className={`${styles.stepItem} ${step >= 1 ? styles.stepActive : ''}`}>
                  <span className={styles.stepNum}>1</span>
                  <span>Chọn Ngày & Giờ</span>
                </div>
                <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineActive : ''}`}></div>
                <div className={`${styles.stepItem} ${step >= 2 ? styles.stepActive : ''}`}>
                  <span className={styles.stepNum}>2</span>
                  <span>Thông Tin Cá Nhân</span>
                </div>
                <div className={`${styles.stepLine} ${step >= 3 ? styles.stepLineActive : ''}`}></div>
                <div className={`${styles.stepItem} ${step >= 3 ? styles.stepActive : ''}`}>
                  <span className={styles.stepNum}>3</span>
                  <span>Xác Nhận & Thanh Toán</span>
                </div>
              </div>

              {/* Step 1: Service, Date & Time */}
              {step === 1 && (
                <div className="animate-fadeIn">
                  <div className={styles.formHeader}>
                    <h3>Bước 1: Chọn Dịch Vụ, Ngày & Giờ Hẹn</h3>
                    <p>Vui lòng chọn dịch vụ làm đẹp, ngày và khung giờ còn trống.</p>
                  </div>

                  <div className={styles.formGrid}>
                    {/* Service Selection */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="service">Dịch Vụ Quan Tâm *</label>
                      <select id="service" name="service" value={formData.service} onChange={handleChange} required>
                        <option value="" disabled>-- Chọn dịch vụ làm đẹp --</option>
                        {services.length > 0 ? services.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.salePriceLabel || s.priceLabel || 'Tư vấn'})
                          </option>
                        )) : (
                          <>
                            <option value="Chăm sóc da cơ bản">Chăm sóc da cơ bản</option>
                            <option value="Gội đầu dưỡng sinh thảo mộc">Gội đầu dưỡng sinh thảo mộc</option>
                            <option value="Laser trẻ hóa da">Laser trẻ hóa da</option>
                            <option value="Massage body thư giãn">Massage body thư giãn</option>
                          </>
                        )}
                      </select>

                      {selectedService && (
                        <div className={styles.selectedServicePrice}>
                          <span>Chi phí dịch vụ:</span>
                          <strong>{selectedService.salePriceLabel || selectedService.priceLabel || 'Tư vấn trực tiếp'}</strong>
                          {selectedService.durationMinutes && (
                            <span className="ml-auto text-xs text-stone-500 font-normal">
                              ⏱ {selectedService.durationMinutes} phút
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Date Picker */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>Ngày Hẹn Mong Muốn *</label>
                      <CustomDatePicker
                        value={formData.date}
                        onChange={(selectedDate) => setFormData((current) => ({ ...current, date: selectedDate }))}
                        minDate={today}
                        maxDate={maxBookingDate}
                        placeholder="Bấm chọn ngày hẹn mong muốn..."
                        showQuickPills={true}
                      />
                    </div>

                    {/* Time Slot Picker */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>Khung Giờ Còn Trống *</label>
                      {!formData.date ? (
                        <div className={styles.slotState}>Vui lòng chọn ngày hẹn để xem danh sách khung giờ trống.</div>
                      ) : loadingAvailability ? (
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
                              <span>{slot.isFull ? 'Hết chỗ' : 'Còn trống'}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.slotState}>Không có khung giờ nào còn trống trong ngày này.</div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button type="button" onClick={goToStep2} className="btn-luxury-primary text-sm">
                      <span>Tiếp Tục: Điền Thông Tin</span>
                      <ArrowUpRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Customer Info */}
              {step === 2 && (
                <div className="animate-fadeIn">
                  <div className={styles.formHeader}>
                    <h3>Bước 2: Thông Tin Cá Nhân</h3>
                    <p>Nhập thông tin liên hệ để chuyên viên giữ khung giờ hẹn cho bạn.</p>
                  </div>

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

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="customerImage">Hình ảnh tình trạng da (không bắt buộc - chọn tối đa 5 ảnh)</label>
                      <input 
                        type="file" 
                        id="customerImage" 
                        name="customerImage" 
                        accept="image/png,image/jpeg,image/webp" 
                        multiple
                        onChange={handleImageChange} 
                      />
                      <span className={styles.uploadHint}>Hỗ trợ chọn nhiều ảnh (JPG, PNG, WEBP tối đa 3MB/ảnh) để bác sĩ soi da trước.</span>

                      {imagePreviews.length > 0 && (
                        <div className={styles.imagePreviewGrid}>
                          {imagePreviews.map((img, idx) => (
                            <div key={idx} className={styles.imagePreviewItem}>
                              <img src={img.url} alt={`Ảnh tình trạng da ${idx + 1}`} />
                              <button
                                type="button"
                                className={styles.removeImageBtn}
                                onClick={() => handleRemoveImage(idx)}
                                title="Xóa ảnh này"
                              >
                                <XMarkIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="notes">Ghi Chú Thêm</label>
                      <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Ghi chú thêm về tình trạng da, mong muốn hoặc yêu cầu riêng..." />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between items-center">
                    <button type="button" onClick={() => setStep(1)} className="btn-luxury-secondary text-sm">
                      <ArrowLeftIcon className="w-4 h-4 mr-1" />
                      <span>Quay Lại</span>
                    </button>
                    <button type="button" onClick={goToStep3} className="btn-luxury-primary text-sm">
                      <span>Tiếp Tục: Thanh Toán</span>
                      <ArrowUpRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation & Payment Checkout */}
              {step === 3 && (
                <div className="animate-fadeIn">
                  <div className={styles.formHeader}>
                    <h3>Bước 3: Xác Nhận & Chọn Phương Thức Thanh Toán</h3>
                    <p>Kiểm tra thông tin chi tiết và lựa chọn hình thức thanh toán thuận tiện nhất.</p>
                  </div>

                  {/* Summary Box */}
                  <div className={styles.summaryCard}>
                    <h3>Tóm Tắt Đặt Lịch Hẹn</h3>
                    <div className={styles.summaryRow}>
                      <span>Dịch vụ lựa chọn:</span>
                      <strong>{formData.service}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Chi phí dự kiến:</span>
                      <strong className="text-[var(--primary-gold-dark)]">{selectedService?.salePriceLabel || selectedService?.priceLabel || 'Tư vấn trực tiếp'}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Thời gian hẹn:</span>
                      <strong>{formData.time} - Ngày {formData.date}</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Thông tin khách hàng:</span>
                      <strong>{formData.name} ({formData.phone})</strong>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Email:</span>
                      <strong>{formData.email}</strong>
                    </div>
                  </div>

                  {/* Payment Options Selection */}
                  <div className={styles.paymentSection}>
                    <label className={styles.paymentSectionTitle}>Chọn Phương Thức Thanh Toán *</label>

                    <div className={styles.paymentGrid}>
                      {/* Option 1: Cash on arrival */}
                      <div 
                        className={`${styles.paymentOption} ${formData.paymentMethod === 'CASH' ? styles.paymentOptionActive : ''}`}
                        onClick={() => setFormData((current) => ({ ...current, paymentMethod: 'CASH' }))}
                      >
                        <div className={styles.paymentHeader}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="CASH" 
                            checked={formData.paymentMethod === 'CASH'} 
                            onChange={() => {}}
                          />
                          <div className={styles.paymentIconWrap}>
                            <BanknotesIcon className="w-5 h-5 text-[var(--primary-gold-dark)]" />
                          </div>
                          <strong>Thanh Toán Tiền Mặt Tại Spa</strong>
                        </div>
                        <p className={styles.paymentDesc}>
                          Thanh toán trực tiếp bằng tiền mặt hoặc quẹt thẻ POS khi quý khách tới trải nghiệm dịch vụ tại cửa hàng.
                        </p>
                      </div>

                      {/* Option 2: Bank Transfer */}
                      <div 
                        className={`${styles.paymentOption} ${formData.paymentMethod === 'BANK_TRANSFER' ? styles.paymentOptionActive : ''}`}
                        onClick={() => setFormData((current) => ({ ...current, paymentMethod: 'BANK_TRANSFER' }))}
                      >
                        <div className={styles.paymentHeader}>
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="BANK_TRANSFER" 
                            checked={formData.paymentMethod === 'BANK_TRANSFER'} 
                            onChange={() => {}}
                          />
                          <div className={styles.paymentIconWrap}>
                            <QrCodeIcon className="w-5 h-5 text-[var(--primary-gold-dark)]" />
                          </div>
                          <strong>Chuyển Khoản Ngân Hàng (QR Code)</strong>
                        </div>
                        <p className={styles.paymentDesc}>
                          Chuyển khoản qua ngân hàng MBBank/Vietcombank bằng mã QR nhanh chóng và được xác nhận lịch tự động.
                        </p>

                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-between items-center">
                    <button type="button" onClick={() => setStep(2)} className="btn-luxury-secondary text-sm">
                      <ArrowLeftIcon className="w-4 h-4 mr-1" />
                      <span>Sửa Thông Tin</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={handleFinalSubmit} 
                      className="btn-luxury-primary text-sm" 
                      disabled={submitting}
                    >
                      {submitting ? 'Đang Xử Lý Thanh Toán...' : (
                        <>
                          <span>Xác Nhận & Đặt Lịch Ngay</span>
                          <ArrowUpRightIcon className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SePay Payment Modal */}
      {showSepayModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className="flex items-center gap-2">
                <QrCodeIcon className="w-6 h-6 text-[var(--primary-gold-dark)]" />
                <h3 className={styles.modalTitle}>Thanh Toán Qua SePay QR</h3>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setShowSepayModal(false)}
                title="Đóng cửa sổ"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code */}
            <div className={styles.qrContainer}>
              <p className="text-xs text-stone-600 mb-2 font-medium">
                Mở app Ngân hàng / Momo / ZaloPay quét mã QR để thanh toán:
              </p>
              <div className={styles.qrImageWrap}>
                <img src={qrCodeUrl} alt="Mã QR Thanh Toán SePay MBBank" className={styles.qrCodeImg} />
              </div>
              <p className="text-xs text-amber-900 font-bold mt-2">MBBank • 1414062005 • BUI TRONG THANH</p>
            </div>

            {/* Account Details Box */}
            <div className={styles.sepayInfoBox}>
              <div className={styles.sepayInfoRow}>
                <span>Ngân hàng nhận:</span>
                <strong>MBBank (Ngân Hàng Quân Đội)</strong>
              </div>
              <div className={styles.sepayInfoRow}>
                <span>Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <strong>1414062005</strong>
                  <button type="button" onClick={() => copyToClipboard('1414062005', 'Số TK')} className={styles.copyBadge}>
                    Sao chép
                  </button>
                </div>
              </div>
              <div className={styles.sepayInfoRow}>
                <span>Tên tài khoản:</span>
                <strong>BUI TRONG THANH</strong>
              </div>
              <div className={styles.sepayInfoRow}>
                <span>Số tiền thanh toán:</span>
                <strong className="text-[var(--primary-gold-dark)]">{selectedService?.salePriceLabel || selectedService?.priceLabel || '300.000đ'}</strong>
              </div>
              <div className={styles.sepayInfoRow}>
                <span>Nội dung CK (Bắt buộc):</span>
                <div className="flex items-center gap-2">
                  <strong className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-mono text-sm">
                    LAB {pendingBookingData?.code || '260910839201'}
                  </strong>
                  <button 
                    type="button" 
                    onClick={() => copyToClipboard(`LAB ${pendingBookingData?.code || '260910839201'}`, 'Cú pháp CK')} 
                    className={styles.copyBadge}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            </div>

            {/* Polling Ping Indicator */}
            <div className={styles.pollingBar}>
              <span className={styles.pingDot}></span>
              <span>Đang tự động chờ tín hiệu thanh toán từ ngân hàng...</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="btn-luxury-primary w-full text-center justify-center text-sm"
                disabled={submitting}
              >
                {submitting ? 'Đang Xác Nhận...' : 'Tôi Đã Chuyển Khoản'}
              </button>
              <button
                type="button"
                onClick={() => setShowSepayModal(false)}
                className="btn-luxury-secondary w-full text-center justify-center text-sm"
              >
                Hủy / Chọn Lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
