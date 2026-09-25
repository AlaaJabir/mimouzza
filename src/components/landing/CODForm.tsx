import React, { useState } from 'react';
import { Product } from '../../../convex/schema';
import { useMutation, useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { Button } from '../ui/button';
import { CheckCircle2, ShieldCheck, Truck, PhoneCall, AlertCircle, ShoppingCart } from 'lucide-react';

interface CODFormProps {
  product: Product;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  accentColor?: 'amber' | 'emerald' | 'rose' | 'slate';
  onOrderSuccess?: (orderId: string, orderNumber: string) => void;
  className?: string;
}

export const CODForm: React.FC<CODFormProps> = ({
  product,
  utmParams = {},
  accentColor = 'amber',
  onOrderSuccess,
  className = '',
}) => {
  const settings = useQuery(api.settings.get);
  const createOrder = useMutation(api.orders.create);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0];
        }
      });
    }
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  // Validation
  const validateMoroccanPhone = (input: string): boolean => {
    const cleaned = input.replace(/[\s\-\(\)\.]/g, '');
    // Moroccan formats: 06XXXXXXXX, 07XXXXXXXX, 05XXXXXXXX, +2126XXXXXXXX, 002126XXXXXXXX
    const regex = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/;
    return regex.test(cleaned);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'الرجاء إدخال الاسم الكامل / Full name required';
    } else if (customerName.trim().length < 3) {
      newErrors.customerName = 'الاسم قصير جداً (3 أحرف على الأقل)';
    }

    if (!phone.trim()) {
      newErrors.phone = 'الرجاء إدخال رقم الهاتف / Phone required';
    } else if (!validateMoroccanPhone(phone)) {
      newErrors.phone = 'رقم هاتف مغربي غير صحيح (مثال: 0612345678 أو 0712345678)';
    }

    if (!city.trim()) {
      newErrors.city = 'الرجاء اختيار أو تحديد المدينة / City required';
    }

    if (!address.trim()) {
      newErrors.address = 'الرجاء إدخال عنوان التوصيل أو الحي / Address required';
    } else if (address.trim().length < 5) {
      newErrors.address = 'الرجاء كتابة العنوان كاملاً لتسهيل التوصيل';
    }

    if (quantity < 1) {
      newErrors.quantity = 'الكمية يجب أن تكون 1 على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVariantSelect = (variantName: string, optionValue: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: optionValue,
    }));
  };

  const totalPrice = product.price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        productId: product._id,
        productName: product.name,
        productImage: product.images[0] || '',
        customerName: customerName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        quantity,
        variants: selectedVariants,
        notes: notes.trim(),
        total: totalPrice,
        currency: product.currency || 'DH',
        status: 'NEW',
        utmSource: utmParams.utmSource || '',
        utmMedium: utmParams.utmMedium || '',
        utmCampaign: utmParams.utmCampaign || '',
        utmContent: utmParams.utmContent || '',
        utmTerm: utmParams.utmTerm || '',
      });

      setSubmittedOrder({ id: order._id, orderNumber: order.orderNumber });
      if (onOrderSuccess) {
        onOrderSuccess(order._id, order.orderNumber);
      }
    } catch (err) {
      console.error('Order creation error:', err);
      setErrors({ form: 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const citiesList = settings?.moroccoCities || [
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
    'الجديدة (El Jadida)',
  ];

  // Success State
  if (submittedOrder) {
    return (
      <div
        id="order-form-container"
        className={`bg-white rounded-2xl border-2 border-emerald-500/30 p-6 md:p-8 text-center shadow-xl ${className}`}
        dir="rtl"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">تم تسجيل طلبك بنجاح! 🎉</h3>
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          شكراً لك، <span className="font-semibold text-slate-900">{customerName}</span>. لقد تم استلام طلبك وسيتصل بك أحد ممثلينا قريباً لتأكيد العنوان وموعد الشحن.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-right space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
            <span>رقم الطلب (Order ID):</span>
            <span className="font-mono font-bold text-slate-900 text-sm">{submittedOrder.orderNumber}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>المنتج:</span>
            <span className="font-medium text-slate-900 truncate max-w-[200px]">{product.name}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>الكمية:</span>
            <span className="font-medium text-slate-900">{quantity}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>المبلغ الإجمالي عند الاستلام:</span>
            <span className="font-bold text-emerald-600 text-sm">
              {totalPrice} {product.currency || 'DH'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>المدينة:</span>
            <span className="font-medium text-slate-900">{city}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 flex items-center justify-center gap-2 mb-6">
          <PhoneCall className="w-4 h-4 text-amber-700 shrink-0" />
          <span>يرجى إبقاء هاتفك مشغلاً للرد على اتصال موزع الشحن.</span>
        </div>

        <Button
          onClick={() => {
            setSubmittedOrder(null);
            setCustomerName('');
            setPhone('');
            setAddress('');
          }}
          variant="outline"
          className="w-full text-xs"
        >
          طلب منتج آخر أو تعديل الطلب
        </Button>
      </div>
    );
  }

  // Active Order Form
  return (
    <div
      id="order-form-container"
      className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${className}`}
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-bold mb-2 uppercase tracking-wide">
          <Truck className="w-3.5 h-3.5" />
          الدفع نقداً عند الاستلام (COD)
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white">نموذج الطلب السريع</h3>
        <p className="text-xs text-slate-300 mt-1">
          املأ بياناتك أسفله وسيصلك المنتج لباب منزلك دون دفع مسبق!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Variants Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-3 pb-3 border-b border-slate-100">
            {product.variants.map((variant) => (
              <div key={variant.id} className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{variant.name}</span>
                  <span className="text-slate-500 font-normal text-[11px]">
                    {selectedVariants[variant.name]}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {variant.options.map((opt) => {
                    const isSelected = selectedVariants[variant.name] === opt;
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleVariantSelect(variant.name, opt)}
                        className={`px-3 py-2 text-xs rounded-lg border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50 text-slate-950 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity Stepper */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <div className="text-xs font-bold text-slate-900">الكمية المطلوبة (Quantity)</div>
            <div className="text-[11px] text-slate-500">اختر عدد القطع المراد طلبها</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="font-mono font-bold text-base w-6 text-center text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              الاسم الكامل <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
              }}
              placeholder="مثال: يوسف الإدريسي"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                errors.customerName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.customerName && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.customerName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              رقم الهاتف (الواتساب للتأكيد) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="0612345678 أو 0712345678"
                dir="ltr"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 text-left font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                  errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                🇲🇦 +212
              </span>
            </div>
            {errors.phone ? (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-slate-500 mt-1">
                سيتصل بك الموزع عبر هذا الرقم لتسليم الطلب
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              المدينة / الإقليم <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none ${
                  errors.city ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300'
                }`}
              >
                <option value="">-- اختر مدينتك من القائمة --</option>
                {citiesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-3 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            {errors.city && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.city}</p>
            )}
          </div>

          {/* Detailed Address */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              عنوان التوصيل (الحي، الشارع، رقم المنزل) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
              }}
              placeholder="مثال: حي الرياض، شارع النخيل رقم 15"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                errors.address ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.address && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.address}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              ملاحظات إضافية للتوصيل (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يفضل الاتصال في المساء"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50/50 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Pricing Summary Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>سعر الوحدة:</span>
            <span className="font-mono font-semibold">
              {product.price} {product.currency || 'DH'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>مصاريف التوصيل:</span>
            <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
              مجاني 100%
            </span>
          </div>
          <div className="pt-2 border-t border-amber-200/60 flex justify-between items-center text-slate-900">
            <span className="font-bold text-sm">المجموع الإجمالي للدفع:</span>
            <span className="text-xl font-black text-amber-600 font-mono">
              {totalPrice} {product.currency || 'DH'}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-xl font-black text-base sm:text-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-lg hover:shadow-xl hover:from-amber-400 hover:to-amber-300 transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري تسجيل طلبك...</span>
            </div>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              <span>{product.ctaText || 'تأكيد الطلب الآن (الدفع عند الاستلام)'}</span>
            </>
          )}
        </button>

        {/* Trust Guarantees */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-600 text-center">
          <div className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>معاينة الطرد قبل الدفع</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>توصيل سريع لكافة المدن</span>
          </div>
        </div>
      </form>
    </div>
  );
};
