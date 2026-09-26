/**
 * Production Tracking & Attribution Engine
 * Handles:
 *   - Stable anonymous Visitor identification (visitorId = v_xxxxxxxxx via Cookie + localStorage)
 *   - Session management with 30-minute inactivity expiration (sessionId = s_xxxxxxxxx)
 *   - First-touch & Last-touch UTM attribution
 *   - Strict deduplication against React re-renders / StrictMode double-mounts
 *   - Authoritative persistence to Convex / Server DB
 *   - Dynamic Meta Pixel, TikTok Pixel, and GA4 dispatch
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

// Storage Keys & Session Timeout Rule (30 minutes of inactivity)
const VISITOR_STORAGE_KEY = 'cod_analytics_visitor_id';
const VISITOR_COOKIE_NAME = 'cod_visitor_id';
const SESSION_STATE_KEY = 'cod_analytics_session_state';
const SESSION_ID_KEY = 'cod_analytics_session_id';
const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

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

interface StoredSessionState {
  sessionId: string;
  visitorId: string;
  startedAt: number;
  lastActivityAt: number;
}

// In-memory deduplication sets for the current page load lifecycle
const pageLoadTrackedKeys = new Set<string>();

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds = 31536000) {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
  } catch {}
}

/**
 * Returns or creates a stable anonymous visitorId (v_xxxxxxxxx).
 * Persists across page reloads and returning visits via first-party cookie + localStorage.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'v_server_unknown';

  let visitorId: string | null = null;
  try {
    visitorId = localStorage.getItem(VISITOR_STORAGE_KEY) || getCookie(VISITOR_COOKIE_NAME);
  } catch {
    visitorId = getCookie(VISITOR_COOKIE_NAME);
  }

  if (!visitorId || !visitorId.startsWith('v_')) {
    visitorId =
      'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
  }

  // Ensure both localStorage and first-party cookie stay synchronized
  try {
    localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  } catch {}
  setCookie(VISITOR_COOKIE_NAME, visitorId, 365 * 24 * 60 * 60);

  return visitorId;
}

/**
 * Returns or creates a real sessionId (s_xxxxxxxxx) with a strict 30-minute inactivity expiration rule.
 * One visitor (v_123) can have multiple sessions (s_001, later s_002).
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 's_server_unknown';

  const visitorId = getVisitorId();
  const now = Date.now();

  try {
    const rawState =
      localStorage.getItem(SESSION_STATE_KEY) || sessionStorage.getItem(SESSION_STATE_KEY);
    if (rawState) {
      const parsed: StoredSessionState = JSON.parse(rawState);
      const isExpired = now - (parsed.lastActivityAt || 0) > SESSION_INACTIVITY_TIMEOUT_MS;
      if (
        parsed.sessionId &&
        parsed.sessionId.startsWith('s_') &&
        parsed.visitorId === visitorId &&
        !isExpired
      ) {
        // Refresh lastActivityAt
        const updated: StoredSessionState = {
          ...parsed,
          lastActivityAt: now,
        };
        const serialized = JSON.stringify(updated);
        localStorage.setItem(SESSION_STATE_KEY, serialized);
        sessionStorage.setItem(SESSION_STATE_KEY, serialized);
        sessionStorage.setItem(SESSION_ID_KEY, updated.sessionId);
        return updated.sessionId;
      }
    }
  } catch {}

  // Create a new session
  const newSessionId =
    's_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  const newState: StoredSessionState = {
    sessionId: newSessionId,
    visitorId,
    startedAt: now,
    lastActivityAt: now,
  };

  try {
    const serialized = JSON.stringify(newState);
    localStorage.setItem(SESSION_STATE_KEY, serialized);
    sessionStorage.setItem(SESSION_STATE_KEY, serialized);
    sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
  } catch {}

  return newSessionId;
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
    utmSource: (params.get('utm_source') || '').trim(),
    utmMedium: (params.get('utm_medium') || '').trim(),
    utmCampaign: (params.get('utm_campaign') || '').trim(),
    utmContent: (params.get('utm_content') || '').trim(),
    utmTerm: (params.get('utm_term') || '').trim(),
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
      sessionStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(currentUtm));
      lastTouch = currentUtm;
    } else {
      const storedSessionLast = sessionStorage.getItem(LAST_TOUCH_KEY);
      const storedLocalLast = localStorage.getItem(LAST_TOUCH_KEY);
      if (storedSessionLast) lastTouch = JSON.parse(storedSessionLast);
      else if (storedLocalLast) lastTouch = JSON.parse(storedLocalLast);
      else if (firstTouch.utmSource) lastTouch = firstTouch;
    }
  } catch {}

  return { firstTouch, lastTouch };
}

/**
 * Diagnostics local event recorder (stored only in browser sessionStorage for pixel diagnostics)
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

  // 3. Google Analytics 4
  if (options.enableGA && options.gaId && !gaInjected) {
    try {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(options.gaId)}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer!.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', options.gaId);
      gaInjected = true;
      recordDiagnosticEvent({
        eventType: 'Pixel_Init',
        target: 'Google',
        metadata: { gaId: options.gaId },
      });
    } catch (e) {
      console.warn('Google Analytics initialization failed:', e);
    }
  }
}

/**
 * Universal Real Event Tracker:
 * Persists real user events to Convex / Server DB with strict deduplication
 * and dispatches to configured marketing pixels.
 */
