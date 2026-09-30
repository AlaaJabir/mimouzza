/**
 * Convex Schema definition for COD Landing Builder
 * Connected to https://valuable-emu-538.convex.cloud
 */

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

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

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice: number;
  comparePrice?: number;
  currency: string;
  images: string[];
  descriptionImages?: string[];
  templateId: 'classic-cod' | 'premium' | 'big-offer';
  offerText: string;
  shippingText: string;
  returnPolicy: string;
  benefits: ProductBenefit[];
  variants: ProductVariantGroup[];
  ctaText: string;
  isPublished: boolean;
  status?: ProductStatus;
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
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED';

export interface Visitor {
  _id: string;
  visitorId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  userAgent?: string;
}

export interface AnalyticsSession {
  _id: string;
  sessionId: string;
  visitorId: string;
  productId: string;
  landingPage: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmTerm: string;
  utmContent: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  referrer: string;
  startedAt: number;
  lastSeenAt: number;
}

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
  amount?: number;
  currency: string;
  status: OrderStatus;
  visitorId?: string;
  sessionId?: string;
  eventId?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  landingPage?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface OrderStatusHistory {
  _id: string;
  orderId: string;
  orderNumber?: string;
  productId?: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  timestamp: number;
}

export type AnalyticsEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'VIEW_CONTENT'
  | 'CTA_CLICK'
  | 'FORM_VIEW'
  | 'FORM_START'
  | 'VARIANT_SELECT'
  | 'QUANTITY_CHANGE'
  | 'FORM_SUBMIT'
  | 'ORDER_CREATED'
  | 'ORDER_SUCCESS'
  | 'ORDER_CONFIRMED'
  | 'ORDER_CANCELLED'
  | 'ORDER_DELIVERED'
  | 'ORDER_FAILED'
  | 'WHATSAPP_CLICK'
  | 'PRODUCT_IMAGE_VIEW';

export interface AnalyticsEvent {
  _id: string;
  eventId: string;
  clientEventId?: string;
  eventType: AnalyticsEventType;
  visitorId: string;
  sessionId: string;
  productId: string;
  ctaId?: string;
  timestamp: number; // Authoritative server/DB timestamp
  createdAt: number; // Authoritative server/DB timestamp
  clientTimestamp?: number; // Supplementary browser clock timestamp
  pageUrl: string;
  referrer: string;
  userAgent?: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
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

  // Manual Ad Spend per campaign
  campaignAdSpends?: Record<string, number>;
}

