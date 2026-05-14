import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Sparkles } from '../../icons.jsx';
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

const statusFilters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang hiển thị' },
  { key: 'hidden', label: 'Đã ẩn' },
];

export default function Services() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const services = useMemo(() => normalizeCatalogResponse(categories), [categories]);
  const activeServices = useMemo(() => services.filter((service) => service.isActive), [services]);
  const hiddenServices = useMemo(() => services.filter((service) => !service.isActive), [services]);
  const filteredServices = useMemo(() => {
    if (statusFilter === 'active') return activeServices;
    if (statusFilter === 'hidden') return hiddenServices;
    return services;
  }, [activeServices, hiddenServices, services, statusFilter]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:5000/api/catalog/tree?active=all');
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
    const confirmMessage = service.isActive
      ? 'Bạn muốn ẩn dịch vụ này khỏi website khách hàng? Dịch vụ vẫn nằm trong tab Đã ẩn để khôi phục lại.'
      : 'Bạn muốn khôi phục dịch vụ này để hiển thị lại trên website khách hàng?';

    if (!window.confirm(confirmMessage)) return;

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
      alert(result.message || (service.isActive ? 'Đã ẩn dịch vụ.' : 'Đã khôi phục dịch vụ.'));
    } catch (error) {
      const message = error.message || 'Không thể cập nhật trạng thái dịch vụ.';
      setActionError(message);
      alert(message);
    }
  };

  const getFilterCount = (key) => {
    if (key === 'active') return activeServices.length;
    if (key === 'hidden') return hiddenServices.length;
    return services.length;
  };

  const renderServiceCard = (service) => (
    <div key={service.id} className={`${styles.serviceCard} ${!service.isActive ? styles.serviceCardHidden : ''}`}>
      <div className={styles.serviceImg}>
        {service.thumbnailUrl ? <img src={service.thumbnailUrl} alt={service.name} /> : <Sparkles size={42} />}
        {service.discountPercent > 0 && <span className={styles.discountBadge}>-{service.discountPercent}%</span>}
        {!service.isActive && <span className={styles.hiddenOverlay}>Đã ẩn</span>}
      </div>
      <div className={styles.serviceInfo}>
        <div className={styles.serviceTitleRow}>
          <h3>{service.name}</h3>
          <span className={`${styles.statusBadge} ${service.isActive ? styles.statusSuccess : styles.statusWarning}`}>
            {service.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
          </span>
        </div>
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
          <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => navigate(`/services/edit/${service.id}`)}>
            <Edit size={16} /> Sửa
          </button>
          <button
            className={`${styles.actionBtn} ${service.isActive ? styles.actionHide : styles.actionRestore}`}
            onClick={() => handleToggleActive(service)}
          >
            {service.isActive ? 'Ẩn dịch vụ' : 'Khôi phục'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Dịch vụ</h2>
          <p className={styles.pageDescription}>Quản lý dịch vụ hiển thị trên website, bao gồm ảnh, giá, giảm giá và trạng thái hiển thị.</p>
        </div>
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
            <div>
              <h3>Danh sách dịch vụ</h3>
              <span>{services.length} dịch vụ • {hiddenServices.length} đã ẩn có thể khôi phục</span>
            </div>
            <div className={styles.statusTabs}>
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  className={`${styles.statusTab} ${statusFilter === filter.key ? styles.statusTabActive : ''}`}
                  onClick={() => setStatusFilter(filter.key)}
                >
                  {filter.label} <span>{getFilterCount(filter.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredServices.length === 0 ? (
            <div className={styles.stateBox}>Không có dịch vụ nào trong trạng thái này.</div>
          ) : (
            <div className={styles.serviceGrid}>{filteredServices.map(renderServiceCard)}</div>
          )}
        </div>
      )}
    </div>
  );
}
