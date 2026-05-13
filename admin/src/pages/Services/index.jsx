import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Sparkles, Trash2 } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Services.module.css';

const collectServices = (category) => [
  ...(category.services || []).map((service) => ({ ...service, categoryName: category.name })),
  ...(category.children || []).flatMap((child) => (
    child.services || []
  ).map((service) => ({ ...service, categoryName: `${category.name} > ${child.name}` }))),
];

const normalizeCatalogResponse = (data) => data.flatMap(collectServices);
const formatCategoryText = (service) => service.category?.name || service.categoryName || 'Danh mục hiện tại';
const toggleServiceUrl = (id) => `http://localhost:5000/api/catalog/services/${id}/toggle-active`;

export default function Services() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const services = useMemo(() => normalizeCatalogResponse(categories), [categories]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5000/api/catalog/tree');
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể tải danh sách dịch vụ.');
      }

      setCategories(result.data || []);
    } catch (error) {
      setError(error.message || 'Không thể tải danh sách dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleToggleActive = async (service) => {
    try {
      setActionError('');
      const response = await authFetch(toggleServiceUrl(service.id), {
        method: 'PATCH',
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Không thể cập nhật trạng thái dịch vụ.');
      }

      await fetchCatalog();
    } catch (error) {
      setActionError(error.message || 'Không thể cập nhật trạng thái dịch vụ.');
    }
  };

  const renderServiceCard = (service) => (
    <div key={service.id} className={styles.serviceCard}>
      <div className={styles.serviceImg}>
        {service.thumbnailUrl ? <img src={service.thumbnailUrl} alt={service.name} /> : <Sparkles size={42} />}
        {service.discountPercent > 0 && <span className={styles.discountBadge}>-{service.discountPercent}%</span>}
      </div>
      <div className={styles.serviceInfo}>
        <h3>{service.name}</h3>
        <p className={styles.serviceCategory}>{formatCategoryText(service)}</p>
        <div className={styles.serviceMeta}>
          <span>
            Giá:{' '}
            {service.salePriceLabel ? (
              <>
                <span className={styles.oldPrice}>{service.priceLabel}</span>
                <span className={styles.servicePrice}>{service.salePriceLabel}</span>
              </>
            ) : (
              <span className={styles.servicePrice}>{service.priceLabel}</span>
            )}
          </span>
          <span>Thời gian: {service.durationMinutes || '--'} phút</span>
        </div>
        <div className={styles.serviceFooter}>
          <span className={`${styles.statusBadge} ${service.isActive ? styles.statusSuccess : styles.statusWarning}`}>
            {service.isActive ? 'Đang hoạt động' : 'Tạm ẩn'}
          </span>
          <div>
            <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => navigate(`/services/add?id=${service.id}`)}>
              <Edit size={16} /> Sửa
            </button>
            <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleToggleActive(service)}>
              <Trash2 size={16} /> {service.isActive ? 'Ẩn' : 'Hiện'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Dịch vụ</h2>
        <button className={styles.btnPrimary} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/services/add')}>
          <Plus size={18} /> Thêm dịch vụ
        </button>
      </div>

      {actionError && <div className={styles.errorBox}>{actionError}</div>}

      {loading ? (
        <div className={styles.stateBox}>Đang tải danh sách dịch vụ...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : services.length === 0 ? (
        <div className={styles.stateBox}>Chưa có dịch vụ nào.</div>
      ) : (
        <div className={styles.listSection}>
          <div className={styles.listHeader}>
            <h3>Danh sách dịch vụ</h3>
            <span>{services.length} dịch vụ</span>
          </div>
          <div className={styles.serviceGrid}>{services.map(renderServiceCard)}</div>
        </div>
      )}
    </div>
  );
}
