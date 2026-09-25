import React, { useState } from 'react';
import { Product } from '../../../convex/schema';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { AdminSidebar, AdminSection } from './AdminSidebar';
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
import { Button } from '../ui/button';
import { Plus, ExternalLink, ArrowRight, X, Package, ShoppingBag, BarChart3, TrendingUp } from 'lucide-react';

interface AdminLayoutProps {
  initialSection?: AdminSection;
  initialProductId?: string;
  initialIsNew?: boolean;
  onNavigateUrl?: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  initialSection = 'dashboard',
  initialProductId,
  initialIsNew = false,
  onNavigateUrl,
}) => {
  const [currentSection, setCurrentSection] = useState<AdminSection>(initialSection);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(initialIsNew);
  const [previewModalProduct, setPreviewModalProduct] = useState<Product | null>(null);

  const products = useQuery(api.products.list);
  const orders = useQuery(api.orders.list);
  const funnel = useQuery(api.analytics.getFunnelMetrics, { range: '7days' });

  // If initialProductId was passed
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

  const handleSavedProduct = (saved: Product) => {
    setEditingProduct(null);
    setIsCreatingNew(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/admin/products');
    }
  };

  // Section titles
  const getSectionTitle = () => {
    if (currentSection === 'products' && (isCreatingNew || editingProduct)) {
      return isCreatingNew ? 'إنشاء منتج جديد' : 'تعديل بيانات المنتج';
    }
    switch (currentSection) {
      case 'dashboard':
        return 'لوحة التحكم والتحليلات (Dashboard)';
      case 'analytics':
        return 'تحليلات مسار التحويل والحملات (Conversion Funnel & Analytics)';
      case 'products':
        return 'إدارة المنتجات وصفحات الهبوط (Products)';
      case 'templates':
        return 'قوالب صفحات الهبوط (Templates)';
      case 'orders':
        return 'إدارة طلبيات الدفع عند الاستلام (Orders)';
      case 'diagnostics':
        return 'تشخيص واختبار تتبع الإعلانات (Tracking Diagnostics)';
      case 'settings':
        return 'إعدادات المتجر والتتبع الإعلاني (Settings)';
      default:
        return 'لوحة التحكم';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar */}
      <AdminSidebar
        currentSection={currentSection}
        onNavigate={handleNavigateSection}
        onCreateProduct={() => handleCreateNewProduct()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader
          title={getSectionTitle()}
          subtitle="COD Landing Builder — نظام بناء صفحات الهبوط متعددة المنتجات مع التتبع والتحليلات الفورية"
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard View */}
          {currentSection === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <DashboardStats />

              {/* Quick Funnel Banner */}
              {funnel && (
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-right">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>مسار التحويل خلال 7 أيام</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200">
                      {funnel.visitors} زائر ➔ {funnel.ctaClicks} نقرة CTA ➔ {funnel.totalOrders} طلب مسجل ({funnel.orderConversionRate}% تحويل)
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigateSection('analytics')}
                    className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>عرض تقرير التحليلات الكامل ←</span>
                  </button>
                </div>
              )}

              {/* Quick Split: Recent Products & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Products Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => handleNavigateSection('products')}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      عرض جميع المنتجات ←
                    </button>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>المنتجات النشطة</span>
                      <Package className="w-4 h-4 text-amber-500" />
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {(products || []).slice(0, 3).map((prod) => (
                      <div
                        key={prod._id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProduct(prod)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
                          >
                            تعديل
                          </button>
                          <a
                            href={`/p/${prod.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-amber-600 hover:bg-amber-50"
                            title="فتح صفحة الهبوط"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                              {prod.name}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {prod.price} {prod.currency || 'DH'} · {prod.templateId}
                            </div>
                          </div>
                          <img
                            src={prod.images[0] || ''}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Orders Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => handleNavigateSection('orders')}
                      className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      عرض جميع الطلبيات ←
                    </button>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>آخر الطلبيات المسجلة</span>
                      <ShoppingBag className="w-4 h-4 text-blue-500" />
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {(orders || []).slice(0, 4).map((ord) => (
                      <div
                        key={ord._id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-right"
                      >
                        <div className="text-left">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {ord.total} {ord.currency || 'DH'}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {ord.orderNumber}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {ord.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {ord.city} · {ord.productName.substring(0, 25)}...
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full Real Analytics & Funnel View */}
          {currentSection === 'analytics' && <AnalyticsDashboard />}

          {/* Products View */}
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

          {/* Templates View */}
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

          {/* Orders View */}
          {currentSection === 'orders' && <OrderTable />}

          {/* Tracking Diagnostics View */}
          {currentSection === 'diagnostics' && <TrackingDiagnostics />}

          {/* Settings View */}
          {currentSection === 'settings' && (
            <SettingsPage onOpenDiagnostics={() => handleNavigateSection('diagnostics')} />
          )}
        </main>
      </div>

      {/* Fullscreen Live Preview Modal */}
      {previewModalProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewModalProduct(null)}
        >
          <div
            className="w-full max-w-5xl h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 bg-slate-950 px-4 flex items-center justify-between border-b border-slate-800 text-xs text-white">
              <span className="font-bold flex items-center gap-2">
                <span>معاينة صفحة المنتج:</span>
                <span className="text-amber-400">{previewModalProduct.name}</span>
              </span>
              <button
                onClick={() => setPreviewModalProduct(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
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
