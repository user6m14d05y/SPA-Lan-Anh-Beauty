import reviewService from '../services/reviewService.js';

const handleError = (res, error, fallbackMessage = 'Có lỗi xảy ra') => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const reviewController = {
  // Client: Xác minh token
  async verifyToken(req, res) {
    try {
      const { token } = req.query;
      const data = await reviewService.verifyReviewToken(token);
      res.status(200).json({
        success: true,
        message: 'Token hợp lệ.',
        data,
      });
    } catch (error) {
      handleError(res, error, 'Mã token không hợp lệ.');
    }
  },

  // Client: Gửi đánh giá
  async submitReview(req, res) {
    try {
      const { token, rating, comment } = req.body || {};
      const review = await reviewService.submitReview(token, { rating, comment });
      res.status(201).json({
        success: true,
        message: 'Cảm ơn bạn đã gửi đánh giá! Chúng tôi sẽ kiểm duyệt nhận xét của bạn sớm nhất.',
        data: review,
      });
    } catch (error) {
      handleError(res, error, 'Không thể gửi đánh giá.');
    }
  },

  // Client Public: Danh sách đánh giá công khai đã duyệt (Redis Cache)
  async getPublicApprovedReviews(req, res) {
    try {
      const reviews = await reviewService.getPublicApprovedReviews();
      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy danh sách đánh giá.');
    }
  },

  // Admin: Lấy danh sách Token (Link & QR Code gửi thủ công)
  async getAdminTokens(req, res) {
    try {
      const tokens = await reviewService.getAdminTokens(req.query);
      res.status(200).json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy danh sách link đánh giá.');
    }
  },

  // Admin: Ghi log thao tác nhân viên (Copy link / Xuất QR / Đã gửi)
  async logStaffAction(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.body || {};
      const log = await reviewService.logStaffAction(id, req.user.id, action);
      res.status(200).json({
        success: true,
        message: 'Ghi log thao tác thành công.',
        data: log,
      });
    } catch (error) {
      handleError(res, error, 'Không thể ghi log thao tác.');
    }
  },

  // Admin: Lấy danh sách Reviews kiểm duyệt
  async getAdminReviews(req, res) {
    try {
      const reviews = await reviewService.getAdminReviews(req.query);
      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy danh sách đánh giá.');
    }
  },

  // Admin: Duyệt / Từ chối Đánh giá
  async updateReviewStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, rejectionReason } = req.body || {};
      const updated = await reviewService.updateReviewStatus(id, { status, rejectionReason }, req.user);
      res.status(200).json({
        success: true,
        message: status === 'approved' ? 'Đã phê duyệt đánh giá công khai!' : 'Đã từ chối đánh giá.',
        data: updated,
      });
    } catch (error) {
      handleError(res, error, 'Không thể cập nhật trạng thái đánh giá.');
    }
  },
};

export default reviewController;
