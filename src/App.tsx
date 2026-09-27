import React, { useEffect } from 'react';
import { useAppRouter } from './lib/router';
import { useQuery } from './lib/convex-client';
import { api } from '../convex/api';
import { initMarketingPixels, DEFAULT_META_PIXEL_ID } from './lib/tracking';
import { PublicProductPage } from './pages/PublicProductPage';
import { FrontpageSignIn } from './pages/FrontpageSignIn';
import { AdminLayout } from './components/admin/AdminLayout';
import { useAdminAuth } from './lib/auth';

export function App() {
  const { route, goTo } = useAppRouter();
  const { isAuthenticated } = useAdminAuth();
  const settings = useQuery(api.settings.get);

  useEffect(() => {
    const metaPixelId = settings?.metaPixelId?.trim() || DEFAULT_META_PIXEL_ID;
    initMarketingPixels({
      metaPixelId,
      enableMeta: settings?.enableMetaPixel ?? true,
      tiktokPixelId: settings?.tiktokPixelId,
      enableTikTok: Boolean(settings?.enableTikTokPixel && settings?.tiktokPixelId),
      gaId: settings?.googleAnalyticsId,
      enableGA: Boolean(settings?.enableGoogleAnalytics && settings?.googleAnalyticsId),
    });
  }, [
    route.type,
    route.slug,
    route.adminSection,
    settings?.metaPixelId,
    settings?.enableMetaPixel,
    settings?.tiktokPixelId,
    settings?.enableTikTokPixel,
    settings?.googleAnalyticsId,
    settings?.enableGoogleAnalytics,
  ]);

  if (route.type === 'public-product' && route.slug) {
    return (
      <PublicProductPage
        slug={route.slug}
        utmParams={route.utmParams}
        onBackToAdmin={() => goTo('/admin')}
      />
    );
  }

  if (route.type === 'home' || !isAuthenticated) {
    return (
      <FrontpageSignIn
        onSuccessLogin={() => {
          const target =
            route.type === 'admin' && route.path.startsWith('/admin')
              ? route.path
              : '/admin';
          goTo(target);
        }}
        onOpenProduct={(slug) => goTo(`/p/${slug}`)}
      />
    );
  }

  return (
    <AdminLayout
      initialSection={route.adminSection}
      initialProductId={route.productId}
      initialIsNew={route.isNew}
      onNavigateUrl={goTo}
    />
  );
}

export default App;
