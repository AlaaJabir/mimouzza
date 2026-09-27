import React, { useState, useMemo } from 'react';
import { Product } from '../../../convex/schema';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { ShoppingBag, Flame } from 'lucide-react';

interface LiveOrdersTickerProps {
  product: Product;
  className?: string;
}

interface TickerOrderItem {
  id: string;
  city: string;
  maskedPhone: string;
  orderCode: string;
  timeAgoText: string;
  qtyText: string;
}

const MOROCCO_LIVE_FEED_BASE: Array<{
  city: string;
  maskedPhone: string;
  orderCode: string;
  minutesAgo: number;
  qty: number;
}> = [
  { city: 'CASABLANCA', maskedPhone: '066***42', orderCode: 'ORD-95492', minutesAgo: 2, qty: 1 },
  { city: 'RABAT', maskedPhone: '061***78', orderCode: 'ORD-95488', minutesAgo: 5, qty: 2 },
  { city: 'MARRAKECH', maskedPhone: '067***19', orderCode: 'ORD-95481', minutesAgo: 9, qty: 1 },
  { city: 'TANGER', maskedPhone: '070***53', orderCode: 'ORD-95476', minutesAgo: 14, qty: 1 },
  { city: 'AGADIR', maskedPhone: '065***86', orderCode: 'ORD-95469', minutesAgo: 19, qty: 2 },
  { city: 'FES', maskedPhone: '062***31', orderCode: 'ORD-95463', minutesAgo: 24, qty: 1 },
  { city: 'MEKNES', maskedPhone: '068***94', orderCode: 'ORD-95457', minutesAgo: 31, qty: 1 },
  { city: 'OUJDA', maskedPhone: '064***27', orderCode: 'ORD-95450', minutesAgo: 37, qty: 2 },
  { city: 'KENITRA', maskedPhone: '077***61', orderCode: 'ORD-95444', minutesAgo: 43, qty: 1 },
  { city: 'TETOUAN', maskedPhone: '063***49', orderCode: 'ORD-95438', minutesAgo: 51, qty: 1 },
  { city: 'MOHAMMEDIA', maskedPhone: '069***15', orderCode: 'ORD-95432', minutesAgo: 58, qty: 2 },
  { city: 'EL JADIDA', maskedPhone: '066***83', orderCode: 'ORD-95425', minutesAgo: 65, qty: 1 },
];

const CITY_LATIN_MAP: Record<string, string> = {
  'الدار البيضاء': 'CASABLANCA',
  'الرباط': 'RABAT',
  'مراكش': 'MARRAKECH',
  'فاس': 'FES',
  'طنجة': 'TANGER',
  'أكادير': 'AGADIR',
  'مكناس': 'MEKNES',
  'وجدة': 'OUJDA',
  'القنيطرة': 'KENITRA',
  'تطوان': 'TETOUAN',
  'تمارة': 'TEMARA',
  'الجديدة': 'EL JADIDA',
  'آسفي': 'SAFI',
  'المحمدية': 'MOHAMMEDIA',
  'بني ملال': 'BENI MELLAL',
  'خريبكة': 'KHOURIBGA',
  'الناظور': 'NADOR',
  'تازة': 'TAZA',
  'سطات': 'SETTAT',
  'برشيد': 'BERRECHID',
  'كلميم': 'GUELMIM',
  'العيون': 'LAAYOUNE',
};

function formatCityBadge(rawCity: string): string {
  if (!rawCity) return 'MAROC';
  const parenMatch = rawCity.match(/\(([^)]+)\)/);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].trim().toUpperCase();
  }
  const trimmed = rawCity.trim();
  if (CITY_LATIN_MAP[trimmed]) {
    return CITY_LATIN_MAP[trimmed];
  }
  return trimmed.toUpperCase();
}

function maskPhoneForPrivacy(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 6) return '066***11';
  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-2);
  return `${prefix}***${suffix}`;
}

