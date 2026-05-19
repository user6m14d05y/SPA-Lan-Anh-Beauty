import { chatbotService } from '../services/chatbotService.js';

export const sendChatbotMessage = async (req, res) => {
  try {
    const reply = await chatbotService.reply({
      message: req.body?.message,
      history: req.body?.history,
    });

    res.status(200).json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Không thể gửi tin nhắn đến chatbot.',
    });
  }
};
