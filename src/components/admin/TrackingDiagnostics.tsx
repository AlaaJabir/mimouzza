import React, { useState, useEffect } from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import {
  getDiagnosticEvents,
  DiagnosticEventRecord,
  getVisitorId,
  getSessionId,
  DEFAULT_META_PIXEL_ID,
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

  const activeMetaPixelId = settings?.metaPixelId?.trim() || DEFAULT_META_PIXEL_ID;
  const metaConfigured = (settings?.enableMetaPixel ?? true) && Boolean(activeMetaPixelId);
  const tiktokConfigured = Boolean(settings?.enableTikTokPixel && settings?.tiktokPixelId);

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
    { type: 'PAGE_VIEW', label: 'Page View' },
    { type: 'PRODUCT_VIEW', label: 'Product View' },
    { type: 'CTA_CLICK', label: 'CTA Click' },
    { type: 'FORM_START', label: 'Form Start' },
    { type: 'ORDER_CREATED', label: 'Order Created' },
    { type: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
    { type: 'ORDER_DELIVERED', label: 'Order Delivered' },
    { type: 'ORDER_CANCELLED', label: 'Order Cancelled' },
    { type: 'ORDER_FAILED', label: 'Order Failed' },
  ];

  const handleClearLocalLog = () => {
    sessionStorage.removeItem('cod_local_diagnostics_events');
    setLocalEvents([]);
  };

  return (
    <div className="space-y-6 max-w-6xl text-left" dir="ltr">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111111] mb-1 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#FF6B00]" />
            <span>Real-Time Pixel &amp; Event Diagnostics</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Live verification of visitor sessions, Meta/TikTok pixel dispatches, and authoritative events persisted in Convex.
          </p>
        </div>

        <button
          onClick={handleClearLocalLog}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 text-xs font-bold text-[#111111] hover:bg-[#F8F8F6] cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Browser Session Log</span>
        </button>
      </div>

      {/* Anonymous Identity & Session Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-500 font-semibold">Anonymous Visitor ID</div>
            <div className="font-mono text-xs font-bold text-[#111111] truncate">
              {currentVisitorId || '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-500 font-semibold">Active Session ID</div>
            <div className="font-mono text-xs font-bold text-[#111111] truncate">
              {currentSessionId || '—'}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-neutral-500 font-semibold">Reporting Timezone</div>
            <div className="font-mono text-xs font-bold text-emerald-700 truncate">
              {BUSINESS_TIMEZONE}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Diagnostics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Meta Pixel Diagnostics */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">Meta Pixel</h3>
            {metaConfigured ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active ({activeMetaPixelId})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                Not Configured
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 font-medium">PageView</span>
              {metaPageView ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                </span>
              ) : (
                <span className="text-neutral-400">Waiting</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 font-medium">ViewContent</span>
              {metaViewContent ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                </span>
              ) : (
                <span className="text-neutral-400">Waiting</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 font-medium">Lead / Purchase</span>
              {metaLeadPurchase ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                </span>
              ) : (
                <span className="text-neutral-400">Waiting</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. TikTok Pixel Diagnostics */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">TikTok Pixel</h3>
            {tiktokConfigured ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active ({settings?.tiktokPixelId})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                Optional
              </span>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 font-medium">PageView</span>
              {tiktokPageView ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                </span>
              ) : (
                <span className="text-neutral-400">Waiting</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 font-medium">ViewContent</span>
              {tiktokViewContent ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                </span>
              ) : (
                <span className="text-neutral-400">Waiting</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 font-medium">SubmitForm / CompletePayment</span>
              {tiktokSubmitForm || tiktokCompletePayment ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Detected
                </span>
              ) : (
                <span className="text-neutral-400">Waiting</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. Convex Authoritative Event Types */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-xs font-extrabold text-[#111111] uppercase tracking-wider">Server DB Events</h3>
            <span className="text-[10px] font-bold text-[#FF6B00] bg-[#FF6B00]/10 px-2.5 py-0.5 rounded-full">
              Persistent
            </span>
          </div>

          <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
            {coreEventTypes.map((item) => {
              const count = (recentEvents || []).filter((e) => e.eventType === item.type).length;
              const hasRecorded = count > 0;
              return (
                <div
                  key={item.type}
                  className="flex items-center justify-between py-1 border-b border-neutral-50 last:border-0"
                >
                  <span className="font-mono text-[11px] font-semibold text-neutral-700">
                    {item.type}
                  </span>
                  {hasRecorded ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{count} recent</span>
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[10px]">0</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Recent Events Stream */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#111111]">
            Recent Persisted Events Stream
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            Last 25 authoritative events
          </span>
        </div>

        {!recentEvents || recentEvents.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 font-medium">
            No events recorded yet — open any public product landing page to stream live events.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 border-b border-neutral-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5">Event</th>
                  <th className="py-2.5">Visitor ID</th>
                  <th className="py-2.5">Session ID</th>
                  <th className="py-2.5">CTA Element</th>
                  <th className="py-2.5">Product ID</th>
                  <th className="py-2.5">UTM Source</th>
                  <th className="py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentEvents.map((e) => (
                  <tr key={e._id} className="hover:bg-[#F8F8F6] font-mono text-[11px]">
                    <td className="py-2.5 font-bold text-[#111111]">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F8F8F6] border border-neutral-200 text-[#111111]">
                        {e.eventType}
                      </span>
                    </td>
                    <td className="py-2.5 text-neutral-600 truncate max-w-[110px]">
                      {e.visitorId || '—'}
                    </td>
                    <td className="py-2.5 text-neutral-400 truncate max-w-[110px]">
                      {e.sessionId}
                    </td>
                    <td className="py-2.5 text-[#FF6B00] font-semibold">
                      {e.ctaId || (e.metadata && e.metadata.elementId) || '—'}
                    </td>
                    <td className="py-2.5 text-neutral-700 truncate max-w-[130px]">{e.productId}</td>
                    <td className="py-2.5 text-neutral-600">
                      {e.utmSource ? `${e.utmSource} / ${e.utmMedium || 'direct'}` : '(direct)'}
                    </td>
                    <td className="py-2.5 text-neutral-500 whitespace-nowrap">
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
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-extrabold text-[#111111]">
            Order Status Audit Log
          </h3>
          <span className="text-[11px] font-mono text-neutral-400">
            ORDER_STATUS_HISTORY
          </span>
        </div>

        {!statusHistory || statusHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400 font-medium">
            No status transitions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 border-b border-neutral-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5">Order #</th>
                  <th className="py-2.5">Previous Status</th>
                  <th className="py-2.5">New Status</th>
                  <th className="py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {statusHistory.map((h) => (
                  <tr key={h._id} className="hover:bg-[#F8F8F6] font-mono text-[11px]">
                    <td className="py-2.5 font-bold text-[#111111]">{h.orderNumber || h.orderId}</td>
                    <td className="py-2.5 text-neutral-500">{h.previousStatus || 'INITIAL'}</td>
                    <td className="py-2.5 font-bold text-[#FF6B00]">{h.newStatus}</td>
                    <td className="py-2.5 text-neutral-500">
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
