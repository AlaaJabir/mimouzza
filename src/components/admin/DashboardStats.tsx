import React from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const metrics = useQuery(api.orders.getMetrics);
  const settings = useQuery(api.settings.get);

  const currency = settings?.defaultCurrency || 'DH';

  const stats = [
    {
      title: 'إجمالي المبيعات (Revenue)',
      englishTitle: 'Total Revenue',
      value: `${(metrics?.totalRevenue || 0).toLocaleString()} ${currency}`,
      subtitle: 'الطلبات المؤكدة وغير الملغاة',
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      bg: 'bg-emerald-50/70 border-emerald-200/80',
    },
    {
      title: 'طلبيات جديدة (New Orders)',
      englishTitle: 'Pending Confirmation',
      value: metrics?.newOrders || 0,
      subtitle: 'بحاجة إلى اتصال هاتفي للتأكيد',
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50/70 border-amber-200/80',
      highlight: (metrics?.newOrders || 0) > 0,
    },
    {
      title: 'إجمالي الطلبيات (Total Orders)',
      englishTitle: 'All Orders',
      value: metrics?.totalOrders || 0,
      subtitle: `${metrics?.confirmedOrders || 0} مؤكدة ومشحونة`,
      icon: <ShoppingBag className="w-5 h-5 text-blue-600" />,
      bg: 'bg-blue-50/70 border-blue-200/80',
    },
    {
      title: 'المنتجات المنشورة (Products)',
      englishTitle: 'Live Landing Pages',
      value: `${metrics?.publishedProducts || 0} / ${metrics?.totalProducts || 0}`,
      subtitle: 'صفحات هبوط نشطة تستقبل الزوار',
      icon: <Package className="w-5 h-5 text-purple-600" />,
      bg: 'bg-purple-50/70 border-purple-200/80',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`p-5 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition-shadow ${
            stat.highlight ? 'ring-2 ring-amber-400/50' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">{stat.englishTitle}</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>

          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mb-1">
            {stat.value}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="font-medium text-slate-700">{stat.title}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{stat.subtitle}</p>
        </div>
      ))}
    </div>
  );
};
