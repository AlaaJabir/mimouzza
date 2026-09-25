import React from 'react';
import { Store, RotateCcw, ExternalLink } from 'lucide-react';
import { useMutation, useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onOpenStore?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onOpenStore,
}) => {
  const resetSeed = useMutation(api.settings.resetSeed);
  const products = useQuery(api.products.listPublished);

  const handleReset = async () => {
    if (window.confirm('هل تريد استعادة البيانات التجريبية الافتراضية؟ (Reset to seed data)')) {
      await resetSeed({});
      window.location.reload();
    }
  };

  const sampleSlug = products && products.length > 0 ? products[0].slug : '';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal">
            Convex Reactive DB Active
          </span>
        </h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {sampleSlug && (
          <a
            href={`/p/${sampleSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-amber-600" />
            <span>معاينة صفحة الهبوط / Preview Public Page</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        )}

        <button
          onClick={handleReset}
          title="استعادة البيانات الأصلية"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
