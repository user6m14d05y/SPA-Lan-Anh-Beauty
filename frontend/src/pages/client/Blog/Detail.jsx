import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import heroImg from '../../../assets/images/hero.png';
import { API_URL, ASSET_URL } from '../../../config';
import { ArrowLeftIcon, CalendarIcon, PencilSquareIcon } from '../../../icons';

const getDetailImage = (post) => {
  const url = post?.coverImageUrl || post?.imageUrl;
  if (!url) return heroImg;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${ASSET_URL}${url}`;
};


const formatDate = (value) => value ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : 'Chưa cập nhật';

const setMeta = (name, content, attribute = 'name') => {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const setCanonical = (href) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

const removeMeta = (name, attribute = 'name') => {
  document.head.querySelector(`meta[${attribute}="${name}"]`)?.remove();
};

const removeCanonical = () => {
  document.head.querySelector('link[rel="canonical"]')?.remove();
};

const setJsonLd = (post, url) => {
  const existing = document.head.querySelector('script[data-seo="blog-detail"]');
  if (existing) existing.remove();
  if (!post) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.dataset.seo = 'blog-detail';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.coverImageUrl || undefined,
    datePublished: post.publishedAt || undefined,
    author: { '@type': 'Person', name: post.authorName || 'Lan Anh Beauty' },
    publisher: { '@type': 'Organization', name: 'Lan Anh Beauty' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
  document.head.appendChild(script);
};

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let previousTitle = document.title;
    setLoading(true);
    setError('');
    fetch(`${API_URL}/blog/posts/${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (cancelled) return;
        if (!resData.success || !resData.data) {
          throw new Error(resData.message || 'Không tìm thấy bài viết.');
        }
        const result = resData.data;
        setPost(result);
        const canonical = `${window.location.origin}/blog/${result.slug}`;
        previousTitle = `${result.title} | Lan Anh Beauty`;
        document.title = previousTitle;
        setMeta('description', result.excerpt || result.title);
        setMeta('og:title', previousTitle, 'property');
        setMeta('og:description', result.excerpt || result.title, 'property');
        setMeta('og:type', 'article', 'property');
        setMeta('og:url', canonical, 'property');
        if (result.coverImageUrl) setMeta('og:image', result.coverImageUrl, 'property');
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', previousTitle);
        setMeta('twitter:description', result.excerpt || result.title);
        setCanonical(canonical);
        setJsonLd(result, canonical);

        fetch(`${API_URL}/blog/posts/${encodeURIComponent(result.slug)}/view`, { method: 'POST' })
          .then((res) => res.json())
          .then((viewData) => {
            if (!cancelled && viewData.success && viewData.data && Number.isFinite(Number(viewData.data.viewCount))) {
              setPost((current) => current ? { ...current, viewCount: Number(viewData.data.viewCount) } : current);
            }
          })
          .catch(() => {});
      })
      .catch((requestError) => { if (!cancelled) setError(requestError.message || 'Không thể tải bài viết.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      document.title = 'Cẩm Nang Làm Đẹp | Lan Anh Beauty';
      const seoScript = document.head.querySelector('script[data-seo="blog-detail"]');
      if (seoScript) seoScript.remove();
      ['description', 'twitter:card', 'twitter:title', 'twitter:description'].forEach((name) => removeMeta(name));
      ['og:title', 'og:description', 'og:type', 'og:url', 'og:image'].forEach((name) => removeMeta(name, 'property'));
      removeCanonical();
    };
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">Đang tải bài viết...</div>;
  if (error || !post) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]"><p>{error || 'Không tìm thấy bài viết.'}</p><Link to="/blog" className="btn-luxury-secondary">Quay lại cẩm nang</Link></div>;

  return (
    <article className="min-h-screen bg-[var(--bg-silk)] pb-20">
      <div className="relative h-[360px] md:h-[480px] overflow-hidden bg-[#1C1612]">
        <img src={getDetailImage(post)} alt={post.title} className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1612] via-[#1C1612]/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 max-w-[1000px] mx-auto px-5 pb-12 text-white"><span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-4">{post.categoryName}</span><h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight">{post.title}</h1></div>
      </div>
      <div className="max-w-[1000px] mx-auto px-5">
        <div className="flex flex-wrap items-center gap-4 py-6 text-sm text-[var(--primary-gold-dark)] font-semibold border-b border-[var(--border-silk)]"><span><CalendarIcon className="w-4 h-4 inline mr-1" />{formatDate(post.publishedAt)}</span><span><PencilSquareIcon className="w-4 h-4 inline mr-1" />{post.authorName}</span>{post.readingTimeMinutes ? <span>{post.readingTimeMinutes} phút đọc</span> : null}<span>{post.viewCount.toLocaleString('vi-VN')} lượt xem</span></div>
        {post.excerpt && <p className="font-serif text-xl leading-relaxed text-[var(--text-muted)] py-8">{post.excerpt}</p>}
        <div className="prose prose-lg max-w-none text-[var(--text-main)] leading-relaxed" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || '<p>Nội dung bài viết đang được cập nhật.</p>') }} />
        <Link to="/blog" className="inline-flex items-center gap-2 mt-12 text-[var(--primary-gold-dark)] font-semibold hover:underline"><ArrowLeftIcon className="w-5 h-5" /> Quay lại danh sách bài viết</Link>
      </div>
    </article>
  );
}
