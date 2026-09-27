import React, { useState } from 'react';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { BUSINESS_TIMEZONE } from '../../../convex/analytics';
import {
  Users,
  Eye,
  MousePointerClick,
  FileEdit,
  ShoppingBag,
  CheckCircle,
  Truck,
  DollarSign,
  TrendingUp,
  Calendar,
  Edit2,
  Save,
  History,
  Clock,
  Activity,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<
    'today' | 'yesterday' | '7days' | '30days' | 'month' | 'all'
  >('7days');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [editingSpendCampaign, setEditingSpendCampaign] = useState<string | null>(null);
  const [spendInputValue, setSpendInputValue] = useState<number>(0);

  const products = useQuery(api.products.list);
  const settings = useQuery(api.settings.get);
  const updateAdSpend = useMutation(api.settings.updateAdSpend);

  const currency = settings?.defaultCurrency || 'DH';

  const filterArgs = {
    range: dateRange,
    productId: selectedProduct === 'all' ? undefined : selectedProduct,
  };

  const funnelMetrics = useQuery(api.analytics.getFunnelMetrics, filterArgs);
  const ctaPerf = useQuery(api.analytics.getCtaPerformance, filterArgs);
  const trafficSources = useQuery(api.analytics.getTrafficSourcePerformance, filterArgs);
  const campaigns = useQuery(api.analytics.getCampaignPerformance, filterArgs);
  const productTable = useQuery(api.analytics.getProductAnalyticsTable, { range: dateRange });
  const dailySeries = useQuery(api.analytics.getDailyTimeSeries, filterArgs);
  const statusHistory = useQuery(api.analytics.getOrderStatusHistory, { limit: 20 });

  const handleSaveAdSpend = async (campaign: string) => {
    await updateAdSpend({ campaign, spend: spendInputValue });
    setEditingSpendCampaign(null);
  };

  const hasData = Boolean(
    funnelMetrics &&
      (funnelMetrics.visitors > 0 ||
        funnelMetrics.sessions > 0 ||
        funnelMetrics.pageViews > 0 ||
        funnelMetrics.totalOrders > 0)
  );

  const formatCasablancaTime = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleString();
    }
  };

  return (
    <div className="space-y-6" dir="ltr">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Conversion Funnel & Marketing Analytics
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Real-time funnel tracking, CTA placement performance, and campaign ROI attribution
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-neutral-200/80 text-neutral-600 font-mono text-xs font-semibold shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-[#FF6B00]" />
          <span>TZ: {BUSINESS_TIMEZONE}</span>
        </span>
      </div>

      {/* Top Filter Bar: Date Range + Product Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-neutral-200/70 shadow-2xs">
        {/* Date Segmented Control */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <Calendar className="w-4 h-4 text-neutral-400 mr-1.5 shrink-0 hidden sm:inline" />
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7days', label: 'Last 7 Days' },
            { id: '30days', label: 'Last 30 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateRange(item.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                dateRange === item.id
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-neutral-600 hover:text-[#111111] hover:bg-[#F8F8F6]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Product Filter */}
        <div className="flex items-center justify-end gap-2.5">
          <label className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
            Filter Product:
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="text-xs px-4 py-2 rounded-full border border-neutral-200/80 bg-[#F8F8F6] font-semibold text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
          >
            <option value="all">All Products</option>
            {(products || []).map((p) => (
              <option key={p._id} value={p._id}>
                {p.name.substring(0, 38)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty State Notice when no events/orders exist in selected period */}
      {!hasData && (
        <div className="bg-[#FFF3EB] border border-[#FF6B00]/30 rounded-3xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-[#FF6B00] text-white rounded-2xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#111111]">
                No funnel data recorded for this period yet
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                All numbers below are 100% real and connected to your database. Open any public product page (/p/slug) to record live visits and orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Top 8 Authoritative KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Unique Visitors',
            value: funnelMetrics?.visitors ?? 0,
            desc: `Sessions: ${funnelMetrics?.sessions ?? 0}`,
            icon: <Users className="w-4 h-4 text-[#FF6B00]" />,
          },
          {
            label: 'Product Views',
            value: funnelMetrics?.productViews ?? 0,
            desc: `Page Views: ${funnelMetrics?.pageViews ?? 0}`,
            icon: <Eye className="w-4 h-4 text-[#FF6B00]" />,
          },
          {
            label: 'CTA Clicks',
            value: funnelMetrics?.ctaClicks ?? 0,
            desc: `CTR: ${funnelMetrics?.ctaCtr ?? 0}%`,
            icon: <MousePointerClick className="w-4 h-4 text-[#FF6B00]" />,
          },
          {
            label: 'Form Starts',
            value: funnelMetrics?.formStarts ?? 0,
            desc: `Start Rate: ${funnelMetrics?.formStartRate ?? 0}%`,
            icon: <FileEdit className="w-4 h-4 text-[#FF6B00]" />,
          },
          {
            label: 'Total Orders',
            value: funnelMetrics?.totalOrders ?? 0,
            desc: `Visitor Conv: ${funnelMetrics?.orderConversionRate ?? 0}% · Session: ${funnelMetrics?.sessionConversionRate ?? 0}%`,
            icon: <ShoppingBag className="w-4 h-4 text-[#FF6B00]" />,
          },
          {
            label: 'Confirmed Orders',
            value: funnelMetrics?.confirmedOrders ?? 0,
            desc: `Confirmation Rate: ${funnelMetrics?.confirmationRate ?? 0}%`,
            icon: <CheckCircle className="w-4 h-4 text-[#129A56]" />,
          },
          {
            label: 'Delivered Orders',
            value: funnelMetrics?.deliveredOrders ?? 0,
            desc: `Delivery Rate: ${funnelMetrics?.deliveryRate ?? 0}% · Cancelled: ${funnelMetrics?.cancelledOrders ?? 0}`,
            icon: <Truck className="w-4 h-4 text-[#129A56]" />,
          },
          {
            label: 'Total Revenue',
            value: `${(funnelMetrics?.totalRevenue ?? 0).toLocaleString()} ${currency}`,
            desc: `Delivered: ${(funnelMetrics?.deliveredRevenue ?? 0).toLocaleString()} ${currency}`,
            icon: <DollarSign className="w-4 h-4 text-[#FF6B00]" />,
            isRevenue: true,
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-3xl border border-neutral-200/70 shadow-2xs hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-500">{kpi.label}</span>
              <div className="w-9 h-9 rounded-full bg-[#FFF3EB] flex items-center justify-center">
                {kpi.icon}
              </div>
            </div>
            <div
              className={`text-2xl font-extrabold font-mono tabular-nums ${
                kpi.isRevenue ? 'text-[#FF6B00]' : 'text-[#111111]'
              }`}
            >
              {kpi.value}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 font-medium">{kpi.desc}</div>
          </div>
        ))}
      </div>

      {/* 2. Visual Conversion Funnel (8 Authoritative Steps) */}
      <div className="bg-white p-6 rounded-3xl border border-neutral-200/70 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
            <span>Full Conversion Funnel (8 Stages)</span>
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            Authoritative Persisted Funnel
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
          {[
            {
              step: '1. Visitors',
              val: funnelMetrics?.visitors ?? 0,
              rate: funnelMetrics?.visitors ? '100%' : '0%',
              color: 'bg-[#F8F8F6] text-[#111111] border-neutral-200/80',
            },
            {
              step: '2. Sessions',
              val: funnelMetrics?.sessions ?? 0,
              rate: `${funnelMetrics?.visitors ? Math.round(((funnelMetrics.sessions || 0) / funnelMetrics.visitors) * 100) : 0}%`,
              color: 'bg-[#F8F8F6] text-[#111111] border-neutral-200/80',
            },
            {
              step: '3. Views',
              val: funnelMetrics?.productViews ?? 0,
              rate: `${funnelMetrics?.visitors ? Math.round(((funnelMetrics.productViews || 0) / funnelMetrics.visitors) * 100) : 0}%`,
              color: 'bg-[#F8F8F6] text-[#111111] border-neutral-200/80',
            },
            {
              step: '4. CTA Clicks',
              val: funnelMetrics?.ctaClicks ?? 0,
              rate: `${funnelMetrics?.ctaCtr ?? 0}%`,
              color: 'bg-[#FFF3EB] text-[#FF6B00] border-[#FF6B00]/20',
            },
            {
              step: '5. Form Starts',
              val: funnelMetrics?.formStarts ?? 0,
              rate: `${funnelMetrics?.formStartRate ?? 0}%`,
              color: 'bg-[#FFF3EB] text-[#FF6B00] border-[#FF6B00]/20',
            },
            {
              step: '6. Orders',
              val: funnelMetrics?.totalOrders ?? 0,
              rate: `${funnelMetrics?.orderConversionRate ?? 0}%`,
              color: 'bg-[#FFF3EB] text-[#FF6B00] border-[#FF6B00]/30',
            },
            {
              step: '7. Confirmed',
              val: funnelMetrics?.confirmedOrders ?? 0,
              rate: `${funnelMetrics?.confirmationRate ?? 0}%`,
              color: 'bg-[#E8F8F0] text-[#129A56] border-[#129A56]/20',
            },
            {
              step: '8. Delivered',
              val: funnelMetrics?.deliveredOrders ?? 0,
              rate: `${funnelMetrics?.deliveryRate ?? 0}%`,
              color: 'bg-[#E8F8F0] text-[#129A56] border-[#129A56]/20',
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex flex-col justify-between ${step.color}`}
            >
              <div className="text-[11px] font-bold truncate mb-1">{step.step}</div>
              <div className="text-xl font-extrabold font-mono tabular-nums my-1">{step.val}</div>
              <div className="text-[10px] font-semibold opacity-80 pt-1 border-t border-black/10">
                Rate: {step.rate}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Traffic Sources & CTA Performance Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources Table */}
        <div className="bg-white rounded-3xl border border-neutral-200/70 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-[#111111]">
              Traffic Sources (UTM Attribution)
            </h3>
            <span className="text-xs text-neutral-400 font-mono">UTM Source Breakdown</span>
          </div>

          {!trafficSources || trafficSources.length === 0 ? (
            <div className="py-10 text-center text-xs text-neutral-400">
              No traffic source data recorded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-neutral-400 border-b border-neutral-100 font-semibold">
                  <tr>
                    <th className="py-2.5">Source</th>
                    <th className="py-2.5">Visitors</th>
                    <th className="py-2.5">Sessions</th>
                    <th className="py-2.5">Clicks</th>
                    <th className="py-2.5">Orders</th>
                    <th className="py-2.5">Delivered</th>
                    <th className="py-2.5">Revenue</th>
                    <th className="py-2.5 text-right">Conv %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {trafficSources.map((src, i) => (
                    <tr key={i} className="hover:bg-[#F8F8F6]/60">
                      <td className="py-2.5 font-bold uppercase text-[#111111]">{src.source}</td>
                      <td className="py-2.5 font-mono">{src.visitors}</td>
                      <td className="py-2.5 font-mono text-neutral-500">{src.sessions}</td>
                      <td className="py-2.5 font-mono">{src.ctaClicks}</td>
                      <td className="py-2.5 font-mono font-bold text-[#111111]">{src.orders}</td>
                      <td className="py-2.5 font-mono text-[#129A56]">{src.delivered}</td>
                      <td className="py-2.5 font-mono font-semibold text-[#111111]">
                        {src.revenue} {currency}
                      </td>
                      <td className="py-2.5 font-mono text-[#FF6B00] font-bold text-right">
                        {src.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CTA Performance Breakdown */}
        <div className="bg-white rounded-3xl border border-neutral-200/70 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="text-sm font-bold text-[#111111]">
              CTA Placement Performance
            </h3>
            <span className="text-xs text-neutral-400 font-mono">Persisted CTA_CLICK Events</span>
          </div>

          <div className="space-y-3">
            {(ctaPerf || []).map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-[#F8F8F6] rounded-2xl border border-neutral-200/70 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111111]">{item.label}</span>
                    <span className="font-mono text-[10px] text-neutral-400 font-semibold">
                      ({item.id})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[#FF6B00]">
                    {item.clicks} clicks ({item.sharePercentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-200/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B00] rounded-full transition-all"
                    style={{ width: `${item.sharePercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Campaign Analytics & ROAS */}
      <div className="bg-white rounded-3xl border border-neutral-200/70 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-[#111111]">
            Campaign Performance & ROAS Calculator
          </h3>
          <span className="text-xs text-neutral-400">
            Click edit on Ad Spend to calculate Cost Per Order & ROAS
          </span>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No campaigns recorded in this period yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-500 bg-[#F8F8F6] border-b border-neutral-200/70 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Campaign</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Visitors</th>
                  <th className="py-2.5 px-3">Sessions</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3">Confirmed</th>
                  <th className="py-2.5 px-3">Delivered</th>
                  <th className="py-2.5 px-3">Revenue</th>
                  <th className="py-2.5 px-3">Ad Spend</th>
                  <th className="py-2.5 px-3">Cost / Order</th>
                  <th className="py-2.5 px-3 rounded-r-xl">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {campaigns.map((camp, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F8F6]/60">
                    <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                      {camp.campaign}
                    </td>
                    <td className="py-3 px-3 text-neutral-600 uppercase font-semibold">
                      {camp.source}
                    </td>
                    <td className="py-3 px-3 font-mono">{camp.visitors}</td>
                    <td className="py-3 px-3 font-mono text-neutral-500">{camp.sessions}</td>
                    <td className="py-3 px-3 font-mono font-bold text-[#111111]">{camp.orders}</td>
                    <td className="py-3 px-3 font-mono text-[#129A56]">{camp.confirmed}</td>
                    <td className="py-3 px-3 font-mono text-[#129A56] font-bold">
                      {camp.delivered}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                      {camp.revenue} {currency}
                    </td>

                    {/* Manual Ad Spend Input */}
                    <td className="py-3 px-3">
                      {editingSpendCampaign === camp.campaign ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={spendInputValue}
                            onChange={(e) => setSpendInputValue(Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-xs border border-neutral-300 rounded-lg font-mono"
                          />
                          <button
                            onClick={() => handleSaveAdSpend(camp.campaign)}
                            className="p-1.5 rounded-lg bg-[#FF6B00] text-white font-bold cursor-pointer"
                            title="Save Spend"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-[#111111]">
                            {camp.adSpend > 0 ? `${camp.adSpend} ${currency}` : '0'}
                          </span>
                          <button
                            onClick={() => {
                              setEditingSpendCampaign(camp.campaign);
                              setSpendInputValue(camp.adSpend || 0);
                            }}
                            className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-400 hover:text-[#111111] cursor-pointer"
                            title="Edit Ad Spend"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Cost Per Order */}
                    <td className="py-3 px-3 font-mono text-neutral-700">
                      {camp.adSpend > 0 && camp.orders > 0
                        ? `${camp.costPerOrder} ${currency}`
                        : '0'}
                    </td>

                    {/* ROAS */}
                    <td className="py-3 px-3 font-mono font-extrabold text-[#FF6B00]">
                      {camp.adSpend > 0 ? `${camp.roas}x` : '0x'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Daily Breakdown Table */}
      <div className="bg-white rounded-3xl border border-neutral-200/70 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF6B00]" />
            <span>Daily Traffic & Orders Breakdown</span>
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            Daily ({BUSINESS_TIMEZONE})
          </span>
        </div>

        {!dailySeries || dailySeries.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No daily metrics recorded in this period yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-500 bg-[#F8F8F6] border-b border-neutral-200/70 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Date</th>
                  <th className="py-2.5 px-3">Unique Visitors</th>
                  <th className="py-2.5 px-3">Sessions</th>
                  <th className="py-2.5 px-3">Page Views</th>
                  <th className="py-2.5 px-3">CTA Clicks</th>
                  <th className="py-2.5 px-3">Form Starts</th>
                  <th className="py-2.5 px-3">Orders</th>
                  <th className="py-2.5 px-3 rounded-r-xl">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {dailySeries.map((day) => (
                  <tr key={day.date} className="hover:bg-[#F8F8F6]/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#111111]">{day.date}</td>
                    <td className="py-2.5 px-3 font-mono">{day.visitors}</td>
                    <td className="py-2.5 px-3 font-mono text-neutral-500">{day.sessions}</td>
                    <td className="py-2.5 px-3 font-mono">{day.pageViews}</td>
                    <td className="py-2.5 px-3 font-mono">{day.ctaClicks}</td>
                    <td className="py-2.5 px-3 font-mono">{day.formStarts}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#111111]">{day.orders}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#FF6B00]">
                      {day.revenue} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Product Level Analytics Table */}
      <div className="bg-white rounded-3xl border border-neutral-200/70 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-[#111111]">
            Product Landing Page Performance
          </h3>
          <span className="text-xs text-neutral-400">Per-product conversion metrics</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-neutral-500 bg-[#F8F8F6] border-b border-neutral-200/70 font-semibold">
              <tr>
                <th className="py-2.5 px-3 rounded-l-xl">Product</th>
                <th className="py-2.5 px-3">Visitors</th>
                <th className="py-2.5 px-3">Sessions</th>
                <th className="py-2.5 px-3">Views</th>
                <th className="py-2.5 px-3">CTA Clicks</th>
                <th className="py-2.5 px-3">Form Starts</th>
                <th className="py-2.5 px-3">Orders</th>
                <th className="py-2.5 px-3">Confirmed</th>
                <th className="py-2.5 px-3">Delivered</th>
                <th className="py-2.5 px-3">Revenue</th>
                <th className="py-2.5 px-3">Conv Rate</th>
                <th className="py-2.5 px-3 rounded-r-xl">Delivery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(productTable || []).map((prod) => (
                <tr key={prod.productId} className="hover:bg-[#F8F8F6]/60">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={prod.image}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-[#111111] truncate max-w-xs">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">/p/{prod.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono">{prod.visitors}</td>
                  <td className="py-3 px-3 font-mono text-neutral-500">{prod.sessions}</td>
                  <td className="py-3 px-3 font-mono">{prod.productViews}</td>
                  <td className="py-3 px-3 font-mono">{prod.ctaClicks}</td>
                  <td className="py-3 px-3 font-mono">{prod.formStarts}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#111111]">{prod.orders}</td>
                  <td className="py-3 px-3 font-mono text-[#129A56]">{prod.confirmed}</td>
                  <td className="py-3 px-3 font-mono text-[#129A56] font-bold">
                    {prod.delivered}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                    {prod.revenue} {prod.currency}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#FF6B00]">
                    {prod.conversionRate}%
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#129A56]">
                    {prod.deliveryRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Auditable Order Status History Log */}
      <div className="bg-white rounded-3xl border border-neutral-200/70 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-[#111111] flex items-center gap-2">
            <History className="w-4 h-4 text-[#FF6B00]" />
            <span>Order Status History Log</span>
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            ORDER_STATUS_HISTORY Audit Trail
          </span>
        </div>

        {!statusHistory || statusHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-400">
            No order status history recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-500 bg-[#F8F8F6] border-b border-neutral-200/70 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Order ID</th>
                  <th className="py-2.5 px-3">Previous Status</th>
                  <th className="py-2.5 px-3">New Status</th>
                  <th className="py-2.5 px-3 rounded-r-xl">Timestamp ({BUSINESS_TIMEZONE})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {statusHistory.map((item) => (
                  <tr key={item._id} className="hover:bg-[#F8F8F6]/60">
                    <td className="py-2.5 px-3 font-bold text-[#111111]">
                      {item.orderNumber || item.orderId}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-500">
                      {item.previousStatus || '(ORDER_CREATED)'}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#129A56]">{item.newStatus}</td>
                    <td className="py-2.5 px-3 text-neutral-500">
                      {formatCasablancaTime(item.timestamp)}
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
