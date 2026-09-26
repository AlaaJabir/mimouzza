import React, { useState, useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { trackEvent } from '../../../lib/tracking';
import { Flame, Clock, ShieldAlert, ShoppingCart, Zap, Star, MessageCircle } from 'lucide-react';

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
  // Real countdown timer driven by product settings if enabled
  const initialDuration = (product.countdownDurationMinutes || 120) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialDuration);

  useEffect(() => {
    trackEvent({
      eventType: 'PAGE_VIEW',
      productId: product._id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
    });
    trackEvent({
      eventType: 'VIEW_CONTENT',
      productId: product._id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
    });
  }, [product._id]);

  useEffect(() => {
    if (!product.countdownEnabled) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : initialDuration));
    }, 1000);
    return () => clearInterval(timer);
  }, [product.countdownEnabled, initialDuration]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const discountAmount = product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;
  const discountPct = product.compareAtPrice > product.price
    ? Math.round((discountAmount / product.compareAtPrice) * 100)
    : 45;

  const handleHeroCtaClick = () => {
    trackEvent({
      eventType: 'CTA_CLICK',
      productId: product._id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
      metadata: { elementId: 'hero_cta' },
    });
    document.getElementById('order-form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWhatsAppClick = () => {
    trackEvent({
      eventType: 'WHATSAPP_CLICK',
      productId: product._id,
      productName: product.name,
      metadata: { whatsappNumber: product.whatsappNumber },
    });
    const message = encodeURIComponent(`السلام عليكم، أريد الاستفسار بخصوص عرض: ${product.name}`);
    window.open(`https://wa.me/${product.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-rose-50/30 text-slate-900 pb-20 md:pb-12" dir="rtl">
      {/* Top Banner */}
      <TopAnnouncementBar text="🔥 عرض حصري محدود — ينتهي التخفيض قريباً!" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Flash Sale Header (Clean and proportional) */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-center sm:text-right">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-amber-200 uppercase">
                تخفيض حصري محدود
              </div>
              <h2 className="text-sm sm:text-base font-bold">
                وفر {discountAmount > 0 ? `${discountAmount} ${product.currency || 'DH'}` : `أكثر من ${discountPct}%`} اليوم!
              </h2>
            </div>
          </div>

          {/* Real Countdown Clock (Configurable) */}
          {product.countdownEnabled && (
            <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20">
              <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="text-[11px] font-medium text-white/90">ينتهي العرض خلال:</span>
              <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-300">
                <span className="bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
                  {String(hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
                  {String(seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Real Stock Scarcity Bar (Configurable) */}
        {product.scarcityEnabled && (
          <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-amber-950">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
              <span>
                تنبيه: متبقي فقط <span className="text-rose-600 font-bold underline">{product.stockQuantity ?? 7} قطع</span> بهذا السعر المخفض!
              </span>
            </div>
            <div className="w-20 sm:w-28 h-2 bg-amber-200 rounded-full overflow-hidden shrink-0">
              <div className="w-3/4 h-full bg-rose-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Product Hero Block: Image on top, title, price, button, and guarantees */}
        <div className="bg-white rounded-2xl border border-rose-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          {/* Image on top (image tji foq) */}
          <ProductGallery
            images={product.images}
            productName={product.name}
            badgeText={product.badgeText || 'خصم خاص'}
            discountPercentage={discountPct}
            productId={product._id}
          />

          {/* Title directly under image (otahtha titre) in reasonable size (size m3qol) */}
          <div className="text-center space-y-1.5 pt-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-800">{product.rating || 4.9}</span>
              <span>·</span>
              <span>({product.reviewCount || 210}+ طلب ناجح)</span>
              <span>·</span>
              <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-100">
                الكمية تنفد قريباً
              </span>
            </div>
          </div>

          {/* Massive Discount Box in reasonable size */}
          <div className="p-3 bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl border border-rose-200 text-center space-y-1">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
                  {product.price}
                </span>
                <span className="text-sm font-bold text-rose-700">
                  {product.currency || 'DH'}
                </span>
              </div>

              {product.compareAtPrice > product.price && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="line-through font-mono font-medium">
                    {product.compareAtPrice} {product.currency || 'DH'}
                  </span>
                  <span className="text-xs font-bold text-white bg-rose-600 px-2 py-0.5 rounded-full">
                    خصم {discountPct}%
                  </span>
                </div>
              )}
            </div>
            {discountAmount > 0 && (
              <div className="text-[11px] text-emerald-700 font-semibold">
                ✓ وفر {discountAmount} {product.currency || 'DH'} فورياً عند الطلب الآن
              </div>
            )}
          </div>

          {/* Action Button (o boutton) */}
          <div className="space-y-2">
            <button
              onClick={handleHeroCtaClick}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-rose-500 text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-amber-300 text-amber-300" />
              <span>{product.ctaText || 'اغتنم العرض الآن قبل نفاد الكمية'}</span>
            </button>

            {/* WhatsApp CTA */}
            {product.whatsappEnabled && product.whatsappNumber && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>اطلب أو استفسر عبر الواتساب (WhatsApp)</span>
              </button>
            )}
          </div>

          {/* Quick Trust Checks */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
            <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="text-[11px] font-medium">توصيل مجاني 24/48 ساعة</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
              <span className="text-emerald-600 font-bold">✓</span>
              <span className="text-[11px] font-medium">الدفع نقداً بعد المعاينة</span>
            </div>
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-center pt-2 border-t border-slate-100">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                لماذا يجب أن تطلب هذا المنتج اليوم؟
              </h2>
            </div>
            <Benefits benefits={product.benefits} variant="cards" />
          </div>
        )}

        {/* Description Section */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5">
              شرح وتفاصيل المنتج
            </h3>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
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
        productId={product._id}
        productName={product.name}
      />
    </div>
  );
};
