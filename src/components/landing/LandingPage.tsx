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
      {renderTemplate()}
      {isPreview && (
        <div
          className="fixed bottom-3 right-3 z-40 bg-[#C80C32]/95 text-white text-[11px] font-extrabold py-1.5 px-3.5 rounded-full shadow-lg border border-white/20 flex items-center gap-2 pointer-events-none"
          dir="ltr"
        >
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
          <span>Live Preview ({product.templateId})</span>
        </div>
      )}
    </div>
  );
};
