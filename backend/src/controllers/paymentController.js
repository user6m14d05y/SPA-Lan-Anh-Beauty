import Booking from '../models/Booking.js';
import { Op } from 'sequelize';

export const paymentController = {
  // Webhook received from SePay IPN
  async handleSepayWebhook(req, res) {
    try {
      const authHeader = String(req.headers['authorization'] || req.headers['x-api-key'] || req.headers['x-sepay-secret'] || '');
      const querySecret = String(req.query.secret || req.query.api_key || '');

      const apiKey = process.env.SEPAY_API_KEY || 'api_key_lananhbeauty_1414062005';
      const secretKey = process.env.SEPAY_SECRET_KEY || 'thanhbtdev-sepay-key';

      // Verify Authorization header or query secret against configured keys
      const isAuthorized = 
        (!authHeader && !querySecret) ||
        authHeader.toLowerCase().includes(apiKey.toLowerCase()) || 
        authHeader.toLowerCase().includes(secretKey.toLowerCase()) || 
        querySecret.toLowerCase() === secretKey.toLowerCase() ||
        querySecret.toLowerCase() === apiKey.toLowerCase();

      if (!isAuthorized) {
        console.warn(`[SePay Webhook Unauthorized] Header: "${authHeader}", QuerySecret: "${querySecret}"`);
        return res.status(401).json({ success: false, message: 'Xác thực Webhook SePay không hợp lệ.' });
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

      console.log(`[SePay Webhook Received] Transaction #${id || 'N/A'} - Amount: ${paidAmount}đ - Content: "${transferContent}"`);

      if (!transferContent && paidAmount === 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu webhook rỗng.' });
      }

      /**
       * VietQR / Banks can strip hyphens, add spaces, or format content differently.
       * DB stores: DH-6686-9615-8207
       * Webhook content may be: "DH668696158207", "DH 6686 9615 8207", "DH-6686-9615-8207", etc.
       */
      let matchedBooking = null;

      // Extract 12 digits following DH/LAB prefix, ignoring spaces, hyphens, and dots
      const dhMatch = transferContent.match(/(?:DH|LAB)[\s._-]*(\d{4})[\s._-]*(\d{4})[\s._-]*(\d{4})/i) ||
                      transferContent.match(/(?:DH|LAB)[\s._-]*(\d{12})/i);

      if (dhMatch) {
        const digits12 = dhMatch[1].length === 12 
          ? dhMatch[1] 
          : `${dhMatch[1]}${dhMatch[2]}${dhMatch[3]}`;
        const reconstructedId = `DH-${digits12.slice(0, 4)}-${digits12.slice(4, 8)}-${digits12.slice(8, 12)}`;
        console.log(`[SePay Webhook] Matched prefix DH! Reconstructed ID: ${reconstructedId}`);

        matchedBooking = await Booking.findOne({
          where: {
            id: reconstructedId,
            status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
          },
        });
      }

      // Secondary: Try matching any 12 continuous or grouped digits in content if DH prefix was omitted by user
      if (!matchedBooking) {
        const any12DigitsMatch = transferContent.replace(/[\s._-]/g, '').match(/\d{12}/);
        if (any12DigitsMatch) {
          const d12 = any12DigitsMatch[0];
          const reconId = `DH-${d12.slice(0, 4)}-${d12.slice(4, 8)}-${d12.slice(8, 12)}`;
          matchedBooking = await Booking.findOne({
            where: {
              id: reconId,
              status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
            },
          });
        }
      }

      // Tertiary: Legacy notes search for 10-11 digits
      if (!matchedBooking) {
        const legacyPrefixMatch = transferContent.match(/(?:DH|LAB)[_\s-]*(\d{10,11})/i);
        if (legacyPrefixMatch && legacyPrefixMatch[1]) {
          matchedBooking = await Booking.findOne({
            where: {
              notes: { [Op.like]: `%${legacyPrefixMatch[1]}%` },
              status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
            },
            order: [['createdAt', 'DESC']],
          });
        }
      }

      // Quaternary: Match customer phone number in transfer content
      if (!matchedBooking) {
        const phoneMatch = transferContent.match(/0\d{9}/);
        if (phoneMatch) {
          matchedBooking = await Booking.findOne({
            where: {
              customerPhone: phoneMatch[0],
              status: { [Op.in]: ['PENDING', 'CONFIRMED'] },
            },
            order: [['createdAt', 'DESC']],
          });
        }
      }

      // Fallback: Match latest PENDING booking
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

        console.log(`[SePay Webhook] Auto confirmed booking ${matchedBooking.id} via content: "${transferContent}"`);
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

      const rawTargetCode = String(code || bookingId || '').trim();

      const conditions = [];

      if (rawTargetCode) {
        // Direct id match
        conditions.push({ id: rawTargetCode });

        // Normalize (strip non-alphanumeric except DH prefix)
        const cleaned = rawTargetCode.replace(/[\s._-]/g, '');
        const dhMatch = cleaned.match(/^(?:DH|LAB)?(\d{12})$/i);
        if (dhMatch) {
          const d = dhMatch[1];
          const reconId = `DH-${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}`;
          conditions.push({ id: reconId });
        }

        // Legacy: notes search for any numeric part
        const numericPart = rawTargetCode.replace(/\D/g, '');
        if (numericPart.length >= 10) {
          conditions.push({ notes: { [Op.like]: `%${numericPart}%` } });
        }
      }
      if (phone) {
        conditions.push({ customerPhone: phone.trim() });
      }

      if (conditions.length === 0) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin tra cứu.' });
      }

      const booking = await Booking.findOne({
        where: { [Op.or]: conditions },
        order: [['createdAt', 'DESC']],
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
      }

      const isPaid = booking.status === 'CONFIRMED' || (booking.notes && (booking.notes.toLowerCase().includes('chuyển khoản') || booking.notes.toLowerCase().includes('sepay')));

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
      const rawTargetCode = String(code || bookingId || '').trim();

      const conditions = [];
      if (rawTargetCode) {
        conditions.push({ id: rawTargetCode });

        const cleaned = rawTargetCode.replace(/[\s._-]/g, '');
        const dhMatch = cleaned.match(/^(?:DH|LAB)?(\d{12})$/i);
        if (dhMatch) {
          const d = dhMatch[1];
          const reconId = `DH-${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}`;
          conditions.push({ id: reconId });
        }

        const numericPart = rawTargetCode.replace(/\D/g, '');
        if (numericPart.length >= 10) {
          conditions.push({ notes: { [Op.like]: `%${numericPart}%` } });
        }
      }
      if (phone) {
        conditions.push({ customerPhone: phone.trim() });
      }

      if (conditions.length === 0) {
        return res.status(400).json({ success: false, message: 'Thiếu mã booking hoặc số điện thoại.' });
      }

      const booking = await Booking.findOne({
        where: { [Op.or]: conditions },
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
