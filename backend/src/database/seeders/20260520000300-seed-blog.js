import { QueryTypes } from 'sequelize';

const categories = [
  { name: 'Chăm sóc da', slug: 'cham-soc-da', description: 'Kiến thức chăm sóc và phục hồi làn da.', sortOrder: 1 },
  { name: 'Mỹ phẩm', slug: 'my-pham', description: 'Tư vấn lựa chọn và sử dụng mỹ phẩm.', sortOrder: 2 },
  { name: 'Xu hướng', slug: 'xu-huong', description: 'Cập nhật xu hướng làm đẹp mới.', sortOrder: 3 },
  { name: 'Spa & Thư giãn', slug: 'spa-thu-gian', description: 'Bí quyết thư giãn và chăm sóc cơ thể.', sortOrder: 4 },
  { name: 'Dinh dưỡng', slug: 'dinh-duong', description: 'Dinh dưỡng hỗ trợ làn da khỏe đẹp.', sortOrder: 5 },
];

const posts = [
  {
    categorySlug: 'cham-soc-da',
    title: '5 Bước Chăm Sóc Da Ban Đêm Không Thể Bỏ Qua',
    slug: '5-buoc-cham-soc-da-ban-dem',
    excerpt: 'Khám phá quy trình chăm sóc da ban đêm giúp phục hồi và mang lại làn da tươi trẻ.',
    content: 'Một quy trình chăm sóc da ban đêm đều đặn giúp làm sạch, cấp ẩm và hỗ trợ làn da phục hồi sau một ngày dài. Hãy bắt đầu từ những bước cơ bản và lắng nghe nhu cầu của làn da.',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=600&auto=format&fit=crop',
    readingTimeMinutes: 5,
    sortOrder: 1,
  },
  {
    categorySlug: 'my-pham',
    title: 'Bí Quyết Chọn Mỹ Phẩm Phù Hợp Với Từng Loại Da',
    slug: 'bi-quyet-chon-my-pham',
    excerpt: 'Cách nhận biết loại da và chọn sản phẩm phù hợp để chăm sóc da hiệu quả hơn.',
    content: 'Mỗi loại da có nhu cầu khác nhau. Việc xác định tình trạng da, đọc bảng thành phần và thử sản phẩm trước khi dùng thường xuyên là những nguyên tắc quan trọng khi chọn mỹ phẩm.',
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?q=80&w=600&auto=format&fit=crop',
    readingTimeMinutes: 5,
    sortOrder: 2,
  },
  {
    categorySlug: 'xu-huong',
    title: 'Xu Hướng Làm Đẹp Nổi Bật Nhất Năm Nay',
    slug: 'xu-huong-lam-dep-noi-bat',
    excerpt: 'Điểm qua những xu hướng trang điểm và làm đẹp đang được yêu thích.',
    content: 'Làm đẹp hiện đại hướng đến vẻ ngoài tự nhiên, khỏe mạnh và phù hợp với cá tính. Cùng cập nhật những xu hướng nổi bật để tìm cảm hứng cho phong cách của bạn.',
    imageUrl: 'https://images.unsplash.com/photo-1512496115851-a1c8e04d244f?q=80&w=600&auto=format&fit=crop',
    readingTimeMinutes: 4,
    sortOrder: 3,
  },
  {
    categorySlug: 'spa-thu-gian',
    title: 'Liệu Trình Massage Thư Giãn Đánh Bay Căng Thẳng',
    slug: 'lieu-trinh-massage-thu-gian',
    excerpt: 'Massage giúp cơ thể thư giãn, cải thiện tuần hoàn và tái tạo năng lượng.',
    content: 'Sau những ngày làm việc căng thẳng, một liệu trình massage phù hợp có thể giúp cơ thể thả lỏng và tinh thần dễ chịu hơn. Hãy lựa chọn không gian uy tín và kỹ thuật viên giàu kinh nghiệm.',
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop',
    readingTimeMinutes: 4,
    sortOrder: 4,
  },
  {
    categorySlug: 'dinh-duong',
    title: 'Ăn Gì Để Có Làn Da Sáng Khỏe Từ Bên Trong?',
    slug: 'an-gi-de-co-lan-da-sang-khoe',
    excerpt: 'Những nhóm thực phẩm hỗ trợ sức khỏe làn da và thói quen ăn uống nên duy trì.',
    content: 'Làn da khỏe cần được chăm sóc cả bên ngoài lẫn bên trong. Một chế độ ăn đa dạng, đủ nước, giàu rau xanh và trái cây sẽ hỗ trợ cơ thể duy trì vẻ tươi sáng tự nhiên.',
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop',
    readingTimeMinutes: 4,
    sortOrder: 5,
  },
  {
    categorySlug: 'cham-soc-da',
    title: 'Cách Xử Lý Mụn Sưng Viêm Tại Nhà An Toàn',
    slug: 'cach-xu-ly-mun-sung-viem',
    excerpt: 'Hướng dẫn chăm sóc nốt mụn sưng viêm đúng cách để hạn chế thâm sẹo.',
    content: 'Khi xuất hiện mụn sưng viêm, không tự ý nặn hoặc chà xát mạnh lên da. Làm sạch dịu nhẹ, giữ vệ sinh và tìm tư vấn chuyên môn khi tình trạng kéo dài là lựa chọn an toàn hơn.',
    imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=600&auto=format&fit=crop',
    readingTimeMinutes: 5,
    sortOrder: 6,
  },
];

