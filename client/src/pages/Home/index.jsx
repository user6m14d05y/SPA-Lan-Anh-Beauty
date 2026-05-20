import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import serviceImg1 from '../../assets/images/service1.png';
import serviceImg2 from '../../assets/images/service2.png';
import serviceImg3 from '../../assets/images/service3.png';

const API_URL = 'http://localhost:5000/api';
const fallbackImages = [serviceImg1, serviceImg2, serviceImg3];

const feedbackItems = [
  {
    name: 'Minh Anh',
    service: 'Chăm sóc da chuyên sâu',
    content: 'Không gian rất thư giãn, nhân viên tư vấn kỹ và da mình cải thiện rõ sau liệu trình.',
  },
  {
    name: 'Thanh Huyền',
    service: 'Phun môi collagen',
    content: 'Màu môi lên tự nhiên, quy trình nhẹ nhàng và được dặn dò chăm sóc rất cẩn thận.',
  },
  {
    name: 'Ngọc Trâm',
    service: 'Gội đầu dưỡng sinh',
    content: 'Mình thích nhất phần massage cổ vai gáy, cảm giác rất dễ chịu sau một ngày làm việc.',
  },
];

const articleItems = [
  {
    tag: 'Chăm sóc da',
    title: 'Cách giữ da căng mịn sau liệu trình spa',
    excerpt: 'Những thói quen nhỏ giúp duy trì hiệu quả chăm sóc da tại nhà sau khi kết thúc liệu trình.',
  },
  {
    tag: 'Phun thêu',
    title: 'Lưu ý trước và sau khi phun môi collagen',
    excerpt: 'Chuẩn bị đúng cách giúp màu môi lên đều, tự nhiên và hạn chế các vấn đề sau liệu trình.',
  },
  {
    tag: 'Thư giãn',
    title: 'Khi nào nên chọn massage cổ vai gáy?',
    excerpt: 'Nếu bạn thường xuyên mỏi cổ, đau vai hoặc căng thẳng, massage trị liệu có thể là lựa chọn phù hợp.',
  },
];

const statItems = [
  { value: 10, suffix: '+', label: 'Năm Kinh Nghiệm' },
  { value: 15, suffix: 'k+', label: 'Khách Hàng Hài Lòng' },
  { value: 20, suffix: '+', label: 'Chuyên Gia Tận Tâm' },
  { value: 100, suffix: '%', label: 'Cam Kết Chất Lượng' },
];

