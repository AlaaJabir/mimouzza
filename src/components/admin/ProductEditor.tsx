import React, { useState } from 'react';
import { Product, ProductBenefit, ProductStatus } from '../../../convex/schema';
import { useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { getProductStatus, normalizeProductSlug } from '../../../convex/db';
import { activateMetaPixelId } from '../../lib/tracking';
import { ImageManager, DescriptionImagesManager } from './ImageManager';
import { VariantEditor } from './VariantEditor';
import { TemplateSelector } from './TemplateSelector';
import { LivePreview } from './LivePreview';
import { Button } from '../ui/button';
import { Input, Textarea } from '../ui/input';
import {
  Save,
  Eye,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Columns,
  Maximize2,
  Copy,
} from 'lucide-react';

interface ProductEditorProps {
  initialProduct?: Product | null;
  onBack: () => void;
  onSaved: (savedProduct: Product) => void;
}

export const ProductEditor: React.FC<ProductEditorProps> = ({
  initialProduct,
  onBack,
  onSaved,
}) => {
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);

  const isEditing = Boolean(initialProduct?._id);

  // Form state
  const [formData, setFormData] = useState<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>(() => {
    if (initialProduct) {
      const { _id, createdAt, updatedAt, ...rest } = initialProduct;
      const status = getProductStatus(initialProduct);
      return {
        ...rest,
        status,
        isPublished: status === 'ACTIVE',
      };
    }
    return {
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      price: 299,
      compareAtPrice: 499,
      currency: 'DH',
      images: [],
      descriptionImages: [],
      templateId: 'classic-cod',
      offerText: '🔥 خصم حصري لفترة محدودة + شحن مجاني لكافة المدن',
      shippingText: '🚚 التوصيل مجاني وسريع لجميع مدن المغرب — الدفع عند الاستلام',
      returnPolicy: '🔄 إرجاع واستبدال مجاني خلال 14 يوماً مع ضمان كامل',
      benefits: [
        { id: 'b1', title: 'جودة أصلية ممتازة 100%', description: 'معتمدة ومطابقة لأعلى المواصفات', icon: 'Award' },
        { id: 'b2', title: 'توصيل مجاني لباب المنزل', description: 'خلال 24-48 ساعة لجميع المدن', icon: 'Truck' },
        { id: 'b3', title: 'الدفع نقداً بعد المعاينة', description: 'عاين طردك وافتحه قبل الدفع', icon: 'ShieldCheck' },
      ],
      variants: [],
      ctaText: 'اطلب الآن بالدفع عند الاستلام',
      isPublished: true,
      status: 'ACTIVE',
      rating: 4.9,
      reviewCount: 150,
      badgeText: 'العرض الأكثر مبيعاً',
      faqs: [
        { question: 'متى سأستلم طلبي؟', answer: 'يصلك الطلب خلال 24 إلى 48 ساعة بعد تأكيد العنوان هاتفياً.' },
        { question: 'كيف يتم الدفع؟', answer: 'الدفع يتم نقداً عند الاستلام بعد معاينة المنتج.' },
      ],
    };
  });

  const [splitView, setSplitView] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto generate slug if empty (supports both Latin and Arabic product names)
  const handleNameChange = (name: string) => {
    setFormData((prev) => {
      const updates: Partial<typeof prev> = { name };
      if (!isEditing && (!prev.slug || prev.slug.startsWith('product-') || prev.slug.startsWith('prod-'))) {
        const latinPart = name
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        if (latinPart && latinPart.length >= 2) {
          updates.slug = latinPart;
        } else if (name.trim().length > 0 && !prev.slug) {
          updates.slug = `prod-${Math.floor(1000 + Math.random() * 9000)}`;
        }
      }
      return { ...prev, ...updates };
    });
  };

  const generateRandomSlug = () => {
    const slug = (formData.name || 'product')
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30) || 'product';
    setFormData((prev) => ({
      ...prev,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
    }));
  };

  // Benefits handling
  const handleAddBenefit = () => {
    const newB: ProductBenefit = {
      id: 'b_' + Math.random().toString(36).substring(2, 7),
      title: 'ميزة جديدة',
      description: 'وصف توضيحي لهذه الميزة',
      icon: 'CheckCircle',
    };
    setFormData((prev) => ({ ...prev, benefits: [...prev.benefits, newB] }));
  };

  const handleUpdateBenefit = (id: string, updates: Partial<ProductBenefit>) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  };

  const handleRemoveBenefit = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((b) => b.id !== id),
    }));
  };

  // Save handling
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMsg('الرجاء إدخال اسم المنتج / Product name required');
      return;
    }

    const desiredSlug =
      normalizeProductSlug(formData.slug || formData.name) ||
      `prod-${Math.floor(1000 + Math.random() * 9000)}`;

    const resolvedStatus: ProductStatus =
      formData.status || (formData.isPublished ? 'ACTIVE' : 'DRAFT');

    const resolvedOgImage =
      formData.ogImage && !formData.ogImage.startsWith('data:')
        ? formData.ogImage
        : formData.images[0] && !formData.images[0].startsWith('data:')
          ? formData.images[0]
          : '';

    const payloadToSave = {
      ...formData,
      slug: desiredSlug,
      status: resolvedStatus,
      isPublished: resolvedStatus === 'ACTIVE',
      comparePrice: formData.compareAtPrice,
      ogImage: resolvedOgImage,
    };

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (formData.customMetaPixelId?.trim()) {
        activateMetaPixelId(formData.customMetaPixelId.trim(), true);
      }
      let saved: Product;
      if (isEditing && initialProduct?._id) {
        saved = await updateProduct({
          id: initialProduct._id,
          updates: payloadToSave,
        });
      } else {
        saved = await createProduct(payloadToSave);
      }

      setFormData((prev) => ({
        ...prev,
        slug: saved.slug || desiredSlug,
        images: Array.isArray(saved.images) ? saved.images : prev.images,
        descriptionImages: Array.isArray(saved.descriptionImages)
          ? saved.descriptionImages
          : prev.descriptionImages,
        ogImage: saved.ogImage || prev.ogImage,
        status: getProductStatus(saved),
        isPublished: getProductStatus(saved) === 'ACTIVE',
      }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onSaved(saved);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'حدث خطأ أثناء حفظ المنتج');
    } finally {
      setIsSaving(false);
    }
  };

  // Construct a live dummy product object for the live preview
  const livePreviewProduct: Product = {
    ...formData,
    _id: initialProduct?._id || 'temp_preview_id',
    createdAt: initialProduct?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F8F6] text-left" dir="ltr">
      {/* Top Action Bar */}
      <div className="h-16 bg-white border-b border-neutral-200/80 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[#F8F8F6] text-[#111111] transition-colors cursor-pointer border border-neutral-200"
            title="Back to Products"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <h2 className="text-sm font-extrabold text-[#111111] leading-tight">
              {isEditing ? `Edit Product: ${formData.name || 'Untitled'}` : 'Create New Product'}
            </h2>
            <div className="text-[11px] text-neutral-400 font-mono">
              /p/{formData.slug || 'slug-placeholder'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSplitView((v) => !v)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 text-xs font-bold text-[#111111] hover:bg-[#F8F8F6] transition-colors cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>{splitView ? 'Hide Live Preview' : 'Show Live Preview'}</span>
          </button>

          {formData.slug && (
            <a
              href={`/p/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 bg-[#F8F8F6] hover:bg-neutral-200/60 text-xs font-bold text-[#111111] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>Open Public Link</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-full text-xs bg-[#FF6B00] hover:bg-[#e66000] text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving...</span>
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Saved to Database!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-700 font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {/* Main Container: Split Form + Live Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Form Columns */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
          {/* Section 1: Template Selection */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <TemplateSelector
              selectedId={formData.templateId}
              onSelect={(templateId) => setFormData((prev) => ({ ...prev, templateId }))}
            />
          </div>

          {/* Section 2: Basic Info */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-2">
              Basic Product Info (Arabic Landing Copy)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Product Title (Displayed in Arabic on Landing Page) <span className="text-[#FF6B00]">*</span>
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: سيروم الأرغان وماء الورد الملكي"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Public URL Slug <span className="text-[#FF6B00]">*</span>
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-neutral-400 font-mono pointer-events-none">
                      /p/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                        }))
                      }
                      placeholder="beauty-set"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] text-left"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomSlug}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold hover:bg-[#F8F8F6] text-[#111111] cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Highlight Badge (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.badgeText || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="مثال: الأكثر طلباً هذا الأسبوع"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Short Subtitle (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="سطر واحد جذاب يظهر في أعلى الصفحة..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl border border-neutral-200 bg-[#F8F8F6] space-y-3">
                <label className="block text-xs font-bold text-[#111111]">
                  Full Product Description (Arabic) &amp; Description Media (Images / MP4 Videos)
                </label>
                <textarea
                  rows={6}
                  dir="rtl"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="اكتب مواصفات المنتج، طريقة الاستعمال، والفوائد التفصيلية..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00] leading-relaxed"
                />

                {/* Description Images (Links or PNG/JPG Import) inside Description Box */}
                <DescriptionImagesManager
                  images={formData.descriptionImages || []}
                  onChange={(descriptionImages) =>
                    setFormData((prev) => ({ ...prev, descriptionImages }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Offer */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-2">
              Pricing &amp; Promotional Offer
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Selling Price <span className="text-[#FF6B00]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3.5 py-2 text-sm font-bold font-mono rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-neutral-400">
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Compare At Price (Strikethrough)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        compareAtPrice: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2 text-sm font-bold font-mono rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-neutral-400">
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white"
                >
                  <option value="DH">Moroccan Dirham (DH)</option>
                  <option value="MAD">MAD</option>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Top Offer Banner Copy (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.offerText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, offerText: e.target.value }))}
                  placeholder="مثال: 🔥 خصم 40% لهذا الأسبوع + شحن مجاني لكافة المدن"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Images */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs">
            <ImageManager
              images={formData.images}
              onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
            />
          </div>

          {/* Section 5: Landing Page Settings & Policies */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-2">
              Landing Page Settings &amp; Policies (Arabic Copy)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Primary CTA Button Copy (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.ctaText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="اطلب الآن بالدفع عند الاستلام"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Product Status
                </label>
                <select
                  value={formData.status || (formData.isPublished ? 'ACTIVE' : 'DRAFT')}
                  onChange={(e) => {
                    const nextStatus = e.target.value as ProductStatus;
                    setFormData((prev) => ({
                      ...prev,
                      status: nextStatus,
                      isPublished: nextStatus === 'ACTIVE',
                    }));
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                >
                  <option value="ACTIVE">🟢 ACTIVE — Published &amp; Accepting Orders</option>
                  <option value="DRAFT">⚪ DRAFT — Hidden from Public</option>
                  <option value="ARCHIVED">🔴 ARCHIVED — Paused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Shipping Policy Copy (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.shippingText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shippingText: e.target.value }))}
                  placeholder="🚚 التوصيل مجاني لجميع مدن المغرب — الدفع عند الاستلام"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Return Guarantee Copy (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.returnPolicy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, returnPolicy: e.target.value }))}
                  placeholder="🔄 إرجاع واستبدال مجاني خلال 14 يوماً مع ضمان كامل"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Benefits */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
                Product Benefits &amp; Trust Highlights (Arabic Copy)
              </h3>
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-3.5 py-1.5 rounded-full bg-[#111111] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Benefit</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.benefits.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 bg-[#F8F8F6]"
                >
                  <select
                    value={b.icon}
                    onChange={(e) => handleUpdateBenefit(b.id, { icon: e.target.value })}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-white"
                  >
                    <option value="Award">Award (Quality)</option>
                    <option value="Truck">Truck (Fast Delivery)</option>
                    <option value="ShieldCheck">ShieldCheck (COD Trust)</option>
                    <option value="RotateCcw">RotateCcw (Returns)</option>
                    <option value="Sparkles">Sparkles (Premium)</option>
                    <option value="CheckCircle">CheckCircle (Verified)</option>
                  </select>

                  <input
                    type="text"
                    dir="rtl"
                    value={b.title}
                    onChange={(e) => handleUpdateBenefit(b.id, { title: e.target.value })}
                    placeholder="عنوان الميزة"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white"
                  />

                  <input
                    type="text"
                    dir="rtl"
                    value={b.description || ''}
                    onChange={(e) => handleUpdateBenefit(b.id, { description: e.target.value })}
                    placeholder="شرح بسيط للميزة"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(b.id)}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Variants */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs">
            <VariantEditor
              variants={formData.variants}
              onChange={(variants) => setFormData((prev) => ({ ...prev, variants }))}
            />
          </div>

          {/* Section 8: Scarcity & Urgency (Stock & Timer) */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-2">
              Scarcity &amp; Countdown Timer
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 bg-[#F8F8F6] rounded-2xl border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#111111]">
                  <input
                    type="checkbox"
                    checked={formData.scarcityEnabled || false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scarcityEnabled: e.target.checked }))}
                    className="rounded border-neutral-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span>Enable Low-Stock Scarcity Bar</span>
                </label>
                {formData.scarcityEnabled && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Remaining Stock Displayed
                    </label>
                    <input
                      type="number"
                      value={formData.stockQuantity ?? 7}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          stockQuantity: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white"
                      placeholder="7"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4 bg-[#F8F8F6] rounded-2xl border border-neutral-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#111111]">
                  <input
                    type="checkbox"
                    checked={formData.countdownEnabled || false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, countdownEnabled: e.target.checked }))}
                    className="rounded border-neutral-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span>Enable Offer Countdown Timer</span>
                </label>
                {formData.countdownEnabled && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                      Countdown Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.countdownDurationMinutes ?? 120}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          countdownDurationMinutes: Number(e.target.value) || 60,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 9: WhatsApp Direct CTA */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-2">
              WhatsApp Quick Order Button
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#111111]">
                <input
                  type="checkbox"
                  checked={formData.whatsappEnabled || false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappEnabled: e.target.checked }))}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Show &quot;Order via WhatsApp&quot; button on product landing page</span>
              </label>

              {formData.whatsappEnabled && (
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    WhatsApp Number with Country Code (e.g. 212661234567)
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="2126XXXXXXXX"
                    dir="ltr"
                    className="w-full max-w-sm px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] font-mono text-left"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 10: SEO & Social Share Cards */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-2">
              SEO &amp; Social OpenGraph Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  SEO Page Title
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={formData.seoTitle || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="SEO Title..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  OpenGraph Share Title
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={formData.ogTitle || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ogTitle: e.target.value }))}
                  placeholder="Social card title..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  SEO Meta Description
                </label>
                <input
                  type="text"
                  dir="auto"
                  value={formData.seoDescription || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="Meta description..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  OpenGraph Share Image URL
                </label>
                <input
                  type="text"
                  value={formData.ogImage || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ogImage: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Section 11: Per-Product Tracking Pixels */}
          <div className="p-6 bg-white rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">
                Per-Product Ad Pixels (Meta &amp; TikTok)
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  Active Meta Pixel ({formData.customMetaPixelId?.trim() || '135752956164308'})
                </span>
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Your global store Meta Pixel (<code className="font-mono font-bold text-[#111111]">135752956164308</code>) is active on all landing pages by default. Enter an ID below only if you want a dedicated pixel for this product:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Custom Meta Pixel ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.customMetaPixelId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        customMetaPixelId: val,
                        useCustomPixels: Boolean(val.trim() || prev.customTikTokPixelId?.trim()),
                      }));
                    }}
                    placeholder="135752956164308"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] font-mono text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Custom TikTok Pixel ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.customTikTokPixelId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        customTikTokPixelId: val,
                        useCustomPixels: Boolean(val.trim() || prev.customMetaPixelId?.trim()),
                      }));
                    }}
                    placeholder="C9XXXXXXXXXXXXXX"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] font-mono text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Panel (Sticky Right / Side-by-Side) */}
        {splitView && (
          <div className="w-[480px] xl:w-[560px] border-l border-neutral-200 bg-[#111111] p-4 shrink-0 hidden lg:block overflow-hidden">
            <LivePreview product={livePreviewProduct} />
          </div>
        )}
      </div>
    </div>
  );
};
