import { useEffect } from 'react';
import {
  CheckBadgeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '../../icons.jsx';
import styles from './SeoPreviewModal.module.css';

const STATUS_TAG = {
  ok: { icon: CheckBadgeIcon, text: 'Đạt', className: 'statusOk' },
  warn: { icon: ExclamationTriangleIcon, text: 'Cần tối ưu', className: 'statusWarn' },
  miss: { icon: ExclamationTriangleIcon, text: 'Chưa có', className: 'statusMiss' },
};

export default function SeoPreviewModal({
  open,
  onClose,
  title,
  slug,
  excerpt,
  imageUrl,
  onChange,
  checklist,
}) {
  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Đóng modal bằng phím ESC
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Xem trích dẫn và chỉnh SEO preview"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <MagnifyingGlassIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className={styles.headerHeading}>Xem trích dẫn & chỉnh SEO preview</h3>
              <p className={styles.headerSubtext}>
                Cấu hình trích dẫn hiển thị trên công cụ tìm kiếm
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.grid}>
            {/* Cột trái: chỉnh sửa */}
            <div className={styles.editColumn}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="seoModalTitle">
                  Tiêu đề bài viết (SEO Title)
                  <span className={styles.charCount}>
                    {title.trim().length}/70 ký tự
                  </span>
                </label>
                <input
                  id="seoModalTitle"
                  name="title"
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={onChange}
                  placeholder="Nhập tiêu đề bài viết (tối ưu 10-70 ký tự)..."
                />
                <p className={styles.fieldHint}>
                  Tiêu đề hiển thị màu xanh trên kết quả tìm kiếm Google.
                </p>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="seoModalExcerpt">
                  Trích dẫn (Meta Description)
                  <span className={styles.charCount}>
                    {excerpt.trim().length}/240 ký tự
                  </span>
                </label>
                <textarea
                  id="seoModalExcerpt"
                  name="excerpt"
                  className={styles.textarea}
                  value={excerpt}
                  maxLength={500}
                  onChange={onChange}
                  placeholder="Nhập trích dẫn hiển thị trên Google (tối ưu 50-240 ký tự)..."
                />
                <p className={styles.fieldHint}>
                  Google thường hiển thị 150-160 ký tự đầu tiên của trích dẫn trên kết quả tìm kiếm.
                </p>
              </div>
            </div>

            {/* Cột phải: preview */}
            <div className={styles.previewColumn}>
              <div className={styles.googlePreviewBox}>
                <div className={styles.googlePreviewSite}>
                  <span className={styles.googleFavicon}>L</span>
                  <span className={styles.googleSiteName}>Lan Anh Beauty</span>
                  <span className={styles.googleSiteUrl}>
                    https://lananhbeauty.vn › blog
                  </span>
                </div>
                <div className={styles.googlePreviewTitle}>
                  {title ? `${title} | Lan Anh Beauty` : 'Xem trước tiêu đề bài viết'}
                </div>
                <div className={styles.googlePreviewUrl}>
                  https://lananhbeauty.vn/blog/{slug || 'slug-bai-viet'}
                </div>
                <div className={styles.googlePreviewDesc}>
                  {excerpt.trim() ||
                    'Mô tả ngắn xem trước sẽ hiển thị tại đây khi tìm kiếm trên Google.'}
                </div>
              </div>

              {imageUrl && (
                <div className={styles.previewImageBox}>
                  <img src={imageUrl} alt="Ảnh thumbnail xem trước" />
                </div>
              )}
            </div>
          </div>

          {/* Checklist SEO */}
          <div className={styles.checklistSection}>
            <div className={styles.checklistHeader}>
              <h4 className={styles.checklistTitle}>Đánh giá SEO</h4>
              <span className={styles.checklistBadge}>
                <CheckCircleIcon className="w-3 h-3 inline" />
                Tự động phân tích
              </span>
            </div>
            <div className={styles.checklistGrid}>
              {checklist.map((item) => {
                const tag = STATUS_TAG[item.status] || STATUS_TAG.miss;
                const TagIcon = tag.icon;
                return (
                  <div key={item.label} className={styles.checkItem}>
                    <TagIcon className={styles.checkIcon} />
                    <span className={styles.checkLabel}>{item.label}</span>
                    <span className={`${styles.tag} ${styles[tag.className]}`}>
                      {item.text || tag.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerNote}>
            Thay đổi sẽ được áp dụng ngay vào bài viết, hãy nhớ nhấn "Lưu bài viết".
          </p>
          <button type="button" className={styles.btnDone} onClick={onClose}>
            <CheckCircleIcon className="w-4 h-4" />
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
