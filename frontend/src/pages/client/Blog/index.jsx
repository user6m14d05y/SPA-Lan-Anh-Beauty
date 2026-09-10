import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, PencilSquareIcon, ArrowUpRightIcon } from '../../../icons';
import heroImg from '../../../assets/images/hero.png';

const mockBlogPosts = [
  {
    id: 1,
    title: '5 Bước Chăm Sóc Da Ban Đêm Không Thể Bỏ Qua',
    excerpt: 'Khám phá quy trình chăm sóc da ban đêm giúp phục hồi và mang lại làn da tươi trẻ, rạng rỡ vào sáng hôm sau. Đừng bỏ lỡ những bước quan trọng này.',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
    category: 'Chăm sóc da',
    date: '20/05/2026',
    author: 'Lan Anh',
    slug: '5-buoc-cham-soc-da-ban-dem'
  },
  {
    id: 2,
    title: 'Bí Quyết Chọn Mỹ Phẩm Phù Hợp Với Từng Loại Da',
    excerpt: 'Việc lựa chọn mỹ phẩm phù hợp với làn da của bạn là vô cùng quan trọng. Hãy cùng tìm hiểu cách nhận biết loại da và chọn sản phẩm tốt nhất.',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?q=80&w=600&auto=format&fit=crop',
    category: 'Mỹ phẩm',
    date: '18/05/2026',
    author: 'Lan Anh',
    slug: 'bi-quyet-chon-my-pham'
  },
  {
    id: 3,
    title: 'Xu Hướng Làm Đẹp Nổi Bật Nhất Năm Nay',
    excerpt: 'Điểm qua những xu hướng trang điểm và làm đẹp đang làm mưa làm gió trên các sàn diễn thời trang và mạng xã hội. Cập nhật ngay để không bị lỗi thời.',
    imageUrl: 'https://images.unsplash.com/photo-1512496115851-a1c8e04d244f?q=80&w=600&auto=format&fit=crop',
    category: 'Xu hướng',
    date: '15/05/2026',
    author: 'Chuyên gia',
    slug: 'xu-huong-lam-dep-noi-bat'
  },
  {
    id: 4,
    title: 'Liệu Trình Massage Thư Giãn Đánh Bay Căng Thẳng',
    excerpt: 'Massage không chỉ giúp cơ thể thư giãn mà còn cải thiện tuần hoàn máu, mang lại sự tươi mới cho tinh thần và làn da sau những ngày làm việc mệt mỏi.',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop',
    category: 'Spa & Thư giãn',
    date: '10/05/2026',
    author: 'Lan Anh',
    slug: 'lieu-trinh-massage-thu-gian'
  },
  {
    id: 5,
    title: 'Ăn Gì Để Có Làn Da Sáng Khỏe Từ Bên Trong?',
    excerpt: 'Chế độ dinh dưỡng đóng vai trò quan trọng đối với sức khỏe làn da. Khám phá những thực phẩm tốt nhất cho da giúp bạn luôn tỏa sáng.',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop',
    category: 'Dinh dưỡng',
    date: '05/05/2026',
    author: 'Bác sĩ Da liễu',
    slug: 'an-gi-de-co-lan-da-sang-khoe'
  },
  {
    id: 6,
    title: 'Cách Xử Lý Mụn Sưng Viêm Tại Nhà An Toàn',
    excerpt: 'Hướng dẫn chi tiết cách chăm sóc và xử lý các nốt mụn sưng viêm hiệu quả mà không để lại thâm sẹo, trả lại làn da mịn màng cho bạn.',
    imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop',
    category: 'Điều trị mụn',
    date: '01/05/2026',
    author: 'Chuyên gia',
    slug: 'cach-xu-ly-mun-sung-viem'
  }
];

