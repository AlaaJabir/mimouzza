import React, { useState, useMemo } from 'react';
import { Product } from '../../../convex/schema';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { ShoppingBag, Flame } from 'lucide-react';

interface LiveOrdersTickerProps {
  product: Product;
  className?: string;
}

function maskPhoneForPrivacy(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 6) return '06******';
  const prefix = digits.slice(0, 3);
  const suffix = digits.slice(-2);
  return `${prefix}***${suffix}`;
}

function formatRelativeMinutes(createdAt: number): string {
  const diffMin = Math.max(1, Math.floor((Date.now() - createdAt) / 60000));
  if (diffMin < 60) {
    return `قبل ${diffMin} دقيقة`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `قبل ${diffHours} ساعة`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `قبل ${diffDays} يوم`;
}

export const LiveOrdersTicker: React.FC<LiveOrdersTickerProps> = ({
  product,
  className = '',
}) => {
  const [isPaused, setIsPaused] = useState(false);

  // Query ONLY real persisted orders for this product from Convex
  const orders = useQuery(api.orders.getByProductId, { productId: product._id });

  const realOrderItems = useMemo(() => {
    const valid = (orders || []).filter(
      (o) => o.status !== 'CANCELLED' && o.status !== 'FAILED'
    );
    return valid.slice(0, 12).map((o) => {
      const variantValues =
        o.variants && Object.keys(o.variants).length > 0
          ? Object.values(o.variants).join(' / ')
          : '';
      return {
        id: o._id,
        city: o.city,
        maskedPhone: maskPhoneForPrivacy(o.phone),
        orderCode: o.orderNumber,
        timeAgoText: formatRelativeMinutes(o.createdAt),
        qtyText: `${o.quantity} × ${variantValues || 'قطعة'}`,
      };
    });
  }, [orders]);

  // STRICT PRODUCTION RULE: Never invent fake order notifications if no real orders exist
  if (realOrderItems.length === 0) {
    return null;
  }

  const tickerItems =
    realOrderItems.length >= 3
      ? [...realOrderItems, ...realOrderItems]
      : realOrderItems;

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
          animation: codTickerMoveUp 24s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="bg-[#ff5252] text-white px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white/20 shrink-0" />
          <span className="font-extrabold text-base sm:text-lg tracking-wide">
            آخر الطلبات المسجلة ({realOrderItems.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full text-xs sm:text-sm font-bold text-amber-200">
          <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
          <span>طلبات حقيقية مؤكدة</span>
        </div>
      </div>

      {/* Real Orders List */}
      <div
        className={`relative ${
          realOrderItems.length >= 3 ? 'h-[210px]' : 'max-h-[210px]'
        } overflow-hidden bg-white px-3 py-2`}
      >
        <div
          className={`${realOrderItems.length >= 3 ? 'cod-ticker-track' : ''} flex flex-col gap-2`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {tickerItems.map((item, idx) => {
            const isGrayRow = idx % 2 === 1;
            return (
              <div
                key={`${item.id}_${idx}`}
                className={`px-3.5 py-3 rounded-lg transition-colors ${
                  isGrayRow ? 'bg-[#f1f1f1]' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-start gap-2.5 mb-1.5">
                  <span className="bg-[#ff004c] text-white font-extrabold text-xs sm:text-sm px-2.5 py-0.5 rounded-[5px] uppercase tracking-wider font-mono leading-tight shadow-2xs">
                    {item.city}
                  </span>
                  <span
                    className="font-mono font-extrabold text-sm sm:text-base text-slate-900 tracking-tight"
                    dir="ltr"
                  >
                    {item.maskedPhone}
                  </span>
                </div>

                <div className="text-xs sm:text-sm md:text-[15px] text-slate-800 font-semibold leading-snug truncate">
                  <span className="text-[#ff6b00] font-extrabold">{item.timeAgoText}</span>
                  <span className="mx-1.5 text-slate-400">|</span>
                  <span className="font-mono text-slate-700 mr-1 font-bold">{item.orderCode}</span>{' '}
                  <span className="font-bold text-slate-900">{product.name}</span>
                  <span className="text-slate-600 font-mono"> - {item.qtyText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Bar */}
      <div className="bg-[#ff5252] text-white/95 px-4 py-2 text-xs sm:text-sm font-bold flex items-center justify-between">
        <span>✅ جميع الطلبات يتم شحنها والدفع عند الاستلام</span>
        <span className="font-mono text-xs bg-white/20 px-2.5 py-0.5 rounded">مباشر</span>
      </div>
    </div>
  );
};
