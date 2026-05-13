const categories = [
  {
    name: 'Phun xăm',
    slug: 'phun-xam',
    description: 'Dịch vụ phun xăm thẩm mỹ cho chân mày, môi và đường nét khuôn mặt.',
    sortOrder: 1,
    children: [
      {
        name: 'Chân mày',
        slug: 'chan-may',
        description: 'Các dịch vụ tạo dáng và làm đẹp chân mày.',
        sortOrder: 1,
      },
      {
        name: 'Môi',
        slug: 'moi',
        description: 'Các dịch vụ phun môi và xử lý sắc tố môi.',
        sortOrder: 2,
      },
    ],
  },
  {
    name: 'Trị liệu cổ vai gáy',
    slug: 'tri-lieu-co-vai-gay',
    description: 'Liệu trình thư giãn và hỗ trợ giảm căng cứng vùng cổ vai gáy.',
    sortOrder: 2,
  },
  {
    name: 'Chăm sóc da',
    slug: 'cham-soc-da',
    description: 'Chăm sóc, phục hồi và cải thiện các vấn đề về da.',
    sortOrder: 3,
  },
  {
    name: 'Gội đầu',
    slug: 'goi-dau',
    description: 'Gội đầu dưỡng sinh kết hợp thư giãn đầu, cổ và vai gáy.',
    sortOrder: 4,
  },
  {
    name: 'Uốn mi',
    slug: 'uon-mi',
    description: 'Làm đẹp mi tự nhiên, giữ nếp cong mềm mại.',
    sortOrder: 5,
  },
  {
    name: 'Laser',
    slug: 'laser',
    description: 'Dịch vụ laser thẩm mỹ, triệt lông và hỗ trợ cải thiện da.',
    sortOrder: 6,
    children: [
      {
        name: 'Triệt lông',
        slug: 'triet-long',
        description: 'Triệt lông công nghệ cao cho nhiều vùng cơ thể.',
        sortOrder: 1,
      },
      {
        name: 'Trẻ hóa và điều trị da',
        slug: 'tre-hoa-va-dieu-tri-da',
        description: 'Laser trẻ hóa, cải thiện thâm nám và sắc tố da.',
        sortOrder: 2,
      },
    ],
  },
  {
    name: 'Massage thư giãn',
    slug: 'massage-thu-gian',
    description: 'Massage body, đá nóng, tinh dầu và foot thư giãn.',
    sortOrder: 7,
  },
];

export default {
  async up(queryInterface) {
    const now = new Date();

    for (const category of categories) {
      await queryInterface.bulkInsert('service_categories', [{
        parentId: null,
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }]);

      if (!category.children?.length) continue;

      const [parents] = await queryInterface.sequelize.query(
        'SELECT id FROM service_categories WHERE slug = :slug LIMIT 1',
        { replacements: { slug: category.slug } },
      );
      const parentId = parents[0].id;

      await queryInterface.bulkInsert('service_categories', category.children.map((child) => ({
        parentId,
        name: child.name,
        slug: child.slug,
        description: child.description,
        sortOrder: child.sortOrder,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })));
    }
  },

  async down(queryInterface) {
    const slugs = categories.flatMap((category) => [
      category.slug,
      ...(category.children || []).map((child) => child.slug),
    ]);

    await queryInterface.bulkDelete('service_categories', { slug: slugs });
  },
};
