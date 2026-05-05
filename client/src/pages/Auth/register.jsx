import { useState } from 'react';
import styles from './Auth.module.css';

export default function Register({ onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = 'Vui lòng nhập họ và tên.';
    if (!form.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      nextErrors.email = 'Email không đúng định dạng.';
    }
    if (!form.phone.trim()) nextErrors.phone = 'Vui lòng nhập số điện thoại.';
    if (!form.password.trim()) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    }
    if (!form.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Đăng ký thất bại.');
      }

      onSuccess?.(result.data);
    } catch (error) {
      setSubmitError(error.message || 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <h2 className={styles.authTitle}>Đăng ký</h2>
        <p className={styles.authSubtitle}>Tạo tài khoản mới để quản lý lịch hẹn và nhận tư vấn nhanh hơn.</p>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-fullName">Họ và tên</label>
          <input id="register-fullName" className={styles.fieldInput} type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nguyễn Văn A" />
          {errors.fullName ? <p className={styles.errorText}>{errors.fullName}</p> : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-email">Email</label>
          <input id="register-email" className={styles.fieldInput} type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
          {errors.email ? <p className={styles.errorText}>{errors.email}</p> : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-phone">Số điện thoại</label>
          <input id="register-phone" className={styles.fieldInput} type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="09xxxxxxxx" />
          {errors.phone ? <p className={styles.errorText}>{errors.phone}</p> : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-password">Mật khẩu</label>
          <input id="register-password" className={styles.fieldInput} type="password" name="password" value={form.password} onChange={handleChange} placeholder="Tạo mật khẩu" />
          {errors.password ? <p className={styles.errorText}>{errors.password}</p> : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="register-confirmPassword">Xác nhận mật khẩu</label>
          <input id="register-confirmPassword" className={styles.fieldInput} type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Nhập lại mật khẩu" />
          {errors.confirmPassword ? <p className={styles.errorText}>{errors.confirmPassword}</p> : null}
        </div>

        {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

        <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        </button>
      </form>

      <div className={styles.divider}><span>hoặc tiếp tục với</span></div>

      <div className={styles.socialGrid}>
        <button type="button" className={styles.socialButton} onClick={() => setSubmitError('Đăng ký Google đang ở chế độ demo giao diện.')}>
          <span className={styles.socialIcon} aria-hidden="true">G</span>
          <span>Google</span>
        </button>
        <button type="button" className={styles.socialButton} onClick={() => setSubmitError('Đăng ký Facebook đang ở chế độ demo giao diện.')}>
          <span className={`${styles.socialIcon} ${styles.facebookIcon}`} aria-hidden="true">f</span>
          <span>Facebook</span>
        </button>
      </div>

      <p className={styles.helperText}>
        Đã có tài khoản?{' '}
        <button type="button" className={styles.textButton} onClick={onSwitchToLogin}>Đăng nhập</button>
      </p>
    </div>
  );
}
