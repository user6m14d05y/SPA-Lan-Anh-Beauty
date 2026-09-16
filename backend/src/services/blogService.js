import { Op } from 'sequelize';
import BlogCategory from '../models/BlogCategory.js';
import BlogPost from '../models/BlogPost.js';
import User from '../models/User.js';
import { createAppError } from './userService.js';
import sanitizeHtml from 'sanitize-html';
import elasticsearchService, { decodeCursor, encodeCursor } from './elasticsearchService.js';

const VALID_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const ALLOWED_HTML_TAGS = ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'blockquote', 'a', 'img'];
const sanitizeContent = (value) => sanitizeHtml(String(value || ''), {
  allowedTags: ALLOWED_HTML_TAGS,
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
});
const categoryOrder = [['sortOrder', 'ASC'], ['name', 'ASC']];
const newestOrder = [['isFeatured', 'DESC'], ['publishedAt', 'DESC'], ['sortOrder', 'ASC'], ['id', 'DESC']];
const oldestOrder = [['publishedAt', 'ASC'], ['sortOrder', 'ASC'], ['id', 'ASC']];
const popularOrder = [['viewCount', 'DESC'], ['publishedAt', 'DESC'], ['id', 'DESC']];

const generateSlug = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'd')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
};

const toInteger = (value, fieldName, { min = 0, max } = {}) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || (max !== undefined && parsed > max)) {
    throw createAppError(`${fieldName} không hợp lệ.`, 422);
  }
  return parsed;
};

const normalizeStatus = (value, defaultValue = 'DRAFT') => {
  const status = String(value || defaultValue).trim().toUpperCase();
  if (!VALID_STATUSES.includes(status)) throw createAppError('Trạng thái bài viết không hợp lệ.', 422);
  return status;
};

const includeOptions = (required = false, activeOnly = false) => [
  {
    model: BlogCategory,
    as: 'category',
    required: required || activeOnly,
    where: activeOnly ? { isActive: true } : undefined,
    attributes: ['id', 'name', 'slug', 'description'],
  },
  {
    model: User,
    as: 'author',
    required: false,
    attributes: ['id', 'fullName', 'email'],
  },
];

const serializeCategory = (category) => {
  if (!category) return null;
  return typeof category.toJSON === 'function' ? category.toJSON() : category;
};

const serializePost = (post, { includeContent = true } = {}) => {
  const plain = typeof post.toJSON === 'function' ? post.toJSON() : { ...post };
  if (!includeContent) delete plain.content;
  plain.category = serializeCategory(plain.category);
  plain.categoryName = plain.categoryName || plain.category?.name || null;
  plain.categorySlug = plain.categorySlug || plain.category?.slug || null;
  plain.author = plain.author || (plain.authorName ? { fullName: plain.authorName } : null);
  return plain;
};

const validateCategoryPayload = async (payload, existingId = null) => {
  const name = payload.name?.trim();
  const slug = (payload.slug?.trim() || generateSlug(name)).toLowerCase();
  const sortOrder = toInteger(payload.sortOrder, 'Thứ tự hiển thị', { min: 0 }) ?? 0;

  if (!name || name.length < 2 || name.length > 150) {
    throw createAppError('Tên chuyên mục phải từ 2 đến 150 ký tự.', 422);
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    throw createAppError('Slug chuyên mục chỉ được gồm chữ thường, số và dấu gạch ngang.', 422);
  }

  const existed = await BlogCategory.findOne({ where: { slug } });
  if (existed && existed.id !== existingId) throw createAppError('Slug chuyên mục đã tồn tại.', 409);

  return {
    name,
    slug,
    description: payload.description?.trim() || null,
    sortOrder,
    isActive: toBoolean(payload.isActive, true),
  };
};

const validatePostPayload = async (payload, existingId = null) => {
  const title = payload.title?.trim();
  const slug = (payload.slug?.trim() || generateSlug(title)).toLowerCase();
  const content = sanitizeContent(payload.content?.trim());
  const excerpt = payload.excerpt?.trim() || content?.replace(/<[^>]*>/g, '').slice(0, 240) || null;
  const status = normalizeStatus(payload.status);
  const readingTimeMinutes = toInteger(payload.readingTimeMinutes ?? payload.readingTime, 'Thời gian đọc', { min: 1, max: 120 }) ?? 5;
  const sortOrder = toInteger(payload.sortOrder, 'Thứ tự hiển thị', { min: 0 }) ?? 0;
  const categoryId = toInteger(payload.categoryId, 'Chuyên mục', { min: 1 });

  if (!title || title.length < 5 || title.length > 255) throw createAppError('Tiêu đề phải từ 5 đến 255 ký tự.', 422);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw createAppError('Slug chỉ được gồm chữ thường, số và dấu gạch ngang.', 422);
  if (!content || content.length < 20) throw createAppError('Nội dung bài viết phải có ít nhất 20 ký tự.', 422);
  if (excerpt && excerpt.length > 1000) throw createAppError('Mô tả ngắn không được vượt quá 1000 ký tự.', 422);

  if (categoryId) {
    const category = await BlogCategory.findByPk(categoryId);
    if (!category) throw createAppError('Chuyên mục bài viết không tồn tại.', 404);
  }

  const existed = await BlogPost.findOne({ where: { slug } });
  if (existed && existed.id !== existingId) throw createAppError('Slug bài viết đã tồn tại.', 409);

  return {
    categoryId,
    title,
    slug,
    excerpt,
    content,
    imageUrl: validateImageUrl(payload.imageUrl || payload.coverImageUrl),
    status,
    publishedAt: status === 'PUBLISHED' ? (payload.publishedAt || new Date()) : null,
    isFeatured: toBoolean(payload.isFeatured),
    readingTimeMinutes,
    sortOrder,
  };
};

