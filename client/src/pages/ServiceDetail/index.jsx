import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './ServiceDetail.module.css';
import fallbackImage from '../../assets/images/service1.png';

export default function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`http://localhost:5000/api/catalog/services/${slug}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải chi tiết dịch vụ.');
        }

        setService(result.data);
        setActiveImage(result.data.thumbnailUrl || result.data.imageUrl || fallbackImage);
      } catch (error) {
        setError(error.message || 'Không thể tải chi tiết dịch vụ.');
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [slug]);

  const galleryImages = useMemo(() => {
    if (!service) return [fallbackImage];
    const images = [...(service.images || []), service.imageUrl].filter(Boolean);
    return images.length > 0 ? [...new Set(images)] : [fallbackImage];
  }, [service]);

  if (loading) {
    return <div className={styles.stateBox}>Đang tải chi tiết dịch vụ...</div>;
  }

  if (error) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.stateBox}>{error}</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.stateBox}>Không tìm thấy dịch vụ.</div>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <Link to="/services" className={styles.backLink}>← Quay lại dịch vụ </Link>
          <span className={styles.category}> {service.category?.name || 'Dịch vụ spa'}</span>
          <h1>{service.name}</h1>
          <p>{service.shortDescription || service.description}</p>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.detailGrid}>
            <div className={styles.gallery}>
              <div className={styles.mainImage}>
                <img src={activeImage || galleryImages[0]} alt={service.name} />
                {service.discountPercent > 0 && <span>-{service.discountPercent}%</span>}
              </div>
              <div className={styles.thumbnails}>
                {galleryImages.map((image) => (
                  <button
                    key={image}
                    type="button"
                    className={image === activeImage ? styles.thumbnailActive : ''}
                    onClick={() => setActiveImage(image)}
                  >
                    <img src={image} alt={service.name} />
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.infoPanel}>
              <h2>Thông tin dịch vụ</h2>
              <div className={styles.priceBox}>
                {service.salePriceLabel ? (
                  <>
                    <span className={styles.oldPrice}>{service.priceLabel}</span>
                    <strong>{service.salePriceLabel}</strong>
                    <small>Ưu đãi giảm {service.discountPercent}%</small>
                  </>
                ) : (
                  <strong>{service.priceLabel}</strong>
                )}
              </div>

              <div className={styles.metaList}>
                <div>
                  <span>Thời lượng</span>
                  <strong>{service.durationMinutes ? `${service.durationMinutes} phút` : 'Tư vấn trực tiếp'}</strong>
                </div>
                <div>
                  <span>Danh mục</span>
                  <strong>{service.category?.name || 'Dịch vụ spa'}</strong>
                </div>
              </div>

              {service.description && (
                <div className={styles.description}>
                  <h3>Mô tả chi tiết</h3>
                  <p>{service.description}</p>
                </div>
              )}

              <div className={styles.actions}>
                <Link to="/booking" className={styles.btnPrimary}>Đặt lịch ngay</Link>
                <Link to="/contact" className={styles.btnSecondary}>Tư vấn thêm</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
