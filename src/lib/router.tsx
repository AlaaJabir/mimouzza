import { useState, useEffect, useCallback } from 'react';

export interface RouteState {
  path: string;
  type: 'admin' | 'public-product' | 'home';
  adminSection: 'dashboard' | 'analytics' | 'products' | 'templates' | 'orders' | 'diagnostics' | 'settings';
  productId?: string;
  isNew?: boolean;
  slug?: string;
  utmParams: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;
  };
}

export function parseCurrentRoute(): RouteState {
  if (typeof window === 'undefined') {
    return {
      path: '/admin',
      type: 'admin',
      adminSection: 'dashboard',
      utmParams: { utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '', utmTerm: '' },
    };
  }

  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);

  const utmParams = {
    utmSource: searchParams.get('utm_source') || '',
    utmMedium: searchParams.get('utm_medium') || '',
    utmCampaign: searchParams.get('utm_campaign') || '',
    utmContent: searchParams.get('utm_content') || '',
    utmTerm: searchParams.get('utm_term') || '',
  };

  // Check public product URL: /p/[slug]
  const pMatch = path.match(/^\/p\/([^/]+)/);
  if (pMatch) {
    return {
      path,
      type: 'public-product',
      adminSection: 'dashboard',
      slug: pMatch[1],
      utmParams,
    };
  }

  // Admin routes
  if (path.startsWith('/admin')) {
    const parts = path.split('/').filter(Boolean); // ['admin', ...]
    const section = parts[1] || 'dashboard';

    if (section === 'products') {
      const sub = parts[2];
      if (sub === 'new') {
        return { path, type: 'admin', adminSection: 'products', isNew: true, utmParams };
      }
      if (sub === 'edit' && parts[3]) {
        return { path, type: 'admin', adminSection: 'products', productId: parts[3], utmParams };
      }
      return { path, type: 'admin', adminSection: 'products', utmParams };
    }

    if (['dashboard', 'analytics', 'templates', 'orders', 'diagnostics', 'settings'].includes(section)) {
      return {
        path,
        type: 'admin',
        adminSection: section as RouteState['adminSection'],
        utmParams,
      };
    }

    return { path, type: 'admin', adminSection: 'dashboard', utmParams };
  }

  // Default root '/' -> redirect to admin dashboard, or show admin landing
  return {
    path: '/',
    type: 'admin',
    adminSection: 'dashboard',
    utmParams,
  };
}

export function navigate(to: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname + window.location.search !== to) {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new Event('app_navigation'));
  }
}

export function useAppRouter() {
  const [route, setRoute] = useState<RouteState>(() => parseCurrentRoute());

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseCurrentRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('app_navigation', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('app_navigation', handleLocationChange);
    };
  }, []);

  const goTo = useCallback((to: string) => {
    navigate(to);
  }, []);

  return { route, goTo };
}