export default function Home() {
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const fetchFeaturedServices = async () => {
      try {
        setLoadingFeatured(true);
        setFeaturedError('');
        const response = await fetch(`${API_URL}/catalog/services?featured=true`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Không thể tải dịch vụ nổi bật.');
        }

        setFeaturedServices(result.data || []);
      } catch (error) {
        setFeaturedError(error.message || 'Không thể tải dịch vụ nổi bật.');
      } finally {
        setLoadingFeatured(false);
      }
    };

    fetchFeaturedServices();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.homeWrapper}>
      <section className={styles.hero} id="home">
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Nét Đẹp Tự Nhiên,<br />Hoàn Mỹ Từng Chi Tiết.
            </h1>
            <p className={styles.heroSubtitle}>
              Kiến tạo vẻ đẹp độc bản cho mỗi người phụ nữ Việt bằng công nghệ hiện đại và tâm huyết từ chuyên gia hàng đầu.
            </p>
            <div className={styles.heroButtons}>
              <a href="#services" className={styles.btnPrimary}>Xem Dịch Vụ</a>
              <Link to="/booking" className={styles.btnSecondary}>Đặt Lịch Ngay</Link>
            </div>
          </div>
        </div>
      </section>

      <section ref={statsRef} className={`${styles.stats} ${statsVisible ? styles.statsVisible : ''}`}>
        {statItems.map((item) => (
          <div key={item.label} className={styles.statItem}>
            <h4 style={{ '--stat-value': item.value }}>
              <span>{item.value}</span>{item.suffix}
            </h4>
            <p>{item.label}</p>
          </div>
        ))}
      </section>

      <section className={styles.services} id="services">
        <div className={styles.featuredLayout}>
          <div className={styles.featuredIntro}>
            <span>Dịch vụ được yêu thích</span>
            <h2>Dịch Vụ Nổi Bật</h2>
            <p>Những liệu trình được khách hàng lựa chọn nhiều nhất, kết hợp kỹ thuật chuyên sâu và trải nghiệm thư giãn tại Lan Anh Beauty.</p>
            <Link to="/services" className={`${styles.btnPrimary} mt-5`}>Xem Tất Cả Dịch Vụ</Link>
          </div>

          <div className={styles.servicesGrid}>
            {loadingFeatured ? (
              <div className={styles.stateBox}>Đang tải dịch vụ nổi bật...</div>
            ) : featuredError ? (
              <div className={styles.errorBox}>{featuredError}</div>
            ) : featuredServices.length === 0 ? (
              <div className={styles.stateBox}>Chưa có dịch vụ nổi bật.</div>
            ) : (
              featuredServices.slice(0, 4).map((service, index) => (
                <div key={service.id} className={styles.serviceCard}>
                  <div className={styles.serviceImg}>
                    <img src={service.thumbnailUrl || service.imageUrl || fallbackImages[index % fallbackImages.length]} alt={service.name} />
                    {service.discountPercent > 0 && <span className={styles.discountBadge}>-{service.discountPercent}%</span>}
                  </div>
                  <div className={styles.serviceInfo}>
                    <h3>{service.name}</h3>
                    <p>{service.shortDescription || service.description || 'Liệu trình được thiết kế phù hợp với nhu cầu làm đẹp của bạn.'}</p>
                    <strong>{service.salePriceLabel || service.priceLabel || 'Tư vấn theo tình trạng'}</strong>
                    <div className={styles.serviceActions}>
                      <Link to={`/services/detail/${service.slug}`} className={styles.textLink}>Tìm Hiểu Thêm</Link>
                      <Link to={`/booking?service=${encodeURIComponent(service.slug)}`} className={styles.textLink}>Đặt Lịch</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className={styles.feedbackSection}>
        <div className={styles.sectionHeader}>
          <h2>Khách Hàng Nói Gì?</h2>
          <p className='text-center'>Những trải nghiệm thật từ khách hàng đã sử dụng dịch vụ tại Lan Anh Beauty.</p>
        </div>
        <div className={styles.feedbackGrid}>
          {feedbackItems.map((item) => (
            <div key={item.name} className={styles.feedbackCard}>
              <div className={styles.quoteIcon}>“</div>
              <p className={styles.feedbackContent}>“{item.content}”</p>
              <div className={styles.feedbackStars}>★★★★★</div>
              <div className={styles.feedbackUser}>
                <div className={styles.avatar}>
                  {item.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.userInfo}>
                  <h4>{item.name}</h4>
                  <span>{item.service}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.articleSection}>
        <div className={styles.sectionHeader}>
          <h2>Bài Viết Làm Đẹp</h2>
          <p>Cập nhật kiến thức chăm sóc sắc đẹp và các lưu ý trước khi sử dụng dịch vụ.</p>
        </div>
        <div className={styles.articleGrid}>
          {articleItems.map((item) => (
            <article key={item.title} className={styles.articleCard}>
              <div className={styles.articleHeader}>
                <span className={styles.articleTag}>{item.tag}</span>
                <span className={styles.readTime}>• 5 phút đọc</span>
              </div>
              <h3 className={styles.articleTitle}>{item.title}</h3>
              <p className={styles.articleExcerpt}>{item.excerpt}</p>
              <Link to="/blog" className={styles.articleLink}>
                Đọc bài viết
                <svg className={styles.linkArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </article>
          ))}
        </div>
        <div className={styles.articleMore}>
          <Link to="/blog" className={styles.btnSecondary}>Xem Thêm Bài Viết</Link>
        </div>
      </section>
    </div>
  );
};


