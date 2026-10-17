import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { trackEvent } from '../../lib/tracking';

interface StickyOrderButtonProps {
  price: number;
  currency: string;
  ctaText?: string;
  productId?: string;
  productName?: string;
  isPreview?: boolean;
  onOpenOrderModal?: () => void;
}

export const StickyOrderButton: React.FC<StickyOrderButtonProps> = ({
  price,
  currency,
  ctaText = 'اطلب الآن بالدفع عند الاستلام',
  productId,
  productName,
  isPreview = false,
  onOpenOrderModal,
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

  const handleClick = () => {
    if (productId && !isPreview) {
      trackEvent({
        eventType: 'CTA_CLICK',
        productId,
        productName,
        price,
        currency,
        ctaId: 'sticky_cta',
        metadata: { ctaId: 'sticky_cta', elementId: 'sticky_cta' },
        isPreview,
      });
    }

    if (onOpenOrderModal) {
      onOpenOrderModal();
      return;
    }

    const formEl = document.getElementById('order-form-container');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 p-3 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-2xl md:hidden transition-transform animate-in slide-in-from-bottom-4 duration-200"
      dir="rtl"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="shrink-0 text-right pr-1">
          <div className="text-[10px] text-neutral-500 font-semibold leading-tight">
            الدفع عند الاستلام
          </div>
          <div className="text-base font-black text-[#111111] font-mono leading-none">
            {price} <span className="text-xs font-bold text-[#FF6B00]">{currency}</span>
          </div>
        </div>

        <button
          onClick={handleClick}
          type="button"
          className="flex-1 py-3 px-4 rounded-2xl bg-[#FF6B00] hover:bg-[#e66000] text-white font-black text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
          <span>
            {ctaText ? ctaText : 'اطلب الآن'} — {price} {currency}
          </span>
        </button>
      </div>
    </div>
  );
};
