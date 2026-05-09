import { userService } from "../services/userService.js";

const handleError = (res, error, fallbackMessage = 'Có lỗi xảy ra') => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const userController = {
  async login(req, res) {
    try {
      const result = await userService.loginUser(req.body);
      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result,
      });
    } catch (error) {
      handleError(res, error, 'Đăng nhập thất bại');
    }
  },

  // Lấy thông tin user hiện tại từ token
  async me(req, res) {
    try {
      const user = await userService.getUserById(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy thông tin');
    }
  },

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      await userService.logoutUser(req.user.id, refreshToken);
      res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error) {
      handleError(res, error, 'Đăng xuất thất bại');
    }
  },

  async index(req, res) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách thành công',
        data: users,
      });
    } catch (error) {
      handleError(res, error, 'Lấy danh sách thất bại');
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.status(200).json({
        success: true,
        message: 'Lấy thông tin thành công',
        data: user,
      });
    } catch (error) {
      handleError(res, error, 'Lấy thông tin thất bại');
    }
  },

  async create(req, res) {
    try {
      const create = await userService.createUser(req.body);
      res.status(201).json({
        success: true,
        message: 'Tạo mới thành công',
        data: create,
      });
    } catch (error) {
      handleError(res, error, 'Tạo mới thất bại');
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const updatedUser = await userService.updateUser(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Cập nhật thành công',
        data: updatedUser,
      });
    } catch (error) {
      handleError(res, error, 'Cập nhật thất bại');
    }
  },
};

export default userController;