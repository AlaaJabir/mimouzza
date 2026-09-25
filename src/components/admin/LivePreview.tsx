import React, { useState } from 'react';
import { Product } from '../../../convex/schema';
import { LandingPage } from '../landing/LandingPage';
import { Smartphone, Monitor, ExternalLink, RefreshCw } from 'lucide-react';

interface LivePreviewProps {
  product: Product;
  onOpenPublic?: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({ product, onOpenPublic }) => {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('mobile');
  const [key, setKey] = useState(0);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Preview Top Control Bar */}
      <div className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="font-bold text-white">معاينة تفاعلية فورية (Live Preview)</span>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            [{product.templateId}]
          </span>
        </div>

        {/* Viewport Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile (390px)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
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
            title="إعادة تحميل المعاينة"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {product.slug && (
            <a
              href={`/p/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-amber-300"
            >
              <span>فتح الرابط</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-950/60 p-2 sm:p-4 flex justify-center items-start">
        <div
          key={key}
          className={`transition-all duration-300 bg-white rounded-xl overflow-hidden shadow-2xl ${
            viewport === 'mobile'
              ? 'w-[390px] min-h-[750px] border-[8px] border-slate-800 rounded-[36px]'
              : 'w-full min-h-[800px]'
          }`}
        >
          {/* Mock Phone Notch on Mobile Viewport */}
          {viewport === 'mobile' && (
            <div className="w-full bg-slate-800 h-5 flex items-center justify-center relative select-none">
              <div className="w-24 h-3 bg-black rounded-b-lg"></div>
            </div>
          )}

          {/* Render Landing Page */}
          <LandingPage product={product} isPreview={true} />
        </div>
      </div>
    </div>
  );
};
