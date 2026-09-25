import React from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { Check, Plus, ExternalLink, Sparkles, Layers } from 'lucide-react';
import { Button } from '../ui/button';

interface TemplatesPageProps {
  onCreateWithTemplate: (templateId: 'classic-cod' | 'premium' | 'big-offer') => void;
  onPreviewTemplate: (templateId: 'classic-cod' | 'premium' | 'big-offer') => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  onCreateWithTemplate,
  onPreviewTemplate,
}) => {
  const templates = useQuery(api.templates.list);
  const products = useQuery(api.products.list);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          مكتبة قوالب صفحات الهبوط (Landing Page Templates)
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          جميع القوالب مصممة بنسبة تحويل عالية (High-Converting COD) ومتوافقة تماماً مع شاشات الهواتف وحملات تيك توك وفيسبوك. يتم تطبيق نفس بيانات المنتج على أي قالب بضغطة زر واحدة.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(templates || []).map((tpl) => {
          const associatedProducts = (products || []).filter((p) => p.templateId === tpl.id);

          return (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs flex flex-col hover:border-amber-400 transition-colors group"
            >
              {/* Preview Thumbnail */}
              <div className="relative aspect-video w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                <img
                  src={tpl.previewImage}
                  alt={tpl.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md">
                  {tpl.tag}
                </div>
              </div>

              {/* Template Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4 text-right">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400 font-semibold">{tpl.id}</span>
                    <h3 className="text-base font-bold text-slate-900">{tpl.name}</h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{tpl.description}</p>

                  {/* Associated Products counter */}
                  <div className="pt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100">
                    <span>المنتجات المستخدمة لهذا القالب:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {associatedProducts.length} منتجات
                    </span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-slate-700">أبرز المزايا:</div>
                    {tpl.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <Button
                    onClick={() => onCreateWithTemplate(tpl.id)}
                    className="flex-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    إنشاء منتج بهذا القالب
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
