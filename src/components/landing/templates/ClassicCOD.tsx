import React, { useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar, OfferBanner } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { LiveOrdersTicker } from '../LiveOrdersTicker';
import { MimouzzaLogo } from '../../ui/MimouzzaLogo';
import { DescriptionMediaItem } from '../DescriptionMediaItem';
import { trackEvent } from '../../../lib/tracking';
import {
  Star,
  ShoppingCart,
  Award,
  Check,
  MessageCircle,
  AlertCircle,
} from 'lucide-react';

interface ClassicCODProps {
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

export const ClassicCOD: React.FC<ClassicCODProps> = ({
  product,
  utmParams,
  isPreview = false,
}) => {
  const discountPct =
    product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : undefined;

  // Track initial PAGE_VIEW and PRODUCT_VIEW on mount (only on real public visits, never in preview)
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
    document.getElementById('order-form-container')?.scrollIntoView({ behavior: 'smooth' });
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
    document.getElementById('order-form-container')?.scrollIntoView({ behavior: 'smooth' });
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
    const message = encodeURIComponent(`السلام عليكم، أريد الاستفسار بخصوص منتج: ${product.name}`);
    window.open(`https://wa.me/${product.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#111111] pb-20 md:pb-12" dir="rtl">
      {/* 1. Top shipping/trust announcement */}
      <TopAnnouncementBar
        text={
          product.shippingText ||
          '🚚 التوصيل مجاني لجميع مدن المغرب — الدفع نقداً عند الاستلام'
        }
      />

      {/* Main Container */}
      <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 2 & 3. Hero Section: Image on top, title, price, button, and guarantees */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-7 shadow-2xs space-y-5">
          <ProductGallery
            images={product.images}
            productName={product.name}
            badgeText={product.badgeText}
            discountPercentage={discountPct}
            productId={product._id}
            isPreview={isPreview}
          />

          {/* Product Title directly under image */}
          <div className="text-center space-y-2 pt-1">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-[#111111] leading-snug">
              {product.name}
            </h1>

            {/* Rating & Social Proof */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-neutral-600">
              <div className="flex text-[#FF6B00]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FF6B00] text-[#FF6B00]" />
                ))}
              </div>
              <span className="font-bold text-[#111111]">{product.rating || 4.9}</span>
              <span>·</span>
              <span className="font-medium">({product.reviewCount || 180}+ تقييم)</span>
              <span>·</span>
              <span className="text-[#129A56] font-bold bg-[#E8F8F0] px-2.5 py-0.5 rounded-full text-xs">
                متوفر في المخزون
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-center gap-3.5 bg-[#F8F8F6] rounded-2xl border border-neutral-200/80 p-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-[#FF6B00] font-mono">
                {product.price}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#111111]">
                {product.currency || 'DH'}
              </span>
            </div>

            {product.compareAtPrice > product.price && (
              <div className="flex items-center gap-2.5 text-sm sm:text-base text-neutral-400">
                <span className="line-through font-mono font-semibold">
                  {product.compareAtPrice} {product.currency || 'DH'}
                </span>
                {discountPct && (
                  <span className="bg-[#FFF3EB] text-[#FF6B00] font-extrabold px-3 py-0.5 rounded-full text-xs sm:text-sm border border-[#FF6B00]/25">
                    وفر {discountPct}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stock Scarcity if configured */}
          {product.scarcityEnabled && (
            <div className="p-3.5 bg-[#FFF3EB] border border-[#FF6B00]/30 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-[#111111] font-bold">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#FF6B00] shrink-0" />
                <span>الكمية المتبقية:</span>
              </div>
              <span className="font-extrabold text-[#FF6B00] font-mono">
                فقط {product.stockQuantity || 7} قطع في المخزون
              </span>
            </div>
          )}

          {/* Offer Alert if configured */}
          {product.offerText && (
            <div className="text-xs sm:text-sm font-bold text-[#111111] bg-[#FFF3EB] border border-[#FF6B00]/30 p-3.5 rounded-2xl flex items-center justify-center gap-2 text-center">
              <span className="text-[#FF6B00] font-black text-base">⚡</span>
              <span>{product.offerText}</span>
            </div>
          )}

          {/* CTA Order Button (hero_cta) */}
          <div className="space-y-2.5">
            <button
              id="hero_cta"
              onClick={handleHeroCtaClick}
              className="w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg md:text-xl bg-[#FF6B00] hover:bg-[#e66000] text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{product.ctaText || 'اطلب الآن — الدفع عند الاستلام'}</span>
            </button>

            {/* WhatsApp CTA (Optional) */}
            {product.whatsappEnabled && product.whatsappNumber && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full py-3 px-4 rounded-2xl border border-[#129A56] text-[#129A56] hover:bg-[#E8F8F0] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#129A56]" />
                <span>اطلب أو استفسر عبر الواتساب (WhatsApp)</span>
              </button>
            )}
          </div>

          {/* Quick Trust Checks */}
          <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm text-[#111111] pt-1">
            <div className="flex items-center justify-center gap-2 bg-[#F8F8F6] p-2.5 rounded-2xl border border-neutral-200/70 text-center">
              <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
              <span className="font-semibold">توصيل مجاني لباب منزلك</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-[#F8F8F6] p-2.5 rounded-2xl border border-neutral-200/70 text-center">
              <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
              <span className="font-semibold">الدفع نقداً بعد المعاينة</span>
            </div>
          </div>

          {/* Live Orders Ticker (between Price/CTA box and Description) */}
          <div className="pt-1">
            <LiveOrdersTicker product={product} />
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm sm:text-base text-neutral-700 font-medium leading-relaxed text-center pt-3 border-t border-neutral-100">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Offer Banner */}
        <OfferBanner offerText={product.offerText} withCountdown={product.countdownEnabled} />

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3.5">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#111111]">
                لماذا يفضل زبناؤنا هذا المنتج؟
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                ضمانات وجودة استثنائية مصممة لراحتك
              </p>
            </div>
            <Benefits benefits={product.benefits} variant="cards" />
          </div>
        )}

        {/* Detailed Product Description & Story + Description Images */}
        {(product.description ||
          (product.descriptionImages && product.descriptionImages.length > 0)) && (
          <div className="bg-white rounded-3xl border border-neutral-200/80 p-5 sm:p-7 shadow-2xs space-y-5">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-[#111111] border-b border-neutral-100 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#FF6B00]" />
              تفاصيل ومواصفات المنتج
            </h3>
            {product.description && (
              <div className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line font-medium">
                {product.description}
              </div>
            )}

            {/* Description Images / MP4 Videos below description text inside the description box */}
            {product.descriptionImages && product.descriptionImages.length > 0 && (
              <div className="space-y-4 pt-2">
                {product.descriptionImages.map((mediaUrl, idx) => (
                  <div
                    key={idx}
                    className="w-full rounded-2xl overflow-hidden border border-neutral-100 bg-[#F8F8F6]/50"
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
                className="py-3.5 px-8 rounded-full bg-[#111111] hover:bg-neutral-800 text-white font-extrabold text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ShoppingCart className="w-5 h-5 text-[#FF6B00]" />
                <span>اطلب الآن قبل نفاد الكمية</span>
              </button>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges shippingText={product.shippingText} returnPolicy={product.returnPolicy} />

        {/* COD Order Form */}
        <div className="pt-2">
          <CODForm product={product} utmParams={utmParams} isPreview={isPreview} />
        </div>

        {/* FAQ Section */}
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
      />
    </div>
  );
};
