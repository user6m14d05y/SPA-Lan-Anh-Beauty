import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '../../icons.jsx';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const toISOFormat = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatVNText = (dateStr, compact = false) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (isNaN(date.getTime())) return dateStr;
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (compact) {
    return `${day}/${month}/${year}`;
  }
  return `${dayName}, ${day}/${month}/${year}`;
};

const formatShortDate = (date) => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return { label: `${dayName} (${day}/${month})`, dateStr: toISOFormat(date) };
};

export default function CustomDatePicker({
  value = '',
  onChange,
  minDate = '',
  maxDate = '',
  placeholder = 'Chọn ngày...',
  className = '',
  clearable = false,
  showQuickPills = false,
  compact = false,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const initialDate = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00`);
    }
    return new Date();
  }, [value]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  useEffect(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(`${value}T00:00:00`);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const days = [];

    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false, dateStr: toISOFormat(date) });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(viewYear, viewMonth, i);
      days.push({ date, isCurrentMonth: true, dateStr: toISOFormat(date) });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(viewYear, viewMonth + 1, i);
      days.push({ date, isCurrentMonth: false, dateStr: toISOFormat(date) });
    }

    return days;
  }, [viewYear, viewMonth]);

  const todayStr = useMemo(() => toISOFormat(new Date()), []);

  const quickPills = useMemo(() => {
    if (!showQuickPills) return [];
    const today = new Date();
    const pills = [];

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const day4 = new Date(today);
    day4.setDate(today.getDate() + 3);

    pills.push({ label: 'Hôm nay', ...formatShortDate(today) });
    pills.push({ label: 'Ngày mai', ...formatShortDate(tomorrow) });
    pills.push({ ...formatShortDate(dayAfter) });
    pills.push({ ...formatShortDate(day4) });

    return pills;
  }, [showQuickPills]);

  const handleSelectDate = (dateStr) => {
    if (isDisabledDate(dateStr)) return;
    onChange(dateStr);
    setIsOpen(false);
  };

  const isDisabledDate = (dateStr) => {
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  return (
    <div className={`relative inline-block w-full ${className}`} ref={containerRef}>
      {/* Quick Pills for Booking page */}
      {showQuickPills && (
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {quickPills.map((pill, idx) => {
            const isSelected = value === pill.dateStr;
            const disabledPill = isDisabledDate(pill.dateStr);
            return (
              <button
                key={idx}
                type="button"
                disabled={disabledPill}
                onClick={() => onChange(pill.dateStr)}
                className={`px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border rounded-lg ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#C59B63] text-white border-amber-600 shadow-sm'
                    : 'bg-stone-50 text-stone-700 border-stone-300 hover:border-amber-500 hover:bg-amber-50/50'
                } ${disabledPill ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Trigger Field - Taller Luxury Capsule Pill Input */}
      <div
        className={`flex items-center justify-between px-4 py-3 min-h-[48px] bg-[#FAF7F2] hover:bg-white border border-[#E5DECD] rounded-full cursor-pointer hover:border-[#C59B63] transition-all shadow-xs ${
          isOpen ? 'border-[#C59B63] ring-2 ring-amber-300/40 bg-white shadow-sm' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0">
          <CalendarIcon className="w-5 h-5 text-[#C59B63] shrink-0" />
          <span className={`text-[0.92rem] ${value ? 'text-stone-900 font-semibold' : 'text-stone-400 font-medium'} truncate`}>
            {value ? formatVNText(value, compact) : placeholder}
          </span>
        </div>

        {clearable && value && (
          <button
            type="button"
            className="p-1 hover:bg-stone-200/60 rounded-full text-stone-400 hover:text-stone-600 transition-colors ml-1 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            title="Xóa ngày đã chọn"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Calendar Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-[2000] mt-1 left-0 w-[300px] sm:w-[320px] bg-white border border-stone-300 rounded-xl shadow-xl p-4 animate-fadeIn">
          {/* Month Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer rounded-md"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <span className="font-serif font-bold text-stone-800 text-base">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer rounded-md"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {WEEKDAYS.map((wd, i) => (
              <span key={i} className="text-[0.72rem] font-bold uppercase tracking-wider text-stone-400 py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, index) => {
              const isSelected = value === item.dateStr;
              const isToday = todayStr === item.dateStr;
              const disabledDay = isDisabledDate(item.dateStr);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDate(item.dateStr)}
                  className={`h-9 text-xs font-medium flex items-center justify-center transition-all cursor-pointer relative rounded-md ${
                    !item.isCurrentMonth
                      ? 'text-stone-300'
                      : disabledDay
                      ? 'text-stone-300 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#C59B63] text-white font-bold shadow-sm'
                      : isToday
                      ? 'bg-amber-50 text-amber-900 font-bold border border-amber-400'
                      : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {item.date.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-600"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => handleSelectDate(todayStr)}
              className="text-[#C59B63] font-semibold hover:underline cursor-pointer"
            >
              Chọn hôm nay
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-500 font-medium hover:text-stone-800 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
