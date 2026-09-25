import React, { useState } from 'react';
import { ProductFAQ } from '../../../convex/schema';
import { ChevronDown } from 'lucide-react';

interface FAQProps {
  faqs?: ProductFAQ[];
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({ faqs, className = '' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900">الأسئلة الشائعة (FAQ)</h3>
        <p className="text-xs text-slate-500 mt-1">كل ما تحتاج معرفته قبل إتمام طلبك</p>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-right font-bold text-xs sm:text-sm text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-amber-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
