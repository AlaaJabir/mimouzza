import { db } from './db';
import { AnalyticsEvent, Order, OrderStatusHistory } from './schema';

export const BUSINESS_TIMEZONE = 'Africa/Casablanca';

export interface DateFilterArgs {
  range?: 'today' | 'yesterday' | '7days' | '30days' | 'month' | 'all';
  productId?: string;
}

interface CasablancaDateParts {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  hour: number; // 0..23
  minute: number;
  second: number;
}

const casablancaFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function getCasablancaParts(ms: number): CasablancaDateParts {
  const parts = casablancaFormatter.formatToParts(new Date(ms));
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      map[p.type] = parseInt(p.value, 10);
    }
  }
  return {
    year: map.year || 1970,
    month: map.month || 1,
    day: map.day || 1,
    hour: map.hour === 24 ? 0 : map.hour || 0,
    minute: map.minute || 0,
    second: map.second || 0,
  };
}

/**
 * Computes the exact UTC epoch millisecond for 00:00:00.000 in Africa/Casablanca
 * on the given (year, month [1..12], day).
 * Handles month/year rollovers (e.g. day <= 0) and Morocco DST transitions accurately.
 */
export function getCasablancaStartOfDay(year: number, month: number, day: number): number {
  const targetUtcMidnight = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  // First pass offset calculation
  const p1 = getCasablancaParts(targetUtcMidnight);
  const asUtc1 = Date.UTC(p1.year, p1.month - 1, p1.day, p1.hour, p1.minute, p1.second, 0);
  const offset1 = asUtc1 - targetUtcMidnight;
  const candidate = targetUtcMidnight - offset1;

  // Second pass verification (handles DST transition boundary)
  const p2 = getCasablancaParts(candidate);
  const asUtc2 = Date.UTC(p2.year, p2.month - 1, p2.day, p2.hour, p2.minute, p2.second, 0);
  const diff2 = asUtc2 - targetUtcMidnight;

  return candidate - diff2;
}

