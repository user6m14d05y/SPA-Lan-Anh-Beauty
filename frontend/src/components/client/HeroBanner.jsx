import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  ArrowUpRightIcon,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Zalo,
  TikTok,
  Instagram
} from '../../icons';
import { API_URL } from '../../config';

// Fallback placeholder gradient backgrounds when service has no image
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #2A1F16 0%, #1C1612 100%)',
  'linear-gradient(135deg, #16213E 0%, #0D1B2A 100%)',
  'linear-gradient(135deg, #1B2838 0%, #0D1B2A 100%)',
  'linear-gradient(135deg, #1A1612 0%, #2A211B 100%)',
];

const formatPrice = (price) => {
  if (!price && price !== 0) return '';
  const num = Number(price);
  if (Number.isNaN(num)) return price;
  return `${num.toLocaleString('vi-VN')} VNĐ`;
};

export default function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Touch swipe support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/catalog/services?featured=true`);
        const result = await res.json();
        if (res.ok && result.success && result.data?.length > 0) {
          setServices(result.data);
        } else {
          setServices([]);
        }
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (services.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % services.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [services.length]);

  const handlePrev = () => {
    if (services.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + services.length) % services.length);
  };

  const handleNext = () => {
    if (services.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % services.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext(); // Swipe Left -> Next slide
    } else if (distance < -50) {
      handlePrev(); // Swipe Right -> Prev slide
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const current = services[activeIndex];

  // --- Loading skeleton ---
  if (loading) {
    return (
      <section className="relative h-screen w-full overflow-hidden bg-[#14100D] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#C59B63]/30" />
          <div className="h-2 w-32 rounded bg-white/10" />
        </div>
      </section>
    );
  }

  // --- Empty state: no featured services ---
  if (services.length === 0) {
    return (
      <section className="relative h-screen w-full overflow-hidden font-geist text-white select-none bg-[#14100D]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/75 pointer-events-none" />
        <div className="relative z-10 flex h-full flex-col justify-center items-center text-center px-6">
          <div className="eyebrow-badge mb-6 bg-white/10 text-[#DFBF91] border-white/20 backdrop-blur-md">
            <SparklesIcon className="w-3.5 h-3.5 text-[#C59B63]" />
            <span>Lan Anh Beauty Spa 5 Star Experience</span>
          </div>
          <h1 className="text-4xl font-normal leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl max-w-3xl">
            Lan Anh Beauty là nơi kiến tạo nhan sắc mỗi&nbsp;ngày
          </h1>
          <div className="mt-8">
            <Link
              to="/booking"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#C59B63] hover:bg-[#9A7543] text-white text-sm font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <span>Đặt Lịch Trực Tuyến</span>
              <ArrowUpRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative h-screen w-full overflow-hidden font-geist text-white select-none bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* Background images — one per featured service */}
      {services.map((service, index) => {
        const imgSrc = service.thumbnailUrl || service.imageUrl || null;
        return imgSrc ? (
          <img
            key={service.id}
            src={imgSrc}
            alt={service.name}
            className={`absolute inset-0 w-full h-full object-cover object-[center_20%] transition-opacity duration-700 ease-out ${index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ) : (
          /* Gradient fallback when no image */
          <div
            key={service.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            style={{ background: FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length] }}
          />
        );
      })}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70 pointer-events-none" />

      {/* Left/Right Scroll Navigation Buttons (Desktop only) */}
      {services.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Slide trước đó"
            className="hidden sm:flex absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-[#C59B63] border border-white/20 hover:border-[#C59B63] text-white items-center justify-center backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Slide tiếp theo"
            className="hidden sm:flex absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/35 hover:bg-[#C59B63] border border-white/20 hover:border-[#C59B63] text-white items-center justify-center backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Content layer */}
      <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-6 pt-28 sm:px-10 sm:pb-8 lg:px-16">

        {/* Top zone — headline + service info */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-16">
          <div className="max-w-2xl">
            <div className="eyebrow-badge mb-4 bg-white/10 text-[#DFBF91] border-white/20 backdrop-blur-md">
              <SparklesIcon className="w-3.5 h-3.5 text-[#C59B63]" />
              <span>Lan Anh Beauty Spa 5 Star Experience</span>
            </div>
            <h1 className="text-3xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-7xl">
              Lan Anh Beauty là nơi kiến tạo nhan sắc mỗi&nbsp;ngày
            </h1>
          </div>

          {/* Service info (Title, Category, Description, Formatted Price) — transparent layout */}
          <div className="max-w-sm md:pt-2 w-full">
            <div
              key={current.id}
              className="flex flex-col gap-2.5 animate-[fadeIn_0.5s_ease]"
            >
              {/* Category badge */}
              {current.category?.name && (
                <span className="inline-flex self-start text-[#DFBF91] text-xs font-bold uppercase tracking-wider">
                  {current.category.name}
                </span>
              )}

              {/* Service Name */}
              <h3 className="text-xl sm:text-4xl font-bold text-white leading-snug drop-shadow-md">
                {current.name}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm leading-relaxed text-white/90 drop-shadow line-clamp-3">
                {current.shortDescription || current.description || 'Liệu trình chăm sóc da chuyên sâu giúp da sáng khỏe và mịn màng.'}
              </p>

              {/* Formatted Price (000.000.000 VNĐ) */}
              {(current.price || current.salePrice || current.priceLabel) && (
                <div className="pt-1">
                  {current.salePrice ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-bold text-[#DFBF91] drop-shadow">
                        Từ {formatPrice(current.salePrice)}
                      </span>
                      <span className="text-xs text-white/60 line-through">
                        {formatPrice(current.price)}
                      </span>
                    </div>
                  ) : current.price ? (
                    <span className="text-base sm:text-lg font-bold text-[#DFBF91] drop-shadow">
                      Từ {formatPrice(current.price)}
                    </span>
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold text-[#DFBF91] drop-shadow">
                      {current.priceLabel}
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-2 flex items-center gap-3 pt-2">
                <Link
                  to={current ? `/booking?service=${encodeURIComponent(current.slug || current.name)}` : '/booking'}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#C59B63] hover:bg-[#9A7543] text-white text-xs sm:text-sm font-medium transition-all shadow-lg hover:shadow-xl"
                >
                  <span>Đặt Lịch Trực Tuyến</span>
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to={`/services/Detail/${current.slug}`}
                  className="text-xs text-white/80 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom zone — service thumbnail picker + meta */}
        <div className="flex flex-col gap-8 mt-12 md:mt-0">

          {/* Thumbnail picker row */}
          <div
            className="no-scrollbar flex items-end gap-2 overflow-x-auto pb-1 sm:gap-3 sm:overflow-visible sm:pb-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {services.map((service, index) => {
              const isActive = index === activeIndex;
              const thumb = service.thumbnailUrl || service.imageUrl || null;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Xem dịch vụ ${service.name}`}
                  className="flex shrink-0 flex-col items-center gap-2 cursor-pointer focus:outline-none group"
                >
                  {/* Active indicator dot */}
                  <span
                    className={`h-1 w-1 rounded-full bg-white transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                  />
                  {/* Thumbnail circle */}
                  <span
                    className={`block h-10 w-10 overflow-hidden rounded-full transition-transform duration-300 sm:h-14 sm:w-14 border ${isActive
                        ? 'border-white scale-105'
                        : 'border-white/30 group-hover:border-white/70'
                      }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={service.name}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      /* No image: show initials */
                      <span
                        className="h-full w-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length] }}
                      >
                        {service.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Meta footer with Facebook, Zalo, Instagram, TikTok icons (without div bg) */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 border-t border-white/20 pt-4 sm:pt-5 text-xs sm:text-sm font-medium">
            <a
              href="https://www.facebook.com/05.thanh"
              target="_blank"
              rel="noopener noreferrer"
              title="Facebook Lan Anh Beauty"
              className="text-white/80 hover:text-white flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-105"
            >
              <Facebook size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-base">Facebook</span>
            </a>
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              title="Zalo Lan Anh Beauty"
              className="text-white/80 hover:text-white flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-105"
            >
              <Zalo size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-base">Zalo</span>
            </a>
            <a
              href="https://instagram.com/05.thanh"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram Lan Anh Beauty"
              className="text-white/80 hover:text-white flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-105"
            >
              <Instagram size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-base">Instagram</span>
            </a>
            <a
              href="https://www.tiktok.com/@user6m14d05y"
              target="_blank"
              rel="noopener noreferrer"
              title="TikTok Lan Anh Beauty"
              className="text-white/80 hover:text-white flex items-center gap-1.5 sm:gap-2 transition-all hover:scale-105"
            >
              <TikTok size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="text-xs sm:text-base">Tiktok</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
