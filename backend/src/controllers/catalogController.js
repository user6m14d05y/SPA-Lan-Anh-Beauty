import { catalogService } from '../services/catalogService.js';

const handleError = (res, error, fallbackMessage = 'Có lỗi xảy ra') => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const getCategories = async (req, res) => {
  try {
    const categories = await catalogService.getCategories(req.query);

    res.status(200).json({
      success: true,
      message: 'Lấy danh mục dịch vụ thành công.',
      data: categories,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy danh mục dịch vụ.');
  }
};

export const getCategoryTree = async (req, res) => {
  try {
    const categories = await catalogService.getCategoryTree();

    res.status(200).json({
      success: true,
      message: 'Lấy cây danh mục dịch vụ thành công.',
      data: categories,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy cây danh mục dịch vụ.');
  }
};

export const getServices = async (req, res) => {
  try {
    const services = await catalogService.getServices(req.query);

    res.status(200).json({
      success: true,
      message: 'Lấy danh sách dịch vụ thành công.',
      data: services,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy danh sách dịch vụ.');
  }
};

export const getServiceDetail = async (req, res) => {
  try {
    const service = await catalogService.getServiceBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      message: 'Lấy chi tiết dịch vụ thành công.',
      data: service,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy chi tiết dịch vụ.');
  }
};

export const createService = async (req, res) => {
  try {
    const service = await catalogService.createService(req.body);

    res.status(201).json({
      success: true,
      message: 'Tạo dịch vụ thành công.',
      data: service,
    });
  } catch (error) {
    handleError(res, error, 'Không thể tạo dịch vụ.');
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await catalogService.updateService(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Cập nhật dịch vụ thành công.',
      data: service,
    });
  } catch (error) {
    handleError(res, error, 'Không thể cập nhật dịch vụ.');
  }
};

export const toggleServiceActive = async (req, res) => {
  try {
    const service = await catalogService.toggleServiceActive(req.params.id);

    res.status(200).json({
      success: true,
      message: service.isActive ? 'Đã hiển thị dịch vụ.' : 'Đã ẩn dịch vụ.',
      data: service,
    });
  } catch (error) {
    handleError(res, error, 'Không thể cập nhật trạng thái dịch vụ.');
  }
};
