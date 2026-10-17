import React, { useEffect } from 'react';
import { Product } from '../../../convex/schema';
import { CODForm } from './CODForm';
import { X } from 'lucide-react';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  accentColor?: 'amber' | 'emerald' | 'rose' | 'slate';
  isPreview?: boolean;
}

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  product,
  utmParams,
  accentColor = 'rose',
  isPreview = false,
}) => {
  // Lock body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-order-title"
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200/90 overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col z-10 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button for easy tap */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 left-3.5 z-40 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
          aria-label="إغلاق النافذة"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <CODForm
            product={product}
            utmParams={utmParams}
            accentColor={accentColor}
            isPreview={isPreview}
            isModal={true}
            onClose={onClose}
            className="border-0 shadow-none rounded-none"
          />
        </div>
      </div>
    </div>
  );
};
