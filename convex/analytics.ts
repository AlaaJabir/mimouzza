import { db } from './db';
import { AnalyticsEvent, AnalyticsEventType, Order } from './schema';

export interface DateFilterArgs {
  range?: 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'all';
  productId?: string;
}

export function computeDateBoundaries(range?: string): { since: number; until: number } {
  const now = new Date();
  const until = Date.now();

  if (range === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return { since: startOfToday, until };
  }
  if (range === 'yesterday') {
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - 1;
    return { since: startOfYesterday, until: endOfYesterday };
  }
  if (range === '7days') {
    return { since: until - 7 * 86400000, until };
  }
  if (range === '30days') {
    return { since: until - 30 * 86400000, until };
  }
  if (range === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return { since: startOfMonth, until };
  }

  // 'all'
  return { since: 0, until };
}

export const logEvent = {
  name: 'analytics:logEvent',
  mutation: (args: Omit<AnalyticsEvent, '_id'>) => {
    return db.logAnalyticsEvent(args);
  },
};

export const getFunnelMetrics = {
  name: 'analytics:getFunnelMetrics',
  query: (args?: DateFilterArgs) => {
    const { since, until } = computeDateBoundaries(args?.range);
    const events = db.getAnalyticsEvents({
      productId: args?.productId,
      since,
      until,
    });

    const orders = db.getOrders().filter((o) => {
      const matchProduct = !args?.productId || o.productId === args.productId;
      const matchTime = o.createdAt >= since && o.createdAt <= until;
      return matchProduct && matchTime;
    });

    const sessionSet = new Set<string>();
    events.forEach((e) => {
      if (e.sessionId) sessionSet.add(e.sessionId);
    });

    const visitors = sessionSet.size;
    const productViews = events.filter((e) => e.eventType === 'VIEW_CONTENT' || e.eventType === 'PAGE_VIEW').length;
    const ctaClicks = events.filter((e) => e.eventType === 'CTA_CLICK').length;
    const formViews = events.filter((e) => e.eventType === 'FORM_VIEW').length;
    const formStarts = events.filter((e) => e.eventType === 'FORM_START').length;
    const formSubmissions = events.filter((e) => e.eventType === 'FORM_SUBMIT').length;
    const whatsappClicks = events.filter((e) => e.eventType === 'WHATSAPP_CLICK').length;

    const totalOrders = orders.length;
    const confirmedOrders = orders.filter((o) =>
      ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
    ).length;
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);

    // Calculated Conversion Rates
    const ctaCtr = productViews > 0 ? (ctaClicks / productViews) * 100 : 0;
    const formStartRate = ctaClicks > 0 ? (formStarts / ctaClicks) * 100 : 0;
    const orderConversionRate = visitors > 0 ? (totalOrders / visitors) * 100 : 0;
    const confirmationRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;
    const deliveryRate = confirmedOrders > 0 ? (deliveredOrders / confirmedOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      visitors,
      productViews,
      ctaClicks,
      formViews,
      formStarts,
      formSubmissions,
      whatsappClicks,
      totalOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      ctaCtr: Math.round(ctaCtr * 10) / 10,
      formStartRate: Math.round(formStartRate * 10) / 10,
      orderConversionRate: Math.round(orderConversionRate * 10) / 10,
      confirmationRate: Math.round(confirmationRate * 10) / 10,
      deliveryRate: Math.round(deliveryRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
    };
  },
};

export const getCtaPerformance = {
  name: 'analytics:getCtaPerformance',
  query: (args?: DateFilterArgs) => {
    const { since, until } = computeDateBoundaries(args?.range);
    const events = db.getAnalyticsEvents({
      productId: args?.productId,
      since,
      until,
      eventType: 'CTA_CLICK',
    });

    const ctaCounts: Record<string, { label: string; clicks: number }> = {
      hero_cta: { label: 'Hero CTA (زر العرض الرئيسي)', clicks: 0 },
      sticky_cta: { label: 'Sticky Mobile CTA (الزر السفلي العائم)', clicks: 0 },
      mid_page_cta: { label: 'Mid-Page CTA (زر وسط الصفحة)', clicks: 0 },
      final_cta: { label: 'Final CTA (زر الطلب النهائي)', clicks: 0 },
    };

    events.forEach((e) => {
      const elId = e.metadata?.elementId || 'other_cta';
      if (!ctaCounts[elId]) {
        ctaCounts[elId] = { label: elId, clicks: 0 };
      }
      ctaCounts[elId].clicks++;
    });

    const totalClicks = events.length;

    return Object.entries(ctaCounts).map(([id, item]) => ({
      id,
      label: item.label,
      clicks: item.clicks,
      sharePercentage: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 100) : 0,
    }));
  },
};

