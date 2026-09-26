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
      icon: <Truck className="w-5 h-5 text-amber-600" />,
      title: 'شحن سريع ومجاني',
      desc: shippingText || 'توصيل لباب المنزل في 24-48 ساعة لكافة المدن',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: 'الدفع عند الاستلام (COD)',
      desc: 'عاين وفحص منتجك قبل دفع درهم واحد للموزع',
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-blue-600" />,
      title: 'ضمان الاسترجاع والتبديل',
      desc: returnPolicy || 'إمكانية الاسترجاع أو الاستبدال خلال 14 يوماً',
    },
    {
      icon: <Award className="w-5 h-5 text-purple-600" />,
      title: 'منتج أصلي 100%',
      desc: 'جودة ممتازة ومطابقة تماماً للوصف والصور المعروضة',
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 md:grid-cols-4 gap-3.5 p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 ${className}`}
      dir="rtl"
    >
      {badges.map((b, idx) => (
        <div key={idx} className="flex flex-col items-center text-center p-2">
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-2.5 shadow-2xs">
            {b.icon}
          </div>
          <h4 className="text-xs sm:text-sm font-extrabold mb-1">{b.title}</h4>
          <p className="text-xs opacity-80 leading-relaxed font-medium">{b.desc}</p>
        </div>
      ))}
    </div>
  );
};
