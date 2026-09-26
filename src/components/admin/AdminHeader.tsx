import React, { useState } from 'react';
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
}) => {
  const resetSeed = useMutation(api.settings.resetSeed);
  const products = useQuery(api.products.listPublished);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleClearAnalytics = async () => {
    await resetSeed({});
    setConfirmingClear(false);
    window.location.reload();
  };

  const sampleSlug = products && products.length > 0 ? products[0].slug : '';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-base font-bold text-slate-900 leading-tight flex items-center gap-2">
          <span>{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-normal">
            Convex Authoritative DB
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
            <span>معاينة صفحة الهبوط / Open Live Page</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        )}

        {confirmingClear ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearAnalytics}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
            >
              تأكيد تصفير السجلات
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingClear(true)}
            title="تصفير سجلات الزوار والطلبيات"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Zero DB Records</span>
          </button>
        )}
      </div>
    </header>
  );
};
