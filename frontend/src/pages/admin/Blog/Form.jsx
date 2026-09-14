import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { useAuth } from '../../../context/AuthContext';
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
} from '../../../icons';
import SeoPreviewModal from '../../../components/admin/SeoPreviewModal';
import { API_URL, ASSET_URL } from '../../../config';
import styles from './BlogForm.module.css';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  imageUrl: '',
  imageAlt: '',
  categoryId: '',
  status: 'DRAFT',
  robots: 'index,follow',
};

const slugify = (text) =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const countWords = (text) => {
  const plainText = String(text || '').replace(/<[^>]*>/g, ' ').trim();
  if (!plainText) return 0;
  return plainText.split(/\s+/).filter(Boolean).length;
};

export default function BlogForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [error, setError] = useState('');

  // Load initial categories & post data if editing
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError('');

        const fetchCats = async () => {
          const res = await authFetch(`${API_URL}/blog/admin/categories`);
          const data = await res.json();
          return (res.ok && data.success) ? (data.data || []) : [];
        };

        const fetchPost = async () => {
          if (!id) return null;
          const res = await authFetch(`${API_URL}/blog/admin/posts/${id}`);
          const data = await res.json();
          return (res.ok && data.success) ? data.data : null;
        };

        const [catList, postData] = await Promise.all([
          fetchCats(),
          fetchPost(),
        ]);

        if (isCancelled) return;
        setCategories(catList || []);

        if (id) {
          if (!postData) throw new Error('Không tìm thấy bài viết cần chỉnh sửa.');
          setForm({
            title: postData.title || '',
            slug: postData.slug || '',
            excerpt: postData.excerpt || '',
            content: postData.content || '',
            imageUrl: postData.imageUrl || '',
            imageAlt: postData.imageAlt || postData.title || '',
            categoryId: postData.categoryId || (catList?.[0]?.id || ''),
            status: postData.status || 'DRAFT',
            robots: postData.robots || 'index,follow',
          });
        } else if (catList && catList.length > 0) {
          setForm((prev) => ({ ...prev, categoryId: catList[0].id }));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Không thể tải dữ liệu bài viết.');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [id, authFetch]);

  // Derived metrics
  const wordCount = useMemo(() => countWords(form.content), [form.content]);
  const estimatedReadTime = useMemo(
    () => Math.max(1, Math.ceil(wordCount / 200)),
    [wordCount]
  );

  // Form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'title' && !id) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  // Image Upload Handling
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận tệp hình ảnh (JPG, PNG, WEBP, GIF).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Kích thước ảnh vượt quá 3MB.');
      return;
    }

    try {
      setUploadingImage(true);
      setError('');
      const formData = new FormData();
      formData.append('image', file);
      const res = await authFetch(`${API_URL}/blog/admin/upload-image`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'Tải ảnh lên thất bại.');
      const uploadedUrl = result.data?.imageUrl || result.imageUrl;
      setForm((prev) => ({
        ...prev,
        imageUrl: uploadedUrl,
        imageAlt: prev.imageAlt || prev.title || file.name,
      }));
    } catch (err) {
      setError(err.message || 'Tải ảnh lên thất bại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setError('Vui lòng nhập đầy đủ Tiêu đề, Slug và Nội dung bài viết.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content,
        imageUrl: form.imageUrl.trim() || null,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        status: String(form.status).toUpperCase(),
        readingTimeMinutes: estimatedReadTime,
      };

      if (id) {
        const res = await authFetch(`${API_URL}/blog/admin/posts/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Không thể lưu bài viết.');
      } else {
        const res = await authFetch(`${API_URL}/blog/admin/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Không thể tạo bài viết.');
      }

      navigate('/admin/blog');
    } catch (err) {
      setError(err.message || 'Không thể lưu bài viết.');
    } finally {
      setSubmitting(false);
    }
  };

  // SEO Checklist items
  const seoChecklist = useMemo(() => {
    const titleLen = form.title.trim().length;
    const descLen = form.excerpt.trim().length;
    const slugValid = Boolean(form.slug && /^[a-z0-9-]+$/.test(form.slug));

    return [
      {
        label: 'Tiêu đề bài viết (SEO Title)',
        status: titleLen >= 10 && titleLen <= 70 ? 'ok' : titleLen > 0 ? 'warn' : 'miss',
        text: titleLen > 0 ? `${titleLen}/70 ký tự` : 'Thiếu',
      },
      {
        label: 'Độ dài Đường dẫn (Slug)',
        status: slugValid ? 'ok' : 'warn',
        text: slugValid ? 'Đạt chuẩn' : 'Cần tối ưu',
      },
      {
        label: 'Mô tả ngắn (Meta Description)',
        status: descLen >= 50 && descLen <= 240 ? 'ok' : descLen > 0 ? 'warn' : 'miss',
        text: descLen > 0 ? `${descLen} ký tự` : 'Thiếu',
      },
      {
        label: 'Ảnh đại diện (Featured Image)',
        status: form.imageUrl ? 'ok' : 'miss',
        text: form.imageUrl ? 'Đã có' : 'Thiếu',
      },
      {
        label: 'Độ dài nội dung bài viết',
        status: wordCount >= 300 ? 'ok' : wordCount > 0 ? 'warn' : 'miss',
        text: `${wordCount} từ`,
      },
    ];
  }, [form.title, form.slug, form.excerpt, form.imageUrl, wordCount]);

  // Image full URL helper
  const displayImageUrl = useMemo(() => {
    if (!form.imageUrl) return '';
    if (form.imageUrl.startsWith('http://') || form.imageUrl.startsWith('https://')) {
      return form.imageUrl;
    }
    return `${ASSET_URL}${form.imageUrl}`;
  }, [form.imageUrl]);

  if (loading) {
    return (
      <div className={styles.formContainer}>
        <div className="text-center py-20 text-[var(--text-muted)]">
          Đang tải dữ liệu bài viết...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      {/* Top Header Bar */}
      <div className={styles.topBar}>
        <div>
          <Link to="/admin/blog" className={styles.backLink}>
            <ArrowLeftIcon className="w-3.5 h-3.5 inline mr-1" />
            Quay lại danh sách bài viết
          </Link>
          <h1 className={styles.pageTitle}>
            {id ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </h1>
          <p className={styles.pageDescription}>
            Soạn thảo bài viết chuẩn SEO với định dạng phong phú và ảnh đại diện tải lên.
          </p>
        </div>
        <div className={styles.topActions}>
          <Link to="/admin/blog" className={styles.btnCancel}>
            Hủy
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={styles.btnSubmit}
          >
            {submitting ? 'Đang lưu...' : 'Lưu bài viết'}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* LEFT MAIN COLUMN (Stacked vertically) */}
        <div className={styles.mainColumn}>
          {/* CARD 1: THÔNG TIN CƠ BẢN */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <span className={styles.bulletDot}></span>
                THÔNG TIN CƠ BẢN
              </h3>
              <span className={styles.cardBadge}>Thông tin chính</span>
            </div>

            <div className={styles.row2Col}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Tiêu đề bài viết</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Nhập tiêu đề bài viết..."
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Chuyên mục</label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="">-- Chọn chuyên mục --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.row3Col}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Đường dẫn (Slug)</label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="slug-bai-viet"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Thời gian đọc
                  <span className={styles.subLabel}>Tự động tính từ số từ</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${estimatedReadTime} phút đọc (${wordCount} từ)`}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Trạng thái</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={styles.select}
                >
                  <option value="PUBLISHED">Xuất bản (Published)</option>
                  <option value="DRAFT">Bản nháp (Draft)</option>
                  <option value="ARCHIVED">Lưu trữ (Archived)</option>
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Mô tả ngắn (Summary)</label>
              <textarea
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                maxLength={500}
                placeholder="Tóm tắt ngắn gọn nội dung bài viết hiển thị ở danh sách tin tức & kết quả tìm kiếm..."
                className={styles.textarea}
              />
            </div>
          </div>

          {/* CARD 2: NỘI DUNG CHI TIẾT */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <span className={styles.bulletDot}></span>
                NỘI DUNG CHI TIẾT
              </h3>
            </div>

            <div className={styles.editorWrapper}>
              <Editor
                apiKey={import.meta.env.VITE_TINY_MCE_API_KEY || 'no-api-key'}
                value={form.content}
                onEditorChange={(content) =>
                  setForm((prev) => ({ ...prev, content }))
                }
                init={{
                  height: 480,
                  menubar: true,
                  branding: false,
                  plugins:
                    'advlist autolink lists link image table code fullscreen wordcount preview media',
                  toolbar:
                    'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | link image media table | code fullscreen preview',
                  content_style:
                    'body { font-family: Montserrat, Playfair Display, sans-serif; font-size: 15px; line-height: 1.7; color: #1C1612; }',
                }}
              />
              <div className={styles.editorFooter}>
                <span>Trình soạn thảo văn bản</span>
                <strong>{wordCount} từ</strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <div className={styles.sidebarColumn}>
          {/* ẢNH ĐẠI DIỆN */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <span className={styles.bulletDot}></span>
                ẢNH ĐẠI DIỆN
              </h3>
              <button
                type="button"
                className="text-xs text-[#775932] hover:underline bg-transparent border-0 cursor-pointer font-semibold"
                onClick={() => fileInputRef.current?.click()}
              >
                Tải ảnh lên
              </button>
            </div>

            {form.imageUrl ? (
              <div className={styles.imagePreviewBox}>
                <img
                  src={displayImageUrl}
                  alt={form.imageAlt || 'Xem trước ảnh'}
                  className={styles.imagePreview}
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                  className={styles.imageRemoveBtn}
                >
                  Xóa ảnh
                </button>
              </div>
            ) : (
              <div
                className={`${styles.uploadDropzone} ${
                  dragOver ? styles.dragOver : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={styles.uploadIcon}>
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className={styles.uploadText}>
                  {uploadingImage ? 'ĐANG TẢI ẢNH LÊN...' : 'NHẤP HOẶC KÉO THẢ ẢNH VÀO ĐÂY'}
                </div>
                <div className={styles.uploadSubtext}>
                  Hỗ trợ tệp JPG, PNG, WEBP, GIF. Tối đa 3MB
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.fileInputHidden}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />


            <div className={styles.fieldGroup}>
              <label className={styles.label}>Mô tả ảnh (Alt text)</label>
              <input
                type="text"
                name="imageAlt"
                value={form.imageAlt}
                onChange={handleChange}
                placeholder="Mô tả ảnh giúp tối ưu tìm kiếm..."
                className={styles.input}
              />
            </div>
          </div>

          {/* XEM TRƯỚC GOOGLE */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <span className={styles.bulletDot}></span>
                XEM TRƯỚC GOOGLE
              </h3>
              <span className={styles.cardBadge}>Trích dẫn</span>
            </div>

            <div className={styles.googlePreviewBox}>
              <div className={styles.googlePreviewTitle}>
                {form.title ? `${form.title} | Lan Anh Beauty` : 'Xem trước tiêu đề bài viết'}
              </div>
              <div className={styles.googlePreviewUrl}>
                https://lananhbeauty.vn/blog/{form.slug || 'slug-bai-viet'}
              </div>
              <div className={styles.googlePreviewDesc}>
                {form.excerpt || 'Mô tả ngắn xem trước sẽ hiển thị tại đây khi tìm kiếm trên Google.'}
              </div>
            </div>

            <button
              type="button"
              className={styles.btnSeoAction}
              onClick={() => setShowSeoModal(true)}
            >
              <MagnifyingGlassIcon className="w-3.5 h-3.5 inline mr-1.5" />
              Xem trích dẫn & chỉnh SEO preview
            </button>
          </div>

          {/* CHECKLIST SEO */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <span className={styles.bulletDot}></span>
                TÙY CHỌN SEO
              </h3>
              <span className={styles.cardBadge}>Checklist</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Chỉ mục Robots</label>
              <select
                name="robots"
                value={form.robots}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="index,follow">index, follow (Cho phép Google chỉ mục)</option>
                <option value="noindex,follow">noindex, follow (Không chỉ mục, cho theo link)</option>
                <option value="noindex,nofollow">noindex, nofollow (Chặn tìm kiếm)</option>
              </select>
            </div>

            <div className={styles.seoChecklist}>
              {seoChecklist.map((item) => (
                <div key={item.label} className={styles.seoCheckItem}>
                  <span>{item.label}</span>
                  <span
                    className={
                      item.status === 'ok'
                        ? styles.seoTagOk
                        : item.status === 'warn'
                        ? styles.seoTagWarn
                        : styles.seoTagMiss
                    }
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Modal chỉnh trích dẫn & SEO preview */}
      <SeoPreviewModal
        open={showSeoModal}
        onClose={() => setShowSeoModal(false)}
        title={form.title}
        slug={form.slug}
        excerpt={form.excerpt}
        imageUrl={displayImageUrl}
        onChange={handleChange}
        checklist={seoChecklist}
      />
    </div>
  );
}
