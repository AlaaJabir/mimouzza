import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_TEMPLATES,
  isLegacyFakeOrder,
  isLegacyFakeEvent,
  computeAuthoritativeOrderTotal,
} from './convex/db';
import type {
  Product,
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

function cleanCampaignAdSpends(spends?: Record<string, number>): Record<string, number> {
  if (!spends || typeof spends !== 'object') return {};
  const cleaned = { ...spends };
  // Remove legacy hardcoded seed campaign ad spends if untouched
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
              campaignAdSpends: cleanCampaignAdSpends(parsed.settings.campaignAdSpends),
            }
          : { ...INITIAL_SETTINGS };

        const state: ServerDatabaseState = {
          products: parsed.products,
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

function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim().toLowerCase();
  } catch {
    return slug.trim().toLowerCase();
  }
}

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
    if (!existing.referrer && s.referrer) existing.referrer = s.referrer;
  }
  return existing;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // High payload limit to support base64 compressed images in products & descriptionImages
  app.use(express.json({ limit: '50mb' }));

  // 1. Get full shared state
  app.get('/api/db/state', (_req, res) => {
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

  // 2. Get single product by slug or ID
  app.get('/api/db/product/:slug', (req, res) => {
    const target = normalizeSlug(req.params.slug || '');
    const found =
      serverDb.products.find(
        (p) => normalizeSlug(p.slug) === target || p._id.toLowerCase() === target
      ) || null;
    res.json({ ok: true, product: found });
  });

  // 3. Bidirectional sync endpoint
  app.post('/api/db/sync', (req, res) => {
    const {
      products,
      orders,
      orderStatusHistory,
      visitors,
      sessions,
      analyticsEvents,
      settings,
    } = req.body || {};
    let changed = false;

    if (Array.isArray(products) && products.length > 0) {
      const byId = new Map<string, Product>();
      const bySlug = new Map<string, Product>();

      for (const p of serverDb.products) {
        byId.set(p._id, p);
        bySlug.set(normalizeSlug(p.slug), p);
      }

      for (const clientProd of products as Product[]) {
        if (!clientProd || !clientProd._id || !clientProd.slug) continue;
        const normSlug = normalizeSlug(clientProd.slug);
        const existing = byId.get(clientProd._id) || bySlug.get(normSlug);
        if (!existing) {
          byId.set(clientProd._id, clientProd);
          bySlug.set(normSlug, clientProd);
          changed = true;
        } else if ((clientProd.updatedAt || 0) > (existing.updatedAt || 0)) {
          byId.delete(existing._id);
          byId.set(clientProd._id, clientProd);
          bySlug.set(normSlug, clientProd);
          changed = true;
        }
      }

      serverDb.products = Array.from(byId.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
    }

    if (Array.isArray(orders) && orders.length > 0) {
      const orderMap = new Map<string, Order>();
      for (const o of serverDb.orders) {
        if (!isLegacyFakeOrder(o)) orderMap.set(o._id, o);
      }
      for (const clientOrd of orders as Order[]) {
        if (!clientOrd || !clientOrd._id || isLegacyFakeOrder(clientOrd)) continue;
        const existing = orderMap.get(clientOrd._id);
        if (
          !existing ||
          existing.status !== clientOrd.status ||
          (clientOrd.updatedAt || 0) > (existing.updatedAt || 0)
        ) {
          orderMap.set(clientOrd._id, clientOrd);
          changed = true;
        }
      }
      serverDb.orders = Array.from(orderMap.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
    }

    if (Array.isArray(orderStatusHistory) && orderStatusHistory.length > 0) {
      const histMap = new Map<string, OrderStatusHistory>();
      for (const h of serverDb.orderStatusHistory) {
        histMap.set(h._id, h);
      }
      for (const clientHist of orderStatusHistory as OrderStatusHistory[]) {
        if (!clientHist || !clientHist._id) continue;
        if (!histMap.has(clientHist._id)) {
          histMap.set(clientHist._id, clientHist);
          changed = true;
        }
      }
      serverDb.orderStatusHistory = Array.from(histMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
    }

    if (Array.isArray(visitors) && visitors.length > 0) {
      const visMap = new Map<string, Visitor>();
      for (const v of serverDb.visitors) {
        visMap.set(v.visitorId, v);
      }
      for (const clientVis of visitors as Visitor[]) {
        if (!clientVis || !clientVis.visitorId) continue;
        const ex = visMap.get(clientVis.visitorId);
        if (!ex) {
          visMap.set(clientVis.visitorId, clientVis);
          changed = true;
        } else if (clientVis.lastSeenAt > ex.lastSeenAt) {
          ex.lastSeenAt = clientVis.lastSeenAt;
          changed = true;
        }
      }
      serverDb.visitors = Array.from(visMap.values());
    }

    if (Array.isArray(sessions) && sessions.length > 0) {
      const sessMap = new Map<string, AnalyticsSession>();
      for (const s of serverDb.sessions) {
        sessMap.set(s.sessionId, s);
      }
      for (const clientSess of sessions as AnalyticsSession[]) {
        if (
          !clientSess ||
          !clientSess.sessionId ||
          clientSess.sessionId.startsWith('sess_gen_') ||
          clientSess.sessionId.startsWith('sess_seed_')
        ) {
          continue;
        }
        const ex = sessMap.get(clientSess.sessionId);
        if (!ex) {
          sessMap.set(clientSess.sessionId, clientSess);
          changed = true;
        } else if (clientSess.lastSeenAt > ex.lastSeenAt) {
          ex.lastSeenAt = clientSess.lastSeenAt;
          changed = true;
        }
      }
      serverDb.sessions = Array.from(sessMap.values());
    }

    if (Array.isArray(analyticsEvents) && analyticsEvents.length > 0) {
      const evtMap = new Map<string, AnalyticsEvent>();
      for (const e of serverDb.analyticsEvents) {
        if (!isLegacyFakeEvent(e)) {
          evtMap.set(e.clientEventId || e.eventId || e._id, e);
        }
      }
      for (const clientEvt of analyticsEvents as AnalyticsEvent[]) {
        if (!clientEvt || isLegacyFakeEvent(clientEvt)) continue;
        const key = clientEvt.clientEventId || clientEvt.eventId || clientEvt._id;
        if (!key) continue;
        if (!evtMap.has(key)) {
          evtMap.set(key, clientEvt);
          changed = true;
        }
      }
      serverDb.analyticsEvents = Array.from(evtMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
    }

    if (settings && typeof settings === 'object') {
      const cleanedSpends = cleanCampaignAdSpends(settings.campaignAdSpends);
      serverDb.settings = {
        ...serverDb.settings,
        ...settings,
        campaignAdSpends: {
          ...(serverDb.settings.campaignAdSpends || {}),
          ...cleanedSpends,
        },
      };
      changed = true;
    }

    if (changed) {
      saveServerDatabase(serverDb);
    }

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
      _id: event._id || 'evt_' + serverNow.toString(36) + '_' + Math.random().toString(36).substring(2, 8),
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

  // 5. Upsert a single product (create or update)
  app.post('/api/db/product', (req, res) => {
    const product = req.body?.product as Product | undefined;
    if (!product || !product._id) {
      res.status(400).json({ ok: false, error: 'Invalid product payload' });
      return;
    }

    const idx = serverDb.products.findIndex(
      (p) => p._id === product._id || normalizeSlug(p.slug) === normalizeSlug(product.slug)
    );
    if (idx !== -1) {
      serverDb.products[idx] = product;
    } else {
      serverDb.products.unshift(product);
    }
    saveServerDatabase(serverDb);
    res.json({ ok: true, product });
  });

  // 6. Delete a product
  app.delete('/api/db/product/:id', (req, res) => {
    const id = req.params.id;
    serverDb.products = serverDb.products.filter((p) => p._id !== id);
    saveServerDatabase(serverDb);
    res.json({ ok: true });
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

    const product = serverDb.products.find((p) => p._id === incomingOrder.productId);
    const safeQuantity = Math.max(1, Math.floor(Number(incomingOrder.quantity) || 1));

    // Authoritative price calculation from product in server DB
    const authoritativeTotal = product
      ? computeAuthoritativeOrderTotal(product, safeQuantity, incomingOrder.variants)
      : Math.max(0, Number(incomingOrder.total) || 0);
    const authoritativeCurrency =
      product?.currency ||
      incomingOrder.currency ||
      serverDb.settings.defaultCurrency ||
      'DH';

    const authoritativeOrder: Order = {
      ...incomingOrder,
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
    const orderEvtId = incomingEvent?.clientEventId || incomingOrder.eventId || `ev_ord_${authoritativeOrder._id}`;
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
        pageUrl: product ? `/p/${product.slug}` : `/p/${authoritativeOrder.productId}`,
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
          _id: lifecycleEvent?._id || `evt_${serverNow.toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
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

  // 9. Delete an order
  app.delete('/api/db/order/:id', (req, res) => {
    const id = req.params.id;
    serverDb.orders = serverDb.orders.filter((o) => o._id !== id);
    saveServerDatabase(serverDb);
    res.json({ ok: true });
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
      serverDb.products = [...INITIAL_PRODUCTS];
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
