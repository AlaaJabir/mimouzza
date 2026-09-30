import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import {
  DEFAULT_CONVEX_CLOUD_URL,
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_TEMPLATES,
  isSystemCloudDoc,
  isLegacySeedProduct,
  isLegacyFakeOrder,
  isLegacyFakeEvent,
  getProductStatus,
  normalizeProductSlug,
  generateUniqueSlug,
  computeAuthoritativeOrderTotal,
} from './convex/db';
import type {
  Product,
  ProductStatus,
  Order,
  OrderStatus,
  OrderStatusHistory,
  Visitor,
  AnalyticsSession,
  AnalyticsEvent,
  AnalyticsEventType,
  StoreSettings,
  Template,
} from './convex/schema';

const DB_FILE_PATH = path.resolve(process.cwd(), '.convex-server-db.json');
const IMAGES_DB_FILE_PATH = path.resolve(process.cwd(), '.convex-images-db.json');

interface StoredImageRecord {
  id: string;
  mimeType: string;
  base64: string;
  createdAt: number;
}

type ServerImagesDatabase = Record<string, StoredImageRecord>;

interface ServerDatabaseState {
  products: Product[];
  orders: Order[];
  orderStatusHistory: OrderStatusHistory[];
  visitors: Visitor[];
  sessions: AnalyticsSession[];
  analyticsEvents: AnalyticsEvent[];
  settings: StoreSettings;
  templates: Template[];
  updatedAt: number;
}

function loadImagesDatabase(): ServerImagesDatabase {
  try {
    if (fs.existsSync(IMAGES_DB_FILE_PATH)) {
      const raw = fs.readFileSync(IMAGES_DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as ServerImagesDatabase;
      }
    }
  } catch (err) {
    console.warn('Could not load .convex-images-db.json, initializing fresh image store:', err);
  }
  return {};
}

function saveImagesDatabase(imagesDb: ServerImagesDatabase) {
  try {
    fs.writeFileSync(IMAGES_DB_FILE_PATH, JSON.stringify(imagesDb), 'utf-8');
  } catch (err) {
    console.error('Failed to save images DB:', err);
  }
}

const serverImagesDb: ServerImagesDatabase = loadImagesDatabase();
const pendingImageChunks = new Map<
  string,
  { mimeType: string; totalChunks: number; chunks: string[]; createdAt: number }
>();

/**
 * Converts a base64 `data:image/...` URI into a persistent server-hosted image URL `/api/db/image/:id`.
 * Keeps product JSON payloads tiny (< 2KB) so saving and syncing products never hits HTTP payload limits.
 */
function persistDataUrlImage(urlOrDataUri: string): string {
  if (!urlOrDataUri || typeof urlOrDataUri !== 'string') return '';
  const trimmed = urlOrDataUri.trim();
  if (!trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return trimmed;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const hash = crypto.createHash('sha1').update(base64).digest('hex').slice(0, 16);
  const id = `img_${hash}`;

  if (!serverImagesDb[id]) {
    serverImagesDb[id] = {
      id,
      mimeType,
      base64,
      createdAt: Date.now(),
    };
    saveImagesDatabase(serverImagesDb);
  }

  return `/api/db/image/${id}`;
}

function cleanCampaignAdSpends(spends?: Record<string, number>): Record<string, number> {
  if (!spends || typeof spends !== 'object') return {};
  const cleaned = { ...spends };
  if (
    cleaned.elixir_spring_tiktok === 600 &&
    cleaned.prosound_audiophiles === 450 &&
    cleaned.aviator_luxury_v1 === 350
  ) {
    delete cleaned.elixir_spring_tiktok;
    delete cleaned.prosound_audiophiles;
    delete cleaned.aviator_luxury_v1;
  }
  return cleaned;
}

function loadServerDatabase(): ServerDatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products)) {
        const cleanedProducts = (parsed.products as Product[])
          .filter((p) => !isLegacySeedProduct(p))
          .map((p) => {
            const status = getProductStatus(p);
            const images = Array.isArray(p.images)
              ? p.images.filter(Boolean).map((img) => persistDataUrlImage(img))
              : [];
            const descriptionImages = Array.isArray(p.descriptionImages)
              ? p.descriptionImages.filter(Boolean).map((img) => persistDataUrlImage(img))
              : [];
            const ogImage = p.ogImage ? persistDataUrlImage(p.ogImage) : images[0] || '';
            return {
              ...p,
              images,
              descriptionImages,
              ogImage,
              status,
              isPublished: status === 'ACTIVE',
              comparePrice: p.comparePrice ?? p.compareAtPrice,
            };
          });

        const cleanedOrders = Array.isArray(parsed.orders)
          ? (parsed.orders as Order[]).filter((o) => !isLegacyFakeOrder(o))
          : [];
        const cleanedEvents = Array.isArray(parsed.analyticsEvents)
          ? (parsed.analyticsEvents as AnalyticsEvent[]).filter((e) => !isLegacyFakeEvent(e))
          : [];
        const loadedSettings: StoreSettings = parsed.settings
          ? {
              ...INITIAL_SETTINGS,
              ...parsed.settings,
              moroccoCities: INITIAL_SETTINGS.moroccoCities,
              metaPixelId: parsed.settings.metaPixelId || INITIAL_SETTINGS.metaPixelId,
              enableMetaPixel:
                parsed.settings.metaPixelId
                  ? parsed.settings.enableMetaPixel ?? true
                  : INITIAL_SETTINGS.enableMetaPixel,
              campaignAdSpends: cleanCampaignAdSpends(parsed.settings.campaignAdSpends),
            }
          : { ...INITIAL_SETTINGS };

        const state: ServerDatabaseState = {
          products: cleanedProducts,
          orders: cleanedOrders,
          orderStatusHistory: Array.isArray(parsed.orderStatusHistory)
            ? parsed.orderStatusHistory
            : [],
          visitors: Array.isArray(parsed.visitors) ? parsed.visitors : [],
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          analyticsEvents: cleanedEvents,
          settings: loadedSettings,
          templates: Array.isArray(parsed.templates) ? parsed.templates : [...INITIAL_TEMPLATES],
          updatedAt: Date.now(),
        };
        saveServerDatabase(state);
        return state;
      }
    }
  } catch (err) {
    console.warn('Could not load .convex-server-db.json, initializing fresh state:', err);
  }

  const initial: ServerDatabaseState = {
    products: [...INITIAL_PRODUCTS],
    orders: [],
    orderStatusHistory: [],
    visitors: [],
    sessions: [],
    analyticsEvents: [],
    settings: { ...INITIAL_SETTINGS },
    templates: [...INITIAL_TEMPLATES],
    updatedAt: Date.now(),
  };
  saveServerDatabase(initial);
  return initial;
}

