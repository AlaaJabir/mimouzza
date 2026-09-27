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
    <div className={`space-y-3.5 ${className}`} dir="rtl">
      <div className="text-center mb-3.5">
        <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#111111]">الأسئلة الشائعة (FAQ)</h3>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">كل ما تحتاج معرفته قبل إتمام طلبك</p>
      </div>

      <div className="space-y-2.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-neutral-200/80 rounded-2xl overflow-hidden bg-white transition-colors shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-right font-extrabold text-sm sm:text-base text-[#111111] hover:bg-[#F8F8F6] transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-neutral-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-[#FF6B00]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-2 text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed border-t border-neutral-100 bg-[#F8F8F6]/60">
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
