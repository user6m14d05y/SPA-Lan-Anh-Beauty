import crypto from 'crypto';
import { Op } from 'sequelize';
import sanitizeHtml from 'sanitize-html';
import Booking from '../models/Booking.js';
import ReviewToken from '../models/ReviewToken.js';
import Review from '../models/Review.js';
import ReviewDeliveryLog from '../models/ReviewDeliveryLog.js';
import emailService from './emailService.js';
import { getCache, setCache, delCache } from '../config/redis.js';

const CACHE_KEY_PUBLIC_REVIEWS = 'public_approved_reviews';
const TOKEN_TTL_DAYS = 14;

const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
};

const formatDisplayName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[parts.length - 1];
  const lastInitial = parts[0].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
};

export const reviewService = {
  /**
   * Tự động sinh Token đánh giá khi Booking chuyển sang trạng thái COMPLETED
   */
  async generateReviewTokenForBooking(booking) {
    if (!booking || !booking.id) return null;

    // Kiểm tra xem đã sinh token cho booking này chưa (Idempotent check)
    const existingToken = await ReviewToken.findOne({ where: { bookingId: booking.id } });
    if (existingToken) return existingToken;

    // Sinh token ngẫu nhiên 32-byte an toàn
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TOKEN_TTL_DAYS);

    const hasEmail = Boolean(booking.customerEmail && booking.customerEmail.trim());

    const reviewToken = await ReviewToken.create({
      bookingId: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail || null,
      tokenHash,
      expiresAt,
      sendStatus: hasEmail ? 'pending' : 'no_contact',
    });

    // Nếu có email -> Gửi email lời mời đánh giá
    if (hasEmail) {
      try {
        const clientBaseUrl = process.env.CLIENT_URL || 'https://lananhbeauty.thanhbtdev.id.vn';
        const reviewLink = `${clientBaseUrl}/review?token=${rawToken}`;

        await emailService.sendReviewInvitation({
          to: booking.customerEmail,
          customerName: booking.customerName,
          serviceName: booking.serviceName,
          reviewLink,
        });

        await reviewToken.update({
          sendStatus: 'sent',
          sendAttempts: 1,
        });
      } catch (err) {
        console.warn(`[Review Email Send Failed] Booking #${booking.id}:`, err.message);
        await reviewToken.update({
          sendStatus: 'failed',
          sendAttempts: 1,
          failedReason: err.message,
        });
      }
    }

    return reviewToken;
  },

  /**
   * Xác minh token từ Client link
   */
  async verifyReviewToken(rawToken) {
    if (!rawToken || typeof rawToken !== 'string') {
      throw { status: 400, message: 'Mã token đánh giá không hợp lệ.' };
    }

    const trimmed = rawToken.trim();
    const tokenHash = hashToken(trimmed);
    let tokenRecord = await ReviewToken.findOne({ where: { tokenHash } });

    // Fallback 1: Tìm theo bookingId trực tiếp
    if (!tokenRecord) {
      tokenRecord = await ReviewToken.findOne({ where: { bookingId: trimmed } });
    }

    // Fallback 2: Nếu booking tồn tại nhưng chưa có token record, tự động tạo token
    if (!tokenRecord) {
      const booking = await Booking.findByPk(trimmed);
      if (booking) {
        tokenRecord = await this.generateReviewTokenForBooking(booking);
      }
    }

    if (!tokenRecord) {
      throw { status: 404, message: 'Link đánh giá không tồn tại hoặc đã hết hạn.' };
    }

    if (tokenRecord.usedAt) {
      throw { status: 410, message: 'Link đánh giá này đã được sử dụng. Cảm ơn bạn!' };
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      throw { status: 410, message: 'Link đánh giá này đã hết hạn sử dụng (giới hạn 14 ngày).' };
    }

    const booking = await Booking.findByPk(tokenRecord.bookingId);
    if (!booking) {
      throw { status: 404, message: 'Không tìm thấy thông tin đơn dịch vụ tương ứng.' };
    }

    return {
      token: trimmed,
      tokenId: tokenRecord.id,
      bookingId: booking.id,
      customerName: booking.customerName,
      serviceName: booking.serviceName,
      bookingDate: booking.bookingDate,
      displayName: formatDisplayName(booking.customerName),
    };
  },

  /**
   * Khách gửi Đánh giá (Client Submit)
   */
  async submitReview(rawToken, { rating, comment }) {
    const verified = await this.verifyReviewToken(rawToken);

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      throw { status: 422, message: 'Số sao đánh giá phải từ 1 đến 5.' };
    }

    const sanitizedComment = comment
      ? sanitizeHtml(String(comment).trim(), { allowedTags: [], allowedAttributes: {} }).slice(0, 300)
      : null;

    // Đảm bảo mỗi booking chỉ có 1 review
    const existedReview = await Review.findOne({ where: { bookingId: verified.bookingId } });
    if (existedReview) {
      throw { status: 409, message: 'Đơn đặt lịch này đã gửi đánh giá trước đó.' };
    }

    const review = await Review.create({
      bookingId: verified.bookingId,
      customerPhone: (await Booking.findByPk(verified.bookingId))?.customerPhone || '',
      serviceName: verified.serviceName,
      rating: numericRating,
      comment: sanitizedComment,
      displayName: verified.displayName,
      avatarType: 'initials',
      status: 'pending',
    });

    // Vô hiệu hóa token (đánh dấu usedAt)
    if (verified.tokenId) {
      await ReviewToken.update({ usedAt: new Date() }, { where: { id: verified.tokenId } });
    }

    return review;
  },

  /**
   * Lấy danh sách đánh giá đã duyệt hiển thị công khai (Public + Redis Caching)
   */
  async getPublicApprovedReviews() {
    const cachedData = await getCache(CACHE_KEY_PUBLIC_REVIEWS);
    if (cachedData) return cachedData;

    const reviews = await Review.findAll({
      where: { status: 'approved' },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    await setCache(CACHE_KEY_PUBLIC_REVIEWS, reviews, 600); // Cache 10 phút
    return reviews;
  },

  /**
   * Lấy danh sách Review Tokens cho Admin Feedback Tab (Link thủ công & QR)
   */
  async getAdminTokens(query = {}) {
    const { status, search } = query;
    const where = {};

    if (status) {
      where.sendStatus = status;
    }

    if (search) {
      where[Op.or] = [
        { customerName: { [Op.like]: `%${search}%` } },
        { customerPhone: { [Op.like]: `%${search}%` } },
        { bookingId: { [Op.like]: `%${search}%` } },
      ];
    }

    const tokens = await ReviewToken.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 100,
    });

    return tokens;
  },

  /**
   * Ghi log thao tác gửi thủ công của Nhân viên
   */
  async logStaffAction(tokenId, staffId, action) {
    const token = await ReviewToken.findByPk(tokenId);
    if (!token) throw { status: 404, message: 'Không tìm thấy token.' };

    const log = await ReviewDeliveryLog.create({
      reviewTokenId: token.id,
      staffId,
      action,
    });

    if (action === 'marked_sent') {
      await token.update({ sendStatus: 'manual_sent' });
    }

    return log;
  },

  /**
   * Lấy danh sách Reviews cho Admin kiểm duyệt
   */
  async getAdminReviews(query = {}) {
    const { status, search } = query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { displayName: { [Op.like]: `%${search}%` } },
        { serviceName: { [Op.like]: `%${search}%` } },
        { comment: { [Op.like]: `%${search}%` } },
      ];
    }

    return Review.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  },

  /**
   * Admin Phê duyệt / Từ chối Đánh giá
   */
  async updateReviewStatus(id, { status, rejectionReason }, adminUser) {
    const review = await Review.findByPk(id);
    if (!review) throw { status: 404, message: 'Không tìm thấy bài đánh giá.' };

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      throw { status: 422, message: 'Trạng thái không hợp lệ.' };
    }

    await review.update({
      status,
      rejectionReason: status === 'rejected' ? (rejectionReason || 'Nội dung chưa phù hợp').trim() : null,
      approvedBy: status === 'approved' ? adminUser.id : null,
      approvedAt: status === 'approved' ? new Date() : null,
    });

    // Xóa Redis Cache công khai để dữ liệu mới lập tức cập nhật
    await delCache(CACHE_KEY_PUBLIC_REVIEWS);

    return review;
  },
};

export default reviewService;
