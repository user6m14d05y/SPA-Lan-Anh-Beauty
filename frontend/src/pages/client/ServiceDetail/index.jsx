import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { 
  FireIcon, 
  ClockIcon, 
  FolderIcon, 
  CheckBadgeIcon, 
  ArrowLeftIcon, 
  ArrowUpRightIcon,
  StarIcon
} from '../../../icons';
import styles from './ServiceDetail.module.css';
import fallbackImage from '../../../assets/images/service1.png';

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
          <div className={styles.breadcrumbNav}>
            <Link to="/services" className={styles.backLink}>
              <ArrowLeftIcon className="w-4 h-4 inline-block mr-1" /> Dịch Vụ
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.category}>{service.category?.name || 'Dịch Vụ Spa'}</span>
          </div>
          <h1>{service.name}</h1>
          <p>{service.shortDescription || 'Thông tin chi tiết về liệu trình chăm sóc, quy trình 5 bước đạt chuẩn và cam kết chất lượng tại Lan Anh Beauty.'}</p>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          <div className={styles.detailGrid}>
            <div className={styles.galleryColumn}>
              <div className={`${styles.gallery} bezel-shell`}>
                <div className="bezel-inner p-3">
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
                      {service.discountPercent > 0 && <span>-{service.discountPercent}% OFF</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Procedure Timeline (5 Steps) */}
              <div className={styles.procedureCard}>
                <div className={styles.sectionHeaderCompact}>
                  <span className="eyebrow-badge">Quy Trình Chuẩn Y Khoa</span>
                  <h2>Các Bước Thực Hiện Liệu Trình</h2>
                </div>
                <div className={styles.timelineList}>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineBadge}>1</div>
                    <div className={styles.timelineContent}>
                      <h4>Thăm Khám & Soi Da Chuyên Sâu</h4>
                      <p>Bác sĩ phân tích tình trạng da, xác định cấp độ tổn thương và lập phác đồ trị liệu cá nhân hóa.</p>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineBadge}>2</div>
                    <div className={styles.timelineContent}>
                      <h4>Làm Sạch & Tẩy Tế Bào Chết Sinh Học</h4>
                      <p>Sử dụng dòng sản phẩm thảo dược hữu cơ làm sạch sâu lỗ chân lông, đào thải độc tố bề mặt da.</p>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineBadge}>3</div>
                    <div className={styles.timelineContent}>
                      <h4>Thực Hiện Liệu Trình Công Nghệ Cao</h4>
                      <p>Áp dụng máy móc chuyên dụng cùng kỹ thuật viên nhiều năm kinh nghiệm tác động chính xác vùng da trị liệu.</p>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineBadge}>4</div>
                    <div className={styles.timelineContent}>
                      <h4>Đắp Mặt Nạ Phục Hồi & Điện Di Tinh Chất</h4>
                      <p>Cung cấp dưỡng chất collagen và vitamin cô đặc giúp làm dịu, bù ẩm và khóa dưỡng chất trên da.</p>
                    </div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineBadge}>5</div>
                    <div className={styles.timelineContent}>
                      <h4>Hướng Dẫn Chăm Sóc Tại Nhà</h4>
                      <p>Bàn giao sản phẩm chăm sóc sau liệu trình và hẹn lịch tái khám kiểm tra tiến trình phục hồi.</p>
                    </div>
                  </div>
                </div>
              </div>

              {sanitizedDescription && (
                <div className={styles.descriptionCard}>
                  <div className={styles.sectionHeaderRow}>
                    <div>
                      <span className="eyebrow-badge">Thông Tin Thêm</span>
                      <h2>Mô Tả Chi Tiết</h2>
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
                <span className="eyebrow-badge mb-2">Đăng Ký Liệu Trình</span>
                <h2>Chi Phí & Lịch Hẹn</h2>
                <div className={styles.priceBox}>
                  {service.salePriceLabel ? (
                    <>
                      <span className={styles.oldPrice}>{service.priceLabel}</span>
                      <strong>{service.salePriceLabel}</strong>
                      <small>
                        <FireIcon className="w-4 h-4 inline-block text-amber-500 mr-1" />
                        Ưu đãi giảm {service.discountPercent}% duy nhất trong tháng này
                      </small>
                    </>
                  ) : (
                    <strong>{service.priceLabel}</strong>
                  )}
                </div>

                <div className={styles.metaList}>
                  <div>
                    <span>
                      <ClockIcon className="w-4 h-4 inline-block text-[var(--primary-gold-dark)] mr-1" />
                      Thời lượng
                    </span>
                    <strong>{service.durationMinutes ? `${service.durationMinutes} phút` : 'Tư vấn trực tiếp'}</strong>
                  </div>
                  <div>
                    <span>
                      <FolderIcon className="w-4 h-4 inline-block text-[var(--primary-gold-dark)] mr-1" />
                      Danh mục
                    </span>
                    <strong>{service.category?.name || 'Dịch Vụ Spa'}</strong>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link to={`/booking?service=${encodeURIComponent(service.slug)}`} className="btn-luxury-primary w-full text-center justify-center">
                    <span>Đặt Lịch Ngay</span>
                    <ArrowUpRightIcon className="w-4 h-4 inline-block ml-1" />
                  </Link>
                  <Link to="/contact" className="btn-luxury-secondary w-full text-center justify-center">Nhận Tư Vấn</Link>
                </div>
              </div>

              <div className={styles.feedbackCard}>
                <div className={styles.sectionHeaderCompact}>
                  <span className="eyebrow-badge">Đánh Giá Thực Tế</span>
                  <h3>Cảm Nhận Khách Hàng</h3>
                </div>
                {feedbackItems.map((feedback) => (
                  <div key={feedback.name} className={styles.feedbackItem}>
                    <div className="flex gap-1 text-amber-500 mb-2.5" aria-label="Đánh giá 5 sao">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 fill-amber-500" />
                      ))}
                    </div>
                    <strong>
                      {feedback.name}{' '}
                      <span className={styles.verifiedTag}>
                        <CheckBadgeIcon className="w-3.5 h-3.5 inline-block text-emerald-600 mr-0.5" />
                        Verified
                      </span>
                    </strong>
                    <p>“{feedback.content}”</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {relatedServices.length > 0 && (
            <section className={styles.relatedSection}>
              <div className={styles.sectionHeaderCompact}>
                <span className="eyebrow-badge">Gợi Ý Cho Bạn</span>
                <h2>Dịch Vụ Cùng Danh Mục</h2>
              </div>
              <div className={styles.relatedGrid}>
                {relatedServices.map((item) => (
                  <Link key={item.id} to={`/services/detail/${item.slug}`} className={styles.relatedCard}>
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