const validateImageUrl = (value) => {
  if (!value) return null;
  const imageUrl = String(value).trim();
  const isHttpUrl = /^https?:\/\/[^\s]+$/i.test(imageUrl);
  const isUploadPath = /^\/uploads\/[^\s]+$/i.test(imageUrl);
  if (!isHttpUrl && !isUploadPath) {
    throw createAppError('Ảnh đại diện phải là URL http(s) hoặc đường dẫn /uploads/.', 422);
  }
  return imageUrl;
};

const publicWhere = () => ({
  status: 'PUBLISHED',
  publishedAt: { [Op.lte]: new Date() },
});

export const blogService = {
  async getCategories({ includeInactive = false } = {}) {
    return BlogCategory.findAll({
      where: includeInactive ? {} : { isActive: true },
      order: categoryOrder,
    });
  },

  async createCategory(payload) {
    return BlogCategory.create(await validateCategoryPayload(payload));
  },

  async updateCategory(id, payload) {
    const category = await BlogCategory.findByPk(id);
    if (!category) throw createAppError('Không tìm thấy chuyên mục.', 404);
    await category.update(await validateCategoryPayload(payload, category.id));
    return category;
  },

  async deleteCategory(id) {
    const category = await BlogCategory.findByPk(id);
    if (!category) throw createAppError('Không tìm thấy chuyên mục.', 404);
    const postCount = await BlogPost.count({ where: { categoryId: category.id } });
    if (postCount > 0) throw createAppError('Không thể xóa chuyên mục đang có bài viết. Hãy vô hiệu hóa thay vì xóa.', 409);
    await category.destroy();
  },

  async getPosts({ categorySlug, category, search, q, featured, sort = 'newest', status, cursor, page, limit = 10, includeDrafts = false } = {}) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const requestedCategory = categorySlug || category;
    const requestedSearch = (search || q || '').trim();

    // 1. Try Elasticsearch first for public requests
    if (!includeDrafts && !featured) {
      const esResult = await elasticsearchService.searchPostsWithCursor({
        q: requestedSearch,
        categorySlug: requestedCategory,
        sort,
        cursor,
        limit: parsedLimit,
      });
      if (esResult) {
        return esResult;
      }
    }

    // 2. Fallback to DB query with cursor / page support
    const normalizedSort = String(sort || 'newest').toLowerCase();
    const where = includeDrafts ? {} : publicWhere();
    if (includeDrafts && status) where.status = normalizeStatus(status);
    const categoryWhere = requestedCategory ? { slug: String(requestedCategory).trim(), ...(includeDrafts ? {} : { isActive: true }) } : undefined;

    if (featured !== undefined) where.isFeatured = toBoolean(featured);
    if (requestedSearch) {
      const query = `%${requestedSearch}%`;
      const searchOr = [
        { title: { [Op.like]: query } },
        { excerpt: { [Op.like]: query } },
        { content: { [Op.like]: query } },
      ];
      where[Op.and] = [...(where[Op.and] || []), { [Op.or]: searchOr }];
    }

    const decoded = decodeCursor(cursor);
    if (decoded && Array.isArray(decoded) && decoded.length >= 2) {
      const [cursorVal, cursorId] = decoded;
      const parsedDate = new Date(cursorVal);
      if (!isNaN(parsedDate.getTime()) && cursorId) {
        const cursorCond = normalizedSort === 'oldest'
          ? {
              [Op.or]: [
                { publishedAt: { [Op.gt]: parsedDate } },
                { publishedAt: parsedDate, id: { [Op.gt]: cursorId } },
              ],
            }
          : {
              [Op.or]: [
                { publishedAt: { [Op.lt]: parsedDate } },
                { publishedAt: parsedDate, id: { [Op.lt]: cursorId } },
              ],
            };
        where[Op.and] = [...(where[Op.and] || []), cursorCond];
      }
    }

    const adminOrderMap = {
      oldest: [['createdAt', 'ASC'], ['id', 'ASC']],
      popular: [['viewCount', 'DESC'], ['createdAt', 'DESC'], ['id', 'DESC']],
      newest: [['createdAt', 'DESC'], ['id', 'DESC']],
    };

    const order = includeDrafts
      ? (adminOrderMap[normalizedSort] || adminOrderMap.newest)
      : ({ oldest: oldestOrder, popular: popularOrder }[normalizedSort] || newestOrder);

    const fetchLimit = cursor ? parsedLimit + 1 : parsedLimit;
    const parsedPage = Math.max(Number(page) || 1, 1);
    const offset = cursor ? 0 : (parsedPage - 1) * parsedLimit;

    const result = await BlogPost.findAndCountAll({
      where,
      include: [{
        model: BlogCategory,
        as: 'category',
        required: Boolean(requestedCategory) || !includeDrafts,
        where: categoryWhere || (!includeDrafts ? { isActive: true } : undefined),
      }],
      order,
      limit: fetchLimit,
      offset,
      distinct: true,
    });

    let items = result.rows;
    let hasMore = false;
    let nextCursor = null;

    if (cursor) {
      hasMore = items.length > parsedLimit;
      if (hasMore) items = items.slice(0, parsedLimit);
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        nextCursor = encodeCursor([lastItem.publishedAt || lastItem.createdAt, lastItem.id]);
      }
    } else {
      const totalPages = Math.ceil(result.count / parsedLimit);
      hasMore = parsedPage < totalPages;
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        nextCursor = encodeCursor([lastItem.publishedAt || lastItem.createdAt, lastItem.id]);
      }
    }

    return {
      items: items.map((post) => serializePost(post, { includeContent: false })),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: result.count,
        hasMore,
        nextCursor,
        isElasticsearch: false,
      },
    };
  },

  async getPostBySlug(slug, { includeDrafts = false } = {}) {
    const where = { slug: String(slug || '').trim() };
    if (!includeDrafts) Object.assign(where, publicWhere());
    const post = await BlogPost.findOne({ where, include: includeOptions(false, !includeDrafts) });
    if (!post) throw createAppError('Không tìm thấy bài viết.', 404);
    return serializePost(post);
  },

  async incrementView(slug) {
    const post = await BlogPost.findOne({ where: { slug, ...publicWhere() } });
    if (!post) throw createAppError('Không tìm thấy bài viết.', 404);
    await post.increment('viewCount');
    await post.reload({ attributes: ['viewCount'] });
    return { viewCount: post.viewCount };
  },

  async createPost(payload, currentUser) {
    const postPayload = await validatePostPayload(payload);
    const post = await BlogPost.create({
      ...postPayload,
      authorId: currentUser?.id || null,
      authorName: currentUser?.fullName || payload.authorName?.trim() || 'Lan Anh Beauty',
    });
    const result = await this.getPostById(post.id);
    if (result.status === 'PUBLISHED') {
      await elasticsearchService.indexPost(result);
    }
    return result;
  },

  async getPostById(id) {
    const post = await BlogPost.findByPk(id, { include: includeOptions() });
    if (!post) throw createAppError('Không tìm thấy bài viết.', 404);
    return serializePost(post);
  },

  async updatePost(id, payload, currentUser) {
    const post = await BlogPost.findByPk(id);
    if (!post) throw createAppError('Không tìm thấy bài viết.', 404);
    const postPayload = await validatePostPayload({ ...payload, publishedAt: payload.publishedAt ?? post.publishedAt, status: payload.status ?? post.status }, post.id);
    await post.update({
      ...postPayload,
      authorId: post.authorId || currentUser?.id || null,
      authorName: currentUser?.fullName || post.authorName || 'Lan Anh Beauty',
    });
    const result = await this.getPostById(post.id);
    if (result.status === 'PUBLISHED') {
      await elasticsearchService.indexPost(result);
    } else {
      await elasticsearchService.deletePost(id);
    }
    return result;
  },

  async updatePostStatus(id, status) {
    const post = await BlogPost.findByPk(id);
    if (!post) throw createAppError('Không tìm thấy bài viết.', 404);
    const normalizedStatus = normalizeStatus(status);
    await post.update({
      status: normalizedStatus,
      publishedAt: normalizedStatus === 'PUBLISHED' ? (post.publishedAt || new Date()) : null,
    });
    const result = await this.getPostById(post.id);
    if (normalizedStatus === 'PUBLISHED') {
      await elasticsearchService.indexPost(result);
    } else {
      await elasticsearchService.deletePost(id);
    }
    return result;
  },

  async deletePost(id) {
    const post = await BlogPost.findByPk(id);
    if (!post) throw createAppError('Không tìm thấy bài viết.', 404);
    if (post.status === 'PUBLISHED') {
      throw createAppError('Không thể xóa bài viết đang xuất bản. Hãy chuyển sang bản nháp trước.', 409);
    }
    await elasticsearchService.deletePost(id);
    await post.destroy();
  },
};

export default blogService;
