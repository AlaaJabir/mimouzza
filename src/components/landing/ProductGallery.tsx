import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  badgeText?: string;
  discountPercentage?: number;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  badgeText,
  discountPercentage,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = images && images.length > 0
    ? images
    : ['/src/assets/images/seed_beauty_serum_1790331758543.jpg'];

  const currentImage = displayImages[selectedIndex] || displayImages[0];

  return (
    <div className="w-full space-y-3">
      {/* Main Image Frame */}
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm group">
        <img
          src={currentImage}
          alt={productName}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {discountPercentage && discountPercentage > 0 && (
          <div className="absolute top-3 right-3 bg-rose-600 text-white font-black text-xs sm:text-sm px-3 py-1.5 rounded-lg shadow-md tracking-wider">
            خصم {discountPercentage}%
          </div>
        )}

        {/* Custom Highlight Tag */}
        {badgeText && (
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-xs text-amber-300 font-semibold text-[11px] sm:text-xs px-2.5 py-1 rounded-md shadow-xs">
            {badgeText}
          </div>
        )}

        {/* Counter indicator */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded-md font-mono">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {displayImages.map((imgUrl, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
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
