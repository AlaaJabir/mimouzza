import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS, INITIAL_TEMPLATES } from './convex/db';
import type { Product, Order, StoreSettings, Template } from './convex/schema';

const DB_FILE_PATH = path.resolve(process.cwd(), '.convex-server-db.json');

interface ServerDatabaseState {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  templates: Template[];
  updatedAt: number;
}

function loadServerDatabase(): ServerDatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products)) {
        return {
          products: parsed.products,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [...INITIAL_ORDERS],
          settings: parsed.settings ? { ...INITIAL_SETTINGS, ...parsed.settings } : { ...INITIAL_SETTINGS },
          templates: Array.isArray(parsed.templates) ? parsed.templates : [...INITIAL_TEMPLATES],
          updatedAt: parsed.updatedAt || Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn('Could not load .convex-server-db.json, initializing fresh state:', err);
  }

  const initial: ServerDatabaseState = {
    products: [...INITIAL_PRODUCTS],
    orders: [...INITIAL_ORDERS],
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // High payload limit to support multiple base64 compressed images in products & descriptionImages
  app.use(express.json({ limit: '50mb' }));

  // 1. Get full shared state (used by desktop & mobile browsers to stay in sync)
  app.get('/api/db/state', (_req, res) => {
    res.json({
      ok: true,
      products: serverDb.products,
      orders: serverDb.orders,
      settings: serverDb.settings,
      templates: serverDb.templates,
      updatedAt: serverDb.updatedAt,
    });
  });

  // 2. Get single product by slug or ID (used when opening /p/:slug on mobile phone)
  app.get('/api/db/product/:slug', (req, res) => {
    const target = normalizeSlug(req.params.slug || '');
    const found =
      serverDb.products.find(
        (p) => normalizeSlug(p.slug) === target || p._id.toLowerCase() === target
      ) || null;
    res.json({ ok: true, product: found });
  });

  // 3. Bidirectional sync endpoint: merges client products/orders/settings with server state
  app.post('/api/db/sync', (req, res) => {
    const { products, orders, settings } = req.body || {};
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
        orderMap.set(o._id, o);
      }
      for (const clientOrd of orders as Order[]) {
        if (!clientOrd || !clientOrd._id) continue;
        const existing = orderMap.get(clientOrd._id);
        if (!existing || existing.status !== clientOrd.status) {
          orderMap.set(clientOrd._id, clientOrd);
          changed = true;
        }
      }
      serverDb.orders = Array.from(orderMap.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );
    }

    if (settings && typeof settings === 'object') {
      serverDb.settings = { ...serverDb.settings, ...settings };
      changed = true;
    }

    if (changed) {
      saveServerDatabase(serverDb);
    }

    res.json({
      ok: true,
      products: serverDb.products,
      orders: serverDb.orders,
      settings: serverDb.settings,
    });
  });

  // 4. Upsert a single product (create or update)
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

  // 5. Delete a product
  app.delete('/api/db/product/:id', (req, res) => {
    const id = req.params.id;
    serverDb.products = serverDb.products.filter((p) => p._id !== id);
    saveServerDatabase(serverDb);
    res.json({ ok: true });
  });

  // 6. Upsert an order (create or status update)
  app.post('/api/db/order', (req, res) => {
    const order = req.body?.order as Order | undefined;
    if (!order || !order._id) {
      res.status(400).json({ ok: false, error: 'Invalid order payload' });
      return;
    }

    const idx = serverDb.orders.findIndex((o) => o._id === order._id);
    if (idx !== -1) {
      serverDb.orders[idx] = order;
    } else {
      serverDb.orders.unshift(order);
    }
    saveServerDatabase(serverDb);
    res.json({ ok: true, order });
  });

  // 7. Delete an order
  app.delete('/api/db/order/:id', (req, res) => {
    const id = req.params.id;
    serverDb.orders = serverDb.orders.filter((o) => o._id !== id);
    saveServerDatabase(serverDb);
    res.json({ ok: true });
  });

  // 8. Update settings
  app.post('/api/db/settings', (req, res) => {
    const settings = req.body?.settings as Partial<StoreSettings> | undefined;
    if (settings) {
      serverDb.settings = { ...serverDb.settings, ...settings };
      saveServerDatabase(serverDb);
    }
    res.json({ ok: true, settings: serverDb.settings });
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
