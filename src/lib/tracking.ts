/**
 * Production Tracking & Attribution Engine
 * Handles anonymous Session tracking, First/Last touch attribution,
 * Convex analytics logging, dynamic Meta Pixel, TikTok Pixel, and GA injection.
 */

import { AnalyticsEventType } from '../../convex/schema';
import { db } from '../../convex/db';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

// Session & Attribution Storage Keys
const SESSION_KEY = 'cod_analytics_session_id';
const FIRST_TOUCH_KEY = 'cod_first_touch_utm';
const LAST_TOUCH_KEY = 'cod_last_touch_utm';
const LOCAL_DETECTED_EVENTS_KEY = 'cod_local_diagnostics_events';

export interface UtmAttribution {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
}

/**
 * Returns or creates a persistent anonymous session ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'sess_server_unknown';

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // Generate an anonymous ID: sess_ + timestamp + random string
    sessionId = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    try {
      sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch {}
  }
  return sessionId;
}

/**
 * Captures and persists first-touch and last-touch UTM parameters
 */
export function captureAndStoreUtm(): { firstTouch: UtmAttribution; lastTouch: UtmAttribution } {
  const empty: UtmAttribution = {
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: '',
  };

  if (typeof window === 'undefined') return { firstTouch: empty, lastTouch: empty };

  const params = new URLSearchParams(window.location.search);
  const currentUtm: UtmAttribution = {
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmContent: params.get('utm_content') || '',
    utmTerm: params.get('utm_term') || '',
  };

  const hasCurrentUtm = Object.values(currentUtm).some((val) => Boolean(val));

  // First Touch
  let firstTouch = empty;
  try {
    const storedFirst = localStorage.getItem(FIRST_TOUCH_KEY);
    if (!storedFirst && hasCurrentUtm) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(currentUtm));
      firstTouch = currentUtm;
    } else if (storedFirst) {
      firstTouch = JSON.parse(storedFirst);
    }
  } catch {}

  // Last Touch
  let lastTouch = empty;
  try {
    if (hasCurrentUtm) {
      localStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(currentUtm));
      lastTouch = currentUtm;
    } else {
      const storedLast = localStorage.getItem(LAST_TOUCH_KEY);
      if (storedLast) lastTouch = JSON.parse(storedLast);
      else if (firstTouch.utmSource) lastTouch = firstTouch;
    }
  } catch {}

  return { firstTouch, lastTouch };
}

/**
 * Diagnostics local event recorder
 */
export interface DiagnosticEventRecord {
  id: string;
  eventType: string;
  target: 'Internal' | 'Meta' | 'TikTok' | 'Google';
  timestamp: number;
  metadata?: any;
}