export default {
  async up(queryInterface) {
    const now = new Date();
    const categorySlugs = categories.map((category) => category.slug);
    const existingCategories = await queryInterface.sequelize.query(
      'SELECT id, slug FROM blog_categories WHERE slug IN (:slugs)',
      { replacements: { slugs: categorySlugs }, type: QueryTypes.SELECT },
    );
    const existingCategorySlugs = new Set(existingCategories.map((category) => category.slug));
    const missingCategories = categories.filter((category) => !existingCategorySlugs.has(category.slug));

    // Seed only missing records. Deployments run all seeders repeatedly, so this
    // must not delete or overwrite content managed by an administrator.
    if (missingCategories.length > 0) {
      await queryInterface.bulkInsert('blog_categories', missingCategories.map((category) => ({
        ...category,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })));
    }

    const rows = await queryInterface.sequelize.query(
      'SELECT id, slug FROM blog_categories WHERE slug IN (:slugs)',
      { replacements: { slugs: categorySlugs }, type: QueryTypes.SELECT },
    );
    const categoryIds = Object.fromEntries(rows.map((row) => [row.slug, row.id]));
    const postSlugs = posts.map((post) => post.slug);
    const existingPosts = await queryInterface.sequelize.query(
      'SELECT slug FROM blog_posts WHERE slug IN (:slugs)',
      { replacements: { slugs: postSlugs }, type: QueryTypes.SELECT },
    );
    const existingPostSlugs = new Set(existingPosts.map((post) => post.slug));
    const missingPosts = posts.filter((post) => !existingPostSlugs.has(post.slug));

    if (missingPosts.length > 0) {
      await queryInterface.bulkInsert('blog_posts', missingPosts.map((post) => ({
        categoryId: categoryIds[post.categorySlug] || null,
        authorId: null,
        authorName: 'Lan Anh',
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        imageUrl: post.imageUrl,
        status: 'PUBLISHED',
        publishedAt: now,
        isFeatured: post.sortOrder <= 3,
        readingTimeMinutes: post.readingTimeMinutes,
        viewCount: 0,
        sortOrder: post.sortOrder,
        createdAt: now,
        updatedAt: now,
      })));
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('blog_posts', { slug: posts.map((post) => post.slug) });
    await queryInterface.bulkDelete('blog_categories', { slug: categories.map((category) => category.slug) });
  },
};
