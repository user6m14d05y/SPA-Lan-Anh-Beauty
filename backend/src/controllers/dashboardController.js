import { Op } from 'sequelize';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';

const allowedPeriods = ['day', 'month', 'year', 'range'];
const revenueStatuses = ['CONFIRMED', 'COMPLETED'];
const demandStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED'];

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toDateString = (date) => date.toISOString().slice(0, 10);

const todayString = () => toDateString(new Date());

const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && toDateString(date) === value;
};

const getMonthEnd = (monthValue) => {
  const [year, month] = monthValue.split('-').map(Number);
  return toDateString(new Date(Date.UTC(year, month, 0)));
};

const getDaysBetween = (startDate, endDate) => {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  return Math.floor((end - start) / 86400000) + 1;
};

const resolveDateRange = (query) => {
  const period = allowedPeriods.includes(query.period) ? query.period : 'day';

  if (period === 'day') {
    const date = query.date || todayString();
    if (!isValidDateString(date)) throw createHttpError('Ngày thống kê không hợp lệ.');
    return { period, startDate: date, endDate: date, label: `Ngày ${date}` };
  }

  if (period === 'month') {
    const month = query.month || todayString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month) || Number(month.slice(5, 7)) < 1 || Number(month.slice(5, 7)) > 12) {
      throw createHttpError('Tháng thống kê không hợp lệ.');
    }
    return { period, startDate: `${month}-01`, endDate: getMonthEnd(month), label: `Tháng ${month.slice(5, 7)}/${month.slice(0, 4)}` };
  }

  if (period === 'year') {
    const year = String(query.year || todayString().slice(0, 4));
    if (!/^\d{4}$/.test(year)) throw createHttpError('Năm thống kê không hợp lệ.');
    return { period, startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: `Năm ${year}` };
  }

  const startDate = query.startDate;
  const endDate = query.endDate;
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw createHttpError('Khoảng ngày thống kê không hợp lệ.');
  }
  if (startDate > endDate) throw createHttpError('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
  if (getDaysBetween(startDate, endDate) > 366) throw createHttpError('Khoảng thời gian không được vượt quá 366 ngày.');

  return { period, startDate, endDate, label: `${startDate} đến ${endDate}` };
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const normalizePhone = (value) => String(value || '').replace(/\s+/g, '');

const getEffectivePrice = (service) => {
  if (!service?.price) return 0;
  const discountPercent = Number(service.discountPercent || 0);
  return discountPercent > 0
    ? Math.round(Number(service.price) * (100 - discountPercent) / 100)
    : Number(service.price);
};

const buildServicePriceMap = (services) => {
  const map = new Map();

  services.forEach((service) => {
    const key = normalizeKey(service.name);
    const effectivePrice = getEffectivePrice(service);
    const existing = map.get(key);

    if (!existing || effectivePrice > existing.effectivePrice) {
      map.set(key, {
        id: service.id,
        name: service.name,
        price: service.price,
        discountPercent: service.discountPercent,
        effectivePrice,
      });
    }
  });

  return map;
};

const enrichBooking = (booking, serviceMap) => {
  const plain = typeof booking.toJSON === 'function' ? booking.toJSON() : booking;
  const service = serviceMap.get(normalizeKey(plain.serviceName));

  return {
    ...plain,
    estimatedPrice: service?.effectivePrice || 0,
    hasPrice: Boolean(service?.effectivePrice),
  };
};

const compareBookingAsc = (a, b) => (
  `${a.bookingDate} ${String(a.bookingTime || '')}`.localeCompare(`${b.bookingDate} ${String(b.bookingTime || '')}`)
);

const compareBookingDesc = (a, b) => compareBookingAsc(b, a);

const buildTopCustomers = (bookings) => {
  const customers = new Map();

  bookings.forEach((booking) => {
    const phone = normalizePhone(booking.customerPhone);
    if (!phone) return;

    const current = customers.get(phone) || {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      bookingCount: 0,
      estimatedRevenue: 0,
      lastBookingDate: booking.bookingDate,
    };

    current.bookingCount += 1;
    if (revenueStatuses.includes(booking.status)) current.estimatedRevenue += booking.estimatedPrice;
    if (`${booking.bookingDate} ${booking.bookingTime}` >= `${current.lastBookingDate} 00:00`) {
      current.customerName = booking.customerName;
      current.lastBookingDate = booking.bookingDate;
    }

    customers.set(phone, current);
  });

  return [...customers.values()]
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue || b.bookingCount - a.bookingCount || String(b.lastBookingDate).localeCompare(String(a.lastBookingDate)))
    .slice(0, 5);
};

const buildTopServices = (bookings) => {
  const services = new Map();

  bookings.filter((booking) => demandStatuses.includes(booking.status)).forEach((booking) => {
    const key = normalizeKey(booking.serviceName);
    if (!key) return;

    const current = services.get(key) || {
      serviceName: booking.serviceName,
      bookingCount: 0,
      estimatedRevenue: 0,
    };

    current.bookingCount += 1;
    if (revenueStatuses.includes(booking.status)) current.estimatedRevenue += booking.estimatedPrice;
    services.set(key, current);
  });

  return [...services.values()]
    .sort((a, b) => b.bookingCount - a.bookingCount || b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, 5);
};

