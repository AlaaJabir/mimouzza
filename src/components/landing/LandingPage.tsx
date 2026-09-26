import React from 'react';
import { Product } from '../../../convex/schema';
import { ClassicCOD } from './templates/ClassicCOD';
import { PremiumProduct } from './templates/PremiumProduct';
import { BigOffer } from './templates/BigOffer';

interface LandingPageProps {
  product: Product;
  utmParams?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  isPreview?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  product,
  utmParams,
  isPreview = false,
}) => {
  // Render corresponding template
  const renderTemplate = () => {
    switch (product.templateId) {
      case 'premium':
        return <PremiumProduct product={product} utmParams={utmParams} isPreview={isPreview} />;
      case 'big-offer':
        return <BigOffer product={product} utmParams={utmParams} isPreview={isPreview} />;
      case 'classic-cod':
      default:
        return <ClassicCOD product={product} utmParams={utmParams} isPreview={isPreview} />;
    }
  };

  return (
    <div className="relative w-full">
      {isPreview && (
        <div className="bg-amber-500 text-slate-950 text-xs font-black py-1.5 px-4 text-center sticky top-0 z-50 shadow-xs flex items-center justify-center gap-2">
          <span>👀 معاينة مباشرة (Live Preview Mode — No Analytics Recorded)</span>
          <span className="text-[11px] font-medium bg-slate-950/10 px-2 py-0.5 rounded">
            القالب: {product.templateId}
          </span>
        </div>
      )}
      {renderTemplate()}
    </div>
  );
};
