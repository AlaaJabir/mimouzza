import React, { useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { LiveOrdersTicker } from '../LiveOrdersTicker';
import { MimouzzaLogo } from '../../ui/MimouzzaLogo';
import { trackEvent } from '../../../lib/tracking';
import {
  Star,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  ArrowDown,
  MessageCircle,
} from 'lucide-react';

interface PremiumProductProps {
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

export const PremiumProduct: React.FC<PremiumProductProps> = ({
  product,
  utmParams,
  isPreview = false,
}) => {
  const discountPct =
    product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : undefined;

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
    <div className="min-h-screen bg-neutral-900 text-neutral-100 pb-20 md:pb-12" dir="rtl">
      {/* Top Bar */}
      <TopAnnouncementBar
        text={product.shippingText || 'التوصيل مجاني لكافة مدن المغرب — الدفع عند الاستلام'}
      />

      <div className="max-w-[840px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Card: Image on top, title, price, button, and guarantees */}
        <div className="bg-neutral-800/90 rounded-2xl border border-neutral-700/80 p-5 sm:p-7 shadow-xl space-y-5">
          {product.badgeText && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-amber-400 text-xs sm:text-sm font-bold">
                <Sparkles className="w-4 h-4" />
                <span>{product.badgeText}</span>
              </div>
            </div>
          )}

          {/* Image on top */}
          <ProductGallery
            images={product.images}
            productName={product.name}
            discountPercentage={discountPct}
            productId={product._id}
            isPreview={isPreview}
          />

          {/* Title directly under image */}
          <div className="text-center space-y-2 pt-1">
            <h1 className="text-xl sm:text-2xl md:text-[26px] font-extrabold text-white leading-snug">
              {product.name}
            </h1>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-neutral-300">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-white">{product.rating || 4.9}</span>
              <span>·</span>
              <span className="font-medium">({product.reviewCount || 190}+ عميل راضٍ)</span>
              <span>·</span>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-md text-xs">
                متوفر للشحن الفوري
              </span>
            </div>
          </div>

          {/* Price box */}
          <div className="flex items-center justify-center gap-3.5 bg-neutral-900/80 rounded-xl border border-neutral-700/70 p-3.5 sm:p-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {product.price}
              </span>
              <span className="text-base sm:text-lg font-extrabold text-neutral-200">
                {product.currency || 'DH'}
              </span>
            </div>

            {product.compareAtPrice > product.price && (
              <div className="flex items-center gap-2.5 text-sm sm:text-base text-neutral-400">
                <span className="line-through font-mono font-semibold">
                  {product.compareAtPrice} {product.currency || 'DH'}
                </span>
                {discountPct && (
                  <span className="bg-amber-400/20 text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-xs sm:text-sm border border-amber-400/40">
                    وفر {discountPct}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Offer text */}
          {product.offerText && (
            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-bold text-center">
              {product.offerText}
            </div>
          )}

          {/* CTA Order Button (hero_cta) */}
          <div className="space-y-2.5">
            <button
              id="hero_cta"
              onClick={handleHeroCtaClick}
              className="w-full py-4 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-base sm:text-lg md:text-xl shadow-lg shadow-amber-400/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-950" />
              <span>{product.ctaText || 'اطلب الآن بالدفع عند الاستلام'}</span>
            </button>

            {/* WhatsApp CTA */}
            {product.whatsappEnabled && product.whatsappNumber && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full py-3 px-4 rounded-xl border border-emerald-500 text-emerald-400 hover:bg-emerald-950/40 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <span>تواصل عبر الواتساب (WhatsApp)</span>
              </button>
            )}
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-2.5 text-xs sm:text-sm text-neutral-200 pt-1">
            <div className="flex items-center justify-center gap-2 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-700/60 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">معاينة الطرد قبل الدفع</span>
            </div>
            <div className="flex items-center justify-center gap-2 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-700/60 text-center">
              <ArrowDown className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold">توصيل سريع 24/48 ساعة</span>
            </div>
          </div>

          {/* Live Orders Ticker */}
          <div className="pt-1">
            <LiveOrdersTicker product={product} />
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-sm sm:text-base text-neutral-300 font-medium leading-relaxed text-center pt-3 border-t border-neutral-700/60">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3.5">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white">
                المميزات الاستثنائية
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                معايير دقيقة صُنعت لأجود تجربة
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.benefits.map((b) => (
                <div
                  key={b.id}
                  className="p-4 sm:p-5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 hover:border-amber-400/40 transition-colors"
                >
                  <h3 className="text-sm sm:text-base font-extrabold text-white mb-1.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    {b.title}
                  </h3>
                  {b.description && (
                    <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed pr-4">
                      {b.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description Section + Description Images */}
        {(product.description ||
          (product.descriptionImages && product.descriptionImages.length > 0)) && (
          <div className="bg-neutral-800/60 rounded-2xl border border-neutral-700/60 p-5 sm:p-7 space-y-5">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-white border-b border-neutral-700 pb-3">
              نظرة عامة ومواصفات تفصيلية
            </h3>
            {product.description && (
              <div className="text-sm sm:text-base text-neutral-200 leading-relaxed whitespace-pre-line font-medium">
                {product.description}
              </div>
            )}

            {/* Description Images / PNGs below description text inside the description box */}
            {product.descriptionImages && product.descriptionImages.length > 0 && (
              <div className="space-y-4 pt-2">
                {product.descriptionImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="w-full rounded-xl overflow-hidden border border-neutral-700/70 bg-neutral-900/40"
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} - تفصيل ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
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
                className="py-3.5 px-8 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-extrabold text-sm sm:text-base inline-flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>اطلب الآن قبل نفاد الكمية</span>
              </button>
            </div>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges
          shippingText={product.shippingText}
          returnPolicy={product.returnPolicy}
          className="bg-neutral-800/60 border-neutral-700/60 text-neutral-100"
        />

        {/* COD Form */}
        <div className="pt-4">
          <CODForm
            product={product}
            utmParams={utmParams}
            accentColor="amber"
            isPreview={isPreview}
          />
        </div>

        {/* FAQ */}
        <FAQ faqs={product.faqs} className="text-neutral-100" />
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
