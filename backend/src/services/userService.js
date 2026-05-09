import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';

const sanitizeUser = (user) => {
  if (!user) return null;

  const plain = typeof user.get === 'function' ? user.get({ plain: true }) : user;
  const { password, ...safeUser } = plain;
  return safeUser;
};

const VALID_ROLES = ['ADMIN', 'STAFF'];

const createAppError = (message, status = 422) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const isEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
const isPasswordValid = (password) => password.trim().length >= 6;
const isPhoneValid = (phone) => /^\d{10,11}$/.test(phone.trim());

const normalizeRole = (role) => role?.trim().toUpperCase();
const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

const validateRole = (role) => {
  const normalizedRole = normalizeRole(role);

  if (!normalizedRole || !VALID_ROLES.includes(normalizedRole)) {
    throw createAppError('Vai trò không hợp lệ.', 422);
  }

  return normalizedRole;
};

const validateCreatePayload = ({ fullName, email, password, phone, role }) => {
  const normalizedFullName = fullName?.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedPhone = phone?.trim();
  const normalizedRole = validateRole(role);

  if (!normalizedFullName) throw createAppError('Vui lòng nhập tên.', 422);
  if (!normalizedEmail) throw createAppError('Vui lòng nhập email.', 422);
  if (!isEmail(normalizedEmail)) throw createAppError('Email không hợp lệ.', 422);
  if (!password?.trim()) throw createAppError('Vui lòng nhập mật khẩu.', 422);
  if (!isPasswordValid(password)) throw createAppError('Mật khẩu cần ít nhất 6 ký tự.', 422);
  if (!normalizedPhone) throw createAppError('Vui lòng nhập số điện thoại.', 422);
  if (!isPhoneValid(normalizedPhone)) throw createAppError('Số điện thoại phải gồm 10 hoặc 11 chữ số.', 422);

  return {
    fullName: normalizedFullName,
    email: normalizedEmail,
    password: password.trim(),
    phone: normalizedPhone,
    role: normalizedRole,
  };
};

const ensureUniqueFields = async ({ email, phone, excludeId }) => {
  const conditions = [];

  if (email) conditions.push({ email });
  if (phone) conditions.push({ phone });
  if (conditions.length === 0) return;

  const where = {
    [Op.or]: conditions,
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const existingUser = await User.findOne({ where });

  if (!existingUser) return;

  if (email && existingUser.email === email) {
    throw createAppError('Email đã được sử dụng.', 409);
  }

  if (phone && existingUser.phone === phone) {
    throw createAppError('Số điện thoại đã được sử dụng.', 409);
  }
};

export const userService = {
  async loginUser({ identifier, password }) {
    const normalizedIdentifier = identifier?.trim().toLowerCase();
    const normalizedPassword = password?.trim();

    if (!normalizedIdentifier) {
      throw createAppError('Vui lòng nhập email hoặc số điện thoại.', 422);
    }

    if (!normalizedPassword) {
      throw createAppError('Vui lòng nhập mật khẩu.', 422);
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
      throw createAppError('Tài khoản không tồn tại.', 404);
    }

    if (!user.isActive) {
      throw createAppError('Tài khoản đã bị khóa.', 403);
    }

    const passwordMatches = await bcrypt.compare(normalizedPassword, user.password);

    if (!passwordMatches) {
      throw createAppError('Mật khẩu không chính xác.', 422);
    }

    const safeUser = sanitizeUser(user);
    const payload = {
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
      fullName: safeUser.fullName,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    const refreshTokenValue = jwt.sign({ id: safeUser.id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      userId: safeUser.id,
      token: refreshTokenValue,
      expiresAt,
    });

    return {
      user: safeUser,
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 8 * 60 * 60,
    };
  },

  async logoutUser(userId, refreshTokenValue) {
    if (!refreshTokenValue) {
      throw createAppError('Thiếu refresh token.', 422);
    }

    await RefreshToken.destroy({
      where: {
        userId,
        token: refreshTokenValue,
      },
    });
  },

  async createUser(userData) {
    const payload = validateCreatePayload(userData);
    await ensureUniqueFields({ email: payload.email, phone: payload.phone });

    const hashedPassword = await bcrypt.hash(payload.password, 10);
    const user = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: hashedPassword,
      phone: payload.phone,
      role: payload.role,
    });

    return sanitizeUser(user);
  },

  async getAllUsers() {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    return users.map(sanitizeUser);
  },

  async getUserById(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw createAppError('Không tìm thấy người dùng.', 404);
    }

    return sanitizeUser(user);
  },

  async getCurrentUserFromToken(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw createAppError('Tài khoản không tồn tại.', 401);
    }

    if (!user.isActive) {
      throw createAppError('Tài khoản đã bị khóa.', 403);
    }

    return user;
  },

  async updateUser(id, userData) {
    const user = await User.findByPk(id);

    if (!user) {
      throw createAppError('Không tìm thấy người dùng.', 404);
    }

    const payload = {};

    if (userData.fullName !== undefined) {
      const normalizedFullName = userData.fullName.trim();
      if (!normalizedFullName) throw createAppError('Vui lòng nhập tên.', 422);
      payload.fullName = normalizedFullName;
    }

    if (userData.email !== undefined) {
      const normalizedEmail = userData.email.trim().toLowerCase();
      if (!normalizedEmail) throw createAppError('Vui lòng nhập email.', 422);
      if (!isEmail(normalizedEmail)) throw createAppError('Email không hợp lệ.', 422);
      payload.email = normalizedEmail;
    }

    if (userData.phone !== undefined) {
      const normalizedPhone = userData.phone.trim();
      if (!normalizedPhone) throw createAppError('Vui lòng nhập số điện thoại.', 422);
      if (!isPhoneValid(normalizedPhone)) throw createAppError('Số điện thoại phải gồm 10 hoặc 11 chữ số.', 422);
      payload.phone = normalizedPhone;
    }

    if (userData.role !== undefined) {
      payload.role = validateRole(userData.role);
    }

    if (userData.isActive !== undefined) {
      const normalizedIsActive = normalizeBoolean(userData.isActive);
      if (normalizedIsActive === null) throw createAppError('Trạng thái hoạt động không hợp lệ.', 422);
      payload.isActive = normalizedIsActive;
    }

    if (userData.password !== undefined && userData.password !== '') {
      if (!isPasswordValid(userData.password)) {
        throw createAppError('Mật khẩu cần ít nhất 6 ký tự.', 422);
      }
      payload.password = await bcrypt.hash(userData.password.trim(), 10);
    }

    await ensureUniqueFields({
      email: payload.email,
      phone: payload.phone,
      excludeId: user.id,
    });

    await user.update(payload);
    return sanitizeUser(user);
  },
};

export { createAppError };
export default userService;
