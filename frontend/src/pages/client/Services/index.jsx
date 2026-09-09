import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ClockIcon, 
  ArrowUpRightIcon,
  SparklesIcon
} from '../../../icons';
import styles from './Services.module.css';
import serviceImg1 from '../../../assets/images/service1.png';
import serviceImg2 from '../../../assets/images/service2.png';
import serviceImg3 from '../../../assets/images/service3.png';

const fallbackImages = [serviceImg1, serviceImg2, serviceImg3];
const SERVICES_PER_PAGE = 9;

const collectServices = (category) => [
  ...(category.services || []),
  ...(category.children || []).flatMap((child) => child.services || []),
];

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategorySlug = searchParams.get('category');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(SERVICES_PER_PAGE);

  // Search and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close sorting dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const sortOptions = useMemo(() => [
    { value: 'default', label: 'Sắp xếp: Mặc định' },
    { value: 'price-asc', label: 'Giá: Thấp đến Cao' },
    { value: 'price-desc', label: 'Giá: Cao đến Thấp' },
    { value: 'discount', label: 'Ưu đãi tốt nhất' },
    { value: 'duration', label: 'Thời lượng liệu trình' },
  ], []);

  const currentSortLabel = useMemo(() => {
    return sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sắp xếp: Mặc định';
  }, [sortBy, sortOptions]);

  // Ref and State for custom category pills scroll arrows
  const pillsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

  const handleSelectAll = () => setSearchParams({});
  const handleSelectCategory = (slug) => setSearchParams({ category: slug });

  // 1. Flatten all services across categories and remove duplicates
  const allServices = useMemo(() => {
    const flat = [];
    const seen = new Set();

    categories.forEach((category) => {
      // Direct parent services
      (category.services || []).forEach((service) => {
        if (!seen.has(service.id)) {
          seen.add(service.id);
          flat.push({
            ...service,
            categorySlug: category.slug,
            categoryName: category.name,
          });
        }
      });

      // Children services
      (category.children || []).forEach((child) => {
        (child.services || []).forEach((service) => {
          if (!seen.has(service.id)) {
            seen.add(service.id);
            flat.push({
              ...service,
              categorySlug: child.slug,
              categoryName: child.name,
            });
          }
        });
      });
    });

    return flat;
  }, [categories]);

  // 2. Filter by category, search query, and then sort
  const filteredAndSortedServices = useMemo(() => {
    let list = allServices;

    // Filter by category slug (include child categories)
    if (selectedCategorySlug) {
      const activeCategory = categories.find((cat) => cat.slug === selectedCategorySlug);
      if (activeCategory) {
        const allowedSlugs = [
          activeCategory.slug,
          ...(activeCategory.children || []).map((child) => child.slug)
        ];
        list = allServices.filter(
          (service) =>
            allowedSlugs.includes(service.categorySlug) ||
            (service.category && allowedSlugs.includes(service.category.slug))
        );
      } else {
        list = allServices.filter((service) => service.categorySlug === selectedCategorySlug);
      }
    }

    // Filter by search query (live search)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (service) =>
          service.name.toLowerCase().includes(q) ||
          (service.shortDescription && service.shortDescription.toLowerCase().includes(q)) ||
          (service.description && service.description.toLowerCase().includes(q))
      );
    }

    // Sort logic
    const getEffectivePrice = (s) => s.salePrice || s.price || 0;

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => {
        const pA = getEffectivePrice(a);
        const pB = getEffectivePrice(b);
        if (pA === 0 && pB !== 0) return 1; // puts Consultation at bottom
        if (pB === 0 && pA !== 0) return -1;
        return pA - pB;
      });
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => {
        const pA = getEffectivePrice(a);
        const pB = getEffectivePrice(b);
        if (pA === 0 && pB !== 0) return 1; // puts Consultation at bottom
        if (pB === 0 && pA !== 0) return -1;
        return pB - pA;
      });
    } else if (sortBy === 'discount') {
      list = [...list].sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
    } else if (sortBy === 'duration') {
      list = [...list].sort((a, b) => (a.durationMinutes || 0) - (b.durationMinutes || 0));
    } else {
      // Default: sortOrder ASC, then name ASC
      list = [...list].sort((a, b) => {
        const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name, 'vi');
      });
    }

    return list;
  }, [allServices, categories, selectedCategorySlug, searchQuery, sortBy]);

  // Helper to find parent category and active category/subcategory
  const activeParentCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    return categories.find((cat) => {
      if (cat.slug === selectedCategorySlug) return true;
      return (cat.children || []).some((child) => child.slug === selectedCategorySlug);
    });
  }, [categories, selectedCategorySlug]);

  const selectedCategory = useMemo(() => {
    if (!selectedCategorySlug) return null;
    for (const cat of categories) {
      if (cat.slug === selectedCategorySlug) return cat;
      const child = (cat.children || []).find((c) => c.slug === selectedCategorySlug);
      if (child) return child;
    }
    return null;
  }, [categories, selectedCategorySlug]);

  // Selected category info for header
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategorySlug) return 'Tất cả dịch vụ';
    return selectedCategory ? selectedCategory.name : 'Dịch vụ';
  }, [selectedCategory, selectedCategorySlug]);

  const selectedCategoryDescription = useMemo(() => {
    if (!selectedCategorySlug) return 'Khám phá các giải pháp làm đẹp toàn diện, kết hợp giữa kỹ thuật tinh xảo và dòng sản phẩm cao cấp nhất.';
    return selectedCategory ? selectedCategory.description : '';
  }, [selectedCategory, selectedCategorySlug]);

  const visibleServices = useMemo(
    () => filteredAndSortedServices.slice(0, visibleCount),
    [filteredAndSortedServices, visibleCount]
  );

  const hasMoreServices = visibleCount < filteredAndSortedServices.length;

  useEffect(() => {
    setVisibleCount(SERVICES_PER_PAGE);
  }, [selectedCategorySlug, searchQuery, sortBy]);

  const checkScrollLimits = () => {
    if (pillsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = pillsRef.current;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    // Check scroll limits on mount & when database categories/services load
    const timer = setTimeout(checkScrollLimits, 300);
    window.addEventListener('resize', checkScrollLimits);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollLimits);
    };
  }, [categories, allServices]);

  const scrollPills = (direction) => {
    if (pillsRef.current) {
      const scrollAmount = 240;
      pillsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

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
            <>
              {/* Explorer / Filter controls */}
              <div className={styles.explorerPanel}>
                <div className={styles.searchAndSort}>
                  <div className={styles.searchWrapper}>
                    <MagnifyingGlassIcon className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Tìm kiếm dịch vụ..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        type="button" 
                        className={styles.clearSearch} 
                        onClick={() => setSearchQuery('')}
                        title="Xóa tìm kiếm"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className={styles.sortWrapper} ref={sortRef}>
                    <button
                      type="button"
                      className={`${styles.sortTrigger} ${isSortOpen ? styles.sortTriggerActive : ''}`}
                      onClick={() => setIsSortOpen(!isSortOpen)}
                    >
                      <span>{currentSortLabel}</span>
                      <ChevronDownIcon className={`${styles.sortArrow} ${isSortOpen ? styles.sortArrowActive : ''}`} />
                    </button>
                    {isSortOpen && (
                      <div className={styles.sortDropdown}>
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={`${styles.sortOption} ${sortBy === option.value ? styles.sortOptionActive : ''}`}
                            onClick={() => {
                              setSortBy(option.value);
                              setIsSortOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.categoryPillsContainer}>
                  {/* Left fade and arrow */}
                  <div className={`${styles.pillsFadeLeft} ${showLeftArrow ? styles.pillsFadeVisible : ''}`}></div>
                  <button
                    type="button"
                    className={`${styles.scrollBtn} ${styles.scrollBtnLeft} ${showLeftArrow ? styles.scrollBtnActive : ''}`}
                    onClick={() => scrollPills('left')}
                    aria-label="Cuộn trái"
                  >
                    <ChevronLeftIcon className="w-5 h-5 text-[var(--text-main)]" />
                  </button>

                  <div 
                    className={styles.categoryPills} 
                    ref={pillsRef}
                    onScroll={checkScrollLimits}
                  >
                    <button
                      type="button"
                      className={`${styles.categoryPill} ${!selectedCategorySlug ? styles.categoryPillActive : ''}`}
                      onClick={handleSelectAll}
                    >
                      Tất cả <span className={styles.pillCount}>{allServices.length}</span>
                    </button>
                    {categories.map((category) => {
                      const isChildActive = (category.children || []).some(
                        (child) => child.slug === selectedCategorySlug
                      );
                      const isActive = selectedCategorySlug === category.slug || isChildActive;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ''}`}
                          onClick={() => handleSelectCategory(category.slug)}
                        >
                          {category.name} <span className={styles.pillCount}>{collectServices(category).length}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right fade and arrow */}
                  <div className={`${styles.pillsFadeRight} ${showRightArrow ? styles.pillsFadeVisible : ''}`}></div>
                  <button
                    type="button"
                    className={`${styles.scrollBtn} ${styles.scrollBtnRight} ${showRightArrow ? styles.scrollBtnActive : ''}`}
                    onClick={() => scrollPills('right')}
                    aria-label="Cuộn phải"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-[var(--text-main)]" />
                  </button>
                </div>

                {/* Subcategory Pills Row */}
                {activeParentCategory && (activeParentCategory.children || []).length > 0 && (
                  <div className={styles.subCategoryPills}>
                    <button
                      type="button"
                      className={`${styles.subCategoryPill} ${selectedCategorySlug === activeParentCategory.slug ? styles.subCategoryPillActive : ''}`}
                      onClick={() => handleSelectCategory(activeParentCategory.slug)}
                    >
                      Tất cả
                    </button>
                    {(activeParentCategory.children || []).map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        className={`${styles.subCategoryPill} ${selectedCategorySlug === child.slug ? styles.subCategoryPillActive : ''}`}
                        onClick={() => handleSelectCategory(child.slug)}
                      >
                        {child.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Header showing active selection */}
              <div className={styles.servicesHeader}>
                <h2>{selectedCategoryName}</h2>
                {selectedCategoryDescription && <p>{selectedCategoryDescription}</p>}
                <div className={styles.resultsCount}>
                  Hiển thị <strong>{filteredAndSortedServices.length}</strong> dịch vụ
                </div>
              </div>

              {/* Unified Services Grid */}
              {filteredAndSortedServices.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <SparklesIcon className="w-12 h-12 text-[var(--primary-gold)] stroke-[1]" />
                  </div>
                  <h3>Không tìm thấy dịch vụ nào</h3>
                  <p>Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác nhé.</p>
                  {(searchQuery || selectedCategorySlug || sortBy !== 'default') && (
                    <button
                      type="button"
                      className={styles.btnReset}
                      onClick={() => {
                        setSearchQuery('');
                        setSortBy('default');
                        handleSelectAll();
                      }}
                    >
                      Đặt lại bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className={styles.servicesGrid}>
                    {visibleServices.map((service, index) => (
                      <div key={service.id} className={`${styles.serviceCard} bezel-shell`}>
                        <div className="bezel-inner overflow-hidden flex flex-col h-full">
                          <div className={styles.serviceImg}>
                            <img
                              src={service.thumbnailUrl || service.imageUrl || fallbackImages[index % fallbackImages.length]}
                              alt={service.name}
                              loading="lazy"
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
                            <div className={styles.metaRow}>
                              {service.durationMinutes && (
                                <span className={styles.duration}>
                                  <ClockIcon className="w-4 h-4 inline-block text-[var(--primary-gold-dark)] mr-1" />
                                  {service.durationMinutes} phút
                                </span>
                              )}
                              {service.categoryName && (
                                <span className={styles.cardCategoryName}>
                                  {service.categoryName}
                                </span>
                              )}
                            </div>
                            <div className={styles.cardActions}>
                              <Link to={`/services/detail/${service.slug}`} className={styles.btnDetail}>
                                Xem Chi Tiết
                              </Link>
                              <Link to={`/booking?service=${encodeURIComponent(service.slug)}`} className={styles.btnBook}>
                                <span>Đặt Lịch</span>
                                <ArrowUpRightIcon className="w-3.5 h-3.5 inline-block ml-1" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMoreServices && (
                    <div className={styles.loadMoreWrap}>
                      <button
                        type="button"
                        className={styles.loadMoreBtn}
                        onClick={() => setVisibleCount((count) => count + SERVICES_PER_PAGE)}
                        aria-label="Xem thêm dịch vụ"
                      >
                        <span>Xem thêm</span>
                        <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <span className="eyebrow-badge bg-white/10 text-white border-white/20 mb-3">Tư Vấn Miễn Phí</span>
            <h2>Bạn Cần Tư Vấn Trực Tiếp Cùng Chuyên Gia?</h2>
            <p>Đội ngũ bác sĩ và kỹ thuật viên của Lan Anh Beauty luôn sẵn sàng hỗ trợ thăm khám da và đưa ra phác đồ trị liệu tối ưu nhất.</p>
            <Link to="/booking" className="btn-luxury-primary">
              <span>Đặt Lịch Tư Vấn Ngay</span>
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

