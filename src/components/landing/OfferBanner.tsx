import React, { useState, useEffect } from 'react';
import { Truck, Flame, Clock } from 'lucide-react';

interface OfferBannerProps {
  shippingText?: string;
  offerText?: string;
  withCountdown?: boolean;
  className?: string;
}

export const TopAnnouncementBar: React.FC<{ text?: string }> = ({
  text = '🚚 التوصيل مجاني لجميع مدن المغرب — الدفع نقداً عند الاستلام بعد المعاينة',
}) => {
  return (
    <div
      className="w-full bg-slate-950 text-amber-300 text-xs py-2 px-4 text-center font-bold flex items-center justify-center gap-2 border-b border-amber-400/20"
      dir="rtl"
    >
      <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
      <span className="truncate">{text}</span>
    </div>
  );
};

export const OfferBanner: React.FC<OfferBannerProps> = ({
  offerText,
  withCountdown = false,
  className = '',
}) => {
  // Simple realistic countdown timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 43,
    seconds: 18,
  });

  useEffect(() => {
    if (!withCountdown) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 3, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [withCountdown]);

  if (!offerText && !withCountdown) return null;

  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border border-amber-400/50 p-3 sm:p-4 text-slate-900 ${className}`}
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-center sm:text-right">
          <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-900 uppercase tracking-wide">
              عرض حصري محدود
            </div>
            <div className="text-sm font-bold text-slate-950">
              {offerText || 'خصم خاص + شحن مجاني لكافة المدن المغربية'}
            </div>
          </div>
        </div>

        {withCountdown && (
          <div className="flex items-center gap-1.5 shrink-0 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs">
            <Clock className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600 ml-1">ينتهي العرض خلال:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-rose-700">
              <span className="bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
