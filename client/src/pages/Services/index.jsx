import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Services.module.css';
import serviceImg1 from '../../assets/images/service1.png';
import serviceImg2 from '../../assets/images/service2.png';
import serviceImg3 from '../../assets/images/service3.png';

const fallbackImages = [serviceImg1, serviceImg2, serviceImg3];

const collectServices = (category) => [
  ...(category.services || []),
  ...(category.children || []).flatMap((child) => child.services || []),
];

export default function Services() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchCatalog();
  }, []);

  return (
    <div className={styles.servicesWrapper}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>Dịch Vụ Của Chúng Tôi</h1>
          <p className={styles.heroSubtitle}>
            Khám phá các giải pháp làm đẹp toàn diện, kết hợp giữa kỹ thuật tinh xảo và dòng sản phẩm cao cấp nhất.
          </p>
        </div>
      </section>

      <section className={styles.servicesSection}>
        <div className={styles.container}>
          {loading ? (
            <div className={styles.stateBox}>Đang tải danh sách dịch vụ...</div>
          ) : error ? (
            <div className={styles.errorBox}>{error}</div>
          ) : categories.length === 0 ? (
            <div className={styles.stateBox}>Chưa có dịch vụ nào.</div>
          ) : (
            categories.map((category, categoryIndex) => {
              const services = collectServices(category);

              return (
                <div key={category.id} className={styles.categorySection}>
                  <div className={styles.categoryHeader}>
                    <h2>{category.name}</h2>
                    {category.description && <p>{category.description}</p>}
                  </div>

                  <div className={styles.servicesGrid}>
                    {services.map((service, serviceIndex) => (
                      <div key={service.id} className={styles.serviceCard}>
                        <div className={styles.serviceImg}>
                          <img
                            src={service.thumbnailUrl || service.imageUrl || fallbackImages[(categoryIndex + serviceIndex) % fallbackImages.length]}
                            alt={service.name}
                          />
                          {service.discountPercent > 0 && (
                            <div className={styles.discountBadge}>-{service.discountPercent}%</div>
                          )}
                          <div className={styles.priceTag}>
                            {service.salePriceLabel ? (
                              <>
                                <span className={styles.oldPrice}>{service.priceLabel}</span>
                                <span>{service.salePriceLabel}</span>
                              </>
                            ) : service.priceLabel}
                          </div>
                        </div>
                        <div className={styles.serviceInfo}>
                          <h3>{service.name}</h3>
                          <p>{service.shortDescription || service.description}</p>
                          {service.durationMinutes && (
                            <div className={styles.duration}>Thời lượng: {service.durationMinutes} phút</div>
                          )}
                          <div className={styles.cardActions}>
                            <Link to={`/services/${service.slug}`} className={styles.btnDetail}>
                              Xem Chi Tiết
                            </Link>
                            <Link to="/booking" className={styles.btnBook}>
                              Đặt Lịch
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2>Bạn Cần Tư Vấn Thêm?</h2>
            <p>Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng lắng nghe và đưa ra giải pháp phù hợp nhất cho làn da của bạn.</p>
            <Link to="/contact" className={styles.btnPrimary}>Liên Hệ Ngay</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
