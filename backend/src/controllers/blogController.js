import { blogService } from '../services/blogService.js';

const handleError = (res, error, fallbackMessage = 'Có lỗi xảy ra') => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const getCategories = async (req, res) => {
  try {
    const data = await blogService.getCategories();
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Không thể lấy chuyên mục bài viết.'); }
};

export const getAdminCategories = async (req, res) => {
  try {
    const data = await blogService.getCategories({ includeInactive: true });
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Không thể lấy chuyên mục bài viết.'); }
};

export const createCategory = async (req, res) => {
  try {
    const data = await blogService.createCategory(req.body);
    res.status(201).json({ success: true, message: 'Tạo chuyên mục thành công.', data });
  } catch (error) { handleError(res, error, 'Không thể tạo chuyên mục.'); }
};

export const updateCategory = async (req, res) => {
  try {
    const data = await blogService.updateCategory(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Cập nhật chuyên mục thành công.', data });
  } catch (error) { handleError(res, error, 'Không thể cập nhật chuyên mục.'); }
};

export const deleteCategory = async (req, res) => {
  try {
    await blogService.deleteCategory(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa chuyên mục thành công.' });
  } catch (error) { handleError(res, error, 'Không thể xóa chuyên mục.'); }
};

export const getPosts = async (req, res) => {
  try {
    const data = await blogService.getPosts({ ...req.query, includeDrafts: false });
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Không thể lấy danh sách bài viết.'); }
};

export const getPost = async (req, res) => {
  try {
    const data = await blogService.getPostBySlug(req.params.slug);
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Không thể lấy bài viết.'); }
};

export const incrementView = async (req, res) => {
  try {
    const data = await blogService.incrementView(req.params.slug);
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Không thể cập nhật lượt xem.'); }
};

export const getAdminPosts = async (req, res) => {
  try {
    const data = await blogService.getPosts({ ...req.query, includeDrafts: true });
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Không thể lấy danh sách quản trị bài viết.'); }
};

export const getAdminPost = async (req, res) => {
  try {
    const data = await blogService.getPostById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) { handleError(res, error, 'Không thể lấy bài viết.'); }
};

export const createPost = async (req, res) => {
  try {
    const data = await blogService.createPost(req.body, req.user);
    res.status(201).json({ success: true, message: 'Tạo bài viết thành công.', data });
  } catch (error) { handleError(res, error, 'Không thể tạo bài viết.'); }
};

export const updatePost = async (req, res) => {
  try {
    const data = await blogService.updatePost(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'Cập nhật bài viết thành công.', data });
  } catch (error) { handleError(res, error, 'Không thể cập nhật bài viết.'); }
};

export const updatePostStatus = async (req, res) => {
  try {
    const data = await blogService.updatePostStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, message: 'Cập nhật trạng thái bài viết thành công.', data });
  } catch (error) { handleError(res, error, 'Không thể cập nhật trạng thái bài viết.'); }
};

export const deletePost = async (req, res) => {
  try {
    await blogService.deletePost(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa bài viết thành công.' });
  } catch (error) { handleError(res, error, 'Không thể xóa bài viết.'); }
};

export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp hình ảnh.' });
    }
    const imageUrl = `/uploads/img/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: 'Tải ảnh lên thành công.',
      data: { imageUrl, filename: req.file.filename },
    });
  } catch (error) { handleError(res, error, 'Không thể tải ảnh lên.'); }
};

