import { userService } from "../services/userService.js";

export const userController = {
  async login(req, res, next) {
    try {
      const userData = req.body;
      const newUser = await userService.createUser(userData);
      res.status(201).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  }, 
  async register(req, res, next) {
    try {
      const userData = req.body;
      const newUser = await userService.createUser(userData);
      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  },
  async logout(req, res, next) {
    try {
      const userData = req.body;
      const newUser = await userService.createUser(userData);
      res.status(201).json({
        success: true,
        message: 'Đăng xuất thành công',
        data: newUser
      });
    } catch (error) {
      next(error);
    }
  }, 
  async index(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách thành công',
        data: users
      });
    } catch (error) {
      next(error);
    }
  },
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.status(200).json({
        success: true,
        message: 'Lấy thông tin thành công',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const updatedUser = await userService.updateUser(id, userData);
      res.status(200).json({
        success: true,
        message: 'Cập nhật thành công',
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  },
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deletedUser = await userService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: 'Xóa thành công',
        data: deletedUser
      });
    } catch (error) {
      next(error);
    }
  }
}