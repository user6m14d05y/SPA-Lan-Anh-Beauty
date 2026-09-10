import { Op } from 'sequelize';
import Service from '../models/Service.js';
import ServiceCategory from '../models/ServiceCategory.js';
import { createAppError } from './userService.js';

const toBoolean = (value, defaultValue = true) => {
  if (value === undefined) return defaultValue;
  return value === true || value === 'true';
};

const shouldIncludeAll = (value) => ['all', 'both', 'any'].includes(String(value).toLowerCase());

const categoryOrder = [
  ['sortOrder', 'ASC'],
  ['name', 'ASC'],
];

const serviceOrder = [
  ['sortOrder', 'ASC'],
  ['name', 'ASC'],
];

const formatVnd = (value) => `${Number(value).toLocaleString('vi-VN')}đ`;

const parseImages = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const normalizeImages = (images) => {
  if (Array.isArray(images)) return images.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (typeof images === 'string') return images.split('\n').map((item) => item.trim()).filter(Boolean);
  return [];
};

const normalizeImageUrl = (imageUrl, images) => {
  const value = imageUrl?.trim();
  if (value && !value.startsWith('data:')) return value;
  return images.find((image) => !image.startsWith('data:')) || null;
};

const enrichService = (service) => {
  const plainService = typeof service.toJSON === 'function' ? service.toJSON() : service;
  const images = parseImages(plainService.images);
  const thumbnailUrl = images[0] || plainService.imageUrl || null;
  const discountPercent = Number(plainService.discountPercent || 0);
  const salePrice = plainService.price && discountPercent > 0
    ? Math.round(Number(plainService.price) * (100 - discountPercent) / 100)
    : null;

  return {
    ...plainService,
    images,
    thumbnailUrl,
    discountPercent,
    salePrice,
    salePriceLabel: salePrice ? formatVnd(salePrice) : null,
  };
};

const normalizeCategory = (category) => {
  const plainCategory = category.toJSON();
  return {
    ...plainCategory,
    children: (plainCategory.children || []).map((child) => ({
      ...child,
      services: (child.services || []).map(enrichService),
    })),
    services: (plainCategory.services || []).map(enrichService),
  };
};

const generateSlug = (value) => value
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'd')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const assertValidNumber = (value, fieldName, { min = 0, max } = {}) => {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < min || (max !== undefined && numberValue > max)) {
    throw createAppError(`${fieldName} không hợp lệ.`, 422);
  }

  return Math.round(numberValue);
};

const buildCategoryPayload = async (payload) => {
  const parentId = assertValidNumber(payload.parentId, 'Danh mục cha', { min: 1 });
  const sortOrder = assertValidNumber(payload.sortOrder, 'Thứ tự hiển thị', { min: 0 }) || 0;
  const name = payload.name?.trim();
  const slug = (payload.slug?.trim() || generateSlug(name || '')).toLowerCase();

  if (!name || name.length < 2 || name.length > 150) throw createAppError('Tên danh mục phải từ 2 đến 150 ký tự.', 422);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw createAppError('Slug chỉ được gồm chữ thường, số và dấu gạch ngang.', 422);

  if (parentId) {
    const parent = await ServiceCategory.findByPk(parentId);
    if (!parent) throw createAppError('Danh mục cha không tồn tại.', 404);
  }

  const existedCategory = await ServiceCategory.findOne({ where: { slug } });
  if (existedCategory) throw createAppError('Slug danh mục đã tồn tại.', 409);

  return {
    parentId,
    name,
    slug,
    description: payload.description?.trim() || null,
    sortOrder,
    isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
  };
};

const buildServicePayload = async (payload, existingServiceId) => {
  const categoryId = assertValidNumber(payload.categoryId, 'Danh mục', { min: 1 });
  const price = assertValidNumber(payload.price, 'Giá dịch vụ', { min: 0 });
  const durationMinutes = assertValidNumber(payload.durationMinutes, 'Thời lượng dịch vụ', { min: 1 });
  const discountPercent = assertValidNumber(payload.discountPercent, 'Phần trăm giảm giá', { min: 0, max: 100 }) || 0;
  const sortOrder = assertValidNumber(payload.sortOrder, 'Thứ tự hiển thị', { min: 0 }) || 0;
  const name = payload.name?.trim();
  const slug = payload.slug?.trim().toLowerCase();
  const priceLabel = payload.priceLabel?.trim() || (price !== null ? `Từ ${formatVnd(price)}` : 'Tư vấn theo tình trạng da');

  if (!categoryId) throw createAppError('Vui lòng chọn danh mục dịch vụ.', 422);
  if (!name || name.length < 2 || name.length > 150) throw createAppError('Tên dịch vụ phải từ 2 đến 150 ký tự.', 422);
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) throw createAppError('Slug chỉ được gồm chữ thường, số và dấu gạch ngang.', 422);

  const category = await ServiceCategory.findByPk(categoryId);
  if (!category) throw createAppError('Danh mục dịch vụ không tồn tại.', 404);

  const existedService = await Service.findOne({ where: { slug } });
  if (existedService && existedService.id !== existingServiceId) {
    throw createAppError('Slug dịch vụ đã tồn tại.', 409);
  }

  const images = normalizeImages(payload.images);

  return {
    categoryId,
    name,
    slug,
    shortDescription: payload.shortDescription?.trim() || null,
    description: payload.description?.trim() || payload.shortDescription?.trim() || null,
    price,
    priceLabel,
    durationMinutes,
    imageUrl: normalizeImageUrl(payload.imageUrl, images),
    images: JSON.stringify(images),
    discountPercent,
    isFeatured: Boolean(payload.isFeatured),
    isActive: payload.isActive === undefined ? true : Boolean(payload.isActive),
    sortOrder,
  };
};

