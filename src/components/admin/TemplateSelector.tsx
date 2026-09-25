import React from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { CheckCircle2, Layers } from 'lucide-react';

interface TemplateSelectorProps {
  selectedId: 'classic-cod' | 'premium' | 'big-offer';
  onSelect: (templateId: 'classic-cod' | 'premium' | 'big-offer') => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedId,
  onSelect,
}) => {
  const templates = useQuery(api.templates.list);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800">
          اختر قالب صفحة الهبوط (Landing Page Template)
        </label>
        <span className="text-[11px] text-slate-500 font-medium">
          يتم تطبيق بيانات المنتج تلقائياً على القالب المختار
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(templates || []).map((tpl) => {
          const isSelected = selectedId === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => onSelect(tpl.id)}
              className={`relative rounded-xl border-2 p-3.5 transition-all cursor-pointer bg-white text-right ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              {/* Selected Marker */}
              {isSelected && (
                <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 p-1 rounded-full shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}

              {/* Tag */}
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 mb-2">
                {tpl.tag}
              </span>

              {/* Title & Slug */}
              <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
                <span>{tpl.name}</span>
                <span className="font-mono text-[11px] text-slate-400 font-normal">
                  {tpl.id}
                </span>
              </h4>

              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                {tpl.description}
              </p>

              {/* Features bullet list */}
              <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                {tpl.features.slice(0, 3).map((feat, i) => (
                  <div key={i} className="flex items-center gap-1.5 truncate">
                    <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0"></span>
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
