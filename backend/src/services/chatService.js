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

  if (!value) {
    throw createAppError('Vui lòng nhập nội dung tin nhắn.', 422);
  }

  if (value.length > MAX_MESSAGE_LENGTH) {
    throw createAppError(`Tin nhắn không được vượt quá ${MAX_MESSAGE_LENGTH} ký tự.`, 422);
  }

  return value;
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
  async getOrCreateConversation({ visitorId, customerName, customerPhone, customerEmail } = {}) {
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

    if (conversation.status !== 'OPEN') {
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

  async createCustomerMessage({ visitorId, customerName, message }) {
    const conversation = await this.getOrCreateConversation({ visitorId, customerName });
    const text = normalizeMessage(message);
    const createdMessage = await ChatMessage.create({
      conversationId: conversation.id,
      senderType: 'CUSTOMER',
      senderName: conversation.customerName || normalizeText(customerName, 'Khách hàng'),
      message: text,
    });

    const updatedConversation = await ChatConversation.findByPk(conversation.id);
    await updatedConversation.update({
      status: 'OPEN',
      lastMessage: text,
      lastMessageAt: createdMessage.createdAt,
      unreadByStaff: updatedConversation.unreadByStaff + 1,
    });

    return {
      conversation: serializeConversation(updatedConversation),
      message: serializeMessage(createdMessage),
    };
  },

  async createStaffMessage({ conversationId, message, user }) {
    const conversation = await ChatConversation.findByPk(conversationId);

    if (!conversation) {
      throw createAppError('Không tìm thấy hội thoại.', 404);
    }

    const text = normalizeMessage(message);
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
      lastMessage: text,
      lastMessageAt: createdMessage.createdAt,
      unreadByCustomer: conversation.unreadByCustomer + 1,
    });

    return {
      conversation: serializeConversation(conversation),
      message: serializeMessage(createdMessage),
    };
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
