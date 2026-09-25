/**
 * Convex Schema definition for COD Landing Builder
 */

export interface ProductVariantGroup {
  id: string;
  name: string; // e.g. "الحجم / Size" or "اللون / Color"
  options: string[]; // e.g. ["S", "M", "L", "XL"] or ["أسود / Black", "ذهبي / Gold"]
}

export interface ProductBenefit {
  id: string;
  title: string;
  description?: string;
  icon: string; // icon name from lucide (e.g. "Truck", "ShieldCheck", "Clock", "RotateCcw", "CheckCircle", "Sparkles", "Award")
}

export interface ProductFAQ {
  question: string;
  answer: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number;
  currency: string;
  images: string[];
  templateId: 'classic-cod' | 'premium' | 'big-offer';
  offerText: string;
  shippingText: string;
  returnPolicy: string;
  benefits: ProductBenefit[];
  variants: ProductVariantGroup[];
  ctaText: string;
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  badgeText?: string;
  faqs?: ProductFAQ[];

  // Scarcity & Countdown Settings
  scarcityEnabled?: boolean;
  stockQuantity?: number;
  countdownEnabled?: boolean;
  countdownDurationMinutes?: number;
  countdownEndsAt?: string;

  // SEO & Social Share Settings
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;

  // WhatsApp CTA
  whatsappEnabled?: boolean;
  whatsappNumber?: string;

  // Per-Product Tracking Overrides
  useCustomPixels?: boolean;
  customMetaPixelId?: string;
  customTikTokPixelId?: string;

  createdAt: number;
  updatedAt: number;
}

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  _id: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  quantity: number;
  variants: Record<string, string>;
  notes?: string;
  total: number;
  currency: string;
  status: OrderStatus;
  sessionId?: string;
  eventId?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  createdAt: number;
}

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'VIEW_CONTENT'
  | 'CTA_CLICK'
  | 'FORM_VIEW'
  | 'FORM_START'
  | 'VARIANT_SELECT'
  | 'QUANTITY_CHANGE'
  | 'FORM_SUBMIT'
  | 'ORDER_SUCCESS'
  | 'WHATSAPP_CLICK'
  | 'PRODUCT_IMAGE_VIEW';

export interface AnalyticsEvent {
  _id: string;
  eventId: string;
  eventType: AnalyticsEventType;
  productId: string;
  sessionId: string;
  timestamp: number;
  pageUrl: string;
  referrer: string;
  userAgent?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  metadata?: Record<string, any>;
}

export interface Template {
  _id: string;
  id: 'classic-cod' | 'premium' | 'big-offer';
  name: string;
  slug: string;
  description: string;
  previewImage: string;
  tag: string;
  features: string[];
  active: boolean;
}

export interface StoreSettings {
  _id: string;
  storeName: string;
  defaultCurrency: string;
  defaultShippingText: string;
  defaultReturnPolicy: string;
  moroccoCities: string[];
  contactPhone: string;

  // Marketing & Tracking Pixels
  metaPixelId?: string;
  enableMetaPixel?: boolean;
  tiktokPixelId?: string;
  enableTikTokPixel?: boolean;
  googleAnalyticsId?: string;
  enableGoogleAnalytics?: boolean;

  // Manual Ad Spend per campaign (e.g. { "elixir_spring_tiktok": 450 })
  campaignAdSpends?: Record<string, number>;
}
