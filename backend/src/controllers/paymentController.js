import Booking from '../models/Booking.js';
import { Op } from 'sequelize';

const SEPAY_API_KEY = process.env.SEPAY_API_KEY || 'api_key_lananhbeauty_1414062005';
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY || 'thanhbtdev-sepay-key';

export const paymentController = {
  // Webhook received from SePay IPN
  async handleSepayWebhook(req, res) {
    try {
      const authHeader = req.headers['authorization'] || req.headers['x-api-key'] || '';
      const querySecret = req.query.secret || '';
      
      const isAuthorized = 
        !authHeader || 
        authHeader.includes(SEPAY_API_KEY) || 
        authHeader.includes(SEPAY_SECRET_KEY) || 
        querySecret === SEPAY_SECRET_KEY ||
        querySecret === SEPAY_API_KEY;

      if (!isAuthorized) {
        return res.status(401).json({ success: false, message: 'Xác thực webhook SePay không hợp lệ.' });
      }

      const {
        id,
        gateway,
        transactionDate,
        content,
        transferAmount,
        amountIn,
        code
      } = req.body || {};

      const paidAmount = Number(transferAmount || amountIn || 0);
      const transferContent = String(content || '').trim();

      console.log(`[SePay Webhook Received] Transaction #${id} - Amount: ${paidAmount}đ - Content: "${transferContent}"`);

      // Extract 12-digit booking code or 10-digit phone number
      const codeMatch = transferContent.match(/\d{12}/);
      const phoneMatch = transferContent.match(/0\d{9}/);

      const extractedCode = codeMatch ? codeMatch[0] : null;
      const extractedPhone = phoneMatch ? phoneMatch[0] : null;

      let matchedBooking = null;

      if (extractedCode) {
        matchedBooking = await Booking.findOne({
          where: {
            [Op.or]: [
              { notes: { [Op.like]: `%${extractedCode}%` } },
            ],
            status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
          },
          order: [['createdAt', 'DESC']],
        });
      }

      if (!matchedBooking && extractedPhone) {
        matchedBooking = await Booking.findOne({
          where: {
            customerPhone: extractedPhone,
            status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
          },
          order: [['createdAt', 'DESC']],
        });
      }

      // Fallback: match latest pending booking if no code/phone match
      if (!matchedBooking) {
        matchedBooking = await Booking.findOne({
          where: { status: 'PENDING' },
          order: [['createdAt', 'DESC']],
        });
      }

      if (matchedBooking) {
        await matchedBooking.update({
          status: 'CONFIRMED',
          notes: `${matchedBooking.notes ? matchedBooking.notes + ' | ' : ''}Đã nhận chuyển khoản ${paidAmount > 0 ? paidAmount.toLocaleString('vi-VN') + 'đ' : ''} qua ${gateway || 'MBBank/SePay'} (Mã GD: ${id || code || 'N/A'}) lúc ${transactionDate || new Date().toLocaleString('vi-VN')}`,
        });

        console.log(`[SePay Webhook] Auto confirmed booking #${matchedBooking.id} with 12-digit code ${extractedCode || 'N/A'}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Xử lý Webhook SePay thành công.',
        bookingConfirmed: Boolean(matchedBooking),
      });
    } catch (error) {
      console.error('[SePay Webhook Error]:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Lỗi xử lý Webhook SePay.',
      });
    }
  },

  // Polling payment status for frontend
  async checkPaymentStatus(req, res) {
    try {
      const { phone, code, bookingId } = req.query;

      const where = {};
      const targetCode = code || bookingId;

      if (targetCode) {
        where[Op.or] = [
          { notes: { [Op.like]: `%${targetCode}%` } },
          { id: targetCode }
        ];
      } else if (phone) {
        where.customerPhone = phone;
      } else {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin tra cứu.' });
      }

      const booking = await Booking.findOne({
        where,
        order: [['createdAt', 'DESC']],
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
      }

      const isPaid = booking.status === 'CONFIRMED' || (booking.notes && booking.notes.toLowerCase().includes('chuyển khoản'));

      return res.status(200).json({
        success: true,
        isPaid,
        status: booking.status,
        booking,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  // Manual / Test simulation of successful payment
  async simulateSuccess(req, res) {
    try {
      const { phone, code, bookingId } = req.body || {};
      const where = {};
      const targetCode = code || bookingId;

      if (targetCode) {
        where[Op.or] = [
          { notes: { [Op.like]: `%${targetCode}%` } },
          { id: targetCode }
        ];
      } else if (phone) {
        where.customerPhone = phone;
      } else {
        return res.status(400).json({ success: false, message: 'Thiếu SĐT hoặc mã booking 12 số.' });
      }

      const booking = await Booking.findOne({
        where,
        order: [['createdAt', 'DESC']],
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
      }

      await booking.update({
        status: 'CONFIRMED',
        notes: `${booking.notes ? booking.notes + ' | ' : ''}Đã thanh toán thành công qua SePay QR (MBBank 1414062005 - BUI TRONG THANH)`,
      });

      return res.status(200).json({
        success: true,
        message: 'Thanh toán SePay thành công!',
        booking,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  },
};
