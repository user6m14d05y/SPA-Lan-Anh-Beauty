import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { CheckCircle, Plus, X } from '../../../icons.jsx';
import { useAuth } from '../../../context/AuthContext';
import { API_URL } from '../../../config.js';
import styles from './Services.module.css';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_IMAGE_COUNT = 8;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const emptyForm = {
  categoryId: '',
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  price: '',
  priceLabel: '',
  durationMinutes: '',
  discountPercent: 0,
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
};

const slugify = (value) => value
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const flattenCategories = (categories) => categories.flatMap((category) => [
  { id: category.id, label: category.name },
  ...(category.children || []).map((child) => ({ id: child.id, label: `${category.name} > ${child.name}` })),
]);

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);

  image.onload = () => {
    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');

    if (!context) {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể xử lý ảnh tải lên.'));
      return;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(objectUrl);
    resolve(canvas.toDataURL('image/webp', 0.82));
  };

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Không thể đọc ảnh tải lên.'));
  };

  image.src = objectUrl;
});

const validateImageFile = (file) => {
  if (!file) return 'Vui lòng chọn ảnh hợp lệ.';
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.';
  if (file.size > MAX_IMAGE_SIZE) return 'Mỗi ảnh phải nhỏ hơn 2MB.';
  return '';
};

const formatDotsNumber = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return Number(digitsOnly).toLocaleString('vi-VN');
};

const parseDotsToNumber = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const digitsOnly = String(val).replace(/\D/g, '');
  return digitsOnly ? Number(digitsOnly) : null;
};

const formatPriceLabel = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/(\d)\.(\d)/g, '$1$2');
  return str.replace(/\d+/g, (match) => Number(match).toLocaleString('vi-VN'));
};

const formatDiscountPercent = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  if (!digitsOnly) return '';
  let num = Number(digitsOnly);
  if (num > 100) num = 100;
  return String(num);
};

const formatDurationMinutes = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const digitsOnly = String(val).replace(/\D/g, '');
  if (!digitsOnly) return '';
  return String(Number(digitsOnly));
};

const formatSortOrder = (val) => {
  if (val === null || val === undefined || val === '') return '0';
  const digitsOnly = String(val).replace(/\D/g, '');
  if (!digitsOnly) return '0';
  return String(Number(digitsOnly));
};

const validateForm = (formData, images) => {
  if (!formData.categoryId) return 'Vui lòng chọn danh mục dịch vụ.';
  if (!formData.name.trim()) return 'Tên dịch vụ là bắt buộc.';
  if (formData.name.trim().length < 2) return 'Tên dịch vụ phải có ít nhất 2 ký tự.';
  if (!formData.slug.trim()) return 'Slug là bắt buộc.';
  if (!/^[a-z0-9-]+$/.test(formData.slug.trim())) return 'Slug chỉ được gồm chữ thường, số và dấu gạch ngang.';
  if (formData.shortDescription.trim().length > 255) return 'Mô tả ngắn không được vượt quá 255 ký tự.';
  
  const numPrice = parseDotsToNumber(formData.price);
  if (formData.price && (numPrice === null || numPrice < 0)) return 'Giá dịch vụ không hợp lệ.';

  const numDuration = parseDotsToNumber(formData.durationMinutes);
  if (formData.durationMinutes && (numDuration === null || numDuration < 1)) return 'Thời lượng phải lớn hơn 0.';

  const numDiscount = parseDotsToNumber(formData.discountPercent);
  if (formData.discountPercent && (numDiscount === null || numDiscount < 0 || numDiscount > 100)) {
    return 'Phần trăm giảm giá phải từ 0 đến 100%.';
  }

  if (images.length === 0) return 'Vui lòng tải lên ít nhất 1 hình ảnh dịch vụ.';
  if (images.length > MAX_IMAGE_COUNT) return `Tối đa ${MAX_IMAGE_COUNT} hình ảnh cho mỗi dịch vụ.`;
  return '';
};

const buildPayload = (formData, images) => ({
  categoryId: formData.categoryId,
  name: formData.name.trim(),
  slug: formData.slug.trim(),
  shortDescription: formData.shortDescription.trim(),
  description: formData.description.trim(),
  price: parseDotsToNumber(formData.price),
  priceLabel: formData.priceLabel.trim(),
  durationMinutes: parseDotsToNumber(formData.durationMinutes),
  imageUrl: images[0] || '',
  images,
  discountPercent: parseDotsToNumber(formData.discountPercent) || 0,
  isFeatured: Boolean(formData.isFeatured),
  isActive: Boolean(formData.isActive),
  sortOrder: parseDotsToNumber(formData.sortOrder) || 0,
});