function saveServerDatabase(state: ServerDatabaseState) {
  try {
    state.updatedAt = Date.now();
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save server DB:', err);
  }
}

const serverDb = loadServerDatabase();

function upsertVisitorOnServer(v: Partial<Visitor>, serverNow: number): Visitor | null {
  if (!v || !v.visitorId) return null;
  let existing = serverDb.visitors.find((item) => item.visitorId === v.visitorId);
  if (!existing) {
    existing = {
      _id: v._id || 'vis_' + v.visitorId,
      visitorId: v.visitorId,
      firstSeenAt: serverNow,
      lastSeenAt: serverNow,
      userAgent: v.userAgent,
    };
    serverDb.visitors.push(existing);
  } else {
    existing.lastSeenAt = Math.max(existing.lastSeenAt, serverNow);
    if (v.userAgent && !existing.userAgent) {
      existing.userAgent = v.userAgent;
    }
  }
  return existing;
}

function upsertSessionOnServer(
  s: Partial<AnalyticsSession>,
  serverNow: number
): AnalyticsSession | null {
  if (!s || !s.sessionId || !s.visitorId) return null;
  let existing = serverDb.sessions.find((item) => item.sessionId === s.sessionId);
  if (!existing) {
    existing = {
      _id: s._id || 'sess_' + s.sessionId,
      sessionId: s.sessionId,
      visitorId: s.visitorId,
      productId: s.productId || '',
      landingPage: s.landingPage || '',
      utmSource: s.utmSource || '',
      utmMedium: s.utmMedium || '',
      utmCampaign: s.utmCampaign || '',
      utmTerm: s.utmTerm || '',
      utmContent: s.utmContent || '',
      fbclid: s.fbclid,
      fbc: s.fbc,
      fbp: s.fbp,
      referrer: s.referrer || '',
      startedAt: serverNow,
      lastSeenAt: serverNow,
    };
    serverDb.sessions.push(existing);
  } else {
    existing.lastSeenAt = Math.max(existing.lastSeenAt, serverNow);
    if (!existing.productId && s.productId) existing.productId = s.productId;
    if (!existing.utmSource && s.utmSource) existing.utmSource = s.utmSource;
    if (!existing.utmMedium && s.utmMedium) existing.utmMedium = s.utmMedium;
    if (!existing.utmCampaign && s.utmCampaign) existing.utmCampaign = s.utmCampaign;
    if (!existing.utmTerm && s.utmTerm) existing.utmTerm = s.utmTerm;
    if (!existing.utmContent && s.utmContent) existing.utmContent = s.utmContent;
    if (!existing.fbclid && s.fbclid) existing.fbclid = s.fbclid;
    if (!existing.fbc && s.fbc) existing.fbc = s.fbc;
    if (!existing.fbp && s.fbp) existing.fbp = s.fbp;
    if (!existing.referrer && s.referrer) existing.referrer = s.referrer;
  }
  return existing;
}

const serverDeletedOrderIds = new Set<string>();

