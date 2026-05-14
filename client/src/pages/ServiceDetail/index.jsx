import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import styles from './ServiceDetail.module.css';
import fallbackImage from '../../assets/images/service1.png';

const feedbackItems = [
  {
    name: 'Minh Anh',
    content: 'Nhân viên tư vấn kỹ, quy trình nhẹ nhàng và kết quả nhìn tự nhiên hơn mong đợi.',
  },
  {
    name: 'Hoàng Lan',
    content: 'Không gian sạch, lịch hẹn đúng giờ, sau khi làm được hướng dẫn chăm sóc rất chi tiết.',
  },
];

export default function ServiceDetail() {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [services, setServices] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        setError('');
        const [detailResponse, servicesResponse] = await Promise.all([
          fetch(`http://localhost:5000/api/catalog/services/${slug}`),
          fetch('http://localhost:5000/api/catalog/services'),
        ]);
        const detailResult = await detailResponse.json();
        const servicesResult = await servicesResponse.json();

        if (!detailResponse.ok || !detailResult.success) {
          throw new Error(detailResult.message || 'Không thể tải chi tiết dịch vụ.');
        }

        setService(detailResult.data);
        setServices(servicesResponse.ok && servicesResult.success ? servicesResult.data || [] : []);
        setActiveImage(detailResult.data.thumbnailUrl || detailResult.data.imageUrl || fallbackImage);
        setIsDescriptionExpanded(false);
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

  const sanitizedDescription = useMemo(() => (
    service?.description ? DOMPurify.sanitize(service.description) : ''
  ), [service]);

  const relatedServices = useMemo(() => {
    if (!service) return [];
    return services
      .filter((item) => item.slug !== service.slug)
      .filter((item) => item.categoryId === service.categoryId || item.category?.id === service.category?.id)
      .slice(0, 3);
  }, [service, services]);

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
          <Link to="/services" className={styles.backLink}>← Quay lại dịch vụ</Link>
          <span className={styles.category}>{service.category?.name || 'Dịch vụ spa'}</span>
          <h1>{service.name}</h1>
          <p>{service.shortDescription || 'Thông tin chi tiết về dịch vụ, quy trình và ưu đãi tại Lan Anh Beauty.'}</p>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.detailGrid}>
            <div className={styles.galleryColumn}>
              <div className={styles.gallery}>
                <div className={styles.galleryFrame}>
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
                  <div className={styles.mainImage}>
                    <img src={activeImage || galleryImages[0]} alt={service.name} />
                    {service.discountPercent > 0 && <span>-{service.discountPercent}%</span>}
                  </div>
                </div>
              </div>

              {sanitizedDescription && (
                <div className={styles.descriptionCard}>
                  <div className={styles.sectionHeaderRow}>
                    <div>
                      <span>Chi tiết dịch vụ</span>
                      <h2>Mô tả chi tiết</h2>
                    </div>
                    <button type="button" onClick={() => setIsDescriptionExpanded((current) => !current)}>
                      {isDescriptionExpanded ? 'Thu gọn' : 'Xem đầy đủ'}
                    </button>
                  </div>
                  <div
                    className={`${styles.descriptionContent} ${isDescriptionExpanded ? styles.descriptionExpanded : ''}`}
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                </div>
              )}
            </div>

            <aside className={styles.infoColumn}>
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

                <div className={styles.actions}>
                  <Link to="/booking" className={styles.btnPrimary}>Đặt lịch ngay</Link>
                  <Link to="/contact" className={styles.btnSecondary}>Tư vấn thêm</Link>
                </div>
              </div>

              <div className={styles.feedbackCard}>
                <div className={styles.sectionHeaderCompact}>
                  <span>Feedback</span>
                  <h3>Khách hàng nói gì?</h3>
                </div>
                {feedbackItems.map((feedback) => (
                  <div key={feedback.name} className={styles.feedbackItem}>
                    <div className={styles.feedbackStars} aria-label="Đánh giá 5 sao">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                    <strong>{feedback.name}</strong>
                    <p>{feedback.content}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {relatedServices.length > 0 && (
            <section className={styles.relatedSection}>
              <div className={styles.sectionHeaderCompact}>
                <span>Dịch vụ liên quan</span>
                <h2>Có thể bạn cũng quan tâm</h2>
              </div>
              <div className={styles.relatedGrid}>
                {relatedServices.map((item) => (
                  <Link key={item.id} to={`/services/${item.slug}`} className={styles.relatedCard}>
                    <img src={item.thumbnailUrl || item.imageUrl || fallbackImage} alt={item.name} />
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.shortDescription || item.description || 'Xem thêm thông tin dịch vụ.'}</p>
                      <strong>{item.salePriceLabel || item.priceLabel}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
