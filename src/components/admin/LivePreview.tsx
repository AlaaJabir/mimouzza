import React, { useState } from 'react';
import { Product } from '../../../convex/schema';
import { LandingPage } from '../landing/LandingPage';
import { Smartphone, Monitor, ExternalLink, RefreshCw } from 'lucide-react';

interface LivePreviewProps {
  product: Product;
  onOpenPublic?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ product }) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('mobile');
  const [key, setKey] = useState(0);

  return (
    <div className="flex flex-col h-full bg-[#111111] rounded-3xl overflow-hidden border border-neutral-800 shadow-xl" dir="ltr">
      {/* Preview Top Control Bar */}
      <div className="h-12 bg-[#111111] border-b border-neutral-800 px-4 flex items-center justify-between text-xs text-neutral-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-ping"></span>
          <span className="font-bold text-white">Live Arabic Funnel Preview</span>
          <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
            [{product.templateId}]
          </span>
        </div>

        {/* Viewport Segmented Control */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-full border border-neutral-800">
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
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
                ? 'bg-[#FF6B00] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
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
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {product.slug && (
            <a
              href={`/p/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-[11px] font-bold text-[#FF6B00]"
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