async function syncServerWithConvexCloud(): Promise<void> {
  try {
    const convexUrl = process.env.VITE_CONVEX_URL || DEFAULT_CONVEX_CLOUD_URL;
    const res = await fetch(`${convexUrl}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'products:list', args: {}, format: 'json' }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.status !== 'success' || !Array.isArray(data.value)) return;

    const rawDocs: Product[] = data.value;
    let changed = false;

    for (const doc of rawDocs) {
      if (!doc) continue;
      if (isSystemCloudDoc(doc)) {
        const slug = String(doc.slug || '').trim();
        let parsed: any = null;
        try {
          parsed = JSON.parse(doc.description || '{}');
        } catch {}
        if (!parsed || typeof parsed !== 'object') continue;

        if (slug.startsWith('__cod_sys_order_') && parsed.order) {
          const ord = parsed.order as Order;
          if (ord && ord._id) {
            if (parsed.deleted) {
              serverDeletedOrderIds.add(ord._id);
              const beforeLen = serverDb.orders.length;
              serverDb.orders = serverDb.orders.filter((o) => o._id !== ord._id);
              if (serverDb.orders.length !== beforeLen) changed = true;
            } else if (!serverDeletedOrderIds.has(ord._id) && !isLegacyFakeOrder(ord)) {
              const exIdx = serverDb.orders.findIndex((o) => o._id === ord._id);
              if (exIdx === -1) {
                serverDb.orders.push(ord);
                changed = true;
              } else {
                const exTime = Number(serverDb.orders[exIdx].updatedAt || serverDb.orders[exIdx].createdAt || 0);
                const ordTime = Number(ord.updatedAt || ord.createdAt || 0);
                if (ordTime > exTime) {
                  serverDb.orders[exIdx] = { ...serverDb.orders[exIdx], ...ord };
                  changed = true;
                }
              }
            }
            if (Array.isArray(parsed.history)) {
              for (const h of parsed.history as OrderStatusHistory[]) {
                if (h && h._id && !serverDeletedOrderIds.has(h.orderId)) {
                  if (!serverDb.orderStatusHistory.some((ex) => ex._id === h._id)) {
                    serverDb.orderStatusHistory.push(h);
                    changed = true;
                  }
                }
              }
            }
          }
        } else if (slug === '__cod_sys_telemetry' && parsed.type === 'TELEMETRY_RECORD') {
          if (Array.isArray(parsed.deletedOrderIds)) {
            for (const delId of parsed.deletedOrderIds) {
              serverDeletedOrderIds.add(String(delId));
            }
            const beforeOrders = serverDb.orders.length;
            serverDb.orders = serverDb.orders.filter((o) => !serverDeletedOrderIds.has(o._id));
            if (serverDb.orders.length !== beforeOrders) changed = true;
          }
          if (Array.isArray(parsed.visitors)) {
            for (const v of parsed.visitors as Visitor[]) {
              if (!v?.visitorId) continue;
              const ex = serverDb.visitors.find((item) => item.visitorId === v.visitorId);
              if (!ex) {
                serverDb.visitors.push(v);
                changed = true;
              } else if ((v.lastSeenAt || 0) > (ex.lastSeenAt || 0)) {
                ex.lastSeenAt = v.lastSeenAt;
                changed = true;
              }
            }
          }
          if (Array.isArray(parsed.sessions)) {
            for (const s of parsed.sessions as AnalyticsSession[]) {
              if (!s?.sessionId) continue;
              const ex = serverDb.sessions.find((item) => item.sessionId === s.sessionId);
              if (!ex) {
                serverDb.sessions.push(s);
                changed = true;
              } else if ((s.lastSeenAt || 0) > (ex.lastSeenAt || 0)) {
                Object.assign(ex, s, { lastSeenAt: Math.max(ex.lastSeenAt, s.lastSeenAt) });
                changed = true;
              }
            }
          }
          if (Array.isArray(parsed.analyticsEvents)) {
            for (const e of parsed.analyticsEvents as AnalyticsEvent[]) {
              if (!e || isLegacyFakeEvent(e)) continue;
              const ordId = e.metadata?.orderId ? String(e.metadata.orderId) : '';
              if (ordId && serverDeletedOrderIds.has(ordId)) continue;
              const key = e.clientEventId || e.eventId || e._id;
              if (
                !serverDb.analyticsEvents.some(
                  (ex) => (ex.clientEventId || ex.eventId || ex._id) === key
                )
              ) {
                serverDb.analyticsEvents.push(e);
                changed = true;
              }
            }
          }
        } else if (slug === '__cod_sys_settings' && parsed.settings) {
          serverDb.settings = {
            ...INITIAL_SETTINGS,
            ...parsed.settings,
            ...serverDb.settings,
            moroccoCities: INITIAL_SETTINGS.moroccoCities,
          };
        }
        continue;
      }

      if (isLegacySeedProduct(doc)) continue;
      const status = getProductStatus(doc);
      const images = Array.isArray(doc.images)
        ? doc.images.filter(Boolean).map((img) => persistDataUrlImage(img))
        : [];
      const descriptionImages = Array.isArray(doc.descriptionImages)
        ? doc.descriptionImages.filter(Boolean).map((img) => persistDataUrlImage(img))
        : [];
      const ogImage = doc.ogImage ? persistDataUrlImage(doc.ogImage) : images[0] || '';
      const normalizedProd: Product = {
        ...doc,
        images,
        descriptionImages,
        ogImage,
        status,
        isPublished: status === 'ACTIVE',
        comparePrice: doc.comparePrice ?? doc.compareAtPrice,
      };
      const exIdx = serverDb.products.findIndex(
        (p) =>
          p._id === normalizedProd._id ||
          normalizeProductSlug(p.slug) === normalizeProductSlug(normalizedProd.slug)
      );
      if (exIdx === -1) {
        serverDb.products.push(normalizedProd);
        changed = true;
      } else {
        const ex = serverDb.products[exIdx];
        if ((normalizedProd.updatedAt || 0) >= (ex.updatedAt || 0)) {
          serverDb.products[exIdx] = { ...ex, ...normalizedProd, _id: normalizedProd._id };
          changed = true;
        }
      }
    }

    if (changed) {
      serverDb.orders.sort((a, b) => b.createdAt - a.createdAt);
      serverDb.analyticsEvents.sort((a, b) => a.timestamp - b.timestamp);
      saveServerDatabase(serverDb);
    }
  } catch {}
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  void syncServerWithConvexCloud();
  setInterval(() => {
    void syncServerWithConvexCloud();
  }, 15000);

  // High payload limit to support base64 compressed images in products & descriptionImages
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 0. Dedicated Image Upload & Serving Endpoints (prevents large JSON body 413 errors)
  app.post('/api/db/image', (req, res) => {
    try {
      const dataUrl = req.body?.dataUrl as string | undefined;
      if (!dataUrl || typeof dataUrl !== 'string') {
        res.status(400).json({ ok: false, error: 'Missing image dataUrl' });
        return;
      }
      const url = persistDataUrlImage(dataUrl);
      res.json({ ok: true, url });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Image upload failed' });
    }
  });

  // Chunked image upload endpoint (each chunk <= 120KB so reverse proxies never reject with 413)
  app.post('/api/db/image-chunk', (req, res) => {
    try {
      const { uploadId, mimeType, chunkIndex, totalChunks, chunkData } = req.body || {};
      if (
        !uploadId ||
        typeof chunkIndex !== 'number' ||
        typeof totalChunks !== 'number' ||
        typeof chunkData !== 'string'
      ) {
        res.status(400).json({ ok: false, error: 'Invalid image chunk payload' });
        return;
      }

      let entry = pendingImageChunks.get(uploadId);
      if (!entry) {
        entry = {
          mimeType: mimeType || 'image/jpeg',
          totalChunks,
          chunks: new Array(totalChunks).fill(''),
          createdAt: Date.now(),
        };
        pendingImageChunks.set(uploadId, entry);
      }

      entry.chunks[chunkIndex] = chunkData;
      const allReceived = entry.chunks.every((c) => typeof c === 'string' && c.length > 0);

      if (allReceived || chunkIndex === totalChunks - 1) {
        const fullBase64 = entry.chunks.join('');
        pendingImageChunks.delete(uploadId);

        const hash = crypto.createHash('sha1').update(fullBase64).digest('hex').slice(0, 16);
        const id = `img_${hash}`;
        if (!serverImagesDb[id]) {
          serverImagesDb[id] = {
            id,
            mimeType: entry.mimeType || 'image/jpeg',
            base64: fullBase64,
            createdAt: Date.now(),
          };
          saveImagesDatabase(serverImagesDb);
        }

        const url = `/api/db/image/${id}`;
        res.json({ ok: true, completed: true, url });
        return;
      }

      res.json({ ok: true, completed: false, chunkIndex });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Chunk upload failed' });
    }
  });

  const serveStoredImage = (req: express.Request, res: express.Response) => {
    const record = serverImagesDb[req.params.id];
    if (!record) {
      res.status(404).send('Image not found');
      return;
    }
    try {
      const buffer = Buffer.from(record.base64, 'base64');
      res.setHeader('Content-Type', record.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch {
      res.status(500).send('Failed to decode image');
    }
  };

  app.get('/api/db/image/:id', serveStoredImage);
  app.get('/api/images/:id', serveStoredImage);

  // 1. Get full authoritative state (never cached by browser)
  app.get('/api/db/state', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      ok: true,
      products: serverDb.products,
      orders: serverDb.orders,
      orderStatusHistory: serverDb.orderStatusHistory,
      visitors: serverDb.visitors,
      sessions: serverDb.sessions,
      analyticsEvents: serverDb.analyticsEvents,
      settings: serverDb.settings,
      templates: serverDb.templates,
      updatedAt: serverDb.updatedAt,
      serverTime: Date.now(),
    });
  });

  // 2. Get single product by slug or ID (authoritative lookup for public product URL /p/:slug)
  app.get('/api/db/product/:slug', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const rawParam = req.params.slug || '';
    const targetNorm = normalizeProductSlug(rawParam);
    const targetRaw = rawParam.trim().toLowerCase();

    const found =
      serverDb.products.find(
        (p) =>
          normalizeProductSlug(p.slug) === targetNorm ||
          p.slug.trim().toLowerCase() === targetRaw ||
          p._id.toLowerCase() === targetRaw
      ) || null;

    res.json({ ok: true, product: found });
  });

  // 3. Read-only state sync endpoint (returns authoritative server state)
  app.post('/api/db/sync', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      ok: true,
      products: serverDb.products,
      orders: serverDb.orders,
      orderStatusHistory: serverDb.orderStatusHistory,
      visitors: serverDb.visitors,
      sessions: serverDb.sessions,
      analyticsEvents: serverDb.analyticsEvents,
      settings: serverDb.settings,
      serverTime: Date.now(),
    });
  });

  // 4. Authoritative Event Ingestion Endpoint
  app.post('/api/db/event', (req, res) => {
    const serverNow = Date.now();
    const { event, visitor, session } = req.body || {};

    if (!event || !event.eventType || !event.productId) {
      res.status(400).json({ ok: false, error: 'Invalid event payload' });
      return;
    }

    if (isLegacyFakeEvent(event) || event.metadata?.isTest || event.metadata?.isPreview) {
      res.json({ ok: true, ignored: true });
      return;
    }

    // Upsert visitor & session with authoritative server timestamp
    const savedVisitor = upsertVisitorOnServer(
      visitor || { visitorId: event.visitorId, userAgent: event.userAgent },
      serverNow
    );
    const savedSession = upsertSessionOnServer(
      session || {
        sessionId: event.sessionId,
        visitorId: event.visitorId,
        productId: event.productId,
        landingPage: event.pageUrl,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        utmTerm: event.utmTerm,
        utmContent: event.utmContent,
        fbclid: event.fbclid,
        fbc: event.fbc,
        fbp: event.fbp,
        referrer: event.referrer,
      },
      serverNow
    );

    const clientEventId = event.clientEventId || event.eventId;
    const existing = serverDb.analyticsEvents.find(
      (e) =>
        (clientEventId && (e.clientEventId === clientEventId || e.eventId === clientEventId)) ||
        e._id === event._id
    );

    if (existing) {
      res.json({
        ok: true,
        event: existing,
        visitor: savedVisitor,
        session: savedSession,
        serverTime: serverNow,
      });
      return;
    }

    // Deduplicate rapid duplicate PAGE_VIEW / PRODUCT_VIEW within 2.5s for same session + product
    if (
      (event.eventType === 'PAGE_VIEW' || event.eventType === 'PRODUCT_VIEW') &&
      event.sessionId &&
      event.productId
    ) {
      const recentView = serverDb.analyticsEvents.find(
        (e) =>
          e.eventType === event.eventType &&
          e.sessionId === event.sessionId &&
          e.productId === event.productId &&
          Math.abs(serverNow - e.timestamp) < 2500
      );
      if (recentView) {
        res.json({
          ok: true,
          event: recentView,
          visitor: savedVisitor,
          session: savedSession,
          serverTime: serverNow,
        });
        return;
      }
    }

    // Deduplicate FORM_START per sessionId + productId on server
    if (event.eventType === 'FORM_START' && event.sessionId && event.productId) {
      const existingFormStart = serverDb.analyticsEvents.find(
        (e) =>
          e.eventType === 'FORM_START' &&
          e.sessionId === event.sessionId &&
          e.productId === event.productId
      );
      if (existingFormStart) {
        res.json({
          ok: true,
          event: existingFormStart,
          visitor: savedVisitor,
          session: savedSession,
          serverTime: serverNow,
        });
        return;
      }
    }

    const authoritativeEvent: AnalyticsEvent = {
      ...event,
      _id:
        event._id ||
        'evt_' + serverNow.toString(36) + '_' + Math.random().toString(36).substring(2, 8),
      eventId: clientEventId || 'ev_' + serverNow.toString(36),
      clientEventId: clientEventId || 'ev_' + serverNow.toString(36),
      visitorId: event.visitorId || 'v_anonymous',
      sessionId: event.sessionId || 's_anonymous',
      ctaId: event.ctaId || event.metadata?.ctaId || event.metadata?.elementId,
      timestamp: serverNow,
      createdAt: serverNow,
      clientTimestamp: event.clientTimestamp || event.timestamp || serverNow,
    };

    serverDb.analyticsEvents.push(authoritativeEvent);
    saveServerDatabase(serverDb);

    res.json({
      ok: true,
      event: authoritativeEvent,
      visitor: savedVisitor,
      session: savedSession,
      serverTime: serverNow,
    });
  });

  // 5. Authoritative Product Create / Update Endpoint
  app.post('/api/db/product', (req, res) => {
    try {
      const serverNow = Date.now();
      const incoming = (req.body?.product || req.body) as Partial<Product> | undefined;
      if (!incoming || !incoming.name?.trim()) {
        res.status(400).json({ ok: false, error: 'اسم المنتج مطلوب (Product name is required)' });
        return;
      }

      const existingIdx = incoming._id
        ? serverDb.products.findIndex((p) => p._id === incoming._id)
        : -1;
      const existingProduct = existingIdx !== -1 ? serverDb.products[existingIdx] : null;

      const productId =
        existingProduct?._id ||
        incoming._id ||
        `prod_${serverNow.toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

      const uniqueSlug = generateUniqueSlug(
        incoming.slug || incoming.name,
        serverDb.products,
        productId
      );

      const resolvedStatus: ProductStatus =
        incoming.status || (incoming.isPublished === false ? 'DRAFT' : 'ACTIVE');
      const resolvedPublished = resolvedStatus === 'ACTIVE';

      const persistedImages = Array.isArray(incoming.images)
        ? incoming.images.filter(Boolean).map((img) => persistDataUrlImage(img))
        : existingProduct?.images || [];

      const persistedDescriptionImages = Array.isArray(incoming.descriptionImages)
        ? incoming.descriptionImages.filter(Boolean).map((img) => persistDataUrlImage(img))
        : existingProduct?.descriptionImages || [];

      const rawOgImage = incoming.ogImage
        ? persistDataUrlImage(incoming.ogImage)
        : persistedImages[0] || '';

      const authoritativeProduct: Product = {
        shortDescription: '',
        description: '',
        currency: 'DH',
        templateId: 'classic-cod',
        offerText: '',
        shippingText: '',
        returnPolicy: '',
        benefits: [],
        variants: [],
        ctaText: 'اطلب الآن بالدفع عند الاستلام',
        rating: 4.9,
        reviewCount: 150,
        ...(existingProduct || {}),
        ...incoming,
        _id: productId,
        name: incoming.name.trim(),
        slug: uniqueSlug,
        price: Math.max(0, Number(incoming.price) || 0),
        compareAtPrice: Math.max(0, Number(incoming.compareAtPrice ?? incoming.comparePrice) || 0),
        comparePrice: Math.max(0, Number(incoming.comparePrice ?? incoming.compareAtPrice) || 0),
        images: persistedImages,
        descriptionImages: persistedDescriptionImages,
        ogImage: rawOgImage,
        status: resolvedStatus,
        isPublished: resolvedPublished,
        createdAt: existingProduct?.createdAt || serverNow,
        updatedAt: serverNow,
      };

      if (existingIdx !== -1) {
        serverDb.products[existingIdx] = authoritativeProduct;
      } else {
        serverDb.products.unshift(authoritativeProduct);
      }

      saveServerDatabase(serverDb);
      res.json({ ok: true, product: authoritativeProduct, serverTime: serverNow });
    } catch (err: any) {
      console.error('Error saving product:', err);
      res.status(500).json({
        ok: false,
        error: err?.message || 'حدث خطأ في الخادم أثناء حفظ المنتج',
      });
    }
  });

  // 6. Product Delete / Archive Endpoint (protects products that have existing orders)
  app.delete('/api/db/product/:id', (req, res) => {
    const id = req.params.id;
    const forceArchive = req.query.archive === 'true';
    const idx = serverDb.products.findIndex((p) => p._id === id);

    if (idx === -1) {
      res.json({ ok: true, deleted: false, archived: false });
      return;
    }

    const hasDependentOrders = serverDb.orders.some((o) => o.productId === id);

    if (hasDependentOrders || forceArchive) {
      // Soft-delete (archive) so existing orders and historical analytics never break
      serverDb.products[idx] = {
        ...serverDb.products[idx],
        status: 'ARCHIVED',
        isPublished: false,
        updatedAt: Date.now(),
      };
      saveServerDatabase(serverDb);
      res.json({
        ok: true,
        deleted: false,
        archived: true,
        product: serverDb.products[idx],
      });
      return;
    }

    serverDb.products = serverDb.products.filter((p) => p._id !== id);
    saveServerDatabase(serverDb);
    res.json({ ok: true, deleted: true, archived: false });
  });

  // 7. Authoritative Order Creation & Validation Endpoint
  app.post('/api/db/order', (req, res) => {
    const serverNow = Date.now();
    const incomingOrder = req.body?.order as Order | undefined;
    const incomingHistory = req.body?.statusHistory as OrderStatusHistory | undefined;
    const incomingEvent = req.body?.orderEvent as AnalyticsEvent | undefined;

    if (!incomingOrder || !incomingOrder._id || !incomingOrder.productId) {
      res.status(400).json({ ok: false, error: 'Invalid order payload' });
      return;
    }

    if (isLegacyFakeOrder(incomingOrder)) {
      res.status(400).json({ ok: false, error: 'Fake/seed orders are forbidden' });
      return;
    }

    // Validate required customer fields
    if (
      !incomingOrder.customerName?.trim() ||
      !incomingOrder.phone?.trim() ||
      !incomingOrder.city?.trim() ||
      !incomingOrder.address?.trim()
    ) {
      res.status(400).json({
        ok: false,
        error: 'الرجاء ملء جميع بيانات الزبون المطلوبة (Name, Phone, City, Address required)',
      });
      return;
    }

    // Validate product exists (if product was created directly in Convex Cloud, use its price/name from order or serverDb)
    let product = serverDb.products.find((p) => p._id === incomingOrder.productId);
    if (!product) {
      product = {
        _id: incomingOrder.productId,
        name: incomingOrder.productName || 'Product',
        slug: `prod-${incomingOrder.productId}`,
        shortDescription: '',
        description: '',
        price:
          Math.max(1, Number(incomingOrder.total || incomingOrder.amount) || 0) /
          Math.max(1, Number(incomingOrder.quantity) || 1),
        compareAtPrice: 0,
        currency: incomingOrder.currency || serverDb.settings.defaultCurrency || 'DH',
        images: incomingOrder.productImage ? [incomingOrder.productImage] : [],
        templateId: 'classic-cod',
        offerText: '',
        shippingText: '',
        returnPolicy: '',
        benefits: [],
        variants: [],
        ctaText: 'اطلب الآن بالدفع عند الاستلام',
        isPublished: true,
        status: 'ACTIVE',
        rating: 4.9,
        reviewCount: 150,
        createdAt: serverNow,
        updatedAt: serverNow,
      };
      serverDb.products.push(product);
    }

    if (getProductStatus(product) !== 'ACTIVE') {
      res.status(400).json({
        ok: false,
        error: 'هذا المنتج غير متاح للطلب حالياً (Product is not active)',
      });
      return;
    }

    const safeQuantity = Math.max(1, Math.floor(Number(incomingOrder.quantity) || 1));

    // Authoritative price calculation from product in server DB
    const authoritativeTotal = computeAuthoritativeOrderTotal(
      product,
      safeQuantity,
      incomingOrder.variants
    );
    const authoritativeCurrency =
      product.currency ||
      incomingOrder.currency ||
      serverDb.settings.defaultCurrency ||
      'DH';

    const authoritativeOrder: Order = {
      ...incomingOrder,
      productName: product.name,
      productImage: product.images[0] || '',
      customerName: incomingOrder.customerName.trim(),
      phone: incomingOrder.phone.trim(),
      city: incomingOrder.city.trim(),
      address: incomingOrder.address.trim(),
      quantity: safeQuantity,
      total: authoritativeTotal,
      amount: authoritativeTotal,
      currency: authoritativeCurrency,
      createdAt: serverNow,
      updatedAt: serverNow,
    };

    const idx = serverDb.orders.findIndex((o) => o._id === authoritativeOrder._id);
    if (idx !== -1) {
      serverDb.orders[idx] = authoritativeOrder;
    } else {
      serverDb.orders.unshift(authoritativeOrder);
    }

    // Decrement product stock if scarcity is enabled
    if (product.scarcityEnabled && product.stockQuantity && product.stockQuantity > 0) {
      product.stockQuantity = Math.max(0, product.stockQuantity - safeQuantity);
      product.updatedAt = serverNow;
    }

    // Record status history
    const histId = incomingHistory?._id || 'osh_' + authoritativeOrder._id + '_init';
    if (!serverDb.orderStatusHistory.some((h) => h._id === histId)) {
      serverDb.orderStatusHistory.push({
        _id: histId,
        orderId: authoritativeOrder._id,
        orderNumber: authoritativeOrder.orderNumber,
        productId: authoritativeOrder.productId,
        previousStatus: null,
        newStatus: authoritativeOrder.status || 'NEW',
        timestamp: serverNow,
      });
    }

    // Record ORDER_CREATED event with authoritative server timestamp & validated amount
    const orderEvtId =
      incomingEvent?.clientEventId ||
      incomingOrder.eventId ||
      `ev_ord_${authoritativeOrder._id}`;
    if (
      !serverDb.analyticsEvents.some(
        (e) => e.clientEventId === orderEvtId || e.eventId === orderEvtId
      )
    ) {
      serverDb.analyticsEvents.push({
        _id: incomingEvent?._id || 'evt_ord_' + authoritativeOrder._id,
        eventId: orderEvtId,
        clientEventId: orderEvtId,
        eventType: 'ORDER_CREATED',
        visitorId: authoritativeOrder.visitorId || 'v_anonymous',
        sessionId: authoritativeOrder.sessionId || 's_anonymous',
        productId: authoritativeOrder.productId,
        timestamp: serverNow,
        createdAt: serverNow,
        pageUrl: `/p/${product.slug}`,
        referrer: '',
        utmSource: authoritativeOrder.utmSource || '',
        utmMedium: authoritativeOrder.utmMedium || '',
        utmCampaign: authoritativeOrder.utmCampaign || '',
        utmContent: authoritativeOrder.utmContent || '',
        utmTerm: authoritativeOrder.utmTerm || '',
        metadata: {
          orderId: authoritativeOrder._id,
          orderNumber: authoritativeOrder.orderNumber,
          amount: authoritativeOrder.total,
          currency: authoritativeOrder.currency,
          quantity: authoritativeOrder.quantity,
          city: authoritativeOrder.city,
        },
      });
    }

    saveServerDatabase(serverDb);
    res.json({ ok: true, order: authoritativeOrder, serverTime: serverNow });
  });

  // 8. Authoritative Order Status Change Endpoint
  app.post('/api/db/order-status', (req, res) => {
    const serverNow = Date.now();
    const { orderId, status, historyEntry, lifecycleEvent } = req.body || {};

    if (!orderId || !status) {
      res.status(400).json({ ok: false, error: 'Missing orderId or status' });
      return;
    }

    const idx = serverDb.orders.findIndex((o) => o._id === orderId);
    if (idx === -1) {
      res.status(404).json({ ok: false, error: 'Order not found' });
      return;
    }

    const prevStatus = serverDb.orders[idx].status;
    serverDb.orders[idx] = {
      ...serverDb.orders[idx],
      status: status as OrderStatus,
      updatedAt: serverNow,
    };

    const ord = serverDb.orders[idx];

    // Append status history record
    const hist: OrderStatusHistory = {
      _id: historyEntry?._id || `osh_${orderId}_${serverNow.toString(36)}`,
      orderId: ord._id,
      orderNumber: ord.orderNumber,
      productId: ord.productId,
      previousStatus: prevStatus,
      newStatus: status as OrderStatus,
      timestamp: serverNow,
    };
    if (!serverDb.orderStatusHistory.some((h) => h._id === hist._id)) {
      serverDb.orderStatusHistory.push(hist);
    }

    // Append lifecycle event if applicable
    const statusEventMap: Partial<Record<OrderStatus, AnalyticsEventType>> = {
      CONFIRMED: 'ORDER_CONFIRMED',
      CANCELLED: 'ORDER_CANCELLED',
      DELIVERED: 'ORDER_DELIVERED',
      FAILED: 'ORDER_FAILED',
    };
    const evtType = lifecycleEvent?.eventType || statusEventMap[status as OrderStatus];
    if (evtType) {
      const evtKey =
        lifecycleEvent?.clientEventId ||
        lifecycleEvent?.eventId ||
        `ev_status_${ord._id}_${status}_${serverNow.toString(36)}`;
      if (
        !serverDb.analyticsEvents.some(
          (e) => e.clientEventId === evtKey || e.eventId === evtKey
        )
      ) {
        serverDb.analyticsEvents.push({
          _id:
            lifecycleEvent?._id ||
            `evt_${serverNow.toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
          eventId: evtKey,
          clientEventId: evtKey,
          eventType: evtType,
          visitorId: ord.visitorId || 'v_anonymous',
          sessionId: ord.sessionId || 's_anonymous',
          productId: ord.productId,
          timestamp: serverNow,
          createdAt: serverNow,
          pageUrl: '/admin/orders',
          referrer: '',
          utmSource: ord.utmSource || '',
          utmMedium: ord.utmMedium || '',
          utmCampaign: ord.utmCampaign || '',
          utmContent: ord.utmContent || '',
          utmTerm: ord.utmTerm || '',
          metadata: {
            orderId: ord._id,
            orderNumber: ord.orderNumber,
            previousStatus: prevStatus,
            newStatus: status,
            amount: ord.total,
            currency: ord.currency,
          },
        });
      }
    }

    saveServerDatabase(serverDb);
    res.json({ ok: true, order: ord, historyEntry: hist, serverTime: serverNow });
  });

  // 9. Delete an order (or bulk delete orders) and clean up associated history & events
  const purgeOrdersFromServerDb = (idsToRemove: Set<string>) => {
    serverDb.orders = serverDb.orders.filter((o) => !idsToRemove.has(o._id));
    serverDb.orderStatusHistory = serverDb.orderStatusHistory.filter(
      (h) => !idsToRemove.has(h.orderId)
    );
    serverDb.analyticsEvents = serverDb.analyticsEvents.filter((e) => {
      const metaOrderId = e.metadata?.orderId ? String(e.metadata.orderId) : '';
      if (metaOrderId && idsToRemove.has(metaOrderId)) return false;
      if (e._id && e._id.startsWith('evt_ord_')) {
        const extracted = e._id.replace('evt_ord_', '');
        if (idsToRemove.has(extracted)) return false;
      }
      return true;
    });
    saveServerDatabase(serverDb);
  };

  app.delete('/api/db/order/:id', (req, res) => {
    const id = req.params.id;
    if (id) {
      purgeOrdersFromServerDb(new Set([id]));
    }
    res.json({ ok: true });
  });

  app.post('/api/db/orders/bulk-delete', (req, res) => {
    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds.map(String) : [];
    if (orderIds.length > 0) {
      purgeOrdersFromServerDb(new Set(orderIds));
    }
    res.json({ ok: true, deletedCount: orderIds.length });
  });

  // 10. Update settings
  app.post('/api/db/settings', (req, res) => {
    const settings = req.body?.settings as Partial<StoreSettings> | undefined;
    if (settings) {
      serverDb.settings = { ...serverDb.settings, ...settings };
      saveServerDatabase(serverDb);
    }
    res.json({ ok: true, settings: serverDb.settings });
  });

  // 11. Clear analytics & orders (clean slate without fake data)
  app.post('/api/db/clear-analytics', (req, res) => {
    const resetProducts = Boolean(req.body?.resetProducts);
    if (resetProducts) {
      serverDb.products = [];
    }
    serverDb.orders = [];
    serverDb.orderStatusHistory = [];
    serverDb.visitors = [];
    serverDb.sessions = [];
    serverDb.analyticsEvents = [];
    serverDb.settings = { ...INITIAL_SETTINGS };
    saveServerDatabase(serverDb);
    res.json({ ok: true });
  });

  // 12. ISOLATED AYA AI LANDING PAGE AGENT ENDPOINT (ProductionAIProvider)
  // Does not touch or mutate serverDb (products, orders, analytics, or settings).
  app.post('/api/aya-agent/generate', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        ok: false,
        error:
          'GEMINI_API_KEY is not configured on the server. Use DemoAIProvider mode to test the full isolated AYA workflow.',
      });
      return;
    }

    const { systemInstruction, prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ ok: false, error: 'Missing generation prompt.' });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            typeof systemInstruction === 'string' ? systemInstruction : undefined,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.OBJECT,
                properties: {
                  detectedCategory: { type: Type.STRING },
                  isRegulatedHealthOrCosmetic: { type: Type.BOOLEAN },
                  targetCustomer: { type: Type.STRING },
                  customerProblem: { type: Type.STRING },
                  customerDesire: { type: Type.STRING },
                  buyingMotivation: { type: Type.STRING },
                  objections: { type: Type.ARRAY, items: { type: Type.STRING } },
                  productBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                  emotionalAngle: { type: Type.STRING },
                  practicalAngle: { type: Type.STRING },
                  offerPositioning: { type: Type.STRING },
                  urgencyMechanism: { type: Type.STRING },
                  trustRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  ctaStrategy: { type: Type.STRING },
                  landingPageStructure: { type: Type.ARRAY, items: { type: Type.STRING } },
                  appliedSkillsFromZip: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: [
                  'detectedCategory',
                  'isRegulatedHealthOrCosmetic',
                  'targetCustomer',
                  'customerProblem',
                  'customerDesire',
                  'buyingMotivation',
                  'objections',
                  'productBenefits',
                  'emotionalAngle',
                  'practicalAngle',
                  'offerPositioning',
                  'urgencyMechanism',
                  'trustRequirements',
                  'ctaStrategy',
                  'landingPageStructure',
                  'appliedSkillsFromZip',
                ],
              },
              strategy: {
                type: Type.OBJECT,
                properties: {
                  targetAudience: { type: Type.STRING },
                  mainProblem: { type: Type.STRING },
                  desiredOutcome: { type: Type.STRING },
                  mainAngle: { type: Type.STRING },
                  secondaryAngles: { type: Type.ARRAY, items: { type: Type.STRING } },
                  objections: { type: Type.ARRAY, items: { type: Type.STRING } },
                  keyBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                  offerStrategy: { type: Type.STRING },
                  ctaStrategy: { type: Type.STRING },
                  socialProofStrategy: { type: Type.STRING },
                  urgencyStrategy: { type: Type.STRING },
                },
                required: [
                  'targetAudience',
                  'mainProblem',
                  'desiredOutcome',
                  'mainAngle',
                  'secondaryAngles',
                  'objections',
                  'keyBenefits',
                  'offerStrategy',
                  'ctaStrategy',
                  'socialProofStrategy',
                  'urgencyStrategy',
                ],
              },
              blueprint: {
                type: Type.OBJECT,
                properties: {
                  hero: {
                    type: Type.OBJECT,
                    properties: {
                      hook: { type: Type.STRING },
                      headline: { type: Type.STRING },
                      subheadline: { type: Type.STRING },
                      cta: { type: Type.STRING },
                      visualDirection: { type: Type.STRING },
                    },
                    required: ['hook', 'headline', 'subheadline', 'cta', 'visualDirection'],
                  },
                  problem: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      body: { type: Type.STRING },
                    },
                    required: ['headline', 'body'],
                  },
                  benefits: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                      },
                      required: ['title', 'description'],
                    },
                  },
                  solution: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      body: { type: Type.STRING },
                    },
                    required: ['headline', 'body'],
                  },
                  howItWorks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        stepNumber: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                      },
                      required: ['stepNumber', 'title', 'description'],
                    },
                  },
                  socialProof: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      isPlaceholderRecommendation: { type: Type.BOOLEAN },
                      recommendationNote: { type: Type.STRING },
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            content: { type: Type.STRING },
                            verificationType: { type: Type.STRING },
                          },
                          required: ['label', 'content', 'verificationType'],
                        },
                      },
                    },
                    required: [
                      'headline',
                      'isPlaceholderRecommendation',
                      'recommendationNote',
                      'items',
                    ],
                  },
                  offer: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      price: { type: Type.STRING },
                      oldPrice: { type: Type.STRING },
                      discount: { type: Type.STRING },
                      bonuses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['headline', 'price', 'oldPrice', 'discount', 'bonuses'],
                  },
                  faq: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        answer: { type: Type.STRING },
                      },
                      required: ['question', 'answer'],
                    },
                  },
                  finalCta: {
                    type: Type.OBJECT,
                    properties: {
                      headline: { type: Type.STRING },
                      body: { type: Type.STRING },
                      button: { type: Type.STRING },
                    },
                    required: ['headline', 'body', 'button'],
                  },
                },
                required: [
                  'hero',
                  'problem',
                  'benefits',
                  'solution',
                  'howItWorks',
                  'socialProof',
                  'offer',
                  'faq',
                  'finalCta',
                ],
              },
              safetyComplianceNotes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['analysis', 'strategy', 'blueprint', 'safetyComplianceNotes'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        res.status(500).json({ ok: false, error: 'Empty response from Gemini model.' });
        return;
      }

      const parsed = JSON.parse(rawText.trim());
      res.json({ ok: true, result: parsed });
    } catch (err: any) {
      console.error('AYA Gemini generation error:', err);
      res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to generate AYA landing page blueprint.',
      });
    }
  });

  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
