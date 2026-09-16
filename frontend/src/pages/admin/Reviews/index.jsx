import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config';
import styles from './Reviews.module.css';
import {
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
  PaperAirplaneIcon,
} from '../../../icons';

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'tokens'
  const [loading, setLoading] = useState(true);

  // State Tab 1: Reviews
  const [reviews, setReviews] = useState([]);
  const [reviewStatusFilter, setReviewStatusFilter] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');

  // State Tab 2: Tokens (Manual Link / QR Delivery)
  const [tokens, setTokens] = useState([]);
  const [tokenStatusFilter, setTokenStatusFilter] = useState('');
  const [tokenSearch, setTokenSearch] = useState('');

  // Modal State
  const [rejectModal, setRejectModal] = useState({ open: false, reviewId: null, reason: '' });
  const [qrModal, setQrModal] = useState({ open: false, link: '', bookingId: '', customerName: '' });

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch Reviews
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = {};
      if (reviewStatusFilter) params.status = reviewStatusFilter;
      if (reviewSearch.trim()) params.search = reviewSearch.trim();

      const response = await axios.get(`${API_URL}/reviews/admin/reviews`, {
        ...getHeaders(),
        params,
      });

      if (response.data?.success) {
        setReviews(response.data.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách đánh giá.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Tokens
  const fetchTokens = async () => {
    setLoading(true);
    try {
      const params = {};
      if (tokenStatusFilter) params.status = tokenStatusFilter;
      if (tokenSearch.trim()) params.search = tokenSearch.trim();

      const response = await axios.get(`${API_URL}/reviews/admin/tokens`, {
        ...getHeaders(),
        params,
      });

      if (response.data?.success) {
        setTokens(response.data.data || []);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể tải danh sách link đánh giá.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    } else {
      fetchTokens();
    }
  }, [activeTab, reviewStatusFilter, tokenStatusFilter]);

  // Handle Approve Review
  const handleApprove = async (reviewId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/reviews/admin/reviews/${reviewId}/status`,
        { status: 'approved' },
        getHeaders()
      );

      if (response.data?.success) {
        showToast('Đã phê duyệt bài đánh giá công khai!');
        fetchReviews();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Cập nhật thất bại.', 'error');
    }
  };

  // Handle Reject Review
  const handleRejectSubmit = async () => {
    if (!rejectModal.reviewId) return;

    try {
      const response = await axios.patch(
        `${API_URL}/reviews/admin/reviews/${rejectModal.reviewId}/status`,
        { status: 'rejected', rejectionReason: rejectModal.reason },
        getHeaders()
      );

      if (response.data?.success) {
        showToast('Đã từ chối bài đánh giá.');
        setRejectModal({ open: false, reviewId: null, reason: '' });
        fetchReviews();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Từ chối thất bại.', 'error');
    }
  };

  // Staff Action: Copy Link
  const handleCopyLink = async (tokenObj) => {
    const origin = window.location.origin;
    const reviewUrl = `${origin}/review?token=${tokenObj.bookingId}`;

    try {
      await navigator.clipboard.writeText(reviewUrl);
      showToast('Đã sao chép link đánh giá vào bộ nhớ tạm!');

      // Log action
      await axios.post(
        `${API_URL}/reviews/admin/tokens/${tokenObj.id}/log-action`,
        { action: 'copied_link' },
        getHeaders()
      );
    } catch (err) {
      showToast('Không thể sao chép tự động.', 'error');
    }
  };

  // Staff Action: Open QR Modal
  const handleOpenQR = async (tokenObj) => {
    const origin = window.location.origin;
    const reviewUrl = `${origin}/review?token=${tokenObj.bookingId}`;
    setQrModal({
      open: true,
      link: reviewUrl,
      bookingId: tokenObj.bookingId,
      customerName: tokenObj.customerName,
    });

    try {
      await axios.post(
        `${API_URL}/reviews/admin/tokens/${tokenObj.id}/log-action`,
        { action: 'generated_qr' },
        getHeaders()
      );
    } catch (err) {
      // Log failure fail-safe
    }
  };

  // Staff Action: Mark Sent
  const handleMarkSent = async (tokenObj) => {
    try {
      await axios.post(
        `${API_URL}/reviews/admin/tokens/${tokenObj.id}/log-action`,
        { action: 'marked_sent' },
        getHeaders()
      );
      showToast('Đã đánh giá dấu là đã gửi thủ công!');
      fetchTokens();
    } catch (err) {
      showToast('Cập nhật thất bại.', 'error');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return styles.statusApproved;
      case 'rejected': return styles.statusRejected;
      case 'sent': return styles.statusSent;
      case 'no_contact': return styles.statusNoContact;
      case 'manual_sent': return styles.statusManualSent;
      default: return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'pending': return 'Chờ duyệt';
      case 'sent': return 'Đã gửi Mail';
      case 'delivered': return 'Đã nhận Mail';
      case 'failed': return 'Gửi Mail Lỗi';
      case 'no_contact': return 'Không có Email';
      case 'manual_sent': return 'Đã gửi thủ công';
      default: return status;
    }
  };

  return (
    <div className={styles.container}>
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm transition-all duration-300 ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-[#775932]'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Quản Lý Feedback & Đánh Giá</h1>
          <p className={styles.subtitle}>
            Kiểm duyệt nhận xét khách hàng và quản lý gửi link đánh giá dịch vụ spa
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          <StarIcon className="w-4 h-4" />
          <span>Kiểm Duyệt Đánh Giá ({reviews.length})</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'tokens' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('tokens')}
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          <span>Link Đánh Giá & QR Thủ Công ({tokens.length})</span>
        </button>
      </div>

      {/* TAB 1: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <>
          <div className={styles.filtersBar}>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên khách, dịch vụ, nội dung..."
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
              className={styles.searchInput}
            />
            <select
              value={reviewStatusFilter}
              onChange={(e) => setReviewStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt (Pending)</option>
              <option value="approved">Đã duyệt (Approved)</option>
              <option value="rejected">Từ chối (Rejected)</option>
            </select>
          </div>

          <div className={styles.tableContainer}>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Đang tải danh sách đánh giá...</div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Chưa có bài đánh giá nào.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Khách Hàng</th>
                    <th>Dịch Vụ</th>
                    <th>Đánh Giá</th>
                    <th>Nhận Xét</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((item) => (
                    <tr key={item.id}>
                      <td className="font-mono text-xs font-bold text-gray-700">{item.bookingId}</td>
                      <td>
                        <div className="font-semibold text-gray-900">{item.displayName}</div>
                        <div className="text-xs text-gray-400">{item.customerPhone}</div>
                      </td>
                      <td className="font-medium text-[#775932]">{item.serviceName}</td>
                      <td>
                        <div className="flex items-center space-x-1 text-amber-500">
                          {[...Array(item.rating)].map((_, i) => (
                            <StarIcon key={i} className="w-4 h-4 fill-amber-400" />
                          ))}
                          <span className="text-xs font-bold ml-1 text-gray-600">({item.rating}/5)</span>
                        </div>
                      </td>
                      <td className="max-w-xs">
                        <p className="text-sm text-gray-800 line-clamp-2 italic">
                          "{item.comment || 'Không có nhận xét'}"
                        </p>
                        {item.rejectionReason && (
                          <span className="text-xs text-red-500 block mt-1">Lý do từ chối: {item.rejectionReason}</span>
                        )}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtnGroup}>
                          {item.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(item.id)}
                              className={styles.btnApprove}
                              title="Duyệt hiển thị công khai"
                            >
                              Duyệt
                            </button>
                          )}
                          {item.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => setRejectModal({ open: true, reviewId: item.id, reason: '' })}
                              className={styles.btnReject}
                              title="Từ chối hiển thị"
                            >
                              Từ Chối
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* TAB 2: MANUAL LINK & QR CODES */}
      {activeTab === 'tokens' && (
        <>
          <div className={styles.filtersBar}>
            <input
              type="text"
              placeholder="Tìm theo tên khách, SĐT, mã đơn..."
              value={tokenSearch}
              onChange={(e) => setTokenSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTokens()}
              className={styles.searchInput}
            />
            <select
              value={tokenStatusFilter}
              onChange={(e) => setTokenStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="">Tất cả trạng thái gửi</option>
              <option value="no_contact">Không có Email (Gửi tay)</option>
              <option value="failed">Gửi Email thất bại</option>
              <option value="sent">Đã gửi Email</option>
              <option value="manual_sent">Đã gửi thủ công</option>
            </select>
          </div>

          <div className={styles.tableContainer}>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Đang tải danh sách link...</div>
            ) : tokens.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Không tìm thấy yêu cầu gửi link nào.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Khách Hàng</th>
                    <th>SĐT / Email</th>
                    <th>Hạn Dùng Link</th>
                    <th>Trạng Thái Gửi</th>
                    <th>Gửi Thủ Công (Zalo / QR)</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((tokenObj) => (
                    <tr key={tokenObj.id}>
                      <td className="font-mono text-xs font-bold text-gray-700">{tokenObj.bookingId}</td>
                      <td className="font-semibold text-gray-900">{tokenObj.customerName}</td>
                      <td>
                        <div className="text-sm">{tokenObj.customerPhone}</div>
                        <div className="text-xs text-gray-400">{tokenObj.customerEmail || 'Chưa có Email'}</div>
                      </td>
                      <td className="text-xs text-gray-600">
                        {new Date(tokenObj.expiresAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusBadgeClass(tokenObj.sendStatus)}`}>
                          {getStatusText(tokenObj.sendStatus)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtnGroup}>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(tokenObj)}
                            className={styles.btnCopy}
                            title="Sao chép link gửi Zalo/SMS"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4 inline mr-1" />
                            Copy Link
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenQR(tokenObj)}
                            className={styles.btnQR}
                            title="Hiển thị mã QR cho khách quét"
                          >
                            <QrCodeIcon className="w-4 h-4 inline mr-1" />
                            Mã QR
                          </button>
                          {tokenObj.sendStatus !== 'manual_sent' && (
                            <button
                              type="button"
                              onClick={() => handleMarkSent(tokenObj)}
                              className={styles.btnApprove}
                              title="Đánh dấu đã gửi thủ công"
                            >
                              Đã Gửi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* REJECT MODAL */}
      {rejectModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Từ Chối Đánh Giá</h3>
            <p className="text-sm text-gray-600 mb-3">
              Nhập lý do từ chối hiển thị bài đánh giá này (lưu vết nội bộ):
            </p>
            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="VD: Nhận xét chứa từ ngữ chưa phù hợp..."
              className="w-full p-2.5 rounded-lg border border-gray-300 text-sm mb-4 resize-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, reviewId: null, reason: '' })}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className={styles.btnReject}
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {qrModal.open && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + " text-center"}>
            <h3 className={styles.modalTitle}>Mã QR Đánh Giá Dịch Vụ</h3>
            <p className="text-xs text-gray-500 mb-1">
              Đơn hàng: <strong className="text-gray-800">{qrModal.bookingId}</strong> - Khách: <strong className="text-gray-800">{qrModal.customerName}</strong>
            </p>
            <div className="my-4 flex justify-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrModal.link)}`}
                alt="QR Code Đánh Giá"
                className="w-52 h-52 shadow-sm rounded-md"
              />
            </div>
            <p className="text-xs text-gray-500 mb-4">Mở ứng dụng Camera hoặc Zalo trên điện thoại để quét mã QR</p>
            <button
              type="button"
              onClick={() => setQrModal({ open: false, link: '', bookingId: '', customerName: '' })}
              className="w-full py-2.5 rounded-lg bg-[#775932] text-white font-medium text-sm"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
