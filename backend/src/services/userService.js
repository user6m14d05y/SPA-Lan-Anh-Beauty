import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import User from '../models/User.js';

const sanitizeUser = (user) => {
  if (!user) return null;

  const plain = typeof user.get === 'function' ? user.get({ plain: true }) : user;
  const { password, ...safeUser } = plain;
  return safeUser;
};

const isEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

export const userService = {
  async registerUser(userData) {
    const fullName = userData.fullName?.trim();
    const email = userData.email?.trim().toLowerCase();
    const phone = userData.phone?.trim();
    const password = userData.password?.trim();

    if (!fullName) {
      throw new Error('Họ và tên là bắt buộc.');
    }

    if (!email) {
      throw new Error('Email là bắt buộc.');
    }

    if (!isEmail(email)) {
      throw new Error('Email không đúng định dạng.');
    }

    if (!phone) {
      throw new Error('Số điện thoại là bắt buộc.');
    }

    if (!password || password.length < 6) {
      throw new Error('Mật khẩu cần ít nhất 6 ký tự.');
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email đã được sử dụng.');
      }

      if (existingUser.phone === phone) {
        throw new Error('Số điện thoại đã được sử dụng.');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
    });

    return sanitizeUser(newUser);
  },

  async loginUser({ identifier, password }) {
    const normalizedIdentifier = identifier?.trim().toLowerCase();
    const normalizedPassword = password?.trim();

    if (!normalizedIdentifier) {
      throw new Error('Vui lòng nhập email hoặc số điện thoại.');
    }

    if (!normalizedPassword) {
      throw new Error('Vui lòng nhập mật khẩu.');
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: normalizedIdentifier },
          { phone: identifier?.trim() },
        ],
      },
    });

    if (!user) {
      throw new Error('Tài khoản không tồn tại.');
    }

    if (!user.isActive) {
      throw new Error('Tài khoản đã bị khóa.');
    }

    const isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Mật khẩu không chính xác.');
    }

    return sanitizeUser(user);
  },

  async createUser(userData) {
    return this.registerUser(userData);
  },

  async getAllUsers() {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    return users.map(sanitizeUser);
  },

  async getUserById(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    return sanitizeUser(user);
  },

  async updateUser(id, userData) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    const payload = {};

    if (userData.fullName !== undefined) payload.fullName = userData.fullName.trim();
    if (userData.email !== undefined) payload.email = userData.email.trim().toLowerCase();
    if (userData.phone !== undefined) payload.phone = userData.phone.trim();
    if (userData.isActive !== undefined) payload.isActive = Boolean(userData.isActive);

    if (userData.password) {
      if (userData.password.trim().length < 6) {
        throw new Error('Mật khẩu cần ít nhất 6 ký tự.');
      }
      payload.password = await bcrypt.hash(userData.password.trim(), 10);
    }

    await user.update(payload);
    return sanitizeUser(user);
  },

  async deleteUser(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    const safeUser = sanitizeUser(user);
    await user.destroy();
    return safeUser;
  },
};
