import { useEffect, useMemo, useState, useRef } from 'react';
import { Eye, CheckCircle, ShieldCheck, X, ChevronDown, Calendar, Clock, Phone, Mail, Sparkles } from '../../../icons.jsx';
import { useAuth } from '../../../context/AuthContext';

const API_URL = 'http://localhost:5000/api';
const ASSET_URL = 'http://localhost:5000';

const statusLabels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Đã hoàn thành',
    CANCELLED: 'Đã hủy',
};

const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'COMPLETED', label: 'Đã hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
];

const getStatusClass = (status) => {
    if (status === 'CONFIRMED' || status === 'COMPLETED') return 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]';
    if (status === 'PENDING') return 'bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]';
    if (status === 'CANCELLED') return 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]';
    return 'bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb]';
};

const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${ASSET_URL}${path}`;
};

const CustomSelect = ({ value, onChange, options, placeholder = "Chọn" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find((o) => o.value === value)?.label || placeholder;

    return (
        <div className="relative min-w-[170px]" ref={dropdownRef}>
            <div
                className="flex items-center justify-between px-[15px] py-[10px] border border-[var(--border)] rounded-lg bg-[var(--bg-light)] text-[var(--text-dark)] cursor-pointer hover:border-[var(--primary)] transition-colors shadow-sm"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate text-[0.95rem]">{selectedLabel}</span>
                <span className={`text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} />
                </span>
            </div>
            
            {isOpen && (
                <div className="absolute z-[100] top-[calc(100%+6px)] left-0 w-full bg-[var(--bg-light)] border border-[var(--border)] rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)] overflow-hidden">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`px-[15px] py-[10px] cursor-pointer text-[0.95rem] transition-colors ${value === option.value ? 'bg-[var(--primary)] text-[var(--white)] font-medium' : 'text-[var(--text-dark)] hover:bg-[var(--bg)] hover:text-[var(--primary)]'}`}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const sortOptions = [
    { value: 'desc', label: 'Mới nhất trước' },
    { value: 'asc', label: 'Cũ nhất trước' },
];

export default function Bookings() {
    const { authFetch } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');
    const [dateFilter, setDateFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await authFetch(`${API_URL}/bookings?page=${pagination.page}&limit=${pagination.limit}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Không thể tải danh sách lịch hẹn.');
            }

            setAppointments(result.data || []);
            setPagination((current) => ({ ...current, ...(result.pagination || {}) }));
        } catch (error) {
            setError(error.message || 'Không thể tải danh sách lịch hẹn.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [pagination.page, pagination.limit]);

    const filteredAppointments = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        let result = appointments.filter((appointment) => {
            const matchesSearch = !keyword
                || appointment.customerName?.toLowerCase().includes(keyword)
                || appointment.customerPhone?.toLowerCase().includes(keyword)
                || appointment.customerEmail?.toLowerCase().includes(keyword)
                || appointment.serviceName?.toLowerCase().includes(keyword);
            const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
            const matchesDate = !dateFilter || appointment.bookingDate === dateFilter;

            return matchesSearch && matchesStatus && matchesDate;
        });

        result.sort((a, b) => {
            if (sortOrder === 'desc') {
                return b.id - a.id;
            } else {
                return a.id - b.id;
            }
        });

        return result;
    }, [appointments, searchTerm, statusFilter, dateFilter, sortOrder]);

    const handleStatusUpdate = async (appointment, status) => {
        const confirmMessages = {
            CONFIRMED: `Xác nhận lịch hẹn #${appointment.id} của ${appointment.customerName}?`,
            COMPLETED: `Đánh dấu lịch hẹn #${appointment.id} là đã hoàn thành?`,
            CANCELLED: `Hủy lịch hẹn #${appointment.id} của ${appointment.customerName}?`,
        };

        if (confirmMessages[status] && !window.confirm(confirmMessages[status])) return;

        try {
            setUpdatingId(appointment.id);
            const response = await authFetch(`${API_URL}/bookings/${appointment.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Không thể cập nhật trạng thái.');
            }

            setAppointments((current) => current.map((item) => (
                item.id === appointment.id ? result.data : item
            )));
            setSelectedAppointment((current) => (
                current?.id === appointment.id ? result.data : current
            ));
        } catch (error) {
            alert(error.message || 'Không thể cập nhật trạng thái.');
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="pb-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-[1.8rem] font-semibold text-[var(--primary)] font-serif m-0">Quản lý Lịch hẹn</h2>
                    <p className="text-[var(--text-muted)] mt-1.5 leading-relaxed">Theo dõi lịch hẹn khách đặt từ website và xử lý trạng thái nhanh chóng.</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-[18px] bg-[var(--bg-light)] p-3.5 rounded-xl border border-[var(--border)] shadow-sm">
                <input
                    className="flex-1 min-w-[250px] px-[15px] py-[10px] border border-[var(--border)] rounded-lg outline-none focus:border-[var(--primary)] bg-[var(--bg-light)] text-[var(--text-dark)] transition-colors"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm tên, SĐT, email hoặc dịch vụ..."
                />
                <CustomSelect 
                    value={statusFilter} 
                    onChange={setStatusFilter} 
                    options={statusOptions} 
                />

                <CustomSelect 
                    value={sortOrder} 
                    onChange={setSortOrder} 
                    options={sortOptions} 
                />
                <input
                    type="date"
                    className="px-[12px] py-[10px] border border-[var(--border)] rounded-lg outline-none bg-[var(--bg-light)] text-[var(--text-dark)] cursor-pointer"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                />
                <button
                    type="button"
                    className="px-5 py-2.5 bg-[var(--primary)] text-[var(--white)] font-medium rounded-lg hover:bg-[var(--primary-light)] transition-all hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(119,89,50,0.2)] cursor-pointer"
                    onClick={fetchAppointments}
                >
                    Làm mới
                </button>
            </div>

            {error && <div className="mb-4 p-6 bg-[#fee2e2] text-[#991b1b] rounded-[10px] border border-[#fecaca] text-center">{error}</div>}

            <div className="bg-[var(--bg-light)] rounded-xl border border-[var(--border)] overflow-x-auto shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">Đang tải danh sách lịch hẹn...</div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-muted)]">Không tìm thấy lịch hẹn phù hợp.</div>
                ) : (
                    <table className="w-full min-w-[1100px] text-left border-collapse table-fixed">
                        <thead>
                            <tr>
                                <th className="w-[80px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Mã LH</th>
                                <th className="w-[170px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Khách hàng</th>
                                <th className="w-[130px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">SĐT</th>
                                <th className="w-[200px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)]">Email</th>
                                <th className="w-[240px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)]">Dịch vụ</th>
                                <th className="w-[110px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Ngày</th>
                                <th className="w-[80px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Giờ</th>
                                <th className="w-[140px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Trạng thái</th>
                                <th className="w-[140px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAppointments.map((appointment) => (
                                <tr key={appointment.id} className="hover:bg-[rgba(119,89,50,0.035)] transition-colors group">
                                    <td className="px-5 py-4 border-b border-[var(--border)] text-[0.95rem] text-[var(--text-muted)] group-last:border-none">#{appointment.id}</td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] text-[0.95rem] font-semibold text-[var(--text-dark)] group-last:border-none"><div className="truncate" title={appointment.customerName}>{appointment.customerName}</div></td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] text-[0.95rem] text-[var(--text-dark)] group-last:border-none whitespace-nowrap">{appointment.customerPhone}</td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] text-[0.95rem] text-[var(--text-dark)] group-last:border-none"><div className="truncate" title={appointment.customerEmail || 'Không có'}>{appointment.customerEmail || 'Không có'}</div></td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] text-[0.95rem] text-[var(--text-dark)] group-last:border-none"><div className="line-clamp-2 leading-relaxed" title={appointment.serviceName}>{appointment.serviceName}</div></td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] text-[0.95rem] text-[var(--text-dark)] group-last:border-none">{appointment.bookingDate}</td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] text-[0.95rem] text-[var(--text-dark)] group-last:border-none">{String(appointment.bookingTime).slice(0, 5)}</td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] align-middle group-last:border-none">
                                        <span className={`px-3 py-1 text-[0.78rem] font-medium rounded-full inline-flex items-center whitespace-nowrap ${getStatusClass(appointment.status)}`}>
                                            {statusLabels[appointment.status] || appointment.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] align-middle group-last:border-none">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                title="Xem chi tiết"
                                                className="w-8 h-8 rounded-full bg-[var(--bg)] text-[var(--primary)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[rgba(119,89,50,0.1)] flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105"
                                                onClick={() => setSelectedAppointment(appointment)}
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {appointment.status === 'PENDING' && (
                                                <button
                                                    type="button"
                                                    title="Xác nhận lịch hẹn"
                                                    disabled={updatingId === appointment.id}
                                                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 disabled:opacity-50"
                                                    onClick={() => handleStatusUpdate(appointment, 'CONFIRMED')}
                                                >
                                                    <CheckCircle size={15} />
                                                </button>
                                            )}
                                            {appointment.status === 'CONFIRMED' && (
                                                <button
                                                    type="button"
                                                    title="Đánh dấu hoàn thành"
                                                    disabled={updatingId === appointment.id}
                                                    className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 disabled:opacity-50"
                                                    onClick={() => handleStatusUpdate(appointment, 'COMPLETED')}
                                                >
                                                    <ShieldCheck size={15} />
                                                </button>
                                            )}
                                            {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                                                <button
                                                    type="button"
                                                    title="Hủy lịch hẹn"
                                                    disabled={updatingId === appointment.id}
                                                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 disabled:opacity-50"
                                                    onClick={() => handleStatusUpdate(appointment, 'CANCELLED')}
                                                >
                                                    <X size={15} />
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2 text-[var(--text-muted)]">
                <span>Hiển thị {appointments.length} / {pagination.total} lịch hẹn</span>
                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        className="px-3 py-2 bg-[var(--bg-light)] border border-[var(--border)] text-[var(--text-dark)] rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        disabled={pagination.page <= 1}
                        onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))}
                    >
                        Trước
                    </button>
                    <strong className="text-[var(--text-dark)] font-semibold mx-1">{pagination.page} / {pagination.totalPages || 1}</strong>
                    <button
                        type="button"
                        className="px-3 py-2 bg-[var(--bg-light)] border border-[var(--border)] text-[var(--text-dark)] rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))}
                    >
                        Sau
                    </button>
                </div>
            </div>

            {selectedAppointment && (
                <div 
                    className="fixed inset-0 bg-[#14100D]/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn" 
                    onClick={() => setSelectedAppointment(null)}
                >
                    <div 
                        className="bg-white rounded-3xl w-full max-w-[840px] overflow-hidden shadow-[0_30px_90px_rgba(28,22,18,0.22)] border border-[var(--border)] animate-scaleUp my-auto" 
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Header Banner */}
                        <div className="bg-gradient-to-r from-[#FAF7F2] via-[#F5EFE6] to-[#FAF7F2] p-6 sm:p-7 border-b border-[var(--border)] relative">
                            <button
                                type="button"
                                className="absolute top-6 right-6 w-9 h-9 rounded-full border border-[var(--border)] bg-white text-[var(--text-dark)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs"
                                onClick={() => setSelectedAppointment(null)}
                            >
                                <X size={18} />
                            </button>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#C59B63] text-white font-serif font-bold text-xl flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 hover:scale-105">
                                    {selectedAppointment.customerName ? selectedAppointment.customerName.split(' ').map(n => n[0]).join('').slice(-2).toUpperCase() : 'KH'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-serif font-bold text-[var(--text-dark)] m-0">{selectedAppointment.customerName}</h3>
                                        <span className={`px-3 py-0.5 text-[0.75rem] font-bold rounded-full transition-all duration-300 ${getStatusClass(selectedAppointment.status)}`}>
                                            {statusLabels[selectedAppointment.status] || selectedAppointment.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-[0.88rem] text-[var(--text-muted)] mt-1">
                                        <span className="flex items-center gap-1.5 font-medium text-[var(--text-dark)]">
                                            <Phone size={14} className="text-[var(--primary)]" /> {selectedAppointment.customerPhone}
                                        </span>
                                        {selectedAppointment.customerEmail && (
                                            <span className="flex items-center gap-1.5">
                                                <Mail size={14} className="text-[var(--primary)]" /> {selectedAppointment.customerEmail}
                                            </span>
                                        )}
                                        <span className="text-[0.75rem] font-bold px-2 py-0.5 rounded-md bg-black/5 text-[var(--text-muted)]">
                                            Mã #{selectedAppointment.id}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8">
                            <div className={`grid grid-cols-1 ${selectedAppointment.customerImage ? 'lg:grid-cols-12' : ''} gap-7 items-start`}>
                                
                                {/* Left Column: Detailed Booking Info */}
                                <div className={`${selectedAppointment.customerImage ? 'lg:col-span-7' : 'w-full'} space-y-6`}>
                                    
                                    {/* Service Banner */}
                                    <div className="p-5 rounded-2xl bg-[rgba(197,155,99,0.06)] border border-[rgba(197,155,99,0.2)] transition-all duration-300 hover:border-[rgba(197,155,99,0.4)]">
                                        <div className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--primary)] mb-1 flex items-center gap-1.5">
                                            <Sparkles size={14} /> Dịch vụ đăng ký
                                        </div>
                                        <div className="text-xl font-serif font-bold text-[var(--text-dark)] leading-snug">
                                            {selectedAppointment.serviceName}
                                        </div>
                                    </div>

                                    {/* Info Grid (Clean Key-Value) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5 transition-colors duration-200">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <span className="block text-[0.72rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Ngày & Giờ hẹn</span>
                                                <strong className="text-[var(--text-dark)] text-[0.98rem]">
                                                    {selectedAppointment.bookingDate} <span className="text-[var(--primary)] font-semibold">({String(selectedAppointment.bookingTime).slice(0, 5)})</span>
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-[#FAF7F2] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] shrink-0 mt-0.5 transition-colors duration-200">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <span className="block text-[0.72rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">Thời gian tạo đơn</span>
                                                <span className="text-[var(--text-dark)] text-[0.92rem] font-medium block">
                                                    {new Date(selectedAppointment.createdAt).toLocaleString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Customer Note */}
                                    {selectedAppointment.notes && (
                                        <div className="pt-2">
                                            <span className="block text-[0.72rem] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Ghi chú của khách hàng</span>
                                            <div className="p-4 rounded-xl bg-[#FAF7F2] border-l-4 border-[var(--primary)] text-[var(--text-dark)] text-[0.93rem] leading-relaxed whitespace-pre-wrap transition-all duration-300">
                                                "{selectedAppointment.notes}"
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Right Column: Attached Image Direct View (No wrapper box) */}
                                {selectedAppointment.customerImage && (
                                    <div className="lg:col-span-5 flex flex-col justify-start">
                                        <span className="block text-[0.72rem] font-bold uppercase tracking-wider text-[var(--primary)] mb-2">Ảnh khách đính kèm</span>
                                        <div 
                                            className="relative overflow-hidden rounded-2xl border border-[var(--border)] shadow-sm group cursor-pointer transition-all duration-300 hover:shadow-lg"
                                            onClick={() => setPreviewImage(getImageUrl(selectedAppointment.customerImage))}
                                        >
                                            <img
                                                src={getImageUrl(selectedAppointment.customerImage)}
                                                alt="Ảnh khách gửi"
                                                className="w-full max-h-[280px] object-cover rounded-2xl transition-transform duration-500 ease-out group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-white text-xs font-semibold backdrop-blur-[2px]">
                                                <Eye size={18} className="mr-1.5" /> Click để xem full ảnh
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 sm:px-8 py-4 bg-[#FAF7F2] border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[0.82rem] text-[var(--text-muted)]">Lần cập nhật cuối: {new Date(selectedAppointment.updatedAt || selectedAppointment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                            
                            <div className="flex items-center gap-2.5">
                                {selectedAppointment.status === 'PENDING' && (
                                    <button
                                        type="button"
                                        disabled={updatingId === selectedAppointment.id}
                                        onClick={() => handleStatusUpdate(selectedAppointment, 'CONFIRMED')}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 shadow-sm hover:scale-[1.02] flex items-center gap-2 cursor-pointer disabled:opacity-50 text-[0.88rem]"
                                    >
                                        <CheckCircle size={16} /> Xác nhận lịch
                                    </button>
                                )}
                                {selectedAppointment.status === 'CONFIRMED' && (
                                    <button
                                        type="button"
                                        disabled={updatingId === selectedAppointment.id}
                                        onClick={() => handleStatusUpdate(selectedAppointment, 'COMPLETED')}
                                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 shadow-sm hover:scale-[1.02] flex items-center gap-2 cursor-pointer disabled:opacity-50 text-[0.88rem]"
                                    >
                                        <ShieldCheck size={16} /> Hoàn thành
                                    </button>
                                )}
                                {['PENDING', 'CONFIRMED'].includes(selectedAppointment.status) && (
                                    <button
                                        type="button"
                                        disabled={updatingId === selectedAppointment.id}
                                        onClick={() => handleStatusUpdate(selectedAppointment, 'CANCELLED')}
                                        className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all duration-200 hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-[0.88rem]"
                                    >
                                        <X size={16} /> Hủy lịch
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedAppointment(null)}
                                    className="px-4 py-2.5 rounded-xl bg-white border border-[var(--border)] text-[var(--text-dark)] hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02] cursor-pointer text-[0.88rem] font-medium"
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full-resolution Image Lightbox */}
            {previewImage && (
                <div 
                    className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[1100] flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh] animate-scaleUp" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 cursor-pointer"
                            onClick={() => setPreviewImage(null)}
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Full preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/20"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
