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
      className="w-full bg-[#111111] text-white text-xs sm:text-sm py-2.5 px-4 text-center font-extrabold flex items-center justify-center gap-2 border-b border-neutral-800"
      dir="rtl"
    >
      <Truck className="w-4 h-4 text-[#FF6B00] shrink-0 animate-pulse" />
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
      className={`rounded-3xl bg-[#FFF3EB] border border-[#FF6B00]/30 p-4 sm:p-5 text-[#111111] ${className}`}
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-center sm:text-right">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="text-xs font-black text-[#FF6B00] uppercase tracking-wide">
              عرض حصري محدود
            </div>
            <div className="text-sm font-bold text-[#111111]">
              {offerText || 'خصم خاص + شحن مجاني لكافة المدن المغربية'}
            </div>
          </div>
        </div>

        {withCountdown && (
          <div className="flex items-center gap-1.5 shrink-0 bg-white px-3.5 py-2 rounded-2xl border border-[#FF6B00]/25 shadow-2xs">
            <Clock className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span className="text-[11px] font-semibold text-neutral-600 ml-1">ينتهي العرض خلال:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-xs text-[#FF6B00]">
              <span className="bg-[#FFF3EB] px-2 py-0.5 rounded-lg border border-[#FF6B00]/20">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-[#FFF3EB] px-2 py-0.5 rounded-lg border border-[#FF6B00]/20">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-[#FFF3EB] px-2 py-0.5 rounded-lg border border-[#FF6B00]/20">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
