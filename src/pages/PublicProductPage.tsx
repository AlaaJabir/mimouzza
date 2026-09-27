import React, { useEffect, useState } from 'react';
import { useQuery } from '../lib/convex-client';
import { api } from '../../convex/api';
import { db, getProductStatus } from '../../convex/db';
import { LandingPage } from '../components/landing/LandingPage';
import { initMarketingPixels } from '../lib/tracking';
import { ArrowRight, ShieldAlert, EyeOff, Eye } from 'lucide-react';

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
}) => {
  // Convex reactive query for this product
  const productFromStore = useQuery(api.products.getBySlug, { slug });
  const settings = useQuery(api.settings.get);
  const [serverFetchedProduct, setServerFetchedProduct] = useState<typeof productFromStore>(undefined);
  const [checkingServer, setCheckingServer] = useState(true);
  const [adminPreviewOverride, setAdminPreviewOverride] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCheckingServer(true);
    setAdminPreviewOverride(false);

    // Always verify against authoritative backend server so cross-browser / mobile links
    // resolve accurately without relying on browser local state.
    Promise.all([
      db.fetchProductBySlugFromServer(slug),
      db.waitForHydration(),
    ])
      .then(([fetched]) => {
        if (!cancelled) {
          setServerFetchedProduct(fetched);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingServer(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const product = productFromStore ?? serverFetchedProduct ?? null;
  const productStatus = product ? getProductStatus(product) : null;

  // SEO & OpenGraph dynamic meta injection
  useEffect(() => {
    if (!product) return;

    document.title = product.seoTitle || `${product.name} | الدفع عند الاستلام`;

    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (product.seoDescription || product.shortDescription) {
      setMetaTag('name', 'description', product.seoDescription || product.shortDescription);
    }
    setMetaTag('property', 'og:title', product.ogTitle || product.name);
    setMetaTag(
      'property',
      'og:description',
      product.ogDescription || product.shortDescription || ''
    );
    if (product.ogImage || (product.images && product.images[0])) {
      setMetaTag('property', 'og:image', product.ogImage || product.images[0]);
    }
  }, [product]);

  // Pixel Initialization (Global with per-product override on all landing pages)
  useEffect(() => {
    if (!product) return;

    const customMeta = product.customMetaPixelId?.trim();
    const globalMeta = settings?.metaPixelId?.trim() || '135752956164308';
    const metaPixelId = customMeta || globalMeta;

    const customTikTok = product.customTikTokPixelId?.trim();
    const globalTikTok = settings?.tiktokPixelId?.trim();
    const tiktokPixelId = customTikTok || globalTikTok;

    const enableMeta = Boolean(metaPixelId);
    const enableTikTok = Boolean(tiktokPixelId);

    initMarketingPixels({
      metaPixelId,
      enableMeta,
      tiktokPixelId,
      enableTikTok,
      gaId: settings?.googleAnalyticsId,
      enableGA: Boolean(settings?.enableGoogleAnalytics && settings?.googleAnalyticsId),
    });
  }, [product, settings]);

  // 1. Loading state (wait while querying authoritative server database)
  if (checkingServer && !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">جاري تحميل صفحة المنتج...</p>
        </div>
      </div>
    );
  }

  // 2. Product does NOT exist in database
  if (!product) {
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

  // 3. Product EXISTS in database, but status is DRAFT or ARCHIVED (not publicly active)
  if (productStatus !== 'ACTIVE' && !adminPreviewOverride) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto">
            <EyeOff className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span>
              {productStatus === 'ARCHIVED'
                ? 'حالة المنتج: مؤرشف (ARCHIVED)'
                : 'حالة المنتج: مسودة غير منشورة (DRAFT)'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">المنتج غير متاح حالياً</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            هذا المنتج ({product.name}) محفوظ في قاعدة البيانات ولكنه غير منشور للعامة حالياً. لتلقي الطلبات من الزوار، يرجى تفعيل حالة المنتج إلى &quot;نشط (ACTIVE)&quot; من لوحة الإدارة.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setAdminPreviewOverride(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-amber-600" />
              <span>معاينة الصفحة كمسؤول</span>
            </button>
            <a
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              <span>لوحة الإدارة (Admin Dashboard)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isPreviewMode = productStatus !== 'ACTIVE' && adminPreviewOverride;

  // 4. Active Product (or explicit Admin Preview of inactive product)
  return (
    <div className="min-h-screen relative">
      {/* Admin Floating Shortcut Bar (Desktop only so mobile buyers see a pure landing page) */}
      <div className="hidden md:flex bg-slate-950 text-slate-300 text-xs py-1.5 px-4 items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-white">COD Landing Builder</span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            (/p/{product.slug})
          </span>
          {productStatus !== 'ACTIVE' && (
            <span className="bg-rose-900/80 text-rose-200 border border-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
              {productStatus === 'ARCHIVED' ? 'مؤرشف (Archived)' : 'مسودة غير منشورة (Draft)'}
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
      <LandingPage product={product} utmParams={utmParams} isPreview={isPreviewMode} />
    </div>
  );
};
