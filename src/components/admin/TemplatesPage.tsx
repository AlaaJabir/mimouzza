import React from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { Check, Plus, Layers } from 'lucide-react';

interface TemplatesPageProps {
  onCreateWithTemplate: (templateId: 'classic-cod' | 'premium' | 'big-offer') => void;
  onPreviewTemplate: (templateId: 'classic-cod' | 'premium' | 'big-offer') => void;
}

const TEMPLATE_ENGLISH_META: Record<
  string,
  { title: string; badge: string; desc: string; features: string[] }
> = {
  'classic-cod': {
    title: 'Classic High-Converting COD',
    badge: 'Best Seller',
    desc: 'Engineered for direct-response Facebook & TikTok ad campaigns with instant Arabic checkout form and urgency triggers.',
    features: [
      'Direct visible Arabic COD checkout form',
      'Quantity & bundle tier discounts (1, 2, 3 units)',
      'Sticky mobile CTA bar & WhatsApp quick order',
      'High-contrast #FF6B00 & #111111 conversion theme',
    ],
  },
  premium: {
    title: 'Editorial Luxury Brand',
    badge: 'High AOV',
    desc: 'Refined editorial layout with gallery showcase, trust badges, and smooth Arabic typography for cosmetics & watches.',
    features: [
      'Split hero showcase with high-res gallery',
      'Detailed Arabic benefits & feature cards',
      'Customer review highlights & FAQ accordion',
      'Unified orange & jet-black luxury styling',
    ],
  },
  'big-offer': {
    title: 'Flash Deal & Scarcity Funnel',
    badge: 'Flash Promo',
    desc: 'Built for promotional bundles and limited-stock clearances with live countdown timer and stock progress bar.',
    features: [
      'Prominent countdown timer & stock scarcity bar',
      'Savings badge with automatic discount math',
      'Live social proof ticker in Arabic',
      'Fast 1-step COD form with city autocomplete',
    ],
  },
};

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  onCreateWithTemplate,
}) => {
  const templates = useQuery(api.templates.list);
  const products = useQuery(api.products.list);

  return (
    <div className="space-y-6" dir="ltr">
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Arabic Landing Page Funnels</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#111111]">
            Landing Page Templates
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            All landing page templates render in RTL Arabic for your customers while sharing the unified Nestora orange &amp; jet-black design system. Switch templates on any product with one click.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(templates || []).map((tpl) => {
          const associatedProducts = (products || []).filter((p) => p.templateId === tpl.id);
          const meta = TEMPLATE_ENGLISH_META[tpl.id] || {
            title: tpl.name,
            badge: tpl.tag,
            desc: tpl.description,
            features: tpl.features,
          };

          return (
            <div
              key={tpl.id}
              className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden shadow-xs flex flex-col hover:border-[#FF6B00] transition-all group"
            >
              {/* Preview Thumbnail */}
              <div className="relative aspect-video w-full bg-neutral-100 overflow-hidden border-b border-neutral-100">
                <img
                  src={tpl.previewImage}
                  alt={meta.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 bg-[#111111]/90 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full">
                  {meta.badge}
                </div>
                <div className="absolute top-3 right-3 bg-[#FF6B00] text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full">
                  Arabic RTL
                </div>
              </div>

              {/* Template Details */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5 text-left">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-extrabold text-[#111111]">{meta.title}</h3>
                    <span className="font-mono text-[11px] text-neutral-400 font-semibold px-2 py-0.5 rounded-md bg-[#F8F8F6]">
                      {tpl.id}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500 leading-relaxed">{meta.desc}</p>

                  {/* Associated Products counter */}
                  <div className="pt-3 text-xs text-neutral-500 flex items-center justify-between border-t border-neutral-100">
                    <span>Active products using template</span>
                    <span className="font-extrabold text-[#111111] font-mono bg-[#F8F8F6] px-2.5 py-1 rounded-full">
                      {associatedProducts.length} products
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-2">
                    <div className="text-[11px] font-bold text-[#111111] uppercase tracking-wider">
                      Included Features
                    </div>
                    {meta.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-neutral-600">
                        <div className="w-4 h-4 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-neutral-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onCreateWithTemplate(tpl.id)}
                    className="w-full py-2.5 px-4 rounded-full text-xs bg-[#FF6B00] hover:bg-[#e66000] text-white font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Product with Template</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
