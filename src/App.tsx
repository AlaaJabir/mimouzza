/**
 * COD Landing Builder
 * Multi-product Cash-On-Delivery Landing Page Builder with Reactive Convex Backend
 */

import React from 'react';
import { useAppRouter } from './lib/router';
import { AdminLayout } from './components/admin/AdminLayout';
import { PublicProductPage } from './pages/PublicProductPage';

export default function App() {
  const { route, goTo } = useAppRouter();

  // Public Product Route: /p/:slug
  if (route.type === 'public-product' && route.slug) {
    return (
      <PublicProductPage
        slug={route.slug}
        utmParams={route.utmParams}
        onBackToAdmin={() => goTo('/admin')}
      />
    );
  }

  // Admin Dashboard and Management
  return (
    <AdminLayout
      initialSection={route.adminSection}
      initialProductId={route.productId}
      initialIsNew={route.isNew}
      onNavigateUrl={(path) => goTo(path)}
    />
  );
}
