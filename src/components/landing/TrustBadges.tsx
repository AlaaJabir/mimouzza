import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Award } from 'lucide-react';

interface TrustBadgesProps {
  shippingText?: string;
  returnPolicy?: string;
  className?: string;
}

export const TrustBadges: React.FC<TrustBadgesProps> = ({
  shippingText,
  returnPolicy,
  className = '',
}) => {
  const badges = [
    {
      icon: <Truck className="w-5 h-5 text-[#FF6B00]" />,
      title: 'شحن سريع ومجاني',
      desc: shippingText || 'توصيل لباب المنزل في 24-48 ساعة لكافة المدن',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#129A56]" />,
      title: 'الدفع عند الاستلام (COD)',
      desc: 'عاين وفحص منتجك قبل دفع درهم واحد للموزع',
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-[#111111]" />,
      title: 'ضمان الاسترجاع والتبديل',
      desc: returnPolicy || 'إمكانية الاسترجاع أو الاستبدال خلال 14 يوماً',
    },
    {
      icon: <Award className="w-5 h-5 text-[#FF6B00]" />,
      title: 'منتج أصلي 100%',
      desc: 'جودة ممتازة ومطابقة تماماً للوصف والصور المعروضة',
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-3.5 p-5 sm:p-6 bg-white rounded-3xl border border-neutral-200/70 shadow-2xs ${className}`}
      dir="rtl"
    >
      {badges.map((b, idx) => (
        <div key={idx} className="flex flex-col items-center text-center p-2">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF3EB] border border-[#FF6B00]/20 flex items-center justify-center mb-2.5 shadow-2xs">
            {b.icon}
          </div>
          <h4 className="text-xs sm:text-sm font-extrabold mb-1 text-[#111111]">{b.title}</h4>
          <p className="text-xs text-neutral-600 leading-relaxed font-medium">{b.desc}</p>
        </div>
      ))}
    </div>
  );
};
