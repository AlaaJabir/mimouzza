import React, { useState } from 'react';
import { trackEvent } from '../../lib/tracking';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  badgeText?: string;
  discountPercentage?: number;
  productId?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  badgeText,
  discountPercentage,
  productId,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images && images.length > 0
    ? images
    : ['/src/assets/images/seed_beauty_serum_1790331758543.jpg'];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  const handleSelectImage = (idx: number) => {
    setSelectedIndex(idx);
    if (productId) {
      trackEvent({
        eventType: 'PRODUCT_IMAGE_VIEW',
        productId,
        productName,
        metadata: { imageIndex: idx, imageUrl: displayImages[idx] },
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3.5">
      {/* Main Image Frame */}
      <div className="relative aspect-square w-full max-h-[440px] sm:max-h-[500px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm group mx-auto">
        <img
          src={currentImage}
          alt={productName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {discountPercentage && discountPercentage > 0 && (
          <div className="absolute top-3.5 right-3.5 bg-rose-600 text-white font-black text-sm sm:text-base px-3.5 py-1.5 rounded-xl shadow-md tracking-wider">
            خصم {discountPercentage}%
          </div>
        )}

        {/* Custom Highlight Tag */}
        {badgeText && (
          <div className="absolute top-3.5 left-3.5 bg-slate-900/90 backdrop-blur-xs text-amber-300 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-lg shadow-xs">
            {badgeText}
          </div>
        )}

        {/* Counter indicator */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3.5 left-3.5 bg-black/65 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-md font-mono font-bold">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin justify-center">
          {displayImages.map((imgUrl, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectImage(idx)}
                className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20 opacity-100 shadow-xs'
                    : 'border-slate-200 opacity-60 hover:opacity-90 hover:border-slate-300'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`${productName} thumbnail ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
