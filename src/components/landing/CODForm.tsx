import React, { useState, useEffect, useRef } from 'react';
import { Product, Order } from '../../../convex/schema';
import { useMutation, useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { Button } from '../ui/button';
import { trackEvent, getSessionId } from '../../lib/tracking';
import { CheckCircle2, ShieldCheck, Truck, PhoneCall, AlertCircle, ShoppingCart, AlertTriangle } from 'lucide-react';

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
  const [honeypot, setHoneypot] = useState(''); // Anti-bot honeypot
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
  const [duplicateWarning, setDuplicateWarning] = useState<Order | null>(null);
  const [forceSubmitDuplicate, setForceSubmitDuplicate] = useState(false);

  const formStartedRef = useRef(false);
  const formViewedRef = useRef(false);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // 1. Track FORM_VIEW when form enters viewport
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      // Fallback for environments without IntersectionObserver
      if (!formViewedRef.current) {
        formViewedRef.current = true;
        trackEvent({
          eventType: 'FORM_VIEW',
          productId: product._id,
          productName: product.name,
          price: product.price,
          currency: product.currency,
          metadata: { formId: 'cod_order_form' },
        });
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !formViewedRef.current) {
            formViewedRef.current = true;
            trackEvent({
              eventType: 'FORM_VIEW',
              productId: product._id,
              productName: product.name,
              price: product.price,
              currency: product.currency,
              metadata: { formId: 'cod_order_form' },
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );

    if (formContainerRef.current) {
      observer.observe(formContainerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [product._id, product.name, product.price, product.currency]);

  // Track FORM_START when user starts typing
  const handleFirstInteraction = (field: string) => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      trackEvent({
        eventType: 'FORM_START',
        productId: product._id,
        productName: product.name,
        price: product.price,
        currency: product.currency,
        metadata: { firstField: field },
      });
    }
  };

  // Validation
  const validateMoroccanPhone = (input: string): boolean => {
    const cleaned = input.replace(/[\s\-\(\)\.]/g, '');
    const regex = /^(?:(?:\+|00)212|0)[5-7]\d{8}$/;
    return regex.test(cleaned);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic anti-spam honeypot
    if (honeypot.trim()) {
      newErrors.form = 'Submission rejected. Please try again.';
      return false;
    }

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
    } else if (address.trim().length < 4) {
      newErrors.address = 'الرجاء كتابة العنوان كاملاً لتسهيل التوصيل';
    }

    if (quantity < 1) {
      newErrors.quantity = 'الكمية يجب أن تكون 1 على الأقل';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVariantSelect = (variantName: string, optionValue: string) => {
    handleFirstInteraction('variants');
    setSelectedVariants((prev) => ({
      ...prev,
      [variantName]: optionValue,
    }));
    trackEvent({
      eventType: 'VARIANT_SELECT',
      productId: product._id,
      metadata: { variantGroup: variantName, selectedValue: optionValue },
    });
  };

  const handleQuantityChange = (newQty: number) => {
    const clamped = Math.max(1, newQty);
    setQuantity(clamped);
    handleFirstInteraction('quantity');
    trackEvent({
      eventType: 'QUANTITY_CHANGE',
      productId: product._id,
      metadata: { newQuantity: clamped },
    });
  };

  const totalPrice = product.price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check duplicate order protection
    if (!forceSubmitDuplicate) {
      try {
        const existingRecent = api.orders.checkDuplicate.query({
          productId: product._id,
          phone: phone.trim(),
          timeWindowMinutes: 10,
        });

        if (existingRecent) {
          setDuplicateWarning(existingRecent);
          return;
        }
      } catch (err) {
        console.warn('Duplicate check error:', err);
      }
    }

    setIsSubmitting(true);
    const sessionId = getSessionId();
    const eventId = 'ev_ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    try {
      // 1. Track FORM_SUBMIT event
      trackEvent({
        eventType: 'FORM_SUBMIT',
        productId: product._id,
        productName: product.name,
        price: totalPrice,
        currency: product.currency,
        customEventId: eventId,
        metadata: { quantity, city: city.trim() },
      });

      // 2. Create Order in Convex
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
        sessionId,
        eventId,
        utmSource: utmParams.utmSource || '',
        utmMedium: utmParams.utmMedium || '',
        utmCampaign: utmParams.utmCampaign || '',
        utmContent: utmParams.utmContent || '',
        utmTerm: utmParams.utmTerm || '',
      });

      // 3. Track ORDER_SUCCESS event
      trackEvent({
        eventType: 'ORDER_SUCCESS',
        productId: product._id,
        productName: product.name,
        price: totalPrice,
        currency: product.currency,
        customEventId: eventId,
        metadata: {
          orderNumber: order.orderNumber,
          quantity,
          city: city.trim(),
        },
      });

      setSubmittedOrder({ id: order._id, orderNumber: order.orderNumber });
      setDuplicateWarning(null);

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
            setForceSubmitDuplicate(false);
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
      ref={formContainerRef}
      id="order-form-container"
      className={`bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden ${className}`}
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-extrabold mb-2 uppercase tracking-wide">
          <Truck className="w-4 h-4" />
          الدفع نقداً عند الاستلام (COD)
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white">نموذج الطلب السريع</h3>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          املأ بياناتك أسفله وسيصلك المنتج لباب منزلك دون دفع مسبق!
        </p>
      </div>

      {/* Duplicate Order Warning Modal / Notice */}
      {duplicateWarning && (
        <div className="p-4 m-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-3">
          <div className="flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <div className="font-bold text-sm sm:text-base">تنبيه: يوجد طلب مسجل مسبقاً بنفس رقم الهاتف!</div>
              <p className="text-amber-800 mt-1">
                لقد تم تسجيل طلب لنفس هذا المنتج برقم <span className="font-mono font-bold">{duplicateWarning.orderNumber}</span> خلال العشر دقائق الماضية. طلبك قيد التجهيز بالفعل وسيتصل بك فريقنا لتأكيده.
              </p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setForceSubmitDuplicate(true);
                setDuplicateWarning(null);
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              نعم، أريد تأكيد طلب إضافي آخر
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-3.5 py-2 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs sm:text-sm font-semibold hover:bg-amber-100 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4">
        {/* Anti-spam hidden honeypot */}
        <input
          type="text"
          name="b_website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs sm:text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Variants Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-3 pb-3 border-b border-slate-100">
            {product.variants.map((variant) => (
              <div key={variant.id} className="space-y-2">
                <label className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center justify-between">
                  <span>{variant.name}</span>
                  <span className="text-slate-500 font-semibold text-xs">
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
                        className={`px-3.5 py-2 text-xs sm:text-sm rounded-lg border font-bold transition-all cursor-pointer ${
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
        <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-slate-900">الكمية المطلوبة (Quantity)</div>
            <div className="text-xs text-slate-500">اختر عدد القطع المراد طلبها</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-800 font-extrabold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs text-base"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="font-mono font-extrabold text-base sm:text-lg w-7 text-center text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-800 font-extrabold hover:bg-slate-100 flex items-center justify-center cursor-pointer shadow-xs text-base"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
              الاسم الكامل <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onFocus={() => handleFirstInteraction('customerName')}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
              }}
              placeholder="مثال: يوسف الإدريسي"
              className={`w-full px-4 py-3 rounded-xl border text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                errors.customerName ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.customerName && (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">{errors.customerName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
              رقم الهاتف (الواتساب للتأكيد) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onFocus={() => handleFirstInteraction('phone')}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="0612345678 أو 0712345678"
                dir="ltr"
                className={`w-full px-4 py-3 rounded-xl border text-sm sm:text-base text-slate-900 placeholder:text-slate-400 text-left font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                  errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
                }`}
              />
              <span className="absolute right-3.5 top-3 text-xs sm:text-sm text-slate-400 font-bold pointer-events-none">
                🇲🇦 +212
              </span>
            </div>
            {errors.phone ? (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">{errors.phone}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                سيتصل بك الموزع عبر هذا الرقم لتسليم الطلب
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
              المدينة / الإقليم <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={city}
                onFocus={() => handleFirstInteraction('city')}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
                className={`w-full px-4 py-3 rounded-xl border text-sm sm:text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none ${
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
              <div className="absolute left-3.5 top-3.5 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            {errors.city && (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">{errors.city}</p>
            )}
          </div>

          {/* Detailed Address */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-800 mb-1.5">
              عنوان التوصيل (الحي، الشارع، رقم المنزل) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onFocus={() => handleFirstInteraction('address')}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
              }}
              placeholder="مثال: حي الرياض، شارع النخيل رقم 15"
              className={`w-full px-4 py-3 rounded-xl border text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                errors.address ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 bg-white'
              }`}
            />
            {errors.address && (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">{errors.address}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              ملاحظات إضافية للتوصيل (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onFocus={() => handleFirstInteraction('notes')}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يفضل الاتصال في المساء"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 bg-slate-50/50 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* Pricing Summary Box */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm text-slate-700 font-medium">
            <span>سعر الوحدة:</span>
            <span className="font-mono font-bold">
              {product.price} {product.currency || 'DH'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm text-slate-700 font-medium">
            <span>مصاريف التوصيل:</span>
            <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2.5 py-0.5 rounded text-xs">
              مجاني 100%
            </span>
          </div>
          <div className="pt-2 border-t border-amber-200/60 flex justify-between items-center text-slate-900">
            <span className="font-extrabold text-sm sm:text-base">المجموع الإجمالي للدفع:</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
              {totalPrice} {product.currency || 'DH'}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-xl font-extrabold text-base sm:text-lg bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-md hover:shadow-lg hover:from-amber-400 hover:to-amber-300 transition-all transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              <span>جاري تسجيل طلبك...</span>
            </div>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>{product.ctaText || 'تأكيد الطلب الآن (الدفع عند الاستلام)'}</span>
            </>
          )}
        </button>

        {/* Trust Guarantees */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs sm:text-sm text-slate-700 font-semibold text-center">
          <div className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>معاينة الطرد قبل الدفع</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>توصيل سريع لكافة المدن</span>
          </div>
        </div>
      </form>
    </div>
  );
};
