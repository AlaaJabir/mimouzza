import React, { useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar, OfferBanner } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { trackEvent } from '../../../lib/tracking';
import { Star, ShieldCheck, Truck, ShoppingCart, Award, Check, MessageCircle, AlertCircle } from 'lucide-react';

interface ClassicCODProps {
  product: Product;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

export const ClassicCOD: React.FC<ClassicCODProps> = ({ product, utmParams }) => {
  const discountPct =
    product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : undefined;

  // Track initial PAGE_VIEW and VIEW_CONTENT on mount
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

  const handleMidCtaClick = () => {
    trackEvent({
      eventType: 'CTA_CLICK',
      productId: product._id,
      productName: product.name,
      price: product.price,
      currency: product.currency,
      metadata: { elementId: 'mid_page_cta' },
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
    const message = encodeURIComponent(`السلام عليكم، أريد الاستفسار بخصوص منتج: ${product.name}`);
    window.open(`https://wa.me/${product.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-12" dir="rtl">
      {/* 1. Top shipping/trust announcement */}
      <TopAnnouncementBar text={product.shippingText || '🚚 التوصيل مجاني لجميع مدن المغرب — الدفع نقداً عند الاستلام'} />

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 2 & 3. Hero Section: Image on top, title, price, button, and guarantees */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          {/* Image on top (image tji foq) */}
          <ProductGallery
            images={product.images}
            productName={product.name}
            badgeText={product.badgeText}
            discountPercentage={discountPct}
            productId={product._id}
          />

          {/* Product Title directly under image (otahtha titre) in reasonable size (size m3qol) */}
          <div className="text-center space-y-1.5 pt-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h1>

            {/* Rating & Social Proof */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-slate-800">{product.rating || 4.9}</span>
              <span>·</span>
              <span>({product.reviewCount || 180}+ تقييم)</span>
              <span>·</span>
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                متوفر في المخزون
              </span>
            </div>
          </div>

          {/* Pricing in reasonable size */}
          <div className="flex items-center justify-center gap-3 py-1 bg-slate-50 rounded-xl border border-slate-200/70 p-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
                {product.price}
              </span>
              <span className="text-sm font-bold text-slate-700">
                {product.currency || 'DH'}
              </span>
            </div>

            {product.compareAtPrice > product.price && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="line-through font-mono font-medium">
                  {product.compareAtPrice} {product.currency || 'DH'}
                </span>
                {discountPct && (
                  <span className="bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full text-[11px] border border-rose-200">
                    وفر {discountPct}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stock Scarcity if configured */}
          {product.scarcityEnabled && (
            <div className="p-2 bg-amber-50/90 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900 font-semibold">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>الكمية المتبقية:</span>
              </div>
              <span className="font-bold text-rose-600 font-mono">
                فقط {product.stockQuantity || 7} قطع في المخزون
              </span>
            </div>
          )}

          {/* Offer Alert if configured */}
          {product.offerText && (
            <div className="text-xs font-semibold text-amber-900 bg-amber-50/80 border border-amber-200/70 p-2.5 rounded-xl flex items-center justify-center gap-2 text-center">
              <span className="text-amber-600 font-black">⚡</span>
              <span>{product.offerText}</span>
            </div>
          )}

          {/* CTA Order Button (o boutton) */}
          <div className="space-y-2">
            <button
              onClick={handleHeroCtaClick}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-base bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{product.ctaText || 'اطلب الآن — الدفع عند الاستلام'}</span>
            </button>

            {/* WhatsApp CTA (Optional) */}
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

          {/* Quick Trust Checks (ochi lakhr) */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-1">
            <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-medium">توصيل مجاني لباب منزلك</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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

        {/* Offer Banner */}
        <OfferBanner offerText={product.offerText} withCountdown={product.countdownEnabled} />

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                لماذا يفضل زبناؤنا هذا المنتج؟
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">ضمانات وجودة استثنائية مصممة لراحتك</p>
            </div>
            <Benefits benefits={product.benefits} variant="cards" />
          </div>
        )}

        {/* Detailed Product Description & Story */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              تفاصيل ومواصفات المنتج
            </h3>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>

            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={handleMidCtaClick}
                className="py-3 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>اطلب الآن قبل نفاد الكمية</span>
              </button>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges
          shippingText={product.shippingText}
          returnPolicy={product.returnPolicy}
        />

        {/* COD Order Form */}
        <div className="pt-2">
          <CODForm product={product} utmParams={utmParams} />
        </div>

        {/* FAQ Section */}
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
