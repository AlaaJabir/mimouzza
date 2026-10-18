import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Order } from '../../../convex/schema';
import { useMutation, useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { computeAuthoritativeOrderTotal, ALL_MOROCCO_CITIES } from '../../../convex/db';
import { Button } from '../ui/button';
import { MimouzzaLogo } from '../ui/MimouzzaLogo';
import {
  trackEvent,
  getVisitorId,
  getSessionId,
  captureAndStoreUtm,
} from '../../lib/tracking';
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  PhoneCall,
  AlertCircle,
  ShoppingCart,
  AlertTriangle,
  Search,
  MapPin,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';

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
  isPreview?: boolean;
  isModal?: boolean;
  onClose?: () => void;
}

const CITY_SEARCH_ALIASES: Record<string, string[]> = {
  'الدار البيضاء (Casablanca)': ['كازا', 'كازابلانكا', 'casa', 'casablanca', 'dar beida', 'addar al baydaa'],
  'الرباط (Rabat)': ['رباط', 'rbat', 'rabat'],
  'مراكش (Marrakech)': ['كيش', 'kech', 'marrakesh', 'marrakech', 'mrakch'],
  'طنجة (Tanger)': ['طانجا', 'طنجا', 'tanja', 'tangier', 'tanger'],
  'فاس (Fès)': ['fez', 'fes'],
  'أكادير (Agadir)': ['اكادير', 'أكادير', 'agadir', 'gadir'],
  'مكناس (Meknès)': ['meknes', 'mknes'],
  'وجدة (Oujda)': ['oujda', 'wajda'],
  'القنيطرة (Kénitra)': ['قنيطرة', 'قنيطره', 'kenitra', 'knitra'],
  'تطوان (Tétouan)': ['تطوان', 'tetouan', 'tetwan'],
  'تمارة (Témara)': ['تماره', 'temara', 'tmara'],
  'سلا (Salé)': ['سلا', 'sale', 'sla'],
  'الجديدة (El Jadida)': ['جديدة', 'مازاغان', 'jadida', 'eljadida', 'mazagan'],
  'آسفي (Safi)': ['اسفي', 'آسفي', 'safi', 'asfi'],
  'المحمدية (Mohammédia)': ['محمدية', 'فضالة', 'mohammedia', 'fedala'],
  'بني ملال (Béni Mellal)': ['بنيملال', 'beni mellal', 'benimellal', 'bni mellal'],
  'خريبكة (Khouribga)': ['خريبكه', 'khouribga', 'khribga'],
  'الناظور (Nador)': ['ناظور', 'ناضور', 'nador', 'nadour'],
  'تازة (Taza)': ['تازه', 'taza'],
  'سطات (Settat)': ['سطات', 'settat', 'sttat'],
  'برشيد (Berrechid)': ['برشيد', 'berrechid', 'brchid'],
  'العيون (Laâyoune)': ['لعيون', 'العيون', 'laayoune', 'layoun', 'el aaiun'],
  'الداخلة (Dakhla)': ['داخلة', 'داخله', 'dakhla'],
  'شفشاون (Chefchaouen)': ['الشاون', 'شاون', 'chaouen', 'chefchaouen', 'chawn'],
  'الحسيمة (Al Hoceïma)': ['حسيمة', 'الحسيمه', 'hoceima', 'alhoceima', 'rif'],
  'العرائش (Larache)': ['عرائش', 'العرايش', 'larache', 'laaraych'],
  'القصر الكبير (Ksar El Kébir)': ['القصر', 'قصر الكبير', 'ksar el kebir', 'ksar kebir', 'alcazarquivir'],
  'الرشيدية (Errachidia)': ['الراشيدية', 'راشيدية', 'رشيدية', 'errachidia', 'rachidia'],
  'ورزازات (Ouarzazate)': ['ورززات', 'وارزازات', 'ouarzazate', 'warzazat'],
  'تارودانت (Taroudant)': ['ترودانت', 'taroudant', 'taroudannt'],
  'الصويرة (Essaouira)': ['صويرة', 'موكادور', 'essaouira', 'souira', 'mogador'],
  'قلعة السراغنة (El Kelaâ des Sraghna)': ['القلعة', 'قلعة', 'سراغنة', 'kelaa', 'sraghna', 'kelat sraghna'],
  'الفقيه بن صالح (Fquih Ben Salah)': ['فقيه بن صالح', 'فقيه بنصالح', 'fquih ben salah', 'fkih ben salah'],
  'سوق السبت أولاد النمة (Souk Sebt Oulad Nemma)': ['سوق السبت', 'اولاد النمة', 'souk sebt', 'oulad nemma'],
  'سوق الأربعاء الغرب (Souk El Arbaa)': ['سوق الاربعاء', 'سوق لاربع', 'souk larbaa', 'souk el arbaa'],
};

