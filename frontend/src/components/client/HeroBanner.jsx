import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SparklesIcon, ArrowUpRightIcon } from '../../icons';

const API_URL = 'http://localhost:5000/api';

// Fallback placeholder gradient backgrounds when service has no image
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #2A1F16 0%, #1C1612 100%)',
  'linear-gradient(135deg, #16213E 0%, #0D1B2A 100%)',
  'linear-gradient(135deg, #1B2838 0%, #0D1B2A 100%)',
  'linear-gradient(135deg, #1A1612 0%, #2A211B 100%)',
];

export default function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <section className="relative h-screen w-full overflow-hidden font-geist text-white select-none bg-black">

      {/* Background images — one per featured service */}
      {services.map((service, index) => {
        const imgSrc = service.thumbnailUrl || service.imageUrl || null;
        return imgSrc ? (
          <img
            key={service.id}
            src={imgSrc}
            alt={service.name}
            className={`absolute inset-0 w-full h-full object-cover object-[center_20%] transition-opacity duration-700 ease-out ${
              index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ) : (
          /* Gradient fallback when no image */
          <div
            key={service.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              index === activeIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ background: FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length] }}
          />
        );
      })}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/70 pointer-events-none" />

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

          {/* Service description panel */}
          <div className="max-w-xs md:pt-4">
            <p
              key={current.id}
              className="text-sm font-medium leading-relaxed text-white/90 sm:text-base animate-[fadeIn_0.5s_ease]"
            >
              {current.shortDescription || current.description || current.name}
            </p>

            {/* Price tag */}
            {current.priceLabel && (
              <p className="mt-2 text-xs text-[#DFBF91] font-semibold tracking-wide">
                {current.priceLabel}
              </p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <Link
                to={current ? `/booking?service=${encodeURIComponent(current.slug || current.name)}` : '/booking'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C59B63] hover:bg-[#9A7543] text-white text-xs sm:text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                <span>Đặt Lịch Trực Tuyến</span>
                <ArrowUpRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to={`/services/Detail/${current.slug}`}
                className="text-xs text-white/60 hover:text-white underline underline-offset-4 transition-colors"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom zone — service thumbnail picker + meta */}
        <div className="flex flex-col gap-8 mt-12 md:mt-0">

          {/* Thumbnail picker row */}
          <div className="flex items-end gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1 sm:gap-3 sm:overflow-visible sm:pb-0">
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
                    className={`h-1 w-1 rounded-full bg-white transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {/* Thumbnail circle */}
                  <span
                    className={`block h-10 w-10 overflow-hidden rounded-full transition-transform duration-300 sm:h-14 sm:w-14 border ${
                      isActive
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

          {/* Meta footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5 text-sm font-medium">
            <span
              key={current.id + '-name'}
              className="text-white animate-[fadeIn_0.5s_ease]"
            >
              {current.name}
            </span>

            <span
              key={current.id + '-cat'}
              className="hidden text-white/70 sm:inline"
            >
              {current.category?.name || ''}
            </span>

            <span className="hidden text-white/70 md:inline">
              Đồng hành cùng vẻ đẹp Việt từ 2016
            </span>

            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-white/70"
            >
              WhatsApp / Zalo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
