import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { trackEvent } from '../../lib/tracking';

interface StickyOrderButtonProps {
  price: number;
  currency: string;
  ctaText?: string;
  productId?: string;
  productName?: string;
}

export const StickyOrderButton: React.FC<StickyOrderButtonProps> = ({
  price,
  currency,
  ctaText = 'اطلب الآن بالدفع عند الاستلام',
  productId,
  productName,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const formEl = document.getElementById('order-form-container');
      const scrollY = window.scrollY;

      if (!formEl) {
        setIsVisible(scrollY > 250);
        return;
      }

      const rect = formEl.getBoundingClientRect();
      const isFormInView = rect.top < window.innerHeight && rect.bottom > 0;

      setIsVisible(scrollY > 250 && !isFormInView);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToForm = () => {
    if (productId) {
      trackEvent({
        eventType: 'CTA_CLICK',
        productId,
        productName,
        price,
        currency,
        metadata: { elementId: 'sticky_cta' },
      });
    }

    const formEl = document.getElementById('order-form-container');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const input = formEl.querySelector('input') as HTMLInputElement | null;
        input?.focus();
      }, 500);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 p-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl md:hidden transition-transform animate-in slide-in-from-bottom-4 duration-200"
      dir="rtl"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="shrink-0 text-right pr-1">
          <div className="text-[10px] text-slate-500 font-semibold leading-tight">
            الدفع عند الاستلام
          </div>
          <div className="text-base font-black text-slate-950 font-mono leading-none">
            {price} <span className="text-xs font-bold text-amber-600">{currency}</span>
          </div>
        </div>

        <button
          onClick={scrollToForm}
          type="button"
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-md hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 text-slate-950" />
          <span>اطلب الآن — {price} {currency}</span>
        </button>
      </div>
    </div>
  );
};
