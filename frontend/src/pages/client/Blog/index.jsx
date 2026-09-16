import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarIcon, PencilSquareIcon, ClockIcon } from '../../../icons';
import heroImg from '../../../assets/images/hero.png';
import { API_URL, ASSET_URL } from '../../../config';

const getPostImage = (post) => {
  const url = post.coverImageUrl || post.imageUrl;
  if (!url) return heroImg;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${ASSET_URL}${url}`;
};

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
};

const updateMeta = (name, content, attribute = 'name') => {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const updateCanonical = (href) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get('category') || '';
  const searchParam = searchParams.get('q') || searchParams.get('search') || '';
  const sort = ['newest', 'oldest', 'popular'].includes(searchParams.get('sort')) ? searchParams.get('sort') : 'newest';
  const pageSize = 8;

  // Local state for smooth debounced search input
  const [searchInput, setSearchInput] = useState(searchParam);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const sentinelRef = useRef(null);

  // Keep searchInput in sync if URL searchParam changes externally
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Debounce searchInput -> update URL parameter after 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchParam) {
        const next = new URLSearchParams(searchParams);
        if (searchInput.trim()) {
          next.set('q', searchInput.trim());
        } else {
          next.delete('q');
          next.delete('search');
        }
        setSearchParams(next, { replace: true });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput, searchParam, searchParams, setSearchParams]);

  useEffect(() => {
    const previousTitle = document.title;
    const canonical = `${window.location.origin}/blog`;
    document.title = searchParam ? `Tìm kiếm bài viết: ${searchParam} | Lan Anh Beauty` : 'Cẩm Nang Làm Đẹp | Lan Anh Beauty';
    updateMeta('description', 'Khám phá kiến thức chăm sóc da, mỹ phẩm, dinh dưỡng và xu hướng làm đẹp chuẩn khoa học từ Lan Anh Beauty.');
    updateMeta('og:title', document.title, 'property');
    updateMeta('og:description', 'Kiến thức làm đẹp và chăm sóc da chuyên sâu từ Lan Anh Beauty.', 'property');
    updateMeta('og:type', 'website', 'property');
    updateMeta('og:url', canonical, 'property');
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', document.title);
    updateMeta('twitter:description', 'Kiến thức làm đẹp và chăm sóc da chuyên sâu từ Lan Anh Beauty.');
    updateCanonical(canonical);
    return () => {
      document.title = previousTitle;
      document.head.querySelector('link[rel="canonical"]')?.remove();
    };
  }, [searchParam]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/blog/categories`)
      .then((res) => res.json())
      .then((result) => { if (!cancelled && result.success) setCategories(result.data || []); })
      .catch(() => { if (!cancelled) setCategories([]); });
    return () => { cancelled = true; };
  }, []);

  const fetchPostsDirect = async ({ categorySlug, q, sort, cursor, limit }) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set('categorySlug', categorySlug);
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));

    const res = await fetch(`${API_URL}/blog/posts?${params.toString()}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Không thể tải danh sách bài viết.');

    const payload = result.data || {};
    const items = Array.isArray(payload) ? payload : (payload.items || payload.posts || []);
    const pagination = payload.pagination || {};

    return {
      items,
      hasMore: Boolean(pagination.hasMore),
      nextCursor: pagination.nextCursor || null,
    };
  };

  // Initial fetch on category, searchParam, or sort change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setNextCursor(null);
    fetchPostsDirect({ categorySlug: selectedCategory, q: searchParam, sort, limit: pageSize })
      .then((result) => {
        if (cancelled) return;
        setPosts(result.items);
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'Không thể tải danh sách bài viết.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedCategory, searchParam, sort]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  const visibleCategories = useMemo(() => [{ id: 'all', slug: '', name: 'Tất cả' }, ...categories], [categories]);

  // Load more via Cursor Pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || !nextCursor) return;
    try {
      setLoadingMore(true);
      const result = await fetchPostsDirect({ categorySlug: selectedCategory, q: searchParam, sort, cursor: nextCursor, limit: pageSize });
      setPosts((current) => [...current, ...result.items]);
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải thêm bài viết.');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextCursor, selectedCategory, searchParam, sort]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.2, rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadMore]);

  return (
    <div className="min-h-screen bg-[var(--bg-silk)]">
      <section className="relative py-28 flex items-center justify-center px-5 overflow-hidden bg-center bg-cover bg-no-repeat min-h-[400px]" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E0B09]/85 via-[#1C1612]/88 to-[#1C1612]/95 flex flex-col items-center justify-center text-center px-5 pt-28 pb-14">
          <span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-3 z-10">Cẩm Nang Sắc Đẹp</span>
          <h1 className="font-serif text-[2.5rem] md:text-[3.8rem] leading-[1.15] text-white mb-4 z-10 font-bold drop-shadow-lg">Bài Viết &amp; Bí Quyết</h1>
          <p className="text-[1.1rem] text-white/85 max-w-[720px] z-10 leading-[1.75]">Cập nhật những xu hướng làm đẹp chuẩn khoa học, mẹo chăm sóc da tại nhà và tư vấn chuyên sâu từ bác sĩ Lan Anh Beauty.</p>
        </div>
      </section>

      <section className="py-16 max-w-[1560px] mx-auto px-5">
        <div className="flex flex-col lg:flex-row gap-4 mb-12 items-stretch lg:items-center">
          <div className="flex flex-wrap gap-3 flex-1">
            {visibleCategories.map((category) => (
              <button key={category.id} type="button" onClick={() => updateFilter('category', category.slug)} className={`border rounded-none px-4 py-3 text-left transition-all ${selectedCategory === category.slug ? 'border-[var(--primary-gold)] bg-white shadow-[var(--shadow-luxury)]' : 'border-[var(--border-silk-light)] bg-white/70 hover:border-[var(--primary-gold)]'}`}>
                <strong className="text-base text-[var(--text-main)] font-serif">{category.name}</strong>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm bài viết..."
              className="border border-[var(--border-silk)] bg-white px-4 py-3 min-w-0 w-full lg:w-64 rounded-lg focus:outline-none focus:border-[#775932]"
            />
            <select value={sort} onChange={(event) => updateFilter('sort', event.target.value)} className="border border-[var(--border-silk)] bg-white px-3 py-3 text-sm rounded-lg">
              <option value="newest">Mới nhất</option>
              <option value="popular">Xem nhiều</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </div>
        </div>

        <div className="text-center max-w-[760px] mx-auto mb-12">
          <span className="eyebrow-badge mb-3 rounded-none">Chuyên Mục Nổi Bật</span>
          <h2 className="text-[2.4rem] text-[var(--text-main)] mb-3 font-serif font-bold">Kiến Thức Chăm Sóc Da</h2>
          <p className="text-[var(--text-muted)] leading-[1.7]">Khám phá các bài viết hữu ích giúp bạn thấu hiểu làn da và duy trì diện mạo rạng rỡ nhất.</p>
        </div>

        {loading ? <div className="text-center py-16 text-[var(--text-muted)]">Đang tải bài viết...</div> : error ? <div className="text-center py-16 text-red-700">{error}</div> : posts.length === 0 ? <div className="text-center py-16 text-[var(--text-muted)]">Chưa có bài viết phù hợp.</div> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {posts.map((post) => (
              <article key={post.id || post.slug} className="bg-white rounded-none overflow-hidden border border-[var(--border-silk)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-luxury)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
                <div className="relative h-[200px] w-full overflow-hidden bg-stone-100">
                  <Link to={`/blog/${post.slug}`}><img src={getPostImage(post)} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" /></Link>
                  <div className="absolute top-3 left-3 bg-[var(--primary-gold)] text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wide">{post.categoryName || post.category?.name || 'Bài viết'}</div>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg text-[var(--text-main)] mb-2 line-clamp-2 font-serif font-bold leading-snug"><Link to={`/blog/${post.slug}`} className="hover:text-[var(--primary-gold-dark)] transition-colors">{post.title}</Link></h3>
                  <div className="flex flex-wrap items-center text-[11px] text-[var(--primary-gold-dark)] font-semibold mb-3 gap-x-3 gap-y-1">
                    <span><CalendarIcon className="w-3 h-3 mr-1 inline-block" />{formatDate(post.publishedAt)}</span>
                    <span><PencilSquareIcon className="w-3 h-3 mr-1 inline-block" />{post.authorName || post.author?.fullName || 'Lan Anh Beauty'}</span>
                    {post.readingTimeMinutes && (
                      <span><ClockIcon className="w-3 h-3 mr-1 inline-block text-[var(--primary-gold-dark)]" />{post.readingTimeMinutes} phút đọc</span>
                    )}
                  </div>
                  <p className="text-[var(--text-muted)] text-sm leading-[1.6] line-clamp-3 flex-grow">{post.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Infinite Scroll Sentinel */}
        <div ref={sentinelRef} className="h-12 flex items-center justify-center my-6">
          {loadingMore && <div className="text-sm text-[var(--text-muted)] font-medium">Đang tự động cuộn &amp; tải thêm bài viết...</div>}
        </div>

        {hasMore && !loadingMore && (
          <div className="mt-6 text-center">
            <button type="button" onClick={loadMore} className="btn-luxury-secondary rounded-none">
              Tải thêm bài viết
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
