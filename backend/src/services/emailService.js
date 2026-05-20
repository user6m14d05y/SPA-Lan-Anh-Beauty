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

  async sendExpiredClosedPeriodNotification({ adminEmails, periods }) {
    if (!adminEmails || adminEmails.length === 0) return;

    const transporter = createTransporter();

    const shiftLabel = (shift) => {
      if (shift === 'MORNING') return 'Ca sáng';
      if (shift === 'AFTERNOON') return 'Ca chiều';
      return 'Cả ngày';
    };

    const formatDate = (dateStr) => {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    };

    const rows = periods.map((p) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8df;">${formatDate(p.date)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8df;">${shiftLabel(p.shift)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #f0e8df; color: #888;">${escapeHtml(p.reason || '—')}</td>
      </tr>
    `).join('');

    const subject = `[Lan Anh Beauty] Tự động xóa ${periods.length} ngày nghỉ đã hết hạn`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 600px; margin: 0 auto;">
        <div style="background: #775932; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 1.2rem;">🗑️ Lan Anh Beauty — Thông báo xóa ngày nghỉ</h2>
        </div>
        <div style="background: #fff; border: 1px solid #e8ddd3; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p>Hệ thống đã <strong>tự động xóa</strong> các ngày nghỉ đã hết hạn sau (buổi sáng đã kết thúc):</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.92rem;">
            <thead>
              <tr style="background: #f8f1e8;">
                <th style="padding: 10px 12px; text-align: left; color: #775932;">Ngày</th>
                <th style="padding: 10px 12px; text-align: left; color: #775932;">Ca nghỉ</th>
                <th style="padding: 10px 12px; text-align: left; color: #775932;">Lý do</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top: 20px; color: #888; font-size: 0.85rem;">
            Đây là email tự động từ hệ thống Lan Anh Beauty. Vui lòng không trả lời email này.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: adminEmails.join(', '),
      subject,
      text: `Hệ thống đã tự động xóa ${periods.length} ngày nghỉ ca sáng đã hết hạn. Chi tiết: ${periods.map(p => `${p.date} - ${shiftLabel(p.shift)} - ${p.reason || 'Không có lý do'}`).join('; ')}`,
      html,
    });
  },
};

export default emailService;
