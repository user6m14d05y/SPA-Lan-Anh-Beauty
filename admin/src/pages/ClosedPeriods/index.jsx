import { useEffect, useMemo, useState } from 'react';
import { CalendarOff, Moon, Sun, Trash2 } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext';
import styles from './ClosedPeriods.module.css';

const API_URL = 'http://localhost:5000/api';

const shiftLabels = {
  MORNING: 'Nghỉ ca sáng',
  AFTERNOON: 'Nghỉ ca chiều',
  FULL_DAY: 'Nghỉ cả ngày',
};

const shiftIcons = {
  MORNING: Sun,
  AFTERNOON: Moon,
  FULL_DAY: CalendarOff,
};

const emptyForm = {
  date: '',
  shift: 'FULL_DAY',
  reason: '',
};

const getToday = () => new Date().toISOString().slice(0, 10);

export default function ClosedPeriods() {
  const { authFetch } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const sortedPeriods = useMemo(() => [...periods].sort((a, b) => (
    `${a.date}-${a.shift}`.localeCompare(`${b.date}-${b.shift}`)
  )), [periods]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`${API_URL}/closed-periods`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải ngày nghỉ.');
      }

      setPeriods(result.data || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể tải ngày nghỉ.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setMessage({ type: '', text: '' });
      const response = await authFetch(`${API_URL}/closed-periods`, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tạo ngày nghỉ.');
      }

      setPeriods((current) => [...current, result.data]);
      setFormData(emptyForm);
      setMessage({ type: 'success', text: result.message || 'Tạo ngày nghỉ thành công.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể tạo ngày nghỉ.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (period) => {
    if (!window.confirm(`Xóa ${shiftLabels[period.shift].toLowerCase()} ngày ${period.date}?`)) return;

    try {
      setMessage({ type: '', text: '' });
      const response = await authFetch(`${API_URL}/closed-periods/${period.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể xóa ngày nghỉ.');
      }

      setPeriods((current) => current.filter((item) => item.id !== period.id));
      setMessage({ type: 'success', text: result.message || 'Xóa ngày nghỉ thành công.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể xóa ngày nghỉ.' });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2>Quản lý ngày nghỉ</h2>
          <p>Thiết lập ngày nghỉ theo ca sáng, ca chiều hoặc nghỉ cả ngày để hệ thống tự khóa slot đặt lịch.</p>
        </div>
      </div>

      {message.text && (
        <div className={`${styles.messageBox} ${message.type === 'success' ? styles.successBox : styles.errorBox}`}>
          {message.text}
        </div>
      )}

      <div className={styles.layoutGrid}>
        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.sectionTitle}>
            <CalendarOff size={22} />
            <div>
              <h3>Thêm ngày nghỉ</h3>
              <p>Ngày nghỉ sẽ được áp dụng ngay trên trang đặt lịch.</p>
            </div>
          </div>

          <label>Ngày nghỉ</label>
          <input type="date" name="date" min={getToday()} value={formData.date} onChange={handleChange} required />

          <label>Loại nghỉ</label>
          <select name="shift" value={formData.shift} onChange={handleChange}>
            <option value="FULL_DAY">Nghỉ cả ngày</option>
            <option value="MORNING">Nghỉ ca sáng</option>
            <option value="AFTERNOON">Nghỉ ca chiều</option>
          </select>

          <label>Lý do</label>
          <input name="reason" value={formData.reason} onChange={handleChange} placeholder="Ví dụ: Bảo trì, đào tạo nhân viên..." />

          <button type="submit" disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu ngày nghỉ'}</button>
        </form>

        <div className={styles.listCard}>
          <div className={styles.sectionTitle}>
            <CalendarOff size={22} />
            <div>
              <h3>Danh sách ngày nghỉ</h3>
              <p>{sortedPeriods.length} cấu hình đang được áp dụng.</p>
            </div>
          </div>

          {loading ? (
            <div className={styles.stateBox}>Đang tải ngày nghỉ...</div>
          ) : sortedPeriods.length === 0 ? (
            <div className={styles.stateBox}>Chưa có ngày nghỉ nào.</div>
          ) : (
            <div className={styles.periodList}>
              {sortedPeriods.map((period) => {
                const Icon = shiftIcons[period.shift] || CalendarOff;

                return (
                  <div key={period.id} className={styles.periodItem}>
                    <div className={styles.periodIcon}><Icon size={18} /></div>
                    <div>
                      <strong>{period.date}</strong>
                      <span>{shiftLabels[period.shift]}</span>
                      {period.reason && <p>{period.reason}</p>}
                    </div>
                    <button type="button" onClick={() => handleDelete(period)}><Trash2 size={16} /> Xóa</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