export function formatCasablancaDateKey(ms: number): string {
  const p = getCasablancaParts(ms);
  const yyyy = String(p.year);
  const mm = String(p.month).padStart(2, '0');
  const dd = String(p.day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Computes authoritative [since, until] date boundaries in Africa/Casablanca timezone.
 */
export function computeDateBoundaries(
  range?: string,
  nowMs: number = Date.now()
): { since: number; until: number; timezone: string } {
  const nowParts = getCasablancaParts(nowMs);
  const { year, month, day } = nowParts;

  if (range === 'today') {
    const startOfToday = getCasablancaStartOfDay(year, month, day);
    return { since: startOfToday, until: nowMs, timezone: BUSINESS_TIMEZONE };
  }

  if (range === 'yesterday') {
    const startOfYesterday = getCasablancaStartOfDay(year, month, day - 1);
    const startOfToday = getCasablancaStartOfDay(year, month, day);
    return {
      since: startOfYesterday,
      until: startOfToday - 1, // 23:59:59.999 of yesterday in Africa/Casablanca
      timezone: BUSINESS_TIMEZONE,
    };
  }

  if (range === '7days') {
    // 7 calendar days including today in Africa/Casablanca (today + previous 6 full days)
    const startOf7Days = getCasablancaStartOfDay(year, month, day - 6);
    return { since: startOf7Days, until: nowMs, timezone: BUSINESS_TIMEZONE };
  }

  if (range === '30days') {
    // 30 calendar days including today in Africa/Casablanca (today + previous 29 full days)
    const startOf30Days = getCasablancaStartOfDay(year, month, day - 29);
    return { since: startOf30Days, until: nowMs, timezone: BUSINESS_TIMEZONE };
  }

  if (range === 'month') {
    // 1st of current month 00:00:00.000 in Africa/Casablanca through current time
    const startOfMonth = getCasablancaStartOfDay(year, month, 1);
    return { since: startOfMonth, until: nowMs, timezone: BUSINESS_TIMEZONE };
  }

  // 'all'
  return { since: 0, until: nowMs, timezone: BUSINESS_TIMEZONE };
}

function round1(val: number): number {
  if (!Number.isFinite(val) || isNaN(val)) return 0;
  return Math.round(val * 10) / 10;
}

export const logEvent = {
  name: 'analytics:logEvent',
  mutation: (args: Omit<AnalyticsEvent, '_id' | 'createdAt'> & { createdAt?: number }) => {
    return db.logAnalyticsEvent(args);
  },
};

export const getFunnelMetrics = {
  name: 'analytics:getFunnelMetrics',
  query: (args?: DateFilterArgs) => {
    const { since, until, timezone } = computeDateBoundaries(args?.range);
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

    // Separate Unique Visitors (visitorId) from Sessions (sessionId)
    const visitorSet = new Set<string>();
    const sessionSet = new Set<string>();

    events.forEach((e) => {
      if (e.visitorId) visitorSet.add(e.visitorId);
      else if (e.sessionId) visitorSet.add(e.sessionId);

      if (e.sessionId) sessionSet.add(e.sessionId);
    });

    orders.forEach((o) => {
      if (o.visitorId) visitorSet.add(o.visitorId);
      else if (o.sessionId) visitorSet.add(o.sessionId);

      if (o.sessionId) sessionSet.add(o.sessionId);
    });

    const visitors = visitorSet.size;
    const sessions = sessionSet.size;

    const pageViews = events.filter((e) => e.eventType === 'PAGE_VIEW').length;
    const rawProductViews = events.filter(
      (e) => e.eventType === 'PRODUCT_VIEW' || e.eventType === 'VIEW_CONTENT'
    ).length;
    const productViews = rawProductViews > 0 ? rawProductViews : pageViews;

    const ctaClicks = events.filter((e) => e.eventType === 'CTA_CLICK').length;
    const formViews = events.filter((e) => e.eventType === 'FORM_VIEW').length;
    const formStarts = events.filter((e) => e.eventType === 'FORM_START').length;
    const formSubmissions = events.filter((e) => e.eventType === 'FORM_SUBMIT').length;
    const whatsappClicks = events.filter((e) => e.eventType === 'WHATSAPP_CLICK').length;

    const totalOrders = orders.length;
    const newOrders = orders.filter((o) => o.status === 'NEW' || o.status === 'PENDING').length;
    const confirmedOrders = orders.filter((o) =>
      ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
    ).length;
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const failedOrders = orders.filter((o) => o.status === 'FAILED').length;

    // Revenue calculations strictly from persisted orders
    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const confirmedRevenue = orders
      .filter((o) => ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const deliveredRevenue = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // Calculated Conversion Rates (safe against division by zero)
    const viewBase = productViews > 0 ? productViews : pageViews;
    const ctaCtr = viewBase > 0 ? (ctaClicks / viewBase) * 100 : 0;
    const formStartRate =
      ctaClicks > 0
        ? (formStarts / ctaClicks) * 100
        : visitors > 0
          ? (formStarts / visitors) * 100
          : 0;
    const formToOrderRate = formStarts > 0 ? (totalOrders / formStarts) * 100 : 0;
    const orderConversionRate = visitors > 0 ? (totalOrders / visitors) * 100 : 0;
    const sessionConversionRate = sessions > 0 ? (totalOrders / sessions) * 100 : 0;
    const confirmationRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;
    const deliveryRate = confirmedOrders > 0 ? (deliveredOrders / confirmedOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    return {
      visitors,
      sessions,
      pageViews,
      productViews,
      ctaClicks,
      formViews,
      formStarts,
      formSubmissions,
      whatsappClicks,
      totalOrders,
      newOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      failedOrders,
      totalRevenue,
      confirmedRevenue,
      deliveredRevenue,
      ctaCtr: round1(ctaCtr),
      formStartRate: round1(formStartRate),
      formToOrderRate: round1(formToOrderRate),
      orderConversionRate: round1(orderConversionRate),
      sessionConversionRate: round1(sessionConversionRate),
      confirmationRate: round1(confirmationRate),
      deliveryRate: round1(deliveryRate),
      cancellationRate: round1(cancellationRate),
      since,
      until,
      timezone,
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
      final_cta: { label: 'Final CTA (زر تأكيد الطلب)', clicks: 0 },
    };

    events.forEach((e) => {
      const elId = e.ctaId || e.metadata?.ctaId || e.metadata?.elementId || 'other_cta';
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
      sharePercentage: totalClicks > 0 ? round1((item.clicks / totalClicks) * 100) : 0,
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
        visitors: Set<string>;
        sessions: Set<string>;
        pageViews: number;
        ctaClicks: number;
        formsStarted: number;
        ordersCount: number;
        confirmedCount: number;
        deliveredCount: number;
        cancelledCount: number;
        revenue: number;
        deliveredRevenue: number;
      }
    > = {};

    const getSourceKey = (item: {
      utmSource?: string;
      fbclid?: string;
      pageUrl?: string;
      landingPage?: string;
      referrer?: string;
    }) => {
      if (item.utmSource && item.utmSource.trim()) {
        return item.utmSource.trim().toLowerCase();
      }
      const url = (item.pageUrl || item.landingPage || '').toLowerCase();
      const ref = (item.referrer || '').toLowerCase();
      if (item.fbclid || url.includes('fbclid=')) {
        return ref.includes('instagram') ? 'instagram' : 'facebook';
      }
      if (url.includes('ttclid=')) return 'tiktok';
      if (url.includes('gclid=')) return 'google';
      if (ref.includes('instagram.com') || ref.includes('ig.me')) return 'instagram';
      if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fb.me')) {
        return 'facebook';
      }
      if (ref.includes('tiktok.com')) return 'tiktok';
      if (ref.includes('google.')) return 'google';
      return 'direct';
    };

    const ensureSource = (src: string) => {
      if (!sources[src]) {
        sources[src] = {
          source: src,
          visitors: new Set(),
          sessions: new Set(),
          pageViews: 0,
          ctaClicks: 0,
          formsStarted: 0,
          ordersCount: 0,
          confirmedCount: 0,
          deliveredCount: 0,
          cancelledCount: 0,
          revenue: 0,
          deliveredRevenue: 0,
        };
      }
      return sources[src];
    };

    events.forEach((e) => {
      const src = getSourceKey(e);
      const bucket = ensureSource(src);
      if (e.visitorId) bucket.visitors.add(e.visitorId);
      else if (e.sessionId) bucket.visitors.add(e.sessionId);

      if (e.sessionId) bucket.sessions.add(e.sessionId);
      if (e.eventType === 'PAGE_VIEW') bucket.pageViews++;
      if (e.eventType === 'CTA_CLICK') bucket.ctaClicks++;
      if (e.eventType === 'FORM_START') bucket.formsStarted++;
    });

    orders.forEach((o) => {
      const src = getSourceKey(o);
      const bucket = ensureSource(src);
      if (o.visitorId) bucket.visitors.add(o.visitorId);
      else if (o.sessionId) bucket.visitors.add(o.sessionId);
      if (o.sessionId) bucket.sessions.add(o.sessionId);

      bucket.ordersCount++;
      if (['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
        bucket.confirmedCount++;
      }
      if (o.status === 'DELIVERED') {
        bucket.deliveredCount++;
        bucket.deliveredRevenue += Number(o.total) || 0;
      }
      if (o.status === 'CANCELLED') {
        bucket.cancelledCount++;
      }
      if (o.status !== 'CANCELLED' && o.status !== 'FAILED') {
        bucket.revenue += Number(o.total) || 0;
      }
    });

    return Object.values(sources)
      .map((s) => {
        const uniqueVisitors = s.visitors.size;
        const sessionsCount = s.sessions.size;
        const convRate = uniqueVisitors > 0 ? (s.ordersCount / uniqueVisitors) * 100 : 0;
        return {
          source: s.source,
          visitors: uniqueVisitors,
          sessions: sessionsCount,
          pageViews: s.pageViews,
          ctaClicks: s.ctaClicks,
          formsStarted: s.formsStarted,
          orders: s.ordersCount,
          confirmed: s.confirmedCount,
          delivered: s.deliveredCount,
          cancelled: s.cancelledCount,
          revenue: s.revenue,
          deliveredRevenue: s.deliveredRevenue,
          conversionRate: round1(convRate),
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || b.visitors - a.visitors);
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
        medium: string;
        visitors: Set<string>;
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

    const ensureCampaign = (camp: string, source?: string, medium?: string) => {
      if (!campaigns[camp]) {
        campaigns[camp] = {
          campaign: camp,
          source: source?.trim() || 'direct',
          medium: medium?.trim() || '',
          visitors: new Set(),
          sessions: new Set(),
          ctaClicks: 0,
          formsStarted: 0,
          ordersCount: 0,
          confirmedCount: 0,
          deliveredCount: 0,
          revenue: 0,
        };
      }
      return campaigns[camp];
    };

    events.forEach((e) => {
      const camp = getCampKey(e.utmCampaign);
      const bucket = ensureCampaign(camp, e.utmSource, e.utmMedium);
      if (e.visitorId) bucket.visitors.add(e.visitorId);
      else if (e.sessionId) bucket.visitors.add(e.sessionId);
      if (e.sessionId) bucket.sessions.add(e.sessionId);

      if (e.eventType === 'CTA_CLICK') bucket.ctaClicks++;
      if (e.eventType === 'FORM_START') bucket.formsStarted++;
    });

    orders.forEach((o) => {
      const camp = getCampKey(o.utmCampaign);
      const bucket = ensureCampaign(camp, o.utmSource, o.utmMedium);
      if (o.visitorId) bucket.visitors.add(o.visitorId);
      else if (o.sessionId) bucket.visitors.add(o.sessionId);
      if (o.sessionId) bucket.sessions.add(o.sessionId);

      bucket.ordersCount++;
      if (['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
        bucket.confirmedCount++;
      }
      if (o.status === 'DELIVERED') {
        bucket.deliveredCount++;
      }
      if (o.status !== 'CANCELLED' && o.status !== 'FAILED') {
        bucket.revenue += Number(o.total) || 0;
      }
    });

    return Object.values(campaigns)
      .map((c) => {
        const visitors = c.visitors.size;
        const sessions = c.sessions.size;
        const spend = Number(adSpends[c.campaign]) || 0;
        const roas = spend > 0 ? c.revenue / spend : 0;
        const costPerOrder = c.ordersCount > 0 && spend > 0 ? spend / c.ordersCount : 0;
        const costPerConfirmed = c.confirmedCount > 0 && spend > 0 ? spend / c.confirmedCount : 0;
        const costPerDelivered = c.deliveredCount > 0 && spend > 0 ? spend / c.deliveredCount : 0;

        return {
          campaign: c.campaign,
          source: c.source,
          medium: c.medium,
          visitors,
          sessions,
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
      })
      .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || b.visitors - a.visitors);
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
      const slugNorm = (prod.slug || '').trim().toLowerCase();
      const matchesProd = (item: { productId?: string; pageUrl?: string; landingPage?: string }) => {
        if (item.productId === prod._id) return true;
        if (slugNorm && item.productId && item.productId.trim().toLowerCase() === slugNorm) {
          return true;
        }
        const pathPart = (item.pageUrl || item.landingPage || '').split('?')[0].trim().toLowerCase();
        if (slugNorm && pathPart === `/p/${slugNorm}`) {
          return true;
        }
        return false;
      };

      const prodEvents = events.filter((e) => matchesProd(e));
      const prodOrders = orders.filter((o) => matchesProd(o));

      const visitorSet = new Set<string>();
      const sessionSet = new Set<string>();
      prodEvents.forEach((e) => {
        if (e.visitorId) visitorSet.add(e.visitorId);
        else if (e.sessionId) visitorSet.add(e.sessionId);
        if (e.sessionId) sessionSet.add(e.sessionId);
      });
      prodOrders.forEach((o) => {
        if (o.visitorId) visitorSet.add(o.visitorId);
        else if (o.sessionId) visitorSet.add(o.sessionId);
        if (o.sessionId) sessionSet.add(o.sessionId);
      });

      const visitors = visitorSet.size;
      const sessions = sessionSet.size;
      const pageViews = prodEvents.filter((e) => e.eventType === 'PAGE_VIEW').length;
      const rawProductViews = prodEvents.filter(
        (e) => e.eventType === 'PRODUCT_VIEW' || e.eventType === 'VIEW_CONTENT'
      ).length;
      const productViews = rawProductViews > 0 ? rawProductViews : pageViews;
      const ctaClicks = prodEvents.filter((e) => e.eventType === 'CTA_CLICK').length;
      const formStarts = prodEvents.filter((e) => e.eventType === 'FORM_START').length;

      const totalOrders = prodOrders.length;
      const confirmed = prodOrders.filter((o) =>
        ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
      ).length;
      const delivered = prodOrders.filter((o) => o.status === 'DELIVERED').length;
      const cancelled = prodOrders.filter((o) => o.status === 'CANCELLED').length;
      const revenue = prodOrders
        .filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED')
        .reduce((s, o) => s + (Number(o.total) || 0), 0);

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
        sessions,
        pageViews,
        productViews,
        ctaClicks,
        formStarts,
        orders: totalOrders,
        confirmed,
        delivered,
        cancelled,
        revenue,
        conversionRate: round1(conversionRate),
        deliveryRate: round1(deliveryRate),
      };
    });
  },
};

export const getDailyTimeSeries = {
  name: 'analytics:getDailyTimeSeries',
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

    const daysMap: Record<
      string,
      {
        date: string;
        visitors: Set<string>;
        sessions: Set<string>;
        pageViews: number;
        ctaClicks: number;
        formStarts: number;
        orders: number;
        revenue: number;
      }
    > = {};

    const ensureDay = (dateKey: string) => {
      if (!daysMap[dateKey]) {
        daysMap[dateKey] = {
          date: dateKey,
          visitors: new Set(),
          sessions: new Set(),
          pageViews: 0,
          ctaClicks: 0,
          formStarts: 0,
          orders: 0,
          revenue: 0,
        };
      }
      return daysMap[dateKey];
    };

    events.forEach((e) => {
      const key = formatCasablancaDateKey(e.timestamp);
      const bucket = ensureDay(key);
      if (e.visitorId) bucket.visitors.add(e.visitorId);
      else if (e.sessionId) bucket.visitors.add(e.sessionId);
      if (e.sessionId) bucket.sessions.add(e.sessionId);

      if (e.eventType === 'PAGE_VIEW') bucket.pageViews++;
      if (e.eventType === 'CTA_CLICK') bucket.ctaClicks++;
      if (e.eventType === 'FORM_START') bucket.formStarts++;
    });

    orders.forEach((o) => {
      const key = formatCasablancaDateKey(o.createdAt);
      const bucket = ensureDay(key);
      if (o.visitorId) bucket.visitors.add(o.visitorId);
      else if (o.sessionId) bucket.visitors.add(o.sessionId);
      if (o.sessionId) bucket.sessions.add(o.sessionId);

      bucket.orders++;
      if (o.status !== 'CANCELLED' && o.status !== 'FAILED') {
        bucket.revenue += Number(o.total) || 0;
      }
    });

    return Object.values(daysMap)
      .map((d) => ({
        date: d.date,
        visitors: d.visitors.size,
        sessions: d.sessions.size,
        pageViews: d.pageViews,
        ctaClicks: d.ctaClicks,
        formStarts: d.formStarts,
        orders: d.orders,
        revenue: d.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};

export const getOrderStatusHistory = {
  name: 'analytics:getOrderStatusHistory',
  query: (args?: { orderId?: string; limit?: number }): OrderStatusHistory[] => {
    const list = db.getOrderStatusHistory(args?.orderId);
    const limit = args?.limit || 50;
    return list.slice(0, limit);
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
