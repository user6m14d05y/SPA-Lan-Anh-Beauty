import { useState } from 'react';
import styles from './Auth.module.css';

export default function Login({ onSuccess, onSwitchToRegister, onSwitchToForgot }) {
  const [form, setForm] = useState({ identifier: '', password: '' });
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

    if (!form.identifier.trim()) {
      nextErrors.identifier = 'Vui lòng nhập email hoặc số điện thoại.';
    }

    if (!form.password.trim()) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (form.password.length < 6) {
      nextErrors.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: form.identifier,
          password: form.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Đăng nhập thất bại.');
      }

      onSuccess?.(result.data);
    } catch (error) {
      setSubmitError(error.message || 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <h2 className={styles.authTitle}>Đăng nhập</h2>
        <p className={styles.authSubtitle}>Đăng nhập để tiếp tục đặt lịch và theo dõi thông tin tài khoản của bạn.</p>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-identifier">Email hoặc số điện thoại</label>
          <input id="login-identifier" className={styles.fieldInput} type="text" name="identifier" value={form.identifier} onChange={handleChange} placeholder="you@example.com" />
          {errors.identifier ? <p className={styles.errorText}>{errors.identifier}</p> : null}
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="login-password">Mật khẩu</label>
          <input id="login-password" className={styles.fieldInput} type="password" name="password" value={form.password} onChange={handleChange} placeholder="Nhập mật khẩu" />
          {errors.password ? <p className={styles.errorText}>{errors.password}</p> : null}
        </div>

        {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

        <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>

      <div className={styles.divider}><span>hoặc tiếp tục với</span></div>

      <div className={styles.socialGrid}>
        <button type="button" className={styles.socialButton} onClick={() => setSubmitError('Đăng nhập Google đang ở chế độ demo giao diện.')}>
          <span className={styles.socialIcon} aria-hidden="true">G</span>
          <span>Google</span>
        </button>
        <button type="button" className={styles.socialButton} onClick={() => setSubmitError('Đăng nhập Facebook đang ở chế độ demo giao diện.')}>
          <span className={`${styles.socialIcon} ${styles.facebookIcon}`} aria-hidden="true">f</span>
          <span>Facebook</span>
        </button>
      </div>

      <div className={styles.authActions}>
        <button type="button" className={styles.textButton} onClick={onSwitchToForgot}>Quên mật khẩu?</button>
        <p className={styles.helperText}>
          Chưa có tài khoản?{' '}
          <button type="button" className={styles.textButton} onClick={onSwitchToRegister}>Đăng ký ngay</button>
        </p>
      </div>
    </div>
  );
}
