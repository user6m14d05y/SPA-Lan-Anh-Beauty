import cron from 'node-cron';
import { Op } from 'sequelize';
import ClosedPeriod from '../models/ClosedPeriod.js';
import User from '../models/User.js';
import { emailService } from './emailService.js';

// Lấy ngày hôm nay theo múi giờ Việt Nam (UTC+7) dạng "YYYY-MM-DD"
const getTodayVN = () => {
  const now = new Date();
  // Offset +7 hours
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return vnTime.toISOString().slice(0, 10);
};

// Xóa các ngày nghỉ ca sáng đã hết hạn và gửi email cho admin
const purgeExpiredMorningPeriods = async () => {
  const today = getTodayVN();

  console.log(`[Scheduler] ${new Date().toISOString()} — Kiểm tra ngày nghỉ ca sáng hết hạn (ngày: ${today})`);

  try {
    // Tìm tất cả ngày nghỉ ca sáng của hôm nay
    const expiredPeriods = await ClosedPeriod.findAll({
      where: {
        date: today,
        shift: 'MORNING',
      },
    });

    if (expiredPeriods.length === 0) {
      console.log('[Scheduler] Không có ngày nghỉ ca sáng nào cần xóa.');
      return;
    }

    // Lấy dữ liệu để gửi email trước khi xóa
    const periodData = expiredPeriods.map((p) => ({
      id: p.id,
      date: p.date,
      shift: p.shift,
      reason: p.reason,
    }));

    // Xóa toàn bộ
    const ids = periodData.map((p) => p.id);
    await ClosedPeriod.destroy({ where: { id: { [Op.in]: ids } } });

    console.log(`[Scheduler] Đã xóa ${periodData.length} ngày nghỉ ca sáng: ${ids.join(', ')}`);

    // Lấy email tất cả admin đang hoạt động
    const admins = await User.findAll({
      where: { role: 'ADMIN', isActive: true },
      attributes: ['email'],
    });

    const adminEmails = admins.map((u) => u.email).filter(Boolean);

    if (adminEmails.length === 0) {
      console.log('[Scheduler] Không tìm thấy email admin để gửi thông báo.');
      return;
    }

    // Gửi email thông báo
    await emailService.sendExpiredClosedPeriodNotification({
      adminEmails,
      periods: periodData,
    });

    console.log(`[Scheduler] Đã gửi email thông báo đến: ${adminEmails.join(', ')}`);
  } catch (error) {
    console.error('[Scheduler] Lỗi khi xóa ngày nghỉ hết hạn:', error.message);
  }
};

// Khởi động scheduler
export const startScheduler = () => {
  // Chạy lúc 12:00 trưa giờ Việt Nam (UTC+7 = 05:00 UTC)
  // Cron: "0 5 * * *" — phút 0, giờ 5 UTC = 12:00 trưa VN
  cron.schedule('0 5 * * *', purgeExpiredMorningPeriods, {
    timezone: 'UTC',
  });

  console.log('[Scheduler] Đã kích hoạt cron job xóa ngày nghỉ hết hạn (chạy lúc 12:00 trưa giờ VN mỗi ngày).');
};
