import React, { useState } from 'react';
import { trackEvent } from '../../lib/tracking';
import { Image as ImageIcon } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  badgeText?: string;
  discountPercentage?: number;
  productId?: string;
  isPreview?: boolean;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  badgeText,
  discountPercentage,
  productId,
  isPreview = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const displayImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const currentImage = displayImages[selectedIndex] || displayImages[0] || '';

  const handleSelectImage = (idx: number) => {
    setSelectedIndex(idx);
    if (productId && !isPreview && displayImages[idx]) {
      trackEvent({
        eventType: 'PRODUCT_IMAGE_VIEW',
        productId,
        productName,
        metadata: { imageIndex: idx, imageUrl: displayImages[idx] },
        isPreview,
      });
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3.5">
      {/* Main Image Frame */}
      <div className="relative aspect-square w-full max-h-[440px] sm:max-h-[500px] rounded-3xl overflow-hidden bg-[#F8F8F6] border border-neutral-200/80 shadow-sm group mx-auto flex items-center justify-center">
        {currentImage ? (
          <img
            src={currentImage}
            alt={productName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-400 p-8 text-center">
            <ImageIcon className="w-12 h-12 mb-2 text-neutral-300" />
            <span className="text-xs font-semibold">{productName || 'صورة المنتج'}</span>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercentage && discountPercentage > 0 && (
          <div className="absolute top-3.5 right-3.5 bg-[#FF6B00] text-white font-black text-sm sm:text-base px-3.5 py-1.5 rounded-full shadow-md tracking-wider">
            خصم {discountPercentage}%
          </div>
        )}

        {/* Custom Highlight Tag */}
        {badgeText && (
          <div className="absolute top-3.5 left-3.5 bg-[#111111]/90 backdrop-blur-xs text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full shadow-xs">
            {badgeText}
          </div>
        )}

        {/* Counter indicator */}
        {displayImages.length > 1 && (
          <div className="absolute bottom-3.5 left-3.5 bg-[#111111]/75 backdrop-blur-xs text-white text-xs px-3 py-1 rounded-full font-mono font-bold">
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
                className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FF6B00] ring-2 ring-[#FF6B00]/20 opacity-100 shadow-xs'
                    : 'border-neutral-200 opacity-60 hover:opacity-90 hover:border-neutral-300'
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
