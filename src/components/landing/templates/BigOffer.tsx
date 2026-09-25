import React, { useState, useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { Flame, Clock, ShieldAlert, ShoppingCart, Zap, Star } from 'lucide-react';

interface BigOfferProps {
  product: Product;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

export const BigOffer: React.FC<BigOfferProps> = ({ product, utmParams }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 27, seconds: 44 });
  const [stockRemaining, setStockRemaining] = useState(7);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 2, minutes: 15, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const discountAmount = product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;
  const discountPct = product.compareAtPrice > product.price
    ? Math.round((discountAmount / product.compareAtPrice) * 100)
    : 45;

  const scrollToOrder = () => {
    document.getElementById('order-form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-rose-50/30 text-slate-900 pb-20 md:pb-12" dir="rtl">
      {/* Top Banner */}
      <TopAnnouncementBar text="🔥 عرض حصري محدود — ينتهي التخفيض عند نفاد الكمية المتبقية!" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Flash Sale Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Flame className="w-7 h-7 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-amber-200 uppercase">
                تخفيض هائل لفترة محدودة
              </div>
              <h2 className="text-lg sm:text-xl font-black">
                وفر {discountAmount > 0 ? `${discountAmount} ${product.currency || 'DH'}` : `أكثر من ${discountPct}%`} اليوم!
              </h2>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/20">
            <Clock className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs font-semibold text-white/90">ينتهي العرض في:</span>
            <div className="flex items-center gap-1 font-mono font-black text-sm text-amber-300">
              <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Scarcity Bar */}
        <div className="bg-amber-100/80 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-2 text-xs font-bold text-amber-950">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
            <span>
              تنبيه: متبقي فقط <span className="text-rose-600 font-black text-sm underline">{stockRemaining} قطع</span> في المخزون بهذا السعر المخفض!
            </span>
          </div>
          <div className="w-24 sm:w-36 h-2.5 bg-amber-200 rounded-full overflow-hidden shrink-0">
            <div className="w-3/4 h-full bg-rose-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Product Hero Block */}
        <div className="bg-white rounded-2xl border-2 border-rose-500/20 p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <ProductGallery
                images={product.images}
                productName={product.name}
                badgeText="خصم قنبلة"
                discountPercentage={discountPct}
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                {product.name}
              </h1>

              {/* Social Proof */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">{product.rating || 4.9}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">({product.reviewCount || 210}+ طلب ناجح)</span>
              </div>

              {/* Massive Discount Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600">سعر التخفيض الحالي:</span>
                  <span className="text-xs font-bold text-white bg-rose-600 px-2 py-0.5 rounded-full">
                    خصم {discountPct}%
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-rose-600 font-mono">
                    {product.price}
                  </span>
                  <span className="text-lg font-bold text-rose-600">
                    {product.currency || 'DH'}
                  </span>
                  {product.compareAtPrice > product.price && (
                    <span className="text-lg line-through text-slate-400 font-mono">
                      {product.compareAtPrice} {product.currency || 'DH'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold mt-1">
                  ✓ وفر {discountAmount} {product.currency || 'DH'} فورياً عند الطلب الآن
                </div>
              </div>

              {product.shortDescription && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Big Red/Amber CTA */}
              <button
                onClick={scrollToOrder}
                className="w-full py-4 px-6 rounded-xl font-black text-base sm:text-lg bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-rose-500 text-white shadow-xl shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
                <span>{product.ctaText || 'اغتنم العرض الآن قبل نفاد الكمية'}</span>
              </button>

              <div className="text-[11px] text-slate-500 text-center font-medium">
                🔒 شحن مجاني لكافة المدن • الدفع عند الاستلام • معاينة قبل الدفع
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                لماذا يجب أن تطلب هذا المنتج اليوم؟
              </h2>
            </div>
            <Benefits benefits={product.benefits} variant="cards" />
          </div>
        )}

        {/* Description Section */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              شرح وتفاصيل المنتج
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges shippingText={product.shippingText} returnPolicy={product.returnPolicy} />

        {/* High Converting COD Form */}
        <div className="pt-2">
          <CODForm product={product} utmParams={utmParams} accentColor="rose" />
        </div>

        {/* FAQ */}
        <FAQ faqs={product.faqs} />
      </div>

      {/* Sticky Bottom Bar on Mobile */}
      <StickyOrderButton
        price={product.price}
        currency={product.currency || 'DH'}
        ctaText={product.ctaText}
      />
    </div>
  );
};