export default defineSchema({
  products: defineTable({
    name: v.string(),
    slug: v.string(),
    shortDescription: v.string(),
    description: v.string(),
    price: v.number(),
    compareAtPrice: v.number(),
    comparePrice: v.optional(v.number()),
    currency: v.string(),
    images: v.array(v.string()),
    descriptionImages: v.optional(v.array(v.string())),
    templateId: v.union(v.literal('classic-cod'), v.literal('premium'), v.literal('big-offer')),
    offerText: v.string(),
    shippingText: v.string(),
    returnPolicy: v.string(),
    benefits: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        description: v.optional(v.string()),
        icon: v.string(),
      })
    ),
    variants: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        options: v.array(v.string()),
      })
    ),
    ctaText: v.string(),
    isPublished: v.boolean(),
    status: v.optional(v.union(v.literal('ACTIVE'), v.literal('DRAFT'), v.literal('ARCHIVED'))),
    rating: v.number(),
    reviewCount: v.number(),
    badgeText: v.optional(v.string()),
    faqs: v.optional(
      v.array(
        v.object({
          question: v.string(),
          answer: v.string(),
        })
      )
    ),
    scarcityEnabled: v.optional(v.boolean()),
    stockQuantity: v.optional(v.number()),
    countdownEnabled: v.optional(v.boolean()),
    countdownDurationMinutes: v.optional(v.number()),
    countdownEndsAt: v.optional(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    canonicalUrl: v.optional(v.string()),
    whatsappEnabled: v.optional(v.boolean()),
    whatsappNumber: v.optional(v.string()),
    useCustomPixels: v.optional(v.boolean()),
    customMetaPixelId: v.optional(v.string()),
    customTikTokPixelId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_published', ['isPublished']),

  visitors: defineTable({
    visitorId: v.string(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    userAgent: v.optional(v.string()),
  }).index('by_visitorId', ['visitorId']),

  sessions: defineTable({
    sessionId: v.string(),
    visitorId: v.string(),
    productId: v.string(),
    landingPage: v.string(),
    utmSource: v.string(),
    utmMedium: v.string(),
    utmCampaign: v.string(),
    utmTerm: v.string(),
    utmContent: v.string(),
    fbclid: v.optional(v.string()),
    fbc: v.optional(v.string()),
    fbp: v.optional(v.string()),
    referrer: v.string(),
    startedAt: v.number(),
    lastSeenAt: v.number(),
  })
    .index('by_sessionId', ['sessionId'])
    .index('by_visitorId', ['visitorId'])
    .index('by_product', ['productId']),

  orders: defineTable({
    orderNumber: v.string(),
    productId: v.string(),
    productName: v.string(),
    productImage: v.string(),
    customerName: v.string(),
    phone: v.string(),
    city: v.string(),
    address: v.string(),
    quantity: v.number(),
    variants: v.any(),
    notes: v.optional(v.string()),
    total: v.number(),
    amount: v.optional(v.number()),
    currency: v.string(),
    status: v.union(
      v.literal('NEW'),
      v.literal('PENDING'),
      v.literal('CONFIRMED'),
      v.literal('PROCESSING'),
      v.literal('SHIPPED'),
      v.literal('DELIVERED'),
      v.literal('CANCELLED'),
      v.literal('FAILED')
    ),
    visitorId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    eventId: v.optional(v.string()),
    utmSource: v.string(),
    utmMedium: v.string(),
    utmCampaign: v.string(),
    utmContent: v.string(),
    utmTerm: v.string(),
    fbclid: v.optional(v.string()),
    fbc: v.optional(v.string()),
    fbp: v.optional(v.string()),
    landingPage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_product', ['productId'])
    .index('by_status', ['status'])
    .index('by_phone', ['phone']),

  orderStatusHistory: defineTable({
    orderId: v.string(),
    orderNumber: v.optional(v.string()),
    productId: v.optional(v.string()),
    previousStatus: v.union(
      v.null(),
      v.literal('NEW'),
      v.literal('PENDING'),
      v.literal('CONFIRMED'),
      v.literal('PROCESSING'),
      v.literal('SHIPPED'),
      v.literal('DELIVERED'),
      v.literal('CANCELLED'),
      v.literal('FAILED')
    ),
    newStatus: v.union(
      v.literal('NEW'),
      v.literal('PENDING'),
      v.literal('CONFIRMED'),
      v.literal('PROCESSING'),
      v.literal('SHIPPED'),
      v.literal('DELIVERED'),
      v.literal('CANCELLED'),
      v.literal('FAILED')
    ),
    timestamp: v.number(),
  })
    .index('by_order', ['orderId'])
    .index('by_timestamp', ['timestamp']),

  templates: defineTable({
    id: v.union(v.literal('classic-cod'), v.literal('premium'), v.literal('big-offer')),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    previewImage: v.string(),
    tag: v.string(),
    features: v.array(v.string()),
    active: v.boolean(),
  }),

  settings: defineTable({
    storeName: v.string(),
    defaultCurrency: v.string(),
    defaultShippingText: v.string(),
    defaultReturnPolicy: v.string(),
    moroccoCities: v.array(v.string()),
    contactPhone: v.string(),
    metaPixelId: v.optional(v.string()),
    enableMetaPixel: v.optional(v.boolean()),
    tiktokPixelId: v.optional(v.string()),
    enableTikTokPixel: v.optional(v.boolean()),
    googleAnalyticsId: v.optional(v.string()),
    enableGoogleAnalytics: v.optional(v.boolean()),
    campaignAdSpends: v.optional(v.any()),
  }),

  analyticsEvents: defineTable({
    eventId: v.string(),
    clientEventId: v.optional(v.string()),
    eventType: v.string(),
    visitorId: v.string(),
    sessionId: v.string(),
    productId: v.string(),
    ctaId: v.optional(v.string()),
    timestamp: v.number(),
    createdAt: v.number(),
    clientTimestamp: v.optional(v.number()),
    pageUrl: v.string(),
    referrer: v.string(),
    userAgent: v.optional(v.string()),
    utmSource: v.string(),
    utmMedium: v.string(),
    utmCampaign: v.string(),
    utmContent: v.string(),
    utmTerm: v.string(),
    fbclid: v.optional(v.string()),
    fbc: v.optional(v.string()),
    fbp: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index('by_product', ['productId'])
    .index('by_timestamp', ['timestamp'])
    .index('by_visitor', ['visitorId'])
    .index('by_session', ['sessionId']),
});
