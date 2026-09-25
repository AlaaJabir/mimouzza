import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { Button } from '../ui/button';
import { Save, RotateCcw, CheckCircle, Store, ShieldCheck, Activity, BarChart2 } from 'lucide-react';

interface SettingsPageProps {
  onOpenDiagnostics?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenDiagnostics }) => {
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const resetSeed = useMutation(api.settings.resetSeed);

  const [storeName, setStoreName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('DH');
  const [defaultShippingText, setDefaultShippingText] = useState('');
  const [defaultReturnPolicy, setDefaultReturnPolicy] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Marketing Pixels
  const [metaPixelId, setMetaPixelId] = useState('');
  const [enableMetaPixel, setEnableMetaPixel] = useState(false);
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [enableTikTokPixel, setEnableTikTokPixel] = useState(false);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [enableGoogleAnalytics, setEnableGoogleAnalytics] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || '');
      setDefaultCurrency(settings.defaultCurrency || 'DH');
      setDefaultShippingText(settings.defaultShippingText || '');
      setDefaultReturnPolicy(settings.defaultReturnPolicy || '');
      setContactPhone(settings.contactPhone || '');
      setMetaPixelId(settings.metaPixelId || '');
      setEnableMetaPixel(Boolean(settings.enableMetaPixel));
      setTiktokPixelId(settings.tiktokPixelId || '');
      setEnableTikTokPixel(Boolean(settings.enableTikTokPixel));
      setGoogleAnalyticsId(settings.googleAnalyticsId || '');
      setEnableGoogleAnalytics(Boolean(settings.enableGoogleAnalytics));
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
        metaPixelId: metaPixelId.trim(),
        enableMetaPixel,
        tiktokPixelId: tiktokPixelId.trim(),
        enableTikTokPixel,
        googleAnalyticsId: googleAnalyticsId.trim(),
        enableGoogleAnalytics,
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
    <div className="max-w-4xl space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            إعدادات المتجر والتتبع الإعلاني (Store & Tracking Settings)
          </h2>
          <p className="text-xs text-slate-500">
            تعديل الهوية، سياسات التوصيل، وبكسلات Meta و TikTok و Google Analytics
          </p>
        </div>

        {onOpenDiagnostics && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>فحص تشخيص التتبع (Diagnostics)</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Marketing & Tracking Pixels */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 text-right">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-end gap-2">
            <span>التسويق وتتبع الحملات (Marketing & Pixels)</span>
            <BarChart2 className="w-4 h-4 text-amber-500" />
          </h3>

          <div className="space-y-4">
            {/* Meta Pixel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                  <input
                    type="checkbox"
                    checked={enableMetaPixel}
                    onChange={(e) => setEnableMetaPixel(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>تفعيل Meta Pixel (Facebook & Instagram Ads)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">fbq</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => setMetaPixelId(e.target.value)}
                  placeholder="مثال: 123456789012345"
                  dir="ltr"
                  className="w-full max-w-md px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-left bg-white"
                />
              </div>
            </div>

            {/* TikTok Pixel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                  <input
                    type="checkbox"
                    checked={enableTikTokPixel}
                    onChange={(e) => setEnableTikTokPixel(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                  />
                  <span>تفعيل TikTok Pixel (TikTok Ads)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">ttq</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  placeholder="مثال: C9XXXXXXXXXXXXXX"
                  dir="ltr"
                  className="w-full max-w-md px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-left bg-white"
                />
              </div>
            </div>

            {/* Google Analytics */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900">
                  <input
                    type="checkbox"
                    checked={enableGoogleAnalytics}
                    onChange={(e) => setEnableGoogleAnalytics(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                  />
                  <span>تفعيل Google Analytics (GA4)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">G-XXXXX</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Google Analytics Measurement ID
                </label>
                <input
                  type="text"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  placeholder="مثال: G-1234567890"
                  dir="ltr"
                  className="w-full max-w-md px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono text-left bg-white"
                />
              </div>
            </div>
          </div>
        </div>

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
                <span>تم حفظ إعدادات المتجر والتتبع!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات والتتبع</span>
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
