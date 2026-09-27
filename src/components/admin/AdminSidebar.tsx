import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Layers,
  ShoppingBag,
  Settings,
  ExternalLink,
  Store,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { MimouzzaLogo } from '../ui/MimouzzaLogo';

export type AdminSection =
  | 'dashboard'
  | 'analytics'
  | 'products'
  | 'templates'
  | 'orders'
  | 'diagnostics'
  | 'settings';

interface AdminSidebarProps {
  currentSection: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onCreateProduct: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentSection,
  onNavigate,
  onCreateProduct,
}) => {
  const metrics = useQuery(api.orders.getMetrics);
  const settings = useQuery(api.settings.get);
  const products = useQuery(api.products.listPublished);

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      arabicLabel: 'لوحة القيادة',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'analytics' as const,
      label: 'Analytics & Funnel',
      arabicLabel: 'التحليلات ومسار التحويل',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: 'PRO',
    },
    {
      id: 'products' as const,
      label: 'Products',
      arabicLabel: 'المنتجات',
      icon: <Package className="w-4 h-4" />,
      badge: metrics?.totalProducts,
    },
    {
      id: 'templates' as const,
      label: 'Templates',
      arabicLabel: 'القوالب',
      icon: <Layers className="w-4 h-4" />,
      badge: 3,
    },
    {
      id: 'orders' as const,
      label: 'Orders',
      arabicLabel: 'الطلبيات (COD)',
      icon: <ShoppingBag className="w-4 h-4" />,
      highlightBadge: metrics?.newOrders && metrics.newOrders > 0 ? metrics.newOrders : undefined,
    },
    {
      id: 'diagnostics' as const,
      label: 'Tracking Diagnostics',
      arabicLabel: 'فحص التتبع والبكسل',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      arabicLabel: 'الإعدادات والتتبع',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const firstPublishedSlug = products && products.length > 0 ? products[0].slug : null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none">
      {/* Brand Zone */}
      <div className="px-5 py-4 bg-[#C80C32] border-b border-[#a60828] flex items-center justify-center">
        <MimouzzaLogo height={34} />
      </div>

      {/* Quick Action Button */}
      <div className="p-4 pb-2">
        <button
          onClick={onCreateProduct}
          className="w-full py-2.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ منتج جديد / Create Product</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.highlightBadge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {item.highlightBadge} جديد
                </span>
              )}

              {item.badge !== undefined && item.highlightBadge === undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    item.badge === 'PRO'
                      ? 'bg-amber-400/20 text-amber-300 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Live Store Preview Link */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">
          صفحات الهبوط المباشرة
        </div>
        {firstPublishedSlug ? (
          <a
            href={`/p/${firstPublishedSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate font-mono text-[11px]">/p/{firstPublishedSlug}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </a>
        ) : (
          <div className="text-[11px] text-slate-500 px-1">لا يوجد منتج منشور حالياً</div>
        )}
      </div>
    </aside>
  );
};