function normalizeSearchText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip French accents
    .replace(/[\u064B-\u065F\u0670]/g, '') // strip Arabic tashkeel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\-\_\(\)\/\.\']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const CODForm: React.FC<CODFormProps> = ({
  product,
  utmParams = {},
  accentColor = 'amber',
  onOrderSuccess,
  className = '',
  isPreview = false,
  isModal = false,
  onClose,
}) => {
  const settings = useQuery(api.settings.get);
  const createOrder = useMutation(api.orders.create);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(0);
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
  const [submittedOrder, setSubmittedOrder] = useState<{
    id: string;
    orderNumber: string;
    total: number;
    currency: string;
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Order | null>(null);
  const [forceSubmitDuplicate, setForceSubmitDuplicate] = useState(false);

  const formStartedRef = useRef(false);
  const formViewedRef = useRef(false);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);

  // Full list of Moroccan cities (strictly excluding any 'Autre ville' / 'مدينة أخرى')
  const citiesList = useMemo<string[]>(() => {
    const combined = new Set<string>(ALL_MOROCCO_CITIES);
    if (settings?.moroccoCities && Array.isArray(settings.moroccoCities)) {
      for (const c of settings.moroccoCities) {
        const trimmed = (c || '').trim();
        if (
          trimmed &&
          !trimmed.includes('مدينة أخرى') &&
          !trimmed.toLowerCase().includes('autre')
        ) {
          combined.add(trimmed);
        }
      }
    }
    return Array.from(combined);
  }, [settings?.moroccoCities]);

  // Filtered cities based on live search query
  const filteredCities = useMemo<string[]>(() => {
    const q = normalizeSearchText(citySearchQuery);
    if (!q) return citiesList;

    return citiesList.filter((cityItem) => {
      const normalizedCity = normalizeSearchText(cityItem);
      if (normalizedCity.includes(q)) return true;

      // Also check without "ال" article so searching "عيون" or "دار البيضاء" matches
      const withoutAl = normalizedCity.replace(/(^|\s)ال/g, '$1');
      const queryWithoutAl = q.replace(/(^|\s)ال/g, '$1');
      if (withoutAl.includes(queryWithoutAl)) return true;

      const aliases = CITY_SEARCH_ALIASES[cityItem];
      if (aliases && aliases.some((alias) => normalizeSearchText(alias).includes(q))) {
        return true;
      }
      return false;
    });
  }, [citiesList, citySearchQuery]);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCityDropdownOpen(false);
        // If the user typed something that matches an exact city or a single unique city, lock it in
        const trimmedQuery = citySearchQuery.trim();
        if (trimmedQuery && !city) {
          const exactMatch = citiesList.find(
            (c) => normalizeSearchText(c) === normalizeSearchText(trimmedQuery)
          );
          if (exactMatch) {
            setCity(exactMatch);
            setCitySearchQuery(exactMatch);
          } else if (filteredCities.length === 1) {
            setCity(filteredCities[0]);
            setCitySearchQuery(filteredCities[0]);
          } else {
            // Reset unconfirmed free text so user must pick an exact city from the list
            setCitySearchQuery('');
          }
        } else if (city) {
          setCitySearchQuery(city);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [city, citySearchQuery, citiesList, filteredCities]);

  // 1. Track FORM_VIEW when form enters viewport (only when not in preview mode)
  useEffect(() => {
    if (typeof window === 'undefined' || isPreview) return;

    if (!('IntersectionObserver' in window)) {
      if (!formViewedRef.current) {
        formViewedRef.current = true;
        trackEvent({
          eventType: 'FORM_VIEW',
          productId: product._id,
          productName: product.name,
          price: product.price,
          currency: product.currency,
          metadata: { formId: 'cod_order_form' },
          isPreview,
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
              isPreview,
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
  }, [product._id, product.name, product.price, product.currency, isPreview]);

  // 2. Track FORM_START only on genuine user interaction with form fields
  const handleFirstInteraction = (field: string) => {
    if (isPreview) return;
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      trackEvent({
        eventType: 'FORM_START',
        productId: product._id,
        productName: product.name,
        price: product.price,
        currency: product.currency,
        metadata: { firstField: field },
        isPreview,
      });
    }
  };

  const handleSelectExactCity = (selectedCity: string) => {
    handleFirstInteraction('city');
    setCity(selectedCity);
    setCitySearchQuery(selectedCity);
    setIsCityDropdownOpen(false);
    if (errors.city) {
      setErrors((prev) => ({ ...prev, city: '' }));
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

    // Strict exact Moroccan city validation (Mandatory + Must be chosen from the official list)
    const cleanCity = city.trim();
    if (!cleanCity || !citiesList.includes(cleanCity)) {
      newErrors.city = 'الرجاء البحث واختيار مدينتك بالضبط من القائمة (إجباري)';
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
    if (!isPreview) {
      trackEvent({
        eventType: 'VARIANT_SELECT',
        productId: product._id,
        metadata: { variantGroup: variantName, selectedValue: optionValue },
        isPreview,
      });
    }
  };

  const handleQuantityChange = (newQty: number) => {
    const clamped = Math.max(1, newQty);
    setQuantity(clamped);
    handleFirstInteraction('quantity');
    if (!isPreview) {
      trackEvent({
        eventType: 'QUANTITY_CHANGE',
        productId: product._id,
        metadata: { newQuantity: clamped },
        isPreview,
      });
    }
  };

  const isFormValid = useMemo(() => {
    const hasName = customerName.trim().length >= 3;
    const hasPhone = validateMoroccanPhone(phone);
    const hasCity = Boolean(city.trim() && citiesList.includes(city.trim()));
    const hasAddress = address.trim().length >= 4;
    const hasQuantity = quantity >= 1;
    return hasName && hasPhone && hasCity && hasAddress && hasQuantity;
  }, [customerName, phone, city, citiesList, address, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Track Final CTA Click when user clicks submit button
    if (!isPreview) {
      trackEvent({
        eventType: 'CTA_CLICK',
        productId: product._id,
        productName: product.name,
        price: totalPrice,
        currency: product.currency,
        ctaId: 'final_cta',
        metadata: { ctaId: 'final_cta', elementId: 'final_cta' },
        isPreview,
      });
    }

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
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const { lastTouch } = captureAndStoreUtm();
    const eventId =
      'ev_ord_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const resolvedUtm = {
      utmSource: utmParams.utmSource || lastTouch.utmSource || '',
      utmMedium: utmParams.utmMedium || lastTouch.utmMedium || '',
      utmCampaign: utmParams.utmCampaign || lastTouch.utmCampaign || '',
      utmContent: utmParams.utmContent || lastTouch.utmContent || '',
      utmTerm: utmParams.utmTerm || lastTouch.utmTerm || '',
    };

    try {
      // 1. Track FORM_SUBMIT event
      if (!isPreview) {
        trackEvent({
          eventType: 'FORM_SUBMIT',
          productId: product._id,
          productName: product.name,
          price: totalPrice,
          currency: product.currency,
          metadata: { quantity, city: city.trim() },
          isPreview,
        });
      }

      // 2. Create real validated Order in Convex / Server DB
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
        amount: totalPrice,
        currency: product.currency || 'DH',
        status: 'NEW',
        visitorId,
        sessionId,
        eventId,
        fbclid: lastTouch.fbclid,
        fbc: lastTouch.fbc,
        fbp: lastTouch.fbp,
        landingPage: typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/p/${product.slug}`,
        ...resolvedUtm,
      });

      setSubmittedOrder({
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        currency: order.currency || product.currency || 'DH',
      });
      setDuplicateWarning(null);

      // 3. Dispatch ORDER_CREATED to Meta Pixel (Lead & Purchase) and TikTok Pixel (CompletePayment)
      if (!isPreview) {
        trackEvent({
          eventType: 'ORDER_CREATED',
          customEventId: eventId,
          productId: product._id,
          productName: product.name,
          price: order.total,
          currency: order.currency || product.currency || 'DH',
          metadata: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            quantity: order.quantity,
            city: order.city,
          },
          isPreview,
        });
      }

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
          شكراً لك، <span className="font-semibold text-slate-900">{customerName}</span>. لقد تم
          استلام طلبك وسيتصل بك أحد ممثلينا قريباً لتأكيد العنوان وموعد الشحن.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-right space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
            <span>رقم الطلب (Order ID):</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {submittedOrder.orderNumber}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>المنتج:</span>
            <span className="font-medium text-slate-900 truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>الكمية:</span>
            <span className="font-medium text-slate-900">{quantity}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>المبلغ الإجمالي عند الاستلام:</span>
            <span className="font-bold text-emerald-600 text-sm">
              {submittedOrder.total} {submittedOrder.currency}
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

        <div className="flex flex-col sm:flex-row gap-2.5">
          {isModal && onClose && (
            <Button
              onClick={onClose}
              className="w-full text-xs bg-[#129A56] hover:bg-[#0f8247] text-white font-bold py-2.5 cursor-pointer"
            >
              تم — إغلاق النافذة
            </Button>
          )}
          <Button
            onClick={() => {
              setSubmittedOrder(null);
              setCustomerName('');
              setPhone('');
              setAddress('');
              setForceSubmitDuplicate(false);
            }}
            variant="outline"
            className="w-full text-xs cursor-pointer"
          >
            طلب منتج آخر أو تعديل الطلب
          </Button>
        </div>
      </div>
    );
  }

  // Active Order Form
  return (
    <div
      ref={formContainerRef}
      id={isModal ? 'order-form-modal-container' : 'order-form-container'}
      className={`bg-white ${isModal ? 'rounded-3xl' : 'rounded-3xl border border-neutral-200/80 shadow-xl'} ${className}`}
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="bg-[#C80C32] text-white p-4 sm:p-6 text-center space-y-2 rounded-t-3xl relative">
        <div dir="ltr" className="flex items-center justify-center mb-1">
          <MimouzzaLogo height={isModal ? 26 : 30} />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/15 border border-white/25 text-white rounded-full text-xs font-extrabold uppercase tracking-wide">
          <Truck className="w-3.5 h-3.5 text-amber-300" />
          الدفع نقداً عند الاستلام (COD)
        </div>
        <h3 className="text-base sm:text-xl font-extrabold text-white">
          {isModal ? 'طلب سريع — الدفع عند الاستلام' : 'نموذج الطلب السريع'}
        </h3>
        {!isModal && (
          <p className="text-xs sm:text-sm text-white/90 mt-1">
            املأ بياناتك أسفله وسيصلك المنتج لباب منزلك دون دفع مسبق!
          </p>
        )}

        {/* Product preview mini-bar inside modal */}
        {isModal && (
          <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between bg-black/15 rounded-xl p-2 text-right">
            <div className="flex items-center gap-2.5 min-w-0">
              {product.images && product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover bg-white shrink-0"
                />
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-[260px]">
                  {product.name}
                </div>
                <div className="text-[11px] text-amber-200 font-semibold">
                  🚚 توصيل مجاني وسريع لكافة المدن
                </div>
              </div>
            </div>
            <div className="shrink-0 text-left pl-1">
              <span className="text-base font-black text-white font-mono">{product.price}</span>{' '}
              <span className="text-xs font-extrabold text-amber-300">{product.currency || 'DH'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Duplicate Order Warning Modal / Notice */}
      {duplicateWarning && (
        <div className="p-4 m-4 bg-[#FFF3EB] border-2 border-[#FF6B00] rounded-2xl space-y-3">
          <div className="flex items-start gap-2.5 text-[#111111]">
            <AlertTriangle className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <div className="font-bold text-sm sm:text-base">
                تنبيه: يوجد طلب مسجل مسبقاً بنفس رقم الهاتف!
              </div>
              <p className="text-neutral-700 mt-1">
                لقد تم تسجيل طلب لنفس هذا المنتج برقم{' '}
                <span className="font-mono font-bold">{duplicateWarning.orderNumber}</span> خلال
                العشر دقائق الماضية. طلبك قيد التجهيز بالفعل وسيتصل بك فريقنا لتأكيده.
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
              className="px-4 py-2 rounded-full bg-[#FF6B00] hover:bg-[#e66000] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              نعم، أريد تأكيد طلب إضافي آخر
            </button>
            <button
              type="button"
              onClick={() => setDuplicateWarning(null)}
              className="px-4 py-2 rounded-full bg-white border border-neutral-200 text-[#111111] text-xs sm:text-sm font-semibold hover:bg-neutral-50 cursor-pointer"
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
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Variants Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-3 pb-3 border-b border-neutral-100">
            {product.variants.map((variant) => (
              <div key={variant.id} className="space-y-2">
                <label className="text-xs sm:text-sm font-extrabold text-[#111111] flex items-center justify-between">
                  <span>{variant.name}</span>
                  <span className="text-neutral-500 font-semibold text-xs">
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
                        className={`px-4 py-2 text-xs sm:text-sm rounded-xl border font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#FF6B00] bg-[#FFF3EB] text-[#111111] ring-2 ring-[#FF6B00]/20 shadow-xs'
                            : 'border-neutral-200 bg-[#F8F8F6] hover:bg-neutral-100 text-neutral-700'
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
        <div className="flex items-center justify-between bg-[#F8F8F6] p-4 rounded-2xl border border-neutral-200/80">
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-[#111111]">
              الكمية المطلوبة (Quantity)
            </div>
            <div className="text-xs text-neutral-500">اختر عدد القطع المراد طلبها</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              className="w-9 h-9 rounded-xl bg-white border border-neutral-200 text-[#111111] font-extrabold hover:bg-neutral-100 flex items-center justify-center cursor-pointer shadow-2xs text-base"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="font-mono font-extrabold text-base sm:text-lg w-7 text-center text-[#111111]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              className="w-9 h-9 rounded-xl bg-white border border-neutral-200 text-[#111111] font-extrabold hover:bg-neutral-100 flex items-center justify-center cursor-pointer shadow-2xs text-base"
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
            <label className="block text-xs sm:text-sm font-extrabold text-[#111111] mb-1.5">
              الاسم الكامل <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onFocus={() => handleFirstInteraction('customerName')}
              onChange={(e) => {
                handleFirstInteraction('customerName');
                setCustomerName(e.target.value);
                if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: '' }));
              }}
              placeholder="مثال: يوسف الإدريسي"
              className={`w-full px-4 py-3 rounded-2xl border text-sm sm:text-base text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] ${
                errors.customerName ? 'border-rose-500 bg-rose-50/30' : 'border-neutral-200 bg-[#F8F8F6]/60'
              }`}
            />
            {errors.customerName && (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">
                {errors.customerName}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-[#111111] mb-1.5">
              رقم الهاتف (الواتساب للتأكيد) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onFocus={() => handleFirstInteraction('phone')}
                onChange={(e) => {
                  handleFirstInteraction('phone');
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                placeholder="0612345678 أو 0712345678"
                dir="ltr"
                className={`w-full px-4 py-3 rounded-2xl border text-sm sm:text-base text-[#111111] placeholder:text-neutral-400 text-left font-mono focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] ${
                  errors.phone ? 'border-rose-500 bg-rose-50/30' : 'border-neutral-200 bg-[#F8F8F6]/60'
                }`}
              />
              <span className="absolute right-3.5 top-3 text-xs sm:text-sm text-neutral-400 font-bold pointer-events-none">
                🇲🇦 +212
              </span>
            </div>
            {errors.phone ? (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">{errors.phone}</p>
            ) : (
              <p className="text-xs text-neutral-500 mt-1">
                سيتصل بك الموزع عبر هذا الرقم لتسليم الطلب
              </p>
            )}
          </div>

          {/* Searchable Moroccan City Selector (Mandatory & Exact Match) */}
          <div ref={cityDropdownRef} className="relative">
            <label className="flex items-center justify-between text-xs sm:text-sm font-extrabold text-[#111111] mb-1.5">
              <span>
                المدينة / الإقليم <span className="text-rose-500">*</span>
              </span>
              {city ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#129A56] bg-[#E8F8F0] px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>تم تحديد المدينة</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-neutral-500">
                  ابحث بالاسم (عربي أو فرنسي) — {citiesList.length} مدينة
                </span>
              )}
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={cityInputRef}
                type="text"
                value={isCityDropdownOpen ? citySearchQuery : city || citySearchQuery}
                onFocus={() => {
                  handleFirstInteraction('city');
                  setIsCityDropdownOpen(true);
                  if (city) {
                    setCitySearchQuery('');
                  }
                  setHighlightedCityIndex(0);
                }}
                onClick={() => {
                  if (!isCityDropdownOpen) {
                    setIsCityDropdownOpen(true);
                    if (city) {
                      setCitySearchQuery('');
                    }
                  }
                }}
                onChange={(e) => {
                  handleFirstInteraction('city');
                  const val = e.target.value;
                  setCitySearchQuery(val);
                  setCity('');
                  setIsCityDropdownOpen(true);
                  setHighlightedCityIndex(0);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
                onKeyDown={(e) => {
                  if (!isCityDropdownOpen) {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      e.preventDefault();
                      setIsCityDropdownOpen(true);
                    }
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedCityIndex((prev) =>
                      filteredCities.length > 0 ? (prev + 1) % filteredCities.length : 0
                    );
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedCityIndex((prev) =>
                      filteredCities.length > 0
                        ? (prev - 1 + filteredCities.length) % filteredCities.length
                        : 0
                    );
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredCities[highlightedCityIndex]) {
                      handleSelectExactCity(filteredCities[highlightedCityIndex]);
                    }
                  } else if (e.key === 'Escape') {
                    setIsCityDropdownOpen(false);
                    if (city) setCitySearchQuery(city);
                  }
                }}
                placeholder="ابحث عن مدينتك بالاسم (مثال: الدار البيضاء / Casablanca)..."
                autoComplete="off"
                className={`w-full pr-10 pl-10 py-3 rounded-2xl border text-sm sm:text-base text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] transition-colors ${
                  errors.city
                    ? 'border-rose-500 bg-rose-50/30'
                    : city
                      ? 'border-[#129A56]/60 bg-[#E8F8F0]/25 font-bold'
                      : 'border-neutral-200 bg-[#F8F8F6]/60'
                }`}
              />

              {city || citySearchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setCity('');
                    setCitySearchQuery('');
                    setIsCityDropdownOpen(true);
                    setHighlightedCityIndex(0);
                    cityInputRef.current?.focus();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="مسح المدينة"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsCityDropdownOpen((prev) => !prev);
                    cityInputRef.current?.focus();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  aria-label="فتح قائمة المدن"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isCityDropdownOpen ? 'rotate-180 text-[#FF6B00]' : ''
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Searchable Dropdown List of All Moroccan Cities */}
            {isCityDropdownOpen && (
              <div className="absolute z-40 mt-1.5 w-full bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden">
                <div className="bg-[#F8F8F6] px-3.5 py-2 border-b border-neutral-200/80 flex items-center justify-between text-[11px] font-bold text-neutral-600">
                  <span>
                    {citySearchQuery.trim()
                      ? `نتائج البحث (${filteredCities.length})`
                      : `جميع مدن المغرب (${citiesList.length} مدينة)`}
                  </span>
                  <span className="text-[#FF6B00]">اختر مدينتك بالضبط</span>
                </div>

                {filteredCities.length > 0 ? (
                  <div className="max-h-60 sm:max-h-64 overflow-y-auto divide-y divide-neutral-100">
                    {filteredCities.map((c, idx) => {
                      const isSelected = city === c;
                      const isHighlighted = idx === highlightedCityIndex;
                      return (
                        <button
                          type="button"
                          key={c}
                          onMouseEnter={() => setHighlightedCityIndex(idx)}
                          onClick={() => handleSelectExactCity(c)}
                          className={`w-full px-4 py-2.5 text-right text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFF3EB] text-[#FF6B00] font-extrabold'
                              : isHighlighted
                                ? 'bg-neutral-100 text-[#111111] font-bold'
                                : 'bg-white hover:bg-neutral-50 text-[#111111] font-semibold'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-[#FF6B00]' : 'text-neutral-400'
                              }`}
                            />
                            <span className="truncate">{c}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center space-y-1.5">
                    <p className="text-xs sm:text-sm font-bold text-neutral-800">
                      لم يتم العثور على مدينة مطابقة لـ "{citySearchQuery}"
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      يرجى كتابة اسم المدينة بالعربية أو الفرنسية واختيارها من القائمة
                    </p>
                  </div>
                )}
              </div>
            )}

            {errors.city && (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">{errors.city}</p>
            )}
          </div>

          {/* Detailed Address */}
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-[#111111] mb-1.5">
              عنوان التوصيل (الحي، الشارع، رقم المنزل) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onFocus={() => handleFirstInteraction('address')}
              onChange={(e) => {
                handleFirstInteraction('address');
                setAddress(e.target.value);
                if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
              }}
              placeholder="مثال: حي الرياض، شارع النخيل رقم 15"
              className={`w-full px-4 py-3 rounded-2xl border text-sm sm:text-base text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] ${
                errors.address ? 'border-rose-500 bg-rose-50/30' : 'border-neutral-200 bg-[#F8F8F6]/60'
              }`}
            />
            {errors.address && (
              <p className="text-xs sm:text-sm text-rose-600 mt-1 font-medium">{errors.address}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              ملاحظات إضافية للتوصيل (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onFocus={() => handleFirstInteraction('notes')}
              onChange={(e) => {
                handleFirstInteraction('notes');
                setNotes(e.target.value);
              }}
              placeholder="مثال: يفضل الاتصال في المساء"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-neutral-200 text-xs sm:text-sm text-[#111111] bg-[#F8F8F6]/50 placeholder:text-neutral-400 focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>

        {/* Pricing Summary Box */}
        <div className="bg-[#FFF3EB] border border-[#FF6B00]/25 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-xs sm:text-sm text-neutral-700 font-medium">
            <span>سعر الوحدة:</span>
            <span className="font-mono font-bold text-[#111111]">
              {product.price} {product.currency || 'DH'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm text-neutral-700 font-medium">
            <span>مصاريف التوصيل:</span>
            <span className="text-[#129A56] font-extrabold bg-[#E8F8F0] px-2.5 py-0.5 rounded-full text-xs">
              مجاني 100%
            </span>
          </div>
          <div className="pt-2 border-t border-[#FF6B00]/20 flex justify-between items-center text-[#111111]">
            <span className="font-extrabold text-sm sm:text-base">المجموع الإجمالي للدفع:</span>
            <span className="text-xl sm:text-2xl font-black text-[#FF6B00] font-mono">
              {totalPrice} {product.currency || 'DH'}
            </span>
          </div>
        </div>

        {/* Submit Button (final_cta) */}
        <button
          id="final_cta"
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg transition-all transform flex items-center justify-center gap-2.5 ${
            isSubmitting || !isFormValid
              ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-70 shadow-none'
              : 'bg-[#FF6B00] hover:bg-[#e66000] text-white shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>جاري تسجيل طلبك...</span>
            </div>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              <span>
                {!isFormValid
                  ? 'الرجاء إدخال بياناتك لتفعيل الطلب'
                  : product.ctaText || 'تأكيد الطلب الآن (الدفع عند الاستلام)'}
              </span>
            </>
          )}
        </button>

        {/* Trust Guarantees */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs sm:text-sm text-[#111111] font-semibold text-center">
          <div className="flex items-center justify-center gap-1.5 p-2.5 bg-[#F8F8F6] rounded-xl border border-neutral-200/70">
            <ShieldCheck className="w-4 h-4 text-[#129A56] shrink-0" />
            <span>معاينة الطرد قبل الدفع</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2.5 bg-[#F8F8F6] rounded-xl border border-neutral-200/70">
            <Truck className="w-4 h-4 text-[#FF6B00] shrink-0" />
            <span>توصيل سريع لكافة المدن</span>
          </div>
        </div>
      </form>
    </div>
  );
};
