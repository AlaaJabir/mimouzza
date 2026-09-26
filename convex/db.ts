/**
 * Persistent Reactive Store + Authoritative Server & Convex Cloud Sync Adapter
 * Connected to: https://valuable-emu-538.convex.cloud
 *
 * Strict Production Rules:
 *   - ZERO fake, mock, random, or hardcoded analytics/orders data.
 *   - All visitors, sessions, events, orders, and orderStatusHistory are persisted
 *     to the authoritative server database (/api/db/* -> .convex-server-db.json),
 *     Convex Cloud, and browser IndexedDB cache.
 */

import {
  Product,
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

const STORAGE_KEYS = {
  PRODUCTS: 'cod_convex_products_v3_real',
  ORDERS: 'cod_convex_orders_v3_real',
  ORDER_STATUS_HISTORY: 'cod_convex_order_history_v3_real',
  VISITORS: 'cod_convex_visitors_v3_real',
  SESSIONS: 'cod_convex_sessions_v3_real',
  TEMPLATES: 'cod_convex_templates_v3_real',
  SETTINGS: 'cod_convex_settings_v3_real',
  ANALYTICS: 'cod_convex_analytics_v3_real',
  INITIALIZED: 'cod_convex_v3_real_init',
  CONVEX_URL: 'cod_convex_cloud_url_v3_real',
};

const IDB_NAME = 'cod_convex_database_v3_real';
const IDB_VERSION = 1;
const IDB_STORE = 'kv_store';

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

export const INITIAL_PRODUCTS: Product[] = [
  {
    _id: 'prod_beauty_1',
    name: "L'Élixir Précieux 7-en-1 — سيروم الأرغان وماء الورد الملكي",
    slug: 'elixir-argan-rose-7in1',
    shortDescription:
      'الطقس الملكي المغربي للعناية الفائقة بالبشرة والشعر. تركيبة طبيعية 100% معصورة على البارد وغنية بفيتامين E ومضادات الأكسدة.',
    description: `استمتعي بإشراقة طبيعية لا مثيل لها مع إكسير الجمال المغربي الأصيل.

الميزات والفوائد الرئيسية:
• ترطيب عميق ومكثف يدوم طوال اليوم دون أي ملمس دهني.
• تجديد خلايا البشرة ومحاربة علامات التقدم في السن بفضل فيتامين E الطبيعي.
• تغذية أطراف الشعر المتقصف وإعطائه لمعاناً وحيوية استثنائية.
• ملائم لجميع أنواع البشرة، حتى الحساسة والمعرضة للاحمرار.
• خالي تماماً من البارابين، العطور الاصطناعية، والمواد الحافظة الكيميائية.

طريقة الاستخدام:
ضعي 3 إلى 4 قطرات على راحة يدك، ودلكي بلطف على الوجه والرقبة بحركات دائرية صباحاً ومساءً.`,
    price: 299,
    compareAtPrice: 499,
    currency: 'DH',
    images: [
      '/src/assets/images/seed_beauty_serum_1790331758543.jpg',
      'https://images.unsplash.com/photo-1608248597359-577c27632617?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    ],
    templateId: 'classic-cod',
    offerText: '🔥 خصم خاص 40% لهذا الأسبوع + شحن مجاني لكافة المدن',
    shippingText: '🚚 التوصيل مجاني وسريع لجميع مدن المغرب (24 - 48 ساعة)',
    returnPolicy: '🔄 إرجاع واستبدال مجاني خلال 14 يوماً مع ضمان استرداد المبلغ',
    benefits: [
      {
        id: 'b1',
        title: 'طبيعي وعضوي 100%',
        description: 'مستخلص نقي معصور على البارد بأعلى معايير الجودة',
        icon: 'Sparkles',
      },
      {
        id: 'b2',
        title: 'توصيل مجاني لباب منزلك',
        description: 'خلال 24 إلى 48 ساعة لجميع مدن وقرى المغرب',
        icon: 'Truck',
      },
      {
        id: 'b3',
        title: 'الدفع عند الاستلام (COD)',
        description: 'لا تدفع أي درهم حتى تستلم طردك وتتأكد من المنتج',
        icon: 'ShieldCheck',
      },
      {
        id: 'b4',
        title: 'ضمان الرضا أو الاسترجاع',
        description: 'إمكانية إرجاع المنتج أو استبداله مجاناً خلال 14 يوماً',
        icon: 'RotateCcw',
      },
    ],
    variants: [
      {
        id: 'format',
        name: 'اختر العرض المناسب',
        options: [
          'عبوة واحدة 50 مل (299 DH)',
          'عرض التوفير عبوتين 2×50 مل (499 DH) — وفر 100 DH',
        ],
      },
    ],
    ctaText: 'اطلب الآن بالدفع عند الاستلام',
    isPublished: true,
    rating: 4.9,
    reviewCount: 248,
    badgeText: 'الأكثر طلباً هذا الأسبوع',
    scarcityEnabled: false,
    stockQuantity: 15,
    countdownEnabled: false,
    seoTitle: "L'Élixir Précieux 7-en-1 | زيت الأرغان وماء الورد المغربي",
    seoDescription:
      'سيروم الأرغان المغربي النقي 100% لبشرة مشرقة وشعر صحي. الدفع عند الاستلام مع شحن مجاني.',
    ogTitle: "L'Élixir Précieux 7-en-1 — عرض حصري بالمغرب",
    ogDescription: 'توصيل سريع مجاني لباب المنزل والدفع بعد المعاينة.',
    ogImage: '/src/assets/images/seed_beauty_serum_1790331758543.jpg',
    whatsappEnabled: true,
    whatsappNumber: '212661234567',
    faqs: [
      {
        question: 'هل المنتج أصلي وطبيعي 100%؟',
        answer:
          'نعم، إكسير الأرغان معصور على البارد من حبات الأرغان المغربية النقية مع خلاصة الورد الدمشقي، خالي من أي إضافات كيميائية أو مواد حافظة.',
      },
      {
        question: 'متى سأستلم طلبي؟',
        answer:
          'نقوم بشحن الطلبيات فور تأكيدها هاتفياً، ويصلك الطرد خلال 24 إلى 48 ساعة لباب منزلك في أي مدينة مغربية.',
      },
      {
        question: 'كيف يتم الدفع؟',
        answer:
          'الدفع يتم نقداً عند الاستلام (Cash on Delivery) بعد أن تفحص الطرد وتسلمه من عامل التوصيل.',
      },
      {
        question: 'هل يمكنني إرجاع المنتج إذا لم يعجبني؟',
        answer:
          'بالتأكيد، نوفر لك ضمان استبدال أو استرجاع كامل المبلغ خلال 14 يوماً بدون أي تعقيدات.',
      },
    ],
    createdAt: 1790000000000,
    updatedAt: 1790000000000,
  },
  {
    _id: 'prod_electronics_2',
    name: 'ProSound Wave Ultra-ANC — سماعات عازلة للضوضاء اللاسلكية',
    slug: 'prosound-ultra-anc',
    shortDescription:
      'صوت نقي فائق الدقة مع تقنية إلغاء الضوضاء الفعالة ANC وبطارية جبارة تدوم حتى 50 ساعة متواصلة مع شحن فائق السرعة.',
    description: `انغمس في عالمك الصوتي المفضل دون أي إزعاج. سماعات ProSound Wave تجمع بين الأناقة الصوتية وأحدث تقنيات عزل الصوت الرقمي.

أبرز المواصفات:
• تقنية Hybrid Active Noise Cancelling تقلل ما يصل إلى 95% من الضوضاء المحيطة.
• محركات صوتية مغناطيسية بحجم 40 ملم لتجربة باس عميق ونغمات عالية واضحة.
• بطارية تدوم 50 ساعة متواصلة في وضع البلوتوث، و35 ساعة مع تفعيل العزل ANC.
• شحن سريع Type-C: 10 دقائق شحن تمنحك 5 ساعات استماع كاملة.
• وسائد أذن ميموري فوم ناعمة ومريحة ومغطاة بجلد بروتيني قابل للتهوية.
• ميكروفونات ذكية عازلة للرياح لمكالمات صوتية فائقة الوضوح.`,
    price: 389,
    compareAtPrice: 699,
    currency: 'DH',
    images: [
      '/src/assets/images/seed_headphones_1790331773135.jpg',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
    ],
    templateId: 'premium',
    offerText: '⚡ خصم حصري 45% + حقيبة سفر جلدية وكابل شحن مجاناً داخل العلبة',
    shippingText: '📦 شحن آمن وسريع عبر Amana Express لباب منزلك',
    returnPolicy: '🛡️ ضمان صانع رسمي لمدة 12 شهراً + تجربة مجانية 15 يوماً',
    benefits: [
      {
        id: 'b1',
        title: 'عزل صوتي هجين ANC 42dB',
        description: 'تخلص من أصوات المحركات، المكاتب، والشارع بضغطة زر واحدة',
        icon: 'ShieldCheck',
      },
      {
        id: 'b2',
        title: 'بطارية تدوم 50 ساعة',
        description: 'استمع لأيام متواصلة دون الحاجة للبحث عن شاحن',
        icon: 'Clock',
      },
      {
        id: 'b3',
        title: 'صوت Hi-Res محيطي 3D',
        description: 'درجات صوتية نقية وتفاصيل دقيقة في الموسيقى والألعاب',
        icon: 'Sparkles',
      },
      {
        id: 'b4',
        title: 'ضمان سنة كاملة ضد العيوب',
        description: 'استبدال فوري أو صيانة معتمدة مجانية طوال فترة الضمان',
        icon: 'Award',
      },
    ],
    variants: [
      {
        id: 'color',
        name: 'اختر اللون المفضل',
        options: ['أسود كربوني غير لامع (Matte Black)', 'فضي بلاتينيوم فاخر (Silver Platinum)'],
      },
    ],
    ctaText: 'احجز سماعتك الآن والدفع بعد المعاينة',
    isPublished: true,
    rating: 4.95,
    reviewCount: 312,
    badgeText: 'الإصدار المتميز 2026',
    scarcityEnabled: false,
    stockQuantity: 20,
    countdownEnabled: false,
    seoTitle: 'ProSound Wave Ultra-ANC | سماعات عزل الضوضاء اللاسلكية',
    seoDescription: 'سماعات بلوتوث عازلة للضوضاء ANC مع بطارية 50 ساعة وصوت Hi-Res فائق النقاء.',
    ogTitle: 'ProSound Wave Ultra-ANC اللاسلكية — توصيل مجاني بالمغرب',
    ogDescription: 'ضمان رسمي سنة كاملة مع الدفع نقداً عند الاستلام.',
    ogImage: '/src/assets/images/seed_headphones_1790331773135.jpg',
    whatsappEnabled: true,
    whatsappNumber: '212661234567',
    faqs: [
      {
        question: 'هل تتوافق السماعات مع هواتف آيفون وأندرويد؟',
        answer:
          'نعم، تدعم تقنية Bluetooth 5.3 وتتصل فورياً بجميع أجهزة iPhone و Android والحواسيب المحمولة والتلفزيونات الذكية.',
      },
      {
        question: 'ماذا يوجد داخل العلبة؟',
        answer:
          'تحتوي العلبة على السماعة الفاخرة، حقيبة حمل مضادة للصدمات، كابل شحن Type-C سريع، كابل صوت 3.5mm، ودليل المستخدم.',
      },
      {
        question: 'هل يمكنني تجربة وفحص السماعة قبل الدفع؟',
        answer:
          'نعم بكل تأكيد! موزع التوصيل يسمح لك بفتح الكرتون وفحص المحتويات قبل دفع ثمنها.',
      },
    ],
    createdAt: 1790000000000,
    updatedAt: 1790000000000,
  },
  {
    _id: 'prod_fashion_3',
    name: 'ChronoPrecision Aviator — ساعة كرونوغراف زجاج الياقوت المقاوم للخدش',
    slug: 'chronoprecision-aviator',
    shortDescription:
      'ساعة رجالية كلاسيكية فاخرة بهيكل فولاذي مقاوم للصدأ، عقارب مضيئة في الظلام، وزجاج ياقوتي مضاد للخدش والماء حتى عمق 50 متراً.',
    description: `أناقة كلاسيكية لا تفقد بريقها أبداً. صُممت ساعة ChronoPrecision Aviator للرجل العصري الذي يقدّر الدقة والفخامة في آنٍ واحد.

المواصفات الفنية المتميزة:
• هيكل مصنوع من الفولاذ المقاوم للصدأ بدرجة 316L الجراحية الفاخرة.
• زجاج كريستال ياقوتي مقبب (Sapphire Crystal) غير قابل للخدش تحت أي ظرف.
• حركة كرونوغراف يابانية كوارتز دقيقة جداً مع 3 موانئ فرعية وعرض التاريخ.
• مقاومة للماء حتى عمق 50 متراً (5 ATM) مناسبة للسباحة والاستحمام اليومي.
• عقارب وعلامات ساعات مطلية بمادة Super-LumiNova السويسرية للإضاءة في الظلام.
• تأتي داخل علبة خشبية فاخرة ومبطنة بالجلد المخملي تصلح كهدية راقية.`,
    price: 349,
    compareAtPrice: 650,
    currency: 'DH',
    images: [
      '/src/assets/images/seed_luxury_watch_1790331784875.jpg',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    ],
    templateId: 'big-offer',
    offerText: '💥 تخفيض قنبلة: خصم 46% للـ 20 طلباً الأولى لهذا اليوم فقط!',
    shippingText: '🚀 توصيل فوري خلال 24 ساعة للدار البيضاء والرباط وجميع المدن',
    returnPolicy: '✅ افتح الطرد وعاين الساعة قبل دفع درهم واحد',
    benefits: [
      {
        id: 'b1',
        title: 'زجاج ياقوتي مضاد للخدش',
        description: 'يقاوم المفاتيح والعملات المعدنية والاحتكاك تماماً',
        icon: 'ShieldCheck',
      },
      {
        id: 'b2',
        title: 'مقاومة الماء حتى 50 متراً',
        description: 'تصميم محكم بالكامل يمنع دخول الماء والرطوبة',
        icon: 'CheckCircle',
      },
      {
        id: 'b3',
        title: 'علبة هدايا فاخرة مجانية',
        description: 'تأتيك مع بطاقة الضمان ومفك ضبط الحجم الأصلي',
        icon: 'Award',
      },
      {
        id: 'b4',
        title: 'معاينة الساعة قبل الدفع',
        description: 'افحص جودة الساعة وتأكد من عملها ثم سلم المبلغ',
        icon: 'Truck',
      },
    ],
    variants: [
      {
        id: 'strap',
        name: 'اختر نوع السوار المفضل',
        options: [
          'جلد طبيعي أسود أنيق (Black Leather)',
          'جلد بني عتيق فاخر (Vintage Brown)',
          'فولاذ فضي مصقول (Silver Steel)',
        ],
      },
    ],
    ctaText: 'اغتنم العرض الآن قبل نفاد الكمية',
    isPublished: true,
    rating: 4.88,
    reviewCount: 179,
    badgeText: 'عرض ترويجي عاجل',
    scarcityEnabled: true,
    stockQuantity: 7,
    countdownEnabled: true,
    countdownDurationMinutes: 120,
    seoTitle: 'ساعة ChronoPrecision Aviator الياقوتية المقاومة للخدش',
    seoDescription:
      'ساعة رجالية فخمة بزجاج ياقوتي Sapphire مقاوم للخدش والماء. الدفع عند الاستلام.',
    ogTitle: 'ساعة Aviator الكلاسيكية للرجال — عرض اليوم',
    ogDescription: 'علبة خشبية فاخرة مجاناً مع التوصيل السريع لجميع مدن المغرب.',
    ogImage: '/src/assets/images/seed_luxury_watch_1790331784875.jpg',
    whatsappEnabled: true,
    whatsappNumber: '212661234567',
    faqs: [
      {
        question: 'هل زجاج الساعة ياقوتي حقيقي؟',
        answer: 'نعم، زجاج كريستال ياقوتي مقسى Sapphire عالي الجودة ومقاوم لأشد الخدوش.',
      },
      {
        question: 'هل يشمل العرض علبة الساعة؟',
        answer: 'نعم، تأتي الساعة داخل علبة خشبية أنيقة ومبطنة بمخمل ناعم مع شهادة الضمان.',
      },
      {
        question: 'هل يمكنني إرجاع الساعة إن لم تناسبني؟',
        answer: 'نعم، لديك مهلة 14 يوماً للمعاينة والاستبدال أو الاسترجاع الفوري.',
      },
    ],
    createdAt: 1790000000000,
    updatedAt: 1790000000000,
  },
];

// ZERO FAKE ORDERS: Production starts with empty orders array.
export const INITIAL_ORDERS: Order[] = [];

/**
 * Filter out any legacy demo/fake records that might exist in old storage or remote DB
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
  if (evt.sessionId && (evt.sessionId.startsWith('sess_gen_') || evt.sessionId.startsWith('sess_seed_'))) {
    return true;
  }
  if (evt._id && /^evt_\d+$/.test(evt._id)) {
    return true;
  }
  if (evt.metadata?.isTest === true) {
    return true;
  }
  return false;
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

  // Check if selected variant option matches a defined product variant option with an explicit price e.g. "(499 DH)"
  if (variants && product.variants && Array.isArray(product.variants)) {
    for (const group of product.variants) {
      const chosen = variants[group.name];
      if (chosen && Array.isArray(group.options) && group.options.includes(chosen)) {
        const priceMatch = chosen.match(/\((\d+(?:\.\d+)?)\s*(?:DH|MAD|\$|د\.م)/i);
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

// --- IndexedDB Helper ---
function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const idb = req.result;
        if (!idb.objectStoreNames.contains(IDB_STORE)) {
          idb.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const idb = await openIndexedDB();
  if (!idb) return null;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: any): Promise<void> {
  const idb = await openIndexedDB();
  if (!idb) return;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

// Broadcast Channel for multi-tab real-time reactivity
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('convex_reactive_sync_v3_real');
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
    void db.reloadFromStorage();
  };
}

export type ConvexConnectionStatus = 'connecting' | 'connected' | 'local_persisted' | 'error';

export class ConvexMemoryStore {
  private products: Product[] = [];
  private orders: Order[] = [];
  private orderStatusHistory: OrderStatusHistory[] = [];
  private visitors: Visitor[] = [];
  private sessions: AnalyticsSession[] = [];
  private templates: Template[] = [];
  private settings: StoreSettings = { ...INITIAL_SETTINGS };
  private analyticsEvents: AnalyticsEvent[] = [];
  private initialized = false;

  public convexUrl: string = DEFAULT_CONVEX_CLOUD_URL;
  public connectionStatus: ConvexConnectionStatus = 'connecting';
  public lastSyncedAt: number | null = null;
  public isHydrated = false;
  private remoteFunctionsReady = false;

  constructor() {
    this.init();
  }

  private normalizeSlug(slug: string): string {
    try {
      return decodeURIComponent(slug || '')
        .trim()
        .toLowerCase();
    } catch {
      return (slug || '').trim().toLowerCase();
    }
  }

  private init() {
    if (typeof window === 'undefined') {
      this.products = [...INITIAL_PRODUCTS];
      this.orders = [];
      this.orderStatusHistory = [];
      this.visitors = [];
      this.sessions = [];
      this.templates = [...INITIAL_TEMPLATES];
      this.settings = { ...INITIAL_SETTINGS };
      this.analyticsEvents = [];
      this.isHydrated = true;
      return;
    }

    // Purge old v2 keys that contained fake seed data
    try {
      [
        'cod_convex_orders_v2',
        'cod_convex_analytics_v2',
        'cod_convex_v2_init',
      ].forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      const envUrl = (import.meta as any).env?.VITE_CONVEX_URL;
      const savedUrl = localStorage.getItem(STORAGE_KEYS.CONVEX_URL);
      this.convexUrl = savedUrl || envUrl || DEFAULT_CONVEX_CLOUD_URL;

      const storedInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!storedInit) {
        this.products = [...INITIAL_PRODUCTS];
        this.orders = [];
        this.orderStatusHistory = [];
        this.visitors = [];
        this.sessions = [];
        this.templates = [...INITIAL_TEMPLATES];
        this.settings = { ...INITIAL_SETTINGS };
        this.analyticsEvents = [];
        this.persist();
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      } else {
        const prodData = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const orderData = localStorage.getItem(STORAGE_KEYS.ORDERS);
        const historyData = localStorage.getItem(STORAGE_KEYS.ORDER_STATUS_HISTORY);
        const visitorData = localStorage.getItem(STORAGE_KEYS.VISITORS);
        const sessionData = localStorage.getItem(STORAGE_KEYS.SESSIONS);
        const tplData = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
        const setData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const anData = localStorage.getItem(STORAGE_KEYS.ANALYTICS);

        this.products = prodData ? JSON.parse(prodData) : [...INITIAL_PRODUCTS];
        const parsedOrders: Order[] = orderData ? JSON.parse(orderData) : [];
        this.orders = parsedOrders.filter((o) => !isLegacyFakeOrder(o));
        this.orderStatusHistory = historyData ? JSON.parse(historyData) : [];
        this.visitors = visitorData ? JSON.parse(visitorData) : [];
        this.sessions = sessionData ? JSON.parse(sessionData) : [];
        this.templates = tplData ? JSON.parse(tplData) : [...INITIAL_TEMPLATES];
        this.settings = setData ? JSON.parse(setData) : { ...INITIAL_SETTINGS };
        const parsedEvents: AnalyticsEvent[] = anData ? JSON.parse(anData) : [];
        this.analyticsEvents = parsedEvents.filter((e) => !isLegacyFakeEvent(e));
      }
    } catch (e) {
      console.error('Error initializing store:', e);
      this.products = [...INITIAL_PRODUCTS];
      this.orders = [];
      this.orderStatusHistory = [];
      this.visitors = [];
      this.sessions = [];
      this.templates = [...INITIAL_TEMPLATES];
      this.settings = { ...INITIAL_SETTINGS };
      this.analyticsEvents = [];
    }
    this.initialized = true;

    // Hydrate from IndexedDB, then sync with authoritative server (/api/db/sync) & Convex Cloud
    this.hydrateFromIndexedDB()
      .then(() => this.syncWithServer())
      .finally(() => {
        this.isHydrated = true;
        notifySubscribers(false);
        void this.syncWithConvexCloud();
      });

    // Periodic background sync across devices (Server + Convex Cloud)
    setInterval(() => {
      void this.syncWithServer();
      if (this.remoteFunctionsReady) {
        void this.syncWithConvexCloud();
      }
    }, 5000);
  }

  public async syncWithServer(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: this.products,
          orders: this.orders,
          orderStatusHistory: this.orderStatusHistory,
          visitors: this.visitors,
          sessions: this.sessions,
          analyticsEvents: this.analyticsEvents,
          settings: this.settings,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ok) {
        let updated = false;
        if (Array.isArray(data.products) && data.products.length > 0) {
          this.products = data.products;
          updated = true;
        }
        if (Array.isArray(data.orders)) {
          this.orders = data.orders.filter((o: Order) => !isLegacyFakeOrder(o));
          updated = true;
        }
        if (Array.isArray(data.orderStatusHistory)) {
          this.orderStatusHistory = data.orderStatusHistory;
          updated = true;
        }
        if (Array.isArray(data.visitors)) {
          this.visitors = data.visitors;
          updated = true;
        }
        if (Array.isArray(data.sessions)) {
          this.sessions = data.sessions;
          updated = true;
        }
        if (Array.isArray(data.analyticsEvents)) {
          this.analyticsEvents = data.analyticsEvents.filter(
            (e: AnalyticsEvent) => !isLegacyFakeEvent(e)
          );
          updated = true;
        }
        if (data.settings) {
          this.settings = { ...this.settings, ...data.settings };
          updated = true;
        }
        if (updated) {
          this.lastSyncedAt = Date.now();
          this.persist();
          notifySubscribers(false);
        }
      }
    } catch {
      // Ignore network error if offline
    }
  }

  public async fetchProductBySlugFromServer(slug: string): Promise<Product | null> {
    if (typeof window === 'undefined') return null;
    try {
      const res = await fetch(`/api/db/product/${encodeURIComponent(slug)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.ok && data.product) {
        const fetched = data.product as Product;
        const idx = this.products.findIndex((p) => p._id === fetched._id);
        if (idx !== -1) {
          this.products[idx] = fetched;
        } else {
          this.products.unshift(fetched);
        }
        this.persist();
        notifySubscribers(false);
        return fetched;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  public async reloadFromStorage() {
    if (typeof window === 'undefined') return;
    await this.hydrateFromIndexedDB();
    await this.syncWithServer();
    notifySubscribers(false);
  }

  private async hydrateFromIndexedDB() {
    if (typeof window === 'undefined') return;
    try {
      const [
        idbProducts,
        idbOrders,
        idbHistory,
        idbVisitors,
        idbSessions,
        idbEvents,
        idbSettings,
        idbTemplates,
      ] = await Promise.all([
        idbGet<Product[]>(STORAGE_KEYS.PRODUCTS),
        idbGet<Order[]>(STORAGE_KEYS.ORDERS),
        idbGet<OrderStatusHistory[]>(STORAGE_KEYS.ORDER_STATUS_HISTORY),
        idbGet<Visitor[]>(STORAGE_KEYS.VISITORS),
        idbGet<AnalyticsSession[]>(STORAGE_KEYS.SESSIONS),
        idbGet<AnalyticsEvent[]>(STORAGE_KEYS.ANALYTICS),
        idbGet<StoreSettings>(STORAGE_KEYS.SETTINGS),
        idbGet<Template[]>(STORAGE_KEYS.TEMPLATES),
      ]);

      let changed = false;

      if (idbProducts && Array.isArray(idbProducts) && idbProducts.length > 0) {
        const mergedMap = new Map<string, Product>();
        idbProducts.forEach((p) => mergedMap.set(p._id, p));
        this.products.forEach((p) => {
          const existing = mergedMap.get(p._id);
          if (!existing || (p.updatedAt || 0) > (existing.updatedAt || 0)) {
            mergedMap.set(p._id, p);
          }
        });
        this.products = Array.from(mergedMap.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        changed = true;
      } else {
        await idbSet(STORAGE_KEYS.PRODUCTS, this.products);
      }

      if (idbOrders && Array.isArray(idbOrders)) {
        const mergedOrders = new Map<string, Order>();
        idbOrders.filter((o) => !isLegacyFakeOrder(o)).forEach((o) => mergedOrders.set(o._id, o));
        this.orders.filter((o) => !isLegacyFakeOrder(o)).forEach((o) => {
          const existing = mergedOrders.get(o._id);
          if (!existing || (o.updatedAt || o.createdAt) >= (existing.updatedAt || existing.createdAt)) {
            mergedOrders.set(o._id, o);
          }
        });
        this.orders = Array.from(mergedOrders.values()).sort(
          (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );
        changed = true;
      }

      if (idbHistory && Array.isArray(idbHistory)) {
        const histMap = new Map<string, OrderStatusHistory>();
        idbHistory.forEach((h) => histMap.set(h._id, h));
        this.orderStatusHistory.forEach((h) => histMap.set(h._id, h));
        this.orderStatusHistory = Array.from(histMap.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        changed = true;
      }

      if (idbVisitors && Array.isArray(idbVisitors)) {
        const visMap = new Map<string, Visitor>();
        idbVisitors.forEach((v) => visMap.set(v.visitorId, v));
        this.visitors.forEach((v) => {
          const ex = visMap.get(v.visitorId);
          if (!ex) visMap.set(v.visitorId, v);
          else {
            visMap.set(v.visitorId, {
              ...ex,
              firstSeenAt: Math.min(ex.firstSeenAt, v.firstSeenAt),
              lastSeenAt: Math.max(ex.lastSeenAt, v.lastSeenAt),
            });
          }
        });
        this.visitors = Array.from(visMap.values());
        changed = true;
      }

      if (idbSessions && Array.isArray(idbSessions)) {
        const sessMap = new Map<string, AnalyticsSession>();
        idbSessions.forEach((s) => sessMap.set(s.sessionId, s));
        this.sessions.forEach((s) => {
          const ex = sessMap.get(s.sessionId);
          if (!ex) sessMap.set(s.sessionId, s);
          else {
            sessMap.set(s.sessionId, {
              ...ex,
              startedAt: Math.min(ex.startedAt, s.startedAt),
              lastSeenAt: Math.max(ex.lastSeenAt, s.lastSeenAt),
            });
          }
        });
        this.sessions = Array.from(sessMap.values());
        changed = true;
      }

      if (idbEvents && Array.isArray(idbEvents)) {
        const evtMap = new Map<string, AnalyticsEvent>();
        idbEvents.filter((e) => !isLegacyFakeEvent(e)).forEach((e) => {
          const key = e.clientEventId || e.eventId || e._id;
          evtMap.set(key, e);
        });
        this.analyticsEvents.filter((e) => !isLegacyFakeEvent(e)).forEach((e) => {
          const key = e.clientEventId || e.eventId || e._id;
          evtMap.set(key, e);
        });
        this.analyticsEvents = Array.from(evtMap.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        );
        changed = true;
      }

      if (idbSettings) {
        this.settings = { ...this.settings, ...idbSettings };
        changed = true;
      } else {
        await idbSet(STORAGE_KEYS.SETTINGS, this.settings);
      }

      if (idbTemplates && Array.isArray(idbTemplates) && idbTemplates.length > 0) {
        this.templates = idbTemplates;
      } else {
        await idbSet(STORAGE_KEYS.TEMPLATES, this.templates);
      }

      if (changed) {
        this.persistLocalStorageOnly();
        notifySubscribers(false);
      }
    } catch (e) {
      console.warn('IndexedDB hydration warning:', e);
    }
  }

  private persistLocalStorageOnly() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(
        STORAGE_KEYS.ORDER_STATUS_HISTORY,
        JSON.stringify(this.orderStatusHistory)
      );
      localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(this.visitors));
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(this.sessions));
      const trimmedEvents = this.analyticsEvents.slice(-2500);
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(trimmedEvents));
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
        localStorage.setItem(
          STORAGE_KEYS.ANALYTICS,
          JSON.stringify(this.analyticsEvents.slice(-1500))
        );
      } catch {
        console.warn('localStorage quota reached; full data is safely persisted in Server DB & IndexedDB.');
      }
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    this.persistLocalStorageOnly();
    void idbSet(STORAGE_KEYS.PRODUCTS, this.products);
    void idbSet(STORAGE_KEYS.ORDERS, this.orders);
    void idbSet(STORAGE_KEYS.ORDER_STATUS_HISTORY, this.orderStatusHistory);
    void idbSet(STORAGE_KEYS.VISITORS, this.visitors);
    void idbSet(STORAGE_KEYS.SESSIONS, this.sessions);
    void idbSet(STORAGE_KEYS.TEMPLATES, this.templates);
    void idbSet(STORAGE_KEYS.SETTINGS, this.settings);
    void idbSet(STORAGE_KEYS.ANALYTICS, this.analyticsEvents);
  }

  // --- CONVEX CLOUD HTTP SYNC (https://valuable-emu-538.convex.cloud) ---
  public setConvexUrl(url: string) {
    const clean = url.trim().replace(/\/+$/, '');
    if (!clean) return;
    this.convexUrl = clean;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONVEX_URL, clean);
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
      return { status: 'local_persisted', message: 'SSR Mode' };
    }

    try {
      const prodRes = await this.callConvexQuery<Product[]>('products:list', {});

      if (prodRes.ok && Array.isArray(prodRes.value)) {
        this.remoteFunctionsReady = true;
        this.connectionStatus = 'connected';
        this.lastSyncedAt = Date.now();

        const remoteProducts = prodRes.value;
        if (remoteProducts.length > 0) {
          const remoteSlugs = new Set(remoteProducts.map((p) => p.slug));
          for (const localProd of this.products) {
            if (!remoteSlugs.has(localProd.slug)) {
              const { _id, createdAt, updatedAt, ...prodPayload } = localProd;
              await this.callConvexMutation('products:create', prodPayload);
            }
          }
          const refreshed = await this.callConvexQuery<Product[]>('products:list', {});
          if (refreshed.ok && Array.isArray(refreshed.value)) {
            this.products = refreshed.value;
          }
        }

        // Sync Orders (only real orders, never fake orders)
        const ordRes = await this.callConvexQuery<Order[]>('orders:list', {});
        if (ordRes.ok && Array.isArray(ordRes.value)) {
          const remoteOrders = ordRes.value.filter((o) => !isLegacyFakeOrder(o));
          if (remoteOrders.length > 0) {
            const remoteOrderNums = new Set(remoteOrders.map((o) => o.orderNumber));
            for (const localOrd of this.orders) {
              if (!remoteOrderNums.has(localOrd.orderNumber) && !isLegacyFakeOrder(localOrd)) {
                const { _id, orderNumber, createdAt, ...ordPayload } = localOrd;
                await this.callConvexMutation('orders:create', ordPayload);
              }
            }
            const refreshedOrders = await this.callConvexQuery<Order[]>('orders:list', {});
            if (refreshedOrders.ok && Array.isArray(refreshedOrders.value)) {
              this.orders = refreshedOrders.value.filter((o) => !isLegacyFakeOrder(o));
            }
          }
        }

        this.persist();
        notifySubscribers(false);
        return {
          status: 'connected',
          message: `متصل بنجاح مع Convex Cloud (${this.convexUrl})`,
        };
      }

      this.remoteFunctionsReady = false;
      this.connectionStatus = 'local_persisted';
      this.lastSyncedAt = Date.now();
      notifySubscribers(false);
      return {
        status: 'local_persisted',
        message: `متصل مع قاعدة البيانات الدائمة للخادم و ${this.convexUrl}`,
      };
    } catch {
      this.connectionStatus = 'local_persisted';
      return {
        status: 'local_persisted',
        message: 'قاعدة البيانات الدائمة مفعلة',
      };
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProductBySlug(slug: string): Product | null | undefined {
    const target = this.normalizeSlug(slug);
    const found =
      this.products.find(
        (p) => this.normalizeSlug(p.slug) === target || p._id.toLowerCase() === target
      ) || null;
    if (!found && !this.isHydrated) {
      return undefined;
    }
    return found;
  }

  public getProductById(id: string): Product | null {
    return this.products.find((p) => p._id === id) || null;
  }

  private pushProductToServer(product: Product) {
    if (typeof window === 'undefined') return;
    void fetch('/api/db/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product }),
    }).catch(() => {});
  }

  public createProduct(data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Product {
    const now = Date.now();
    const newProduct: Product = {
      ...data,
      _id: 'prod_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(newProduct);
    this.persist();
    this.pushProductToServer(newProduct);
    notifySubscribers();

    void this.callConvexMutation<Product>('products:create', data).then((res) => {
      if (res.ok && res.value) {
        const idx = this.products.findIndex((p) => p._id === newProduct._id);
        if (idx !== -1) {
          this.products[idx] = res.value;
          this.persist();
          this.pushProductToServer(res.value);
          notifySubscribers();
        }
      }
    });

    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const idx = this.products.findIndex((p) => p._id === id);
    if (idx === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    const updated: Product = {
      ...this.products[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    this.products[idx] = updated;
    this.persist();
    this.pushProductToServer(updated);
    notifySubscribers();

    void this.callConvexMutation('products:update', { id, updates });

    return updated;
  }

  public duplicateProduct(id: string): Product {
    const original = this.getProductById(id);
    if (!original) throw new Error('Product not found');
    const now = Date.now();
    const newSlug = `${original.slug}-copy-${now.toString(36).slice(-4)}`;
    const copy: Product = {
      ...original,
      _id: 'prod_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      name: `${original.name} (نسخة / Copy)`,
      slug: newSlug,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(copy);
    this.persist();
    this.pushProductToServer(copy);
    notifySubscribers();

    void this.callConvexMutation('products:duplicate', { id });

    return copy;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p._id !== id);
    if (this.products.length !== initialLen) {
      this.persist();
      if (typeof window !== 'undefined') {
        void fetch(`/api/db/product/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(
          () => {}
        );
      }
      notifySubscribers();
      void this.callConvexMutation('products:remove', { id });
      return true;
    }
    return false;
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

    // 1. Upsert Visitor
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

    // 2. Upsert Session
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

  public createOrder(
    data: Omit<Order, '_id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
  ): Order {
    // 1. Validate Product & Required Fields
    const product = this.getProductById(data.productId);
    if (!product) {
      throw new Error(`Invalid order: Product ${data.productId} does not exist.`);
    }
    if (!data.customerName?.trim() || !data.phone?.trim() || !data.city?.trim() || !data.address?.trim()) {
      throw new Error('Invalid order: Missing required customer contact or delivery fields.');
    }
    const safeQuantity = Math.max(1, Math.floor(Number(data.quantity) || 1));

    // 2. Compute authoritative order total & currency from Product DB record
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

    this.orders.unshift(newOrder);

    // 3. Record initial ORDER_STATUS_HISTORY entry
    const initialHistory: OrderStatusHistory = {
      _id: 'osh_' + now.toString(36) + '_' + Math.random().toString(36).substring(2, 7),
      orderId: newOrder._id,
      orderNumber: newOrder.orderNumber,
      productId: newOrder.productId,
      previousStatus: null,
      newStatus: 'NEW',
      timestamp: now,
    };
    this.orderStatusHistory.push(initialHistory);

    // 4. Record authoritative ORDER_CREATED event
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

    const existingEvtIdx = this.analyticsEvents.findIndex(
      (e) =>
        (e.clientEventId && e.clientEventId === orderEventId) ||
        e.eventId === orderEventId ||
        e._id === orderCreatedEvent._id
    );
    if (existingEvtIdx === -1) {
      this.analyticsEvents.push(orderCreatedEvent);
    }

    // 5. If stock quantity is managed and enabled, decrement stock
    if (product.scarcityEnabled && product.stockQuantity && product.stockQuantity > 0) {
      this.updateProduct(product._id, {
        stockQuantity: Math.max(0, product.stockQuantity - safeQuantity),
      });
    }

    this.persist();
    notifySubscribers();

    // 6. Persist to authoritative backend server (/api/db/order)
    if (typeof window !== 'undefined') {
      void fetch('/api/db/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: newOrder,
          statusHistory: initialHistory,
          orderEvent: orderCreatedEvent,
        }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res && res.ok && res.order) {
            const idx = this.orders.findIndex((o) => o._id === newOrder._id);
            if (idx !== -1) {
              this.orders[idx] = res.order;
              this.persist();
              notifySubscribers(false);
            }
          }
        })
        .catch(() => {});
    }

    void this.callConvexMutation<Order>('orders:create', data);

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): Order {
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

    // 1. Append auditable OrderStatusHistory record
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

    // 2. Emit corresponding lifecycle AnalyticsEvent
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

    this.persist();
    notifySubscribers();

    // 3. Persist to authoritative backend server
    if (typeof window !== 'undefined') {
      void fetch('/api/db/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: updatedOrder._id,
          status,
          updatedOrder,
          historyEntry,
          lifecycleEvent,
        }),
      }).catch(() => {});
    }

    void this.callConvexMutation('orders:updateStatus', { orderId, status });

    return updatedOrder;
  }

  public deleteOrder(orderId: string): boolean {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter((o) => o._id !== orderId);
    if (this.orders.length !== initialLen) {
      this.persist();
      if (typeof window !== 'undefined') {
        void fetch(`/api/db/order/${encodeURIComponent(orderId)}`, { method: 'DELETE' }).catch(
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
    // Reject test/preview events from polluting production analytics store
    if (event.metadata?.isTest || event.metadata?.isPreview) {
      return null;
    }

    const clientEventId = event.clientEventId || event.eventId;

    // 1. Deduplicate by clientEventId / eventId
    if (clientEventId) {
      const existing = this.analyticsEvents.find(
        (e) => e.clientEventId === clientEventId || e.eventId === clientEventId
      );
      if (existing) {
        return existing;
      }
    }

    // 2. Deduplicate FORM_START so a single session on a product only records 1 FORM_START
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

    // 3. Upsert Visitor & Session records
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

    this.persist();
    notifySubscribers();

    // 4. Push to authoritative server endpoint (/api/db/event) which stamps server timestamp
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
              this.persist();
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

  public updateSettings(updates: Partial<StoreSettings>): StoreSettings {
    this.settings = { ...this.settings, ...updates };
    this.persist();
    if (typeof window !== 'undefined') {
      void fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: this.settings }),
      }).catch(() => {});
    }
    notifySubscribers();

    void this.callConvexMutation('settings:update', updates);

    return this.settings;
  }

  public updateCampaignAdSpend(campaign: string, spend: number): StoreSettings {
    const spends = { ...(this.settings.campaignAdSpends || {}) };
    spends[campaign] = Math.max(0, Number(spend) || 0);
    this.settings.campaignAdSpends = spends;
    this.persist();
    if (typeof window !== 'undefined') {
      void fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: this.settings }),
      }).catch(() => {});
    }
    notifySubscribers();

    void this.callConvexMutation('settings:updateAdSpend', { campaign, spend });

    return this.settings;
  }

  public resetToSeed(): void {
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [];
    this.orderStatusHistory = [];
    this.visitors = [];
    this.sessions = [];
    this.templates = [...INITIAL_TEMPLATES];
    this.settings = { ...INITIAL_SETTINGS };
    this.analyticsEvents = [];
    this.persist();
    if (typeof window !== 'undefined') {
      void fetch('/api/db/clear-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetProducts: true }),
      }).catch(() => {});
    }
    notifySubscribers();
  }
}

export const db = new ConvexMemoryStore();
