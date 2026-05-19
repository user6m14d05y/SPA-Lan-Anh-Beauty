import jwt from 'jsonwebtoken';
import { chatService } from '../services/chatService.js';
import { userService } from '../services/userService.js';

const staffRoom = 'chat:staff';
const conversationRoom = (conversationId) => `chat:conversation:${conversationId}`;

const authenticateSocketUser = async (socket) => {
  const token = socket.handshake?.auth?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userService.getCurrentUserFromToken(decoded.id);

    if (!['ADMIN', 'STAFF'].includes(user.role)) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  } catch {
    return null;
  }
};

const emitConversationUpdate = (io, conversation) => {
  io.to(staffRoom).emit('chat:conversation:upsert', conversation);
  io.to(conversationRoom(conversation.id)).emit('chat:conversation:update', conversation);
};

export const setupChatSocket = (io) => {
  io.on('connection', async (socket) => {
    socket.user = await authenticateSocketUser(socket);

    socket.on('chat:staff:join', () => {
      if (!socket.user) {
        socket.emit('chat:error', { message: 'Chưa xác thực nhân viên.' });
        return;
      }

      socket.join(staffRoom);
    });

    socket.on('chat:staff:joinConversation', async ({ conversationId } = {}) => {
      if (!socket.user) {
        socket.emit('chat:error', { message: 'Chưa xác thực nhân viên.' });
        return;
      }

      if (!conversationId) return;

      socket.join(conversationRoom(conversationId));
      const conversation = await chatService.markStaffRead(conversationId);
      if (conversation) emitConversationUpdate(io, conversation);
    });

    socket.on('chat:staff:message', async ({ conversationId, message, imageUrl } = {}) => {
      if (!socket.user) {
        socket.emit('chat:error', { message: 'Chưa xác thực nhân viên.' });
        return;
      }

      try {
        const result = await chatService.createStaffMessage({
          conversationId,
          message,
          imageUrl,
          user: socket.user,
        });

        io.to(conversationRoom(result.conversation.id)).emit('chat:message', result.message);
        emitConversationUpdate(io, result.conversation);
      } catch (error) {
        socket.emit('chat:error', { message: error.message || 'Không thể gửi tin nhắn.' });
      }
    });

    socket.on('chat:staff:closeConversation', async ({ conversationId } = {}) => {
      if (!socket.user) {
        socket.emit('chat:error', { message: 'Chưa xác thực nhân viên.' });
        return;
      }

      try {
        const conversation = await chatService.closeConversation(conversationId);
        emitConversationUpdate(io, conversation);
      } catch (error) {
        socket.emit('chat:error', { message: error.message || 'Không thể kết thúc hội thoại.' });
      }
    });

    socket.on('chat:customer:join', async ({ visitorId, customerName } = {}) => {
      try {
        const conversation = await chatService.getOrCreateConversation({ visitorId, customerName, reopenClosed: false });
        const result = await chatService.getMessages(conversation.id, { markCustomerRead: true });

        if (socket.activeConversationId && socket.activeConversationId !== conversation.id) {
          socket.leave(conversationRoom(socket.activeConversationId));
        }

        socket.activeConversationId = conversation.id;
        socket.join(conversationRoom(conversation.id));
        socket.emit('chat:conversation', result);
        emitConversationUpdate(io, result.conversation);
      } catch (error) {
        socket.emit('chat:error', { message: error.message || 'Không thể tham gia chat.' });
      }
    });

    socket.on('chat:customer:message', async ({ visitorId, customerName, message, imageUrl } = {}) => {
      try {
        const result = await chatService.createCustomerMessage({ visitorId, customerName, message, imageUrl });

        if (socket.activeConversationId && socket.activeConversationId !== result.conversation.id) {
          socket.leave(conversationRoom(socket.activeConversationId));
        }

        socket.activeConversationId = result.conversation.id;
        socket.join(conversationRoom(result.conversation.id));
        io.to(conversationRoom(result.conversation.id)).emit('chat:message', result.message);
        emitConversationUpdate(io, result.conversation);
      } catch (error) {
        socket.emit('chat:error', { message: error.message || 'Không thể gửi tin nhắn.' });
      }
    });

    socket.on('chat:customer:newConversation', async ({ visitorId, customerName } = {}) => {
      try {
        const nextVisitorId = `${visitorId}_${Date.now().toString(36)}`;
        const conversation = await chatService.getOrCreateConversation({ visitorId: nextVisitorId, customerName });
        const result = await chatService.getMessages(conversation.id, { markCustomerRead: true });

        if (socket.activeConversationId) {
          socket.leave(conversationRoom(socket.activeConversationId));
        }

        socket.activeConversationId = conversation.id;
        socket.join(conversationRoom(conversation.id));
        socket.emit('chat:visitorId:update', { visitorId: nextVisitorId });
        socket.emit('chat:conversation', result);
        io.to(staffRoom).emit('chat:conversation:upsert', result.conversation);
      } catch (error) {
        socket.emit('chat:error', { message: error.message || 'Không thể bắt đầu hội thoại mới.' });
      }
    });

    socket.on('chat:customer:read', async ({ conversationId } = {}) => {
      if (!conversationId) return;
      const conversation = await chatService.markCustomerRead(conversationId);
      if (conversation) emitConversationUpdate(io, conversation);
    });
  });
};

export default setupChatSocket;