const buildNewCustomerData = (rangeBookings, customerHistory, startDate, endDate) => {
  const firstBookingByPhone = new Map();

  customerHistory.sort(compareBookingAsc).forEach((booking) => {
    const phone = normalizePhone(booking.customerPhone);
    if (phone && !firstBookingByPhone.has(phone)) firstBookingByPhone.set(phone, booking);
  });

  const newCustomers = [];
  const seen = new Set();

  rangeBookings.sort(compareBookingDesc).forEach((booking) => {
    const phone = normalizePhone(booking.customerPhone);
    const firstBooking = firstBookingByPhone.get(phone);
    if (!phone || seen.has(phone) || !firstBooking) return;

    if (firstBooking.bookingDate >= startDate && firstBooking.bookingDate <= endDate) {
      seen.add(phone);
      newCustomers.push({
        customerName: firstBooking.customerName,
        customerPhone: firstBooking.customerPhone,
        firstBookingDate: firstBooking.bookingDate,
        serviceName: firstBooking.serviceName,
        estimatedPrice: firstBooking.estimatedPrice || 0,
      });
    }
  });

  return newCustomers.slice(0, 5);
};

const getStatusCounts = (bookings) => bookings.reduce((counts, booking) => {
  counts[booking.status] = (counts[booking.status] || 0) + 1;
  return counts;
}, { PENDING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 });

const buildBookingPreview = (booking) => ({
  id: booking.id,
  customerName: booking.customerName,
  customerPhone: booking.customerPhone,
  serviceName: booking.serviceName,
  bookingDate: booking.bookingDate,
  bookingTime: booking.bookingTime,
  status: booking.status,
  estimatedPrice: booking.estimatedPrice,
});

const handleError = (res, error) => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Không thể lấy thống kê dashboard.',
  });
};

export const dashboardController = {
  async stats(req, res) {
    try {
      const filters = resolveDateRange(req.query);
      const services = await Service.findAll({ attributes: ['id', 'name', 'price', 'discountPercent'] });
      const serviceMap = buildServicePriceMap(services);

      const rangeRows = await Booking.findAll({
        where: {
          bookingDate: {
            [Op.between]: [filters.startDate, filters.endDate],
          },
        },
        order: [['bookingDate', 'DESC'], ['bookingTime', 'DESC'], ['createdAt', 'DESC']],
      });

      const rangeBookings = rangeRows.map((booking) => enrichBooking(booking, serviceMap));
      const phones = [...new Set(rangeBookings.map((booking) => normalizePhone(booking.customerPhone)).filter(Boolean))];
      const historyRows = phones.length ? await Booking.findAll({
        where: { customerPhone: { [Op.in]: phones } },
        order: [['bookingDate', 'ASC'], ['bookingTime', 'ASC'], ['createdAt', 'ASC']],
      }) : [];
      const customerHistory = historyRows.map((booking) => enrichBooking(booking, serviceMap));

      const statusCounts = getStatusCounts(rangeBookings);
      const revenueBookings = rangeBookings.filter((booking) => revenueStatuses.includes(booking.status));
      const pricedRevenueBookings = revenueBookings.filter((booking) => booking.hasPrice);
      const estimatedRevenue = pricedRevenueBookings.reduce((sum, booking) => sum + booking.estimatedPrice, 0);
      const uniqueCustomers = new Set(rangeBookings.map((booking) => normalizePhone(booking.customerPhone)).filter(Boolean)).size;
      const priceEligibleBookings = rangeBookings.filter((booking) => revenueStatuses.includes(booking.status) && booking.estimatedPrice > 0);
      const lowest = priceEligibleBookings.length ? [...priceEligibleBookings].sort((a, b) => a.estimatedPrice - b.estimatedPrice)[0] : null;
      const highest = priceEligibleBookings.length ? [...priceEligibleBookings].sort((a, b) => b.estimatedPrice - a.estimatedPrice)[0] : null;
      const nowKey = `${todayString()} ${new Date().toTimeString().slice(0, 5)}`;
      const upcoming = rangeBookings
        .filter((booking) => ['PENDING', 'CONFIRMED'].includes(booking.status) && `${booking.bookingDate} ${String(booking.bookingTime).slice(0, 5)}` >= nowKey)
        .sort(compareBookingAsc)
        .slice(0, 5)
        .map(buildBookingPreview);
      const recent = [...rangeBookings].sort(compareBookingDesc).slice(0, 5).map(buildBookingPreview);
      const newCustomers = buildNewCustomerData(rangeBookings, customerHistory, filters.startDate, filters.endDate);

      res.json({
        success: true,
        message: 'Lấy thống kê dashboard thành công.',
        data: {
          filters,
          summary: {
            totalBookings: rangeBookings.length,
            pendingBookings: statusCounts.PENDING,
            confirmedBookings: statusCounts.CONFIRMED,
            completedBookings: statusCounts.COMPLETED,
            cancelledBookings: statusCounts.CANCELLED,
            estimatedRevenue,
            averageBookingValue: pricedRevenueBookings.length ? Math.round(estimatedRevenue / pricedRevenueBookings.length) : 0,
            newCustomers: newCustomers.length,
            uniqueCustomers,
            unpricedBookings: revenueBookings.length - pricedRevenueBookings.length,
          },
          priceStats: {
            lowest: lowest ? buildBookingPreview(lowest) : null,
            highest: highest ? buildBookingPreview(highest) : null,
          },
          topCustomers: buildTopCustomers(rangeBookings),
          newCustomers,
          topServices: buildTopServices(rangeBookings),
          bookings: {
            upcoming,
            recent,
          },
        },
      });
    } catch (error) {
      handleError(res, error);
    }
  },
};