export const getTrafficSourcePerformance = {
  name: 'analytics:getTrafficSourcePerformance',
  query: (args?: DateFilterArgs) => {
    const { since, until } = computeDateBoundaries(args?.range);
    const events = db.getAnalyticsEvents({
      productId: args?.productId,
      since,
      until,
    });

    const orders = db.getOrders().filter((o) => {
      const matchProduct = !args?.productId || o.productId === args.productId;
      const matchTime = o.createdAt >= since && o.createdAt <= until;
      return matchProduct && matchTime;
    });

    const sources: Record<
      string,
      {
        source: string;
        sessions: Set<string>;
        ctaClicks: number;
        formsStarted: number;
        ordersCount: number;
        confirmedCount: number;
        deliveredCount: number;
        revenue: number;
      }
    > = {};

    const getSourceKey = (src?: string) => {
      if (!src || !src.trim()) return 'direct';
      return src.trim().toLowerCase();
    };

    events.forEach((e) => {
      const src = getSourceKey(e.utmSource);
      if (!sources[src]) {
        sources[src] = {
          source: src,
          sessions: new Set(),
          ctaClicks: 0,
          formsStarted: 0,
          ordersCount: 0,
          confirmedCount: 0,
          deliveredCount: 0,
          revenue: 0,
        };
      }
      if (e.sessionId) sources[src].sessions.add(e.sessionId);
      if (e.eventType === 'CTA_CLICK') sources[src].ctaClicks++;
      if (e.eventType === 'FORM_START') sources[src].formsStarted++;
    });

    orders.forEach((o) => {
      const src = getSourceKey(o.utmSource);
      if (!sources[src]) {
        sources[src] = {
          source: src,
          sessions: new Set(),
          ctaClicks: 0,
          formsStarted: 0,
          ordersCount: 0,
          confirmedCount: 0,
          deliveredCount: 0,
          revenue: 0,
        };
      }
      sources[src].ordersCount++;
      if (['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
        sources[src].confirmedCount++;
      }
      if (o.status === 'DELIVERED') {
        sources[src].deliveredCount++;
      }
      if (o.status !== 'CANCELLED') {
        sources[src].revenue += o.total;
      }
    });

    return Object.values(sources).map((s) => {
      const visitors = s.sessions.size;
      const convRate = visitors > 0 ? (s.ordersCount / visitors) * 100 : 0;
      return {
        source: s.source,
        visitors,
        ctaClicks: s.ctaClicks,
        formsStarted: s.formsStarted,
        orders: s.ordersCount,
        confirmed: s.confirmedCount,
        delivered: s.deliveredCount,
        revenue: s.revenue,
        conversionRate: Math.round(convRate * 10) / 10,
      };
    }).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);
  },
};