export default function Blog() {
  const [posts] = useState(mockBlogPosts);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const filteredPosts = selectedCategory === 'Tất cả'
    ? posts
    : posts.filter((p) => p.category === selectedCategory || (selectedCategory === 'Gội đầu' && p.category.includes('Spa')));

  const handleLoadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Đã tải thêm bài viết');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-silk)]">
      {/* Hero Section */}
      <section 
        className="relative py-28 flex items-center justify-center px-5 overflow-hidden bg-center bg-cover bg-no-repeat min-h-[400px]"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E0B09]/85 via-[#1C1612]/88 to-[#1C1612]/95 flex flex-col items-center justify-center text-center px-5 pt-28 pb-14">
          <span className="eyebrow-badge bg-white/20 text-white border-white/30 mb-3 z-10">Cẩm Nang Sắc Đẹp</span>
          <h1 className="font-serif text-[2.5rem] md:text-[3.8rem] leading-[1.15] text-white mb-4 z-10 font-bold drop-shadow-lg">
            Bài Viết & Bí Quyết
          </h1>
          <p className="text-[1.1rem] text-white/85 max-w-[720px] z-10 leading-[1.75]">
            Cập nhật những xu hướng làm đẹp chuẩn khoa học, mẹo chăm sóc da tại nhà và tư vấn chuyên sâu từ bác sĩ Lan Anh Beauty.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 max-w-[1560px] mx-auto px-5">
        
        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-14">
          {['Tất cả', 'Chăm sóc da', 'Mỹ phẩm', 'Xu hướng', 'Gội đầu'].map((cat) => (
            <button 
              key={cat} 
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`border rounded-[20px] p-5 text-left transition-all duration-300 ${
                selectedCategory === cat 
                  ? 'border-[var(--primary-gold)] bg-white shadow-[var(--shadow-luxury)] transform -translate-y-1' 
                  : 'border-[var(--border-silk-light)] bg-white/70 hover:border-[var(--primary-gold)] hover:bg-white hover:-translate-y-1'
              }`}
            >
              <span className="block text-[var(--primary-gold-dark)] text-xs font-bold tracking-[1.5px] uppercase mb-2">
                {cat === 'Tất cả' ? 'TẤT CẢ' : 'DANH MỤC'}
              </span>
              <strong className="block text-lg leading-[1.25] text-[var(--text-main)] mb-2 font-serif font-bold">
                {cat}
              </strong>
              <small className="text-[var(--text-muted)] font-medium">Khám phá ↗</small>
            </button>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-12">
          <span className="eyebrow-badge mb-3">Chuyên Mục Nổi Bật</span>
          <h2 className="text-[2.4rem] text-[var(--text-main)] mb-3 font-serif font-bold">
            Kiến Thức Chăm Sóc Da
          </h2>
          <p className="text-[var(--text-muted)] leading-[1.7]">
            Khám phá các bài viết hữu ích giúp bạn thấu hiểu làn da và duy trì diện mạo rạng rỡ nhất.
          </p>
        </div>

        {/* Blog Grid - 5 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {filteredPosts.map((post) => (
            <article 
              key={post.id} 
              className="bg-white rounded-[18px] overflow-hidden border border-[var(--border-silk)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-luxury)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
            >
              {/* Thumbnail */}
              <div className="relative h-[180px] w-full overflow-hidden bg-stone-100">
                <Link to={`/blog`}>
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </Link>
                <div className="absolute top-3 left-3 bg-[var(--primary-gold)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md uppercase tracking-wide">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5 flex flex-col flex-grow">
                {/* Title */}
                <h3 className="text-base text-[var(--text-main)] mb-2 line-clamp-2 font-serif font-bold leading-snug">
                  <Link to={`/blog`} className="hover:text-[var(--primary-gold-dark)] transition-colors">
                    {post.title}
                  </Link>
                </h3>

                {/* Meta info */}
                <div className="flex items-center text-[11px] text-[var(--primary-gold-dark)] font-semibold mb-3 space-x-3">
                  <span className="flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1 inline-block" />
                    {post.date}
                  </span>
                  <span className="flex items-center">
                    <PencilSquareIcon className="w-3 h-3 mr-1 inline-block" />
                    {post.author}
                  </span>
                </div>

                {/* Excerpt */}
                <p className="text-[var(--text-muted)] text-xs leading-[1.6] mb-4 line-clamp-2 flex-grow">
                  {post.excerpt}
                </p>

                {/* Action */}
                <div className="mt-auto pt-3 border-t border-[var(--border-silk-light)] flex items-center justify-between">
                  <Link 
                    to={`/blog`} 
                    className="btn-luxury-secondary text-[11px] px-3 py-1.5 whitespace-nowrap inline-flex items-center"
                  >
                    <span>Đọc bài</span>
                    <ArrowUpRightIcon className="w-3 h-3 ml-0.5" />
                  </Link>
                  <span className="text-[11px] text-[var(--text-light)]">5 phút</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-16 text-center">
          <button 
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="btn-luxury-secondary"
          >
            {loading ? 'Đang Tải...' : 'Tải Thêm Bài Viết Kinh Nghiệm'}
          </button>
        </div>

      </section>
    </div>
  );
}

