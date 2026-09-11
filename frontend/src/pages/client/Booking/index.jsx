import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  XMarkIcon,
  CameraIcon,
  PhotoIcon
} from '../../../icons';
import { useToast } from '../../../context/ToastContext';
import styles from './Booking.module.css';
import CustomDatePicker from '../../../components/common/CustomDatePicker';
import { API_URL } from '../../../config';
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
  const [errors, setErrors] = useState({});

  const [showSepayModal, setShowSepayModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);

  const [showLiveCameraModal, setShowLiveCameraModal] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null); // polling interval ref

  const today = useMemo(() => getDateString(new Date()), []);
  const maxBookingDate = useMemo(() => getDateString(addDays(new Date(), MAX_BOOKING_DAYS_AHEAD)), []);

  const selectedSlot = useMemo(() => (
    availability?.slots?.find((slot) => slot.time === formData.time)
  ), [availability, formData.time]);

  const selectedService = useMemo(() => (
    services.find((s) => s.name === formData.service)
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
    // ID is now DH-XXXX-XXXX-XXXX — use directly as bank transfer content
    const bookingId = pendingBookingData?.id || pendingBookingData?.code || 'DH-0000-0000-0000';
    return `https://img.vietqr.io/image/MB-1414062005-compact2.png?amount=${transferAmount}&addInfo=${encodeURIComponent(bookingId)}&accountName=BUI%20TRONG%20THANH`;
  }, [pendingBookingData, transferAmount]);

  // Polling payment status every 1.5s while QR modal is open
  // Auto-transitions to success screen as soon as backend confirms payment
  useEffect(() => {
    if (!showSepayModal || !pendingBookingData?.id) return;

    const checkStatus = async () => {
      try {
        const idParam = encodeURIComponent(pendingBookingData.id);
        const phoneParam = formData.phone ? `&phone=${encodeURIComponent(formData.phone)}` : '';
        const response = await fetch(`${API_URL}/payment/check-status?code=${idParam}${phoneParam}`);
        const result = await response.json();

        if (response.ok && result.success && result.isPaid) {
          clearInterval(intervalRef.current);
          setShowSepayModal(false);
          toast.success('Thanh toán thành công! Đang chuyển sang trang xác nhận...');
          setCompletedBooking({
            id: pendingBookingData.id,
            code: pendingBookingData.id,
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
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch {
        // silent polling — network hiccups are fine
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, 1500);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSepayModal, pendingBookingData?.id]);

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
            const decodedParam = decodeURIComponent(selectedServiceSlug).toLowerCase();
            const matchedService = nextServices.find((service) => 
              service.slug === selectedServiceSlug || service.name.toLowerCase() === decodedParam
            );
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
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

  const startLiveCamera = async () => {
    try {
      setShowLiveCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      toast.error('Không thể truy cập máy ảnh. Vui lòng cấp quyền camera trên trình duyệt.');
      setShowLiveCameraModal(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowLiveCameraModal(false);
  };

  const captureLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `skin_photo_${Date.now()}.png`, { type: 'image/png' });
        setFormData((current) => {
          const combined = [...(current.customerImages || []), file];
          if (combined.length > 5) {
            toast.warning('Chỉ hỗ trợ tải lên tối đa 5 ảnh.');
            return { ...current, customerImages: combined.slice(0, 5) };
          }
          return { ...current, customerImages: combined };
        });
        toast.success('Đã chụp ảnh tình trạng da thành công!');
      }
      stopLiveCamera();
    }, 'image/png');
  };

  const handleSelectSlot = (slot) => {
    if (slot.isDisabled || availability?.isClosed) return;
    setFormData((current) => ({ ...current, time: slot.time }));
    if (errors.time) setErrors((prev) => ({ ...prev, time: '' }));
  };

  // Step 1 Validation -> Move to Step 2
  const goToStep2 = () => {
    const newErrors = {};
    if (!formData.service) {
      newErrors.service = 'Vui lòng chọn dịch vụ bạn quan tâm.';
    }
    if (!formData.date) {
      newErrors.date = 'Vui lòng chọn ngày hẹn mong muốn.';
    }
    if (!formData.time) {
      newErrors.time = 'Vui lòng chọn khung giờ còn trống.';
    }
    if (availability?.isClosed) {
      newErrors.date = 'Spa nghỉ vào ngày này, vui lòng chọn ngày khác.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  // Step 2 Validation -> Move to Step 3
  const goToStep3 = () => {
    const trimmedName = formData.name.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedEmail = formData.email.trim();
    const newErrors = {};

    if (!trimmedName) {
      newErrors.name = 'Vui lòng nhập họ và tên của bạn.';
    }

    if (!trimmedPhone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else {
      const phoneRegex = /^0\d{9,10}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        newErrors.phone = 'Số điện thoại không hợp lệ (ví dụ đúng: 0987654321).';
      }
    }

    if (!trimmedEmail) {
      newErrors.email = 'Vui lòng nhập địa chỉ email.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Địa chỉ email không đúng định dạng (ví dụ đúng: tenbancanxacnhan@gmail.com).';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(3);
  };

  // Step 3 Final Submit — no longer sends bookingCode, backend generates DH-XXXX-XXXX-XXXX id
  const handleFinalSubmit = async () => {
    const payload = new FormData();
    payload.append('customerName', formData.name.trim());
    payload.append('customerPhone', formData.phone.trim());
    payload.append('customerEmail', formData.email.trim());
    payload.append('serviceName', formData.service);
    payload.append('bookingDate', formData.date);
    payload.append('bookingTime', formData.time);
    payload.append('notes', formData.notes.trim());
    payload.append('paymentMethod', formData.paymentMethod);

    if (pendingBookingData?.id) {
      payload.append('existingBookingId', pendingBookingData.id);
    }

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

      // id is now DH-XXXX-XXXX-XXXX (the booking's primary key)
      const bookingId = result.data?.id;
      const bookingInfo = {
        id: bookingId,
        code: bookingId, // code === id in new schema
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
        toast.info('Vui lòng quét mã QR để thanh toán. Hệ thống tự động xác nhận sau khi nhận tiền.');
      } else {
        setShowSepayModal(false);
        setPendingBookingData(null);
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
                Yêu cầu đặt lịch của bạn đã được ghi nhận. Mã đặt lịch của bạn là{' '}
                <strong className="text-[var(--primary-gold-dark)] font-mono text-base tracking-widest">
                  {completedBooking.id || completedBooking.code}
                </strong>.
              </p>

              <div className={styles.summaryCard}>
                <h3>Chi Tiết Lịch Hẹn</h3>
                <div className={styles.summaryRow}><span>Mã đặt lịch:</span><strong className="font-mono text-[var(--primary-gold-dark)] tracking-widest">{completedBooking.id || completedBooking.code}</strong></div>
                <div className={styles.summaryRow}><span>Dịch vụ:</span><strong>{completedBooking.service}</strong></div>
                <div className={styles.summaryRow}><span>Thời gian:</span><strong>{completedBooking.time} - {completedBooking.date}</strong></div>
                <div className={styles.summaryRow}><span>Khách hàng:</span><strong>{completedBooking.name} ({completedBooking.phone})</strong></div>
                <div className={styles.summaryRow}><span>Chi phí dự kiến:</span><strong className="text-[var(--primary-gold-dark)]">{completedBooking.price}</strong></div>
                <div className={styles.summaryRow}>
                  <span>Thanh toán:</span>
                  <strong>{completedBooking.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản Ngân hàng' : 'Thanh toán Tiền mặt tại Spa'}</strong>
                </div>
                {completedBooking.paymentStatus === 'PAID' && (
                  <div className={styles.summaryRow}>
                    <span>Trạng thái:</span>
                    <strong className="flex items-center gap-1 text-emerald-700">
                      <CheckCircleIcon className="w-4 h-4" />
                      Đã xác nhận thanh toán
                    </strong>
                  </div>
                )}
              </div>

              {completedBooking.paymentMethod === 'BANK_TRANSFER' && completedBooking.paymentStatus !== 'PAID' && (
                <div className={styles.bankTransferBox}>
                  <div className="flex items-center gap-2 mb-3">
                    <QrCodeIcon className="w-5 h-5 text-[var(--primary-gold-dark)]" />
                    <h4 className="font-bold text-stone-800 text-sm uppercase">Thông Tin Thanh Toán</h4>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-amber-200 text-left text-xs space-y-2">
                    <p><strong>Ngân hàng nhận:</strong> MBBank (Ngân Hàng Quân Đội)</p>
                    <p><strong>Số tài khoản:</strong> 1414062005</p>
                    <p><strong>Chủ tài khoản:</strong> BUI TRONG THANH</p>
                    <p><strong>Nội dung CK:</strong> <code className="bg-amber-50 px-2 py-1 rounded text-amber-800 font-bold font-mono tracking-widest">{completedBooking.id || completedBooking.code}</code></p>
                  </div>
                </div>
              )}

              {completedBooking.paymentMethod === 'BANK_TRANSFER' && completedBooking.paymentStatus === 'PAID' && (
                <div className="flex items-center gap-3 justify-center bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-4 mt-2">
                  <CheckCircleIcon className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-bold text-emerald-800 text-sm">Thanh toán đã được xác nhận!</p>
                    <p className="text-emerald-700 text-xs mt-0.5">Hệ thống đã ghi nhận giao dịch chuyển khoản của bạn. Chúng tôi sẽ liên hệ xác nhận lịch hẹn sớm nhất.</p>
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
                    <h3>Chọn Dịch Vụ, Ngày & Giờ Hẹn</h3>
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
                      {errors.service && <span className="text-xs text-red-500 font-semibold mt-1 block">* {errors.service}</span>}

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
                        onChange={(selectedDate) => {
                          setFormData((current) => ({ ...current, date: selectedDate }));
                          if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                        }}
                        minDate={today}
                        maxDate={maxBookingDate}
                        placeholder="Bấm chọn ngày hẹn mong muốn..."
                        showQuickPills={true}
                      />
                      {errors.date && <span className="text-xs text-red-500 font-semibold mt-1 block">* {errors.date}</span>}
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
                      {errors.time && <span className="text-xs text-red-500 font-semibold mt-1 block">* {errors.time}</span>}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button type="button" onClick={goToStep2} className="btn-luxury-primary text-sm">
                      <span>Tiếp Tục</span>
                      <ArrowUpRightIcon className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Customer Info */}
              {step === 2 && (
                <div className="animate-fadeIn">
                  <div className={styles.formHeader}>
                    <h3>Thông Tin Cá Nhân</h3>
                    <p>Nhập thông tin liên hệ để chuyên viên giữ khung giờ hẹn cho bạn.</p>
                  </div>

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
                        className={errors.name ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : ''}
                      />
                      {errors.name && <span className="text-xs text-red-500 font-semibold mt-1 block">* {errors.name}</span>}
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
                        className={errors.phone ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : ''}
                      />
                      {errors.phone && <span className="text-xs text-red-500 font-semibold mt-1 block">* {errors.phone}</span>}
                    </div>
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="email">Email *</label>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        placeholder="email@example.com" 
                        className={errors.email ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : ''}
                      />
                      {errors.email && <span className="text-xs text-red-500 font-semibold mt-1 block">* {errors.email}</span>}
                    </div>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label>Hình ảnh tình trạng da (không bắt buộc - chọn tối đa 5 ảnh)</label>

                      {/* Hidden File & Camera Inputs */}
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        id="customerImage" 
                        name="customerImage" 
                        accept="image/png,image/jpeg,image/webp" 
                        multiple
                        className="hidden"
                        onChange={handleImageChange} 
                      />
                      <input 
                        ref={cameraInputRef}
                        type="file" 
                        accept="image/*" 
                        capture="environment"
                        className="hidden"
                        onChange={handleImageChange} 
                      />

                      {/* Square Camera Upload Action Cards & Previews */}
                      <div className="flex flex-wrap gap-3.5 mt-2 mb-1">
                        {/* Square Box 1: Pick from Device Gallery */}
                        {(formData.customerImages?.length || 0) < 5 && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-28 h-28 border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/40 hover:bg-amber-50/90 rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group shadow-xs"
                            title="Chọn ảnh từ thiết bị"
                          >
                            <div className="w-9 h-9 rounded-full bg-amber-100 group-hover:bg-amber-200 text-amber-800 flex items-center justify-center mb-1.5 transition-colors">
                              <PhotoIcon className="w-5 h-5" />
                            </div>
                            <span className="text-[0.72rem] font-bold text-stone-800">Tải ảnh lên</span>
                            <span className="text-[0.62rem] text-stone-500 font-medium">Thư viện thiết bị</span>
                          </button>
                        )}

                        {/* Square Box 2: Direct Camera Capture */}
                        {(formData.customerImages?.length || 0) < 5 && (
                          <button
                            type="button"
                            onClick={startLiveCamera}
                            className="w-28 h-28 border-2 border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/60 rounded-2xl flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group shadow-xs"
                            title="Chụp ảnh trực tiếp từ máy ảnh"
                          >
                            <div className="w-9 h-9 rounded-full bg-stone-200 group-hover:bg-amber-200 text-stone-700 group-hover:text-amber-800 flex items-center justify-center mb-1.5 transition-colors">
                              <CameraIcon className="w-5 h-5" />
                            </div>
                            <span className="text-[0.72rem] font-bold text-stone-800">Tự chụp ảnh</span>
                            <span className="text-[0.62rem] text-stone-500 font-medium">Dùng camera</span>
                          </button>
                        )}

                        {/* Image Previews */}
                        {imagePreviews.map((img, idx) => (
                          <div key={idx} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-stone-200 shadow-sm group">
                            <img src={img.url} alt={`Ảnh da ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center transition-all cursor-pointer"
                              title="Xóa ảnh này"
                            >
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[0.65rem] px-1.5 py-0.5 rounded font-mono font-bold">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      <span className={styles.uploadHint}>Hỗ trợ chọn nhiều ảnh (JPG, PNG, WEBP tối đa 3MB/ảnh) để bác sĩ soi da trước.</span>
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
                      <span>Thanh Toán</span>
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
                          <span>Đặt Lịch Ngay</span>
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
                <h3 className={styles.modalTitle}>Thanh toán qua ngân hàng</h3>
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
                  <strong className="text-amber-800 bg-amber-100 px-2.5 py-1 rounded font-mono text-sm tracking-widest">
                    {pendingBookingData?.id || 'DH-0000-0000-0000'}
                  </strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(pendingBookingData?.id || '', 'Mã đặt lịch')}
                    className={styles.copyBadge}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            </div>

            {/* Polling Ping & Automatic Transition Notice */}
            <div className={styles.pollingBar}>
              <span className={styles.pingDot}></span>
              <span className="font-semibold">Hệ thống sẽ tự động chuyển trang ngay khi nhận tiền.</span>
            </div>

            {/* Optional Fallback Actions */}
            <div className="flex flex-col gap-2 mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowSepayModal(false)}
                className="text-xs text-stone-500 hover:text-stone-800 hover:underline py-1 cursor-pointer"
              >
                Hủy / Đổi phương thức thanh toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live WebRTC Camera Modal */}
      {showLiveCameraModal && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-amber-300 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={stopLiveCamera}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-red-100 text-stone-600 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng Camera"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 justify-center mb-3">
              <CameraIcon className="w-6 h-6 text-[#C59B63]" />
              <h3 className="font-serif font-bold text-stone-900 text-lg">Tự Chụp Ảnh Tình Trạng Da</h3>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Căn chỉnh khuôn mặt hoặc vùng da cần tư vấn vào giữa khung hình rồi nhấn nút chụp.
            </p>

            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black mb-5 border-2 border-amber-400/50 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-2xl pointer-events-none"></div>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={captureLivePhoto}
                className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C59B63] hover:from-[#C59B63] hover:to-[#A27B44] text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <CameraIcon className="w-5 h-5" />
                <span>Chụp Ảnh Ngay</span>
              </button>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
