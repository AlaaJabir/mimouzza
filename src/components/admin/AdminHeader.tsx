import React, { useState } from 'react';
import {
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
  LogOut,
  Globe,
} from 'lucide-react';
import { useMutation, useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { AdminSection } from './AdminSidebar';
import { MimouzzaLogo } from '../ui/MimouzzaLogo';
import { useAdminAuth } from '../../lib/auth';
import { navigate } from '../../lib/router';

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
  const { adminSession, logout } = useAdminAuth();
  const [confirmingClear, setConfirmingClear] = useState(false);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

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
      className="w-full bg-[#C80C32] text-white px-4 sm:px-8 py-3 shrink-0 border-b border-[#a60828] shadow-sm"
      dir="ltr"
    >
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Seamless Brand Logo on #C80C32 Bar */}
        <div
          onClick={() => onNavigate?.('dashboard')}
          className="flex items-center cursor-pointer py-0.5 transition-opacity hover:opacity-95"
        >
          <MimouzzaLogo height={38} />
        </div>

        {/* Center Horizontal Pill Navigation */}
        <nav className="order-3 xl:order-2 w-full xl:w-auto flex items-center justify-start xl:justify-center overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          <div className="bg-black/15 p-1.5 rounded-full border border-white/15 inline-flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#C80C32] shadow-xs'
                      : 'text-white/90 hover:text-white hover:bg-white/15'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isActive
                          ? 'bg-[#C80C32] text-white'
                          : 'bg-white/25 text-white'
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
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
            >
              <span>Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-white" />
            </a>
          )}

          {onCreateProduct && (
            <button
              onClick={onCreateProduct}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-neutral-100 text-[#C80C32] text-xs font-extrabold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Product</span>
            </button>
          )}

          {confirmingClear ? (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-white/40">
              <button
                onClick={handleClearAnalytics}
                className="px-3 py-1 rounded-full bg-[#C80C32] hover:bg-[#a60828] text-white text-[11px] font-bold cursor-pointer"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmingClear(false)}
                className="px-2.5 py-1 rounded-full text-neutral-700 text-[11px] font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingClear(true)}
              title="Reset Analytics & Demo Records"
              className="w-9 h-9 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onNavigate?.('orders')}
            title="New Orders"
            className="relative w-9 h-9 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {(metrics?.newOrders || 0) > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-300 ring-2 ring-[#C80C32]" />
            )}
          </button>

          {/* Frontpage Showcase Link */}
          <button
            type="button"
            onClick={() => navigate('/')}
            title="View Platform Frontpage"
            className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-white" />
            <span>Frontpage</span>
          </button>

          {/* User Profile Pill & Sign Out */}
          <div className="hidden sm:flex items-center gap-2 bg-black/15 pl-1.5 pr-2 py-1 rounded-full border border-white/20">
            <div className="w-7 h-7 rounded-full bg-white text-[#C80C32] flex items-center justify-center text-xs font-extrabold">
              A
            </div>
            <div className="text-left leading-tight pr-1">
              <div className="text-[11px] font-bold text-white truncate max-w-[145px]">
                {adminSession?.email || 'professionnal.a@gmail.com'}
              </div>
              <div className="text-[10px] font-medium text-white/75">Administrator</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out"
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white text-white hover:text-[#C80C32] flex items-center justify-center transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

