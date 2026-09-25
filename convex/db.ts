/**
 * In-memory & Persistent Reactive Store for Convex Backend
 * Supports BroadcastChannel for immediate multi-tab sync,
 * and immediate local reactive dispatch for zero-latency UI updates.
 */

import { Product, Order, Template, StoreSettings, AnalyticsEvent } from './schema';

const STORAGE_KEYS = {
  PRODUCTS: 'cod_convex_products_v2',
  ORDERS: 'cod_convex_orders_v2',
  TEMPLATES: 'cod_convex_templates_v2',
  SETTINGS: 'cod_convex_settings_v2',
  ANALYTICS: 'cod_convex_analytics_v2',
  INITIALIZED: 'cod_convex_v2_init',
};

export const INITIAL_TEMPLATES: Template[] = [
  {
    _id: 'tpl_1',
    id: 'classic-cod',
    name: 'Classic COD',
    slug: 'classic-cod',
    description: 'Product-focused layout with large hero visual, immediate social proof, benefit badges, high-converting offer banner, and direct COD checkout form.',
    previewImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    tag: 'Highest Converting for Ads',
    features: ['Top Trust Announcement Bar', 'Interactive Image Carousel', 'Urgency Discount Badge', 'Sticky Mobile Order CTA', 'One-Click Cash on Delivery Form'],
    active: true,
  },
  {
    _id: 'tpl_2',
    id: 'premium',
    name: 'Premium Product',
    slug: 'premium',
    description: 'Editorial luxury design with sleek typography, generous spacing, detailed craftsmanship showcase, specifications grid, and high-trust checkout module.',
    previewImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    tag: 'Luxury & Electronics',
    features: ['Split Hero Showcase', 'Minimalist Aesthetic', 'Product Feature Highlights', 'Interactive Variant Chips', 'Premium Guarantee Badges'],
    active: true,
  },
  {
    _id: 'tpl_3',
    id: 'big-offer',
    name: 'Big Offer',
    slug: 'big-offer',
    description: 'Aggressive sales page with live countdown timer, limited stock urgency indicators, massive savings comparison, and prominent multi-variant selection.',
    previewImage: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    tag: 'Flash Sales & Bundles',
    features: ['Configurable Countdown Timer', 'Configurable Stock Scarcity Warning', 'Price Comparison Strikethrough', 'Dual CTA Triggers', 'Highlight Testimonial Proof'],
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
  campaignAdSpends: {
    elixir_spring_tiktok: 600,
    prosound_audiophiles: 450,
    aviator_luxury_v1: 350,
  },
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    _id: 'prod_beauty_1',
    name: "L'Élixir Précieux 7-en-1 — سيروم الأرغان وماء الورد الملكي",
    slug: 'elixir-argan-rose-7in1',
    shortDescription: 'الطقس الملكي المغربي للعناية الفائقة بالبشرة والشعر. تركيبة طبيعية 100% معصورة على البارد وغنية بفيتامين E ومضادات الأكسدة.',
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
      { id: 'b1', title: 'طبيعي وعضوي 100%', description: 'مستخلص نقي معصور على البارد بأعلى معايير الجودة', icon: 'Sparkles' },
      { id: 'b2', title: 'توصيل مجاني لباب منزلك', description: 'خلال 24 إلى 48 ساعة لجميع مدن وقرى المغرب', icon: 'Truck' },
      { id: 'b3', title: 'الدفع عند الاستلام (COD)', description: 'لا تدفع أي درهم حتى تستلم طردك وتتأكد من المنتج', icon: 'ShieldCheck' },
      { id: 'b4', title: 'ضمان الرضا أو الاسترجاع', description: 'إمكانية إرجاع المنتج أو استبداله مجاناً خلال 14 يوماً', icon: 'RotateCcw' },
    ],
    variants: [
      {
        id: 'format',
        name: 'اختر العرض المناسب',
        options: ['عبوة واحدة 50 مل (299 DH)', 'عرض التوفير عبوتين 2×50 مل (499 DH) — وفر 100 DH'],
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
    seoDescription: 'سيروم الأرغان المغربي النقي 100% لبشرة مشرقة وشعر صحي. الدفع عند الاستلام مع شحن مجاني.',
    ogTitle: "L'Élixir Précieux 7-en-1 — عرض حصري بالمغرب",
    ogDescription: 'توصيل سريع مجاني لباب المنزل والدفع بعد المعاينة.',
    ogImage: '/src/assets/images/seed_beauty_serum_1790331758543.jpg',
    whatsappEnabled: true,
    whatsappNumber: '212661234567',
    faqs: [
      { question: 'هل المنتج أصلي وطبيعي 100%؟', answer: 'نعم، إكسير الأرغان معصور على البارد من حبات الأرغان المغربية النقية مع خلاصة الورد الدمشقي، خالي من أي إضافات كيميائية أو مواد حافظة.' },
      { question: 'متى سأستلم طلبي؟', answer: 'نقوم بشحن الطلبيات فور تأكيدها هاتفياً، ويصلك الطرد خلال 24 إلى 48 ساعة لباب منزلك في أي مدينة مغربية.' },
      { question: 'كيف يتم الدفع؟', answer: 'الدفع يتم نقداً عند الاستلام (Cash on Delivery) بعد أن تفحص الطرد وتسلمه من عامل التوصيل.' },
      { question: 'هل يمكنني إرجاع المنتج إذا لم يعجبني؟', answer: 'بالتأكيد، نوفر لك ضمان استبدال أو استرجاع كامل المبلغ خلال 14 يوماً بدون أي تعقيدات.' },
    ],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    _id: 'prod_electronics_2',
    name: 'ProSound Wave Ultra-ANC — سماعات عازلة للضوضاء اللاسلكية',
    slug: 'prosound-ultra-anc',
    shortDescription: 'صوت نقي فائق الدقة مع تقنية إلغاء الضوضاء الفعالة ANC وبطارية جبارة تدوم حتى 50 ساعة متواصلة مع شحن فائق السرعة.',
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
      { id: 'b1', title: 'عزل صوتي هجين ANC 42dB', description: 'تخلص من أصوات المحركات، المكاتب، والشارع بضغطة زر واحدة', icon: 'ShieldCheck' },
      { id: 'b2', title: 'بطارية تدوم 50 ساعة', description: 'استمع لأيام متواصلة دون الحاجة للبحث عن شاحن', icon: 'Clock' },
      { id: 'b3', title: 'صوت Hi-Res محيطي 3D', description: 'درجات صوتية نقية وتفاصيل دقيقة في الموسيقى والألعاب', icon: 'Sparkles' },
      { id: 'b4', title: 'ضمان سنة كاملة ضد العيوب', description: 'استبدال فوري أو صيانة معتمدة مجانية طوال فترة الضمان', icon: 'Award' },
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
      { question: 'هل تتوافق السماعات مع هواتف آيفون وأندرويد؟', answer: 'نعم، تدعم تقنية Bluetooth 5.3 وتتصل فورياً بجميع أجهزة iPhone و Android والحواسيب المحمولة والتلفزيونات الذكية.' },
      { question: 'ماذا يوجد داخل العلبة؟', answer: 'تحتوي العلبة على السماعة الفاخرة، حقيبة حمل مضادة للصدمات، كابل شحن Type-C سريع، كابل صوت 3.5mm، ودليل المستخدم.' },
      { question: 'هل يمكنني تجربة وفحص السماعة قبل الدفع؟', answer: 'نعم بكل تأكيد! موزع التوصيل يسمح لك بفتح الكرتون وفحص المحتويات قبل دفع ثمنها.' },
    ],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 3600000 * 6,
  },
  {
    _id: 'prod_fashion_3',
    name: 'ChronoPrecision Aviator — ساعة كرونوغراف زجاج الياقوت المقاوم للخدش',
    slug: 'chronoprecision-aviator',
    shortDescription: 'ساعة رجالية كلاسيكية فاخرة بهيكل فولاذي مقاوم للصدأ، عقارب مضيئة في الظلام، وزجاج ياقوتي مضاد للخدش والماء حتى عمق 50 متراً.',
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
      { id: 'b1', title: 'زجاج ياقوتي مضاد للخدش', description: 'يقاوم المفاتيح والعملات المعدنية والاحتكاك تماماً', icon: 'ShieldCheck' },
      { id: 'b2', title: 'مقاومة الماء حتى 50 متراً', description: 'تصميم محكم بالكامل يمنع دخول الماء والرطوبة', icon: 'CheckCircle' },
      { id: 'b3', title: 'علبة هدايا فاخرة مجانية', description: 'تأتيك مع بطاقة الضمان ومفك ضبط الحجم الأصلي', icon: 'Award' },
      { id: 'b4', title: 'معاينة الساعة قبل الدفع', description: 'افحص جودة الساعة وتأكد من عملها ثم سلم المبلغ', icon: 'Truck' },
    ],
    variants: [
      {
        id: 'strap',
        name: 'اختر نوع السوار المفضل',
        options: ['جلد طبيعي أسود أنيق (Black Leather)', 'جلد بني عتيق فاخر (Vintage Brown)', 'فولاذ فضي مصقول (Silver Steel)'],
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
    seoDescription: 'ساعة رجالية فخمة بزجاج ياقوتي Sapphire مقاوم للخدش والماء. الدفع عند الاستلام.',
    ogTitle: 'ساعة Aviator الكلاسيكية للرجال — عرض اليوم',
    ogDescription: 'علبة خشبية فاخرة مجاناً مع التوصيل السريع لجميع مدن المغرب.',
    ogImage: '/src/assets/images/seed_luxury_watch_1790331784875.jpg',
    whatsappEnabled: true,
    whatsappNumber: '212661234567',
    faqs: [
      { question: 'هل زجاج الساعة ياقوتي حقيقي؟', answer: 'نعم، زجاج كريستال ياقوتي مقسى Sapphire عالي الجودة ومقاوم لأشد الخدوش.' },
      { question: 'هل يشمل العرض علبة الساعة؟', answer: 'نعم، تأتي الساعة داخل علبة خشبية أنيقة ومبطنة بمخمل ناعم مع شهادة الضمان.' },
      { question: 'هل يمكنني إرجاع الساعة إن لم تناسبني؟', answer: 'نعم، لديك مهلة 14 يوماً للمعاينة والاستبدال أو الاسترجاع الفوري.' },
    ],
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000 * 1,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    _id: 'ord_1',
    orderNumber: 'COD-1048',
    productId: 'prod_beauty_1',
    productName: "L'Élixir Précieux 7-en-1 — سيروم الأرغان وماء الورد الملكي",
    productImage: '/src/assets/images/seed_beauty_serum_1790331758543.jpg',
    customerName: 'فاطمة الزهراء بنجلون',
    phone: '0661984210',
    city: 'الدار البيضاء (Casablanca)',
    address: 'حي المعاريف، زنقة أبو العلاء المعري، عمارة 14 شقة 3',
    quantity: 1,
    variants: { 'اختر العرض المناسب': 'عبوة واحدة 50 مل (299 DH)' },
    notes: 'الرجاء الاتصال قبل المجيء بعد الظهر',
    total: 299,
    currency: 'DH',
    status: 'NEW',
    sessionId: 'sess_seed_1',
    eventId: 'evt_order_1',
    utmSource: 'tiktok',
    utmMedium: 'cpc',
    utmCampaign: 'elixir_spring_tiktok',
    utmContent: 'video_hook_glow',
    utmTerm: 'argan_morocco',
    createdAt: Date.now() - 1000 * 60 * 24, // 24 mins ago
  },
  {
    _id: 'ord_2',
    orderNumber: 'COD-1047',
    productId: 'prod_electronics_2',
    productName: 'ProSound Wave Ultra-ANC — سماعات عازلة للضوضاء اللاسلكية',
    productImage: '/src/assets/images/seed_headphones_1790331773135.jpg',
    customerName: 'ياسين العلمي',
    phone: '0672159843',
    city: 'الرباط (Rabat)',
    address: 'حي أكدال، شارع الأطلس، إقامة النخيل رقم 22',
    quantity: 1,
    variants: { 'اختر اللون المفضل': 'أسود كربوني غير لامع (Matte Black)' },
    notes: '',
    total: 389,
    currency: 'DH',
    status: 'CONFIRMED',
    sessionId: 'sess_seed_2',
    eventId: 'evt_order_2',
    utmSource: 'facebook',
    utmMedium: 'feed',
    utmCampaign: 'prosound_audiophiles',
    utmContent: 'ad_specs_anc',
    utmTerm: '',
    createdAt: Date.now() - 1000 * 60 * 110, // ~2 hours ago
  },
  {
    _id: 'ord_3',
    orderNumber: 'COD-1046',
    productId: 'prod_fashion_3',
    productName: 'ChronoPrecision Aviator — ساعة كرونوغراف زجاج الياقوت المقاوم للخدش',
    productImage: '/src/assets/images/seed_luxury_watch_1790331784875.jpg',
    customerName: 'طارق العمراني',
    phone: '0663456789',
    city: 'مراكش (Marrakech)',
    address: 'جيليز، شارع محمد الخامس، قرب اتصالات المغرب',
    quantity: 2,
    variants: { 'اختر نوع السوار المفضل': 'جلد بني عتيق فاخر (Vintage Brown)' },
    notes: 'تأكيد إرفاق علبة الهدايا من فضلكم',
    total: 698,
    currency: 'DH',
    status: 'PROCESSING',
    sessionId: 'sess_seed_3',
    eventId: 'evt_order_3',
    utmSource: 'instagram',
    utmMedium: 'story',
    utmCampaign: 'aviator_luxury_v1',
    utmContent: 'influencer_unboxing',
    utmTerm: '',
    createdAt: Date.now() - 1000 * 3600 * 6,
  },
  {
    _id: 'ord_4',
    orderNumber: 'COD-1045',
    productId: 'prod_beauty_1',
    productName: "L'Élixir Précieux 7-en-1 — سيروم الأرغان وماء الورد الملكي",
    productImage: '/src/assets/images/seed_beauty_serum_1790331758543.jpg',
    customerName: 'مريم الصقلي',
    phone: '0660123456',
    city: 'فاس (Fès)',
    address: 'طريق عين الشقف، فيلا رقم 8',
    quantity: 1,
    variants: { 'اختر العرض المناسب': 'عرض التوفير عبوتين 2×50 مل (499 DH) — وفر 100 DH' },
    notes: '',
    total: 499,
    currency: 'DH',
    status: 'SHIPPED',
    sessionId: 'sess_seed_4',
    eventId: 'evt_order_4',
    utmSource: 'tiktok',
    utmMedium: 'cpc',
    utmCampaign: 'elixir_spring_tiktok',
    utmContent: 'transformation_ugc',
    utmTerm: '',
    createdAt: Date.now() - 1000 * 3600 * 24,
  },
  {
    _id: 'ord_5',
    orderNumber: 'COD-1044',
    productId: 'prod_electronics_2',
    productName: 'ProSound Wave Ultra-ANC — سماعات عازلة للضوضاء اللاسلكية',
    productImage: '/src/assets/images/seed_headphones_1790331773135.jpg',
    customerName: 'عبد الله المرابط',
    phone: '0665998877',
    city: 'طنجة (Tanger)',
    address: 'مالاباطا، مجمع الخليج، برج أ شقة 10',
    quantity: 1,
    variants: { 'اختر اللون المفضل': 'فضي بلاتينيوم فاخر (Silver Platinum)' },
    notes: '',
    total: 389,
    currency: 'DH',
    status: 'DELIVERED',
    sessionId: 'sess_seed_5',
    eventId: 'evt_order_5',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'search_morocco_anc',
    utmContent: 'text_ad',
    utmTerm: 'headphones anc casablanca',
    createdAt: Date.now() - 1000 * 3600 * 48,
  },
];

// Helper to generate seed events matching realistic funnel history
function generateSeedEvents(): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  const baseTime = Date.now() - 1000 * 3600 * 48;

  // Let's create realistic visitor flows for TikTok, Facebook, Instagram, Google, and Direct traffic
  const campaigns = [
    { source: 'tiktok', medium: 'cpc', campaign: 'elixir_spring_tiktok', prodId: 'prod_beauty_1', sessions: 28 },
    { source: 'facebook', medium: 'feed', campaign: 'prosound_audiophiles', prodId: 'prod_electronics_2', sessions: 22 },
    { source: 'instagram', medium: 'story', campaign: 'aviator_luxury_v1', prodId: 'prod_fashion_3', sessions: 18 },
    { source: 'google', medium: 'cpc', campaign: 'search_morocco_anc', prodId: 'prod_electronics_2', sessions: 12 },
    { source: 'direct', medium: '', campaign: '', prodId: 'prod_beauty_1', sessions: 10 },
  ];

  let evtCounter = 1;

  campaigns.forEach((camp) => {
    for (let s = 0; s < camp.sessions; s++) {
      const sessId = `sess_gen_${camp.source}_${s}`;
      const timeOffset = Math.floor(Math.random() * (Date.now() - baseTime));
      const sessTime = baseTime + timeOffset;

      // 1. PAGE_VIEW
      events.push({
        _id: `evt_${evtCounter++}`,
        eventId: `ev_${evtCounter}`,
        eventType: 'PAGE_VIEW',
        productId: camp.prodId,
        sessionId: sessId,
        timestamp: sessTime,
        pageUrl: `/p/${camp.prodId}`,
        referrer: camp.source === 'direct' ? '' : `https://${camp.source}.com`,
        utmSource: camp.source,
        utmMedium: camp.medium,
        utmCampaign: camp.campaign,
        utmContent: 'ad_v1',
        utmTerm: '',
        metadata: {},
      });

      // 2. VIEW_CONTENT
      events.push({
        _id: `evt_${evtCounter++}`,
        eventId: `ev_${evtCounter}`,
        eventType: 'VIEW_CONTENT',
        productId: camp.prodId,
        sessionId: sessId,
        timestamp: sessTime + 2000,
        pageUrl: `/p/${camp.prodId}`,
        referrer: '',
        utmSource: camp.source,
        utmMedium: camp.medium,
        utmCampaign: camp.campaign,
        utmContent: '',
        utmTerm: '',
        metadata: {},
      });

      // ~65% click a CTA
      if (Math.random() < 0.65) {
        const ctaList = ['hero_cta', 'sticky_cta', 'mid_page_cta', 'final_cta'];
        const chosenCta = ctaList[Math.floor(Math.random() * ctaList.length)];

        events.push({
          _id: `evt_${evtCounter++}`,
          eventId: `ev_${evtCounter}`,
          eventType: 'CTA_CLICK',
          productId: camp.prodId,
          sessionId: sessId,
          timestamp: sessTime + 8000,
          pageUrl: `/p/${camp.prodId}`,
          referrer: '',
          utmSource: camp.source,
          utmMedium: camp.medium,
          utmCampaign: camp.campaign,
          utmContent: '',
          utmTerm: '',
          metadata: { elementId: chosenCta },
        });

        // FORM_VIEW
        events.push({
          _id: `evt_${evtCounter++}`,
          eventId: `ev_${evtCounter}`,
          eventType: 'FORM_VIEW',
          productId: camp.prodId,
          sessionId: sessId,
          timestamp: sessTime + 9000,
          pageUrl: `/p/${camp.prodId}`,
          referrer: '',
          utmSource: camp.source,
          utmMedium: camp.medium,
          utmCampaign: camp.campaign,
          utmContent: '',
          utmTerm: '',
          metadata: {},
        });

        // ~70% of CTA clickers start filling the form
        if (Math.random() < 0.7) {
          events.push({
            _id: `evt_${evtCounter++}`,
            eventId: `ev_${evtCounter}`,
            eventType: 'FORM_START',
            productId: camp.prodId,
            sessionId: sessId,
            timestamp: sessTime + 12000,
            pageUrl: `/p/${camp.prodId}`,
            referrer: '',
            utmSource: camp.source,
            utmMedium: camp.medium,
            utmCampaign: camp.campaign,
            utmContent: '',
            utmTerm: '',
            metadata: { firstField: 'customerName' },
          });
        }
      }
    }
  });

  return events;
}