export function trackEvent(params: {
  eventType: AnalyticsEventType;
  productId: string;
  ctaId?: string;
  metadata?: Record<string, any>;
  customEventId?: string;
  productName?: string;
  price?: number;
  currency?: string;
  isPreview?: boolean;
  isDiagnosticTest?: boolean;
}): string {
  if (typeof window === 'undefined') return '';

  // Never record preview interactions into production analytics
  if (params.isPreview || params.metadata?.isPreview) {
    return '';
  }

  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const { lastTouch } = captureAndStoreUtm();
  const ctaId = params.ctaId || params.metadata?.ctaId || params.metadata?.elementId;
  const pagePath = window.location.pathname + window.location.search;

  // Diagnostic-only test events: record in browser diagnostics panel ONLY, never in production analytics DB
  if (params.isDiagnosticTest || params.metadata?.isTest) {
    const diagId = 'diag_test_' + Date.now().toString(36);
    recordDiagnosticEvent({
      eventType: params.eventType,
      target: 'Internal',
      metadata: { productId: params.productId, ctaId, isDiagnosticTest: true },
    });
    return diagId;
  }

  // Prevent duplicate PAGE_VIEW, PRODUCT_VIEW, VIEW_CONTENT, FORM_VIEW, FORM_START from React re-renders
  if (
    params.eventType === 'PAGE_VIEW' ||
    params.eventType === 'PRODUCT_VIEW' ||
    params.eventType === 'VIEW_CONTENT' ||
    params.eventType === 'FORM_VIEW' ||
    params.eventType === 'FORM_START'
  ) {
    const normalizedType =
      params.eventType === 'VIEW_CONTENT' ? 'PRODUCT_VIEW' : params.eventType;
    const dedupKey = `${sessionId}:${params.productId}:${normalizedType}:${window.location.pathname}`;
    if (pageLoadTrackedKeys.has(dedupKey)) {
      return `ev_dedup_${sessionId}_${params.productId}_${normalizedType}`;
    }
    pageLoadTrackedKeys.add(dedupKey);
  }

  const clientTimestamp = Date.now();
  const eventId =
    params.customEventId ||
    (params.eventType === 'PAGE_VIEW' ||
    params.eventType === 'PRODUCT_VIEW' ||
    params.eventType === 'VIEW_CONTENT' ||
    params.eventType === 'FORM_VIEW' ||
    params.eventType === 'FORM_START'
      ? `ev_${sessionId}_${params.productId}_${params.eventType}`
      : `ev_${clientTimestamp.toString(36)}_${Math.random().toString(36).substring(2, 8)}`);

  // 1. Persist to authoritative Convex / Server database
  try {
    db.logAnalyticsEvent({
      eventId,
      clientEventId: eventId,
      eventType: params.eventType,
      visitorId,
      sessionId,
      productId: params.productId,
      ctaId,
      timestamp: clientTimestamp,
      clientTimestamp,
      pageUrl: pagePath,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
      utmSource: lastTouch.utmSource || '',
      utmMedium: lastTouch.utmMedium || '',
      utmCampaign: lastTouch.utmCampaign || '',
      utmContent: lastTouch.utmContent || '',
      utmTerm: lastTouch.utmTerm || '',
      metadata: {
        ...(params.metadata || {}),
        ...(ctaId ? { ctaId, elementId: ctaId } : {}),
      },
    });

    recordDiagnosticEvent({
      eventType: params.eventType,
      target: 'Internal',
      metadata: { visitorId, sessionId, productId: params.productId, ctaId, ...params.metadata },
    });
  } catch (err) {
    console.error('Error logging analytics event to database:', err);
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
        case 'PRODUCT_VIEW':
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
          window.fbq('trackCustom', 'CTA_Click', { ctaId }, fbEventId);
          recordDiagnosticEvent({ eventType: 'CTA_Click', target: 'Meta', metadata: { ctaId } });
          break;
        case 'FORM_START':
          window.fbq('track', 'InitiateCheckout', {}, fbEventId);
          recordDiagnosticEvent({ eventType: 'InitiateCheckout', target: 'Meta' });
          break;
        case 'ORDER_CREATED':
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
        case 'PRODUCT_VIEW':
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
          window.ttq.track('ClickButton', { button_name: ctaId }, ttEventId);
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
        case 'ORDER_CREATED':
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
