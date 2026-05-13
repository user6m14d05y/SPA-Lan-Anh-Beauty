import nodemailer from 'nodemailer';

const requireMailConfig = () => {
  const requiredValues = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const missingValues = requiredValues.filter((key) => !process.env[key]);

  if (missingValues.length > 0) {
    const error = new Error(`Thiếu cấu hình gửi email: ${missingValues.join(', ')}`);
    error.status = 500;
    throw error;
  }
};

const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const createTransporter = () => {
  requireMailConfig();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const emailService = {
  async sendContactReply({ to, customerName, originalMessage, replyMessage }) {
    const transporter = createTransporter();
    const safeCustomerName = escapeHtml(customerName);
    const safeOriginalMessage = escapeHtml(originalMessage).replaceAll('\n', '<br />');
    const safeReplyMessage = escapeHtml(replyMessage).replaceAll('\n', '<br />');

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: 'Phản hồi từ Lan Anh Beauty',
      text: `Xin chào ${customerName},\n\nCảm ơn bạn đã liên hệ Lan Anh Beauty.\n\nNội dung bạn đã gửi:\n${originalMessage}\n\nPhản hồi từ chúng tôi:\n${replyMessage}\n\nTrân trọng,\nLan Anh Beauty`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
          <p>Xin chào <strong>${safeCustomerName}</strong>,</p>
          <p>Cảm ơn bạn đã liên hệ Lan Anh Beauty.</p>
          <p><strong>Nội dung bạn đã gửi:</strong></p>
          <blockquote style="border-left: 4px solid #d6b98c; padding-left: 12px; color: #555;">${safeOriginalMessage}</blockquote>
          <p><strong>Phản hồi từ chúng tôi:</strong></p>
          <div style="background: #f8f1e8; padding: 12px; border-radius: 8px;">${safeReplyMessage}</div>
          <p>Trân trọng,<br />Lan Anh Beauty</p>
        </div>
      `,
    });
  },
};

export default emailService;
