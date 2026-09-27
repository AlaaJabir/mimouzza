import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { db } from '../../../convex/db';
import { activateMetaPixelId, DEFAULT_META_PIXEL_ID } from '../../lib/tracking';
import { Save, RotateCcw, CheckCircle, Store, ShieldCheck, Activity, BarChart2, Database, RefreshCw } from 'lucide-react';

interface SettingsPageProps {
  onOpenDiagnostics?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenDiagnostics }) => {
  const settings = useQuery(api.settings.get);
  const products = useQuery(api.products.list);
  const orders = useQuery(api.orders.list);
  const updateSettings = useMutation(api.settings.update);
  const resetSeed = useMutation(api.settings.resetSeed);

  const [convexUrl, setConvexUrl] = useState(db.convexUrl || 'https://valuable-emu-538.convex.cloud');
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const [storeName, setStoreName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('DH');
  const [defaultShippingText, setDefaultShippingText] = useState('');
  const [defaultReturnPolicy, setDefaultReturnPolicy] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Marketing Pixels
  const [metaPixelId, setMetaPixelId] = useState(DEFAULT_META_PIXEL_ID);
  const [enableMetaPixel, setEnableMetaPixel] = useState(true);
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [enableTikTokPixel, setEnableTikTokPixel] = useState(false);
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [enableGoogleAnalytics, setEnableGoogleAnalytics] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || '');
      setDefaultCurrency(settings.defaultCurrency || 'DH');
      setDefaultShippingText(settings.defaultShippingText || '');
      setDefaultReturnPolicy(settings.defaultReturnPolicy || '');
      setContactPhone(settings.contactPhone || '');
      const resolvedMetaId = settings.metaPixelId || DEFAULT_META_PIXEL_ID;
      setMetaPixelId(resolvedMetaId);
      setEnableMetaPixel(settings.enableMetaPixel ?? Boolean(resolvedMetaId));
      setTiktokPixelId(settings.tiktokPixelId || '');
      setEnableTikTokPixel(Boolean(settings.enableTikTokPixel));
      setGoogleAnalyticsId(settings.googleAnalyticsId || '');
      setEnableGoogleAnalytics(Boolean(settings.enableGoogleAnalytics));
    }
  }, [settings]);

  const handleSyncConvex = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      db.setConvexUrl(convexUrl);
      const res = await db.syncWithConvexCloud();
      setSyncMessage(res.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      db.setConvexUrl(convexUrl);
      const cleanMetaId = metaPixelId.trim() || DEFAULT_META_PIXEL_ID;
      const shouldEnableMeta = Boolean(cleanMetaId) && enableMetaPixel;
      if (shouldEnableMeta && cleanMetaId) {
        activateMetaPixelId(cleanMetaId, true);
      }
      await updateSettings({
        storeName,
        defaultCurrency,
        defaultShippingText,
        defaultReturnPolicy,
        contactPhone,
        metaPixelId: cleanMetaId,
        enableMetaPixel: shouldEnableMeta,
        tiktokPixelId: tiktokPixelId.trim(),
        enableTikTokPixel: Boolean(tiktokPixelId.trim()) && enableTikTokPixel,
        googleAnalyticsId: googleAnalyticsId.trim(),
        enableGoogleAnalytics: Boolean(settings?.googleAnalyticsId || googleAnalyticsId.trim()) && enableGoogleAnalytics,
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
    await resetSeed({});
    setConfirmReset(false);
    window.location.reload();
  };

  return (
    <div className="max-w-4xl space-y-6 text-left" dir="ltr">
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111111] mb-1">
            Store &amp; Tracking Settings
          </h2>
          <p className="text-xs text-neutral-500">
            Configure your brand profile, Convex Cloud database sync, delivery policies, and Meta / TikTok / GA4 pixels.
          </p>
        </div>

        {onOpenDiagnostics && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="px-4 py-2 rounded-full border border-neutral-200 hover:border-[#111111] bg-[#F8F8F6] text-xs font-bold text-[#111111] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Open Tracking Diagnostics</span>
          </button>
        )}
      </div>

      {/* Convex Cloud Database Connection */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-[#FF6B00]" />
            <span>Convex Cloud Database Sync</span>
          </h3>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected &amp; Auto-Persisted
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Convex Deployment URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={convexUrl}
                onChange={(e) => setConvexUrl(e.target.value)}
                dir="ltr"
                placeholder="https://valuable-emu-538.convex.cloud"
                className="flex-1 px-4 py-2.5 text-xs rounded-2xl border border-neutral-200 font-mono text-left bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
              <button
                type="button"
                onClick={handleSyncConvex}
                disabled={isSyncing}
                className="px-5 py-2.5 rounded-full bg-[#111111] hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Save & Sync Now'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-neutral-200/60">
              <div className="text-[11px] font-semibold text-neutral-500">Saved Products</div>
              <div className="text-lg font-extrabold text-[#111111] font-mono mt-0.5">
                {(products || []).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-neutral-200/60">
              <div className="text-[11px] font-semibold text-neutral-500">Customer Orders</div>
              <div className="text-lg font-extrabold text-[#FF6B00] font-mono mt-0.5">
                {(orders || []).length}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8F8F6] border border-neutral-200/60">
              <div className="text-[11px] font-semibold text-neutral-500">Storage Engine</div>
              <div className="text-xs font-extrabold text-[#111111] mt-1.5">
                Authoritative Server + Convex
              </div>
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              ✓ {syncMessage}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Marketing & Tracking Pixels */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#FF6B00]" />
            <span>Marketing &amp; Ad Pixels</span>
          </h3>

          <div className="space-y-4">
            {/* Meta Pixel */}
            <div className="p-4 rounded-2xl border border-neutral-200/80 bg-[#F8F8F6] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#111111]">
                  <input
                    type="checkbox"
                    checked={enableMetaPixel}
                    onChange={(e) => setEnableMetaPixel(e.target.checked)}
                    className="rounded border-neutral-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span>Enable Meta Pixel (Facebook &amp; Instagram Ads)</span>
                </label>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>fbq: {metaPixelId.trim() || DEFAULT_META_PIXEL_ID}</span>
                </span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  Meta Pixel ID (Fires automatically across all landing pages)
                </label>
                <input
                  type="text"
                  value={metaPixelId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMetaPixelId(val);
                    if (val.trim()) {
                      setEnableMetaPixel(true);
                    }
                  }}
                  placeholder="135752956164308"
                  dir="ltr"
                  className="w-full max-w-md px-3.5 py-2 text-xs rounded-xl border border-neutral-200 font-mono text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            {/* TikTok Pixel */}
            <div className="p-4 rounded-2xl border border-neutral-200/80 bg-[#F8F8F6] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#111111]">
                  <input
                    type="checkbox"
                    checked={enableTikTokPixel}
                    onChange={(e) => setEnableTikTokPixel(e.target.checked)}
                    className="rounded border-neutral-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span>Enable TikTok Pixel (TikTok Ads)</span>
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">ttq</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  placeholder="e.g. C9XXXXXXXXXXXXXX"
                  dir="ltr"
                  className="w-full max-w-md px-3.5 py-2 text-xs rounded-xl border border-neutral-200 font-mono text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>

            {/* Google Analytics */}
            <div className="p-4 rounded-2xl border border-neutral-200/80 bg-[#F8F8F6] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#111111]">
                  <input
                    type="checkbox"
                    checked={enableGoogleAnalytics}
                    onChange={(e) => setEnableGoogleAnalytics(e.target.checked)}
                    className="rounded border-neutral-300 text-[#FF6B00] focus:ring-[#FF6B00]"
                  />
                  <span>Enable Google Analytics 4 (GA4)</span>
                </label>
                <span className="text-[11px] text-neutral-400 font-mono">G-XXXXX</span>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                  GA4 Measurement ID
                </label>
                <input
                  type="text"
                  value={googleAnalyticsId}
                  onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  placeholder="e.g. G-1234567890"
                  dir="ltr"
                  className="w-full max-w-md px-3.5 py-2 text-xs rounded-xl border border-neutral-200 font-mono text-left bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Store Profile */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#FF6B00]" />
            <span>Store Identity &amp; Currency</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Nestora COD Maroc"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">Default Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              >
                <option value="DH">Moroccan Dirham (DH)</option>
                <option value="MAD">MAD</option>
                <option value="$">USD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Support &amp; WhatsApp Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+212 661-234567"
                dir="ltr"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 text-left font-mono bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        {/* Default Arabic Shipping & Returns for Landing Pages */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider border-b border-neutral-100 pb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#FF6B00]" />
            <span>Default Landing Page Policies (Arabic Copy)</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Default Shipping Banner Copy (Arabic)
              </label>
              <input
                type="text"
                dir="rtl"
                value={defaultShippingText}
                onChange={(e) => setDefaultShippingText(e.target.value)}
                placeholder="التوصيل مجاني لجميع مدن المغرب — الدفع عند الاستلام"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1">
                Default Return Policy Copy (Arabic)
              </label>
              <input
                type="text"
                dir="rtl"
                value={defaultReturnPolicy}
                onChange={(e) => setDefaultReturnPolicy(e.target.value)}
                placeholder="ضمان الاسترجاع والاستبدال المجاني خلال 14 يوماً"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-[#F8F8F6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-xs bg-[#FF6B00] hover:bg-[#e66000] text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <span>Saving Settings...</span>
            ) : savedSuccess ? (
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Settings &amp; Pixels Saved!</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                <span>Save Store Settings</span>
              </span>
            )}
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 border border-rose-200 px-4 py-2 rounded-full bg-rose-50/50 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Orders &amp; Analytics History</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full">
              <span className="text-xs font-bold text-rose-800">Confirm reset?</span>
              <button
                type="button"
                onClick={handleResetData}
                className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2 py-1 text-xs text-neutral-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
