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
const FBCLID_STORAGE_KEY = 'cod_last_fbclid';
const FBC_COOKIE_NAME = '_fbc';
const FBP_COOKIE_NAME = '_fbp';
const SESSION_TRACKED_KEYS_STORAGE = 'cod_session_tracked_keys_v2';
const LOCAL_DETECTED_EVENTS_KEY = 'cod_local_diagnostics_events';

export interface UtmAttribution {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
}

interface StoredSessionState {
  sessionId: string;
  visitorId: string;
  startedAt: number;
  lastActivityAt: number;
}

// In-memory + sessionStorage deduplication sets for the current session lifecycle
const pageLoadTrackedKeys = new Set<string>();

function hasTrackedInSession(dedupKey: string): boolean {
  if (pageLoadTrackedKeys.has(dedupKey)) return true;
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(SESSION_TRACKED_KEYS_STORAGE);
    if (raw) {
      const list: string[] = JSON.parse(raw);
      if (Array.isArray(list) && list.includes(dedupKey)) {
        pageLoadTrackedKeys.add(dedupKey);
        return true;
      }
    }
  } catch {}
  return false;
}

function markTrackedInSession(dedupKey: string): void {
  pageLoadTrackedKeys.add(dedupKey);
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(SESSION_TRACKED_KEYS_STORAGE);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (Array.isArray(list) && !list.includes(dedupKey)) {
      list.push(dedupKey);
      sessionStorage.setItem(SESSION_TRACKED_KEYS_STORAGE, JSON.stringify(list.slice(-200)));
    }
  } catch {}
}

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
 * Captures and persists first-touch and last-touch UTM parameters + Meta/TikTok/Google click IDs (fbclid, _fbc, _fbp)
 */
export function captureAndStoreUtm(): { firstTouch: UtmAttribution; lastTouch: UtmAttribution } {
  const empty: UtmAttribution = {
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: '',
    fbclid: '',
    fbc: '',
    fbp: '',
  };

  if (typeof window === 'undefined') return { firstTouch: empty, lastTouch: empty };

  const params = new URLSearchParams(window.location.search);
  const urlFbclid = (params.get('fbclid') || '').trim();
  const urlTtclid = (params.get('ttclid') || '').trim();
  const urlGclid = (params.get('gclid') || '').trim();

  let fbclid = urlFbclid;
  try {
    if (urlFbclid) {
      localStorage.setItem(FBCLID_STORAGE_KEY, urlFbclid);
      sessionStorage.setItem(FBCLID_STORAGE_KEY, urlFbclid);
    } else {
      fbclid =
        sessionStorage.getItem(FBCLID_STORAGE_KEY) ||
        localStorage.getItem(FBCLID_STORAGE_KEY) ||
        '';
    }
  } catch {}

  let fbc = getCookie(FBC_COOKIE_NAME) || '';
  if (urlFbclid && !fbc) {
    fbc = `fb.1.${Date.now()}.${urlFbclid}`;
    setCookie(FBC_COOKIE_NAME, fbc, 90 * 24 * 60 * 60);
  }
  const fbp = getCookie(FBP_COOKIE_NAME) || '';

  let rawSource = (params.get('utm_source') || '').trim();
  let rawMedium = (params.get('utm_medium') || '').trim();
  const rawCampaign = (params.get('utm_campaign') || '').trim();
  const rawContent = (params.get('utm_content') || '').trim();
  const rawTerm = (params.get('utm_term') || '').trim();

  // Automatically infer traffic source & medium from ad click IDs or referrer when utm_source is omitted
  const ref = (typeof document !== 'undefined' ? document.referrer || '' : '').toLowerCase();
  if (!rawSource) {
    if (urlFbclid) {
      rawSource = ref.includes('instagram.com') ? 'instagram' : 'facebook';
      if (!rawMedium) rawMedium = 'paid_social';
    } else if (urlTtclid) {
      rawSource = 'tiktok';
      if (!rawMedium) rawMedium = 'paid_social';
    } else if (urlGclid) {
      rawSource = 'google';
      if (!rawMedium) rawMedium = 'cpc';
    } else if (ref) {
      if (ref.includes('instagram.com') || ref.includes('ig.me')) {
        rawSource = 'instagram';
        if (!rawMedium) rawMedium = 'social';
      } else if (ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('fb.me')) {
        rawSource = 'facebook';
        if (!rawMedium) rawMedium = 'social';
      } else if (ref.includes('tiktok.com')) {
        rawSource = 'tiktok';
        if (!rawMedium) rawMedium = 'social';
      } else if (ref.includes('google.')) {
        rawSource = 'google';
        if (!rawMedium) rawMedium = 'organic';
      } else if (ref.includes('youtube.com') || ref.includes('youtu.be')) {
        rawSource = 'youtube';
        if (!rawMedium) rawMedium = 'social';
      } else if (ref.includes('whatsapp.com') || ref.includes('wa.me')) {
        rawSource = 'whatsapp';
        if (!rawMedium) rawMedium = 'referral';
      }
    }
  }

  const currentUtm: UtmAttribution = {
    utmSource: rawSource,
    utmMedium: rawMedium,
    utmCampaign: rawCampaign,
    utmContent: rawContent,
    utmTerm: rawTerm,
    fbclid: fbclid || undefined,
    fbc: fbc || undefined,
    fbp: fbp || undefined,
  };

  const hasCurrentUtm = Boolean(
    rawSource || rawMedium || rawCampaign || rawContent || rawTerm || urlFbclid || urlTtclid || urlGclid
  );

  // First Touch
  let firstTouch = empty;
  try {
    const storedFirst = localStorage.getItem(FIRST_TOUCH_KEY);
    if (!storedFirst && hasCurrentUtm) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(currentUtm));
      firstTouch = currentUtm;
    } else if (storedFirst) {
      firstTouch = { ...empty, ...JSON.parse(storedFirst) };
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
      if (storedSessionLast) lastTouch = { ...empty, ...JSON.parse(storedSessionLast) };
      else if (storedLocalLast) lastTouch = { ...empty, ...JSON.parse(storedLocalLast) };
      else if (firstTouch.utmSource) lastTouch = firstTouch;
    }
  } catch {}

  if (fbclid && !lastTouch.fbclid) lastTouch.fbclid = fbclid;
  if (fbc && !lastTouch.fbc) lastTouch.fbc = fbc;
  if (fbp && !lastTouch.fbp) lastTouch.fbp = fbp;

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
export const DEFAULT_META_PIXEL_ID = '135752956164308';
export const DEFAULT_GA_ID = 'G-SY0FCG79E6';

