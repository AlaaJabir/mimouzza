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
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  createdAt: number;
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
}
