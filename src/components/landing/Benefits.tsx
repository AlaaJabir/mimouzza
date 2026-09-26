import React from 'react';
import { ProductBenefit } from '../../../convex/schema';
import {
  Truck,
  ShieldCheck,
  Clock,
  RotateCcw,
  CheckCircle,
  Sparkles,
  Award,
  Star,
  Check,
  Flame,
} from 'lucide-react';

interface BenefitsProps {
  benefits: ProductBenefit[];
  variant?: 'grid' | 'cards' | 'minimal';
  className?: string;
}

export const Benefits: React.FC<BenefitsProps> = ({
  benefits,
  variant = 'cards',
  className = '',
}) => {
  if (!benefits || benefits.length === 0) return null;

  const getIcon = (iconName: string) => {
    const props = { className: 'w-5 h-5 text-amber-600 shrink-0' };
    switch (iconName.toLowerCase()) {
      case 'truck':
        return <Truck {...props} />;
      case 'shieldcheck':
      case 'shield':
        return <ShieldCheck {...props} />;
      case 'clock':
        return <Clock {...props} />;
      case 'rotateccw':
      case 'return':
        return <RotateCcw {...props} />;
      case 'sparkles':
      case 'star':
        return <Sparkles {...props} />;
      case 'award':
        return <Award {...props} />;
      case 'flame':
        return <Flame {...props} />;
      default:
        return <CheckCircle {...props} />;
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={`space-y-2 ${className}`} dir="rtl">
        {benefits.map((b) => (
          <div key={b.id} className="flex items-start gap-2 text-slate-800 text-sm">
            <span className="p-0.5 bg-emerald-100 text-emerald-700 rounded-full mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="font-bold text-slate-900">{b.title}</span>
              {b.description && <span className="text-slate-600 text-xs mr-1.5">— {b.description}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`} dir="rtl">
      {benefits.map((b) => (
        <div
          key={b.id}
          className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
            {getIcon(b.icon)}
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-1">{b.title}</h4>
            {b.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{b.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
