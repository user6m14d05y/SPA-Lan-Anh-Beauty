import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const parseLimit = (value) => {
  const parsed = Number(value || 50);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
};

const normalizeCustomerRow = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  email: null,
  bookingCount: Number(row.bookingCount || 0),
  completedBookingCount: Number(row.completedBookingCount || 0),
  latestBookingDate: row.latestBookingDate,
  totalSpent: Math.round(Number(row.totalSpent || 0)),
});

export const customerController = {
  async index(req, res) {
    try {
      const limit = parseLimit(req.query.limit);
      const search = String(req.query.search || '').trim();
      const replacements = {
        limit,
        searchLike: `%${search}%`,
      };

      const customers = await sequelize.query(
        `
          SELECT
            MIN(b.id) AS id,
            MAX(b.customerName) AS name,
            b.customerPhone AS phone,
            COUNT(*) AS bookingCount,
            SUM(CASE WHEN b.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completedBookingCount,
            MAX(b.bookingDate) AS latestBookingDate,
            COALESCE(SUM(
              CASE
                WHEN b.status = 'COMPLETED' THEN COALESCE(s.effectivePrice, 0)
                ELSE 0
              END
            ), 0) AS totalSpent
          FROM bookings b
          LEFT JOIN (
            SELECT
              name,
              MAX(
                CASE
                  WHEN price IS NOT NULL AND discountPercent > 0 THEN price * (100 - discountPercent) / 100
                  ELSE COALESCE(price, 0)
                END
              ) AS effectivePrice
            FROM services
            GROUP BY name
          ) s ON s.name = b.serviceName
          WHERE (:searchLike = '%%'
            OR b.customerName LIKE :searchLike
            OR b.customerPhone LIKE :searchLike
            OR b.serviceName LIKE :searchLike)
          GROUP BY b.customerPhone
          ORDER BY totalSpent DESC, latestBookingDate DESC
          LIMIT :limit
        `,
        {
          replacements,
          type: QueryTypes.SELECT,
        }
      );

      return res.json({
        success: true,
        message: 'Lấy danh sách khách hàng thành công.',
        data: customers.map(normalizeCustomerRow),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách khách hàng.',
        error: error.message,
      });
    }
  },
};