export const getCampaignPerformance = {
  name: 'analytics:getCampaignPerformance',
  query: (args?: DateFilterArgs) => {
    const { since, until } = computeDateBoundaries(args?.range);
    const settings = db.getSettings();
    const adSpends = settings.campaignAdSpends || {};

    const events = db.getAnalyticsEvents({
      productId: args?.productId,
      since,
      until,
    });

    const orders = db.getOrders().filter((o) => {
      const matchProduct = !args?.productId || o.productId === args.productId;
      const matchTime = o.createdAt >= since && o.createdAt <= until;
      return matchProduct && matchTime;
    });

    const campaigns: Record<
      string,
      {
        campaign: string;
        source: string;
        sessions: Set<string>;
        ctaClicks: number;
        formsStarted: number;
        ordersCount: number;
        confirmedCount: number;
        deliveredCount: number;
        revenue: number;
      }
    > = {};

    const getCampKey = (c?: string) => (!c || !c.trim() ? '(none / direct)' : c.trim());

    events.forEach((e) => {
      const camp = getCampKey(e.utmCampaign);
      if (!campaigns[camp]) {
        campaigns[camp] = {
          campaign: camp,
          source: e.utmSource || 'direct',
          sessions: new Set(),
          ctaClicks: 0,
          formsStarted: 0,
          ordersCount: 0,
          confirmedCount: 0,
          deliveredCount: 0,
          revenue: 0,
        };
      }
      if (e.sessionId) campaigns[camp].sessions.add(e.sessionId);
      if (e.eventType === 'CTA_CLICK') campaigns[camp].ctaClicks++;
      if (e.eventType === 'FORM_START') campaigns[camp].formsStarted++;
    });

    orders.forEach((o) => {
      const camp = getCampKey(o.utmCampaign);
      if (!campaigns[camp]) {
        campaigns[camp] = {
          campaign: camp,
          source: o.utmSource || 'direct',
          sessions: new Set(),
          ctaClicks: 0,
          formsStarted: 0,
          ordersCount: 0,
          confirmedCount: 0,
          deliveredCount: 0,
          revenue: 0,
        };
      }
      campaigns[camp].ordersCount++;
      if (['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
        campaigns[camp].confirmedCount++;
      }
      if (o.status === 'DELIVERED') {
        campaigns[camp].deliveredCount++;
      }
      if (o.status !== 'CANCELLED') {
        campaigns[camp].revenue += o.total;
      }
    });

    return Object.values(campaigns).map((c) => {
      const visitors = c.sessions.size;
      const spend = adSpends[c.campaign] || 0;
      const roas = spend > 0 ? c.revenue / spend : 0;
      const costPerOrder = c.ordersCount > 0 && spend > 0 ? spend / c.ordersCount : 0;
      const costPerConfirmed = c.confirmedCount > 0 && spend > 0 ? spend / c.confirmedCount : 0;
      const costPerDelivered = c.deliveredCount > 0 && spend > 0 ? spend / c.deliveredCount : 0;

      return {
        campaign: c.campaign,
        source: c.source,
        visitors,
        ctaClicks: c.ctaClicks,
        formsStarted: c.formsStarted,
        orders: c.ordersCount,
        confirmed: c.confirmedCount,
        delivered: c.deliveredCount,
        revenue: c.revenue,
        adSpend: spend,
        roas: Math.round(roas * 100) / 100,
        costPerOrder: Math.round(costPerOrder),
        costPerConfirmed: Math.round(costPerConfirmed),
        costPerDelivered: Math.round(costPerDelivered),
      };
    }).sort((a, b) => b.revenue - a.revenue || b.orders - a.orders);
  },
};

export const getProductAnalyticsTable = {
  name: 'analytics:getProductAnalyticsTable',
  query: (args?: DateFilterArgs) => {
    const { since, until } = computeDateBoundaries(args?.range);
    const products = db.getProducts();
    const events = db.getAnalyticsEvents({ since, until });
    const orders = db.getOrders().filter((o) => o.createdAt >= since && o.createdAt <= until);

    return products.map((prod) => {
      const prodEvents = events.filter((e) => e.productId === prod._id);
      const prodOrders = orders.filter((o) => o.productId === prod._id);

      const sessionSet = new Set<string>();
      prodEvents.forEach((e) => {
        if (e.sessionId) sessionSet.add(e.sessionId);
      });

      const visitors = sessionSet.size;
      const productViews = prodEvents.filter((e) => e.eventType === 'VIEW_CONTENT' || e.eventType === 'PAGE_VIEW').length;
      const ctaClicks = prodEvents.filter((e) => e.eventType === 'CTA_CLICK').length;
      const formStarts = prodEvents.filter((e) => e.eventType === 'FORM_START').length;

      const totalOrders = prodOrders.length;
      const confirmed = prodOrders.filter((o) =>
        ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
      ).length;
      const delivered = prodOrders.filter((o) => o.status === 'DELIVERED').length;
      const cancelled = prodOrders.filter((o) => o.status === 'CANCELLED').length;
      const revenue = prodOrders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0);

      const conversionRate = visitors > 0 ? (totalOrders / visitors) * 100 : 0;
      const deliveryRate = confirmed > 0 ? (delivered / confirmed) * 100 : 0;

      return {
        productId: prod._id,
        name: prod.name,
        slug: prod.slug,
        image: prod.images[0] || '',
        price: prod.price,
        currency: prod.currency || 'DH',
        visitors,
        productViews,
        ctaClicks,
        formStarts,
        orders: totalOrders,
        confirmed,
        delivered,
        cancelled,
        revenue,
        conversionRate: Math.round(conversionRate * 10) / 10,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
      };
    });
  },
};

export const getRecentEvents = {
  name: 'analytics:getRecentEvents',
  query: (args?: { limit?: number }) => {
    const limit = args?.limit || 25;
    const events = db.getAnalyticsEvents();
    return events.slice(-limit).reverse();
  },
};
