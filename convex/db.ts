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
const PRODUCTS_BACKUP_STORAGE_KEY = 'cod_convex_products_backup_v5';
const STATE_BACKUP_STORAGE_KEY = 'cod_convex_full_state_backup_v5';

export function isSystemCloudDoc(product: Partial<Product> | null | undefined): boolean {
  if (!product) return false;
  const slug = String(product.slug || '').trim();
  const name = String(product.name || '').trim();
  return slug.startsWith('__cod_sys_') || name.startsWith('__SYS_');
}

function buildConvexSystemDocArgs(
  slug: string,
  name: string,
  jsonPayload: Record<string, any>,
  price = 0
): Record<string, any> {
  const now = Date.now();
  return {
    name,
    slug,
    shortDescription: '__SYSTEM_SYNC__',
    description: JSON.stringify(jsonPayload),
    price: Number(price) || 0,
    compareAtPrice: 0,
    comparePrice: 0,
    currency: 'DH',
    images: [],
    descriptionImages: [],
    benefits: [],
    variants: [],
    offerText: '',
    ctaText: 'sys',
    shippingText: '',
    returnPolicy: '',
    rating: 5,
    reviewCount: 0,
    templateId: 'classic-cod',
    isPublished: false,
    status: 'ARCHIVED',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Builds an exact validator-compliant payload for `products:create` on Convex Cloud.
 * Convex `v.object({...})` requires `createdAt` & `updatedAt` and rejects `_id` / `_creationTime`.
 */
function buildConvexCreateProductArgs(product: Product): Record<string, any> {
  const now = Date.now();
  const status: ProductStatus = getProductStatus(product);
  const templateId =
    product.templateId === 'premium' || product.templateId === 'big-offer'
      ? product.templateId
      : 'classic-cod';

  const args: Record<string, any> = {
    name: String(product.name || '').trim() || 'Product',
    slug: normalizeProductSlug(product.slug || product.name) || `prod-${now.toString(36)}`,
    shortDescription: String(product.shortDescription || ''),
    description: String(product.description || ''),
    price: Number(product.price) || 0,
    compareAtPrice: Number(product.compareAtPrice) || 0,
    comparePrice: Number(product.comparePrice ?? product.compareAtPrice) || 0,
    currency: String(product.currency || 'DH'),
    images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
    descriptionImages: Array.isArray(product.descriptionImages)
      ? product.descriptionImages.filter(Boolean)
      : [],
    benefits: Array.isArray(product.benefits)
      ? product.benefits.map((b, i) => ({
          id: String(b.id || `ben_${i}`),
          icon: String(b.icon || 'CheckCircle'),
          title: String(b.title || ''),
          ...(b.description !== undefined ? { description: String(b.description) } : {}),
        }))
      : [],
    variants: Array.isArray(product.variants)
      ? product.variants.map((v, i) => ({
          id: String(v.id || `var_${i}`),
          name: String(v.name || ''),
          options: Array.isArray(v.options) ? v.options.map(String) : [],
        }))
      : [],
    offerText: String(product.offerText || ''),
    ctaText: String(product.ctaText || 'اطلب الآن بالدفع عند الاستلام'),
    shippingText: String(product.shippingText || ''),
    returnPolicy: String(product.returnPolicy || ''),
    rating: Number(product.rating) || 4.8,
    reviewCount: Number(product.reviewCount) || 0,
    templateId,
    isPublished: status === 'ACTIVE',
    status,
    createdAt: Number(product.createdAt) || now,
    updatedAt: Number(product.updatedAt) || now,
  };

  const optionalKeys: (keyof Product)[] = [
    'badgeText',
    'canonicalUrl',
    'countdownDurationMinutes',
    'countdownEnabled',
    'countdownEndsAt',
    'customMetaPixelId',
    'customTikTokPixelId',
    'faqs',
    'ogDescription',
    'ogImage',
    'ogTitle',
    'scarcityEnabled',
    'seoDescription',
    'seoTitle',
    'stockQuantity',
    'useCustomPixels',
    'whatsappEnabled',
    'whatsappNumber',
  ];

  for (const key of optionalKeys) {
    const val = product[key];
    if (val !== undefined && val !== null) {
      args[key] = val;
    }
  }

  return args;
}

/**
 * Builds an exact validator-compliant `updates` payload for `products:update` on Convex Cloud.
 * Note: `products:update` validator does NOT allow `_id`, `_creationTime`, `createdAt`, or `updatedAt`.
 */
function buildConvexUpdateProductArgs(updates: Partial<Product>): Record<string, any> {
  const full = buildConvexCreateProductArgs(updates as Product);
  const allowedUpdateKeys = new Set([
    'badgeText',
    'benefits',
    'canonicalUrl',
    'compareAtPrice',
    'comparePrice',
    'countdownDurationMinutes',
    'countdownEnabled',
    'countdownEndsAt',
    'ctaText',
    'currency',
    'customMetaPixelId',
    'customTikTokPixelId',
    'description',
    'descriptionImages',
    'faqs',
    'images',
    'isPublished',
    'name',
    'offerText',
    'ogDescription',
    'ogImage',
    'ogTitle',
    'price',
    'rating',
    'returnPolicy',
    'reviewCount',
    'scarcityEnabled',
    'seoDescription',
    'seoTitle',
    'shippingText',
    'shortDescription',
    'slug',
    'status',
    'stockQuantity',
    'templateId',
    'useCustomPixels',
    'variants',
    'whatsappEnabled',
    'whatsappNumber',
  ]);

  const result: Record<string, any> = {};
  for (const key of Object.keys(updates)) {
    if (allowedUpdateKeys.has(key) && full[key] !== undefined) {
      result[key] = full[key];
    }
  }
  return result;
}

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

export const ALL_MOROCCO_CITIES: string[] = [
  // الدار البيضاء - سطات (Casablanca-Settat)
  'الدار البيضاء (Casablanca)',
  'المحمدية (Mohammédia)',
  'الجديدة (El Jadida)',
  'سطات (Settat)',
  'برشيد (Berrechid)',
  'بوزنيقة (Bouznika)',
  'بن سليمان (Benslimane)',
  'سيدي بنور (Sidi Bennour)',
  'دار بوعزة (Dar Bouazza)',
  'بوسكورة (Bouskoura)',
  'النواصر (Nouaceur)',
  'مديونة (Médiouna)',
  'تيط مليل (Tit Mellil)',
  'عين حرودة (Aïn Harrouda)',
  'الهراويين (Lahraouyine)',
  'حد السوالم (Had Soualem)',
  'الدروة (Deroua)',
  'أزمور (Azemmour)',
  'البئر الجديد (Bir Jdid)',
  'سيدي رحال الشاطئ (Sidi Rahal)',
  'الواليدية (Oualidia)',
  'الزمامرة (Zemamra)',
  'ابن أحمد (Ben Ahmed)',
  'البروج (El Borouj)',
  'الكارة (El Gara)',
  'أولاد عبو (Oulad Abbou)',
  'سيدي حجاج واد حصار (Sidi Hajjaj)',

  // الرباط - سلا - القنيطرة (Rabat-Salé-Kénitra)
  'الرباط (Rabat)',
  'سلا (Salé)',
  'تمارة (Témara)',
  'القنيطرة (Kénitra)',
  'الصخيرات (Skhirat)',
  'الخميسات (Khémisset)',
  'تيفلت (Tiflet)',
  'سيدي قاسم (Sidi Kacem)',
  'سيدي سليمان (Sidi Slimane)',
  'تامسنا (Tamesna)',
  'عين عتيق (Aïn Attig)',
  'سوق الأربعاء الغرب (Souk El Arbaa)',
  'سيدي يحيى الغرب (Sidi Yahya El Gharb)',
  'مشرع بلقصيري (Mechra Bel Ksiri)',
  'جرف الملحة (Jorf El Melha)',
  'الرماني (Rommani)',
  'مهدية (Mehdia)',
  'بوقنادل (Bouknadel)',
  'سيدي الطيبي (Sidi Taïbi)',
  'دار الكداري (Dar Gueddari)',
  'حد كورت (Had Kourt)',
  'مولي بوسلهام (Moulay Bousselham)',

  // طنجة - تطوان - الحسيمة (Tanger-Tétouan-Al Hoceïma)
  'طنجة (Tanger)',
  'تطوان (Tétouan)',
  'الحسيمة (Al Hoceïma)',
  'العرائش (Larache)',
  'القصر الكبير (Ksar El Kébir)',
  'شفشاون (Chefchaouen)',
  'وزان (Ouezzane)',
  'الفنيدق (Fnideq)',
  'المضيق (M\'diq)',
  'مرتيل (Martil)',
  'أصيلة (Asilah)',
  'واد لو (Oued Laou)',
  'إمزورن (Imzouren)',
  'بني بوعياش (Bni Bouayach)',
  'تارجيست (Targuist)',
  'قصر الصغير (Ksar Sghir)',
  'اكزناية (Gzenaya)',
  'باب برد (Bab Berred)',

  // مراكش - آسفي (Marrakech-Safi)
  'مراكش (Marrakech)',
  'آسفي (Safi)',
  'الصويرة (Essaouira)',
  'قلعة السراغنة (El Kelaâ des Sraghna)',
  'ابن جرير (Ben Guerir)',
  'اليوسفية (Youssoufia)',
  'شيشاوة (Chichaoua)',
  'تحناوت (Tahannaout)',
  'تامنصورت (Tamansourt)',
  'أيت أورير (Aït Ourir)',
  'إمنتانوت (Imintanoute)',
  'العطاوية (El Attaouia)',
  'سيدي رحال (Sidi Rahhal)',
  'سبت جزولة (Sebt Gzoula)',
  'الشماعية (Echemmaia)',
  'أمزميز (Amizmiz)',
  'سيدي بوعثمان (Sidi Bou Othmane)',
  'أوريكة (Ourika)',

  // فاس - مكناس (Fès-Meknès)
  'فاس (Fès)',
  'مكناس (Meknès)',
  'تازة (Taza)',
  'صفرو (Sefrou)',
  'إفران (Ifrane)',
  'أزرو (Azrou)',
  'الحاجب (El Hajeb)',
  'تاونات (Taounate)',
  'بولمان (Boulemane)',
  'ميسور (Missour)',
  'أوطاط الحاج (Outat El Haj)',
  'إيموزار كندر (Imouzzer Kandar)',
  'عين تاوجطات (Aïn Taoujdate)',
  'سبع عيون (Sabaa Aiyoun)',
  'مولاي يعقوب (Moulay Yacoub)',
  'مولاي إدريس زرهون (Moulay Idriss Zerhoun)',
  'واد أمليل (Oued Amlil)',
  'تاهلة (Tahla)',
  'قرية با محمد (Karia Ba Mohamed)',
  'تيسة (Tissa)',
  'غفساي (Ghafsai)',
  'أكنول (Aknoul)',

  // سوس - ماسة (Souss-Massa)
  'أكادير (Agadir)',
  'إنزكان (Inezgane)',
  'أيت ملول (Aït Melloul)',
  'الدشيرة الجهادية (Dcheira El Jihadia)',
  'تارودانت (Taroudant)',
  'تزنيت (Tiznit)',
  'أولاد تايمة - هوارة (Oulad Teïma)',
  'بيوكرى (Biougra)',
  'طاطا (Tata)',
  'القليعة (Lqliaa)',
  'التمسية (Temsia)',
  'أولوز (Aoulouz)',
  'أولاد برحيل (Oulad Berhil)',
  'أيت باها (Aït Baha)',
  'تافراوت (Tafraout)',
  'أنزا (Anza)',
  'تغازوت (Taghazout)',
  'أورير (Aourir)',
  'ماسة (Massa)',

  // الشرق (Oriental)
  'وجدة (Oujda)',
  'الناظور (Nador)',
  'بركان (Berkane)',
  'تاوريرت (Taourirt)',
  'جرسيف (Guercif)',
  'جرادة (Jerada)',
  'الدريوش (Driouch)',
  'فكيك (Figuig)',
  'بوعرفة (Bouarfa)',
  'العروي (Al Aaroui)',
  'سلوان (Selouane)',
  'زايو (Zaïo)',
  'أزغنغان (Zeghanghane)',
  'بني أنصار (Beni Ensar)',
  'أحفير (Ahfir)',
  'السعيدية (Saïdia)',
  'العيون سيدي ملوك (El Aïoun Sidi Mellouk)',
  'ميدار (Midar)',
  'بن الطيب (Ben Taïeb)',
  'دبدو (Debdou)',
  'أكليم (Aklim)',

  // بني ملال - خنيفرة (Béni Mellal-Khénifra)
  'بني ملال (Béni Mellal)',
  'خريبكة (Khouribga)',
  'خنيفرة (Khénifra)',
  'الفقيه بن صالح (Fquih Ben Salah)',
  'أزيلال (Azilal)',
  'وادي زم (Oued Zem)',
  'أبي الجعد (Bejaâd)',
  'سوق السبت أولاد النمة (Souk Sebt Oulad Nemma)',
  'قصبة تادلة (Kasba Tadla)',
  'زاوية الشيخ (Zaouiat Cheikh)',
  'دمنات (Demnate)',
  'مريرت (M\'rirt)',
  'أولاد عياد (Oulad Ayad)',
  'أولاد امبارك (Oulad M\'Barek)',
  'بوجنيبة (Boujniba)',
  'حطان (Hattane)',
  'أفورار (Afourar)',

  // درعة - تافيلالت (Drâa-Tafilalet)
  'الرشيدية (Errachidia)',
  'ورزازات (Ouarzazate)',
  'ميدلت (Midelt)',
  'تنغير (Tinghir)',
  'زاكورة (Zagora)',
  'أرفود (Erfoud)',
  'الريصاني (Rissani)',
  'كلميمة (Goulmima)',
  'قلعة مكونة (Kelaat M\'Gouna)',
  'بومالن دادس (Boumalne Dadès)',
  'الريش (Er-Rich)',
  'أكدز (Agdz)',
  'تازناخت (Tazenakht)',
  'الجرف (El Jorf)',
  'مرزوكة (Merzouga)',
  'تنجداد (Tinejdad)',

  // كلميم - واد نون (Guelmim-Oued Noun)
  'كلميم (Guelmim)',
  'طانطان (Tan-Tan)',
  'سيدي إفني (Sidi Ifni)',
  'آسا (Assa)',
  'الزاك (Zag)',
  'بويزكارن (Bouizakarne)',
  'الوطية (El Ouatia)',
  'ميرلفت (Mirleft)',

  // العيون - الساقية الحمراء (Laâyoune-Sakia El Hamra)
  'العيون (Laâyoune)',
  'السمارة (Es-Semara)',
  'بوجدور (Boujdour)',
  'طرفاية (Tarfaya)',
  'المرسى (El Marsa)',

  // الداخلة - وادي الذهب (Dakhla-Oued Ed-Dahab)
  'الداخلة (Dakhla)',
  'الكويرة (Lagouira)',
];

export const INITIAL_SETTINGS: StoreSettings = {
  _id: 'settings_default',
  storeName: 'COD Express Maroc',
  defaultCurrency: 'DH',
  defaultShippingText: 'التوصيل مجاني لجميع مدن المغرب الدفع عند الاستلام',
  defaultReturnPolicy: 'ضمان الاسترجاع والاستبدال خلال 14 يوماً',
  moroccoCities: ALL_MOROCCO_CITIES,
  contactPhone: '+212 661-234567',
  metaPixelId: '135752956164308',
  enableMetaPixel: true,
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
  if (isSystemCloudDoc(product)) return true;
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
  private remoteFunctionsReady = true;
  private initialSyncPromise: Promise<void> | null = null;
  private pendingProducts = new Map<string, Product>();
  private deletedProductIds = new Set<string>();
  private deletedOrderIds = new Set<string>();
  private orderConvexDocIds = new Map<string, string>();
  private settingsConvexDocId: string | null = null;
  private telemetryConvexDocId: string | null = null;
  private telemetrySyncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.init();
  }

  private saveProductsBackup() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(PRODUCTS_BACKUP_STORAGE_KEY, JSON.stringify(this.products));
      localStorage.setItem(
        STATE_BACKUP_STORAGE_KEY,
        JSON.stringify({
          orders: this.orders,
          orderStatusHistory: this.orderStatusHistory,
          visitors: this.visitors.slice(-500),
          sessions: this.sessions.slice(-500),
          analyticsEvents: this.analyticsEvents.slice(-1000),
          settings: this.settings,
          deletedOrderIds: Array.from(this.deletedOrderIds),
        })
      );
    } catch {}
  }

  private loadProductsBackup(): Product[] {
    if (typeof window === 'undefined') return [];
    try {
      const rawState = localStorage.getItem(STATE_BACKUP_STORAGE_KEY);
      if (rawState) {
        const parsedState = JSON.parse(rawState);
        if (parsedState && typeof parsedState === 'object') {
          if (Array.isArray(parsedState.deletedOrderIds)) {
            parsedState.deletedOrderIds.forEach((id: string) => this.deletedOrderIds.add(id));
          }
          if (Array.isArray(parsedState.orders)) {
            this.orders = parsedState.orders.filter(
              (o: Order) => o && !isLegacyFakeOrder(o) && !this.deletedOrderIds.has(o._id)
            );
          }
          if (Array.isArray(parsedState.orderStatusHistory)) {
            this.orderStatusHistory = parsedState.orderStatusHistory;
          }
          if (Array.isArray(parsedState.visitors)) {
            this.visitors = parsedState.visitors;
          }
          if (Array.isArray(parsedState.sessions)) {
            this.sessions = parsedState.sessions;
          }
          if (Array.isArray(parsedState.analyticsEvents)) {
            this.analyticsEvents = parsedState.analyticsEvents.filter(
              (e: AnalyticsEvent) => e && !isLegacyFakeEvent(e)
            );
          }
          if (parsedState.settings) {
            this.settings = { ...INITIAL_SETTINGS, ...parsedState.settings };
          }
        }
      }
    } catch {}

    try {
      const raw = localStorage.getItem(PRODUCTS_BACKUP_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => p && !isLegacySeedProduct(p))
          .map((p) => ({
            ...p,
            status: getProductStatus(p),
            isPublished: getProductStatus(p) === 'ACTIVE',
            comparePrice: p.comparePrice ?? p.compareAtPrice,
          }));
      }
    } catch {}
    return [];
  }

  private mergeOrdersList(incoming: Order[]) {
    if (!Array.isArray(incoming)) return;
    const byId = new Map<string, Order>();

    const register = (ord: Order) => {
      if (!ord || !ord._id || isLegacyFakeOrder(ord) || this.deletedOrderIds.has(ord._id)) return;
      const existing = byId.get(ord._id);
      if (!existing) {
        byId.set(ord._id, ord);
        return;
      }
      const ordTime = Number(ord.updatedAt || ord.createdAt || 0);
      const existingTime = Number(existing.updatedAt || existing.createdAt || 0);
      byId.set(ord._id, ordTime >= existingTime ? { ...existing, ...ord } : { ...ord, ...existing });
    };

    for (const o of this.orders) register(o);
    for (const o of incoming) register(o);

    this.orders = Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);
    this.saveProductsBackup();
  }

  private mergeStatusHistoryList(incoming: OrderStatusHistory[]) {
    if (!Array.isArray(incoming)) return;
    const byId = new Map<string, OrderStatusHistory>();
    for (const h of this.orderStatusHistory) {
      if (h && h._id && !this.deletedOrderIds.has(h.orderId)) byId.set(h._id, h);
    }
    for (const h of incoming) {
      if (h && h._id && !this.deletedOrderIds.has(h.orderId)) byId.set(h._id, h);
    }
    this.orderStatusHistory = Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  private mergeAnalyticsData(data: {
    visitors?: Visitor[];
    sessions?: AnalyticsSession[];
    analyticsEvents?: AnalyticsEvent[];
  }) {
    if (Array.isArray(data.visitors)) {
      const vMap = new Map<string, Visitor>();
      for (const v of this.visitors) if (v?.visitorId) vMap.set(v.visitorId, v);
      for (const v of data.visitors) {
        if (!v?.visitorId) continue;
        const ex = vMap.get(v.visitorId);
        if (!ex) vMap.set(v.visitorId, v);
        else {
          vMap.set(v.visitorId, {
            ...ex,
            firstSeenAt: Math.min(ex.firstSeenAt, v.firstSeenAt || ex.firstSeenAt),
            lastSeenAt: Math.max(ex.lastSeenAt, v.lastSeenAt || ex.lastSeenAt),
          });
        }
      }
      this.visitors = Array.from(vMap.values());
    }

    if (Array.isArray(data.sessions)) {
      const sMap = new Map<string, AnalyticsSession>();
      for (const s of this.sessions) if (s?.sessionId) sMap.set(s.sessionId, s);
      for (const s of data.sessions) {
        if (!s?.sessionId) continue;
        const ex = sMap.get(s.sessionId);
        if (!ex) sMap.set(s.sessionId, s);
        else {
          sMap.set(s.sessionId, {
            ...ex,
            ...s,
            startedAt: Math.min(ex.startedAt, s.startedAt || ex.startedAt),
            lastSeenAt: Math.max(ex.lastSeenAt, s.lastSeenAt || ex.lastSeenAt),
          });
        }
      }
      this.sessions = Array.from(sMap.values());
    }

    if (Array.isArray(data.analyticsEvents)) {
      const eMap = new Map<string, AnalyticsEvent>();
      const isDeletedOrderEvent = (e: AnalyticsEvent) => {
        const ordId = e.metadata?.orderId;
        if (ordId && this.deletedOrderIds.has(String(ordId))) return true;
        if (e._id && e._id.startsWith('evt_ord_')) {
          const extracted = e._id.replace('evt_ord_', '');
          if (this.deletedOrderIds.has(extracted)) return true;
        }
        return false;
      };
      for (const e of this.analyticsEvents) {
        if (e && !isLegacyFakeEvent(e) && !isDeletedOrderEvent(e)) {
          eMap.set(e.clientEventId || e.eventId || e._id, e);
        }
      }
      for (const e of data.analyticsEvents) {
        if (e && !isLegacyFakeEvent(e) && !isDeletedOrderEvent(e)) {
          const key = e.clientEventId || e.eventId || e._id;
          if (!eMap.has(key)) eMap.set(key, e);
        }
      }
      this.analyticsEvents = Array.from(eMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    }
  }

  public async persistOrderToConvexCloud(order: Order, isNewOrder = false): Promise<void> {
    try {
      const compactOrder: Order = {
        ...order,
        productImage:
          order.productImage && order.productImage.startsWith('data:') ? '' : order.productImage,
      };
      const orderHistory = this.orderStatusHistory.filter((h) => h.orderId === order._id);
      const sysSlug = `__cod_sys_order_${order._id}`;
      const sysName = `__SYS_ORDER__${order.orderNumber}`;
      const payload = {
        type: 'ORDER_RECORD',
        order: compactOrder,
        history: orderHistory,
        deleted: this.deletedOrderIds.has(order._id),
      };

      const existingDocId = this.orderConvexDocIds.get(order._id);
      if (existingDocId) {
        await this.callConvexMutation('products:update', {
          id: existingDocId,
          updates: {
            description: JSON.stringify(payload),
            price: Number(order.total) || 0,
            isPublished: false,
            status: 'ARCHIVED',
          },
        });
        return;
      }

      if (!isNewOrder) {
        const found = await this.callConvexQuery<Product | null>('products:getBySlug', {
          slug: sysSlug,
        });
        if (found.ok && found.value && found.value._id) {
          this.orderConvexDocIds.set(order._id, found.value._id);
          await this.callConvexMutation('products:update', {
            id: found.value._id,
            updates: {
              description: JSON.stringify(payload),
              price: Number(order.total) || 0,
              isPublished: false,
              status: 'ARCHIVED',
            },
          });
          return;
        }
      }

      const createArgs = buildConvexSystemDocArgs(sysSlug, sysName, payload, order.total);
      const created = await this.callConvexMutation<string>('products:create', createArgs);
      if (created.ok && typeof created.value === 'string' && created.value) {
        this.orderConvexDocIds.set(order._id, created.value);
      }
    } catch {}
  }

  public scheduleTelemetryConvexSync(delayMs = 300) {
    if (typeof window === 'undefined') return;
    if (this.telemetrySyncTimer) clearTimeout(this.telemetrySyncTimer);
    this.telemetrySyncTimer = setTimeout(() => {
      void this.persistTelemetryToConvexCloud();
    }, delayMs);
  }

  private async persistTelemetryToConvexCloud(): Promise<void> {
    try {
      const sysSlug = '__cod_sys_telemetry';
      const payload = {
        type: 'TELEMETRY_RECORD',
        visitors: this.visitors.slice(-300),
        sessions: this.sessions.slice(-300),
        analyticsEvents: this.analyticsEvents.slice(-500),
        orderStatusHistory: this.orderStatusHistory.slice(-300),
        deletedOrderIds: Array.from(this.deletedOrderIds),
      };

      if (this.telemetryConvexDocId) {
        await this.callConvexMutation('products:update', {
          id: this.telemetryConvexDocId,
          updates: {
            description: JSON.stringify(payload),
            isPublished: false,
            status: 'ARCHIVED',
          },
        });
        return;
      }

      const found = await this.callConvexQuery<Product | null>('products:getBySlug', {
        slug: sysSlug,
      });
      if (found.ok && found.value && found.value._id) {
        this.telemetryConvexDocId = found.value._id;
        await this.callConvexMutation('products:update', {
          id: found.value._id,
          updates: {
            description: JSON.stringify(payload),
            isPublished: false,
            status: 'ARCHIVED',
          },
        });
        return;
      }

      const createArgs = buildConvexSystemDocArgs(sysSlug, '__SYS_TELEMETRY__', payload, 0);
      const created = await this.callConvexMutation<string>('products:create', createArgs);
      if (created.ok && typeof created.value === 'string' && created.value) {
        this.telemetryConvexDocId = created.value;
      }
    } catch {}
  }

  private async persistSettingsToConvexCloud(): Promise<void> {
    try {
      const sysSlug = '__cod_sys_settings';
      const payload = {
        type: 'SETTINGS_RECORD',
        settings: this.settings,
      };

      if (this.settingsConvexDocId) {
        await this.callConvexMutation('products:update', {
          id: this.settingsConvexDocId,
          updates: {
            description: JSON.stringify(payload),
            isPublished: false,
            status: 'ARCHIVED',
          },
        });
        return;
      }

      const found = await this.callConvexQuery<Product | null>('products:getBySlug', {
        slug: sysSlug,
      });
      if (found.ok && found.value && found.value._id) {
        this.settingsConvexDocId = found.value._id;
        await this.callConvexMutation('products:update', {
          id: found.value._id,
          updates: {
            description: JSON.stringify(payload),
            isPublished: false,
            status: 'ARCHIVED',
          },
        });
        return;
      }

      const createArgs = buildConvexSystemDocArgs(sysSlug, '__SYS_SETTINGS__', payload, 0);
      const created = await this.callConvexMutation<string>('products:create', createArgs);
      if (created.ok && typeof created.value === 'string' && created.value) {
        this.settingsConvexDocId = created.value;
      }
    } catch {}
  }

  /**
   * Merges incoming products into `this.products` without wiping out products from Convex Cloud or Server DB.
   */
  private mergeProductsList(incoming: Product[]) {
    if (!Array.isArray(incoming)) return;

    const normalizedIncoming = incoming
      .filter((p) => p && !isLegacySeedProduct(p) && !this.deletedProductIds.has(p._id))
      .map((p) => ({
        ...p,
        status: getProductStatus(p),
        isPublished: getProductStatus(p) === 'ACTIVE',
        comparePrice: p.comparePrice ?? p.compareAtPrice,
      }));

    const bySlug = new Map<string, Product>();
    const byId = new Map<string, Product>();

    const register = (prod: Product) => {
      if (!prod || this.deletedProductIds.has(prod._id)) return;
      const slugKey = normalizeProductSlug(prod.slug || prod.name);
      const existingBySlug = slugKey ? bySlug.get(slugKey) : undefined;
      const existingById = byId.get(prod._id);
      const existing = existingById || existingBySlug;

      if (!existing) {
        byId.set(prod._id, prod);
        if (slugKey) bySlug.set(slugKey, prod);
        return;
      }

      // Prefer real Convex IDs (do not start with 'prod_') or newer updatedAt
      const prodIsConvexId = !prod._id.startsWith('prod_');
      const existingIsConvexId = !existing._id.startsWith('prod_');
      const prodTime = Number(prod.updatedAt || prod.createdAt || 0);
      const existingTime = Number(existing.updatedAt || existing.createdAt || 0);

      const winner: Product =
        prodIsConvexId && !existingIsConvexId
          ? { ...existing, ...prod, _id: prod._id }
          : !prodIsConvexId && existingIsConvexId
            ? { ...prod, ...existing, _id: existing._id }
            : prodTime >= existingTime
              ? prod
              : existing;

      byId.delete(existing._id);
      byId.set(winner._id, winner);
      if (slugKey) bySlug.set(slugKey, winner);
    };

    for (const p of this.products) {
      register(p);
    }
    for (const p of normalizedIncoming) {
      register(p);
    }
    for (const [, pending] of Array.from(this.pendingProducts.entries())) {
      register(pending);
    }

    this.products = Array.from(byId.values()).sort(
      (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
    );
    this.saveProductsBackup();
  }

  private init() {
    if (typeof window === 'undefined') {
      this.isHydrated = true;
      return;
    }

    // Clean up old demo keys
    try {
      const legacyKeys = [
        'cod_convex_products_v2',
        'cod_convex_orders_v2',
        'cod_convex_analytics_v2',
        'cod_convex_v2_init',
      ];
      legacyKeys.forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      const envUrl = (import.meta as any).env?.VITE_CONVEX_URL;
      const savedUrl = localStorage.getItem(CONVEX_URL_STORAGE_KEY);
      this.convexUrl = savedUrl || envUrl || DEFAULT_CONVEX_CLOUD_URL;
    } catch {
      this.convexUrl = DEFAULT_CONVEX_CLOUD_URL;
    }

    // Load local backup immediately so new tabs have instant access before network resolves
    const backup = this.loadProductsBackup();
    if (backup.length > 0) {
      this.products = backup;
    }

    // Authoritative pull from BOTH Convex Cloud and Backend Server
    this.initialSyncPromise = Promise.all([
      this.syncWithConvexCloud(),
      this.syncWithServer(),
    ])
      .then(() => {})
      .finally(() => {
        this.isHydrated = true;
        notifySubscribers(false);
      });

    // Periodic authoritative pull
    setInterval(() => {
      void this.syncWithConvexCloud();
      void this.syncWithServer();
    }, 4000);
  }

  public async waitForHydration(): Promise<void> {
    if (this.isHydrated) return;
    if (this.initialSyncPromise) {
      await this.initialSyncPromise;
    }
  }

  /**
   * Uploads a single `data:image/...` string to the server in safe <=100KB chunks
   * via `/api/db/image-chunk` so no HTTP request ever triggers proxy 413 limits.
   */
  public async uploadImageDataUrl(dataUrl: string): Promise<string> {
    if (!dataUrl || typeof dataUrl !== 'string') return '';
    return dataUrl.trim();
  }

  private async persistProductToServer(product: Product): Promise<Product> {
    if (typeof window === 'undefined') return product;

    this.pendingProducts.set(product._id, product);

    try {
      const cleanOgImage =
        product.ogImage && !product.ogImage.startsWith('data:')
          ? product.ogImage
          : product.images[0] && !product.images[0].startsWith('data:')
            ? product.images[0]
            : '';

      const productPayload: Product = {
        ...product,
        ogImage: cleanOgImage,
      };

      this.pendingProducts.set(product._id, productPayload);

      let res = await fetch('/api/db/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: productPayload }),
      });

      if (!res.ok) {
        const lightweightPayload: Product = {
          ...productPayload,
          images: productPayload.images.slice(0, 1),
          descriptionImages: [],
          ogImage: '',
        };
        res = await fetch('/api/db/product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product: lightweightPayload }),
        });
      }

      if (res.ok) {
        const savedData = await res.json().catch(() => null);
        if (savedData && savedData.ok && savedData.product) {
          const authoritativeProduct: Product = {
            ...savedData.product,
            ...product,
            _id: !product._id.startsWith('prod_') ? product._id : savedData.product._id,
            status: getProductStatus(product),
            isPublished: getProductStatus(product) === 'ACTIVE',
            comparePrice: product.comparePrice ?? product.compareAtPrice,
          };
          this.pendingProducts.delete(product._id);
          this.pendingProducts.delete(authoritativeProduct._id);
          return authoritativeProduct;
        }
      }
    } catch {
      // Server route may not exist on static hosts (e.g. Vercel); Convex Cloud handles persistence
    }

    this.pendingProducts.delete(product._id);
    return product;
  }

  /**
   * Authoritative pull from the server database (`GET /api/db/state`).
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
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;

      const data = await res.json();
      if (data && data.ok) {
        if (Array.isArray(data.products) && data.products.length > 0) {
          this.mergeProductsList(data.products as Product[]);
        }
        if (Array.isArray(data.orders) && data.orders.length > 0) {
          this.mergeOrdersList(data.orders as Order[]);
        }
        if (Array.isArray(data.orderStatusHistory) && data.orderStatusHistory.length > 0) {
          this.mergeStatusHistoryList(data.orderStatusHistory as OrderStatusHistory[]);
        }
        this.mergeAnalyticsData({
          visitors: data.visitors,
          sessions: data.sessions,
          analyticsEvents: data.analyticsEvents,
        });
        if (data.settings) {
          this.settings = { ...INITIAL_SETTINGS, ...data.settings, ...this.settings };
        }
        if (Array.isArray(data.templates) && data.templates.length > 0) {
          this.templates = data.templates;
        }
        this.saveProductsBackup();
        this.lastSyncedAt = Date.now();
        this.isHydrated = true;
        notifySubscribers(false);
      }
    } catch {
      // Network error or static host
    }
  }

  /**
   * Authoritative lookup of a single product by slug or ID from Convex Cloud + Server DB + Backup.
   */
  public async fetchProductBySlugFromServer(slug: string): Promise<Product | null> {
    if (typeof window === 'undefined') return null;
    const normTarget = normalizeProductSlug(slug);
    const rawTarget = (slug || '').trim().toLowerCase();

    // 1. Check Convex Cloud (`products:getBySlug` and `products:list`)
    try {
      const directRes = await this.callConvexQuery<Product | null>('products:getBySlug', {
        slug: (slug || '').trim(),
      });
      if (directRes.ok && directRes.value && !isLegacySeedProduct(directRes.value)) {
        const fetched: Product = {
          ...directRes.value,
          status: getProductStatus(directRes.value),
          isPublished: getProductStatus(directRes.value) === 'ACTIVE',
          comparePrice: directRes.value.comparePrice ?? directRes.value.compareAtPrice,
        };
        this.mergeProductsList([fetched]);
        notifySubscribers(false);
        return fetched;
      }

      if (normTarget && normTarget !== (slug || '').trim()) {
        const normRes = await this.callConvexQuery<Product | null>('products:getBySlug', {
          slug: normTarget,
        });
        if (normRes.ok && normRes.value && !isLegacySeedProduct(normRes.value)) {
          const fetched: Product = {
            ...normRes.value,
            status: getProductStatus(normRes.value),
            isPublished: getProductStatus(normRes.value) === 'ACTIVE',
            comparePrice: normRes.value.comparePrice ?? normRes.value.compareAtPrice,
          };
          this.mergeProductsList([fetched]);
          notifySubscribers(false);
          return fetched;
        }
      }

      const listRes = await this.callConvexQuery<Product[]>('products:list', {});
      if (listRes.ok && Array.isArray(listRes.value)) {
        this.mergeProductsList(listRes.value);
        const matchFromList =
          listRes.value.find(
            (p) =>
              normalizeProductSlug(p.slug) === normTarget ||
              (p.slug || '').trim().toLowerCase() === rawTarget ||
              (p._id || '').toLowerCase() === rawTarget
          ) || null;
        if (matchFromList && !isLegacySeedProduct(matchFromList)) {
          const fetched: Product = {
            ...matchFromList,
            status: getProductStatus(matchFromList),
            isPublished: getProductStatus(matchFromList) === 'ACTIVE',
            comparePrice: matchFromList.comparePrice ?? matchFromList.compareAtPrice,
          };
          notifySubscribers(false);
          return fetched;
        }
      }
    } catch {}

    // 2. Check Express Backend Server (`/api/db/product/:slug`)
    try {
      const res = await fetch(`/api/db/product/${encodeURIComponent(slug)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.ok && data.product && !isLegacySeedProduct(data.product)) {
          const raw = data.product as Product;
          const fetched: Product = {
            ...raw,
            status: getProductStatus(raw),
            isPublished: getProductStatus(raw) === 'ACTIVE',
            comparePrice: raw.comparePrice ?? raw.compareAtPrice,
          };
          this.mergeProductsList([fetched]);
          notifySubscribers(false);
          return fetched;
        }
      }
    } catch {}

    // 3. Check in-memory / local backup
    const localFound =
      this.products.find(
        (p) =>
          normalizeProductSlug(p.slug) === normTarget ||
          p.slug.trim().toLowerCase() === rawTarget ||
          p._id.toLowerCase() === rawTarget
      ) || null;

    return localFound;
  }

  public async reloadFromStorage() {
    await Promise.all([this.syncWithConvexCloud(), this.syncWithServer()]);
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
  ): Promise<{ ok: boolean; value?: T; errorMessage?: string }> {
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
      return { ok: false, errorMessage: data.errorMessage };
    } catch (err: any) {
      return { ok: false, errorMessage: err?.message };
    }
  }

  public async syncWithConvexCloud(): Promise<{ status: ConvexConnectionStatus; message: string }> {
    if (typeof window === 'undefined') {
      return { status: 'local_persisted', message: 'Server Mode' };
    }

    try {
      const prodRes = await this.callConvexQuery<Product[]>('products:list', {});

      if (prodRes.ok && Array.isArray(prodRes.value)) {
        this.remoteFunctionsReady = true;
        this.connectionStatus = 'connected';
        this.lastSyncedAt = Date.now();

        const rawDocs = prodRes.value;
        const incomingOrders: Order[] = [];
        const incomingHistories: OrderStatusHistory[] = [];

        for (const doc of rawDocs) {
          if (!doc || !isSystemCloudDoc(doc)) continue;
          const slug = String(doc.slug || '').trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(doc.description || '{}');
          } catch {}
          if (!parsed || typeof parsed !== 'object') continue;

          if (slug.startsWith('__cod_sys_order_') && parsed.order) {
            const ord = parsed.order as Order;
            if (ord && ord._id) {
              this.orderConvexDocIds.set(ord._id, doc._id);
              if (parsed.deleted) {
                this.deletedOrderIds.add(ord._id);
              } else if (!this.deletedOrderIds.has(ord._id) && !isLegacyFakeOrder(ord)) {
                incomingOrders.push(ord);
              }
              if (Array.isArray(parsed.history)) {
                incomingHistories.push(...parsed.history);
              }
            }
          } else if (slug === '__cod_sys_telemetry' && parsed.type === 'TELEMETRY_RECORD') {
            this.telemetryConvexDocId = doc._id;
            if (Array.isArray(parsed.deletedOrderIds)) {
              parsed.deletedOrderIds.forEach((id: string) => this.deletedOrderIds.add(id));
            }
            if (Array.isArray(parsed.orderStatusHistory)) {
              incomingHistories.push(...parsed.orderStatusHistory);
            }
            this.mergeAnalyticsData({
              visitors: parsed.visitors,
              sessions: parsed.sessions,
              analyticsEvents: parsed.analyticsEvents,
            });
          } else if (slug === '__cod_sys_settings' && parsed.settings) {
            this.settingsConvexDocId = doc._id;
            this.settings = { ...INITIAL_SETTINGS, ...parsed.settings, ...this.settings };
          }
        }

        if (incomingOrders.length > 0) {
          this.mergeOrdersList(incomingOrders);
        }
        if (incomingHistories.length > 0) {
          this.mergeStatusHistoryList(incomingHistories);
        }

        const convexProducts = rawDocs
          .filter((p) => p && !isLegacySeedProduct(p) && !this.deletedProductIds.has(p._id))
          .map((p) => ({
            ...p,
            status: getProductStatus(p),
            isPublished: getProductStatus(p) === 'ACTIVE',
            comparePrice: p.comparePrice ?? p.compareAtPrice,
          }));

        this.mergeProductsList(convexProducts);

        // Also mirror any local `prod_` products that aren't in Convex Cloud yet up to Convex Cloud
        const convexSlugs = new Set(convexProducts.map((p) => normalizeProductSlug(p.slug)));
        for (const localProd of this.products) {
          const normSlug = normalizeProductSlug(localProd.slug);
          if (localProd._id.startsWith('prod_') && !convexSlugs.has(normSlug)) {
            const createArgs = buildConvexCreateProductArgs(localProd);
            const created = await this.callConvexMutation<string>('products:create', createArgs);
            if (created.ok && typeof created.value === 'string' && created.value) {
              const oldId = localProd._id;
              localProd._id = created.value;
              convexSlugs.add(normSlug);
              this.pendingProducts.delete(oldId);
              this.saveProductsBackup();
            }
          }
        }

        notifySubscribers(false);
        return {
          status: 'connected',
          message: `Connected to Convex Cloud (${this.products.length} products, ${this.orders.length} orders)`,
        };
      }

      this.remoteFunctionsReady = false;
      this.connectionStatus = 'local_persisted';
      this.lastSyncedAt = Date.now();
      notifySubscribers(false);
      return {
        status: 'local_persisted',
        message: `متصل بقاعدة البيانات الدائمة (${this.products.length} منتجات، ${this.orders.length} طلبات)`,
      };
    } catch {
      this.connectionStatus = 'local_persisted';
      return {
        status: 'local_persisted',
        message: 'متصل بقاعدة البيانات الدائمة',
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

    // 1. Save to Convex Cloud (`products:create`) with validator-compliant payload
    const convexCreateArgs = buildConvexCreateProductArgs(newProduct);
    let convexRes = await this.callConvexMutation<string>('products:create', convexCreateArgs);

    // If payload had too many large data URLs exceeding Convex 1MB limit, keep first 3 images
    if (!convexRes.ok && convexCreateArgs.images && convexCreateArgs.images.length > 0) {
      const lighterArgs = {
        ...convexCreateArgs,
        images: convexCreateArgs.images.slice(0, 3),
        descriptionImages: (convexCreateArgs.descriptionImages || []).slice(0, 3),
        ogImage: '',
      };
      convexRes = await this.callConvexMutation<string>('products:create', lighterArgs);
    }

    if (convexRes.ok && typeof convexRes.value === 'string' && convexRes.value) {
      newProduct._id = convexRes.value;
    }

    this.products.unshift(newProduct);
    this.saveProductsBackup();
    notifySubscribers();

    // 2. Also persist to local/server Express DB if available
    const authoritativeProduct = await this.persistProductToServer(newProduct);
    const finalProduct: Product = {
      ...authoritativeProduct,
      _id: !newProduct._id.startsWith('prod_') ? newProduct._id : authoritativeProduct._id,
    };

    const idx = this.products.findIndex(
      (p) => p._id === newProduct._id || p._id === finalProduct._id
    );
    if (idx !== -1) {
      this.products[idx] = finalProduct;
    } else {
      this.products.unshift(finalProduct);
    }
    this.saveProductsBackup();
    notifySubscribers();
    return finalProduct;
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
    this.saveProductsBackup();
    notifySubscribers();

    // 1. Update in Convex Cloud (`products:update` or `products:create` if not yet in Convex Cloud)
    if (!id.startsWith('prod_')) {
      const cleanUpdates = buildConvexUpdateProductArgs(updated);
      await this.callConvexMutation('products:update', { id, updates: cleanUpdates });
    } else {
      const createArgs = buildConvexCreateProductArgs(updated);
      const created = await this.callConvexMutation<string>('products:create', createArgs);
      if (created.ok && typeof created.value === 'string' && created.value) {
        updated._id = created.value;
        this.products[idx] = updated;
      }
    }

    // 2. Also persist to Express DB if available
    const authoritativeProduct = await this.persistProductToServer(updated);
    const currentIdx = this.products.findIndex((p) => p._id === id || p._id === updated._id);
    if (currentIdx !== -1) {
      this.products[currentIdx] = authoritativeProduct;
    }
    this.saveProductsBackup();
    notifySubscribers();
    return authoritativeProduct;
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

    const convexCreateArgs = buildConvexCreateProductArgs(copy);
    const convexRes = await this.callConvexMutation<string>('products:create', convexCreateArgs);
    if (convexRes.ok && typeof convexRes.value === 'string' && convexRes.value) {
      copy._id = convexRes.value;
    }

    this.products.unshift(copy);
    this.saveProductsBackup();
    notifySubscribers();

    const authoritativeCopy = await this.persistProductToServer(copy);
    const idx = this.products.findIndex((p) => p._id === copy._id);
    if (idx !== -1) {
      this.products[idx] = authoritativeCopy;
    }
    this.saveProductsBackup();
    notifySubscribers();
    return authoritativeCopy;
  }

  /**
   * Soft-deletes (archives) a product if orders depend on it, or deletes if no orders exist.
   * Existing orders and analytics never break.
   */
  public async deleteProduct(
    id: string
  ): Promise<{ deleted: boolean; archived: boolean; product?: Product }> {
    const hasOrders = this.orders.some((o) => o.productId === id);

    if (hasOrders) {
      const archived = await this.updateProduct(id, { status: 'ARCHIVED', isPublished: false });
      return { deleted: false, archived: true, product: archived };
    }

    this.deletedProductIds.add(id);
    this.products = this.products.filter((p) => p._id !== id);
    this.saveProductsBackup();
    notifySubscribers();

    if (!id.startsWith('prod_')) {
      await this.callConvexMutation('products:remove', { id });
    }

    if (typeof window !== 'undefined') {
      try {
        await fetch(`/api/db/product/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch {}
    }

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
    this.saveProductsBackup();
    notifySubscribers();

    // Await Convex Cloud persistence directly so cross-device mobile orders are 100% saved in Convex Cloud before resolving
    await Promise.all([
      this.persistOrderToConvexCloud(newOrder, true),
      this.persistTelemetryToConvexCloud(),
    ]);

    if (typeof window !== 'undefined') {
      try {
        const compactOrderForServer: Order = {
          ...newOrder,
          productImage:
            newOrder.productImage && newOrder.productImage.startsWith('data:')
              ? ''
              : newOrder.productImage,
        };
        const res = await fetch('/api/db/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: compactOrderForServer,
            statusHistory: initialHistory,
            orderEvent: orderCreatedEvent,
          }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const resData = await res.json();
          if (resData && resData.ok && resData.order) {
            const mergedOrder: Order = {
              ...resData.order,
              productImage: newOrder.productImage || resData.order.productImage,
            };
            const idx = this.orders.findIndex((o) => o._id === newOrder._id);
            if (idx !== -1) {
              this.orders[idx] = mergedOrder;
            }
            this.saveProductsBackup();
            notifySubscribers();
            return mergedOrder;
          }
        }
      } catch {}
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

    this.saveProductsBackup();
    notifySubscribers();

    void this.persistOrderToConvexCloud(updatedOrder);
    this.scheduleTelemetryConvexSync();

    if (typeof window !== 'undefined') {
      try {
        const compactUpdated: Order = {
          ...updatedOrder,
          productImage:
            updatedOrder.productImage && updatedOrder.productImage.startsWith('data:')
              ? ''
              : updatedOrder.productImage,
        };
        const res = await fetch('/api/db/order-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: updatedOrder._id,
            status,
            updatedOrder: compactUpdated,
            historyEntry,
            lifecycleEvent,
          }),
        });
        if (res.ok) {
          const resData = await res.json().catch(() => null);
          if (resData?.ok && resData.order) {
            const currentIdx = this.orders.findIndex((o) => o._id === orderId);
            if (currentIdx !== -1) {
              this.orders[currentIdx] = {
                ...resData.order,
                productImage: updatedOrder.productImage || resData.order.productImage,
              };
            }
            this.saveProductsBackup();
            notifySubscribers();
          }
        }
      } catch {}
    }

    return updatedOrder;
  }

  public async deleteOrder(orderId: string): Promise<boolean> {
    const count = await this.deleteOrders([orderId]);
    return count > 0;
  }

  public async deleteOrders(orderIds: string[]): Promise<number> {
    if (!Array.isArray(orderIds) || orderIds.length === 0) return 0;
    const idSet = new Set(orderIds.filter(Boolean));
    if (idSet.size === 0) return 0;

    const targetOrders = this.orders.filter((o) => idSet.has(o._id));
    const initialLen = this.orders.length;

    idSet.forEach((id) => this.deletedOrderIds.add(id));
    this.orders = this.orders.filter((o) => !idSet.has(o._id));
    this.orderStatusHistory = this.orderStatusHistory.filter((h) => !idSet.has(h.orderId));
    this.analyticsEvents = this.analyticsEvents.filter((e) => {
      const metaOrderId = e.metadata?.orderId ? String(e.metadata.orderId) : '';
      if (metaOrderId && idSet.has(metaOrderId)) return false;
      if (e._id && e._id.startsWith('evt_ord_')) {
        const extracted = e._id.replace('evt_ord_', '');
        if (idSet.has(extracted)) return false;
      }
      return true;
    });

    const removedCount = initialLen - this.orders.length;
    this.saveProductsBackup();
    notifySubscribers();

    for (const targetOrder of targetOrders) {
      void this.persistOrderToConvexCloud(targetOrder);
    }
    this.scheduleTelemetryConvexSync();

    if (typeof window !== 'undefined') {
      if (idSet.size === 1) {
        const singleId = Array.from(idSet)[0];
        await fetch(`/api/db/order/${encodeURIComponent(singleId)}`, {
          method: 'DELETE',
        }).catch(() => {});
      } else {
        await fetch('/api/db/orders/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIds: Array.from(idSet) }),
        }).catch(() => {});
      }
    }

    return removedCount;
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
    this.saveProductsBackup();
    notifySubscribers();
    this.scheduleTelemetryConvexSync();

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
    this.saveProductsBackup();
    notifySubscribers();
    void this.persistSettingsToConvexCloud();

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/db/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: this.settings }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data.settings) {
            this.settings = { ...this.settings, ...data.settings };
            this.saveProductsBackup();
            notifySubscribers();
          }
        }
      } catch {}
    }

    return this.settings;
  }

  public async updateCampaignAdSpend(campaign: string, spend: number): Promise<StoreSettings> {
    const spends = { ...(this.settings.campaignAdSpends || {}) };
    spends[campaign] = Math.max(0, Number(spend) || 0);
    this.settings.campaignAdSpends = spends;
    this.saveProductsBackup();
    notifySubscribers();
    void this.persistSettingsToConvexCloud();

    if (typeof window !== 'undefined') {
      await fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: this.settings }),
      }).catch(() => {});
    }

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
