import ClosedPeriod from '../models/ClosedPeriod.js';

const allowedShifts = ['MORNING', 'AFTERNOON', 'FULL_DAY'];

const getToday = () => new Date().toISOString().slice(0, 10);

const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const handleError = (res, error, fallbackMessage) => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
};

export const closedPeriodController = {
  async index(_req, res) {
    try {
      const periods = await ClosedPeriod.findAll({
        order: [['date', 'ASC'], ['shift', 'ASC']],
      });

      res.status(200).json({
        success: true,
        message: 'Lấy danh sách ngày nghỉ thành công.',
        data: periods,
      });
    } catch (error) {
      handleError(res, error, 'Không thể lấy danh sách ngày nghỉ.');
    }
  },

  async create(req, res) {
    try {
      const date = req.body.date;
      const shift = req.body.shift;
      const reason = req.body.reason?.trim() || null;

      if (!isValidDateString(date)) {
        return res.status(400).json({ success: false, message: 'Ngày nghỉ không hợp lệ.' });
      }

      if (date < getToday()) {
        return res.status(400).json({ success: false, message: 'Không thể tạo ngày nghỉ trong quá khứ.' });
      }

      if (!allowedShifts.includes(shift)) {
        return res.status(400).json({ success: false, message: 'Loại ngày nghỉ không hợp lệ.' });
      }

      const existingPeriods = await ClosedPeriod.findAll({ where: { date } });
      const hasFullDay = existingPeriods.some((period) => period.shift === 'FULL_DAY');
      const hasSameShift = existingPeriods.some((period) => period.shift === shift);

      if (hasSameShift) {
        return res.status(409).json({ success: false, message: 'Ngày nghỉ này đã tồn tại.' });
      }

      if (hasFullDay || (shift === 'FULL_DAY' && existingPeriods.length > 0)) {
        return res.status(409).json({
          success: false,
          message: 'Ngày nghỉ bị trùng ca. Vui lòng xóa ca cũ trước khi tạo cả ngày.',
        });
      }

      const period = await ClosedPeriod.create({ date, shift, reason });

      res.status(201).json({
        success: true,
        message: 'Tạo ngày nghỉ thành công.',
        data: period,
      });
    } catch (error) {
      handleError(res, error, 'Không thể tạo ngày nghỉ.');
    }
  },

  async delete(req, res) {
    try {
      const period = await ClosedPeriod.findByPk(req.params.id);

      if (!period) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy ngày nghỉ.' });
      }

      await period.destroy();

      res.status(200).json({
        success: true,
        message: 'Xóa ngày nghỉ thành công.',
        data: { id: req.params.id },
      });
    } catch (error) {
      handleError(res, error, 'Không thể xóa ngày nghỉ.');
    }
  },
};
