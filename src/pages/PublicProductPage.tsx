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
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-[#111111]">جاري تحميل صفحة المنتج...</p>
        </div>
      </div>
    );
  }

  // 2. Product does NOT exist in database
  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200/80 p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 bg-[#FFF3EB] text-[#FF6B00] rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#111111]">المنتج غير موجود أو تم حذفه</h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            الرابط الذي تحاول الوصول إليه غير متوفر حالياً. تأكد من صحة الرابط أو تواصل معنا.
          </p>
          <div className="pt-2">
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
            >
              <span>Admin Dashboard</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Product EXISTS in database, but status is DRAFT or ARCHIVED (not publicly active)
  if (productStatus !== 'ACTIVE' && !adminPreviewOverride) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200/80 p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 bg-[#F8F8F6] text-[#111111] rounded-full flex items-center justify-center mx-auto">
            <EyeOff className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#FFF3EB] text-[#FF6B00] border border-[#FF6B00]/30">
            <span>
              {productStatus === 'ARCHIVED'
                ? 'حالة المنتج: مؤرشف (ARCHIVED)'
                : 'حالة المنتج: مسودة غير منشورة (DRAFT)'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#111111]">المنتج غير متاح حالياً</h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            هذا المنتج ({product.name}) محفوظ في قاعدة البيانات ولكنه غير منشور للعامة حالياً. لتلقي الطلبات من الزوار، يرجى تفعيل حالة المنتج إلى &quot;نشط (ACTIVE)&quot; من لوحة الإدارة.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => setAdminPreviewOverride(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border border-neutral-200 bg-white text-[#111111] font-bold text-xs hover:bg-[#F8F8F6] transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#FF6B00]" />
              <span>معاينة الصفحة كمسؤول</span>
            </button>
            <a
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
            >
              <span>Admin Dashboard</span>
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
      <div className="hidden md:flex bg-[#111111] text-neutral-300 text-xs py-2 px-5 items-center justify-between border-b border-neutral-800 select-none" dir="ltr">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#FF6B00]"></span>
          <span className="font-extrabold text-white">
            Nestora<span className="text-[#FF6B00]">COD</span>
          </span>
          <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
            (/p/{product.slug})
          </span>
          {productStatus !== 'ACTIVE' && (
            <span className="bg-rose-900/80 text-rose-200 border border-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              {productStatus === 'ARCHIVED' ? 'Archived' : 'Draft Preview'}
            </span>
          )}
        </div>

        <a
          href="/admin"
          className="text-[#FF6B00] hover:text-[#ff852e] font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <span>Admin Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Render Template */}
      <LandingPage product={product} utmParams={utmParams} isPreview={isPreviewMode} />
    </div>
  );
};
