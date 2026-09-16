import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config';
import { StarIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from '../../../icons';

const logoImg = "/Logo.png";

export default function ClientReviewPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('booking');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Thiếu mã xác thực đánh giá.');
      setVerifying(false);
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get(`${API_URL}/reviews/verify-token?token=${encodeURIComponent(token)}`);
        if (response.data?.success) {
          setTokenData(response.data.data);
        } else {
          setError(response.data?.message || 'Token không hợp lệ.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Link đánh giá không tồn tại hoặc đã hết hạn.');
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/reviews/submit`, {
        token,
        rating,
        comment: comment.trim(),
      });

      if (response.data?.success) {
        setSuccess(true);
      } else {
        setError(response.data?.message || 'Gửi đánh giá thất bại.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return 'Xuất sắc (5/5 sao)';
      case 4: return 'Rất tốt (4/5 sao)';
      case 3: return 'Hài lòng (3/5 sao)';
      case 2: return 'Tạm được (2/5 sao)';
      case 1: return 'Cần cải thiện (1/5 sao)';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FAF6F0] via-[#F4EDE2] to-[#E9DEC9] py-12 px-4 sm:px-6 flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Ambient Light Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-[#C59B63]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Luxury Feedback Card */}
      <div className="max-w-lg w-full bg-white/95 backdrop-blur-xl rounded-3xl border border-[#C59B63]/25 shadow-[0_25px_60px_-15px_rgba(197,155,99,0.2)] overflow-hidden relative z-10 transition-all duration-300">

        {/* Brand Header Banner - Champagne Gold & Silk Ivory */}
        <div className="bg-gradient-to-b from-[#FAF4EA] via-[#F2E5D3] to-[#FAF4EA] p-8 text-center relative border-b border-[#C59B63]/20 shadow-xs">
          
          {/* Logo Frame */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-white rounded-full p-2.5 shadow-[0_8px_25px_rgba(197,155,99,0.25)] border-2 border-[#C59B63]/40 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
              <img src={logoImg} alt="Lan Anh Beauty Logo" className="max-h-full max-w-full object-contain filter drop-shadow-sm" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 border border-[#C59B63]/30 text-[#8E642E] text-[0.7rem] font-bold tracking-widest uppercase mb-2.5 shadow-xs">
            <SparklesIcon className="w-3.5 h-3.5 text-[#C59B63]" />
            <span>LAN ANH BEAUTY SPA</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#2A1E17] tracking-wide">
            Đánh Giá Trải Nghiệm Khách Hàng
          </h1>
          <p className="text-xs text-[#7A614A] font-medium mt-1.5 max-w-xs mx-auto leading-relaxed">
            Ý kiến phản hồi quý báu của bạn giúp chúng tôi không ngừng hoàn thiện chất lượng dịch vụ
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          {loading || verifying ? (
            <div className="py-14 text-center text-stone-500">
              <div className="inline-block animate-spin rounded-full h-9 w-9 border-3 border-[#C59B63] border-t-transparent mb-3" />
              <p className="text-xs font-semibold uppercase tracking-wider text-[#8E642E]">Đang xác thực mã lịch hẹn...</p>
            </div>
          ) : error && !success ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl border border-red-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ExclamationTriangleIcon className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-stone-800 mb-1.5">Không thể mở form đánh giá</h2>
              <p className="text-xs text-stone-600 mb-6 max-w-sm mx-auto leading-relaxed">{error}</p>
              <Link 
                to="/" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C59B63] to-[#9A7543] text-white font-semibold text-xs tracking-wider uppercase shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Trở Về Trang Chủ
              </Link>
            </div>
          ) : success ? (
            <div className="py-10 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-amber-50 text-[#C59B63] rounded-full border border-[#C59B63]/40 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircleIcon className="w-10 h-10 text-[#C59B63]" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#2A1E17] mb-2">Cảm Ơn Quý Khách!</h2>
              <p className="text-xs text-stone-600 mb-6 max-w-sm mx-auto leading-relaxed">
                Bài đánh giá của quý khách đã được ghi nhận. Lan Anh Beauty rất hân hạnh được đồng hành cùng vẻ đẹp của bạn!
              </p>
              <Link 
                to="/" 
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C59B63] to-[#9A7543] text-white font-semibold text-xs tracking-wider uppercase shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Trở Về Trang Chủ
              </Link>
            </div>
          ) : tokenData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Receipt / Customer Info Badge */}
              <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F5EFE6] border border-[#C59B63]/25 rounded-2xl p-4 text-left flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[0.68rem] text-[#8E642E]/80 uppercase tracking-wider block font-bold mb-0.5">Khách hàng</span>
                  <span className="text-sm font-bold text-[#2A1E17]">{tokenData.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[0.68rem] text-[#8E642E]/80 uppercase tracking-wider block font-bold mb-0.5">Dịch vụ sử dụng</span>
                  <span className="text-xs font-bold text-[#9A7543]">{tokenData.serviceName}</span>
                </div>
              </div>

              {/* Star Rating Picker (Clean & Elegant) */}
              <div className="text-center py-2">
                <label className="block text-xs font-bold text-[#2A1E17] uppercase tracking-wider mb-3">
                  Quý khách đánh giá chất lượng dịch vụ:
                </label>
                <div className="flex items-center justify-center space-x-2.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 focus:outline-none transition-transform transform hover:scale-125 duration-200 cursor-pointer"
                        aria-label={`Đánh giá ${star} sao`}
                      >
                        <StarIcon
                          className={`w-9 h-9 transition-all duration-200 ${
                            active 
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_4px_10px_rgba(251,191,36,0.4)]' 
                              : 'text-stone-200 fill-stone-100 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <span className="inline-block px-4 py-1.5 rounded-full bg-[#FAF3EA] border border-[#C59B63]/30 text-[#8E642E] text-xs font-bold tracking-wide shadow-xs">
                    {getRatingLabel(hoverRating || rating)}
                  </span>
                </div>
              </div>

              {/* Comment Input Area */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="comment" className="block text-xs font-bold text-[#2A1E17] uppercase tracking-wider">
                    Nhận xét & Gợi ý cải thiện (Không bắt buộc)
                  </label>
                  <span className="text-[0.7rem] text-stone-400 font-mono">{comment.length}/300</span>
                </div>
                <textarea
                  id="comment"
                  rows={4}
                  maxLength={300}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về thái độ phục vụ, không gian spa hoặc tay nghề kỹ thuật viên..."
                  className="w-full px-4 py-3.5 rounded-xl border border-[#C59B63]/25 bg-[#FAF7F2]/60 text-stone-800 focus:bg-white focus:border-[#C59B63] focus:ring-2 focus:ring-[#C59B63]/20 text-xs sm:text-sm resize-none transition-all outline-none shadow-xs"
                />
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#C59B63] to-[#9A7543] text-white font-bold text-xs sm:text-sm tracking-widest uppercase shadow-[0_10px_25px_-5px_rgba(197,155,99,0.4)] hover:shadow-[0_15px_30px_-5px_rgba(197,155,99,0.5)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>ĐANG GỬI ĐÁNH GIÁ...</span>
                  </>
                ) : (
                  <span>GỬI ĐÁNH GIÁ NGAY</span>
                )}
              </button>

            </form>
          )}
        </div>

        {/* Footer Brand Tagline inside card */}
        <div className="bg-[#FAF7F2] px-6 py-3.5 border-t border-[#C59B63]/15 text-center">
          <p className="text-[0.68rem] text-stone-400 font-medium">
            © 2026 Lan Anh Beauty Spa • Bảo mật & An toàn thông tin
          </p>
        </div>

      </div>
    </div>
  );
}
