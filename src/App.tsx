import React from 'react';
import { useAppRouter } from './lib/router';
import { PublicProductPage } from './pages/PublicProductPage';
import { AdminLayout } from './components/admin/AdminLayout';

export function App() {
  const { route, goTo } = useAppRouter();

  if (route.type === 'public-product' && route.slug) {
    return (
      <PublicProductPage
        slug={route.slug}
        utmParams={route.utmParams}
        onBackToAdmin={() => goTo('/admin')}
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
