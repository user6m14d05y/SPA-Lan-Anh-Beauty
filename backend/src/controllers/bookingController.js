import Booking from "../models/Booking.js";

export const bookingController = {
  async create(req, res, next) {
    try {
      const bookingData = req.body;
      const newBooking = await Booking.create(bookingData);
      res.status(201).json({
        success: true,
        message: 'Đặt lịch thành công',
        data: newBooking
      });
    } catch (error) {
      next(error);
    }
  },
  async index(req, res, next) {
    try {
      const bookings = await Booking.findAll();
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách thành công',
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  },
  async show(req, res, next) {
    try {
      const { id } = req.params;
      const booking = await Booking.findByPk(id);
      res.status(200).json({
        success: true,
        message: 'Lấy thông tin thành công',
        data: booking
      });
    } catch (error) {
      next(error);
    }
  },
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const bookingData = req.body;
      const updatedBooking = await Booking.update(bookingData, { where: { id } });
      res.status(200).json({
        success: true,
        message: 'Cập nhật thành công',
        data: updatedBooking
      });
    } catch (error) {
      next(error);
    }
  },
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const deletedBooking = await Booking.destroy({ where: { id } });
      res.status(200).json({
        success: true,
        message: 'Xóa thành công',
        data: deletedBooking
      });
    } catch (error) {
      next(error);
    }
  }
}