export function recordDiagnosticEvent(event: Omit<DiagnosticEventRecord, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return;
  try {
    const list: DiagnosticEventRecord[] = JSON.parse(
      sessionStorage.getItem(LOCAL_DETECTED_EVENTS_KEY) || '[]'
    );
    list.unshift({
      ...event,
      id: 'diag_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    });
    // keep latest 50
    sessionStorage.setItem(LOCAL_DETECTED_EVENTS_KEY, JSON.stringify(list.slice(0, 50)));
    window.dispatchEvent(new Event('cod_diagnostics_updated'));
  } catch {}
}

export function getDiagnosticEvents(): DiagnosticEventRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(sessionStorage.getItem(LOCAL_DETECTED_EVENTS_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Dynamic Pixel Injections
 */
let metaPixelInjected = false;
let tiktokPixelInjected = false;
let gaInjected = false;

export function initMarketingPixels(options: {
  metaPixelId?: string;
  enableMeta?: boolean;
  tiktokPixelId?: string;
  enableTikTok?: boolean;
  gaId?: string;
  enableGA?: boolean;
}) {
  if (typeof window === 'undefined') return;

  // 1. Meta Pixel
  if (options.enableMeta && options.metaPixelId && !metaPixelInjected) {
    try {
      /* eslint-disable */
      (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */

      window.fbq('init', options.metaPixelId);
      metaPixelInjected = true;
      recordDiagnosticEvent({
        eventType: 'Pixel_Init',
        target: 'Meta',
        metadata: { pixelId: options.metaPixelId },
      });
    } catch (e) {
      console.warn('Meta pixel script initialization failed:', e);
    }
  }

  // 2. TikTok Pixel
  if (options.enableTikTok && options.tiktokPixelId && !tiktokPixelInjected) {
    try {
      /* eslint-disable */
      (function (w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t;
        var ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie',
        ];
        ttq.setAndDefer = function (t: any, e: any) {
          t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (t: any) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
            ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function (e: any, n: any) {
          var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          (ttq._i = ttq._i || {}),
            (ttq._i[e] = []),
            (ttq._i[e]._u = i),
            (ttq._t = ttq._t || {}),
            (ttq._t[e] = +new Date()),
            (ttq._o = ttq._o || {}),
            (ttq._o[e] = n || {});
          var o = d.createElement('script');
          (o.type = 'text/javascript'), (o.async = !0), (o.src = i + '?sdkid=' + e + '&lib=' + t);
          var a = d.getElementsByTagName('script')[0];
          a.parentNode.insertBefore(o, a);
        };
      })(window, document, 'ttq');
      /* eslint-enable */

      window.ttq.load(options.tiktokPixelId);
      tiktokPixelInjected = true;
      recordDiagnosticEvent({
        eventType: 'Pixel_Init',
        target: 'TikTok',
        metadata: { pixelId: options.tiktokPixelId },
      });
    } catch (e) {
      console.warn('TikTok pixel script initialization failed:', e);
    }
  }
}

/**
 * Universal Event Tracker:
 * Records to Convex DB and fires Meta/TikTok/GA events with server-side ready eventId deduplication.
 */
export function trackEvent(params: {
  eventType: AnalyticsEventType;
  productId: string;
  metadata?: Record<string, any>;
  customEventId?: string;
  productName?: string;
  price?: number;
  currency?: string;
}): string {
  if (typeof window === 'undefined') return '';

  const sessionId = getSessionId();
  const { lastTouch } = captureAndStoreUtm();
  const eventId = params.customEventId || 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

  // 1. Log to Convex database
  try {
    db.logAnalyticsEvent({
      eventId,
      eventType: params.eventType,
      productId: params.productId,
      sessionId,
      timestamp: Date.now(),
      pageUrl: window.location.pathname + window.location.search,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
      utmSource: lastTouch.utmSource || '',
      utmMedium: lastTouch.utmMedium || '',
      utmCampaign: lastTouch.utmCampaign || '',
      utmContent: lastTouch.utmContent || '',
      utmTerm: lastTouch.utmTerm || '',
      metadata: params.metadata || {},
    });

    recordDiagnosticEvent({
      eventType: params.eventType,
      target: 'Internal',
      metadata: { productId: params.productId, ...params.metadata },
    });
  } catch (err) {
    console.error('Error logging analytics event to Convex:', err);
  }

  // 2. Dispatch to Meta Pixel (fbq)
  if (window.fbq) {
    try {
      const fbEventId = { eventID: eventId };
      switch (params.eventType) {
        case 'PAGE_VIEW':
          window.fbq('track', 'PageView', {}, fbEventId);
          recordDiagnosticEvent({ eventType: 'PageView', target: 'Meta' });
          break;
        case 'VIEW_CONTENT':
          window.fbq(
            'track',
            'ViewContent',
            {
              content_name: params.productName || params.productId,
              content_ids: [params.productId],
              content_type: 'product',
              value: params.price || 0,
              currency: params.currency || 'MAD',
            },
            fbEventId
          );
          recordDiagnosticEvent({ eventType: 'ViewContent', target: 'Meta' });
          break;
        case 'CTA_CLICK':
          window.fbq('trackCustom', 'CTA_Click', { elementId: params.metadata?.elementId }, fbEventId);
          recordDiagnosticEvent({ eventType: 'CTA_Click', target: 'Meta' });
          break;
        case 'FORM_START':
          window.fbq('track', 'InitiateCheckout', {}, fbEventId);
          recordDiagnosticEvent({ eventType: 'InitiateCheckout', target: 'Meta' });
          break;
        case 'FORM_SUBMIT':
        case 'ORDER_SUCCESS':
          window.fbq(
            'track',
            'Lead',
            {
              value: params.price || 0,
              currency: params.currency || 'MAD',
            },
            fbEventId
          );
          window.fbq(
            'track',
            'Purchase',
            {
              value: params.price || 0,
              currency: params.currency || 'MAD',
            },
            fbEventId
          );
          recordDiagnosticEvent({ eventType: 'Lead & Purchase', target: 'Meta' });
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn('Meta pixel track error:', e);
    }
  }

  // 3. Dispatch to TikTok Pixel (ttq)
  if (window.ttq) {
    try {
      const ttEventId = { event_id: eventId };
      switch (params.eventType) {
        case 'PAGE_VIEW':
          window.ttq.page();
          recordDiagnosticEvent({ eventType: 'PageView', target: 'TikTok' });
          break;
        case 'VIEW_CONTENT':
          window.ttq.track(
            'ViewContent',
            {
              content_id: params.productId,
              content_type: 'product',
              content_name: params.productName || params.productId,
              price: params.price || 0,
              currency: params.currency || 'MAD',
            },
            ttEventId
          );
          recordDiagnosticEvent({ eventType: 'ViewContent', target: 'TikTok' });
          break;
        case 'CTA_CLICK':
          window.ttq.track('ClickButton', { button_name: params.metadata?.elementId }, ttEventId);
          recordDiagnosticEvent({ eventType: 'ClickButton', target: 'TikTok' });
          break;
        case 'FORM_START':
          window.ttq.track('InitiateCheckout', {}, ttEventId);
          recordDiagnosticEvent({ eventType: 'InitiateCheckout', target: 'TikTok' });
          break;
        case 'FORM_SUBMIT':
          window.ttq.track('SubmitForm', {}, ttEventId);
          recordDiagnosticEvent({ eventType: 'SubmitForm', target: 'TikTok' });
          break;
        case 'ORDER_SUCCESS':
          window.ttq.track(
            'CompletePayment',
            {
              value: params.price || 0,
              currency: params.currency || 'MAD',
            },
            ttEventId
          );
          recordDiagnosticEvent({ eventType: 'CompletePayment', target: 'TikTok' });
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn('TikTok pixel track error:', e);
    }
  }

  return eventId;
}
