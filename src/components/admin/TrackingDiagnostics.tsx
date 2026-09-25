import React, { useState, useEffect } from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import {
  getDiagnosticEvents,
  DiagnosticEventRecord,
  trackEvent,
  initMarketingPixels,
} from '../../lib/tracking';
import { Button } from '../ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Activity,
  ShieldCheck,
  Code,
} from 'lucide-react';

export const TrackingDiagnostics: React.FC = () => {
  const settings = useQuery(api.settings.get);
  const products = useQuery(api.products.listPublished);
  const recentEvents = useQuery(api.analytics.getRecentEvents, { limit: 15 });

  const [localEvents, setLocalEvents] = useState<DiagnosticEventRecord[]>(() => getDiagnosticEvents());
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setLocalEvents(getDiagnosticEvents());
    };
    window.addEventListener('cod_diagnostics_updated', handleUpdate);
    return () => window.removeEventListener('cod_diagnostics_updated', handleUpdate);
  }, []);

  const metaConfigured = Boolean(settings?.enableMetaPixel && settings?.metaPixelId);
  const tiktokConfigured = Boolean(settings?.enableTikTokPixel && settings?.tiktokPixelId);

  // Check detected events
  const metaPageView = localEvents.some((e) => e.target === 'Meta' && e.eventType === 'PageView');
  const metaViewContent = localEvents.some((e) => e.target === 'Meta' && e.eventType === 'ViewContent');
  const metaLeadPurchase = localEvents.some((e) => e.target === 'Meta' && (e.eventType.includes('Lead') || e.eventType.includes('Purchase')));

  const tiktokPageView = localEvents.some((e) => e.target === 'TikTok' && e.eventType === 'PageView');
  const tiktokViewContent = localEvents.some((e) => e.target === 'TikTok' && e.eventType === 'ViewContent');
  const tiktokSubmitForm = localEvents.some((e) => e.target === 'TikTok' && e.eventType === 'SubmitForm');
  const tiktokCompletePayment = localEvents.some((e) => e.target === 'TikTok' && e.eventType === 'CompletePayment');

  const allEventTypes = [
    { type: 'PAGE_VIEW', label: 'PageView (زيارة الصفحة)' },
    { type: 'VIEW_CONTENT', label: 'ViewContent (معاينة المنتج)' },
    { type: 'CTA_CLICK', label: 'CTA Click (نقرات أزرار الطلب)' },
    { type: 'FORM_VIEW', label: 'Form View (مشاهدة الاستمارة)' },
    { type: 'FORM_START', label: 'Form Start (بدء إدخال البيانات)' },
    { type: 'VARIANT_SELECT', label: 'Variant Select (اختيار القياس/اللون)' },
    { type: 'QUANTITY_CHANGE', label: 'Quantity Change (تعديل الكمية)' },
    { type: 'FORM_SUBMIT', label: 'Form Submit (إرسال الطلب)' },
    { type: 'ORDER_SUCCESS', label: 'Order Success (نجاح الطلب وحفظه)' },
    { type: 'WHATSAPP_CLICK', label: 'WhatsApp Click (نقرة الواتساب)' },
    { type: 'PRODUCT_IMAGE_VIEW', label: 'Image View (استعراض صور المنتج)' },
  ];

  const handleRunTestEvent = () => {
    const sampleProd = products && products.length > 0 ? products[0] : null;
    const testProdId = sampleProd ? sampleProd._id : 'test_prod_diagnostics';

    // Fire test event sequence
    trackEvent({
      eventType: 'CTA_CLICK',
      productId: testProdId,
      productName: sampleProd?.name || 'Test Product',
      price: 299,
      currency: 'DH',
      metadata: { elementId: 'diagnostics_test_cta', isTest: true },
    });

    setTestResult(`تم إرسال حدث اختباري بنجاح وتم تسجيله في نظام التتبع الداخلي والبكسلات النشطة!`);
    setLocalEvents(getDiagnosticEvents());
    setTimeout(() => setTestResult(null), 5000);
  };

  const handleClearLocalLog = () => {
    sessionStorage.removeItem('cod_local_diagnostics_events');
    setLocalEvents([]);
  };

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span>تشخيص واختبار تتبع الإعلانات (Tracking Diagnostics)</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </h2>
          <p className="text-xs text-slate-500">
            فحص حي يوضح ما إذا كانت أحداث Meta Pixel و TikTok Pixel والتتبع الداخلي تُسجل فعلياً في المتصفح.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunTestEvent}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            <span>تشغيل حدث اختبار (Run Test Event)</span>
          </Button>
          <button
            onClick={handleClearLocalLog}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
            title="مسح سجل المتصفح المحلي"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Grid: 3 Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Meta Pixel Diagnostics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">Meta Pixel</h3>
            {metaConfigured ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                مفعّل ({settings?.metaPixelId})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                غير معرّف في الإعدادات
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">PageView</span>
              {metaPageView ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم رصده
                </span>
              ) : (
                <span className="text-slate-400">لم يرصد بعد</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">ViewContent</span>
              {metaViewContent ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم رصده
                </span>
              ) : (
                <span className="text-slate-400">لم يرصد بعد</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Lead / Purchase</span>
              {metaLeadPurchase ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم رصده
                </span>
              ) : (
                <span className="text-slate-400">لم يرصد بعد</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. TikTok Pixel Diagnostics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">TikTok Pixel</h3>
            {tiktokConfigured ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                مفعّل ({settings?.tiktokPixelId})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                غير معرّف في الإعدادات
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">PageView</span>
              {tiktokPageView ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم رصده
                </span>
              ) : (
                <span className="text-slate-400">لم يرصد بعد</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">ViewContent</span>
              {tiktokViewContent ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم رصده
                </span>
              ) : (
                <span className="text-slate-400">لم يرصد بعد</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">SubmitForm</span>
              {tiktokSubmitForm ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم رصده
                </span>
              ) : (
                <span className="text-slate-400">لم يرصد بعد</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">CompletePayment</span>
              {tiktokCompletePayment ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> تم رصده
                </span>
              ) : (
                <span className="text-slate-400">لم يرصد بعد</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Convex Internal Analytics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">Convex DB Analytics</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active Reactive
            </span>
          </div>

          <div className="space-y-1.5 text-xs max-h-52 overflow-y-auto pr-1">
            {allEventTypes.map((item) => {
              const count = (recentEvents || []).filter((e) => e.eventType === item.type).length;
              const hasRecorded = count > 0;
              return (
                <div key={item.type} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">{item.type}</span>
                  </div>
                  {hasRecorded ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{count} رصد</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">جاهز للرصد</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Recent Events Stream */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>سجل الأحداث الأخيرة (Live Recent Events in Convex)</span>
          <span className="text-[11px] font-mono text-slate-400 font-normal">
            آخر 15 حدث مسجل بالخادم
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-2">نوع الحدث (Event)</th>
                <th className="py-2">معرّف الحدث (EventID)</th>
                <th className="py-2">الجلسة (Session ID)</th>
                <th className="py-2">المنتج</th>
                <th className="py-2">مصدر الإعلان (UTM)</th>
                <th className="py-2">بيانات إضافية (Metadata)</th>
                <th className="py-2">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(recentEvents || []).map((e) => (
                <tr key={e._id} className="hover:bg-slate-50 font-mono text-[11px]">
                  <td className="py-2 font-bold text-slate-800">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900">
                      {e.eventType}
                    </span>
                  </td>
                  <td className="py-2 text-slate-500">{e.eventId}</td>
                  <td className="py-2 text-slate-400 truncate max-w-[100px]">{e.sessionId}</td>
                  <td className="py-2 text-slate-700 truncate max-w-[130px]">{e.productId}</td>
                  <td className="py-2 text-blue-700">{e.utmSource ? `${e.utmSource} / ${e.utmMedium || 'cpc'}` : '(direct)'}</td>
                  <td className="py-2 text-slate-500 truncate max-w-[150px]">
                    {e.metadata && Object.keys(e.metadata).length > 0 ? JSON.stringify(e.metadata) : '—'}
                  </td>
                  <td className="py-2 text-slate-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleTimeString('ar-MA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
