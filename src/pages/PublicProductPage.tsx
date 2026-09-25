import React from 'react';
import { useQuery } from '../lib/convex-client';
import { api } from '../../convex/api';
import { LandingPage } from '../components/landing/LandingPage';
import { ShoppingBag, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface PublicProductPageProps {
  slug: string;
  utmParams: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;
  };
  onBackToAdmin?: () => void;
}

export const PublicProductPage: React.FC<PublicProductPageProps> = ({
  slug,
  utmParams,
  onBackToAdmin,
}) => {
  // Convex reactive query for this product
  const product = useQuery(api.products.getBySlug, { slug });

  // Loading state
  if (product === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">جاري تحميل صفحة المنتج...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (product === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">المنتج غير موجود أو تم حذفه</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            الرابط الذي تحاول الوصول إليه غير متوفر حالياً. تأكد من صحة الرابط أو تواصل معنا.
          </p>
          <div className="pt-2">
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              <span>الذهاب إلى لوحة الإدارة (Admin Dashboard)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Unpublished check (can still be viewed with indicator)
  return (
    <div className="min-h-screen relative">
      {/* Admin Floating Shortcut Bar (Subtle & Convenient) */}
      <div className="bg-slate-950 text-slate-300 text-xs py-1.5 px-4 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-white">COD Landing Builder</span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            (/p/{product.slug})
          </span>
          {!product.isPublished && (
            <span className="bg-rose-900/80 text-rose-200 border border-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
              مسودة غير منشورة
            </span>
          )}
        </div>

        <a
          href="/admin"
          className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <span>لوحة التحكم (Admin Panel)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Render Template */}
      <LandingPage product={product} utmParams={utmParams} />
    </div>
  );
};
