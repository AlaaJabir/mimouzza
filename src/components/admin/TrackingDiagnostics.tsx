import React, { useState, useEffect } from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import {
  getDiagnosticEvents,
  DiagnosticEventRecord,
  getVisitorId,
  getSessionId,
} from '../../lib/tracking';
import { BUSINESS_TIMEZONE } from '../../../convex/analytics';
import {
  CheckCircle2,
  RotateCcw,
  Activity,
  Fingerprint,
  Clock,
  Database,
} from 'lucide-react';

export const TrackingDiagnostics: React.FC = () => {
  const settings = useQuery(api.settings.get);
  const recentEvents = useQuery(api.analytics.getRecentEvents, { limit: 25 });
  const statusHistory = useQuery(api.analytics.getOrderStatusHistory, { limit: 15 });

  const [localEvents, setLocalEvents] = useState<DiagnosticEventRecord[]>(() => getDiagnosticEvents());
  const [currentVisitorId, setCurrentVisitorId] = useState<string>('');
  const [currentSessionId, setCurrentSessionId] = useState<string>('');

  useEffect(() => {
    setCurrentVisitorId(getVisitorId());
    setCurrentSessionId(getSessionId());

    const handleUpdate = () => {
      setLocalEvents(getDiagnosticEvents());
      setCurrentVisitorId(getVisitorId());
      setCurrentSessionId(getSessionId());
    };
    window.addEventListener('cod_diagnostics_updated', handleUpdate);
    return () => window.removeEventListener('cod_diagnostics_updated', handleUpdate);
  }, []);

  const metaConfigured = Boolean(settings?.enableMetaPixel && settings?.metaPixelId);
  const tiktokConfigured = Boolean(settings?.enableTikTokPixel && settings?.tiktokPixelId);

  // Check detected pixel dispatches in current browser session
  const metaPageView = localEvents.some((e) => e.target === 'Meta' && e.eventType === 'PageView');
  const metaViewContent = localEvents.some((e) => e.target === 'Meta' && e.eventType === 'ViewContent');
  const metaLeadPurchase = localEvents.some(
    (e) => e.target === 'Meta' && (e.eventType.includes('Lead') || e.eventType.includes('Purchase'))
  );

  const tiktokPageView = localEvents.some((e) => e.target === 'TikTok' && e.eventType === 'PageView');
  const tiktokViewContent = localEvents.some((e) => e.target === 'TikTok' && e.eventType === 'ViewContent');
  const tiktokSubmitForm = localEvents.some((e) => e.target === 'TikTok' && e.eventType === 'SubmitForm');
  const tiktokCompletePayment = localEvents.some(
    (e) => e.target === 'TikTok' && e.eventType === 'CompletePayment'
  );

  const coreEventTypes = [
    { type: 'PAGE_VIEW', label: 'Page View (فتح صفحة الهبوط)' },
    { type: 'PRODUCT_VIEW', label: 'Product View (معاينة المنتج)' },
    { type: 'CTA_CLICK', label: 'CTA Click (النقر على زر الطلب)' },
    { type: 'FORM_START', label: 'Form Start (بدء التفاعل مع الاستمارة)' },
    { type: 'ORDER_CREATED', label: 'Order Created (إنشاء طلبية حقيقية)' },
    { type: 'ORDER_CONFIRMED', label: 'Order Confirmed (تأكيد الطلبية)' },
    { type: 'ORDER_DELIVERED', label: 'Order Delivered (تسليم الطلبية)' },
    { type: 'ORDER_CANCELLED', label: 'Order Cancelled (إلغاء الطلبية)' },
    { type: 'ORDER_FAILED', label: 'Order Failed (فشل التوصيل)' },
  ];

  const handleClearLocalLog = () => {
    sessionStorage.removeItem('cod_local_diagnostics_events');
    setLocalEvents([]);
  };

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <span>فحص وتتبع الأحداث الحقيقية (Real-Time Analytics Diagnostics)</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </h2>
          <p className="text-xs text-slate-500">
            مراقبة حية لسجل الزوار، الجلسات، والأحداث المحفوظة فعلياً في قاعدة بيانات Convex (بدون أي بيانات تجريبية أو وهمية).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearLocalLog}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="مسح سجل المتصفح المحلي فقط (لا يحذف قاعدة البيانات)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>مسح سجل فحص المتصفح المؤقت</span>
          </button>
        </div>
      </div>

      {/* Anonymous Identity & Session Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <Fingerprint className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500 font-semibold">معرّف الزائر (Anonymous Visitor ID)</div>
            <div className="font-mono text-xs font-bold text-slate-900 truncate" dir="ltr">
              {currentVisitorId || '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500 font-semibold">معرّف الجلسة الحالية (Active Session ID)</div>
            <div className="font-mono text-xs font-bold text-slate-900 truncate" dir="ltr">
              {currentSessionId || '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-500 font-semibold">التوقيت المعتمد للتقارير (Timezone)</div>
            <div className="font-mono text-xs font-bold text-emerald-800 truncate" dir="ltr">
              {BUSINESS_TIMEZONE}
            </div>
          </div>
        </div>
      </div>

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

        {/* 3. Convex Authoritative Event Types */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900">Convex Authoritative Events</h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Persistent DB
            </span>
          </div>

          <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
            {coreEventTypes.map((item) => {
              const count = (recentEvents || []).filter((e) => e.eventType === item.type).length;
              const hasRecorded = count > 0;
              return (
                <div
                  key={item.type}
                  className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-slate-700">
                      {item.type}
                    </span>
                  </div>
                  {hasRecorded ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{count} في آخر الأحداث</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">0</span>
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
          <span>سجل الأحداث الأخيرة المحفوظة في قاعدة البيانات (Persisted Events in Convex)</span>
          <span className="text-[11px] font-mono text-slate-400 font-normal">
            آخر 25 حدث حقيقي
          </span>
        </h3>

        {!recentEvents || recentEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            No data yet — لا توجد أحداث مسجلة بعد. قم بزيارة صفحة هبوط عامة لتسجيل الأحداث الحقيقية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2">نوع الحدث (Event)</th>
                  <th className="py-2">الزائر (Visitor ID)</th>
                  <th className="py-2">الجلسة (Session ID)</th>
                  <th className="py-2">معرّف الزر (CTA ID)</th>
                  <th className="py-2">المنتج</th>
                  <th className="py-2">مصدر الإعلان (UTM)</th>
                  <th className="py-2">توقيت الخادم (Server Time)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEvents.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="py-2 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-900">
                        {e.eventType}
                      </span>
                    </td>
                    <td className="py-2 text-indigo-700 truncate max-w-[110px]" dir="ltr">
                      {e.visitorId || '—'}
                    </td>
                    <td className="py-2 text-slate-500 truncate max-w-[110px]" dir="ltr">
                      {e.sessionId}
                    </td>
                    <td className="py-2 text-amber-700">
                      {e.ctaId || (e.metadata && e.metadata.elementId) || '—'}
                    </td>
                    <td className="py-2 text-slate-700 truncate max-w-[130px]">{e.productId}</td>
                    <td className="py-2 text-blue-700">
                      {e.utmSource ? `${e.utmSource} / ${e.utmMedium || 'direct'}` : '(direct)'}
                    </td>
                    <td className="py-2 text-slate-500 whitespace-nowrap" dir="ltr">
                      {new Date(e.createdAt || e.timestamp).toLocaleString('en-GB', {
                        timeZone: BUSINESS_TIMEZONE,
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Status History Audit Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>سجل تغييرات حالة الطلبيات (Order Status History Audit Log)</span>
          <span className="text-[11px] font-mono text-slate-400 font-normal">
            ORDER_STATUS_HISTORY
          </span>
        </h3>

        {!statusHistory || statusHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-medium">
            No data yet — لا توجد تغييرات حالة مسجلة بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-2">رقم الطلب (Order)</th>
                  <th className="py-2">الحالة السابقة (Previous)</th>
                  <th className="py-2">الحالة الجديدة (New Status)</th>
                  <th className="py-2">توقيت الخادم (Timestamp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statusHistory.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="py-2 font-bold text-slate-900">{h.orderNumber || h.orderId}</td>
                    <td className="py-2 text-slate-500">{h.previousStatus || 'INITIAL'}</td>
                    <td className="py-2 font-bold text-emerald-700">{h.newStatus}</td>
                    <td className="py-2 text-slate-500" dir="ltr">
                      {new Date(h.timestamp).toLocaleString('en-GB', {
                        timeZone: BUSINESS_TIMEZONE,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
