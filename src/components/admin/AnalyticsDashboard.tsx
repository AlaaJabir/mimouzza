import React, { useState } from 'react';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
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
  Percent,
  Calendar,
  Layers,
  ArrowDown,
  ExternalLink,
  Edit2,
  Save,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | '7days' | '30days' | 'month' | 'all'>('7days');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [editingSpendCampaign, setEditingSpendCampaign] = useState<string | null>(null);
  const [spendInputValue, setSpendInputValue] = useState<number>(0);

  const products = useQuery(api.products.list);
  const updateAdSpend = useMutation(api.settings.updateAdSpend);

  const filterArgs = {
    range: dateRange,
    productId: selectedProduct === 'all' ? undefined : selectedProduct,
  };

  const funnelMetrics = useQuery(api.analytics.getFunnelMetrics, filterArgs);
  const ctaPerf = useQuery(api.analytics.getCtaPerformance, filterArgs);
  const trafficSources = useQuery(api.analytics.getTrafficSourcePerformance, filterArgs);
  const campaigns = useQuery(api.analytics.getCampaignPerformance, filterArgs);
  const productTable = useQuery(api.analytics.getProductAnalyticsTable, { range: dateRange });

  const handleSaveAdSpend = async (campaign: string) => {
    await updateAdSpend({ campaign, spend: spendInputValue });
    setEditingSpendCampaign(null);
  };

  const hasData = funnelMetrics && (funnelMetrics.visitors > 0 || funnelMetrics.totalOrders > 0);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar: Date Range + Product Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        {/* Date Segmented Control */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <Calendar className="w-4 h-4 text-slate-400 mr-1.5 shrink-0 hidden sm:inline" />
          {[
            { id: 'today', label: 'اليوم (Today)' },
            { id: 'yesterday', label: 'أمس (Yesterday)' },
            { id: '7days', label: 'آخر 7 أيام (7 Days)' },
            { id: '30days', label: 'آخر 30 يوماً (30 Days)' },
            { id: 'month', label: 'هذا الشهر (This Month)' },
            { id: 'all', label: 'كل الفترة (All Time)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateRange(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                dateRange === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Product Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">المنتج:</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">جميع المنتجات (All Products)</option>
            {(products || []).map((p) => (
              <option key={p._id} value={p._id}>
                {p.name.substring(0, 30)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">لا توجد بيانات للفترة المحددة (No data yet)</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            قم بفتح صفحة الهبوط العامة للمنتج، الضغط على الأزرار أو تسجيل طلب تجريبي لمشاهدة البيانات الفورية تتدفق مباشرة هنا.
          </p>
        </div>
      ) : (
        <>
          {/* 1. Top 8 KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              {
                label: 'الزوار (Visitors)',
                value: funnelMetrics?.visitors || 0,
                desc: 'جلسات فريدة مسجلة',
                icon: <Users className="w-4 h-4 text-blue-600" />,
                bg: 'bg-blue-50/70 border-blue-200/80',
              },
              {
                label: 'مشاهدات المنتج (Views)',
                value: funnelMetrics?.productViews || 0,
                desc: 'تفاعل مع المحتوى',
                icon: <Eye className="w-4 h-4 text-indigo-600" />,
                bg: 'bg-indigo-50/70 border-indigo-200/80',
              },
              {
                label: 'نقرات الشراء (CTA Clicks)',
                value: funnelMetrics?.ctaClicks || 0,
                desc: `CTR: ${funnelMetrics?.ctaCtr || 0}%`,
                icon: <MousePointerClick className="w-4 h-4 text-amber-600" />,
                bg: 'bg-amber-50/70 border-amber-200/80',
              },
              {
                label: 'بدء ملء الاستمارة (Form Starts)',
                value: funnelMetrics?.formStarts || 0,
                desc: `معدل البدء: ${funnelMetrics?.formStartRate || 0}%`,
                icon: <FileEdit className="w-4 h-4 text-purple-600" />,
                bg: 'bg-purple-50/70 border-purple-200/80',
              },
              {
                label: 'الطلبات المسجلة (Orders)',
                value: funnelMetrics?.totalOrders || 0,
                desc: `تحويل: ${funnelMetrics?.orderConversionRate || 0}%`,
                icon: <ShoppingBag className="w-4 h-4 text-rose-600" />,
                bg: 'bg-rose-50/70 border-rose-200/80',
              },
              {
                label: 'الطلبات المؤكدة (Confirmed)',
                value: funnelMetrics?.confirmedOrders || 0,
                desc: `تأكيد: ${funnelMetrics?.confirmationRate || 0}%`,
                icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
                bg: 'bg-emerald-50/70 border-emerald-200/80',
              },
              {
                label: 'الطلبات المسلمة (Delivered)',
                value: funnelMetrics?.deliveredOrders || 0,
                desc: `تسليم: ${funnelMetrics?.deliveryRate || 0}%`,
                icon: <Truck className="w-4 h-4 text-teal-600" />,
                bg: 'bg-teal-50/70 border-teal-200/80',
              },
              {
                label: 'المداخيل الإجمالية (Revenue)',
                value: `${(funnelMetrics?.totalRevenue || 0).toLocaleString()} DH`,
                desc: 'الطلبات غير الملغاة',
                icon: <DollarSign className="w-4 h-4 text-amber-600" />,
                bg: 'bg-amber-100/70 border-amber-300/80',
                isRevenue: true,
              },
            ].map((kpi, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500">{kpi.label}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.bg}`}>
                    {kpi.icon}
                  </div>
                </div>
                <div
                  className={`text-xl font-black font-mono tabular-nums text-slate-900 ${
                    kpi.isRevenue ? 'text-amber-600' : ''
                  }`}
                >
                  {kpi.value}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-medium">{kpi.desc}</div>
              </div>
            ))}
          </div>

          {/* 2. Visual Conversion Funnel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs text-slate-400 font-mono">Real Convex Event Funnel</span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>مسار التحويل الواقعي (Full Conversion Funnel)</span>
                <TrendingUp className="w-4 h-4 text-amber-500" />
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-center" dir="rtl">
              {[
                {
                  step: '1. زوار (Visitors)',
                  val: funnelMetrics?.visitors || 0,
                  rate: '100%',
                  color: 'bg-blue-50 text-blue-900 border-blue-200',
                },
                {
                  step: '2. المشاهدات (Views)',
                  val: funnelMetrics?.productViews || 0,
                  rate: `${funnelMetrics?.visitors ? Math.round(((funnelMetrics.productViews || 0) / funnelMetrics.visitors) * 100) : 0}%`,
                  color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
                },
                {
                  step: '3. نقرات الزر (CTA)',
                  val: funnelMetrics?.ctaClicks || 0,
                  rate: `${funnelMetrics?.ctaCtr || 0}%`,
                  color: 'bg-amber-50 text-amber-900 border-amber-200',
                },
                {
                  step: '4. بدء الاستمارة (Form)',
                  val: funnelMetrics?.formStarts || 0,
                  rate: `${funnelMetrics?.formStartRate || 0}%`,
                  color: 'bg-purple-50 text-purple-900 border-purple-200',
                },
                {
                  step: '5. إرسال الطلب (Orders)',
                  val: funnelMetrics?.totalOrders || 0,
                  rate: `${funnelMetrics?.orderConversionRate || 0}%`,
                  color: 'bg-rose-50 text-rose-900 border-rose-200',
                },
                {
                  step: '6. التأكيد (Confirmed)',
                  val: funnelMetrics?.confirmedOrders || 0,
                  rate: `${funnelMetrics?.confirmationRate || 0}%`,
                  color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
                },
                {
                  step: '7. التسليم (Delivered)',
                  val: funnelMetrics?.deliveredOrders || 0,
                  rate: `${funnelMetrics?.deliveryRate || 0}%`,
                  color: 'bg-teal-50 text-teal-900 border-teal-200',
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${step.color}`}
                >
                  <div className="text-[11px] font-bold truncate mb-1">{step.step}</div>
                  <div className="text-xl font-black font-mono tabular-nums my-1">
                    {step.val}
                  </div>
                  <div className="text-[10px] font-semibold opacity-80 pt-1 border-t border-black/10">
                    نسبة: {step.rate}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Traffic Sources & CTA Performance Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Sources Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-mono">UTM Source Breakdown</span>
                <h3 className="text-sm font-bold text-slate-900">مصادر الزيارات الإعلانية (Traffic Sources)</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="text-slate-400 border-b border-slate-100 font-medium">
                    <tr>
                      <th className="py-2">المصدر (Source)</th>
                      <th className="py-2">الزوار</th>
                      <th className="py-2">النقرات</th>
                      <th className="py-2">الطلبات</th>
                      <th className="py-2">المسلمة</th>
                      <th className="py-2">المداخيل</th>
                      <th className="py-2">التحويل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(trafficSources || []).map((src, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2.5 font-bold uppercase text-slate-800">{src.source}</td>
                        <td className="py-2.5 font-mono">{src.visitors}</td>
                        <td className="py-2.5 font-mono">{src.ctaClicks}</td>
                        <td className="py-2.5 font-mono font-bold text-slate-900">{src.orders}</td>
                        <td className="py-2.5 font-mono text-emerald-700">{src.delivered}</td>
                        <td className="py-2.5 font-mono font-semibold">{src.revenue} DH</td>
                        <td className="py-2.5 font-mono text-amber-700">{src.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA Performance Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs text-slate-400 font-mono">Actual CTA_CLICK Events</span>
                <h3 className="text-sm font-bold text-slate-900">أداء أزرار الطلب (CTA Performance)</h3>
              </div>

              <div className="space-y-3">
                {(ctaPerf || []).map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 font-semibold">{item.id}</span>
                        <span className="font-bold text-slate-800">{item.label}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-600">
                        {item.clicks} نقرة ({item.sharePercentage}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${item.sharePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Campaign Analytics & ROAS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-400">
                أدخل ميزانية الإعلان (Ad Spend) يدوياً لكل حملة لحساب CPO و ROAS فورياً
              </span>
              <h3 className="text-sm font-bold text-slate-900">أداء الحملات الإعلانية ومصاريف الإشهار (Campaigns & ROAS)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="text-slate-500 bg-slate-50 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">الحملة (Campaign)</th>
                    <th className="py-2.5 px-3">المصدر</th>
                    <th className="py-2.5 px-3">الزوار</th>
                    <th className="py-2.5 px-3">الطلبيات</th>
                    <th className="py-2.5 px-3">المؤكدة</th>
                    <th className="py-2.5 px-3">المسلمة</th>
                    <th className="py-2.5 px-3">المداخيل</th>
                    <th className="py-2.5 px-3">ميزانية الإعلان (Spend)</th>
                    <th className="py-2.5 px-3">Cost / Order</th>
                    <th className="py-2.5 px-3">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(campaigns || []).map((camp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{camp.campaign}</td>
                      <td className="py-3 px-3 text-slate-600 uppercase font-semibold">{camp.source}</td>
                      <td className="py-3 px-3 font-mono">{camp.visitors}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{camp.orders}</td>
                      <td className="py-3 px-3 font-mono text-blue-700">{camp.confirmed}</td>
                      <td className="py-3 px-3 font-mono text-emerald-700 font-bold">{camp.delivered}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{camp.revenue} DH</td>

                      {/* Manual Ad Spend Input */}
                      <td className="py-3 px-3">
                        {editingSpendCampaign === camp.campaign ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={spendInputValue}
                              onChange={(e) => setSpendInputValue(Number(e.target.value) || 0)}
                              className="w-20 px-1.5 py-1 text-xs border border-slate-300 rounded font-mono"
                            />
                            <button
                              onClick={() => handleSaveAdSpend(camp.campaign)}
                              className="p-1 rounded bg-amber-500 text-slate-950 font-bold"
                              title="حفظ الميزانية"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-slate-800">
                              {camp.adSpend > 0 ? `${camp.adSpend} DH` : '—'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingSpendCampaign(camp.campaign);
                                setSpendInputValue(camp.adSpend || 0);
                              }}
                              className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700"
                              title="تعديل الميزانية"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Cost Per Order */}
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {camp.adSpend > 0 && camp.orders > 0 ? `${camp.costPerOrder} DH` : '—'}
                      </td>

                      {/* ROAS */}
                      <td className="py-3 px-3 font-mono font-black text-amber-600">
                        {camp.adSpend > 0 ? `${camp.roas}x` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Product Level Analytics Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs text-slate-400">إحصائيات كل منتج على حدة</span>
              <h3 className="text-sm font-bold text-slate-900">أداء صفحات المنتجات (Product Analytics)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="text-slate-500 bg-slate-50 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">المنتج</th>
                    <th className="py-2.5 px-3">الزوار</th>
                    <th className="py-2.5 px-3">المشاهدات</th>
                    <th className="py-2.5 px-3">نقرات CTA</th>
                    <th className="py-2.5 px-3">بدء الاستمارة</th>
                    <th className="py-2.5 px-3">الطلبات</th>
                    <th className="py-2.5 px-3">المؤكدة</th>
                    <th className="py-2.5 px-3">المسلمة</th>
                    <th className="py-2.5 px-3">المداخيل</th>
                    <th className="py-2.5 px-3">نسبة التحويل</th>
                    <th className="py-2.5 px-3">نسبة التسليم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(productTable || []).map((prod) => (
                    <tr key={prod.productId} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={prod.image}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 truncate max-w-xs">{prod.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">/p/{prod.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono">{prod.visitors}</td>
                      <td className="py-3 px-3 font-mono">{prod.productViews}</td>
                      <td className="py-3 px-3 font-mono">{prod.ctaClicks}</td>
                      <td className="py-3 px-3 font-mono">{prod.formStarts}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{prod.orders}</td>
                      <td className="py-3 px-3 font-mono text-blue-700">{prod.confirmed}</td>
                      <td className="py-3 px-3 font-mono text-emerald-700 font-bold">{prod.delivered}</td>
                      <td className="py-3 px-3 font-mono font-bold">{prod.revenue} {prod.currency}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-700">{prod.conversionRate}%</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700">{prod.deliveryRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
