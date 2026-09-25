import React, { useEffect } from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Editorial Hero */}
        <div className="text-center max-w-2xl mx-auto space-y-3 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{product.badgeText || 'الإصدار الحصري المميز'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {product.name}
          </h1>

          {product.shortDescription && (
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              {product.shortDescription}
            </p>
          )}

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 pt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-white">{product.rating || 4.9}</span>
            <span>·</span>
            <span>({product.reviewCount || 190}+ عميل راضٍ بالمغرب)</span>
          </div>
        </div>

        {/* Gallery & Showcase */}
        <div className="bg-neutral-800/80 rounded-3xl border border-neutral-700/80 p-5 sm:p-8 backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <ProductGallery
                images={product.images}
                productName={product.name}
                discountPercentage={discountPct}
                productId={product._id}
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                  سعر العرض الحصري
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-black text-amber-400 font-mono">
                    {product.price}
                  </span>
                  <span className="text-lg font-bold text-neutral-300">
                    {product.currency || 'DH'}
                  </span>
                  {product.compareAtPrice > product.price && (
                    <span className="text-lg line-through text-neutral-500 font-mono mr-2">
                      {product.compareAtPrice} {product.currency || 'DH'}
                    </span>
                  )}
                </div>
              </div>

              {product.offerText && (
                <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs sm:text-sm font-semibold">
                  {product.offerText}
                </div>
              )}

              <button
                onClick={handleHeroCtaClick}
                className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-base shadow-lg shadow-amber-400/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-5 h-5 text-neutral-950" />
                <span>{product.ctaText || 'اطلب الآن بالدفع عند الاستلام'}</span>
              </button>

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

              <div className="pt-2 border-t border-neutral-700/60 text-xs text-neutral-400 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>ضمان الجودة ومعاينة الطرد قبل الدفع للموزع</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDown className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>توصيل سريع خلال 24 إلى 48 ساعة لكافة أنحاء المملكة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-white">المميزات الاستثنائية</h2>
              <p className="text-xs text-neutral-400 mt-1">معايير دقيقة صُنعت لأجود تجربة</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.benefits.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl bg-neutral-800/60 border border-neutral-700/60 hover:border-amber-400/40 transition-colors"
                >
                  <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
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
          <div className="bg-neutral-800/60 rounded-3xl border border-neutral-700/60 p-6 sm:p-8 space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-neutral-700 pb-3">
              نظرة عامة ومواصفات تفصيلية
            </h3>
            <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
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
