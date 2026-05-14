import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from '../../icons.jsx';
import styles from './CategoryServices.module.css';

const collectServices = (category) => [
  ...(category.services || []),
  ...(category.children || []).flatMap((child) => child.services || []),
];

export default function CategoryServices() {
  const [categories, setCategories] = useState([]);
  const [openCategoryIds, setOpenCategoryIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const summary = useMemo(() => {
    const childrenCount = categories.reduce((total, category) => total + (category.children || []).length, 0);
    const servicesCount = categories.reduce((total, category) => total + collectServices(category).length, 0);

    return {
      parentCount: categories.length,
      childrenCount,
      servicesCount,
    };
  }, [categories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('http://localhost:5000/api/catalog/tree?active=all');
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải danh mục dịch vụ.');
        }

        setCategories(result.data || []);
        setOpenCategoryIds((result.data || []).map((category) => category.id));
      } catch (error) {
        setError(error.message || 'Không thể tải danh mục dịch vụ.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (categoryId) => {
    setOpenCategoryIds((current) => current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]);
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
      </div>

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
