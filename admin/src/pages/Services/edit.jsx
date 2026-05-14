import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { CheckCircle, Plus, X } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext';
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

const flattenCategories = (categories) => categories.flatMap((category) => [
  { id: category.id, label: category.name },
  ...(category.children || []).map((child) => ({ id: child.id, label: `${category.name} > ${child.name}` })),
]);

const collectServices = (categories) => categories.flatMap((category) => [
  ...(category.services || []),
  ...((category.children || []).flatMap((child) => child.services || [])),
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

const validateForm = (formData, images) => {
  if (!formData.categoryId) return 'Vui lòng chọn danh mục dịch vụ.';
  if (!formData.name.trim()) return 'Tên dịch vụ là bắt buộc.';
  if (formData.name.trim().length < 2) return 'Tên dịch vụ phải có ít nhất 2 ký tự.';
  if (!formData.slug.trim()) return 'Slug là bắt buộc.';
  if (!/^[a-z0-9-]+$/.test(formData.slug.trim())) return 'Slug chỉ được gồm chữ thường, số và dấu gạch ngang.';
  if (formData.shortDescription.trim().length > 255) return 'Mô tả ngắn không được vượt quá 255 ký tự.';
  if (formData.price && Number(formData.price) < 0) return 'Giá dịch vụ không hợp lệ.';
  if (formData.durationMinutes && Number(formData.durationMinutes) < 1) return 'Thời lượng phải lớn hơn 0.';
  if (Number(formData.discountPercent) < 0 || Number(formData.discountPercent) > 100) return 'Phần trăm giảm giá phải từ 0 đến 100.';
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
  price: formData.price,
  priceLabel: formData.priceLabel.trim(),
  durationMinutes: formData.durationMinutes,
  imageUrl: images[0] || '',
  images,
  discountPercent: Number(formData.discountPercent || 0),
  isFeatured: Boolean(formData.isFeatured),
  isActive: Boolean(formData.isActive),
  sortOrder: Number(formData.sortOrder || 0),
});

export default function EditService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id;
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
        const response = await fetch('http://localhost:5000/api/catalog/tree?active=all');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải dữ liệu dịch vụ.');
        }

        const catalog = result.data || [];
        setCategories(catalog);

        const allServices = collectServices(catalog);
        const matchedService = allServices.find((service) => String(service.id) === String(editingId));

        if (!matchedService) {
          throw new Error('Không tìm thấy dịch vụ cần chỉnh sửa.');
        }

        const initialImages = [...new Set([matchedService.imageUrl, ...(matchedService.images || [])].filter(Boolean))];
        setFormData({
          categoryId: matchedService.categoryId || '',
          name: matchedService.name || '',
          slug: matchedService.slug || '',
          shortDescription: matchedService.shortDescription || '',
          description: matchedService.description || '',
          price: matchedService.price || '',
          priceLabel: matchedService.priceLabel || '',
          durationMinutes: matchedService.durationMinutes || '',
          discountPercent: matchedService.discountPercent || 0,
          isFeatured: Boolean(matchedService.isFeatured),
          isActive: Boolean(matchedService.isActive),
          sortOrder: matchedService.sortOrder || 0,
        });
        setImages(initialImages);
      } catch (error) {
        setError(error.message || 'Không thể tải dữ liệu dịch vụ.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [editingId]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => {
      const nextForm = { ...current, [name]: value };
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
      const response = await authFetch(`http://localhost:5000/api/catalog/services/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(buildPayload(formData, images)),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể lưu dịch vụ.');
      }

      alert('Cập nhật dịch vụ thành công.');
      navigate('/services');
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
          <Link to="/services" className={styles.backLink}>← Quay lại danh sách dịch vụ</Link>
          <h2 className={styles.pageTitle}>Cập nhật dịch vụ</h2>
          <p className={styles.pageDescription}>Nhập đầy đủ thông tin, hình ảnh và trạng thái để dịch vụ hiển thị rõ ràng trên website khách hàng.</p>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form className={styles.serviceStandaloneForm} onSubmit={handleSubmit}>
        <div className={`${styles.formLayout} gap-6`}>
          <div className={`${styles.formMainColumn} transition-all duration-300`}>
            <div className={styles.formSection}>
              <div className={styles.sectionTitleRow}>
                <div>
                  <h3>Thông tin dịch vụ</h3>
                  <p>Thông tin chính dùng cho danh sách và trang chi tiết dịch vụ.</p>
                </div>
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

              <label>Mô tả ngắn</label>
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
                <div>
                  <h3>Giá bán</h3>
                  <p>Nhập giá gốc và phần trăm giảm giá nếu dịch vụ đang có ưu đãi.</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div>
                  <label>Giá số</label>
                  <input type="number" name="price" value={formData.price} onChange={handleFormChange} min="0" placeholder="500000" />
                </div>
                <div>
                  <label>Label giá</label>
                  <input name="priceLabel" value={formData.priceLabel} onChange={handleFormChange} placeholder="Từ 500.000đ" />
                </div>
                <div>
                  <label>Giảm giá (%)</label>
                  <input type="number" name="discountPercent" value={formData.discountPercent} onChange={handleFormChange} min="0" max="100" />
                </div>
                <div>
                  <label>Thời lượng phút</label>
                  <input type="number" name="durationMinutes" value={formData.durationMinutes} onChange={handleFormChange} min="1" placeholder="60" />
                </div>
              </div>
            </div>
          </div>

          <aside className={`${styles.formSideColumn} transition-all duration-300`}>
            <div className={styles.formSection}>
              <div className={styles.sectionTitleRow}>
                <div>
                  <h3>Ảnh dịch vụ</h3>
                  <p>Ảnh đầu tiên sẽ là ảnh đại diện.</p>
                </div>
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
                <div>
                  <h3>Phân loại & hiển thị</h3>
                  <p>Cài đặt nơi dịch vụ xuất hiện trên website.</p>
                </div>
              </div>

              <label>Danh mục dịch vụ</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleFormChange} required>
                <option value="">Chọn danh mục</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>

              <label>Thứ tự hiển thị</label>
              <input type="number" name="sortOrder" value={formData.sortOrder} onChange={handleFormChange} min="0" />

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
          <Link to="/services" className={`${styles.btnSecondary} inline-flex items-center justify-center transition duration-200`}>Hủy</Link>
          <button type="submit" className={`${styles.btnPrimary} inline-flex items-center justify-center transition duration-200 disabled:opacity-60`} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Cập nhật dịch vụ'}</button>
        </div>
      </form>
    </div>
  );
}
