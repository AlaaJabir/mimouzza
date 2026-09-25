import React from 'react';
import { Product } from '../../../../convex/schema';
import { TopAnnouncementBar, OfferBanner } from '../OfferBanner';
import { ProductGallery } from '../ProductGallery';
import { Benefits } from '../Benefits';
import { TrustBadges } from '../TrustBadges';
import { CODForm } from '../CODForm';
import { FAQ } from '../FAQ';
import { StickyOrderButton } from '../StickyOrderButton';
import { Star, ShieldCheck, Truck, ShoppingCart, Award, Check } from 'lucide-react';

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

  const scrollToOrder = () => {
    document.getElementById('order-form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-12" dir="rtl">
      {/* 1. Top shipping/trust announcement */}
      <TopAnnouncementBar text={product.shippingText || '🚚 التوصيل مجاني لجميع مدن المغرب — الدفع نقداً عند الاستلام'} />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 2 & 3. Hero Section: Gallery & Primary Buy Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Gallery */}
            <div>
              <ProductGallery
                images={product.images}
                productName={product.name}
                badgeText={product.badgeText}
                discountPercentage={discountPct}
              />
            </div>

            {/* Product Meta & Instant Buy Call */}
            <div className="space-y-4">
              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                {product.name}
              </h1>

              {/* Rating & Social Proof */}
              <div className="flex items-center gap-2 text-xs">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">{product.rating || 4.9}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">({product.reviewCount || 180}+ تقييم معتمد)</span>
                <span className="text-slate-400">·</span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                  متوفر في المخزون
                </span>
              </div>

              {/* Pricing Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">السعر الحالي:</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-950 font-mono">
                      {product.price}
                    </span>
                    <span className="text-base font-bold text-amber-600">
                      {product.currency || 'DH'}
                    </span>
                  </div>
                </div>

                {product.compareAtPrice > product.price && (
                  <div className="text-left">
                    <div className="text-[11px] text-slate-400">السعر القديم:</div>
                    <div className="text-lg line-through text-slate-400 font-mono font-semibold">
                      {product.compareAtPrice} {product.currency || 'DH'}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Offer Alert */}
              {product.offerText && (
                <div className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200/70 p-2.5 rounded-lg flex items-center gap-2">
                  <span className="text-amber-600 font-black">⚡</span>
                  <span>{product.offerText}</span>
                </div>
              )}

              {/* Instant CTA to jump to form */}
              <button
                onClick={scrollToOrder}
                className="w-full py-3.5 px-6 rounded-xl font-black text-base bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{product.ctaText || 'اطلب الآن — الدفع عند الاستلام'}</span>
              </button>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {product.shortDescription}
                </p>
              )}

              {/* Quick Trust Checks */}
              <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>توصيل مجاني وسريع لباب المنزل خلال 24/48 ساعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>لا تدفع أي مبلغ مالي حتى تعاين طردك وتتأكد منه</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Banner */}
        <OfferBanner offerText={product.offerText} withCountdown={true} />

        {/* Benefits Section */}
        {product.benefits && product.benefits.length > 0 && (
          <div className="space-y-3">
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                لماذا يفضل زبناؤنا هذا المنتج؟
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">ضمانات وجودة استثنائية مصممة لراحتك</p>
            </div>
            <Benefits benefits={product.benefits} variant="cards" />
          </div>
        )}

        {/* Detailed Product Description & Story */}
        {product.description && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              تفاصيل ومواصفات المنتج
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
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
      />
    </div>
  );
};