export const catalogService = {
  async getCategories({ active } = {}) {
    const where = {};

    if (active !== undefined) {
      where.isActive = toBoolean(active);
    }

    return ServiceCategory.findAll({
      where,
      order: categoryOrder,
    });
  },

  async createCategory(payload) {
    const categoryPayload = await buildCategoryPayload(payload);
    return ServiceCategory.create(categoryPayload);
  },

  async getCategoryTree({ active = 'true' } = {}) {
    const includeInactive = shouldIncludeAll(active);
    const categoryWhere = { parentId: null };
    const childWhere = includeInactive ? undefined : { isActive: true };
    const serviceWhere = includeInactive ? undefined : { isActive: true };

    if (!includeInactive) {
      categoryWhere.isActive = true;
    }

    const categories = await ServiceCategory.findAll({
      where: categoryWhere,
      include: [
        {
          model: ServiceCategory,
          as: 'children',
          where: childWhere,
          required: false,
          include: [
            {
              model: Service,
              as: 'services',
              where: serviceWhere,
              required: false,
            },
          ],
        },
        {
          model: Service,
          as: 'services',
          where: serviceWhere,
          required: false,
        },
      ],
      order: [
        ...categoryOrder,
        [{ model: ServiceCategory, as: 'children' }, 'sortOrder', 'ASC'],
        [{ model: ServiceCategory, as: 'children' }, 'name', 'ASC'],
        [{ model: ServiceCategory, as: 'children' }, { model: Service, as: 'services' }, 'sortOrder', 'ASC'],
        [{ model: ServiceCategory, as: 'children' }, { model: Service, as: 'services' }, 'name', 'ASC'],
        [{ model: Service, as: 'services' }, 'sortOrder', 'ASC'],
        [{ model: Service, as: 'services' }, 'name', 'ASC'],
      ],
    });

    return categories.map(normalizeCategory);
  },

  async getServices({ categorySlug, featured, active = 'true', search, sort, limit, cursor } = {}) {
    const where = {};
    const include = [{
      model: ServiceCategory,
      as: 'category',
      required: Boolean(categorySlug),
      where: categorySlug ? { slug: categorySlug } : undefined,
    }];

    if (active !== undefined && !shouldIncludeAll(active)) {
      where.isActive = toBoolean(active);
    }

    if (featured !== undefined) {
      where.isFeatured = toBoolean(featured, false);
    }

    if (search && String(search).trim()) {
      const query = `%${String(search).trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: query } },
        { shortDescription: { [Op.like]: query } },
        { description: { [Op.like]: query } },
      ];
    }

    if (cursor) {
      const parsedCursor = Number(cursor);
      if (parsedCursor) {
        where.id = { [Op.gt]: parsedCursor };
      }
    }

    let order = serviceOrder;
    if (sort === 'price-asc') {
      order = [['price', 'ASC'], ['id', 'ASC']];
    } else if (sort === 'price-desc') {
      order = [['price', 'DESC'], ['id', 'ASC']];
    } else if (sort === 'name-asc') {
      order = [['name', 'ASC'], ['id', 'ASC']];
    } else if (sort === 'name-desc') {
      order = [['name', 'DESC'], ['id', 'ASC']];
    } else if (sort === 'newest') {
      order = [['createdAt', 'DESC'], ['id', 'DESC']];
    }

    const queryOptions = {
      where,
      include,
      order,
    };

    const parsedLimit = limit ? Math.min(Math.max(Number(limit), 1), 100) : null;
    if (parsedLimit) {
      queryOptions.limit = parsedLimit + 1;
    }

    const services = await Service.findAll(queryOptions);
    const enriched = services.map(enrichService);

    if (parsedLimit) {
      const hasMore = enriched.length > parsedLimit;
      const data = hasMore ? enriched.slice(0, parsedLimit) : enriched;
      const nextCursor = data.length > 0 ? data[data.length - 1].id : null;

      return {
        items: data,
        nextCursor,
        hasMore,
        total: data.length,
      };
    }

    return enriched;
  },

  async getServiceBySlug(slug) {
    const service = await Service.findOne({
      where: {
        slug,
        isActive: true,
      },
      include: [{
        model: ServiceCategory,
        as: 'category',
      }],
    });

    if (!service) {
      throw createAppError('Không tìm thấy dịch vụ.', 404);
    }

    return enrichService(service);
  },

  async createService(payload) {
    const servicePayload = await buildServicePayload(payload);
    const service = await Service.create(servicePayload);
    return this.getServiceBySlug(service.slug);
  },

  async updateService(id, payload) {
    const service = await Service.findByPk(id);

    if (!service) {
      throw createAppError('Không tìm thấy dịch vụ.', 404);
    }

    const servicePayload = await buildServicePayload(payload, service.id);
    await service.update(servicePayload);

    return this.getServiceBySlug(servicePayload.slug);
  },

  async toggleServiceActive(id) {
    const service = await Service.findByPk(id);

    if (!service) {
      throw createAppError('Không tìm thấy dịch vụ.', 404);
    }

    await service.update({ isActive: !service.isActive });
    return enrichService(service);
  },
};

export default catalogService;
