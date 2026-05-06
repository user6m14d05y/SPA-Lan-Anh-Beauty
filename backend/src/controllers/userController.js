import { userService } from "../services/userService.js";

const handleError = (res, error, fallbackMessage = 'Có lỗi xảy ra') => {
  res.status(400).json({
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

  async register(req, res) {
    try {
      const newUser = await userService.registerUser(req.body);
      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: newUser,
      });
    } catch (error) {
      handleError(res, error, 'Đăng ký thất bại');
    }
  },

  async logout(req, res) {
    try {
      const { refreshToken } = req.body;
      await userService.logoutUser(refreshToken);
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

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedUser = await userService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: 'Xóa thành công',
        data: deletedUser,
      });
    } catch (error) {
      handleError(res, error, 'Xóa thất bại');
    }
  },
};

export default userController;