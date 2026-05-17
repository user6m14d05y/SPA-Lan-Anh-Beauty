import { Op } from 'sequelize';
import Booking from '../models/Booking.js';
import ClosedPeriod from '../models/ClosedPeriod.js';
import { BOOKING_SLOTS, SLOT_CAPACITY } from '../config/bookingAvailability.js';

const activeBookingStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED'];
const allowedStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const MAX_BOOKING_DAYS_AHEAD = 90;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const normalizeTime = (value) => String(value || '').slice(0, 5);

const toDateString = (date) => date.toISOString().slice(0, 10);

const getToday = () => toDateString(new Date());

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const createHttpError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const validateBookingDate = (value) => {
  const dateValue = String(value || '');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    throw createHttpError('Ngày hẹn không hợp lệ.');
  }

  const parsedDate = new Date(`${dateValue}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime()) || toDateString(parsedDate) !== dateValue) {
    throw createHttpError('Ngày hẹn không tồn tại.');
  }

  const today = getToday();
  const maxDate = toDateString(addDays(new Date(`${today}T00:00:00.000Z`), MAX_BOOKING_DAYS_AHEAD));

  if (dateValue < today) {
    throw createHttpError('Không thể đặt lịch trong quá khứ.');
  }

  if (dateValue > maxDate) {
    throw createHttpError(`Chỉ có thể đặt lịch trong ${MAX_BOOKING_DAYS_AHEAD} ngày tới.`);
  }

  return dateValue;
};

const getShiftByTime = (time) => (Number(normalizeTime(time).split(':')[0]) < 12 ? 'MORNING' : 'AFTERNOON');

const getClosedPeriodsByDate = async (date) => ClosedPeriod.findAll({ where: { date } });

const getSlotClosedMessage = (closedPeriods, time) => {
  const shift = getShiftByTime(time);
  const hasFullDay = closedPeriods.some((period) => period.shift === 'FULL_DAY');
  const hasShift = closedPeriods.some((period) => period.shift === shift);

  if (hasFullDay) return 'Spa nghỉ cả ngày';
  if (hasShift && shift === 'MORNING') return 'Spa nghỉ ca sáng';
  if (hasShift && shift === 'AFTERNOON') return 'Spa nghỉ ca chiều';
  return '';
};

const countBookingsForSlot = async (date, time) => Booking.count({
  where: {
    bookingDate: date,
    bookingTime: {
      [Op.startsWith]: normalizeTime(time),
    },
    status: {
      [Op.in]: activeBookingStatuses,
    },
  },
});

const buildAvailability = async (dateInput) => {
  const date = validateBookingDate(dateInput);
  const closedPeriods = await getClosedPeriodsByDate(date);
  const isFullDayClosed = closedPeriods.some((period) => period.shift === 'FULL_DAY');

  const slots = await Promise.all(BOOKING_SLOTS.map(async (time) => {
    const booked = await countBookingsForSlot(date, time);
    const closedMessage = getSlotClosedMessage(closedPeriods, time);
    const isFull = booked >= SLOT_CAPACITY;

    return {
      time,
      booked,
      capacity: SLOT_CAPACITY,
      isClosed: Boolean(closedMessage),
      isFull,
      isDisabled: Boolean(closedMessage) || isFull,
      message: closedMessage || (isFull ? 'Khung giờ này đã đầy' : ''),
    };
  }));

  return {
    date,
    isClosed: isFullDayClosed,
    message: isFullDayClosed ? 'Ngày này spa nghỉ, vui lòng chọn ngày khác.' : '',
    closedPeriods,
    slots,
  };
};

const handleError = (res, error, fallbackMessage = 'Có lỗi xảy ra') => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

const buildBookingPayload = (body, file) => ({
  customerName: body.customerName?.trim(),
  customerPhone: body.customerPhone?.trim(),
  serviceName: body.serviceName?.trim(),
  bookingDate: body.bookingDate,
  bookingTime: normalizeTime(body.bookingTime),
  notes: body.notes?.trim() || null,
  customerImage: file ? `/uploads/img/${file.filename}` : null,
});

const validateCreatePayload = (payload) => {
  if (!payload.customerName) return 'Vui lòng nhập họ tên.';
  if (!payload.customerPhone) return 'Vui lòng nhập số điện thoại.';
  if (!payload.serviceName) return 'Vui lòng chọn dịch vụ.';
  if (!payload.bookingDate) return 'Vui lòng chọn ngày hẹn.';
  if (!payload.bookingTime) return 'Vui lòng chọn giờ hẹn.';
  if (!BOOKING_SLOTS.includes(payload.bookingTime)) return 'Khung giờ hẹn không hợp lệ.';
  return '';
};

const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const bookingController = {
  async availability(req, res) {
    try {
      const availability = await buildAvailability(req.query.date);

      res.status(200).json({
        success: true,
        message: 'Lấy lịch trống thành công.',
        data: availability,
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy lịch trống.');
    }
  },

  async create(req, res) {
    try {
      const payload = buildBookingPayload(req.body, req.file);
      const validationError = validateCreatePayload(payload);

      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      payload.bookingDate = validateBookingDate(payload.bookingDate);
      const closedPeriods = await getClosedPeriodsByDate(payload.bookingDate);
      const closedMessage = getSlotClosedMessage(closedPeriods, payload.bookingTime);

      if (closedMessage) {
        return res.status(400).json({
          success: false,
          message: `${closedMessage}, vui lòng chọn khung giờ khác.`,
        });
      }

      const booked = await countBookingsForSlot(payload.bookingDate, payload.bookingTime);

      if (booked >= SLOT_CAPACITY) {
        return res.status(409).json({
          success: false,
          message: 'Khung giờ này đã đầy, vui lòng chọn giờ khác.',
        });
      }

      const newBooking = await Booking.create(payload);
      res.status(201).json({
        success: true,
        message: 'Đặt lịch thành công. Chúng tôi sẽ liên hệ sớm nhất để xác nhận.',
        data: newBooking,
      });
    } catch (error) {
      handleError(res, error, 'Không thể đặt lịch.');
    }
  },

  async index(req, res) {
    try {
      const where = {};
      const { date, status, search } = req.query;
      const { page, limit, offset } = getPagination(req.query);

      if (date) where.bookingDate = date;
      if (status && allowedStatuses.includes(status)) where.status = status;
      if (search) {
        where[Op.or] = [
          { customerName: { [Op.like]: `%${search}%` } },
          { customerPhone: { [Op.like]: `%${search}%` } },
          { serviceName: { [Op.like]: `%${search}%` } },
        ];
      }

      const { rows, count } = await Booking.findAndCountAll({
        where,
        limit,
        offset,
        order: [['bookingDate', 'DESC'], ['bookingTime', 'DESC'], ['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách lịch hẹn thành công.',
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy danh sách lịch hẹn.');
    }
  },

  async show(req, res) {
    try {
      const booking = await Booking.findByPk(req.params.id);

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
      }

      res.status(200).json({
        success: true,
        message: 'Lấy thông tin lịch hẹn thành công.',
        data: booking,
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy thông tin lịch hẹn.');
    }
  },

  async update(req, res) {
    try {
      const booking = await Booking.findByPk(req.params.id);

      if (!booking) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
      }

      const updates = {};

      if (req.body.status !== undefined) {
        if (!allowedStatuses.includes(req.body.status)) {
          return res.status(400).json({ success: false, message: 'Trạng thái lịch hẹn không hợp lệ.' });
        }
        updates.status = req.body.status;
      }

      if (req.body.notes !== undefined) updates.notes = req.body.notes?.trim() || null;

      await booking.update(updates);

      res.status(200).json({
        success: true,
        message: 'Cập nhật lịch hẹn thành công.',
        data: booking,
      });
    } catch (error) {
      handleError(res, error, 'Không thể cập nhật lịch hẹn.');
    }
  },
};
