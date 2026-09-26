/**
 * Authoritative Reactive Store & Server/Convex Cloud Sync Layer
 * Connected to: https://valuable-emu-538.convex.cloud & Authoritative Backend (/api/db/*)
 *
 * Strict Production Rules:
 *   - ZERO fake, mock, random, seed, or hardcoded products, orders, or analytics data.
 *   - ZERO localStorage or sessionStorage or IndexedDB used as product/order/analytics database.
 *   - Authoritative persistence is handled by the backend database (/api/db/* -> .convex-server-db.json)
 *     and Convex Cloud.
 */

import {
  Product,
  ProductStatus,
  Order,
  OrderStatus,
  OrderStatusHistory,
  Visitor,
  AnalyticsSession,
  Template,
  StoreSettings,
  AnalyticsEvent,
  AnalyticsEventType,
} from './schema';

export const DEFAULT_CONVEX_CLOUD_URL = 'https://valuable-emu-538.convex.cloud';

const CONVEX_URL_STORAGE_KEY = 'cod_convex_cloud_url_v4';

export const INITIAL_TEMPLATES: Template[] = [
  {
    _id: 'tpl_1',
    id: 'classic-cod',
    name: 'Classic COD',
    slug: 'classic-cod',
    description:
      'Product-focused layout with large hero visual, immediate social proof, benefit badges, high-converting offer banner, and direct COD checkout form.',
    previewImage:
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    tag: 'Highest Converting for Ads',
    features: [
      'Top Trust Announcement Bar',
      'Interactive Image Carousel',
      'Urgency Discount Badge',
      'Sticky Mobile Order CTA',
      'One-Click Cash on Delivery Form',
    ],
    active: true,
  },
  {
    _id: 'tpl_2',
    id: 'premium',
    name: 'Premium Product',
    slug: 'premium',
    description:
      'Editorial luxury design with sleek typography, generous spacing, detailed craftsmanship showcase, specifications grid, and high-trust checkout module.',
    previewImage:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    tag: 'Luxury & Electronics',
    features: [
      'Split Hero Showcase',
      'Minimalist Aesthetic',
      'Product Feature Highlights',
      'Interactive Variant Chips',
      'Premium Guarantee Badges',
    ],
    active: true,
  },
  {
    _id: 'tpl_3',
    id: 'big-offer',
    name: 'Big Offer',
    slug: 'big-offer',
    description:
      'Aggressive sales page with live countdown timer, limited stock urgency indicators, massive savings comparison, and prominent multi-variant selection.',
    previewImage:
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    tag: 'Flash Sales & Bundles',
    features: [
      'Configurable Countdown Timer',
      'Configurable Stock Scarcity Warning',
      'Price Comparison Strikethrough',
      'Dual CTA Triggers',
      'Highlight Testimonial Proof',
    ],
    active: true,
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  _id: 'settings_default',
  storeName: 'COD Express Maroc',
  defaultCurrency: 'DH',
  defaultShippingText: 'التوصيل مجاني لجميع مدن المغرب الدفع عند الاستلام',
  defaultReturnPolicy: 'ضمان الاسترجاع والاستبدال خلال 14 يوماً',
  moroccoCities: [
    'الدار البيضاء (Casablanca)',
    'الرباط (Rabat)',
    'مراكش (Marrakech)',
    'فاس (Fès)',
    'طنجة (Tanger)',
    'أكادير (Agadir)',
    'مكناس (Meknès)',
    'وجدة (Oujda)',
    'القنيطرة (Kénitra)',
    'تطوان (Tétouan)',
    'تمارة (Témara)',
    'الجديدة (El Jadida)',
    'آسفي (Safi)',
    'المحمدية (Mohammédia)',
    'بني ملال (Béni Mellal)',
    'خريبكة (Khouribga)',
    'الناظور (Nador)',
    'تازة (Taza)',
    'سطات (Settat)',
    'برشيد (Berrechid)',
    'كلميم (Guelmim)',
    'العيون (Laâyoune)',
    'مدينة أخرى بالمغرب',
  ],
  contactPhone: '+212 661-234567',
  metaPixelId: '',
  enableMetaPixel: false,
  tiktokPixelId: '',
  enableTikTokPixel: false,
  googleAnalyticsId: '',
  enableGoogleAnalytics: false,
  campaignAdSpends: {},
};

// ZERO HARDCODED DEMO PRODUCTS OR ORDERS IN PRODUCTION
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_ORDERS: Order[] = [];

/**
 * Identifies legacy hardcoded seed/demo products so they are never served in production.
 */
export function isLegacySeedProduct(product: Partial<Product> | null | undefined): boolean {
  if (!product) return true;
  const legacyIds = new Set(['prod_beauty_1', 'prod_electronics_2', 'prod_fashion_3']);
  const legacySlugs = new Set([
    'elixir-argan-rose-7in1',
    'prosound-ultra-anc',
    'chronoprecision-aviator',
  ]);
  if (product._id && legacyIds.has(product._id)) return true;
  if (
    product.slug &&
    legacySlugs.has(product.slug.trim().toLowerCase()) &&
    product.createdAt === 1790000000000
  ) {
    return true;
  }
  return false;
}

/**
 * Filter out any legacy demo/fake orders that might exist in old storage or remote DB.
 */
export function isLegacyFakeOrder(order: Partial<Order> | null | undefined): boolean {
  if (!order) return true;
  const fakeIds = new Set(['ord_1', 'ord_2', 'ord_3', 'ord_4', 'ord_5']);
  const fakeNums = new Set(['COD-1048', 'COD-1047', 'COD-1046', 'COD-1045', 'COD-1044']);
  if (order._id && fakeIds.has(order._id)) return true;
  if (order.orderNumber && fakeNums.has(order.orderNumber)) return true;
  if (order.sessionId && order.sessionId.startsWith('sess_seed_')) return true;
  return false;
}

export function isLegacyFakeEvent(evt: Partial<AnalyticsEvent> | null | undefined): boolean {
  if (!evt) return true;
  if (
    evt.sessionId &&
    (evt.sessionId.startsWith('sess_gen_') || evt.sessionId.startsWith('sess_seed_'))
  ) {
    return true;
  }
  if (evt._id && /^evt_\d+$/.test(evt._id)) {
    return true;
  }
  if (evt.metadata?.isTest === true || evt.metadata?.isPreview === true) {
    return true;
  }
  return false;
}

/**
 * Resolves authoritative ProductStatus ('ACTIVE' | 'DRAFT' | 'ARCHIVED').
 */
export function getProductStatus(product: Partial<Product> | null | undefined): ProductStatus {
  if (!product) return 'DRAFT';
  if (product.status === 'ARCHIVED') return 'ARCHIVED';
  if (product.status === 'DRAFT') return 'DRAFT';
  if (product.status === 'ACTIVE') return 'ACTIVE';
  return product.isPublished ? 'ACTIVE' : 'DRAFT';
}

/**
 * Normalizes a product slug consistently for storage and URL lookup.
 */
export function normalizeProductSlug(raw: string): string {
  try {
    return decodeURIComponent(raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_\u0600-\u06FF-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  } catch {
    return (raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

/**
 * Generates a guaranteed non-empty, unique slug across existing products.
 */
export function generateUniqueSlug(
  desiredSlugOrName: string,
  existingProducts: Product[],
  excludeProductId?: string
): string {
  let base = normalizeProductSlug(desiredSlugOrName);
  if (!base) {
    base = `product-${Date.now().toString(36).slice(-5)}`;
  }

  const takenSlugs = new Set(
    existingProducts
      .filter((p) => !excludeProductId || p._id !== excludeProductId)
      .map((p) => normalizeProductSlug(p.slug))
  );

  if (!takenSlugs.has(base)) {
    return base;
  }

  let counter = 2;
  while (takenSlugs.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}

/**
 * Authoritative backend order total calculation:
 * Validates unit price or bundle option price from the persisted Product record.
 * Never trusts unvalidated frontend revenue numbers.
 */
export function computeAuthoritativeOrderTotal(
  product: Product,
  quantity: number,
  variants?: Record<string, string>
): number {
  const safeQty = Math.max(1, Math.floor(Number(quantity) || 1));
  let unitOrBundlePrice = Number(product.price) || 0;

  if (variants && product.variants && Array.isArray(product.variants)) {
    for (const group of product.variants) {
      const chosen = variants[group.name];
      if (chosen && Array.isArray(group.options) && group.options.includes(chosen)) {
        const priceMatch = chosen.match(/\((\d+(?:\.\d+)?)\s*(?:DH|MAD|\$|€|د\.م)/i);
        if (priceMatch && priceMatch[1]) {
          const parsedPrice = Number(priceMatch[1]);
          if (parsedPrice > 0) {
            unitOrBundlePrice = parsedPrice;
          }
        }
      }
    }
  }

  return Math.round(unitOrBundlePrice * safeQty * 100) / 100;
}

// Broadcast Channel for multi-tab real-time reactivity (notifies tabs to re-fetch from server)
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('convex_reactive_sync_v4_server');
  } catch (err) {
    console.warn('BroadcastChannel not supported', err);
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifySubscribers(broadcast = true) {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
  if (broadcast && broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'MUTATION_OCCURRED', timestamp: Date.now() });
    } catch {}
  }
}

if (broadcastChannel) {
  broadcastChannel.onmessage = () => {
    void db.syncWithServer();
  };
}

export type ConvexConnectionStatus = 'connecting' | 'connected' | 'local_persisted' | 'error';

export class ConvexMemoryStore {
  private products: Product[] = [];
  private orders: Order[] = [];
  private orderStatusHistory: OrderStatusHistory[] = [];
  private visitors: Visitor[] = [];
  private sessions: AnalyticsSession[] = [];
  private templates: Template[] = [...INITIAL_TEMPLATES];
  private settings: StoreSettings = { ...INITIAL_SETTINGS };
  private analyticsEvents: AnalyticsEvent[] = [];

  public convexUrl: string = DEFAULT_CONVEX_CLOUD_URL;
  public connectionStatus: ConvexConnectionStatus = 'connecting';
  public lastSyncedAt: number | null = null;
  public isHydrated = false;
  private remoteFunctionsReady = false;
  private initialSyncPromise: Promise<void> | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') {
      this.isHydrated = true;
      return;
    }

    // Clean up all legacy localStorage / IndexedDB product & order caches so browser storage
    // is never used as a product/order/analytics database.
    try {
      const legacyKeys = [
        'cod_convex_products_v2',
        'cod_convex_orders_v2',
        'cod_convex_analytics_v2',
        'cod_convex_v2_init',
        'cod_convex_products_v3_real',
        'cod_convex_orders_v3_real',
        'cod_convex_order_history_v3_real',
        'cod_convex_visitors_v3_real',
        'cod_convex_sessions_v3_real',
        'cod_convex_templates_v3_real',
        'cod_convex_settings_v3_real',
        'cod_convex_analytics_v3_real',
        'cod_convex_v3_real_init',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
      if ('indexedDB' in window) {
        try {
          window.indexedDB.deleteDatabase('cod_convex_database_v3_real');
        } catch {}
      }
    } catch {}

    try {
      const envUrl = (import.meta as any).env?.VITE_CONVEX_URL;
      const savedUrl = localStorage.getItem(CONVEX_URL_STORAGE_KEY);
      this.convexUrl = savedUrl || envUrl || DEFAULT_CONVEX_CLOUD_URL;
    } catch {
      this.convexUrl = DEFAULT_CONVEX_CLOUD_URL;
    }

    // Authoritative pull from backend database (/api/db/state)
    this.initialSyncPromise = this.syncWithServer()
      .finally(() => {
        this.isHydrated = true;
        notifySubscribers(false);
        void this.syncWithConvexCloud();
      });

    // Periodic authoritative pull from backend server
    setInterval(() => {
      void this.syncWithServer();
      if (this.remoteFunctionsReady) {
        void this.syncWithConvexCloud();
      }
    }, 4000);
  }

  public async waitForHydration(): Promise<void> {
    if (this.isHydrated) return;
    if (this.initialSyncPromise) {
      await this.initialSyncPromise;
    }
  }

  /**
   * Authoritative pull from the server database (`GET /api/db/state`).
   * Never pushes local client arrays to overwrite server state.
   */
  public async syncWithServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/db/state', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ok) {
        if (Array.isArray(data.products)) {
          this.products = (data.products as Product[])
            .filter((p) => !isLegacySeedProduct(p))
            .map((p) => ({
              ...p,
              status: getProductStatus(p),
              isPublished: getProductStatus(p) === 'ACTIVE',
              comparePrice: p.comparePrice ?? p.compareAtPrice,
            }));
        }
        if (Array.isArray(data.orders)) {
          this.orders = (data.orders as Order[]).filter((o) => !isLegacyFakeOrder(o));
        }
        if (Array.isArray(data.orderStatusHistory)) {
          this.orderStatusHistory = data.orderStatusHistory;
        }
        if (Array.isArray(data.visitors)) {
          this.visitors = data.visitors;
        }
        if (Array.isArray(data.sessions)) {
          this.sessions = data.sessions;
        }
        if (Array.isArray(data.analyticsEvents)) {
          this.analyticsEvents = (data.analyticsEvents as AnalyticsEvent[]).filter(
            (e) => !isLegacyFakeEvent(e)
          );
        }
        if (data.settings) {
          this.settings = { ...INITIAL_SETTINGS, ...data.settings };
        }
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          this.templates = data.templates;
        }
        this.lastSyncedAt = Date.now();
        this.isHydrated = true;
        notifySubscribers(false);
      }
    } catch {
      // Network error
    }
  }

  /**
   * Authoritative lookup of a single product by slug or ID directly from the server.
   */
  public async fetchProductBySlugFromServer(slug: string): Promise<Product | null> {
    if (typeof window === 'undefined') return null;
    try {
      const res = await fetch(`/api/db/product/${encodeURIComponent(slug)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.ok && data.product && !isLegacySeedProduct(data.product)) {
        const raw = data.product as Product;
        const fetched: Product = {
          ...raw,
          status: getProductStatus(raw),
          isPublished: getProductStatus(raw) === 'ACTIVE',
          comparePrice: raw.comparePrice ?? raw.compareAtPrice,
        };
        const idx = this.products.findIndex((p) => p._id === fetched._id);
        if (idx !== -1) {
          this.products[idx] = fetched;
        } else {
          this.products.unshift(fetched);
        }
        notifySubscribers(false);
        return fetched;
      }
    } catch {
      // Ignore network error
    }
    return null;
  }

  public async reloadFromStorage() {
    await this.syncWithServer();
  }

  // --- CONVEX CLOUD HTTP SYNC (https://valuable-emu-538.convex.cloud) ---
  public setConvexUrl(url: string) {
    const clean = url.trim().replace(/\/+$/, '');
    if (!clean) return;
    this.convexUrl = clean;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CONVEX_URL_STORAGE_KEY, clean);
      } catch {}
    }
    void this.syncWithConvexCloud();
  }

  private async callConvexQuery<T>(
    path: string,
    args: Record<string, any> = {}
  ): Promise<{ ok: boolean; value?: T; missingFunction?: boolean }> {
    try {
      const res = await fetch(`${this.convexUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, args, format: 'json' }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        return { ok: true, value: data.value as T };
      }
      if (data.errorMessage && data.errorMessage.includes('Could not find public function')) {
        return { ok: false, missingFunction: true };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  }

  private async callConvexMutation<T>(
    path: string,
    args: Record<string, any> = {}
  ): Promise<{ ok: boolean; value?: T }> {
    if (!this.remoteFunctionsReady) return { ok: false };
    try {
      const res = await fetch(`${this.convexUrl}/api/mutation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, args, format: 'json' }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        this.lastSyncedAt = Date.now();
        return { ok: true, value: data.value as T };
      }
      return { ok: false };
    } catch {
      return { ok: false };
    }
  }

  public async syncWithConvexCloud(): Promise<{ status: ConvexConnectionStatus; message: string }> {
    if (typeof window === 'undefined') {
      return { status: 'local_persisted', message: 'Server Mode' };
    }

    await this.syncWithServer();

    try {
      const prodRes = await this.callConvexQuery<Product[]>('products:list', {});

      if (prodRes.ok && Array.isArray(prodRes.value)) {
        this.remoteFunctionsReady = true;
        this.connectionStatus = 'connected';
        this.lastSyncedAt = Date.now();
        notifySubscribers(false);
        return {
          status: 'connected',
          message: `متصل بنجاح مع قاعدة بيانات Convex Cloud (${this.convexUrl})`,
        };
      }

      this.remoteFunctionsReady = false;
      this.connectionStatus = 'local_persisted';
      this.lastSyncedAt = Date.now();
      notifySubscribers(false);
      return {
        status: 'local_persisted',
        message: `متصل بقاعدة البيانات الدائمة للخادم (${this.products.length} منتجات، ${this.orders.length} طلبات)`,
      };
    } catch {
      this.connectionStatus = 'local_persisted';
      return {
        status: 'local_persisted',
        message: 'متصل بقاعدة البيانات الدائمة للخادم',
      };
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProductBySlug(slug: string): Product | null | undefined {
    const target = normalizeProductSlug(slug);
    const rawTarget = (slug || '').trim().toLowerCase();
    const found =
      this.products.find(
        (p) =>
          normalizeProductSlug(p.slug) === target ||
          p.slug.trim().toLowerCase() === rawTarget ||
          p._id.toLowerCase() === rawTarget
      ) || null;
    if (!found && !this.isHydrated) {
      return undefined;
    }
    return found;
  }

  public getProductById(id: string): Product | null {
    return this.products.find((p) => p._id === id) || null;
  }

  public async createProduct(
    data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    const now = Date.now();
    const resolvedStatus: ProductStatus =
      data.status || (data.isPublished === false ? 'DRAFT' : 'ACTIVE');
    const resolvedPublished = resolvedStatus === 'ACTIVE';
    const uniqueSlug = generateUniqueSlug(data.slug || data.name, this.products);

    const newProduct: Product = {
      ...data,
      _id: 'prod_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      slug: uniqueSlug,
      status: resolvedStatus,
      isPublished: resolvedPublished,
      comparePrice: data.comparePrice ?? data.compareAtPrice,
      createdAt: now,
      updatedAt: now,
    };

    this.products.unshift(newProduct);
    notifySubscribers();

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/db/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: newProduct }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل حفظ المنتج في قاعدة البيانات');
      }
      const savedData = await res.json();
      if (savedData && savedData.ok && savedData.product) {
        const authoritativeProduct: Product = {
          ...savedData.product,
          status: getProductStatus(savedData.product),
          isPublished: getProductStatus(savedData.product) === 'ACTIVE',
        };
        const idx = this.products.findIndex((p) => p._id === newProduct._id);
        if (idx !== -1) {
          this.products[idx] = authoritativeProduct;
        } else {
          this.products.unshift(authoritativeProduct);
        }
        notifySubscribers();
        void this.callConvexMutation<Product>('products:create', data);
        return authoritativeProduct;
      }
    }

    return newProduct;
  }

  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const idx = this.products.findIndex((p) => p._id === id);
    if (idx === -1) {
      throw new Error(`Product with id ${id} not found`);
    }

    const current = this.products[idx];
    let nextStatus: ProductStatus = current.status || (current.isPublished ? 'ACTIVE' : 'DRAFT');
    let nextPublished = current.isPublished;

    if (updates.status !== undefined) {
      nextStatus = updates.status;
      nextPublished = updates.status === 'ACTIVE';
    } else if (updates.isPublished !== undefined) {
      nextPublished = updates.isPublished;
      nextStatus = updates.isPublished ? 'ACTIVE' : 'DRAFT';
    }

    const nextSlug =
      updates.slug !== undefined
        ? generateUniqueSlug(updates.slug || updates.name || current.name, this.products, id)
        : current.slug;

    const updated: Product = {
      ...current,
      ...updates,
      slug: nextSlug,
      status: nextStatus,
      isPublished: nextPublished,
      comparePrice: updates.comparePrice ?? updates.compareAtPrice ?? current.compareAtPrice,
      updatedAt: Date.now(),
    };

    this.products[idx] = updated;
    notifySubscribers();

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/db/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: updated }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل تحديث المنتج في قاعدة البيانات');
      }
      const savedData = await res.json();
      if (savedData && savedData.ok && savedData.product) {
        const authoritativeProduct: Product = {
          ...savedData.product,
          status: getProductStatus(savedData.product),
          isPublished: getProductStatus(savedData.product) === 'ACTIVE',
        };
        const currentIdx = this.products.findIndex((p) => p._id === id);
        if (currentIdx !== -1) {
          this.products[currentIdx] = authoritativeProduct;
        }
        notifySubscribers();
        void this.callConvexMutation('products:update', { id, updates });
        return authoritativeProduct;
      }
    }

    return updated;
  }

  public async duplicateProduct(id: string): Promise<Product> {
    const original = this.getProductById(id);
    if (!original) throw new Error('Product not found');
    const now = Date.now();
    const newSlug = generateUniqueSlug(
      `${original.slug}-copy-${now.toString(36).slice(-4)}`,
      this.products
    );
    const copy: Product = {
      ...original,
      _id: 'prod_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      name: `${original.name} (نسخة / Copy)`,
      slug: newSlug,
      status: 'DRAFT',
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(copy);
    notifySubscribers();

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/db/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: copy }),
      });
      if (res.ok) {
        const savedData = await res.json();
        if (savedData?.ok && savedData.product) {
          const idx = this.products.findIndex((p) => p._id === copy._id);
          if (idx !== -1) this.products[idx] = savedData.product;
          notifySubscribers();
        }
      }
    }

    void this.callConvexMutation('products:duplicate', { id });
    return copy;
  }

  /**
   * Soft-deletes (archives) a product if orders depend on it, or deletes if no orders exist.
   * Existing orders and analytics never break.
   */
  public async deleteProduct(
    id: string
  ): Promise<{ deleted: boolean; archived: boolean; product?: Product }> {
    const hasOrders = this.orders.some((o) => o.productId === id);

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/db/product/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.archived && data.product) {
            const idx = this.products.findIndex((p) => p._id === id);
            if (idx !== -1) {
              this.products[idx] = data.product;
            }
            notifySubscribers();
            return { deleted: false, archived: true, product: data.product };
          }
          this.products = this.products.filter((p) => p._id !== id);
          notifySubscribers();
          void this.callConvexMutation('products:remove', { id });
          return { deleted: true, archived: false };
        }
      } catch {}
    }

    if (hasOrders) {
      const archived = await this.updateProduct(id, { status: 'ARCHIVED', isPublished: false });
      return { deleted: false, archived: true, product: archived };
    }

    this.products = this.products.filter((p) => p._id !== id);
    notifySubscribers();
    return { deleted: true, archived: false };
  }

  // --- VISITORS & SESSIONS ---
  public getVisitors(): Visitor[] {
    return [...this.visitors];
  }

  public getSessions(filter?: {
    productId?: string;
    since?: number;
    until?: number;
  }): AnalyticsSession[] {
    let list = this.sessions;
    if (filter?.productId) {
      list = list.filter((s) => s.productId === filter.productId);
    }
    if (filter?.since !== undefined) {
      list = list.filter((s) => s.startedAt >= filter.since! || s.lastSeenAt >= filter.since!);
    }
    if (filter?.until !== undefined) {
      list = list.filter((s) => s.startedAt <= filter.until!);
    }
    return [...list];
  }

  public upsertVisitorAndSession(params: {
    visitorId: string;
    sessionId: string;
    productId: string;
    landingPage: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmTerm: string;
    utmContent: string;
    referrer: string;
    userAgent?: string;
    timestamp: number;
  }): { visitor: Visitor; session: AnalyticsSession } {
    const now = params.timestamp || Date.now();

    let visitor = this.visitors.find((v) => v.visitorId === params.visitorId);
    if (!visitor) {
      visitor = {
        _id: 'vis_' + params.visitorId,
        visitorId: params.visitorId,
        firstSeenAt: now,
        lastSeenAt: now,
        userAgent: params.userAgent,
      };
      this.visitors.push(visitor);
    } else {
      visitor.firstSeenAt = Math.min(visitor.firstSeenAt, now);
      visitor.lastSeenAt = Math.max(visitor.lastSeenAt, now);
      if (params.userAgent && !visitor.userAgent) {
        visitor.userAgent = params.userAgent;
      }
    }

    let session = this.sessions.find((s) => s.sessionId === params.sessionId);
    if (!session) {
      session = {
        _id: 'sess_' + params.sessionId,
        sessionId: params.sessionId,
        visitorId: params.visitorId,
        productId: params.productId,
        landingPage: params.landingPage,
        utmSource: params.utmSource || '',
        utmMedium: params.utmMedium || '',
        utmCampaign: params.utmCampaign || '',
        utmTerm: params.utmTerm || '',
        utmContent: params.utmContent || '',
        referrer: params.referrer || '',
        startedAt: now,
        lastSeenAt: now,
      };
      this.sessions.push(session);
    } else {
      session.lastSeenAt = Math.max(session.lastSeenAt, now);
      if (!session.productId && params.productId) session.productId = params.productId;
      if (!session.utmSource && params.utmSource) session.utmSource = params.utmSource;
      if (!session.utmMedium && params.utmMedium) session.utmMedium = params.utmMedium;
      if (!session.utmCampaign && params.utmCampaign) session.utmCampaign = params.utmCampaign;
      if (!session.utmTerm && params.utmTerm) session.utmTerm = params.utmTerm;
      if (!session.utmContent && params.utmContent) session.utmContent = params.utmContent;
      if (!session.referrer && params.referrer) session.referrer = params.referrer;
    }

    return { visitor, session };
  }

  // --- ORDERS, VALIDATION, STATUS HISTORY & DUPLICATE PROTECTION ---
  public getOrders(): Order[] {
    return [...this.orders]
      .filter((o) => !isLegacyFakeOrder(o))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  public getOrderStatusHistory(orderId?: string): OrderStatusHistory[] {
    const list = orderId
      ? this.orderStatusHistory.filter((h) => h.orderId === orderId)
      : this.orderStatusHistory;
    return [...list].sort((a, b) => b.timestamp - a.timestamp);
  }

  public checkDuplicateOrder(
    productId: string,
    phone: string,
    timeWindowMinutes = 10
  ): Order | null {
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    const threshold = Date.now() - timeWindowMinutes * 60 * 1000;

    const existing = this.orders.find((o) => {
      const orderCleanPhone = o.phone.replace(/[\s\-\(\)\.]/g, '');
      return (
        o.productId === productId &&
        orderCleanPhone === cleanPhone &&
        o.createdAt >= threshold &&
        o.status !== 'CANCELLED' &&
        o.status !== 'FAILED'
      );
    });

    return existing || null;
  }

  public async createOrder(
    data: Omit<Order, '_id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
  ): Promise<Order> {
    const product = this.getProductById(data.productId);
    if (!product) {
      throw new Error(`Invalid order: Product ${data.productId} does not exist.`);
    }
    if (getProductStatus(product) !== 'ACTIVE') {
      throw new Error('هذا المنتج غير متاح للطلب حالياً (Product is not active).');
    }
    if (
      !data.customerName?.trim() ||
      !data.phone?.trim() ||
      !data.city?.trim() ||
      !data.address?.trim()
    ) {
      throw new Error('Invalid order: Missing required customer contact or delivery fields.');
    }

    const safeQuantity = Math.max(1, Math.floor(Number(data.quantity) || 1));
    const authoritativeTotal = computeAuthoritativeOrderTotal(
      product,
      safeQuantity,
      data.variants
    );
    const authoritativeCurrency = product.currency || this.settings.defaultCurrency || 'DH';
    const now = Date.now();
    const orderSeq = 1000 + this.orders.length + 1;
    const orderId =
      'ord_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const orderNumber = `COD-${orderSeq}-${now.toString(36).slice(-3).toUpperCase()}`;

    const newOrder: Order = {
      ...data,
      _id: orderId,
      orderNumber,
      productName: product.name,
      productImage: product.images[0] || '',
      quantity: safeQuantity,
      total: authoritativeTotal,
      amount: authoritativeTotal,
      currency: authoritativeCurrency,
      status: 'NEW',
      visitorId: data.visitorId || 'v_anonymous',
      sessionId: data.sessionId || 's_anonymous',
      createdAt: now,
      updatedAt: now,
    };

    const initialHistory: OrderStatusHistory = {
      _id: 'osh_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      productId: newOrder.productId,
      previousStatus: null,
      newStatus: 'NEW',
      timestamp: now,
    };

    const orderEventId = data.eventId || `ev_ord_${newOrder._id}`;
    const orderCreatedEvent: AnalyticsEvent = {
      _id: 'evt_ord_' + newOrder._id,
      eventId: orderEventId,
      clientEventId: orderEventId,
      eventType: 'ORDER_CREATED',
      visitorId: newOrder.visitorId || 'v_anonymous',
      sessionId: newOrder.sessionId || 's_anonymous',
      productId: newOrder.productId,
      timestamp: now,
      createdAt: now,
      pageUrl: `/p/${product.slug}`,
      referrer: '',
      utmSource: newOrder.utmSource || '',
      utmMedium: newOrder.utmMedium || '',
      utmCampaign: newOrder.utmCampaign || '',
      utmContent: newOrder.utmContent || '',
      utmTerm: newOrder.utmTerm || '',
      metadata: {
        orderId: newOrder._id,
        orderNumber: newOrder.orderNumber,
        amount: newOrder.total,
        currency: newOrder.currency,
        quantity: newOrder.quantity,
        city: newOrder.city,
      },
    };

    this.orders.unshift(newOrder);
    this.orderStatusHistory.push(initialHistory);
    if (
      !this.analyticsEvents.some(
        (e) => e.clientEventId === orderEventId || e.eventId === orderEventId
      )
    ) {
      this.analyticsEvents.push(orderCreatedEvent);
    }
    notifySubscribers();

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/db/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: newOrder,
          statusHistory: initialHistory,
          orderEvent: orderCreatedEvent,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل تسجيل الطلب في الخادم');
      }
      const resData = await res.json();
      if (resData && resData.ok && resData.order) {
        const idx = this.orders.findIndex((o) => o._id === newOrder._id);
        if (idx !== -1) {
          this.orders[idx] = resData.order;
        }
        notifySubscribers();
        void this.callConvexMutation<Order>('orders:create', data);
        return resData.order as Order;
      }
    }

    return newOrder;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const idx = this.orders.findIndex((o) => o._id === orderId);
    if (idx === -1) throw new Error(`Order ${orderId} not found`);

    const currentOrder = this.orders[idx];
    const previousStatus = currentOrder.status;
    if (previousStatus === status) {
      return currentOrder;
    }

    const now = Date.now();
    const updatedOrder: Order = {
      ...currentOrder,
      status,
      updatedAt: now,
    };
    this.orders[idx] = updatedOrder;

    const historyEntry: OrderStatusHistory = {
      _id: 'osh_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      orderId: updatedOrder._id,
      orderNumber: updatedOrder.orderNumber,
      productId: updatedOrder.productId,
      previousStatus,
      newStatus: status,
      timestamp: now,
    };
    this.orderStatusHistory.push(historyEntry);

    const statusEventMap: Partial<Record<OrderStatus, AnalyticsEventType>> = {
      CONFIRMED: 'ORDER_CONFIRMED',
      CANCELLED: 'ORDER_CANCELLED',
      DELIVERED: 'ORDER_DELIVERED',
      FAILED: 'ORDER_FAILED',
    };
    const lifecycleEventType = statusEventMap[status];
    let lifecycleEvent: AnalyticsEvent | undefined;

    if (lifecycleEventType) {
      const evtId = `ev_status_${updatedOrder._id}_${status}_${now.toString(36)}`;
      lifecycleEvent = {
        _id: 'evt_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 8),
        eventId: evtId,
        clientEventId: evtId,
        eventType: lifecycleEventType,
        visitorId: updatedOrder.visitorId || 'v_anonymous',
        sessionId: updatedOrder.sessionId || 's_anonymous',
        productId: updatedOrder.productId,
        timestamp: now,
        createdAt: now,
        pageUrl: `/admin/orders`,
        referrer: '',
        utmSource: updatedOrder.utmSource || '',
        utmMedium: updatedOrder.utmMedium || '',
        utmCampaign: updatedOrder.utmCampaign || '',
        utmContent: updatedOrder.utmContent || '',
        utmTerm: updatedOrder.utmTerm || '',
        metadata: {
          orderId: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          previousStatus,
          newStatus: status,
          amount: updatedOrder.total,
          currency: updatedOrder.currency,
        },
      };
      this.analyticsEvents.push(lifecycleEvent);
    }

    notifySubscribers();

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/db/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: updatedOrder._id,
          status,
          updatedOrder,
          historyEntry,
          lifecycleEvent,
        }),
      });
      if (res.ok) {
        const resData = await res.json();
        if (resData?.ok && resData.order) {
          const currentIdx = this.orders.findIndex((o) => o._id === orderId);
          if (currentIdx !== -1) {
            this.orders[currentIdx] = resData.order;
          }
          notifySubscribers();
        }
      }
    }

    void this.callConvexMutation('orders:updateStatus', { orderId, status });
    return updatedOrder;
  }

  public async deleteOrder(orderId: string): Promise<boolean> {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter((o) => o._id !== orderId);
    if (this.orders.length !== initialLen) {
      if (typeof window !== 'undefined') {
        await fetch(`/api/db/order/${encodeURIComponent(orderId)}`, { method: 'DELETE' }).catch(
          () => {}
        );
      }
      notifySubscribers();
      void this.callConvexMutation('orders:remove', { orderId });
      return true;
    }
    return false;
  }

  // --- ANALYTICS EVENTS ---
  public logAnalyticsEvent(
    event: Omit<AnalyticsEvent, '_id' | 'createdAt'> & { createdAt?: number }
  ): AnalyticsEvent | null {
    if (event.metadata?.isTest || event.metadata?.isPreview) {
      return null;
    }

    const clientEventId = event.clientEventId || event.eventId;

    if (clientEventId) {
      const existing = this.analyticsEvents.find(
        (e) => e.clientEventId === clientEventId || e.eventId === clientEventId
      );
      if (existing) {
        return existing;
      }
    }

    if (event.eventType === 'FORM_START' && event.sessionId && event.productId) {
      const existingFormStart = this.analyticsEvents.find(
        (e) =>
          e.eventType === 'FORM_START' &&
          e.sessionId === event.sessionId &&
          e.productId === event.productId
      );
      if (existingFormStart) {
        return existingFormStart;
      }
    }

    const now = Date.now();
    const visitorId = event.visitorId || 'v_anonymous';
    const sessionId = event.sessionId || 's_anonymous';
    const ctaId = event.ctaId || event.metadata?.ctaId || event.metadata?.elementId;

    const { visitor, session } = this.upsertVisitorAndSession({
      visitorId,
      sessionId,
      productId: event.productId,
      landingPage: event.pageUrl || `/p/${event.productId}`,
      utmSource: event.utmSource || '',
      utmMedium: event.utmMedium || '',
      utmCampaign: event.utmCampaign || '',
      utmTerm: event.utmTerm || '',
      utmContent: event.utmContent || '',
      referrer: event.referrer || '',
      userAgent: event.userAgent,
      timestamp: now,
    });

    const newEvent: AnalyticsEvent = {
      ...event,
      _id: 'evt_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 9),
      eventId: clientEventId || 'ev_' + now.toString(36),
      clientEventId: clientEventId || 'ev_' + now.toString(36),
      visitorId,
      sessionId,
      ctaId,
      timestamp: now,
      createdAt: now,
      clientTimestamp: event.clientTimestamp || event.timestamp || now,
    };

    this.analyticsEvents.push(newEvent);
    notifySubscribers();

    if (typeof window !== 'undefined') {
      void fetch('/api/db/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: newEvent,
          visitor,
          session,
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res && res.ok && res.event) {
            const idx = this.analyticsEvents.findIndex((e) => e._id === newEvent._id);
            if (idx !== -1) {
              this.analyticsEvents[idx] = res.event;
              notifySubscribers(false);
            }
          }
        })
        .catch(() => {});
    }

    void this.callConvexMutation('analytics:logEvent', newEvent);
    return newEvent;
  }

  public getAnalyticsEvents(filter?: {
    productId?: string;
    since?: number;
    until?: number;
    eventType?: string;
  }): AnalyticsEvent[] {
    let list = this.analyticsEvents.filter((e) => !isLegacyFakeEvent(e));
    if (filter?.productId) {
      list = list.filter((e) => e.productId === filter.productId);
    }
    if (filter?.since !== undefined) {
      list = list.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter?.until !== undefined) {
      list = list.filter((e) => e.timestamp <= filter.until!);
    }
    if (filter?.eventType) {
      list = list.filter((e) => e.eventType === filter.eventType);
    }
    return list;
  }

  // --- TEMPLATES ---
  public getTemplates(): Template[] {
    return [...this.templates];
  }

  // --- SETTINGS ---
  public getSettings(): StoreSettings {
    return { ...this.settings };
  }

  public async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    this.settings = { ...this.settings, ...updates };
    notifySubscribers();

    if (typeof window !== 'undefined') {
      const res = await fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: this.settings }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && data.settings) {
          this.settings = { ...this.settings, ...data.settings };
          notifySubscribers();
        }
      }
    }

    void this.callConvexMutation('settings:update', updates);
    return this.settings;
  }

  public async updateCampaignAdSpend(campaign: string, spend: number): Promise<StoreSettings> {
    const spends = { ...(this.settings.campaignAdSpends || {}) };
    spends[campaign] = Math.max(0, Number(spend) || 0);
    this.settings.campaignAdSpends = spends;
    notifySubscribers();

    if (typeof window !== 'undefined') {
      await fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: this.settings }),
      }).catch(() => {});
    }

    void this.callConvexMutation('settings:updateAdSpend', { campaign, spend });
    return this.settings;
  }

  public async resetToSeed(): Promise<void> {
    this.orders = [];
    this.orderStatusHistory = [];
    this.visitors = [];
    this.sessions = [];
    this.analyticsEvents = [];
    this.settings = { ...INITIAL_SETTINGS };
    if (typeof window !== 'undefined') {
      await fetch('/api/db/clear-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetProducts: false }),
      }).catch(() => {});
    }
    notifySubscribers();
  }
}

export const db = new ConvexMemoryStore();
