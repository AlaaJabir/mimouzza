import React, { useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { LiveOrdersTicker } from '../LiveOrdersTicker';
import { trackEvent } from '../../../lib/tracking';
import { Star, ShieldCheck, Sparkles, ShoppingBag, ArrowDown, MessageCircle } from 'lucide-react';

interface PremiumProductProps {
  product: Product;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

export const PremiumProduct: React.FC<PremiumProductProps> = ({ product, utmParams }) => {
  const discountPct =
    product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : undefined;

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
    <div className="min-h-screen bg-neutral-900 text-neutral-100 pb-20 md:pb-12" dir="rtl">
      {/* Top Bar */}
      <TopAnnouncementBar text={product.shippingText || 'التوصيل مجاني لكافة مدن المغرب — الدفع عند الاستلام'} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Card: Image on top, title, price, button, and guarantees */}
        <div className="bg-neutral-800/90 rounded-2xl border border-neutral-700/80 p-4 sm:p-6 shadow-xl space-y-4">
          {product.badgeText && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-amber-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{product.badgeText}</span>
              </div>
            </div>
          )}

          {/* Image on top (image tji foq) */}
          <ProductGallery
            images={product.images}
            productName={product.name}
            discountPercentage={discountPct}
            productId={product._id}
          />

          {/* Title directly under image (otahtha titre) in reasonable size (size m3qol) */}
          <div className="text-center space-y-1.5 pt-1">
            <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {product.name}
            </h1>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-bold text-white">{product.rating || 4.9}</span>
              <span>·</span>
              <span>({product.reviewCount || 190}+ عميل راضٍ)</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[11px]">
                متوفر للشحن الفوري
              </span>
            </div>
          </div>

          {/* Price box in reasonable size */}
          <div className="flex items-center justify-center gap-3 py-1 bg-neutral-900/80 rounded-xl border border-neutral-700/70 p-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {product.price}
              </span>
              <span className="text-sm font-bold text-neutral-300">
                {product.currency || 'DH'}
              </span>
            </div>

            {product.compareAtPrice > product.price && (
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span className="line-through font-mono font-medium">
                  {product.compareAtPrice} {product.currency || 'DH'}
                </span>
                {discountPct && (
                  <span className="bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full text-[11px] border border-amber-400/40">
                    وفر {discountPct}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Offer text */}
          {product.offerText && (
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold text-center">
              {product.offerText}
            </div>
          )}

          {/* CTA Order Button (o boutton) */}
          <div className="space-y-2">
            <button
              onClick={handleHeroCtaClick}
              className="w-full py-3.5 px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-base shadow-lg shadow-amber-400/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 text-neutral-950" />
              <span>{product.ctaText || 'اطلب الآن بالدفع عند الاستلام'}</span>
            </button>

            {/* WhatsApp CTA */}
            {product.whatsappEnabled && product.whatsappNumber && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="w-full py-2.5 px-4 rounded-xl border border-emerald-500 text-emerald-400 hover:bg-emerald-950/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>تواصل عبر الواتساب (WhatsApp)</span>
              </button>
            )}
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300 pt-1">
            <div className="flex items-center justify-center gap-1.5 bg-neutral-900/60 p-2 rounded-lg border border-neutral-700/60 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-medium">معاينة الطرد قبل الدفع</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-neutral-900/60 p-2 rounded-lg border border-neutral-700/60 text-center">
              <ArrowDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-[11px] font-medium">توصيل سريع 24/48 ساعة</span>
            </div>
          </div>

          {/* Live Fake Orders Ticker (between Price/CTA box and Description) */}
          <div className="pt-1">
            <LiveOrdersTicker product={product} />
          </div>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed text-center pt-2 border-t border-neutral-700/60">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-bold text-white">المميزات الاستثنائية</h2>
              <p className="text-xs text-neutral-400 mt-0.5">معايير دقيقة صُنعت لأجود تجربة</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.benefits.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-neutral-800/60 border border-neutral-700/60 hover:border-amber-400/40 transition-colors"
                >
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    {b.title}
                  </h3>
                  {b.description && (
                    <p className="text-xs text-neutral-300 leading-relaxed pr-4">
                      {b.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description Section */}
        {product.description && (
          <div className="bg-neutral-800/60 rounded-2xl border border-neutral-700/60 p-5 sm:p-6 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-white border-b border-neutral-700 pb-2.5">
              نظرة عامة ومواصفات تفصيلية
            </h3>
            <div className="text-xs sm:text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {product.description}
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
          <CODForm product={product} utmParams={utmParams} accentColor="amber" />
        </div>

        {/* FAQ */}
        <FAQ faqs={product.faqs} className="text-neutral-100" />
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