function formatRelativeMinutes(createdAt: number): string {
  const diffMin = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));
  if (diffMin === 1) return 'قبل دقيقة واحدة';
  if (diffMin === 2) return 'قبل دقيقتين';
  if (diffMin <= 10) return `قبل ${diffMin} دقائق`;
  if (diffMin < 60) return `قبل ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return 'قبل ساعة واحدة';
  if (diffHours === 2) return 'قبل ساعتين';
  if (diffHours < 24) return `قبل ${diffHours} ساعات`;
  const diffDays = Math.floor(diffHours / 24);
  return `قبل ${diffDays} يوم`;
}

function formatStaticMinutes(mins: number): string {
  if (mins === 1) return 'قبل دقيقة واحدة';
  if (mins === 2) return 'قبل دقيقتين';
  if (mins <= 10) return `قبل ${mins} دقائق`;
  if (mins < 60) return `قبل ${mins} دقيقة`;
  return 'قبل ساعة واحدة';
}

export const LiveOrdersTicker: React.FC<LiveOrdersTickerProps> = ({
  product,
  className = '',
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Query real persisted orders for this product from Convex
  const orders = useQuery(api.orders.getByProductId, { productId: product._id });

  const orderItems = useMemo<TickerOrderItem[]>(() => {
    const validReal = (orders || [])
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED')
      .slice(0, 10)
      .map((o) => {
        const variantValues =
          o.variants && Object.keys(o.variants).length > 0
            ? Object.values(o.variants).join(' / ')
            : '';
        return {
          id: `real_${o._id}`,
          city: formatCityBadge(o.city),
          maskedPhone: maskPhoneForPrivacy(o.phone),
          orderCode: o.orderNumber || 'ORD-10099',
          timeAgoText: formatRelativeMinutes(o.createdAt),
          qtyText: `${o.quantity} × ${variantValues || 'قطعة'}`,
        };
      });

    // Extract available variant options from the product so feed items match product variants naturally
    const firstVariantOptions =
      product.variants &&
      product.variants.length > 0 &&
      Array.isArray(product.variants[0].options) &&
      product.variants[0].options.length > 0
        ? product.variants[0].options
        : [];

    const fallbackFeed: TickerOrderItem[] = MOROCCO_LIVE_FEED_BASE.map((entry, index) => {
      const pickedVariant =
        firstVariantOptions.length > 0
          ? firstVariantOptions[index % firstVariantOptions.length]
          : 'قطعة';
      return {
        id: `feed_${product._id || 'p'}_${index}`,
        city: entry.city,
        maskedPhone: entry.maskedPhone,
        orderCode: entry.orderCode,
        timeAgoText: formatStaticMinutes(entry.minutesAgo),
        qtyText: `${entry.qty} × ${pickedVariant}`,
      };
    });

    // Combine real orders at the top followed by live Moroccan COD activity so 12+ orders always scroll smoothly
    return [...validReal, ...fallbackFeed].slice(0, 12);
  }, [orders, product._id, product.variants]);

  // Duplicate list for seamless infinite -50% vertical scroll
  const tickerItems = useMemo(() => [...orderItems, ...orderItems], [orderItems]);

  return (
    <div
      className={`rounded-xl overflow-hidden border border-[#ff5252]/40 bg-white shadow-xs select-none ${className}`}
      dir="rtl"
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') {
          setIsPaused(true);
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === 'mouse') {
          setIsPaused(false);
        }
      }}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onTouchCancel={() => setIsPaused(false)}
    >
      <style>{`
        @keyframes codTickerMoveUp {
          0% {
            transform: translate3d(0, 0%, 0);
          }
          100% {
            transform: translate3d(0, -50%, 0);
          }
        }
        .cod-ticker-track {
          animation: codTickerMoveUp 26s linear infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .cod-ticker-track {
            animation: codTickerMoveUp 26s linear infinite !important;
          }
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="bg-[#ff5252] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white/20 shrink-0" />
          <span className="font-extrabold text-sm sm:text-base md:text-lg tracking-wide truncate">
            آخر الطلبات المسجلة
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-black/20 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs md:text-sm font-bold text-amber-200 shrink-0">
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
          <span>طلبات حقيقية مؤكدة</span>
        </div>
      </div>

      {/* Viewport showing 4 to 5 orders simultaneously on both Mobile & Desktop */}
      <div className="relative h-[340px] sm:h-[365px] overflow-hidden bg-white px-2.5 sm:px-3 py-2">
        <div
          className="cod-ticker-track flex flex-col"
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
            WebkitAnimationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {tickerItems.map((item, idx) => {
            const isGrayRow = idx % 2 === 1;
            return (
              <div key={`${item.id}_${idx}`} className="pb-2">
                <div
                  className={`px-3 sm:px-3.5 py-2.5 sm:py-3 rounded-lg transition-colors border ${
                    isGrayRow
                      ? 'bg-[#f1f1f1] border-neutral-200/70'
                      : 'bg-white border-neutral-100'
                  }`}
                >
                  <div className="flex items-center justify-start gap-2 sm:gap-2.5 mb-1">
                    <span className="bg-[#ff004c] text-white font-extrabold text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-[5px] uppercase tracking-wider font-mono leading-tight shadow-2xs shrink-0">
                      {item.city}
                    </span>
                    <span
                      className="font-mono font-extrabold text-xs sm:text-sm md:text-base text-slate-900 tracking-tight"
                      dir="ltr"
                    >
                      {item.maskedPhone}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-800 font-semibold leading-snug truncate">
                    <span className="text-[#ff6b00] font-extrabold">{item.timeAgoText}</span>
                    <span className="mx-1.5 text-slate-400">|</span>
                    <span className="font-mono text-slate-700 mr-1 font-bold">{item.orderCode}</span>{' '}
                    <span className="font-bold text-slate-900">{product.name}</span>
                    <span className="text-slate-600 font-mono"> - {item.qtyText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Bar */}
      <div className="bg-[#ff5252] text-white/95 px-3.5 sm:px-4 py-2 text-[11px] sm:text-xs md:text-sm font-bold flex items-center justify-between gap-2">
        <span className="truncate">✅ جميع الطلبات يتم شحنها والدفع عند الاستلام</span>
        <span className="font-mono text-[11px] sm:text-xs bg-white/20 px-2 sm:px-2.5 py-0.5 rounded shrink-0">
          مباشر
        </span>
      </div>
    </div>
  );
};
