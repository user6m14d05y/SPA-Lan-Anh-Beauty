import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, X } from '../../icons.jsx';
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

const collectServices = (categories) => categories.flatMap((category) => [
  ...(category.services || []),
  ...((category.children || []).flatMap((child) => child.services || [])),
]);

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Không thể đọc ảnh tải lên.'));
  reader.readAsDataURL(file);
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

export default function AddService() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('id');
  const { authFetch } = useAuth();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categoryOptions = useMemo(() => flattenCategories(categories), [categories]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('http://localhost:5000/api/catalog/tree');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải dữ liệu dịch vụ.');
        }

        const catalog = result.data || [];
        setCategories(catalog);

        if (editingId) {
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
        }
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
      if (name === 'name' && !editingId) {
        nextForm.slug = slugify(value);
      }
      return nextForm;
    });
  };

  const handleToggleChange = (name) => {
    setFormData((current) => ({ ...current, [name]: !current[name] }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGE_COUNT) {
      setError(`Tối đa ${MAX_IMAGE_COUNT} hình ảnh cho mỗi dịch vụ.`);
      event.target.value = '';
      return;
    }

    const validationError = files.map(validateImageFile).find(Boolean);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    try {
      const uploadedImages = await Promise.all(files.map(fileToDataUrl));
      setImages((current) => [...current, ...uploadedImages]);
      setError('');
    } catch (error) {
      setError(error.message || 'Không thể đọc ảnh tải lên.');
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
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const url = editingId
        ? `http://localhost:5000/api/catalog/services/${editingId}`
        : 'http://localhost:5000/api/catalog/services';
      const response = await authFetch(url, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(buildPayload(formData, images)),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể lưu dịch vụ.');
      }

      navigate('/services');
    } catch (error) {
      setError(error.message || 'Không thể lưu dịch vụ.');
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
          <h2 className={styles.pageTitle}>{editingId ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h2>
          <p className={styles.pageDescription}>Biểu mẫu tách riêng giúp nhập dữ liệu rõ ràng hơn, gần với luồng quản trị thực tế.</p>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form className={styles.serviceStandaloneForm} onSubmit={handleSubmit}>
        <div className={styles.formSection}>
          <h3>Thông tin cơ bản</h3>
          <div className={styles.formGrid}>
            <div>
              <label>Danh mục dịch vụ</label>
              <select name="categoryId" value={formData.categoryId} onChange={handleFormChange} required>
                <option value="">Chọn danh mục</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Tên dịch vụ</label>
              <input name="name" value={formData.name} onChange={handleFormChange} required />
            </div>
            <div>
              <label>Slug</label>
              <input name="slug" value={formData.slug} onChange={handleFormChange} required />
            </div>
            <div>
              <label>Thứ tự hiển thị</label>
              <input type="number" name="sortOrder" value={formData.sortOrder} onChange={handleFormChange} min="0" />
            </div>
          </div>

          <label>Mô tả ngắn</label>
          <textarea name="shortDescription" value={formData.shortDescription} onChange={handleFormChange} maxLength={255} />

          <label>Mô tả chi tiết</label>
          <textarea name="description" value={formData.description} onChange={handleFormChange} className={styles.textareaLarge} />
        </div>

        <div className={styles.formSection}>
          <h3>Giá bán và trạng thái</h3>
          <div className={styles.formGrid}>
            <div>
              <label>Giá số</label>
              <input type="number" name="price" value={formData.price} onChange={handleFormChange} min="0" />
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
              <input type="number" name="durationMinutes" value={formData.durationMinutes} onChange={handleFormChange} min="1" />
            </div>
          </div>

          <div className={styles.toggleGroup}>
            <div className={styles.toggleCard}>
              <div>
                <strong>Nổi bật</strong>
                <p>Hiển thị dịch vụ ở các khu vực ưu tiên trên giao diện khách hàng.</p>
              </div>
              <button type="button" className={`${styles.switch} ${formData.isFeatured ? styles.switchOn : ''}`} onClick={() => handleToggleChange('isFeatured')} aria-pressed={formData.isFeatured}>
                <span className={styles.switchThumb} />
              </button>
            </div>

            <div className={styles.toggleCard}>
              <div>
                <strong>Đang hoạt động</strong>
                <p>Cho phép dịch vụ xuất hiện trên website và trong danh sách đặt lịch.</p>
              </div>
              <button type="button" className={`${styles.switch} ${formData.isActive ? styles.switchOn : ''}`} onClick={() => handleToggleChange('isActive')} aria-pressed={formData.isActive}>
                <span className={styles.switchThumb} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.imageSectionHeader}>
            <div>
              <h3>Hình ảnh dịch vụ</h3>
              <p className={styles.sectionHint}>Chỉ dùng ảnh tải lên từ máy. Ảnh đầu tiên sẽ là ảnh đại diện.</p>
            </div>
            <label className={styles.uploadButton}>
              <Plus size={16} /> Tải hình ảnh
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageUpload} hidden />
            </label>
          </div>

          <div className={styles.uploadHint}>Hỗ trợ JPG, PNG, WEBP • tối đa 2MB/ảnh • tối đa 8 ảnh.</div>

          {images.length > 0 ? (
            <div className={styles.previewGrid}>
              {images.map((image, index) => (
                <div key={`${index}-${image.slice(0, 20)}`} className={styles.previewCard}>
                  <img src={image} alt={`Ảnh ${index + 1}`} />
                  <div className={styles.previewMeta}>
                    <span>{index === 0 ? 'Ảnh đại diện' : `Ảnh ${index + 1}`}</span>
                    <small>{index === 0 ? 'Hiển thị chính' : 'Ảnh bổ sung'}</small>
                  </div>
                  <div className={styles.previewActions}>
                    <button type="button" className={styles.previewBtn} onClick={() => handleSetCover(image)} disabled={index === 0}>Đặt ảnh chính</button>
                    <button type="button" className={`${styles.previewBtn} ${styles.previewBtnDanger}`} onClick={() => handleRemoveImage(image)}>
                      <X size={14} /> Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.previewEmpty}>Chưa có hình ảnh nào được tải lên.</div>
          )}
        </div>

        <div className={styles.formActionsSticky}>
          <Link to="/services" className={styles.btnSecondary}>Hủy</Link>
          <button type="submit" className={styles.btnPrimary} disabled={submitting}>{submitting ? 'Đang lưu...' : editingId ? 'Cập nhật dịch vụ' : 'Tạo dịch vụ'}</button>
        </div>
      </form>
    </div>
  );
}
