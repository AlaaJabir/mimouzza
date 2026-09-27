import React, { useState } from 'react';
import {
  Store,
  RotateCcw,
  ExternalLink,
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Layers,
  Activity,
  Settings,
  Plus,
  Bell,
} from 'lucide-react';
import { useMutation, useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { AdminSection } from './AdminSidebar';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  currentSection?: AdminSection;
  onNavigate?: (section: AdminSection) => void;
  onCreateProduct?: () => void;
  onOpenStore?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentSection = 'dashboard',
  onNavigate,
  onCreateProduct,
}) => {
  const resetSeed = useMutation(api.settings.resetSeed);
  const products = useQuery(api.products.listPublished);
  const metrics = useQuery(api.orders.getMetrics);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleClearAnalytics = async () => {
    await resetSeed({});
    setConfirmingClear(false);
    window.location.reload();
  };

  const sampleSlug = products && products.length > 0 ? products[0].slug : '';

  const navItems: {
    id: AdminSection;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
    },
    {
      id: 'products',
      label: 'Products',
      icon: <Package className="w-3.5 h-3.5" />,
      badge: metrics?.totalProducts || 0,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <ShoppingCart className="w-3.5 h-3.5" />,
      badge: metrics?.newOrders || 0,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-3.5 h-3.5" />,
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'diagnostics',
      label: 'Tracking',
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header
      className="w-full bg-[#F8F8F6] px-4 sm:px-8 pt-4 pb-2 shrink-0 border-b border-neutral-200/60"
      dir="ltr"
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate?.('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B00] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Store className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-[#111111] block leading-none">
              Nestora<span className="text-[#FF6B00]">COD</span>
            </span>
            <span className="text-[10px] font-semibold text-neutral-400 tracking-wider uppercase">
              Commerce Suite
            </span>
          </div>
        </div>

        {/* Center Horizontal Pill Navigation */}
        <nav className="order-3 xl:order-2 w-full xl:w-auto flex items-center justify-start xl:justify-center overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          <div className="bg-white p-1.5 rounded-full border border-neutral-200/80 shadow-2xs inline-flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-neutral-600 hover:text-[#111111] hover:bg-neutral-100/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-[#FF6B00] text-white'
                          : item.id === 'orders'
                          ? 'bg-[#FF6B00]/15 text-[#FF6B00]'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right Actions & Profile Pill */}
        <div className="order-2 xl:order-3 flex items-center gap-2.5">
          {sampleSlug && (
            <a
              href={`/p/${sampleSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-50 text-xs font-semibold text-[#111111] transition-colors shadow-2xs"
            >
              <span>Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#FF6B00]" />
            </a>
          )}

          {onCreateProduct && (
            <button
              onClick={onCreateProduct}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF6B00] hover:bg-[#e66000] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Product</span>
            </button>
          )}

          {confirmingClear ? (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-rose-200">
              <button
                onClick={handleClearAnalytics}
                className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                className="px-2.5 py-1 rounded-full text-neutral-600 text-[11px] font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingClear(true)}
              title="Reset Analytics & Demo Records"
              className="w-9 h-9 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-[#111111] transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onNavigate?.('orders')}
            title="New Orders"
            className="relative w-9 h-9 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 hover:text-[#111111] transition-colors cursor-pointer shadow-2xs"
          >
            <Bell className="w-4 h-4" />
            {(metrics?.newOrders || 0) > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF6B00]" />
            )}
          </button>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2.5 bg-white pl-1.5 pr-3.5 py-1 rounded-full border border-neutral-200/90 shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center text-xs font-bold">
              A
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-[#111111]">Store Admin</div>
              <div className="text-[10px] font-medium text-neutral-400">Manager</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

