import fs from 'fs/promises';
import path from 'path';
import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';

const MAX_MESSAGE_LENGTH = 2000;

const createAppError = (message, status = 422) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const normalizeText = (value, fallback = '') => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text || fallback;
};

const normalizeVisitorId = (visitorId) => {
  const value = normalizeText(visitorId);

  if (!value || value.length > 80 || !/^[a-zA-Z0-9_-]+$/.test(value)) {
    throw createAppError('Mã phiên chat không hợp lệ.', 422);
  }

  return value;
};

const normalizeMessage = (message) => {
  const value = normalizeText(message);

  if (value.length > MAX_MESSAGE_LENGTH) {
    throw createAppError(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.`, 422);
  }

  return value;
};

const saveImage = async (imageUrl) => {
  const value = String(imageUrl || '').trim();
  if (!value) return '';

  const match = value.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);
  if (!match) throw createAppError('Ảnh không hợp lệ.', 422);

  const extension = match[1].toLowerCase().replace('jpeg', 'jpg');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 2 * 1024 * 1024) throw createAppError('Ảnh không được vượt quá 2MB.', 422);

  const uploadDir = path.join(process.cwd(), 'uploads', 'img', 'chat');
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/img/chat/${fileName}`;
};

const buildMessageText = async ({ message, imageUrl }) => {
  const text = normalizeMessage(message);
  const image = await saveImage(imageUrl);

  if (!text && !image) {
    throw createAppError('Vui lòng nhập nội dung hoặc chọn ảnh.', 422);
  }

  return image ? JSON.stringify({ text, imageUrl: image }) : text;
};

const buildLastMessage = (message) => {
  try {
    const parsed = JSON.parse(message);
    if (parsed?.imageUrl) return parsed.text || 'Đã gửi ảnh';
  } catch {
    return message;
  }

  return message;
};

const serializeConversation = (conversation) => {
  const data = typeof conversation.toJSON === 'function' ? conversation.toJSON() : conversation;

  return {
    ...data,
    lastMessageAt: data.lastMessageAt || data.updatedAt || data.createdAt,
  };
};

const serializeMessage = (message) => (
  typeof message.toJSON === 'function' ? message.toJSON() : message
);

export const chatService = {
  async getOrCreateConversation({ visitorId, customerName, customerPhone, customerEmail, reopenClosed = true } = {}) {
    const normalizedVisitorId = normalizeVisitorId(visitorId);
    const [conversation, created] = await ChatConversation.findOrCreate({
      where: { visitorId: normalizedVisitorId },
      defaults: {
        visitorId: normalizedVisitorId,
        customerName: normalizeText(customerName, 'Khách hàng'),
        customerPhone: normalizeText(customerPhone) || null,
        customerEmail: normalizeText(customerEmail) || null,
        status: 'OPEN',
      },
    });

    const updates = {};
    const nextCustomerName = normalizeText(customerName);
    const nextCustomerPhone = normalizeText(customerPhone);
    const nextCustomerEmail = normalizeText(customerEmail);

    if (!created && nextCustomerName && conversation.customerName !== nextCustomerName) {
      updates.customerName = nextCustomerName;
    }

    if (!created && nextCustomerPhone && conversation.customerPhone !== nextCustomerPhone) {
      updates.customerPhone = nextCustomerPhone;
    }

    if (!created && nextCustomerEmail && conversation.customerEmail !== nextCustomerEmail) {
      updates.customerEmail = nextCustomerEmail;
    }

    if (reopenClosed && conversation.status !== 'OPEN') {
      updates.status = 'OPEN';
    }

    if (Object.keys(updates).length) {
      await conversation.update(updates);
    }

    return serializeConversation(conversation);
  },

  async listConversations({ search } = {}) {
    const conversations = await ChatConversation.findAll({
      order: [
        ['lastMessageAt', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    });

    const normalizedSearch = normalizeText(search).toLowerCase();
    const serialized = conversations.map(serializeConversation);

    if (!normalizedSearch) return serialized;

    return serialized.filter((conversation) => (
      conversation.customerName?.toLowerCase().includes(normalizedSearch)
      || conversation.customerPhone?.toLowerCase().includes(normalizedSearch)
      || conversation.customerEmail?.toLowerCase().includes(normalizedSearch)
      || conversation.lastMessage?.toLowerCase().includes(normalizedSearch)
    ));
  },

  async getMessages(conversationId, { markStaffRead = false, markCustomerRead = false } = {}) {
    const conversation = await ChatConversation.findByPk(conversationId);

    if (!conversation) {
      throw createAppError('Không tìm thấy hội thoại.', 404);
    }

    if (markStaffRead && conversation.unreadByStaff > 0) {
      await conversation.update({ unreadByStaff: 0 });
    }

    if (markCustomerRead && conversation.unreadByCustomer > 0) {
      await conversation.update({ unreadByCustomer: 0 });
    }

    const messages = await ChatMessage.findAll({
      where: { conversationId: conversation.id },
      order: [['createdAt', 'ASC']],
    });

    return {
      conversation: serializeConversation(conversation),
      messages: messages.map(serializeMessage),
    };
  },

  async createCustomerMessage({ visitorId, customerName, message, imageUrl }) {
    const conversation = await this.getOrCreateConversation({ visitorId, customerName, reopenClosed: false });

    if (conversation.status === 'CLOSED') {
      throw createAppError('Hội thoại đã kết thúc. Vui lòng bắt đầu hội thoại mới.', 409);
    }

    const text = await buildMessageText({ message, imageUrl });
    const createdMessage = await ChatMessage.create({
      conversationId: conversation.id,
      senderType: 'CUSTOMER',
      senderName: conversation.customerName || normalizeText(customerName, 'Khách hàng'),
      message: text,
    });

    const updatedConversation = await ChatConversation.findByPk(conversation.id);
    await updatedConversation.update({
      status: 'OPEN',
      lastMessage: buildLastMessage(text),
      lastMessageAt: createdMessage.createdAt,
      unreadByStaff: updatedConversation.unreadByStaff + 1,
    });

    return {
      conversation: serializeConversation(updatedConversation),
      message: serializeMessage(createdMessage),
    };
  },

  async createStaffMessage({ conversationId, message, imageUrl, user }) {
    const conversation = await ChatConversation.findByPk(conversationId);

    if (!conversation) {
      throw createAppError('Không tìm thấy hội thoại.', 404);
    }

    if (conversation.status === 'CLOSED') {
      throw createAppError('Hội thoại đã kết thúc.', 409);
    }

    const text = await buildMessageText({ message, imageUrl });
    const createdMessage = await ChatMessage.create({
      conversationId: conversation.id,
      senderType: 'STAFF',
      senderName: user?.fullName || 'Nhân viên',
      senderUserId: user?.id || null,
      message: text,
    });

    await conversation.update({
      status: 'OPEN',
      assignedTo: user?.id || conversation.assignedTo,
      lastMessage: buildLastMessage(text),
      lastMessageAt: createdMessage.createdAt,
      unreadByCustomer: conversation.unreadByCustomer + 1,
    });

    return {
      conversation: serializeConversation(conversation),
      message: serializeMessage(createdMessage),
    };
  },

  async closeConversation(conversationId) {
    const conversation = await ChatConversation.findByPk(conversationId);

    if (!conversation) {
      throw createAppError('Không tìm thấy hội thoại.', 404);
    }

    await conversation.update({
      status: 'CLOSED',
      unreadByStaff: 0,
      unreadByCustomer: 0,
    });

    return serializeConversation(conversation);
  },

  async markStaffRead(conversationId) {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) return null;
    if (conversation.unreadByStaff > 0) {
      await conversation.update({ unreadByStaff: 0 });
    }
    return serializeConversation(conversation);
  },

  async markCustomerRead(conversationId) {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) return null;
    if (conversation.unreadByCustomer > 0) {
      await conversation.update({ unreadByCustomer: 0 });
    }
    return serializeConversation(conversation);
  },
};

export default chatService;