export default function AddService() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);
  const coverImage = images[0];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${API_URL}/catalog/tree?active=all`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải dữ liệu dịch vụ.');
        }

        setCategories(result.data || []);
      } catch (error) {
        setError(error.message || 'Không thể tải dữ liệu dịch vụ.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      const nextForm = { ...current };
      if (name === 'price') {
        nextForm.price = formatDotsNumber(value);
      } else if (name === 'priceLabel') {
        nextForm.priceLabel = formatPriceLabel(value);
      } else if (name === 'discountPercent') {
        nextForm.discountPercent = formatDiscountPercent(value);
      } else if (name === 'durationMinutes') {
        nextForm.durationMinutes = formatDurationMinutes(value);
      } else if (name === 'sortOrder') {
        nextForm.sortOrder = formatSortOrder(value);
      } else {
        nextForm[name] = value;
        if (name === 'name') {
          nextForm.slug = slugify(value);
        }
      }
      return nextForm;
    });
  };

  const handleToggleChange = (name) => {
    setFormData((current) => ({ ...current, [name]: !current[name] }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((current) => ({ ...current, description: value }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGE_COUNT) {
      setImageError(`Tối đa ${MAX_IMAGE_COUNT} hình ảnh cho mỗi dịch vụ.`);
      event.target.value = '';
      return;
    }

    const validationError = files.map(validateImageFile).find(Boolean);
    if (validationError) {
      setImageError(validationError);
      event.target.value = '';
      return;
    }

    try {
      const uploadedImages = await Promise.all(files.map(fileToDataUrl));
      setImages((current) => [...current, ...uploadedImages]);
      setImageError('');
      setError('');
    } catch (error) {
      setImageError(error.message || 'Không thể đọc ảnh tải lên.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveImage = (imageToRemove) => {
    setImages((current) => current.filter((image) => image !== imageToRemove));
  };

  const handleSetCover = (imageToPromote) => {
    setImages((current) => [imageToPromote, ...current.filter((image) => image !== imageToPromote)]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm(formData, images);

    if (validationError) {
      if (validationError.toLowerCase().includes('hình ảnh')) {
        setImageError(validationError);
      }
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await authFetch(`${API_URL}/catalog/services`, {
        method: 'POST',
        body: JSON.stringify(buildPayload(formData, images)),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể lưu dịch vụ.');
      }

      alert('Tạo dịch vụ thành công.');
      navigate('/admin/services');
    } catch (error) {
      const message = error.message || 'Không thể lưu dịch vụ.';
      setError(message);
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.stateBox}>Đang tải form dịch vụ...</div>;
  }

  return (
    <div className={styles.formPage}>
      <div className={styles.formPageHeader}>
        <div>
          <Link to="/admin/services" className={styles.backLink}>← Quay lại danh sách dịch vụ</Link>
          <h2 className={styles.pageTitle}>Thêm dịch vụ mới</h2>
          <p className={styles.pageDescription}>Nhập đầy đủ thông tin, hình ảnh và trạng thái để dịch vụ hiển thị rõ ràng trên website khách hàng.</p>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form className={styles.serviceStandaloneForm} onSubmit={handleSubmit}>
        <div className={`${styles.formLayout} gap-6`}>
          <div className={`${styles.formMainColumn} transition-all duration-300`}>
            <div className={styles.formSection}>
              <div className={styles.sectionTitleRow}>
                <h3>
                  <span className={styles.cardTitleBullet}></span>
                  THÔNG TIN DỊCH VỤ
                </h3>
              </div>

              <div className={styles.formGrid}>
                <div>
                  <label>Tên dịch vụ</label>
                  <input name="name" value={formData.name} onChange={handleFormChange} required placeholder="Ví dụ: Phun môi collagen" />
                </div>
                <div>
                  <label>Slug</label>
                  <input name="slug" value={formData.slug} onChange={handleFormChange} required placeholder="phun-moi-collagen" />
                </div>
              </div>

              <label className={'mt-3'}>Mô tả ngắn</label>
              <textarea name="shortDescription" value={formData.shortDescription} onChange={handleFormChange} maxLength={255} placeholder="Tóm tắt ngắn gọn lợi ích hoặc điểm nổi bật của dịch vụ." />

              <div className={styles.editorHeader}>
                <label>Mô tả chi tiết</label>
              </div>
              <Editor
                apiKey={import.meta.env.VITE_TINY_MCE_API_KEY || 'no-api-key'}
                value={formData.description}
                onEditorChange={handleDescriptionChange}
                init={{
                  height: 420,
                  menubar: 'file edit view insert format tools table help',
                  branding: false,
                  promotion: false,
                  plugins: 'advlist autolink lists link charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime table help wordcount',
                  toolbar: 'undo redo | blocks | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link table | removeformat | preview code fullscreen',
                  paste_data_images: false,
                  invalid_elements: 'img',
                  block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4',
                  content_style: 'body { font-family: Montserrat, Arial, sans-serif; font-size: 15px; line-height: 1.7; } h1,h2,h3,h4 { color: #775932; }',
                }}
              />
              <div className={styles.editorHint}>Gợi ý SEO: dùng H1 cho tên nội dung chính, H2/H3 cho các phần như lợi ích, quy trình, lưu ý và chăm sóc sau dịch vụ.</div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionTitleRow}>
                <h3>
                  <span className={styles.cardTitleBullet}></span>
                  GIÁ BÁN & THỜI LƯỢNG
                </h3>
              </div>

              <div className={styles.formGrid}>
                <div>
                  <label>Giá bán</label>
                  <input type="text" name="price" value={formData.price} onChange={handleFormChange} placeholder="500.000" />
                </div>
                <div>
                  <label>Label giá</label>
                  <input type="text" name="priceLabel" value={formData.priceLabel} onChange={handleFormChange} placeholder="Từ 500.000đ" />
                </div>
                <div>
                  <label>Giảm giá (%)</label>
                  <input type="text" name="discountPercent" value={formData.discountPercent} onChange={handleFormChange} placeholder="0" />
                </div>
                <div>
                  <label>Thời lượng (phút)</label>
                  <input type="text" name="durationMinutes" value={formData.durationMinutes} onChange={handleFormChange} placeholder="60" />
                </div>
              </div>
            </div>
          </div>

          <aside className={`${styles.formSideColumn} transition-all duration-300`}>
            <div className={styles.formSection}>
              <div className={styles.sectionTitleRow}>
                <h3>
                  <span className={styles.cardTitleBullet}></span>
                  ẢNH DỊCH VỤ
                </h3>
              </div>

              <div className={styles.coverPreview}>
                {coverImage ? <img src={coverImage} alt="Ảnh đại diện dịch vụ" /> : <span>Chưa có ảnh đại diện</span>}
              </div>

              <label className={`${styles.uploadButtonWide} ${imageError ? styles.uploadButtonError : ''}`}>
                <Plus size={16} /> Tải hình ảnh
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageUpload} hidden />
              </label>
              <div className={styles.uploadHint}>JPG, PNG, WEBP • tối đa 2MB/ảnh • tối đa 8 ảnh.</div>
              {imageError && <div className={styles.fieldError}>{imageError}</div>}

              {images.length > 0 ? (
                <div className={styles.previewGridCompact}>
                  {images.map((image, index) => (
                    <div key={`${index}-${image.slice(0, 20)}`} className={styles.previewCardCompact}>
                      <img src={image} alt={`Ảnh ${index + 1}`} />
                      {index === 0 && <span className={styles.coverBadge}>Ảnh chính</span>}
                      <div className={styles.previewHoverActions}>
                        {index !== 0 && (
                          <button type="button" onClick={() => handleSetCover(image)} aria-label="Đặt làm ảnh chính"><CheckCircle size={16} /></button>
                        )}
                        <button type="button" className={styles.iconRemoveBtn} onClick={() => handleRemoveImage(image)} aria-label="Xóa ảnh"><X size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.previewEmpty}>Chưa có hình ảnh nào được tải lên.</div>
              )}
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionTitleRow}>
                <h3>
                  <span className={styles.cardTitleBullet}></span>
                  PHÂN LOẠI & HIỂN THỊ
                </h3>
              </div>

              <label>Danh mục dịch vụ</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleFormChange} required>
                <option value="">Chọn danh mục</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>

              <label>Thứ tự hiển thị</label>
              <input type="text" name="sortOrder" value={formData.sortOrder} onChange={handleFormChange} placeholder="0" />

              <div className={styles.toggleStack}>
                <div className={styles.toggleCard}>
                  <div>
                    <strong>Nổi bật</strong>
                    <p>Ưu tiên dịch vụ tại các khu vực nổi bật.</p>
                  </div>
                  <button type="button" className={`${styles.switch} ${formData.isFeatured ? styles.switchOn : ''}`} onClick={() => handleToggleChange('isFeatured')} aria-pressed={formData.isFeatured}>
                    <span className={styles.switchThumb} />
                  </button>
                </div>

                <div className={styles.toggleCard}>
                  <div>
                    <strong>Đang hiển thị</strong>
                    <p>Tắt trạng thái này sẽ đưa dịch vụ vào tab Đã ẩn.</p>
                  </div>
                  <button type="button" className={`${styles.switch} ${formData.isActive ? styles.switchOn : ''}`} onClick={() => handleToggleChange('isActive')} aria-pressed={formData.isActive}>
                    <span className={styles.switchThumb} />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className={`${styles.formActionsSticky} shadow-lg transition-all duration-300`}>
          <Link to="/admin/services" className={`${styles.btnSecondary} inline-flex items-center justify-center transition duration-200`}>Hủy</Link>
          <button type="submit" className={`${styles.btnPrimary} inline-flex items-center justify-center transition duration-200 disabled:opacity-60`} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Tạo dịch vụ'}</button>
        </div>
      </form>
    </div>
  );
}
