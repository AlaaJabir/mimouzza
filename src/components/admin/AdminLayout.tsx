import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Product } from '../../../convex/schema';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { AdminSection } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { DashboardStats } from './DashboardStats';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { TrackingDiagnostics } from './TrackingDiagnostics';
import { ProductTable } from './ProductTable';
import { ProductEditor } from './ProductEditor';
import { OrderTable } from './OrderTable';
import { TemplatesPage } from './TemplatesPage';
import { SettingsPage } from './SettingsPage';
import { LivePreview } from './LivePreview';
import { MimouzzaLogo } from '../ui/MimouzzaLogo';
import {
  Plus,
  ExternalLink,
  X,
  Package,
  ShoppingBag,
  Calendar,
  Download,
  Search,
  Eye,
  MoreHorizontal,
  Edit3,
  Trash2,
} from 'lucide-react';

interface AdminLayoutProps {
  initialSection?: AdminSection;
  initialTab?: string;
  initialProductId?: string;
  initialIsNew?: boolean;
  onNavigateUrl?: (path: string) => void;
  onOpenPublicProduct?: (slug: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  initialSection = 'dashboard',
  initialProductId,
  initialIsNew = false,
}) => {
  const [currentSection, setCurrentSection] = useState<AdminSection>(initialSection);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(initialIsNew);
  const [previewModalProduct, setPreviewModalProduct] = useState<Product | null>(null);
  const [dashRange, setDashRange] = useState<'7days' | '30days' | 'all'>('7days');
  const [bottomTab, setBottomTab] = useState<'listings' | 'orders'>('listings');
  const [tableSearch, setTableSearch] = useState('');

  const products = useQuery(api.products.list);
  const orders = useQuery(api.orders.list);
  const removeOrder = useMutation(api.orders.remove);
  const settings = useQuery(api.settings.get);
  const funnel = useQuery(api.analytics.getFunnelMetrics, { range: dashRange });
  const dailySeries = useQuery(api.analytics.getDailyTimeSeries, { range: '7days' });
  const productAnalytics = useQuery(api.analytics.getProductAnalyticsTable, { range: dashRange });

  const currency = settings?.defaultCurrency || 'DH';

  React.useEffect(() => {
    if (initialProductId && products) {
      const found = products.find((p) => p._id === initialProductId);
      if (found) {
        setEditingProduct(found);
        setCurrentSection('products');
      }
    }
  }, [initialProductId, products]);

  const handleNavigateSection = (sec: AdminSection) => {
    handleCloseEditor();
    setCurrentSection(sec);
    const targetPath = sec === 'dashboard' ? '/admin' : `/admin/${sec}`;
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleCreateNewProduct = (templateId?: 'classic-cod' | 'premium' | 'big-offer') => {
    setEditingProduct(null);
    setIsCreatingNew(true);
    setCurrentSection('products');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/products/new');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsCreatingNew(false);
    setCurrentSection('products');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/admin/products/edit/${product._id}`);
    }
  };

  const handleCloseEditor = () => {
    setEditingProduct(null);
    setIsCreatingNew(false);
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/products/')) {
      window.history.pushState({}, '', '/admin/products');
    }
  };

  const handleSavedProduct = () => {
    setEditingProduct(null);
    setIsCreatingNew(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/products');
    }
  };

  const handleExportDashboardCsv = () => {
    const allOrders = orders || [];
    if (allOrders.length === 0) return;
    const rows = allOrders.map((o) => ({
      'Order ID': o.orderNumber,
      Customer: o.customerName,
      Phone: o.phone,
      City: o.city,
      Address: o.address,
      Product: o.productName,
      Quantity: o.quantity,
      Total: o.total,
      Currency: o.currency || 'DH',
      Status: o.status,
      Date: new Date(o.createdAt).toISOString().slice(0, 16).replace('T', ' '),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    XLSX.writeFile(wb, `Vitalive_COD_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Compute Order Distribution donut percentages
  const distribution = useMemo(() => {
    const list = orders || [];
    const total = list.length;
    const confirmed = list.filter((o) => o.status === 'CONFIRMED' || o.status === 'PROCESSING' || o.status === 'SHIPPED').length;
    const pending = list.filter((o) => o.status === 'NEW').length;
    const delivered = list.filter((o) => o.status === 'DELIVERED').length;
    const cancelled = list.filter((o) => o.status === 'CANCELLED' || o.status === 'FAILED').length;

    if (total === 0) {
      return {
        total: 0,
        segments: [
          { label: 'Confirmed', count: 0, pct: 40, color: '#FF6B00' },
          { label: 'Pending', count: 0, pct: 30, color: '#111111' },
          { label: 'Delivered', count: 0, pct: 20, color: '#FFB074' },
          { label: 'Cancelled', count: 0, pct: 10, color: '#E5E5E0' },
        ],
      };
    }

    return {
      total,
      segments: [
        { label: 'Confirmed', count: confirmed, pct: Math.round((confirmed / total) * 100), color: '#FF6B00' },
        { label: 'Pending', count: pending, pct: Math.round((pending / total) * 100), color: '#111111' },
        { label: 'Delivered', count: delivered, pct: Math.round((delivered / total) * 100), color: '#FFB074' },
        { label: 'Cancelled', count: cancelled, pct: Math.round((cancelled / total) * 100), color: '#E5E5E0' },
      ],
    };
  }, [orders]);

  // Compute last 7 days chart series
  const last7DaysData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const raw = dailySeries || [];
    if (raw.length === 0) {
      return dayNames.map((d, i) => ({
        dayLabel: d,
        date: d,
        visitors: 0,
        orders: 0,
        revenue: 0,
        isPeak: i === 2,
      }));
    }
    const sliced = raw.slice(-7);
    let maxActivityIdx = 0;
    let maxVal = -1;
    sliced.forEach((item, idx) => {
      const score = item.orders * 10 + item.visitors;
      if (score >= maxVal) {
        maxVal = score;
        maxActivityIdx = idx;
      }
    });
    return sliced.map((item, idx) => {
      const dObj = new Date(item.date + 'T00:00:00');
      const dayLabel = isNaN(dObj.getTime()) ? item.date.slice(5) : dayNames[dObj.getDay()];
      return {
        dayLabel,
        date: item.date,
        visitors: item.visitors,
        orders: item.orders,
        revenue: item.revenue,
        isPeak: idx === maxActivityIdx,
      };
    });
  }, [dailySeries]);

  return (
    <div className="min-h-screen w-full bg-[#F8F8F6] text-[#111111] flex flex-col font-sans" dir="ltr">
      {/* Top Horizontal Pill Header */}
      <AdminHeader
        currentSection={currentSection}
        onNavigate={handleNavigateSection}
        onCreateProduct={() => handleCreateNewProduct()}
      />

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
        {/* DASHBOARD VIEW */}
        {currentSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Hero Title & Action Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1 pb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                  Monitor Your Store Performance
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                  Track your daily COD orders, conversion rates, and live product listings in real-time
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Date Range Selector Pill */}
                <div className="inline-flex items-center gap-2 bg-white border border-neutral-200/90 rounded-full px-4 py-2 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  <select
                    value={dashRange}
                    onChange={(e) => setDashRange(e.target.value as any)}
                    className="text-xs font-semibold text-[#111111] bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportDashboardCsv}
                  disabled={(orders || []).length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                {/* Add New Product CTA */}
                <button
                  type="button"
                  onClick={() => handleCreateNewProduct()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#e66000] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add New Product</span>
                </button>
              </div>
            </div>

            {/* Row 1: 4 Metric Cards */}
            <DashboardStats />

            {/* Row 2: 3 Visual Chart Cards (Donut + Smooth Line + Rounded Pill Bars) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Card 1: Order Distribution Donut (3 cols) */}
              <div className="lg:col-span-3 bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#111111]">Order Distribution</h3>
                  <button
                    onClick={() => handleNavigateSection('orders')}
                    className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-[#111111] cursor-pointer"
                    title="View Orders"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>

                {/* SVG Donut Chart */}
                <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {(() => {
                      let cumulative = 0;
                      const radius = 36;
                      const circumference = 2 * Math.PI * radius;
                      return distribution.segments.map((seg, i) => {
                        const pct = Math.max(seg.pct, 4);
                        const dash = (pct / 100) * circumference;
                        const offset = (cumulative / 100) * circumference;
                        cumulative += pct;
                        return (
                          <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="14"
                            strokeDasharray={`${dash} ${circumference}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="round"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-extrabold text-[#111111] tabular-nums">
                      {distribution.total}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Orders
                    </span>
                  </div>
                </div>

                {/* 2x2 Legend */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-2 border-t border-neutral-100">
                  {distribution.segments.map((seg, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="text-neutral-600 font-medium">{seg.label}</span>
                      </div>
                      <span className="font-bold text-[#111111] tabular-nums">
                        {distribution.total > 0 ? `${seg.pct}%` : '0%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Sales & Revenue Overview Dual Line Chart (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-2xs flex flex-col justify-between">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-sm font-bold text-[#111111]">Sales Overview</h3>
                    <div className="flex items-center gap-3 text-xs font-medium text-neutral-500">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
                        Revenue
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#111111]" />
                        Visitors
                      </span>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#F8F8F6] border border-neutral-200/80 text-[11px] font-semibold text-neutral-600">
                    7 Days
                  </span>
                </div>

                {/* Summary Pill Callout */}
                <div className="flex items-center justify-between bg-[#F8F8F6] rounded-2xl px-4 py-2.5 mb-3 border border-neutral-200/50">
                  <div>
                    <span className="text-[11px] font-medium text-neutral-400 block">
                      Period Revenue
                    </span>
                    <span className="text-base font-extrabold text-[#111111] tabular-nums">
                      {(funnel?.totalRevenue ?? 0).toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-medium text-neutral-400 block">
                      Conversion Rate
                    </span>
                    <span className="text-base font-extrabold text-[#FF6B00] tabular-nums">
                      {funnel?.orderConversionRate ?? 0}%
                    </span>
                  </div>
                </div>

                {/* Smooth Dual Curve SVG Chart */}
                <div className="relative h-36 w-full pt-2">
                  {(() => {
                    const maxRev = Math.max(...last7DaysData.map((d) => d.revenue), 500);
                    const maxVis = Math.max(...last7DaysData.map((d) => d.visitors), 10);
                    const width = 420;
                    const height = 110;
                    const padX = 20;
                    const stepX = (width - padX * 2) / Math.max(last7DaysData.length - 1, 1);

                    const revPoints = last7DaysData.map((d, idx) => {
                      const x = padX + idx * stepX;
                      const y = height - 18 - (d.revenue / maxRev) * (height - 38);
                      return { x, y, val: d.revenue };
                    });

                    const visPoints = last7DaysData.map((d, idx) => {
                      const x = padX + idx * stepX;
                      const y = height - 18 - (d.visitors / maxVis) * (height - 45);
                      return { x, y, val: d.visitors };
                    });

                    const buildSmoothPath = (pts: { x: number; y: number }[]) => {
                      if (pts.length === 0) return '';
                      return pts.reduce((acc, pt, i, a) => {
                        if (i === 0) return `M ${pt.x},${pt.y}`;
                        const prev = a[i - 1];
                        const cx1 = prev.x + (pt.x - prev.x) / 2;
                        const cy1 = prev.y;
                        const cx2 = prev.x + (pt.x - prev.x) / 2;
                        const cy2 = pt.y;
                        return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${pt.x},${pt.y}`;
                      }, '');
                    };

                    const revPath = buildSmoothPath(revPoints);
                    const visPath = buildSmoothPath(visPoints);
                    const peakIdx = last7DaysData.findIndex((d) => d.isPeak);
                    const activePt = revPoints[peakIdx >= 0 ? peakIdx : 2] || revPoints[0];

                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="orangeArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid Lines */}
                        {[25, 55, 85].map((gy) => (
                          <line
                            key={gy}
                            x1={padX}
                            y1={gy}
                            x2={width - padX}
                            y2={gy}
                            stroke="#F0F0EC"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Area under Revenue curve */}
                        {revPoints.length > 1 && (
                          <path
                            d={`${revPath} L ${revPoints[revPoints.length - 1].x},${height - 15} L ${revPoints[0].x},${height - 15} Z`}
                            fill="url(#orangeArea)"
                          />
                        )}

                        {/* Visitors Curve (#111111) */}
                        <path
                          d={visPath}
                          fill="none"
                          stroke="#111111"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Revenue Curve (#FF6B00) */}
                        <path
                          d={revPath}
                          fill="none"
                          stroke="#FF6B00"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {/* Active Point Vertical Dashed Guide + Dot */}
                        {activePt && (
                          <>
                            <line
                              x1={activePt.x}
                              y1={activePt.y}
                              x2={activePt.x}
                              y2={height - 15}
                              stroke="#FF6B00"
                              strokeDasharray="3 3"
                              strokeWidth="1.5"
                            />
                            <circle
                              cx={activePt.x}
                              cy={activePt.y}
                              r="5"
                              fill="#FF6B00"
                              stroke="#FFFFFF"
                              strokeWidth="2.5"
                            />
                          </>
                        )}
                      </svg>
                    );
                  })()}
                </div>

                {/* X-Axis Day Labels */}
                <div className="flex items-center justify-between px-2 pt-2 text-[11px] font-semibold text-neutral-400">
                  {last7DaysData.map((d, i) => (
                    <span
                      key={i}
                      className={d.isPeak ? 'text-[#111111] font-extrabold' : ''}
                    >
                      {d.dayLabel}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 3: Daily Activity Pill Bar Chart (4 cols) */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#111111]">Conversion Activity</h3>
                    <p className="text-[11px] text-neutral-400 font-medium">
                      Daily orders & funnel traffic
                    </p>
                  </div>
                  <button
                    onClick={() => handleNavigateSection('analytics')}
                    className="px-3 py-1 rounded-full bg-[#F8F8F6] hover:bg-neutral-200/70 border border-neutral-200/80 text-[11px] font-semibold text-[#111111] transition-colors cursor-pointer"
                  >
                    Full Funnel →
                  </button>
                </div>

                {/* Vertical Rounded Pill Bars */}
                <div className="grid grid-cols-7 gap-2.5 items-end h-40 pt-6 pb-2 px-1">
                  {(() => {
                    const maxCount = Math.max(
                      ...last7DaysData.map((d) => d.orders + d.visitors),
                      1
                    );
                    return last7DaysData.map((d, idx) => {
                      const totalAct = d.orders + d.visitors;
                      const heightPct =
                        totalAct > 0
                          ? Math.max(24, Math.round((totalAct / maxCount) * 100))
                          : 22 + ((idx * 11) % 30);

                      return (
                        <div
                          key={idx}
                          className="flex flex-col items-center justify-end h-full gap-2 group relative"
                        >
                          {/* Floating dark badge on peak bar */}
                          {d.isPeak && (
                            <div className="absolute -top-6 bg-[#111111] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                              {d.orders} ord
                            </div>
                          )}

                          <div className="w-full h-full flex items-end justify-center">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full max-w-[34px] rounded-2xl transition-all duration-300 ${
                                d.isPeak
                                  ? 'bg-[#FF6B00] shadow-sm'
                                  : 'bg-[#F2F2EE] group-hover:bg-[#FFD4B3]'
                              }`}
                            />
                          </div>

                          <span
                            className={`text-[11px] font-semibold ${
                              d.isPeak ? 'text-[#111111] font-bold' : 'text-neutral-400'
                            }`}
                          >
                            {d.dayLabel}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Bottom Funnel Micro-Bar */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 text-center">
                  <div className="bg-[#F8F8F6] rounded-2xl py-2 px-2">
                    <span className="text-[10px] text-neutral-400 font-semibold block">
                      Visitors
                    </span>
                    <span className="text-sm font-extrabold text-[#111111] tabular-nums">
                      {funnel?.visitors ?? 0}
                    </span>
                  </div>
                  <div className="bg-[#F8F8F6] rounded-2xl py-2 px-2">
                    <span className="text-[10px] text-neutral-400 font-semibold block">
                      CTA Clicks
                    </span>
                    <span className="text-sm font-extrabold text-[#111111] tabular-nums">
                      {funnel?.ctaClicks ?? 0}
                    </span>
                  </div>
                  <div className="bg-[#FFF3EB] rounded-2xl py-2 px-2">
                    <span className="text-[10px] text-[#FF6B00] font-semibold block">
                      Orders
                    </span>
                    <span className="text-sm font-extrabold text-[#FF6B00] tabular-nums">
                      {funnel?.totalOrders ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Bottom Full-Width Table Card (Top Performing Listings & Recent COD Orders) */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Switcher Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBottomTab('listings')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      bottomTab === 'listings'
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#F8F8F6] text-neutral-600 hover:text-[#111111]'
                    }`}
                  >
                    Top Performing Listings ({(products || []).length})
                  </button>
                  <button
                    onClick={() => setBottomTab('orders')}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      bottomTab === 'orders'
                        ? 'bg-[#111111] text-white'
                        : 'bg-[#F8F8F6] text-neutral-600 hover:text-[#111111]'
                    }`}
                  >
                    <span>Recent COD Orders</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-[#FF6B00] text-white text-[10px]">
                      {(orders || []).length}
                    </span>
                  </button>
                </div>

                {/* Search & View All */}
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Search product or order..."
                      className="pl-9 pr-4 py-2 rounded-full bg-[#F8F8F6] border border-neutral-200/80 text-xs text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:border-[#111111] w-48 sm:w-64"
                    />
                  </div>

                  <button
                    onClick={() =>
                      handleNavigateSection(bottomTab === 'listings' ? 'products' : 'orders')
                    }
                    className="px-4 py-2 rounded-full border border-neutral-200/90 hover:bg-neutral-50 text-xs font-semibold text-[#111111] cursor-pointer whitespace-nowrap"
                  >
                    View All →
                  </button>
                </div>
              </div>

              {/* Tab 1: Top Performing Listings */}
              {bottomTab === 'listings' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-neutral-400 font-semibold border-b border-neutral-100">
                      <tr>
                        <th className="pb-3 pl-2">Product Name</th>
                        <th className="pb-3">Landing URL</th>
                        <th className="pb-3">Template</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Views / Clicks</th>
                        <th className="pb-3">Orders & Revenue</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {(products || [])
                        .filter(
                          (p) =>
                            !tableSearch ||
                            p.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            p.slug.toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((prod) => {
                          const perf = (productAnalytics || []).find(
                            (pa) => pa.productId === prod._id
                          );
                          return (
                            <tr
                              key={prod._id}
                              className="hover:bg-[#F8F8F6]/60 transition-colors"
                            >
                              <td className="py-3.5 pl-2">
                                <div className="flex items-center gap-3">
                                  {prod.images?.[0] ? (
                                    <img
                                      src={prod.images[0]}
                                      alt={prod.name}
                                      className="w-10 h-10 rounded-2xl object-cover border border-neutral-200 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-2xl bg-[#F8F8F6] border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-[#111111] text-xs max-w-[220px] truncate">
                                      {prod.name}
                                    </div>
                                    <div className="text-[11px] text-neutral-400">
                                      Stock: {prod.stockQuantity ?? 15} units
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 font-mono text-[11px] text-neutral-500">
                                /p/{prod.slug}
                              </td>
                              <td className="py-3.5">
                                <span className="px-2.5 py-1 rounded-full bg-[#F8F8F6] border border-neutral-200/80 text-[11px] font-semibold text-neutral-700">
                                  {prod.templateId}
                                </span>
                              </td>
                              <td className="py-3.5 font-bold text-[#111111] tabular-nums">
                                {prod.price} {prod.currency || 'DH'}
                              </td>
                              <td className="py-3.5 tabular-nums text-neutral-600">
                                <span className="font-bold text-[#111111]">
                                  {perf?.productViews ?? 0}
                                </span>{' '}
                                views · {perf?.ctaClicks ?? 0} clicks
                              </td>
                              <td className="py-3.5 tabular-nums">
                                <span className="font-bold text-[#FF6B00]">
                                  {perf?.orders ?? 0} orders
                                </span>{' '}
                                <span className="text-neutral-400">
                                  ({(perf?.revenue ?? 0).toLocaleString()} {currency})
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    prod.isPublished || prod.status === 'ACTIVE'
                                      ? 'bg-[#E8F8F0] text-[#129A56]'
                                      : 'bg-neutral-100 text-neutral-500'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      prod.isPublished || prod.status === 'ACTIVE'
                                        ? 'bg-[#129A56]'
                                        : 'bg-neutral-400'
                                    }`}
                                  />
                                  {prod.isPublished || prod.status === 'ACTIVE' ? 'Active' : 'Draft'}
                                </span>
                              </td>
                              <td className="py-3.5 pr-2 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => setPreviewModalProduct(prod)}
                                    className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-[#111111] cursor-pointer"
                                    title="Live Preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditProduct(prod)}
                                    className="p-2 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-[#111111] cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={`/p/${encodeURIComponent(prod.slug)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-[#FFF3EB] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white transition-colors"
                                    title="Open Public Landing Page"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Tab 2: Recent COD Orders */
                <div className="overflow-x-auto">
                  {(orders || []).length === 0 ? (
                    <div className="py-10 text-center text-neutral-400 text-xs">
                      No orders recorded yet. Place a test order on any live landing page to see it appear immediately.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="text-neutral-400 font-semibold border-b border-neutral-100">
                        <tr>
                          <th className="pb-3 pl-2">Order ID</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Phone & City</th>
                          <th className="pb-3">Product</th>
                          <th className="pb-3">Total COD</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {(orders || [])
                          .filter(
                            (o) =>
                              !tableSearch ||
                              o.customerName.toLowerCase().includes(tableSearch.toLowerCase()) ||
                              o.phone.includes(tableSearch) ||
                              o.orderNumber.toLowerCase().includes(tableSearch.toLowerCase())
                          )
                          .slice(0, 8)
                          .map((ord) => (
                            <tr
                              key={ord._id}
                              className="hover:bg-[#F8F8F6]/60 transition-colors"
                            >
                              <td className="py-3.5 pl-2 font-mono font-bold text-[#111111]">
                                {ord.orderNumber}
                              </td>
                              <td className="py-3.5 font-bold text-[#111111]">
                                {ord.customerName}
                              </td>
                              <td className="py-3.5 text-neutral-600">
                                <span className="font-mono font-semibold text-[#111111]">
                                  {ord.phone}
                                </span>{' '}
                                · {ord.city}
                              </td>
                              <td className="py-3.5 text-neutral-700 max-w-[200px] truncate">
                                {ord.productName} (×{ord.quantity})
                              </td>
                              <td className="py-3.5 font-extrabold text-[#FF6B00] tabular-nums">
                                {ord.total} {ord.currency || 'DH'}
                              </td>
                              <td className="py-3.5">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    ord.status === 'NEW'
                                      ? 'bg-[#FFF3EB] text-[#FF6B00]'
                                      : ord.status === 'CONFIRMED' || ord.status === 'DELIVERED'
                                      ? 'bg-[#E8F8F0] text-[#129A56]'
                                      : 'bg-neutral-100 text-neutral-600'
                                  }`}
                                >
                                  {ord.status}
                                </span>
                              </td>
                              <td className="py-3.5 pr-2 text-right">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleNavigateSection('orders')}
                                    className="px-3 py-1.5 rounded-full bg-[#F8F8F6] hover:bg-[#111111] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    Manage
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void removeOrder({ orderId: ord._id })}
                                    className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition-colors cursor-pointer"
                                    title="Delete Fake / Test Order"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {currentSection === 'analytics' && <AnalyticsDashboard />}

        {/* PRODUCTS VIEW */}
        {currentSection === 'products' && (
          <div className="h-full">
            {isCreatingNew || editingProduct ? (
              <ProductEditor
                initialProduct={editingProduct}
                onBack={handleCloseEditor}
                onSaved={handleSavedProduct}
              />
            ) : (
              <ProductTable
                onEdit={handleEditProduct}
                onPreview={(p) => setPreviewModalProduct(p)}
                onCreateNew={() => handleCreateNewProduct()}
              />
            )}
          </div>
        )}

        {/* TEMPLATES VIEW */}
        {currentSection === 'templates' && (
          <TemplatesPage
            onCreateWithTemplate={(templateId) => {
              handleCreateNewProduct(templateId);
            }}
            onPreviewTemplate={(templateId) => {
              const sample = products?.find((p) => p.templateId === templateId) || products?.[0];
              if (sample) setPreviewModalProduct(sample);
            }}
          />
        )}

        {/* ORDERS VIEW */}
        {currentSection === 'orders' && <OrderTable />}

        {/* DIAGNOSTICS VIEW */}
        {currentSection === 'diagnostics' && <TrackingDiagnostics />}

        {/* SETTINGS VIEW */}
        {currentSection === 'settings' && (
          <SettingsPage onOpenDiagnostics={() => handleNavigateSection('diagnostics')} />
        )}
      </main>

      {/* Fullscreen Live Preview Modal */}
      {previewModalProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalProduct(null)}
        >
          <div
            className="w-full max-w-5xl h-[90vh] bg-[#111111] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-13 bg-[#C80C32] px-5 flex items-center justify-between border-b border-[#a60828] text-xs text-white">
              <div className="flex items-center gap-3">
                <MimouzzaLogo height={26} />
                <span className="font-bold text-white/90 hidden sm:inline">
                  — {previewModalProduct.name}
                </span>
              </div>
              <button
                onClick={() => setPreviewModalProduct(null)}
                className="p-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <LivePreview product={previewModalProduct} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

