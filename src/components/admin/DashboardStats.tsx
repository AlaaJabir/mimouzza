import React from 'react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import {
  ShoppingBag,
  Package,
  Clock,
  DollarSign,
} from 'lucide-react';

export const DashboardStats: React.FC = () => {
  const metrics = useQuery(api.orders.getMetrics);
  const settings = useQuery(api.settings.get);

  const currency = settings?.defaultCurrency || 'DH';

  const stats = [
    {
      title: 'Total Products',
      value: metrics?.totalProducts ?? 0,
      badge: `${metrics?.publishedProducts ?? 0} Active`,
      badgePositive: true,
      subtitle: 'Live COD landing pages',
      icon: <Package className="w-5 h-5 text-[#FF6B00]" />,
    },
    {
      title: 'Total Orders',
      value: (metrics?.totalOrders ?? 0).toLocaleString(),
      badge: `${metrics?.confirmedOrders ?? 0} Confirmed`,
      badgePositive: true,
      subtitle: 'All-time received orders',
      icon: <ShoppingBag className="w-5 h-5 text-[#FF6B00]" />,
    },
    {
      title: 'Pending Orders',
      value: (metrics?.newOrders ?? 0).toLocaleString(),
      badge: (metrics?.newOrders ?? 0) > 0 ? 'Needs Call' : 'All Clear',
      badgePositive: (metrics?.newOrders ?? 0) === 0,
      subtitle: 'Awaiting phone confirmation',
      icon: <Clock className="w-5 h-5 text-[#FF6B00]" />,
    },
    {
      title: 'Total Revenue',
      value: `${(metrics?.totalRevenue ?? 0).toLocaleString()} ${currency}`,
      badge: `${(metrics?.deliveredRevenue ?? 0).toLocaleString()} ${currency} Delivered`,
      badgePositive: true,
      subtitle: 'Active & confirmed COD value',
      icon: <DollarSign className="w-5 h-5 text-[#FF6B00]" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" dir="ltr">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="p-6 rounded-3xl border border-neutral-200/70 bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">{stat.title}</span>
            <div className="w-10 h-10 rounded-full bg-[#FFF3EB] flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
          </div>

          <div className="text-3xl font-extrabold text-[#111111] tracking-tight my-3.5 tabular-nums">
            {stat.value}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                stat.badgePositive
                  ? 'bg-[#E8F8F0] text-[#129A56]'
                  : 'bg-[#FFF3EB] text-[#FF6B00]'
              }`}
            >
              {stat.badge}
            </span>
            <span className="text-neutral-400 font-medium truncate">{stat.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

