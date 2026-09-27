import React from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { CheckCircle2 } from 'lucide-react';

interface TemplateSelectorProps {
  selectedId: 'classic-cod' | 'premium' | 'big-offer';
  onSelect: (templateId: 'classic-cod' | 'premium' | 'big-offer') => void;
}

const TEMPLATE_LABELS: Record<string, { name: string; tag: string; desc: string }> = {
  'classic-cod': {
    name: 'Classic COD Funnel',
    tag: 'Best Seller',
    desc: 'Direct Arabic COD checkout form with bundle offers and urgency bar.',
  },
  premium: {
    name: 'Premium Brand Showcase',
    tag: 'Luxury & Beauty',
    desc: 'Editorial split hero with Arabic feature cards, gallery, and trust badges.',
  },
  'big-offer': {
    name: 'Flash Deal & Scarcity',
    tag: 'High Urgency',
    desc: 'Prominent countdown timer, stock scarcity bar, and big discount callouts.',
  },
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  const templates = useQuery(api.templates.list);

  return (
    <div className="space-y-3 text-left" dir="ltr">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider">
          Landing Page Template (Arabic RTL Funnel)
        </label>
        <span className="text-[11px] text-neutral-500 font-medium">
          Applies your product data automatically
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(templates || []).map((tpl) => {
          const isSelected = selectedId === tpl.id;
          const meta = TEMPLATE_LABELS[tpl.id] || {
            name: tpl.name,
            tag: tpl.tag,
            desc: tpl.description,
          };
          return (
            <div
              key={tpl.id}
              onClick={() => onSelect(tpl.id)}
              className={`relative rounded-2xl border-2 p-4 transition-all cursor-pointer bg-white text-left ${
                isSelected
                  ? 'border-[#FF6B00] bg-[#FF6B00]/5 ring-2 ring-[#FF6B00]/15 shadow-xs'
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-[#F8F8F6]'
              }`}
            >
              {/* Selected Marker */}
              {isSelected && (
                <div className="absolute top-3 right-3 bg-[#FF6B00] text-white p-1 rounded-full shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}

              {/* Tag */}
              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#111111] text-white mb-2">
                {meta.tag}
              </span>

              {/* Title & Slug */}
              <h4 className="text-sm font-extrabold text-[#111111] mb-1">
                {meta.name}
              </h4>

              <p className="text-xs text-neutral-500 leading-relaxed">
                {meta.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
