import React, { useState } from 'react';
import { Product } from '../../../convex/schema';
import { LandingPage } from '../landing/LandingPage';
import { Smartphone, Monitor, ExternalLink, RefreshCw } from 'lucide-react';
import { MimouzzaLogo } from '../ui/MimouzzaLogo';

interface LivePreviewProps {
  product: Product;
  onOpenPublic?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ product }) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('mobile');
  const [key, setKey] = useState(0);

  return (
    <div className="flex flex-col h-full bg-[#111111] rounded-3xl overflow-hidden border border-neutral-800 shadow-xl" dir="ltr">
      {/* Preview Top Control Bar with Mimouzza Logo on #C80C32 */}
      <div className="h-13 bg-[#C80C32] border-b border-[#a60828] px-4 flex items-center justify-between text-xs text-white">
        <div className="flex items-center gap-2.5">
          <MimouzzaLogo height={26} />
          <span className="text-[11px] text-white/80 font-mono hidden sm:inline">
            [{product.templateId}]
          </span>
        </div>

        {/* Viewport Segmented Control */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-full border border-white/15">
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-white text-[#C80C32] shadow-xs'
                : 'text-white/85 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-white text-[#C80C32] shadow-xs'
                : 'text-white/85 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setKey((k) => k + 1)}
            title="Reload preview"
            className="p-1.5 rounded-full hover:bg-white/15 text-white/90 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {product.slug && (
            <a
              href={`/p/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-white text-[#C80C32] hover:bg-neutral-100 text-[11px] font-extrabold shadow-2xs"
            >
              <span>Open Live</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="flex-1 overflow-y-auto bg-neutral-950/80 p-2 sm:p-4 flex justify-center items-start">
        <div
          key={key}
          className={`transition-all duration-300 bg-[#F8F8F6] rounded-2xl overflow-hidden shadow-2xl ${
            viewport === 'mobile'
              ? 'w-[390px] min-h-[750px] border-[8px] border-neutral-800 rounded-[36px]'
              : 'w-full min-h-[800px]'
          }`}
        >
          {/* Mock Phone Notch on Mobile Viewport */}
          {viewport === 'mobile' && (
            <div className="w-full bg-neutral-800 h-5 flex items-center justify-center relative select-none">
              <div className="w-24 h-3 bg-black rounded-b-lg"></div>
            </div>
          )}

          {/* Render Landing Page (Always RTL Arabic) */}
          <LandingPage product={product} isPreview={true} />
        </div>
      </div>
    </div>
  );
};
