import { contactService } from '../services/contactService.js';
import svgCaptcha from 'svg-captcha';
import { signCaptchaToken } from '../middlewares/rateLimitMiddleware.js';

const handleError = (res, error, fallbackMessage = 'Có lỗi xảy ra') => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const createContact = async (req, res) => {
  try {
    const contact = await contactService.createContact(req.body);

    res.status(201).json({
      success: true,
      message: 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi bạn sớm nhất.',
      data: contact,
    });
  } catch (error) {
    handleError(res, error, 'Không thể gửi liên hệ.');
  }
};

export const getContacts = async (req, res) => {
  try {
    const contacts = await contactService.getContacts(req.query);

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy danh sách liên hệ.');
  }
};

export const getContactDetail = async (req, res) => {
  try {
    const contact = await contactService.getContactById(req.params.id);

    res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    handleError(res, error, 'Không thể lấy chi tiết liên hệ.');
  }
};

export const replyContact = async (req, res) => {
  try {
    const contact = await contactService.replyToContact(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: 'Gửi phản hồi thành công.',
      data: contact,
    });
  } catch (error) {
    handleError(res, error, 'Không thể gửi phản hồi.');
  }
};

export const deleteContact = async (req, res) => {
  try {
    await contactService.deleteContact(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Xóa liên hệ thành công.',
    });
  } catch (error) {
    handleError(res, error, 'Không thể xóa liên hệ.');
  }
};

export const generateCaptcha = (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1il', // Loại bỏ ký tự dễ nhầm lẫn
    noise: 2,
    color: true,
    background: '#fdfaf8',
    width: 150,
    height: 50,
    fontSize: 50,
  });

  // Ký text bằng HMAC — không lưu vào session
  const token = signCaptchaToken(captcha.text);

  res.status(200).json({
    svg: captcha.data,   // SVG dưới dạng string
    token,               // Token để gửi kèm khi submit form
  });
};

