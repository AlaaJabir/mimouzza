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
        <div className="bg-[#FF6B00] text-white text-xs font-extrabold py-1.5 px-4 text-center sticky top-0 z-50 shadow-xs flex items-center justify-center gap-2" dir="ltr">
          <span>Live Preview Mode — Analytics Paused</span>
          <span className="text-[11px] font-bold bg-black/20 px-2.5 py-0.5 rounded-full">
            Template: {product.templateId}
          </span>
        </div>
      )}
      {renderTemplate()}
    </div>
  );
};
