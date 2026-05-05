import { useState } from 'react';
import styles from './Auth.module.css';

export default function Forgot({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      setSubmitted(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Email không đúng định dạng.');
      setSubmitted(false);
      return;
    }

    setError('');
    setSubmitted(true);
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <h2 className={styles.authTitle}>Quên mật khẩu</h2>
        <p className={styles.authSubtitle}>Nhập email của bạn, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.</p>
      </div>

      <form className={styles.authForm} onSubmit={handleSubmit}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel} htmlFor="forgot-email">Email</label>
          <input id="forgot-email" className={styles.fieldInput} type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} placeholder="you@example.com" />
          {error ? <p className={styles.errorText}>{error}</p> : null}
        </div>

        {submitted ? (
          <div className={styles.successBox}>Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.</div>
        ) : null}

        <button className={styles.submitButton} type="submit">Gửi yêu cầu</button>
      </form>

      <p className={styles.helperText}>
        Quay lại{' '}
        <button type="button" className={styles.textButton} onClick={onSwitchToLogin}>Đăng nhập</button>
      </p>
    </div>
  );
}