const initializedMetaPixelIds = new Set<string>();
const trackedMetaPageViews = new Set<string>();
let tiktokPixelInjected = false;
let gaInjected = false;

export function getMetaTestEventCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('test_event_code') || urlParams.get('test_code');
    if (codeFromUrl) {
      sessionStorage.setItem('meta_test_event_code', codeFromUrl.trim());
      return codeFromUrl.trim();
    }
    return sessionStorage.getItem('meta_test_event_code') || null;
  } catch {
    return null;
  }
}

export function ensureMetaPixelBaseScript() {
  if (typeof window === 'undefined') return;
  if (!window.fbq) {
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
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else if (b.head) {
        b.head.appendChild(t);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
  }
}

export function activateMetaPixelId(pixelId?: string, trackPageViewNow = false) {
  if (typeof window === 'undefined') return;
  const cleanId = (pixelId || DEFAULT_META_PIXEL_ID).trim();
  if (!cleanId) return;

  try {
    ensureMetaPixelBaseScript();

    if (!initializedMetaPixelIds.has(cleanId)) {
      window.fbq('init', cleanId);
      initializedMetaPixelIds.add(cleanId);
      recordDiagnosticEvent({
        eventType: 'Pixel_Init',
        target: 'Meta',
        metadata: { pixelId: cleanId },
      });
    }

    if (trackPageViewNow) {
      const pathKey = `${cleanId}:${window.location.pathname}${window.location.search}`;
      if (!trackedMetaPageViews.has(pathKey)) {
        trackedMetaPageViews.add(pathKey);
        const testCode = getMetaTestEventCode();
        if (testCode) {
          window.fbq('track', 'PageView', {}, { test_event_code: testCode });
        } else {
          window.fbq('track', 'PageView');
        }
        recordDiagnosticEvent({
          eventType: 'PageView',
          target: 'Meta',
          metadata: { pixelId: cleanId, path: window.location.pathname },
        });
      }
    }
  } catch (e) {
    console.warn('Meta pixel activation failed:', e);
  }
}

export function initMarketingPixels(options: {
  metaPixelId?: string;
  enableMeta?: boolean;
  tiktokPixelId?: string;
  enableTikTok?: boolean;
  gaId?: string;
  enableGA?: boolean;
}) {
  if (typeof window === 'undefined') return;

  // 1. Meta Pixel — always initialize DEFAULT_META_PIXEL_ID plus any custom/settings Pixel ID entered by user
  const targetMetaId = (options.metaPixelId || DEFAULT_META_PIXEL_ID).trim();
  const shouldEnableMeta = options.enableMeta !== false && Boolean(targetMetaId);

  if (shouldEnableMeta && targetMetaId) {
    activateMetaPixelId(targetMetaId, true);
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

  // 3. Google Analytics 4 (Google tag G-SY0FCG79E6)
  const targetGaId = (options.gaId || DEFAULT_GA_ID).trim();
  const shouldEnableGA = options.enableGA !== false && Boolean(targetGaId);
  if (shouldEnableGA && !gaInjected) {
    try {
      if (!window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
          window.dataLayer!.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', targetGaId);

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(targetGaId)}`;
        document.head.appendChild(script);
      }
      gaInjected = true;
      recordDiagnosticEvent({
        eventType: 'Pixel_Init',
        target: 'Google',
        metadata: { gaId: targetGaId },
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

  // Prevent duplicate PAGE_VIEW, PRODUCT_VIEW, VIEW_CONTENT, FORM_VIEW, FORM_START from React re-renders or reloads within the same session
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
    const pathDedupKey = `${sessionId}:path:${normalizedType}:${window.location.pathname}`;
    if (hasTrackedInSession(dedupKey) || hasTrackedInSession(pathDedupKey)) {
      return `ev_dedup_${sessionId}_${params.productId}_${normalizedType}`;
    }
    markTrackedInSession(dedupKey);
    markTrackedInSession(pathDedupKey);
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
      fbclid: lastTouch.fbclid,
      fbc: lastTouch.fbc,
      fbp: lastTouch.fbp,
      metadata: {
        ...(params.metadata || {}),
        ...(ctaId ? { ctaId, elementId: ctaId } : {}),
        ...(lastTouch.fbclid ? { fbclid: lastTouch.fbclid } : {}),
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

  // 2. Dispatch to Meta Pixel (fbq) — ensure active product/store Pixel ID is initialized first
  try {
    const productObj = params.productId ? db.getProductById(params.productId) : null;
    const storeSettings = db.getSettings();
    const activeMetaId =
      productObj?.customMetaPixelId?.trim() ||
      storeSettings?.metaPixelId?.trim() ||
      DEFAULT_META_PIXEL_ID;
    activateMetaPixelId(activeMetaId, false);
  } catch {}

  if (window.fbq) {
    try {
      const testCode = getMetaTestEventCode();
      const fbEventOptions: Record<string, any> = { eventID: eventId };
      if (testCode) {
        fbEventOptions.test_event_code = testCode;
      }

      switch (params.eventType) {
        case 'PAGE_VIEW':
          window.fbq('track', 'PageView', {}, fbEventOptions);
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
            fbEventOptions
          );
          recordDiagnosticEvent({ eventType: 'ViewContent', target: 'Meta' });
          break;
        case 'CTA_CLICK':
          window.fbq('trackCustom', 'CTA_Click', { ctaId }, fbEventOptions);
          recordDiagnosticEvent({ eventType: 'CTA_Click', target: 'Meta', metadata: { ctaId } });
          break;
        case 'FORM_START':
          window.fbq('track', 'InitiateCheckout', {}, fbEventOptions);
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
            fbEventOptions
          );
          window.fbq(
            'track',
            'Purchase',
            {
              value: params.price || 0,
              currency: params.currency || 'MAD',
            },
            fbEventOptions
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

  // 4. Dispatch to Google tag (gtag.js G-SY0FCG79E6)
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      switch (params.eventType) {
        case 'PAGE_VIEW':
          window.gtag('event', 'page_view', {
            page_path: window.location.pathname,
            page_location: window.location.href,
          });
          recordDiagnosticEvent({ eventType: 'PageView', target: 'Google' });
          break;
        case 'PRODUCT_VIEW':
        case 'VIEW_CONTENT':
          window.gtag('event', 'view_item', {
            currency: params.currency || 'MAD',
            value: params.price || 0,
            items: [
              {
                item_id: params.productId,
                item_name: params.productName || params.productId,
                price: params.price || 0,
              },
            ],
          });
          recordDiagnosticEvent({ eventType: 'ViewContent', target: 'Google' });
          break;
        case 'CTA_CLICK':
          window.gtag('event', 'select_item', {
            item_list_name: ctaId,
          });
          recordDiagnosticEvent({ eventType: 'CTA_Click', target: 'Google', metadata: { ctaId } });
          break;
        case 'FORM_START':
          window.gtag('event', 'begin_checkout', {
            currency: params.currency || 'MAD',
            value: params.price || 0,
            items: [
              {
                item_id: params.productId,
                item_name: params.productName || params.productId,
                price: params.price || 0,
              },
            ],
          });
          recordDiagnosticEvent({ eventType: 'InitiateCheckout', target: 'Google' });
          break;
        case 'ORDER_CREATED':
        case 'ORDER_SUCCESS':
          window.gtag('event', 'purchase', {
            transaction_id: eventId,
            value: params.price || 0,
            currency: params.currency || 'MAD',
            items: [
              {
                item_id: params.productId,
                item_name: params.productName || params.productId,
                price: params.price || 0,
              },
            ],
          });
          recordDiagnosticEvent({ eventType: 'Purchase', target: 'Google' });
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn('Google Analytics event dispatch error:', e);
    }
  }

  return eventId;
}
