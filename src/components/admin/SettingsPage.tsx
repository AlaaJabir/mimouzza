import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { Button } from '../ui/button';
import { Save, RotateCcw, CheckCircle, Store, ShieldCheck, MapPin } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const resetSeed = useMutation(api.settings.resetSeed);

  const [storeName, setStoreName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('DH');
  const [defaultShippingText, setDefaultShippingText] = useState('');
  const [defaultReturnPolicy, setDefaultReturnPolicy] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || '');
      setDefaultCurrency(settings.defaultCurrency || 'DH');
      setDefaultShippingText(settings.defaultShippingText || '');
      setDefaultReturnPolicy(settings.defaultReturnPolicy || '');
      setContactPhone(settings.contactPhone || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        storeName,
        defaultCurrency,
        defaultShippingText,
        defaultReturnPolicy,
        contactPhone,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = async () => {
    if (
      window.confirm(
        'هل أنت متأكد من رغبتك في إعادة تعيين كافة البيانات إلى الحالة التجريبية الافتراضية؟'
      )
    ) {
      await resetSeed({});
      window.location.reload();
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          إعدادات المتجر العامة (General Store Settings)
        </h2>
        <p className="text-xs text-slate-500">
          تعديل البيانات الأساسية، سياسات الشحن، وقاعدة بيانات Convex التفاعلية
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 text-right">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-end gap-2">
            <span>بيانات وهوية المتجر</span>
            <Store className="w-4 h-4 text-amber-500" />
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">اسم المتجر</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="COD Express Maroc"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">العملة الافتراضية</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="DH">درهم مغربي (DH)</option>
                <option value="MAD">MAD</option>
                <option value="$">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                رقم هاتف الدعم والخدمة
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+212 661-234567"
                dir="ltr"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-left font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Returns */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 text-right">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-end gap-2">
            <span>سياسات الشحن والاسترجاع الافتراضية</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                نص الشحن الافتراضي
              </label>
              <input
                type="text"
                value={defaultShippingText}
                onChange={(e) => setDefaultShippingText(e.target.value)}
                placeholder="التوصيل مجاني لجميع مدن المغرب — الدفع عند الاستلام"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                نص سياسة الاسترجاع الافتراضية
              </label>
              <input
                type="text"
                value={defaultReturnPolicy}
                onChange={(e) => setDefaultReturnPolicy(e.target.value)}
                placeholder="ضمان الاسترجاع والاستبدال المجاني خلال 14 يوماً"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            type="submit"
            disabled={isSaving}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            {isSaving ? (
              <span>جاري الحفظ...</span>
            ) : savedSuccess ? (
              <span className="flex items-center gap-1.5 text-emerald-950">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                <span>تم حفظ الإعدادات!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </span>
            )}
          </Button>

          <button
            type="button"
            onClick={handleResetData}
            className="text-xs text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-2 rounded-lg bg-rose-50/50 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة البيانات الافتراضية للمتجر (Reset Seed Data)</span>
          </button>
        </div>
      </form>
    </div>
  );
};
