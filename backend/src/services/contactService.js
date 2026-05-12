import { Op } from 'sequelize';
import Contact from '../models/Contact.js';
import { createAppError } from './userService.js';
import { emailService } from './emailService.js';

const VALID_STATUSES = ['NEW', 'REPLIED'];

const isEmail = (value) => /^\S+@\S+\.\S+$/.test(value);
const isPhoneValid = (phone) => /^\d{10,11}$/.test(phone.trim());

const normalizeText = (value) => value?.trim();

const validateContactPayload = ({ name, email, phone, message }) => {
  const normalizedName = normalizeText(name);
  const normalizedEmail = normalizeText(email)?.toLowerCase();
  const normalizedPhone = normalizeText(phone);
  const normalizedMessage = normalizeText(message);

  if (!normalizedName || normalizedName.length < 2 || normalizedName.length > 100) {
    throw createAppError('Họ tên phải từ 2 đến 100 ký tự.', 422);
  }

  if (!normalizedEmail || !isEmail(normalizedEmail) || normalizedEmail.length > 150) {
    throw createAppError('Email không hợp lệ.', 422);
  }

  if (!normalizedPhone || !isPhoneValid(normalizedPhone)) {
    throw createAppError('Số điện thoại phải gồm 10 hoặc 11 chữ số.', 422);
  }

  if (!normalizedMessage || normalizedMessage.length < 10 || normalizedMessage.length > 2000) {
    throw createAppError('Nội dung liên hệ phải từ 10 đến 2000 ký tự.', 422);
  }

  return {
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    message: normalizedMessage,
  };
};

const validateReplyMessage = (replyMessage) => {
  const normalizedReplyMessage = normalizeText(replyMessage);

  if (!normalizedReplyMessage || normalizedReplyMessage.length < 5 || normalizedReplyMessage.length > 4000) {
    throw createAppError('Nội dung phản hồi phải từ 5 đến 4000 ký tự.', 422);
  }

  return normalizedReplyMessage;
};

export const contactService = {
  async createContact(payload) {
    const contactPayload = validateContactPayload(payload);

    return Contact.create({
      ...contactPayload,
      status: 'NEW',
    });
  },

  async getContacts({ status, search } = {}) {
    const where = {};
    const normalizedStatus = status?.trim().toUpperCase();
    const normalizedSearch = search?.trim();

    if (normalizedStatus) {
      if (!VALID_STATUSES.includes(normalizedStatus)) {
        throw createAppError('Trạng thái liên hệ không hợp lệ.', 422);
      }
      where.status = normalizedStatus;
    }

    if (normalizedSearch) {
      where[Op.or] = [
        { name: { [Op.like]: `%${normalizedSearch}%` } },
        { email: { [Op.like]: `%${normalizedSearch}%` } },
        { phone: { [Op.like]: `%${normalizedSearch}%` } },
      ];
    }

    return Contact.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  },

  async getContactById(id) {
    const contact = await Contact.findByPk(id);

    if (!contact) {
      throw createAppError('Không tìm thấy liên hệ.', 404);
    }

    return contact;
  },

  async replyToContact(id, { replyMessage }, currentUser) {
    const contact = await this.getContactById(id);

    if (contact.status === 'REPLIED') {
      throw createAppError('Liên hệ này đã được trả lời trước đó.', 409);
    }

    const normalizedReplyMessage = validateReplyMessage(replyMessage);

    try {
      await emailService.sendContactReply({
        to: contact.email,
        customerName: contact.name,
        originalMessage: contact.message,
        replyMessage: normalizedReplyMessage,
      });
    } catch (error) {
      console.error('Error sending contact reply email:', error);
      throw createAppError('Không thể gửi email phản hồi. Vui lòng kiểm tra cấu hình SMTP.', 500);
    }

    await contact.update({
      replyMessage: normalizedReplyMessage,
      status: 'REPLIED',
      repliedAt: new Date(),
      repliedBy: currentUser.id,
    });

    return contact;
  },

  async deleteContact(id) {
    const contact = await this.getContactById(id);
    await contact.destroy();
  },
};

export default contactService;
