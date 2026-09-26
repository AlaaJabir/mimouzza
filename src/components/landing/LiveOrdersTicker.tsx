import React, { useState, useMemo } from 'react';
import { Product } from '../../../convex/schema';
import { ShoppingBag, Flame } from 'lucide-react';

interface LiveOrdersTickerProps {
  product: Product;
  className?: string;
}

interface FakeOrderNotification {
  id: string;
  city: string;
  maskedPhone: string;
  orderCode: string;
  minutesAgo: number;
  qtyText: string;
}

const MOROCCO_TICKER_CITIES = [
  'MIDELT',
  'KHMISSET',
  'NADOR',
  'CASABLANCA',
  'MARRAKECH',
  'RABAT',
  'TANGER',
  'AGADIR',
  'FES',
  'MEKNES',
  'TETOUAN',
  'OUJDA',
  'KENITRA',
  'EL JADIDA',
  'BENI MELLAL',
  'SAFI',
];

const FAKE_PHONES = [
  '[544***079]**',
  '[987***070]**',
  '[225***069]**',
  '[418***066]**',
  '[763***061]**',
  '[309***067]**',
  '[852***077]**',
  '[641***062]**',
  '[194***065]**',
  '[530***068]**',
  '[912***063]**',
  '[476***071]**',
];

const ORDER_CODES = [
  'UW47ZHCMO',
  'MA92KLP4X',
  'CD74NRT8Q',
  'BX39VWM2L',
  'ZR65HJK9P',
  'QT81GFD3N',
  'LK28YUI7V',
  'PL53MNB6C',
  'HG94CXZ1W',
  'MN17QAZ8E',
  'DF62WSX4R',
  'VC83EDC5T',
];

const MINUTES_AGO = [2, 3, 4, 1, 3, 2, 5, 4, 2, 3, 1, 4];

export const LiveOrdersTicker: React.FC<LiveOrdersTickerProps> = ({
  product,
  className = '',
}) => {
  const [isPaused, setIsPaused] = useState(false);

  const variantSuffix = useMemo(() => {
    if (
      product.variants &&
      product.variants.length > 0 &&
      product.variants[0].options &&
      product.variants[0].options.length > 0
    ) {
      return `1 * ${product.variants[0].options[0]}`;
    }
    return '1 * set (عرض خاص)';
  }, [product.variants]);

  const fakeOrders: FakeOrderNotification[] = useMemo(() => {
    return FAKE_PHONES.map((phone, idx) => ({
      id: `fake_ord_${idx}`,
      city: MOROCCO_TICKER_CITIES[idx % MOROCCO_TICKER_CITIES.length],
      maskedPhone: phone,
      orderCode: ORDER_CODES[idx % ORDER_CODES.length],
      minutesAgo: MINUTES_AGO[idx % MINUTES_AGO.length],
      qtyText: idx % 3 === 0 ? `2 * قطع` : variantSuffix,
    }));
  }, [variantSuffix]);

  // Duplicate list for seamless infinite upward scrolling
  const tickerItems = useMemo(() => [...fakeOrders, ...fakeOrders], [fakeOrders]);

  return (
    <div
      className={`rounded-xl overflow-hidden border border-[#ff5252]/40 bg-white shadow-xs select-none ${className}`}
      dir="rtl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <style>{`
        @keyframes codTickerMoveUp {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
        .cod-ticker-track {
          animation: codTickerMoveUp 28s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* Top Red/Coral Header Bar */}
      <div className="bg-[#ff5252] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-white fill-white/20 shrink-0" />
          <span className="font-bold text-sm sm:text-base tracking-wide">
            إشعار عند التسليم
          </span>
        </div>

        <div className="flex items-center gap-1 bg-black/20 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-amber-200">
          <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
          <span>إقبال كبير — الكمية قريبة تسالي</span>
        </div>
      </div>

      {/* Auto-Scrolling Orders List (Moves Up Automatically, Pauses on Mouse Hover) */}
      <div className="relative h-[220px] overflow-hidden bg-white px-2.5 py-1.5">
        <div
          className="cod-ticker-track flex flex-col gap-1.5"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {tickerItems.map((item, idx) => {
            const isGrayRow = idx % 2 === 1;
            return (
              <div
                key={`${item.id}_${idx}`}
                className={`px-3 py-2.5 rounded-md transition-colors ${
                  isGrayRow ? 'bg-[#f1f1f1]' : 'bg-white'
                }`}
              >
                {/* Line 1: City Pill + Masked Phone */}
                <div className="flex items-center justify-start gap-2 mb-1">
                  <span className="bg-[#ff004c] text-white font-bold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-[4px] uppercase tracking-wider font-mono leading-tight shadow-2xs">
                    {item.city}
                  </span>
                  <span
                    className="font-mono font-bold text-xs sm:text-sm text-slate-900 tracking-tight"
                    dir="ltr"
                  >
                    {item.maskedPhone}
                  </span>
                </div>

                {/* Line 2: Time ago | Order Code + Product Name + Variant */}
                <div className="text-[11px] sm:text-xs text-slate-800 font-medium leading-snug truncate">
                  <span className="text-[#ff6b00] font-bold">
                    قبل {item.minutesAgo} دقائق
                  </span>
                  <span className="mx-1.5 text-slate-400">|</span>
                  <span className="font-mono text-slate-700 mr-1">{item.orderCode}</span>{' '}
                  <span>{product.name}</span>
                  <span className="text-slate-600 font-mono"> - {item.qtyText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Coral Accent Footer Bar */}
      <div className="bg-[#ff5252] text-white/95 px-3 py-1.5 text-[11px] font-semibold flex items-center justify-between">
        <span>✅ جميع الطلبات يتم شحنها والدفع عند الاستلام</span>
        <span className="font-mono text-[10px] bg-white/20 px-2 py-0.5 rounded">
          مباشر الآن
        </span>
      </div>
    </div>
  );
};
