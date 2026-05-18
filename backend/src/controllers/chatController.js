import { chatService } from '../services/chatService.js';

const handleError = (res, error, fallbackMessage = 'Không thể xử lý chat.') => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const startConversation = async (req, res) => {
  try {
    const conversation = await chatService.getOrCreateConversation(req.body);
    const result = await chatService.getMessages(conversation.id, { markCustomerRead: true });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 'Không thể tạo hội thoại.');
  }
};

export const listConversations = async (req, res) => {
  try {
    const conversations = await chatService.listConversations(req.query);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy danh sách hội thoại.');
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const result = await chatService.getMessages(req.params.id, { markStaffRead: true });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy tin nhắn.');
  }
};
