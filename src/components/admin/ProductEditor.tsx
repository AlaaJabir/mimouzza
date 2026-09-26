import React, { useState } from 'react';
import { Product, ProductBenefit, ProductStatus } from '../../../convex/schema';
import { useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { getProductStatus, normalizeProductSlug } from '../../../convex/db';
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

    const payloadToSave = {
      ...formData,
      slug: desiredSlug,
      status: resolvedStatus,
      isPublished: resolvedStatus === 'ACTIVE',
      comparePrice: formData.compareAtPrice,
      ogImage: formData.ogImage || formData.images[0] || '',
    };

    setIsSaving(true);
    setErrorMsg('');

    try {
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
    <div className="flex flex-col h-full bg-slate-100">
      {/* Top Action Bar */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="رجوع للقائمة"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {isEditing ? `تعديل: ${formData.name || 'بدون اسم'}` : 'إنشاء منتج جديد'}
            </h2>
            <div className="text-[11px] text-slate-400 font-mono">
              /p/{formData.slug || 'slug-placeholder'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSplitView((v) => !v)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{splitView ? 'إخفاء المعاينة' : 'إظهار المعاينة التفاعلية'}</span>
          </button>

          {formData.slug && (
            <a
              href={`/p/${formData.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>فتح الرابط المباشر</span>
            </a>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            {isSaving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                <span>جاري الحفظ...</span>
              </span>
            ) : saveSuccess ? (
              <span className="flex items-center gap-1.5 text-emerald-950">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>تم الحفظ في قاعدة البيانات!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'حفظ التغييرات' : 'نشر وإنشاء المنتج'}</span>
              </span>
            )}
          </Button>
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
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <TemplateSelector
              selectedId={formData.templateId}
              onSelect={(templateId) => setFormData((prev) => ({ ...prev, templateId }))}
            />
          </div>

          {/* Section 2: Basic Info */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              المعلومات الأساسية (Basic Info)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  اسم المنتج (Product Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: سيروم الأرغان وماء الورد الملكي"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  رابط الصفحة (Slug URL) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono pointer-events-none">
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
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 text-left"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomSlug}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    توليد تلقائي
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  شارة التميز (Badge / Kicker)
                </label>
                <input
                  type="text"
                  value={formData.badgeText || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="مثال: الأكثر طلباً هذا الأسبوع"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  الوصف القصير (Short Description)
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="سطر واحد جذاب يظهر في أعلى الصفحة..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="sm:col-span-2 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  الوصف الكامل والشرح + صور الوصف (Full Description & Description Images / PNG)
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="اكتب مواصفات المنتج، طريقة الاستعمال، والفوائد التفصيلية..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed font-sans"
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
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              الأسعار والعرض (Pricing & Offer)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  سعر البيع الحالي (Price) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  السعر القديم المشطوب (Compare Price)
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
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  العملة (Currency)
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="DH">درهم مغربي (DH)</option>
                  <option value="MAD">MAD</option>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  نص العرض الترويجي (Offer Text)
                </label>
                <input
                  type="text"
                  value={formData.offerText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, offerText: e.target.value }))}
                  placeholder="مثال: 🔥 خصم 40% لهذا الأسبوع + شحن مجاني لكافة المدن"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Images */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <ImageManager
              images={formData.images}
              onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
            />
          </div>

          {/* Section 5: Landing Page Settings & Policies */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              إعدادات صفحة الهبوط وسياسة التوصيل (Landing Page Settings)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  نص زر الطلب (CTA Text)
                </label>
                <input
                  type="text"
                  value={formData.ctaText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="اطلب الآن بالدفع عند الاستلام"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  حالة المنتج (Product Status)
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
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="ACTIVE">🟢 نشط ومنشور للعامة (ACTIVE)</option>
                  <option value="DRAFT">⚪ مسودة غير منشورة (DRAFT)</option>
                  <option value="ARCHIVED">🔴 مؤرشف / متوقف (ARCHIVED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  نص التوصيل والشحن (Shipping Text)
                </label>
                <input
                  type="text"
                  value={formData.shippingText}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shippingText: e.target.value }))}
                  placeholder="🚚 التوصيل مجاني لجميع مدن المغرب — الدفع عند الاستلام"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  سياسة الاسترجاع (Return Policy)
                </label>
                <input
                  type="text"
                  value={formData.returnPolicy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, returnPolicy: e.target.value }))}
                  placeholder="🔄 إرجاع واستبدال مجاني خلال 14 يوماً مع ضمان كامل"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Benefits */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                مميزات المنتج وضمانات الثقة (Benefits & Trust)
              </h3>
              <Button type="button" onClick={handleAddBenefit} size="sm" variant="outline" className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                إضافة ميزة
              </Button>
            </div>

            <div className="space-y-3">
              {formData.benefits.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <select
                    value={b.icon}
                    onChange={(e) => handleUpdateBenefit(b.id, { icon: e.target.value })}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Award">Award (جودة معتمدة)</option>
                    <option value="Truck">Truck (توصيل سريع)</option>
                    <option value="ShieldCheck">ShieldCheck (أمان ودفع)</option>
                    <option value="RotateCcw">RotateCcw (استرجاع)</option>
                    <option value="Sparkles">Sparkles (تألق طبيعي)</option>
                    <option value="CheckCircle">CheckCircle (صح)</option>
                  </select>

                  <input
                    type="text"
                    value={b.title}
                    onChange={(e) => handleUpdateBenefit(b.id, { title: e.target.value })}
                    placeholder="عنوان الميزة"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />

                  <input
                    type="text"
                    value={b.description || ''}
                    onChange={(e) => handleUpdateBenefit(b.id, { description: e.target.value })}
                    placeholder="شرح بسيط للميزة"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveBenefit(b.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Variants */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <VariantEditor
              variants={formData.variants}
              onChange={(variants) => setFormData((prev) => ({ ...prev, variants }))}
            />
          </div>

          {/* Section 8: Scarcity & Urgency (Stock & Timer) */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              إعدادات الندرة والعداد التنازلي (Scarcity & Countdown)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                  <input
                    type="checkbox"
                    checked={formData.scarcityEnabled || false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, scarcityEnabled: e.target.checked }))}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>تفعيل شريط نفاذ المخزون (Stock Scarcity Warning)</span>
                </label>
                {formData.scarcityEnabled && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      الكمية المتبقية للعرض
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
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      placeholder="7"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                  <input
                    type="checkbox"
                    checked={formData.countdownEnabled || false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, countdownEnabled: e.target.checked }))}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>تفعيل العداد التنازلي للعرض (Countdown Timer)</span>
                </label>
                {formData.countdownEnabled && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      مدة العداد بالدقائق (مثال: 120 دقيقة = ساعتان)
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
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 9: WhatsApp Direct CTA */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              طلب مباشر عبر الواتساب (WhatsApp CTA)
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                <input
                  type="checkbox"
                  checked={formData.whatsappEnabled || false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappEnabled: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>إظهار زر "طلب أو استفسار عبر الواتساب" في صفحة المنتج</span>
              </label>

              {formData.whatsappEnabled && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    رقم الواتساب مع كود الدولة (مثال: 212661234567)
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                    placeholder="2126XXXXXXXX"
                    dir="ltr"
                    className="w-full max-w-sm px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-left"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 10: SEO & Social Share Cards */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              تهيئة محركات البحث ومشاركة الروابط (SEO & Social OpenGraph)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  عنوان الصفحة في جوجل (SEO Title)
                </label>
                <input
                  type="text"
                  value={formData.seoTitle || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="عنوان جذاب يظهر في نتائج البحث..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  عنوان المشاركة الاجتماعية (OG Title)
                </label>
                <input
                  type="text"
                  value={formData.ogTitle || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ogTitle: e.target.value }))}
                  placeholder="عنوان كارت فيسبوك / واتساب..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  وصف الصفحة في محركات البحث (SEO Description)
                </label>
                <input
                  type="text"
                  value={formData.seoDescription || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="وصف مختصر ومقنع للمنتج..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  رابط صورة المشاركة (OG Image URL)
                </label>
                <input
                  type="text"
                  value={formData.ogImage || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ogImage: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Section 11: Per-Product Tracking Pixels */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              تتبع الإعلانات المخصص للمنتج (Tracking & Pixels)
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                <input
                  type="checkbox"
                  checked={formData.useCustomPixels || false}
                  onChange={(e) => setFormData((prev) => ({ ...prev, useCustomPixels: e.target.checked }))}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span>تخصيص بكسل مستقل لهذا المنتج (تجاوز إعدادات المتجر العامة)</span>
              </label>

              {formData.useCustomPixels && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Custom Meta Pixel ID
                    </label>
                    <input
                      type="text"
                      value={formData.customMetaPixelId || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customMetaPixelId: e.target.value }))}
                      placeholder="123456789012345"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Custom TikTok Pixel ID
                    </label>
                    <input
                      type="text"
                      value={formData.customTikTokPixelId || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, customTikTokPixelId: e.target.value }))}
                      placeholder="C9XXXXXXXXXXXXXX"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Panel (Sticky Right / Side-by-Side) */}
        {splitView && (
          <div className="w-[480px] xl:w-[560px] border-l border-slate-300 bg-slate-900 p-4 shrink-0 hidden lg:block overflow-hidden">
            <LivePreview product={livePreviewProduct} />
          </div>
        )}
      </div>
    </div>
  );
};
