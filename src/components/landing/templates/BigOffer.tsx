import React, { useState, useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { QuickOrderModal } from '../QuickOrderModal';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { LiveOrdersTicker } from '../LiveOrdersTicker';
import { MimouzzaLogo } from '../../ui/MimouzzaLogo';
import { trackEvent } from '../../../lib/tracking';
import { Flame, Clock, ShieldAlert, Zap, Star, MessageCircle, ShoppingCart } from 'lucide-react';

const isVideoMedia = (url: string) => {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  if (clean.includes('/video/upload/') || clean.includes('/video/authenticated/')) return true;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?(#.*)?$/i.test(clean);
};

const DescriptionMediaItem: React.FC<{ url: string; alt?: string; className?: string }> = ({
  url,
  alt = '',
  className = 'w-full h-auto object-contain mx-auto block',
}) => {
  if (!url) return null;
  const isVideo = isVideoMedia(url);

  if (isVideo) {
    return (
      <div className="relative w-full overflow-hidden bg-black/5 rounded-xl">
        <video
          src={url}
          autoPlay
          loop
          muted
          playsInline
          controls
          preload="metadata"
          className={`${className} w-full rounded-xl`}
        />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
    />
  );
};

interface BigOfferProps {
  product: Product;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  isPreview?: boolean;
}

export const BigOffer: React.FC<BigOfferProps> = ({
  product,
  utmParams,
  isPreview = false,
}) => {
  const initialDuration = (product.countdownDurationMinutes || 120) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(initialDuration);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    if (isPreview) return;
    trackEvent({
      eventType: 'PAGE_VIEW',
      productId: product._id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
      isPreview,
    });
    trackEvent({
      eventType: 'PRODUCT_VIEW',
      productId: product._id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
      isPreview,
    });
  }, [product._id, isPreview]);

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

  const discountAmount =
    product.compareAtPrice > product.price ? product.compareAtPrice - product.price : 0;
  const discountPct =
    product.compareAtPrice > product.price
      ? Math.round((discountAmount / product.compareAtPrice) * 100)
      : 45;

  const handleHeroCtaClick = () => {
    if (!isPreview) {
      trackEvent({
        eventType: 'CTA_CLICK',
        productId: product._id,
        productName: product.name,
        price: product.price,
        currency: product.currency,
        ctaId: 'hero_cta',
        metadata: { ctaId: 'hero_cta', elementId: 'hero_cta' },
        isPreview,
      });
    }
    setIsOrderModalOpen(true);
  };

  const handleMidCtaClick = () => {
    if (!isPreview) {
      trackEvent({
        eventType: 'CTA_CLICK',
        productId: product._id,
        productName: product.name,
        price: product.price,
        currency: product.currency,
        ctaId: 'mid_page_cta',
        metadata: { ctaId: 'mid_page_cta', elementId: 'mid_page_cta' },
        isPreview,
      });
    }
    setIsOrderModalOpen(true);
  };

  const handleWhatsAppClick = () => {
    if (!isPreview) {
      trackEvent({
        eventType: 'WHATSAPP_CLICK',
        productId: product._id,
        productName: product.name,
        metadata: { whatsappNumber: product.whatsappNumber },
        isPreview,
      });
    }
    const message = encodeURIComponent(`السلام عليكم، أريد الاستفسار بخصوص عرض: ${product.name}`);
    window.open(`https://wa.me/${product.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-rose-50/30 text-slate-900 pb-20 md:pb-12" dir="rtl">
      {/* Top Banner */}
      <TopAnnouncementBar text="🔥 عرض حصري محدود — ينتهي التخفيض قريباً!" />

      <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Flash Sale Header */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-amber-300 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-wider text-amber-200 uppercase">
                تخفيض حصري محدود
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold">
                وفر{' '}
                {discountAmount > 0
                  ? `${discountAmount} ${product.currency || 'DH'}`
                  : `أكثر من ${discountPct}%`}{' '}
                اليوم!
              </h2>
            </div>
          </div>

          {/* Real Countdown Clock (Configurable) */}
          {product.countdownEnabled && (
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/20">
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-white/95">ينتهي العرض خلال:</span>
              <div className="flex items-center gap-1 font-mono font-bold text-sm sm:text-base text-amber-300">
                <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                  {String(hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                  {String(minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10">
                  {String(seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Real Stock Scarcity Bar (Configurable) */}
        {product.scarcityEnabled && (
          <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-amber-950">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
              <span>
                تنبيه: متبقي فقط{' '}
                <span className="text-rose-600 font-extrabold underline">
                  {product.stockQuantity ?? 7} قطع
                </span>{' '}
                بهذا السعر المخفض!
              </span>
            </div>
            <div className="w-24 sm:w-32 h-2.5 bg-amber-200 rounded-full overflow-hidden shrink-0">
              <div className="w-3/4 h-full bg-rose-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        )}

        {/* Product Hero Block: Image on top, title, price, button, and guarantees */}
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-7 shadow-xs space-y-5">
          {/* Image on top */}
          <ProductGallery
            images={product.images}
            productName={product.name}
            badgeText={product.badgeText || 'خصم خاص'}
            discountPercentage={discountPct}
            productId={product._id}
            isPreview={isPreview}
          />

          {/* Title directly under image */}
          <div className="text-center space-y-2 pt-1">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-900">{product.rating || 4.9}</span>
              <span>·</span>
              <span className="font-medium">({product.reviewCount || 210}+ طلب ناجح)</span>
              <span>·</span>
              <span className="text-rose-700 font-bold bg-rose-50 px-2.5 py-0.5 rounded-md text-xs border border-rose-200">
                الكمية تنفد قريباً
              </span>
            </div>
          </div>

          {/* Discount Box */}
          <div className="p-4 bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl border border-rose-200 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-3.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-rose-600 font-mono">
                  {product.price}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-rose-700">
                  {product.currency || 'DH'}
                </span>
              </div>

              {product.compareAtPrice > product.price && (
                <div className="flex items-center gap-2.5 text-sm sm:text-base text-slate-400">
                  <span className="line-through font-mono font-semibold">
                    {product.compareAtPrice} {product.currency || 'DH'}
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white bg-rose-600 px-2.5 py-0.5 rounded-full">
                    خصم {discountPct}%
                  </span>
                </div>
              )}
            </div>
            {discountAmount > 0 && (
              <div className="text-xs sm:text-sm text-emerald-700 font-bold">
                ✓ وفر {discountAmount} {product.currency || 'DH'} فورياً عند الطلب الآن
              </div>
            )}
          </div>

          {/* Action Button (hero_cta) */}
          <div className="space-y-2.5">
            <button
              id="hero_cta"
              onClick={handleHeroCtaClick}
              className="w-full py-4 px-6 rounded-xl font-extrabold text-base sm:text-lg md:text-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-rose-500 text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-300 text-amber-300" />
              <span>{product.ctaText || 'اغتنم العرض الآن قبل نفاد الكمية'}</span>
            </button>

            {/* WhatsApp CTA */}
            {product.whatsappEnabled && product.whatsappNumber && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full py-3 px-4 rounded-xl border border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                <span>اطلب أو استفسر عبر الواتساب (WhatsApp)</span>
              </button>
            )}
          </div>

          {/* Quick Trust Checks */}
          <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-800 pt-1">
            <div className="flex items-center justify-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
              <span className="text-emerald-600 font-extrabold">✓</span>
              <span className="font-semibold">توصيل مجاني 24/48 ساعة</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
              <span className="text-emerald-600 font-extrabold">✓</span>
              <span className="font-semibold">الدفع نقداً بعد المعاينة</span>
            </div>
          </div>

          {/* Live Orders Ticker */}
          <div className="pt-1">
            <LiveOrdersTicker product={product} />
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm sm:text-base text-slate-700 font-medium leading-relaxed text-center pt-3 border-t border-slate-100">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3.5">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900">
                لماذا يجب أن تطلب هذا المنتج اليوم؟
              </h2>
            </div>
            <Benefits benefits={product.benefits} variant="cards" />
          </div>
        )}

        {/* Description Section + Description Images */}
        {(product.description ||
          (product.descriptionImages && product.descriptionImages.length > 0)) && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-5">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              شرح وتفاصيل المنتج
            </h3>
            {product.description && (
              <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                {product.description}
              </div>
            )}

            {/* Description Images / MP4 Videos below description text inside the description box */}
            {product.descriptionImages && product.descriptionImages.length > 0 && (
              <div className="space-y-4 pt-2">
                {product.descriptionImages.map((mediaUrl, idx) => (
                  <div
                    key={idx}
                    className="w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50/40"
                  >
                    <DescriptionMediaItem
                      url={mediaUrl}
                      alt={`${product.name} - تفصيل ${idx + 1}`}
                      className="w-full h-auto object-contain mx-auto block"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 text-center">
              <button
                id="mid_page_cta"
                type="button"
                onClick={handleMidCtaClick}
                className="py-3.5 px-8 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>اطلب الآن قبل نفاد الكمية</span>
              </button>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges shippingText={product.shippingText} returnPolicy={product.returnPolicy} />

        {/* High Converting COD Form */}
        <div className="pt-2">
          <CODForm
            product={product}
            utmParams={utmParams}
            accentColor="rose"
            isPreview={isPreview}
          />
        </div>

        {/* FAQ */}
        <FAQ faqs={product.faqs} />
      </div>

      {/* Seamless Brand Footer Bar */}
      <footer className="w-full bg-[#C80C32] text-white py-5 px-4 mt-8 border-t border-[#a60828]">
        <div className="max-w-[840px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div dir="ltr" className="flex items-center justify-center">
            <MimouzzaLogo height={30} />
          </div>
          <p className="text-xs text-white/90 font-semibold text-center sm:text-right">
            جميع الحقوق محفوظة © VITALIVE — الدفع عند الاستلام وشحن سريع لكافة المدن
          </p>
        </div>
      </footer>

      {/* Sticky Bottom Bar on Mobile */}
      <StickyOrderButton
        price={product.price}
        currency={product.currency || 'DH'}
        ctaText={product.ctaText}
        productId={product._id}
        productName={product.name}
        isPreview={isPreview}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
      />

      {/* Quick Order Popup Modal (High Conversion Popup) */}
      <QuickOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        product={product}
        utmParams={utmParams}
        accentColor="rose"
        isPreview={isPreview}
      />
    </div>
  );
};
