import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('http://localhost:5000/api/catalog/tree');
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
    <div key={service.id} className={styles.serviceItem}>
      <div className={styles.serviceThumb}>
        {service.thumbnailUrl ? <img src={service.thumbnailUrl} alt={service.name} /> : <Sparkles size={28} />}
      </div>
      <div>
        <h5>{service.name}</h5>
        <p>{service.shortDescription || service.description || 'Chưa có mô tả.'}</p>
        <span>{service.salePriceLabel || service.priceLabel}</span>
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Danh mục dịch vụ</h2>
        <p>Quản lý hiển thị danh mục cha, danh mục con và dịch vụ thuộc từng danh mục.</p>
      </div>

      {loading ? (
        <div className={styles.stateBox}>Đang tải danh mục dịch vụ...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : categories.length === 0 ? (
        <div className={styles.stateBox}>Chưa có danh mục dịch vụ nào.</div>
      ) : (
        <div className={styles.categoryList}>
          {categories.map((category) => {
            const isOpen = openCategoryIds.includes(category.id);
            const totalServices = collectServices(category).length;

            return (
              <div key={category.id} className={styles.categoryCard}>
                <button className={styles.categoryHeader} onClick={() => toggleCategory(category.id)}>
                  <div>
                    <h3>{category.name}</h3>
                    <p>{category.description || 'Chưa có mô tả danh mục.'}</p>
                  </div>
                  <span>{totalServices} dịch vụ • {isOpen ? 'Thu gọn' : 'Mở rộng'}</span>
                </button>

                {isOpen && (
                  <div className={styles.categoryBody}>
                    {(category.services || []).length > 0 && (
                      <div className={styles.serviceList}>{category.services.map(renderService)}</div>
                    )}

                    {(category.children || []).map((child) => (
                      <div key={child.id} className={styles.childCategory}>
                        <div className={styles.childHeader}>
                          <h4>{child.name}</h4>
                          <span>{(child.services || []).length} dịch vụ</span>
                        </div>
                        {child.description && <p>{child.description}</p>}
                        {(child.services || []).length > 0 ? (
                          <div className={styles.serviceList}>{child.services.map(renderService)}</div>
                        ) : (
                          <div className={styles.stateBox}>Chưa có dịch vụ trong danh mục này.</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
