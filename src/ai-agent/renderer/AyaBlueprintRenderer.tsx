import React, { useState } from 'react';
import {
  AyaLandingPageBlueprint,
  AyaProductInput,
} from '../types/ayaTypes';
import { MimouzzaLogo } from '../../components/ui/MimouzzaLogo';
import {
  ShoppingCart,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Sparkles,
  Camera,
  HelpCircle,
  Layers,
  AlertCircle,
  Check,
  PhoneCall,
} from 'lucide-react';

interface AyaBlueprintRendererProps {
  blueprint: AyaLandingPageBlueprint;
  product: AyaProductInput;
  viewportMode: 'mobile' | 'desktop';
}

export const AyaBlueprintRenderer: React.FC<AyaBlueprintRendererProps> = ({
  blueprint,
  product,
  viewportMode,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [demoOrderSimulated, setDemoOrderSimulated] = useState(false);

  const isRtl = product.language === 'ar';
  const images = (product.images || []).filter(Boolean);
  const currentImage = images[activeImageIdx] || images[0] || '';

  const isMobileFrame = viewportMode === 'mobile';

  return (
    <div className="w-full flex justify-center bg-[#EBEAE4] p-3 sm:p-5 overflow-y-auto h-full">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`bg-[#F8F8F6] text-[#111111] rounded-3xl border border-neutral-300 shadow-xl overflow-hidden transition-all duration-200 ${
          isMobileFrame ? 'w-[390px] max-w-full' : 'w-full max-w-[860px]'
        }`}
      >
        {/* Top COD Trust Bar */}
        <div className="bg-[#C80C32] text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-between gap-2">
          <div dir="ltr" className="shrink-0">
            <MimouzzaLogo height={24} />
          </div>
          <span className="truncate">
            {isRtl
              ? 'الدفع نقداً عند الاستلام — توصيل سريع لباب المنزل'
              : 'Cash on Delivery — Fast Doorstep Shipping'}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded">
            DEMO PREVIEW
          </span>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* 1. HERO SECTION */}
          <section className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-6 space-y-4">
            {/* Hook Kicker */}
            <div className="text-xs sm:text-sm font-bold text-[#C80C32] leading-snug">
              {blueprint.hero.hook}
            </div>

            {/* Headline */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#111111] leading-tight">
              {blueprint.hero.headline}
            </h1>

            {/* Subheadline */}
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {blueprint.hero.subheadline}
            </p>

            {/* Product Visual / Image Gallery */}
            {currentImage ? (
              <div className="space-y-2.5">
                <div className="aspect-square max-h-[340px] w-full rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  <img
                    src={currentImage}
                    alt={product.productName || 'Product showcase'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveImageIdx(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                          i === activeImageIdx ? 'border-[#FF6B00]' : 'border-neutral-200'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.productName || 'Product'} thumbnail ${i + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-[#F8F8F6] p-5 text-center space-y-2">
                <Camera className="w-7 h-7 text-[#FF6B00] mx-auto" />
                <div className="text-xs font-bold text-[#111111]">
                  {isRtl ? 'التوجيه البصري المقترح (Visual Direction)' : 'Recommended Visual Direction'}
                </div>
                <p className="text-xs text-neutral-600 max-w-md mx-auto leading-relaxed">
                  {blueprint.hero.visualDirection}
                </p>
              </div>
            )}

            {/* Art Direction Note */}
            {currentImage && blueprint.hero.visualDirection && (
              <div className="text-[11px] text-neutral-500 bg-[#F8F8F6] px-3.5 py-2.5 rounded-xl border border-neutral-200/70">
                <span className="font-bold text-[#111111]">
                  {isRtl ? 'توجيه التصوير (Visual Direction): ' : 'Visual Direction: '}
                </span>
                <span>{blueprint.hero.visualDirection}</span>
              </div>
            )}

            {/* Price Anchor Bar */}
            <div className="bg-[#F8F8F6] rounded-xl border border-neutral-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-[#FF6B00] font-mono tabular-nums">
                  {blueprint.offer.price}
                </span>
                {blueprint.offer.oldPrice && (
                  <span className="text-xs sm:text-sm text-neutral-400 line-through font-mono tabular-nums">
                    {blueprint.offer.oldPrice}
                  </span>
                )}
              </div>
              {blueprint.offer.discount && (
                <span className="text-xs font-extrabold text-[#C80C32] bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                  {blueprint.offer.discount}
                </span>
              )}
            </div>

            {/* Hero CTA Button */}
            <a
              href="#aya-demo-checkout"
              className="w-full py-3.5 px-5 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{blueprint.hero.cta}</span>
            </a>

            {/* Reassurance Micro-Copy */}
            <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-neutral-700 font-semibold">
              <div className="flex items-center justify-center gap-1.5 bg-[#F8F8F6] p-2 rounded-lg border border-neutral-200/60">
                <ShieldCheck className="w-3.5 h-3.5 text-[#129A56] shrink-0" />
                <span>{isRtl ? 'الدفع عند الاستلام' : 'Pay on Delivery'}</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 bg-[#F8F8F6] p-2 rounded-lg border border-neutral-200/60">
                <Truck className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                <span>{isRtl ? 'توصيل لباب المنزل' : 'Doorstep Delivery'}</span>
              </div>
            </div>
          </section>

          {/* 2. PROBLEM AGITATION SECTION */}
          <section className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-6 space-y-2.5">
            <div className="text-[11px] font-bold text-rose-600">
              {isRtl ? '01. المشكلة المعتادة' : '01. The Core Problem'}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#111111]">
              {blueprint.problem.headline}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {blueprint.problem.body}
            </p>
          </section>

          {/* 3. SOLUTION & MECHANISM SECTION */}
          <section className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-6 space-y-2.5">
            <div className="text-[11px] font-bold text-[#129A56]">
              {isRtl ? '02. الحل وآلية العمل' : '02. The Mechanism & Solution'}
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#111111]">
              {blueprint.solution.headline}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {blueprint.solution.body}
            </p>
          </section>

          {/* 4. KEY BENEFITS SECTION */}
          <section className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-6 space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#FF6B00]">
                {isRtl ? '03. المنافع العملية' : '03. Key Benefits'}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#111111] mt-0.5">
                {isRtl
                  ? `لماذا يختار الزبناء ${product.productName || 'هذا المنتج'}؟`
                  : `Why Customers Choose ${product.productName || 'This Product'}`}
              </h2>
            </div>

            <div className={`grid gap-3 ${isMobileFrame ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {blueprint.benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/80 space-y-1"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#111111] leading-snug">
                      {b.title}
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed pr-6 pl-6">
                    {b.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 5. HOW IT WORKS (3 STEPS) */}
          <section className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-6 space-y-4">
            <div>
              <div className="text-[11px] font-bold text-[#FF6B00]">
                {isRtl ? '04. خطوات الطلب والاستخدام' : '04. How It Works'}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#111111] mt-0.5">
                {isRtl ? '3 خطوات بسيطة وواضحة' : '3 Simple Steps'}
              </h2>
            </div>

            <div className="space-y-2.5">
              {blueprint.howItWorks.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/80"
                >
                  <span className="w-7 h-7 rounded-lg bg-[#111111] text-white font-mono text-xs font-extrabold flex items-center justify-center shrink-0">
                    {step.stepNumber || `0${i + 1}`}
                  </span>
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-extrabold text-[#111111]">
                      {step.title}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 6. HONEST SOCIAL PROOF / PLACEHOLDER SECTION */}
          <section
            className={`rounded-2xl border p-4 sm:p-6 space-y-3.5 ${
              blueprint.socialProof.isPlaceholderRecommendation
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-white border-neutral-200/90'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  blueprint.socialProof.isPlaceholderRecommendation
                    ? 'text-amber-700'
                    : 'text-[#129A56]'
                }`}
              />
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#111111]">
                  {blueprint.socialProof.headline}
                </h2>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  {blueprint.socialProof.recommendationNote}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {blueprint.socialProof.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-neutral-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>{item.label}</span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      {item.verificationType}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 7. OFFER STACK & ISOLATED DEMO COD FORM */}
          <section
            id="aya-demo-checkout"
            className="bg-white rounded-2xl border-2 border-[#FF6B00]/40 p-4 sm:p-6 space-y-4"
          >
            <div className="space-y-1 text-center">
              <div className="text-xs font-extrabold text-[#FF6B00]">
                {isRtl ? 'العرض الخاص وطلب الاستلام' : 'Special Offer & COD Checkout'}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#111111]">
                {blueprint.offer.headline}
              </h2>
            </div>

            {/* Bonuses / Value Stack */}
            {blueprint.offer.bonuses && blueprint.offer.bonuses.length > 0 && (
              <div className="bg-[#FFF3EB] border border-[#FF6B00]/25 rounded-xl p-3.5 space-y-2">
                {blueprint.offer.bonuses.map((bonus, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-[#111111]">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span>{bonus}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Isolated Demo COD Checkout Preview */}
            {demoOrderSimulated ? (
              <div className="p-4 rounded-xl bg-[#E8F8F0] border border-[#129A56]/30 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#129A56] mx-auto" />
                <div className="text-sm font-extrabold text-[#111111]">
                  {isRtl
                    ? 'معاينة تجريبية: تم محاكاة إرسال الطلب (DEMO ONLY)'
                    : 'Demo Simulation: Order Trigger Tested (Isolated)'}
                </div>
                <p className="text-xs text-neutral-600">
                  {isRtl
                    ? 'هذا النموذج معزول تماماً في وضع DEMO ولا يضيف أي طلبات وهمية لقاعدة بيانات متجرك.'
                    : 'This checkout preview is strictly isolated in DEMO mode and writes zero records to your live store database.'}
                </p>
                <button
                  type="button"
                  onClick={() => setDemoOrderSimulated(false)}
                  className="text-xs font-bold text-[#129A56] underline cursor-pointer"
                >
                  {isRtl ? 'إعادة عرض الاستمارة' : 'Reset Form Preview'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    {isRtl ? 'الاسم الكامل *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder={isRtl ? 'الاسم الكامل للزبون' : 'Customer full name'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F8F6] text-xs text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    {isRtl ? 'رقم الهاتف (لتأكيد الطلب) *' : 'Phone Number *'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    dir="ltr"
                    placeholder="06XXXXXXXX / 07XXXXXXXX"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F8F6] text-xs font-mono text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    {isRtl ? 'المدينة والعنوان *' : 'City & Delivery Address *'}
                  </label>
                  <input
                    type="text"
                    readOnly
                    placeholder={
                      isRtl
                        ? 'الدار البيضاء / الرباط / مراكش...'
                        : 'Casablanca / Rabat / Marrakech...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-[#F8F8F6] text-xs text-neutral-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setDemoOrderSimulated(true)}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{blueprint.finalCta.button}</span>
                </button>
              </div>
            )}
          </section>

          {/* 8. FAQ SECTION */}
          {blueprint.faq && blueprint.faq.length > 0 && (
            <section className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-6 space-y-3.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF6B00]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#111111]">
                  {isRtl ? 'الأسئلة الشائعة وإزالة الاعتراضات' : 'Frequently Asked Questions'}
                </h2>
              </div>

              <div className="space-y-2.5">
                {blueprint.faq.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-[#F8F8F6] border border-neutral-200/80 space-y-1"
                  >
                    <div className="text-xs sm:text-sm font-extrabold text-[#111111]">
                      {item.question}
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 9. FINAL CTA SECTION */}
          <section className="bg-[#111111] text-white rounded-2xl p-5 sm:p-6 text-center space-y-3">
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              {blueprint.finalCta.headline}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-md mx-auto">
              {blueprint.finalCta.body}
            </p>
            <a
              href="#aya-demo-checkout"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-extrabold text-sm transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{blueprint.finalCta.button}</span>
            </a>
          </section>
        </div>
      </div>
    </div>
  );
};
