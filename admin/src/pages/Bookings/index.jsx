import { useEffect, useMemo, useState, useRef } from 'react';
import { Eye, X, ChevronDown } from '../../icons.jsx';
import { useAuth } from '../../context/AuthContext';

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
    if (status === 'CONFIRMED' || status === 'COMPLETED') return 'bg-[#dcfce7] text-[#166534]';
    if (status === 'PENDING') return 'bg-[#fef9c3] text-[#854d0e]';
    if (status === 'CANCELLED') return 'bg-[#fee2e2] text-[#991b1b]';
    return 'bg-[#f3f4f6] text-[#374151]';
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
                className="flex items-center justify-between px-[15px] py-[10px] border border-[var(--border)] rounded-lg bg-[var(--bg-light)] text-[var(--text-dark)] cursor-pointer hover:border-[var(--primary)] transition-colors"
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

            <div className="bg-[var(--bg-light)] rounded-xl border border-[var(--border)] overflow-x-auto">
                {loading ? (
                    <div className="p-6 text-center text-[var(--text-muted)]">Đang tải lịch hẹn...</div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="p-6 text-center text-[var(--text-muted)]">Không có lịch hẹn phù hợp.</div>
                ) : (
                    <table className="w-full min-w-[1320px] text-left border-collapse table-fixed">
                        <thead>
                            <tr>
                                <th className="w-[78px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Mã LH</th>
                                <th className="w-[160px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Khách hàng</th>
                                <th className="w-[130px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">SĐT</th>
                                <th className="w-[220px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)]">Email</th>
                                <th className="w-[250px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)]">Dịch vụ</th>
                                <th className="w-[110px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Ngày</th>
                                <th className="w-[82px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Giờ</th>
                                <th className="w-[150px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Trạng thái</th>
                                <th className="w-[90px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Ảnh</th>
                                <th className="w-[150px] px-5 py-4 bg-[rgba(119,89,50,0.05)] text-[var(--primary)] font-semibold border-b border-[var(--border)] whitespace-nowrap">Thao tác</th>
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
                                        <span className={`px-3 py-1 text-[0.8rem] font-semibold rounded-full inline-flex items-center whitespace-nowrap ${getStatusClass(appointment.status)}`}>
                                            {statusLabels[appointment.status] || appointment.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] align-middle group-last:border-none">
                                        {appointment.customerImage ? (
                                            <img className="w-[56px] h-[44px] rounded-lg object-cover border border-[var(--border)]" src={getImageUrl(appointment.customerImage)} alt="Ảnh khách gửi" />
                                        ) : (
                                            <span className="text-[0.95rem] text-[var(--text-muted)]">Không có</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 border-b border-[var(--border)] align-middle group-last:border-none">
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <button
                                                className="w-[112px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[0.84rem] font-semibold bg-[var(--bg)] text-[var(--primary)] border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[rgba(119,89,50,0.06)] transition-colors cursor-pointer"
                                                onClick={() => setSelectedAppointment(appointment)}
                                            >
                                                <Eye size={16} /> Xem
                                            </button>
                                            {appointment.status === 'PENDING' && (
                                                <button
                                                    className="w-[112px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[0.84rem] font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] hover:bg-[#bae6fd] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                                    disabled={updatingId === appointment.id}
                                                    onClick={() => handleStatusUpdate(appointment, 'CONFIRMED')}
                                                >
                                                    Xác nhận
                                                </button>
                                            )}
                                            {appointment.status === 'CONFIRMED' && (
                                                <button
                                                    className="w-[112px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[0.84rem] font-semibold bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] hover:bg-[#bae6fd] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                                    disabled={updatingId === appointment.id}
                                                    onClick={() => handleStatusUpdate(appointment, 'COMPLETED')}
                                                >
                                                    Hoàn thành
                                                </button>
                                            )}
                                            {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                                                <button
                                                    className="w-[112px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[0.84rem] font-semibold bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] hover:bg-[#fecaca] transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                                    disabled={updatingId === appointment.id}
                                                    onClick={() => handleStatusUpdate(appointment, 'CANCELLED')}
                                                >
                                                    Hủy
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
                <div className="fixed inset-0 bg-[#1118278c] z-[1000] flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)}>
                    <div className="bg-[var(--bg-light)] rounded-2xl w-full max-w-[760px] max-h-[90vh] overflow-y-auto p-7 shadow-[0_24px_80px_rgba(0,0,0,0.22)]" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-between items-start mb-5 gap-4">
                            <div>
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">
                                    Lịch hẹn #{selectedAppointment.id}
                                </span>
                                <h3 className="text-[1.6rem] font-serif font-bold text-[var(--text-dark)] m-0">{selectedAppointment.customerName}</h3>
                            </div>
                            <button
                                type="button"
                                className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text-dark)] hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                onClick={() => setSelectedAppointment(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
                            <div className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Số điện thoại</span>
                                <strong className="text-[var(--text-dark)]">{selectedAppointment.customerPhone}</strong>
                            </div>
                            <div className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Email</span>
                                <strong className="text-[var(--text-dark)] break-all">{selectedAppointment.customerEmail || 'None'}</strong>
                            </div>
                            <div className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Dịch vụ</span>
                                <strong className="text-[var(--text-dark)]">{selectedAppointment.serviceName}</strong>
                            </div>
                            <div className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Ngày hẹn</span>
                                <strong className="text-[var(--text-dark)]">{selectedAppointment.bookingDate}</strong>
                            </div>
                            <div className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Giờ hẹn</span>
                                <strong className="text-[var(--text-dark)]">{String(selectedAppointment.bookingTime).slice(0, 5)}</strong>
                            </div>
                            <div className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Trạng thái</span>
                                <span className={`px-3 py-1 text-[0.8rem] font-semibold rounded-full inline-flex items-center whitespace-nowrap w-fit ${getStatusClass(selectedAppointment.status)}`}>
                                    {statusLabels[selectedAppointment.status] || selectedAppointment.status}
                                </span>
                            </div>
                            <div className="border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Ngày tạo</span>
                                <strong className="text-[var(--text-dark)]">{new Date(selectedAppointment.createdAt).toLocaleString('vi-VN')}</strong>
                            </div>
                        </div>

                        {selectedAppointment.notes && (
                            <div className="mb-6 border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Ghi chú</span>
                                <p className="text-[var(--text-muted)] m-0 leading-relaxed whitespace-pre-wrap">{selectedAppointment.notes}</p>
                            </div>
                        )}

                        {selectedAppointment.customerImage && (
                            <div className="mt-3.5 border border-[var(--border)] bg-[var(--bg)] rounded-xl p-3.5">
                                <span className="block text-[0.8rem] font-bold text-[var(--primary)] uppercase tracking-wider mb-1.5">Ảnh khách gửi</span>
                                <img
                                    src={getImageUrl(selectedAppointment.customerImage)}
                                    alt="Ảnh khách gửi"
                                    className="w-full max-h-[360px] object-contain rounded-[10px] bg-[var(--white)]"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
