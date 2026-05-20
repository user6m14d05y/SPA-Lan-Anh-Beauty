import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import heroImg from '../../assets/images/hero.png';

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

  const handleLoadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Đã tải thêm bài viết (Giả lập)');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#fff8f5]">
      {/* Hero Section */}
      <section 
        className="relative h-[50vh] flex items-center justify-center px-5 overflow-hidden bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#fff8f5] to-[rgba(255,248,245,0.7)] flex flex-col items-center justify-center text-center px-5">
          <h1 className="font-serif text-[2.5rem] md:text-[3.5rem] leading-[1.2] text-gray-800 mb-4 z-10" style={{ fontFamily: "'Playfair Display', serif" }}>
            Blog & Tin Tức
          </h1>
          <p className="text-[1.1rem] text-gray-600 max-w-[700px] z-10 leading-[1.6]">
            Cập nhật những xu hướng làm đẹp mới nhất, mẹo chăm sóc da và thông tin hữu ích từ các chuyên gia của Lan Anh Beauty.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 max-w-[1400px] mx-auto px-5">
        
        {/* Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-14">
          {['Tất cả', 'Chăm sóc da', 'Mỹ phẩm', 'Xu hướng', 'Gội đầu'].map((cat, idx) => (
            <div 
              key={idx} 
              className={`border rounded-[18px] cursor-pointer p-5 text-left transition-all duration-300 shadow-[0_8px_20px_rgba(119,89,50,0.04)] ${
                idx === 0 
                  ? 'border-[#775932] bg-[#775932]/10 transform -translate-y-1' 
                  : 'border-[#775932]/20 bg-white hover:border-[#775932] hover:bg-[#775932]/10 hover:-translate-y-1'
              }`}
            >
              <span className="block text-[#775932] text-xs font-extrabold tracking-[1.5px] uppercase mb-2">
                {idx === 0 ? 'TẤT CẢ' : 'DANH MỤC'}
              </span>
              <strong className="block text-xl leading-[1.25] text-gray-800 mb-2.5" style={{ fontFamily: "'Playfair Display', serif" }}>
                {cat}
              </strong>
              <small className="text-gray-500 font-semibold">{posts.length} bài viết</small>
            </div>
          ))}
        </div>

        {/* Section Header */}
        <div className="text-center max-w-[760px] mx-auto mb-10">
          <h2 className="text-[2.4rem] text-gray-800 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Bài viết mới nhất
          </h2>
          <p className="text-gray-500 leading-[1.7]">
            Khám phá các bí quyết làm đẹp toàn diện, kết hợp giữa kỹ thuật tinh xảo và dòng sản phẩm cao cấp nhất.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {posts.map((post) => (
            <article 
              key={post.id} 
              className="bg-white rounded-xl overflow-hidden flex flex-col group transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(119,89,50,0.1)] border border-transparent hover:border-[#775932]/10"
            >
              {/* Thumbnail */}
              <div className="relative h-[300px] w-full overflow-hidden">
                <Link to={`/blog/${post.slug}`}>
                  <img 
                    src={post.imageUrl} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <div className="absolute top-4 left-4 bg-white/95 text-[#775932] text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col flex-grow">
                {/* Title */}
                <h3 className="text-[1.5rem] text-gray-800 mb-4 line-clamp-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  <Link to={`/blog/${post.slug}`} className="hover:text-[#775932] transition-colors">
                    {post.title}
                  </Link>
                </h3>

                {/* Meta info */}
                <div className="flex items-center text-sm text-[#775932] font-semibold mb-6 space-x-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {post.date}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    {post.author}
                  </span>
                </div>

                {/* Excerpt */}
                <p className="text-gray-500 leading-[1.6] mb-8 line-clamp-3 flex-grow">
                  {post.excerpt}
                </p>

                {/* Action */}
                <div className="mt-auto">
                  <Link 
                    to={`/blog/${post.slug}`} 
                    className="inline-block w-[calc(50%-6px)] text-center py-3 px-[18px] border border-[#775932] bg-[#775932] text-white uppercase tracking-[1px] text-[0.78rem] font-semibold rounded-md transition-all duration-300 hover:bg-gray-800 hover:border-gray-800"
                  >
                    Xem Chi Tiết
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-16 text-center">
          <button 
            onClick={handleLoadMore}
            disabled={loading}
            className="inline-block py-4 px-10 border border-[#775932] text-[#775932] uppercase tracking-[2px] text-[0.9rem] font-semibold rounded-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.1)] bg-white disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang tải...' : 'Tải Thêm Bài Viết'}
          </button>
        </div>

      </section>
    </div>
  );
}
