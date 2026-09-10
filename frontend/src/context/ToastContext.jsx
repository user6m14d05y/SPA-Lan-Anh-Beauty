import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '../icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  }), [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed top-6 right-6 z-[99999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-[18px] shadow-[0_20px_50px_rgba(15,12,10,0.35)] border backdrop-blur-xl transition-all duration-300 transform translate-y-0 ${
              t.type === 'success'
                ? 'bg-[#1C1612]/95 border-[#C59B63] text-white shadow-[0_0_25px_rgba(197,155,99,0.25)]'
                : t.type === 'error'
                ? 'bg-[#1C1612]/95 border-rose-500/80 text-white shadow-[0_0_25px_rgba(244,63,94,0.2)]'
                : t.type === 'warning'
                ? 'bg-[#1C1612]/95 border-amber-500/80 text-white shadow-[0_0_25px_rgba(245,158,11,0.2)]'
                : 'bg-[#1C1612]/95 border-stone-600/80 text-white shadow-[0_0_25px_rgba(168,162,158,0.2)]'
            }`}
          >
            <div className="flex items-start gap-3.5 pr-3">
              {t.type === 'success' && (
                <div className="w-9 h-9 rounded-full bg-[#C59B63]/25 text-[#E6C687] flex items-center justify-center shrink-0 border border-[#C59B63]/40 mt-0.5">
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
              )}
              {t.type === 'error' && (
                <div className="w-9 h-9 rounded-full bg-rose-500/25 text-rose-300 flex items-center justify-center shrink-0 border border-rose-500/40 mt-0.5">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
              )}
              {t.type === 'warning' && (
                <div className="w-9 h-9 rounded-full bg-amber-500/25 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </div>
              )}
              {t.type === 'info' && (
                <div className="w-9 h-9 rounded-full bg-blue-500/25 text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/40 mt-0.5">
                  <InformationCircleIcon className="w-5 h-5" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#E6C687] mb-0.5">
                  {t.type === 'success' ? 'Thông Báo Spa' : t.type === 'error' ? 'Thất Bại' : t.type === 'warning' ? 'Lưu Ý' : 'Thông Tin'}
                </span>
                <span className="text-xs sm:text-sm font-medium text-stone-100 leading-relaxed">{t.message}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-stone-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 shrink-0 mt-0.5"
              aria-label="Đóng thông báo"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
