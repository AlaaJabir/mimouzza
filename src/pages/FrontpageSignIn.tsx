import React, { useState, useRef } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Layers,
  ShoppingBag,
  BarChart3,
  Zap,
  ShieldCheck,
  Smartphone,
  FileSpreadsheet,
  Globe,
  ExternalLink,
  AlertCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { MimouzzaLogo } from '../components/ui/MimouzzaLogo';
import { useAdminAuth } from '../lib/auth';
import { useQuery } from '../lib/convex-client';
import { api } from '../../convex/api';

interface FrontpageSignInProps {
  onSuccessLogin: () => void;
  onOpenProduct?: (slug: string) => void;
}

export const FrontpageSignIn: React.FC<FrontpageSignInProps> = ({
  onSuccessLogin,
}) => {
  const { isAuthenticated, adminSession, login, logout } = useAdminAuth();
  const publishedProducts = useQuery(api.products.listPublished);
  const settings = useQuery(api.settings.get);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'pages' | 'orders' | 'pixels'>('pages');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const signInCardRef = useRef<HTMLDivElement>(null);

  const currency = settings?.defaultCurrency || 'DH';

  const scrollToSignIn = () => {
    signInCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 450);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const result = login(email, password);
      setIsSubmitting(false);
      if (result.success) {
        onSuccessLogin();
      } else {
        setErrorMessage(
          result.error || 'Invalid administrator email or password.'
        );
      }
    }, 220);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F5] text-[#180B0E] flex flex-col selection:bg-[#C80C32]/15 selection:text-[#C80C32]" dir="ltr">
      {/* ==================== SEAMLESS #C80C32 BRAND HEADER BAR ==================== */}
      <header className="w-full bg-[#C80C32] text-white sticky top-0 z-50 border-b border-[#a60828] shadow-sm">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo seamlessly integrated on #C80C32 */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center py-1 transition-opacity hover:opacity-95"
          >
            <MimouzzaLogo height={38} />
          </a>

          {/* Clean Editorial Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-white/90">
            <button
              type="button"
              onClick={() => scrollToSection('overview')}
              className="hover:text-white transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[#FF9A3C]"
            >
              Platform Overview
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('capabilities')}
              className="hover:text-white transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[#FF9A3C]"
            >
              What We Offer
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('templates')}
              className="hover:text-white transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[#FF9A3C]"
            >
              COD Templates
            </button>
            {publishedProducts && publishedProducts.length > 0 && (
              <button
                type="button"
                onClick={() => scrollToSection('storefront')}
                className="hover:text-white transition-colors cursor-pointer py-1 border-b-2 border-transparent hover:border-[#FF9A3C]"
              >
                Live Products ({publishedProducts.length})
              </button>
            )}
          </nav>

          {/* Right Header Action */}
          <div className="flex items-center gap-3">
            <a
              href="/ai-agent"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', '/ai-agent');
                window.dispatchEvent(new Event('app_navigation'));
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-extrabold shadow-xs transition-all cursor-pointer"
            >
              <span>AYA AI Agent (Demo)</span>
            </a>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onSuccessLogin}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#C80C32] text-xs font-extrabold shadow-xs hover:bg-[#FFF5F2] transition-all cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={scrollToSignIn}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#C80C32] text-xs font-extrabold shadow-xs hover:bg-[#FFF5F2] transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ==================== HERO & EXECUTIVE SIGN-IN SPLIT SECTION ==================== */}
      <section
        id="overview"
        className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#EEDCDD]"
      >
        {/* Subtle Warm Lotus Radial Glow in Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, #FF9A3C 0%, #F82553 55%, #C80C32 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-20 right-0 w-[480px] h-[480px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, #C80C32 0%, #E00B4B 60%, transparent 100%)',
          }}
        />

        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* LEFT 7 COLUMNS: PLATFORM PRESENTATION & INTERACTIVE SHOWCASE */}
            <div className="lg:col-span-7 space-y-8 pt-2">
              {/* Quiet Editorial Kicker */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-[#C80C32] tracking-wide">
                <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-[#FF9A3C] to-[#C80C32]" />
                <span>VITALIVE Commerce Platform</span>
                <span aria-hidden="true" className="text-[#C80C32]/40">·</span>
                <span className="text-[#6E4850] font-medium">
                  Cash-on-Delivery Landing Pages & Order Operations
                </span>
              </div>

              {/* Expressive Editorial Headline */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#180B0E] leading-[1.12] max-w-2xl">
                  Turn Every Product Into a{' '}
                  <span className="bg-gradient-to-r from-[#C80C32] via-[#E00B4B] to-[#FF662E] bg-clip-text text-transparent">
                    High-Converting COD Funnel.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-[#573A41] leading-relaxed max-w-2xl font-normal">
                  VITALIVE is the all-in-one e-commerce platform crafted for modern Cash-on-Delivery brands. Launch persuasive Arabic RTL product pages in seconds, capture 1-step mobile orders with smart bundle pricing, and synchronize your entire fulfillment workflow in real time.
                </p>
              </div>

              {/* Interactive Platform Architecture Switcher */}
              <div className="bg-white rounded-3xl border border-[#EAD4D7] shadow-sm overflow-hidden">
                {/* Interactive Segmented Control */}
                <div className="p-2 bg-[#FBF2F1] border-b border-[#EAD4D7] flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveShowcaseTab('pages')}
                    className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeShowcaseTab === 'pages'
                        ? 'bg-[#C80C32] text-white shadow-xs'
                        : 'text-[#633E46] hover:text-[#180B0E] hover:bg-white/60'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>01. COD Landing Builder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveShowcaseTab('orders')}
                    className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeShowcaseTab === 'orders'
                        ? 'bg-[#C80C32] text-white shadow-xs'
                        : 'text-[#633E46] hover:text-[#180B0E] hover:bg-white/60'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>02. Live Order Pipeline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveShowcaseTab('pixels')}
                    className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeShowcaseTab === 'pixels'
                        ? 'bg-[#C80C32] text-white shadow-xs'
                        : 'text-[#633E46] hover:text-[#180B0E] hover:bg-white/60'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>03. Multi-Pixel Attribution</span>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 sm:p-7">
                  {activeShowcaseTab === 'pages' && (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F3E5E7]">
                        <div>
                          <h3 className="text-base font-extrabold text-[#180B0E]">
                            Conversion-Engineered Arabic RTL Landing Pages
                          </h3>
                          <p className="text-xs text-[#6E4850] mt-0.5">
                            Built specifically for Moroccan & MENA mobile shoppers with zero checkout friction.
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-[#C80C32]">
                          3 Ready-to-Launch Templates
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#C80C32]">
                            Direct 1-Step COD Form
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Customers order directly on the product page with full name, phone number, and city selection.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#E00B4B]">
                            Quantity Bundle Offers
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Boost average order value with 1x, 2x, and 3x tiered bundle pricing and automatic savings badges.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#FF662E]">
                            Urgency & Social Proof
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Integrated countdown timers, live order tickers, customer photo reviews, and trust guarantees.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === 'orders' && (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F3E5E7]">
                        <div>
                          <h3 className="text-base font-extrabold text-[#180B0E]">
                            Instant Mobile-to-Dashboard Cloud Order Sync
                          </h3>
                          <p className="text-xs text-[#6E4850] mt-0.5">
                            Every order placed from any phone appears immediately in your centralized command table.
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-[#C80C32]">
                          Real-Time Convex Cloud DB
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#C80C32]">
                            5-Stage Fulfillment Status
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Track every order through New, Confirmed, Shipped, Delivered, or Canceled with 1-click updates.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#E00B4B]">
                            1-Click Excel (.xlsx) Export
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Export filtered orders with customer phone, city, address, bundle, and total for delivery couriers.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#FF662E]">
                            Call-Center Ready
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Instant search by order number, customer phone, or Moroccan city with real-time revenue calculation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeShowcaseTab === 'pixels' && (
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F3E5E7]">
                        <div>
                          <h3 className="text-base font-extrabold text-[#180B0E]">
                            Native Ad Pixel Firing & UTM Campaign Attribution
                          </h3>
                          <p className="text-xs text-[#6E4850] mt-0.5">
                            Optimize your ad spend with accurate conversion events and source-level ROI tracking.
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-[#C80C32]">
                          Meta · TikTok · GA4
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#C80C32]">
                            Full-Funnel Pixel Events
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Automatically fires PageView, ViewContent, InitiateCheckout, and Purchase with dynamic order value.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#E00B4B]">
                            UTM Source & Campaign Tracking
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Captures utm_source, utm_medium, and utm_campaign on every visit and links them to completed orders.
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#FAF6F5] border border-[#EFE0E2] space-y-1.5">
                          <div className="text-xs font-extrabold text-[#FF662E]">
                            Live Pixel Diagnostics
                          </div>
                          <p className="text-xs text-[#573A41] leading-relaxed">
                            Built-in diagnostic inspector to test and verify pixel events before launching paid ad campaigns.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clean Unboxed Editorial Metrics Strip */}
              <div className="pt-2 flex flex-wrap items-center gap-y-3 gap-x-6 text-xs text-[#573A41]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#C80C32]" />
                  <span>
                    <strong className="font-extrabold text-[#180B0E]">100% Arabic RTL</strong> Customer Storefronts
                  </span>
                </div>
                <span aria-hidden="true" className="text-[#D5B8BD]">·</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#E00B4B]" />
                  <span>
                    <strong className="font-extrabold text-[#180B0E]">English</strong> Executive Admin Dashboard
                  </span>
                </div>
                <span aria-hidden="true" className="text-[#D5B8BD]">·</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF662E]" />
                  <span>
                    <strong className="font-extrabold text-[#180B0E]">Instant</strong> Mobile Order Synchronization
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLUMNS: EXECUTIVE ADMIN SIGN-IN PORTAL */}
            <div
              id="signin-portal"
              ref={signInCardRef}
              className="lg:col-span-5 w-full"
            >
              <div className="bg-white rounded-3xl border border-[#E6C8CC] shadow-xl overflow-hidden">
                {/* Seamless #C80C32 Brand Top Banner Inside Login Card */}
                <div className="bg-[#C80C32] px-7 py-6 text-white relative overflow-hidden border-b border-[#a60828]">
                  {/* Subtle Lotus Accent Glow */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -bottom-10 w-36 h-36 rounded-full opacity-35 blur-2xl"
                    style={{
                      background: 'linear-gradient(135deg, #FF9A3C 0%, #F82553 100%)',
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                    <MimouzzaLogo height={40} />
                    <div className="pt-1">
                      <h2 className="text-base font-extrabold tracking-tight text-white">
                        Executive Administrator Sign In
                      </h2>
                      <p className="text-xs text-white/80 mt-0.5">
                        Sign in to manage products, landing pages, pixels, and COD orders
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lotus Gradient Hairline Accent */}
                <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9A3C] via-[#F82553] to-[#C80C32]" />

                {/* Card Body */}
                <div className="p-7 sm:p-8 space-y-6">
                  {isAuthenticated && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F2] border border-[#F8C6B8] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-extrabold text-[#C80C32]">
                          <CheckCircle2 className="w-4 h-4 text-[#C80C32]" />
                          <span>Active Admin Session</span>
                        </div>
                        <button
                          type="button"
                          onClick={logout}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6E4850] hover:text-[#C80C32] transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                      <p className="text-xs text-[#573A41]">
                        Signed in as{' '}
                        <strong className="font-mono font-bold text-[#180B0E]">
                          {adminSession?.email}
                        </strong>
                      </p>
                      <button
                        type="button"
                        onClick={onSuccessLogin}
                        className="w-full py-3 px-5 rounded-2xl bg-[#C80C32] hover:bg-[#a60828] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <span>Continue to Admin Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    {errorMessage && (
                      <div className="p-3.5 rounded-2xl bg-[#FFF0F2] border border-[#F5B7C2] flex items-start gap-2.5 text-xs text-[#B40829] font-semibold">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#C80C32]" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="admin-email"
                        className="block text-xs font-extrabold text-[#180B0E]"
                      >
                        Administrator Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#8C626B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          ref={emailInputRef}
                          id="admin-email"
                          type="email"
                          required
                          autoComplete="username"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          placeholder="professionnal.a@gmail.com"
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAF6F5] border border-[#E4CCD0] text-sm font-medium text-[#180B0E] placeholder:text-[#A6848B] focus:outline-none focus:bg-white focus:border-[#C80C32] focus:ring-3 focus:ring-[#C80C32]/15 transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="admin-password"
                          className="block text-xs font-extrabold text-[#180B0E]"
                        >
                          Password
                        </label>
                        <span className="text-[11px] font-semibold text-[#C80C32]">
                          Encrypted Session
                        </span>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#8C626B] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="admin-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          placeholder="••••••••••••"
                          className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-[#FAF6F5] border border-[#E4CCD0] text-sm font-medium text-[#180B0E] placeholder:text-[#A6848B] focus:outline-none focus:bg-white focus:border-[#C80C32] focus:ring-3 focus:ring-[#C80C32]/15 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#8C626B] hover:text-[#C80C32] transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Remember Session */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-[#D8B8BE] text-[#C80C32] focus:ring-[#C80C32]"
                        />
                        <span className="text-xs font-medium text-[#573A41]">
                          Keep me signed in on this browser
                        </span>
                      </label>
                    </div>

                    {/* Submit Button with Logo Colors */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 px-6 rounded-2xl text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                      style={{
                        background:
                          'linear-gradient(135deg, #C80C32 0%, #E00B4B 55%, #FF662E 100%)',
                      }}
                    >
                      <span>
                        {isSubmitting
                          ? 'Verifying Credentials...'
                          : 'Sign In to Admin Workspace'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Security Footer Note */}
                  <div className="pt-4 border-t border-[#F2E2E5] flex items-center justify-between text-[11px] text-[#7A545D]">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#C80C32]" />
                      <span>Authorized Admin Access Only</span>
                    </div>
                    <span className="font-mono">TLS · Convex Cloud</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 2: WHAT VITALIVE OFFERS (CORE CAPABILITIES) ==================== */}
      <section
        id="capabilities"
        className="py-16 lg:py-24 bg-white border-b border-[#EEDCDD]"
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-extrabold text-[#C80C32] tracking-wide">
                Platform Architecture & Capabilities
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#180B0E]">
                Everything Required to Scale Cash-on-Delivery E-Commerce.
              </h2>
            </div>
            <p className="text-sm text-[#573A41] max-w-md leading-relaxed">
              Built from the ground up to replace fragmented spreadsheets, slow store themes, and broken tracking scripts with a single cohesive system.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-7 rounded-3xl bg-[#FAF6F5] border border-[#EAD4D7] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#C80C32] text-white flex items-center justify-center shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-[#180B0E]">
                  01. Mobile-First Arabic COD Pages
                </h3>
                <p className="text-xs text-[#573A41] leading-relaxed">
                  Every product gets its own dedicated Arabic RTL landing page (`/p/slug`) with sticky mobile order buttons, city selector, and instant validation.
                </p>
              </div>
              <div className="pt-4 border-t border-[#EAD4D7] text-[11px] font-bold text-[#C80C32]">
                Sub-second page load · Zero cart abandonment
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-7 rounded-3xl bg-[#FAF6F5] border border-[#EAD4D7] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div
                  className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-xs"
                  style={{
                    background: 'linear-gradient(135deg, #E00B4B 0%, #FF662E 100%)',
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-[#180B0E]">
                  02. Tiered Bundle Offers & AOV Boosters
                </h3>
                <p className="text-xs text-[#573A41] leading-relaxed">
                  Configure 1-piece, 2-piece, and 3-piece bundle pricing per product so customers naturally upgrade their order quantity before submitting.
                </p>
              </div>
              <div className="pt-4 border-t border-[#EAD4D7] text-[11px] font-bold text-[#E00B4B]">
                Dynamic bundle pricing · Free delivery badges
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-7 rounded-3xl bg-[#FAF6F5] border border-[#EAD4D7] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div
                  className="w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-xs"
                  style={{
                    background: 'linear-gradient(135deg, #FF662E 0%, #FF9A3C 100%)',
                  }}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold text-[#180B0E]">
                  03. Order Operations & Excel Export
                </h3>
                <p className="text-xs text-[#573A41] leading-relaxed">
                  Manage incoming COD orders in real time, update confirmation and delivery statuses, and export clean `.xlsx` sheets for shipping partners.
                </p>
              </div>
              <div className="pt-4 border-t border-[#EAD4D7] text-[11px] font-bold text-[#D9531E]">
                Real-time Convex sync · 1-Click .xlsx reports
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="p-7 rounded-3xl bg-[#FAF6F5] border border-[#EAD4D7] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-[#180B0E] text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-5 h-5 text-[#FF9A3C]" />
                </div>
                <h3 className="text-lg font-extrabold text-[#180B0E]">
                  04. Multi-Pixel & Funnel Analytics
                </h3>
                <p className="text-xs text-[#573A41] leading-relaxed">
                  Connect Meta Pixel, TikTok Pixel, and Google Analytics 4 once. Track conversion rates, revenue by product, and UTM campaign attribution automatically.
                </p>
              </div>
              <div className="pt-4 border-t border-[#EAD4D7] text-[11px] font-bold text-[#180B0E]">
                Meta · TikTok · Google Analytics 4
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 3: CONVERSION TEMPLATES SHOWCASE ==================== */}
      <section
        id="templates"
        className="py-16 lg:py-24 bg-[#FAF6F5] border-b border-[#EEDCDD]"
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="text-xs font-extrabold text-[#C80C32] tracking-wide">
                Multi-Template Conversion Engine
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#180B0E]">
                Three Specialized Landing Page Templates Included.
              </h2>
            </div>
            <button
              type="button"
              onClick={scrollToSignIn}
              className="inline-flex items-center gap-2 text-xs font-extrabold text-[#C80C32] hover:text-[#a60828] cursor-pointer"
            >
              <span>Sign in to customize templates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {/* Template 1 */}
            <div className="bg-white rounded-3xl border border-[#EAD4D7] overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div className="h-3 bg-[#C80C32]" />
                <div className="p-7 space-y-4">
                  <div className="text-xs font-bold text-[#C80C32]">
                    Template 01 · High-Velocity Standard
                  </div>
                  <h3 className="text-xl font-extrabold text-[#180B0E]">
                    Classic COD Funnel
                  </h3>
                  <p className="text-xs text-[#573A41] leading-relaxed">
                    Clean, high-trust layout pairing interactive product image galleries directly with the 1-step Cash-on-Delivery order form, benefits grid, and verified customer reviews.
                  </p>
                </div>
              </div>
              <div className="px-7 py-4 bg-[#FAF6F5] border-t border-[#F2E2E5] flex items-center justify-between text-xs font-bold text-[#573A41]">
                <span>Best for Everyday Winners</span>
                <span className="text-[#C80C32]">Arabic RTL</span>
              </div>
            </div>

            {/* Template 2 */}
            <div className="bg-white rounded-3xl border border-[#EAD4D7] overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div
                  className="h-3"
                  style={{
                    background: 'linear-gradient(90deg, #C80C32 0%, #E00B4B 100%)',
                  }}
                />
                <div className="p-7 space-y-4">
                  <div className="text-xs font-bold text-[#E00B4B]">
                    Template 02 · Luxury & Cosmetics
                  </div>
                  <h3 className="text-xl font-extrabold text-[#180B0E]">
                    Premium Brand Showcase
                  </h3>
                  <p className="text-xs text-[#573A41] leading-relaxed">
                    Refined dark-and-crimson editorial aesthetics engineered for high-ticket watches, fragrances, skincare, and electronics that demand elevated brand perception.
                  </p>
                </div>
              </div>
              <div className="px-7 py-4 bg-[#FAF6F5] border-t border-[#F2E2E5] flex items-center justify-between text-xs font-bold text-[#573A41]">
                <span>Best for High-Ticket Products</span>
                <span className="text-[#E00B4B]">Arabic RTL</span>
              </div>
            </div>

            {/* Template 3 */}
            <div className="bg-white rounded-3xl border border-[#EAD4D7] overflow-hidden flex flex-col justify-between shadow-xs">
              <div>
                <div
                  className="h-3"
                  style={{
                    background: 'linear-gradient(90deg, #FF662E 0%, #FF9A3C 100%)',
                  }}
                />
                <div className="p-7 space-y-4">
                  <div className="text-xs font-bold text-[#D9531E]">
                    Template 03 · Promotional Flash Sale
                  </div>
                  <h3 className="text-xl font-extrabold text-[#180B0E]">
                    Big Offer Bundle Engine
                  </h3>
                  <p className="text-xs text-[#573A41] leading-relaxed">
                    Urgency-driven promotional layout highlighting percentage discounts, countdown timers, and multi-pack savings to maximize conversion rate on cold social traffic.
                  </p>
                </div>
              </div>
              <div className="px-7 py-4 bg-[#FAF6F5] border-t border-[#F2E2E5] flex items-center justify-between text-xs font-bold text-[#573A41]">
                <span>Best for Promotional Bundles</span>
                <span className="text-[#D9531E]">Arabic RTL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SECTION 4: LIVE PUBLISHED STOREFRONT PRODUCTS (IF ANY) ==================== */}
      {publishedProducts && publishedProducts.length > 0 && (
        <section
          id="storefront"
          className="py-16 lg:py-20 bg-white border-b border-[#EEDCDD]"
        >
          <div className="max-w-[1380px] mx-auto px-4 sm:px-8 space-y-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-[#C80C32] tracking-wide flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Live Storefront Catalog</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#180B0E]">
                  Active Public Landing Pages
                </h2>
              </div>
              <p className="text-xs text-[#6E4850]">
                Click any active product below to preview its live customer-facing COD landing page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedProducts.slice(0, 6).map((prod) => (
                <a
                  key={prod._id}
                  href={`/p/${prod.slug}`}
                  className="group bg-[#FAF6F5] rounded-3xl border border-[#EAD4D7] overflow-hidden hover:border-[#C80C32] transition-all flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="aspect-16/10 w-full bg-neutral-100 overflow-hidden relative">
                      {prod.images && prod.images[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-5 space-y-2" dir="rtl">
                      <h3 className="text-base font-extrabold text-[#180B0E] line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-[#6E4850] line-clamp-2">
                        {prod.shortDescription || prod.offerText || prod.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-3.5 bg-white border-t border-[#EAD4D7] flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold text-[#C80C32]">
                      {prod.price} {prod.currency || currency}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#180B0E] group-hover:text-[#C80C32] transition-colors">
                      <span>Open Landing Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== SEAMLESS #C80C32 BRAND FOOTER BAR ==================== */}
      <footer className="mt-auto w-full bg-[#C80C32] text-white border-t border-[#a60828]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <MimouzzaLogo height={34} />
            <span aria-hidden="true" className="hidden sm:inline text-white/30">|</span>
            <p className="text-xs text-white/85 font-medium text-center sm:text-left">
              High-Converting COD E-Commerce & Landing Page Platform
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-bold text-white/90">
            <button
              type="button"
              onClick={scrollToSignIn}
              className="hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Admin Sign In
            </button>
            <span>·</span>
            <span>© {new Date().getFullYear()} VITALIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
