import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  AcademicCapIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  StarIcon,
  CheckBadgeIcon,
  ArrowUpRightIcon,
} from '../../../icons';
import styles from './Home.module.css';
import HeroBanner from '../../../components/client/HeroBanner';
import serviceImg1 from '../../../assets/images/service1.png';

import serviceImg2 from '../../../assets/images/service2.png';
import serviceImg3 from '../../../assets/images/service3.png';

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


function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

export default function Home() {
  const navigate = useNavigate();
  const categoriesInView = useInView(0.1);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredError, setFeaturedError] = useState('');
  const [statsVisible, setStatsVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`${API_URL}/catalog/tree`);
        const result = await response.json();
        if (response.ok && result.success) {
          setCategories(result.data || []);
        }
      } catch {
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
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
      {/* Hero Section */}
      <HeroBanner />


      {/* Stats Section */}
      <section ref={statsRef} className={`${styles.stats} ${statsVisible ? styles.statsVisible : ''}`}>
        <div className={styles.statsContainer}>
          {statItems.map((item) => (
            <div key={item.label} className={styles.statItem}>
              <h4>
                <span>{item.value}</span>{item.suffix}
              </h4>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4 Pillars Experience Section */}
      <section className={styles.pillarsSection}>
        <div className={styles.sectionHeader}>
          <span className="eyebrow-badge">
            <SparklesIcon className="w-3.5 h-3.5 text-[#C59B63]" />
            <span>Giá Trị Vượt Trội</span>
          </span>
          <h2>Trải Nghiệm Thư Giãn Đẳng Cấp 5 Sao</h2>
          <p>Mỗi liệu trình tại Lan Anh Beauty là một hành trình nuôi dưỡng làn da và thư giãn tâm trí hoàn hảo.</p>
        </div>

        <div className={styles.pillarsGrid}>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <AcademicCapIcon className="w-7 h-7 text-[#C59B63]" />
            </div>
            <h3>Chuyên Gia Hàng Đầu</h3>
            <p>Đội ngũ bác sĩ và kỹ thuật viên trên 10 năm kinh nghiệm, tư vấn phác đồ cá nhân hóa theo từng tình trạng da.</p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <CpuChipIcon className="w-7 h-7 text-[#C59B63]" />
            </div>
            <h3>Công Nghệ Hiện Đại</h3>
            <p>Sử dụng 100% trang thiết bị và sản phẩm làm đẹp đạt chứng nhận FDA & CE an toàn tuyệt đối.</p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <SparklesIcon className="w-7 h-7 text-[#C59B63]" />
            </div>
            <h3>Không Gian Tĩnh Lặng</h3>
            <p>Kiến trúc thiết kế tinh tế với hương thơm tinh dầu tự nhiên, mang tới sự thư thái tối đa.</p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon}>
              <ShieldCheckIcon className="w-7 h-7 text-[#C59B63]" />
            </div>
            <h3>Cam Kết Chất Lượng</h3>
            <p>Đồng hành cùng khách hàng trong suốt quá trình trước, trong và sau khi thực hiện liệu trình.</p>
          </div>
        </div>
      </section>

      {/* Categories Section — 1 Row Accordion (Edge-to-Edge) */}
      <section id="services" className={styles.categorySection}>
        <div
          ref={categoriesInView.ref}
          className={`${styles.categoryAccordionContainer} transition-all duration-1000 ease-out ${
            categoriesInView.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          {loadingCategories
            ? /* Skeleton placeholders */ [0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`${styles.categoryAccordionCard} animate-pulse bg-[#1A1612]`}
              />
            ))
            : categories.map((cat, index) => {
              const allServices = [
                ...(cat.services || []),
                ...(cat.children || []).flatMap((c) => c.services || []),
              ];
              const thumbUrl = cat.imageUrl || allServices.find((s) => s.thumbnailUrl)?.thumbnailUrl || null;

              const gradients = [
                'linear-gradient(135deg, #2A1F16 0%, #1C1612 100%)',
                'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
                'linear-gradient(135deg, #1B2838 0%, #0D1B2A 100%)',
                'linear-gradient(135deg, #1C1612 0%, #2A211B 100%)',
                'linear-gradient(135deg, #231913 0%, #1A1410 100%)',
                'linear-gradient(135deg, #182026 0%, #11171A 100%)',
                'linear-gradient(135deg, #2D1E2F 0%, #170E1A 100%)',
              ];

              return (
                <div
                  key={cat.id}
                  className={styles.categoryAccordionCard}
                  style={{ transitionDelay: `${index * 50}ms` }}
                  onClick={() => navigate(`/services?category=${cat.slug}`)}
                >
                  {/* Background image or gradient */}
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={cat.name}
                      className={styles.categoryBgImg}
                    />
                  ) : (
                    <div
                      className={styles.categoryBgImg}
                      style={{ background: gradients[index % gradients.length] }}
                    />
                  )}

                  {/* Dark overlay */}
                  <div className={styles.categoryOverlay} />

                  {/* Vertical Category Title */}
                  <h2 className={styles.categoryTitleVertical}>
                    {cat.name}
                  </h2>

                  {/* Bottom Info: Service Count Badge & Button */}
                  <div className={styles.categoryBottomInfo}>
                    {allServices.length > 0 && (
                      <span className={styles.categoryCountBadge}>
                        {allServices.length} dịch vụ
                      </span>
                    )}
                    <button
                      type="button"
                      className={styles.categoryBtnExplore}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/services?category=${cat.slug}`);
                      }}
                    >
                      <span>Khám phá</span>
                    </button>
                  </div>

                  {/* Gold accent line on hover */}
                  <div className={styles.categoryGoldAccentLine} />
                </div>
              );
            })}
        </div>
      </section>

     

      {/* Articles & Tips Section */}
      <section className={styles.articleSection}>
        <div className={styles.sectionHeader}>
          <span className="eyebrow-badge">Cẩm Nang Làm Đẹp</span>
          <h2>Bài Viết & Bí Quyết</h2>
          <p>Cập nhật những xu hướng chăm sóc da chuẩn khoa học từ đội ngũ chuyên gia.</p>
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
                <span>Đọc bài viết</span>
                <ArrowUpRightIcon className="w-4 h-4 inline ml-1" />
              </Link>
            </article>
          ))}
        </div>
        <div className={styles.articleMore}>
          <Link to="/blog" className="btn-luxury-secondary">Xem Thêm Bài Viết Kinh Nghiệm</Link>
        </div>
      </section>

      
       {/* Customer Feedback Section */}
      <section className={styles.feedbackSection}>
        <div className={styles.sectionHeader}>
          <span className="eyebrow-badge">Đánh Giá Thực Tế</span>
          <h2>Khách Hàng Nói Gì Về Chúng Tôi?</h2>
          <p>Những cảm nhận chân thực từ hàng nghìn phái đẹp đã tin tưởng gửi gắm nhan sắc tại Lan Anh Beauty.</p>
        </div>
        <div className={styles.feedbackGrid}>
          {feedbackItems.map((item) => (
            <div key={item.name} className={styles.feedbackCard}>
              <div className={styles.feedbackHeader}>
                <div className={styles.quoteIcon}>“</div>
                <div className="flex gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <p className={styles.feedbackContent}>“{item.content}”</p>
              <div className={styles.feedbackUser}>
                <div className={styles.avatar}>
                  {item.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.userInfo}>
                  <h4 className="flex items-center gap-1.5">
                    <span>{item.name}</span>
                    <CheckBadgeIcon className="w-4 h-4 text-emerald-500 inline" />
                    <span className={styles.verifiedTag}>Đã trải nghiệm</span>
                  </h4>
                  <span>{item.service}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaContainer}>
          <div className={styles.ctaBox}>
            <span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-3">
              <SparklesIcon className="w-3.5 h-3.5 text-white" />
              <span>Ưu Đãi Đặt Lịch Hôm Nay</span>
            </span>
            <h2>Sẵn Sàng Cho Làn Da Tươi Trẻ, Rạng Rỡ?</h2>
            <p>Liên hệ ngay với Lan Anh Beauty để giữ khung giờ tư vấn cùng bác sĩ chuyên khoa và nhận ưu đãi liệu trình độc quyền.</p>
            <div className="flex gap-4 flex-wrap justify-center mt-4">
              <Link to="/booking" className="btn-luxury-primary">
                <span>Đặt Lịch Ngay</span>
                <ArrowUpRightIcon className="w-4 h-4 ml-1" />
              </Link>
              <Link to="/contact" className="btn-luxury-secondary bg-white/10 text-white hover:bg-white/20 border-white/20">
                Nhận Tư Vấn Miễn Phí
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}




