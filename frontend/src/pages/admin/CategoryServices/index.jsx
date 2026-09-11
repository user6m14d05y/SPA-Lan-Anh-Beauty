import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { Sparkles, X } from '../../../icons.jsx';
import { API_URL } from '../../../config.js';
import styles from './CategoryServices.module.css';

const collectServices = (category) => [
  ...(category.services || []),
  ...(category.children || []).flatMap((child) => child.services || []),
];

const initialFormData = {
  name: '',
  parentId: '',
  description: '',
  sortOrder: '0',
};

export default function CategoryServices() {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [openCategoryIds, setOpenCategoryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const summary = useMemo(() => {
    const childrenCount = categories.reduce((total, category) => total + (category.children || []).length, 0);
    const servicesCount = categories.reduce((total, category) => total + collectServices(category).length, 0);

    return {
      parentCount: categories.length,
      childrenCount,
      servicesCount,
    };
  }, [categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_URL}/catalog/tree?active=all`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh mục dịch vụ.');
      }

      setCategories(result.data || []);
    } catch (error) {
      setError(error.message || 'Không thể tải danh mục dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = (categoryId) => {
    setOpenCategoryIds((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]);
  };

  const openCreateModal = () => {
    setFormData(initialFormData);
    setShowForm(true);
    setFormError('');
    setSuccessMessage('');
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setShowForm(false);
    setFormData(initialFormData);
    setFormError('');
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFormError('');
    setSuccessMessage('');
  };

  const handleSubmitCategory = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError('');
      setSuccessMessage('');

      const payload = {
        name: formData.name,
        parentId: formData.parentId || null,
        description: formData.description,
        sortOrder: formData.sortOrder,
        isActive: true,
      };
      const response = await authFetch(`${API_URL}/catalog/categories`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tạo danh mục dịch vụ.');
      }

      setFormData(initialFormData);
      setShowForm(false);
      setSuccessMessage('Đã thêm danh mục dịch vụ.');
      await fetchCategories();
    } catch (error) {
      setFormError(error.message || 'Không thể tạo danh mục dịch vụ.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderService = (service) => (
    <div key={service.id} className={`${styles.serviceItem} ${!service.isActive ? styles.serviceItemHidden : ''}`}>
      <div className={styles.serviceThumb}>
        {service.thumbnailUrl ? <img src={service.thumbnailUrl} alt={service.name} /> : <Sparkles size={28} />}
      </div>
      <div className={styles.serviceContent}>
        <div className={styles.serviceNameRow}>
          <h5>{service.name}</h5>
          <span className={`${styles.statusBadge} ${service.isActive ? styles.statusSuccess : styles.statusWarning}`}>
            {service.isActive ? 'Hiển thị' : 'Đã ẩn'}
          </span>
        </div>
        <p>{service.shortDescription || service.description || 'Chưa có mô tả.'}</p>
        <strong>{service.salePriceLabel || service.priceLabel || 'Chưa nhập giá'}</strong>
      </div>
    </div>
  );

  const renderServiceGroup = (services) => (
    services.length > 0 ? (
      <div className={styles.serviceList}>{services.map(renderService)}</div>
    ) : (
      <div className={styles.emptyInline}>Chưa có dịch vụ trong danh mục này.</div>
    )
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Danh mục dịch vụ</h2>
          <p>Theo dõi cấu trúc danh mục cha, danh mục con và dịch vụ đang thuộc từng nhóm.</p>
        </div>
        <button type="button" className={styles.btnPrimary} onClick={openCreateModal}>
          + Thêm danh mục
        </button>
      </div>

      {successMessage && <div className={styles.successBox}>{successMessage}</div>}

      {showForm && (
        <div className={styles.modalOverlay} onClick={closeCreateModal}>
          <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Tạo danh mục mới</h3>
              <button type="button" className={styles.closeBtn} onClick={closeCreateModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitCategory}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.formError}>{formError}</div>}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Tên danh mục</label>
                    <input className={styles.formInput} name="name" value={formData.name} onChange={handleFormChange} placeholder="Nhập tên danh mục" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Danh mục cha</label>
                    <select className={styles.formInput} name="parentId" value={formData.parentId} onChange={handleFormChange}>
                      <option value="">Danh mục cha</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label>Thứ tự</label>
                    <input className={styles.formInput} name="sortOrder" type="text" min="0" value={formData.sortOrder} onChange={handleFormChange} />
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label>Mô tả</label>
                    <textarea className={styles.formInput} name="description" value={formData.description} onChange={handleFormChange} placeholder="Nhập mô tả danh mục" rows="3" />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeCreateModal}>Hủy</button>
                <button type="submit" className={styles.btnPrimary} disabled={submitting}>{submitting ? 'Đang lưu...' : 'Lưu danh mục'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.stateBox}>Đang tải danh mục dịch vụ...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : categories.length === 0 ? (
        <div className={styles.stateBox}>Chưa có danh mục dịch vụ nào.</div>
      ) : (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span>Danh mục cha</span>
              <strong>{summary.parentCount}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Danh mục con</span>
              <strong>{summary.childrenCount}</strong>
            </div>
            <div className={styles.summaryCard}>
              <span>Dịch vụ</span>
              <strong>{summary.servicesCount}</strong>
            </div>
          </div>

          <div className={styles.categoryList}>
            {categories.map((category) => {
              const isOpen = openCategoryIds.includes(category.id);
              const totalServices = collectServices(category).length;
              const childrenCount = (category.children || []).length;

              return (
                <div key={category.id} className={styles.categoryCard}>
                  <button className={styles.categoryHeader} onClick={() => toggleCategory(category.id)}>
                    <div className={styles.categoryHeaderMain}>
                      <span className={styles.categoryIcon}>{isOpen ? '−' : '+'}</span>
                      <div>
                        <h3>{category.name}</h3>
                        <p>{category.description || 'Chưa có mô tả danh mục.'}</p>
                      </div>
                    </div>
                    <div className={styles.categoryStats}>
                      <span>{childrenCount} danh mục con</span>
                      <span>{totalServices} dịch vụ</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className={styles.categoryBody}>
                      {(category.services || []).length > 0 && (
                        <div className={styles.directServiceBlock}>
                          <div className={styles.blockTitle}>Dịch vụ trực thuộc danh mục cha</div>
                          {renderServiceGroup(category.services || [])}
                        </div>
                      )}

                      {(category.children || []).length > 0 ? (
                        <div className={styles.childGrid}>
                          {(category.children || []).map((child) => (
                            <div key={child.id} className={styles.childCategory}>
                              <div className={styles.childHeader}>
                                <div>
                                  <h4>{child.name}</h4>
                                  {child.description && <p>{child.description}</p>}
                                </div>
                                <span>{(child.services || []).length} dịch vụ</span>
                              </div>
                              {renderServiceGroup(child.services || [])}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className={styles.emptyInline}>Danh mục này chưa có danh mục con.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