// Broadcast Channel for multi-tab real-time reactivity
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('convex_reactive_sync_v2');
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

function notifySubscribers() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'MUTATION_OCCURRED', timestamp: Date.now() });
    } catch {}
  }
}

if (broadcastChannel) {
  broadcastChannel.onmessage = () => {
    listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  };
}

// In-memory cache synced with localStorage
class ConvexMemoryStore {
  private products: Product[] = [];
  private orders: Order[] = [];
  private templates: Template[] = [];
  private settings: StoreSettings = INITIAL_SETTINGS;
  private analyticsEvents: AnalyticsEvent[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') {
      this.products = [...INITIAL_PRODUCTS];
      this.orders = [...INITIAL_ORDERS];
      this.templates = [...INITIAL_TEMPLATES];
      this.settings = { ...INITIAL_SETTINGS };
      this.analyticsEvents = generateSeedEvents();
      return;
    }

    try {
      const storedInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
      if (!storedInit) {
        this.products = [...INITIAL_PRODUCTS];
        this.orders = [...INITIAL_ORDERS];
        this.templates = [...INITIAL_TEMPLATES];
        this.settings = { ...INITIAL_SETTINGS };
        this.analyticsEvents = generateSeedEvents();
        this.persist();
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      } else {
        const prodData = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const orderData = localStorage.getItem(STORAGE_KEYS.ORDERS);
        const tplData = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
        const setData = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const anData = localStorage.getItem(STORAGE_KEYS.ANALYTICS);

        this.products = prodData ? JSON.parse(prodData) : [...INITIAL_PRODUCTS];
        this.orders = orderData ? JSON.parse(orderData) : [...INITIAL_ORDERS];
        this.templates = tplData ? JSON.parse(tplData) : [...INITIAL_TEMPLATES];
        this.settings = setData ? JSON.parse(setData) : { ...INITIAL_SETTINGS };
        this.analyticsEvents = anData ? JSON.parse(anData) : generateSeedEvents();
      }
    } catch (e) {
      console.error('Error initializing store:', e);
      this.products = [...INITIAL_PRODUCTS];
      this.orders = [...INITIAL_ORDERS];
      this.templates = [...INITIAL_TEMPLATES];
      this.settings = { ...INITIAL_SETTINGS };
      this.analyticsEvents = generateSeedEvents();
    }
    this.initialized = true;
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      // Keep up to 2000 events to prevent quota overflow
      const trimmedEvents = this.analyticsEvents.slice(-2000);
      localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(trimmedEvents));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return [...this.products];
  }

  public getProductBySlug(slug: string): Product | null {
    return this.products.find((p) => p.slug === slug) || null;
  }

  public getProductById(id: string): Product | null {
    return this.products.find((p) => p._id === id) || null;
  }

  public createProduct(data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Product {
    const newProduct: Product = {
      ...data,
      _id: 'prod_' + Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.products.unshift(newProduct);
    this.persist();
    notifySubscribers();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const idx = this.products.findIndex((p) => p._id === id);
    if (idx === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    const updated = {
      ...this.products[idx],
      ...updates,
      updatedAt: Date.now(),
    };
    this.products[idx] = updated;
    this.persist();
    notifySubscribers();
    return updated;
  }

  public duplicateProduct(id: string): Product {
    const original = this.getProductById(id);
    if (!original) throw new Error('Product not found');
    const newSlug = `${original.slug}-copy-${Math.floor(Math.random() * 1000)}`;
    const copy: Product = {
      ...original,
      _id: 'prod_' + Math.random().toString(36).substring(2, 9),
      name: `${original.name} (نسخة / Copy)`,
      slug: newSlug,
      isPublished: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.products.unshift(copy);
    this.persist();
    notifySubscribers();
    return copy;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p._id !== id);
    if (this.products.length !== initialLen) {
      this.persist();
      notifySubscribers();
      return true;
    }
    return false;
  }

  // --- ORDERS & DUPLICATE PROTECTION ---
  public getOrders(): Order[] {
    return [...this.orders].sort((a, b) => b.createdAt - a.createdAt);
  }

  public checkDuplicateOrder(productId: string, phone: string, timeWindowMinutes = 10): Order | null {
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    const threshold = Date.now() - timeWindowMinutes * 60 * 1000;

    const existing = this.orders.find((o) => {
      const orderCleanPhone = o.phone.replace(/[\s\-\(\)\.]/g, '');
      return (
        o.productId === productId &&
        orderCleanPhone === cleanPhone &&
        o.createdAt >= threshold &&
        o.status !== 'CANCELLED'
      );
    });

    return existing || null;
  }

  public createOrder(data: Omit<Order, '_id' | 'orderNumber' | 'createdAt'>): Order {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...data,
      _id: 'ord_' + Math.random().toString(36).substring(2, 9),
      orderNumber: `COD-${randomSuffix}`,
      createdAt: Date.now(),
    };
    this.orders.unshift(newOrder);

    // If stock quantity is managed and enabled, decrement stock
    const product = this.getProductById(data.productId);
    if (product && product.scarcityEnabled && product.stockQuantity && product.stockQuantity > 0) {
      this.updateProduct(product._id, {
        stockQuantity: Math.max(0, product.stockQuantity - data.quantity),
      });
    }

    this.persist();
    notifySubscribers();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: Order['status']): Order {
    const idx = this.orders.findIndex((o) => o._id === orderId);
    if (idx === -1) throw new Error(`Order ${orderId} not found`);
    this.orders[idx].status = status;
    this.persist();
    notifySubscribers();
    return this.orders[idx];
  }

  // --- ANALYTICS EVENTS ---
  public logAnalyticsEvent(event: Omit<AnalyticsEvent, '_id'>): AnalyticsEvent {
    const newEvent: AnalyticsEvent = {
      ...event,
      _id: 'evt_' + Math.random().toString(36).substring(2, 11),
      timestamp: event.timestamp || Date.now(),
    };
    this.analyticsEvents.push(newEvent);

    // Cap events in memory
    if (this.analyticsEvents.length > 5000) {
      this.analyticsEvents = this.analyticsEvents.slice(-4000);
    }

    this.persist();
    notifySubscribers();
    return newEvent;
  }

  public getAnalyticsEvents(filter?: {
    productId?: string;
    since?: number;
    until?: number;
    eventType?: string;
  }): AnalyticsEvent[] {
    let list = this.analyticsEvents;
    if (filter?.productId) {
      list = list.filter((e) => e.productId === filter.productId);
    }
    if (filter?.since) {
      list = list.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter?.until) {
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
    notifySubscribers();
    return this.settings;
  }

  public updateCampaignAdSpend(campaign: string, spend: number): StoreSettings {
    const spends = { ...(this.settings.campaignAdSpends || {}) };
    spends[campaign] = spend;
    this.settings.campaignAdSpends = spends;
    this.persist();
    notifySubscribers();
    return this.settings;
  }

  public resetToSeed(): void {
    this.products = [...INITIAL_PRODUCTS];
    this.orders = [...INITIAL_ORDERS];
    this.templates = [...INITIAL_TEMPLATES];
    this.settings = { ...INITIAL_SETTINGS };
    this.analyticsEvents = generateSeedEvents();
    this.persist();
    notifySubscribers();
  }
}

export const db = new ConvexMemoryStore();
