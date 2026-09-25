import React, { useState } from 'react';
import { Product } from '../../../convex/schema';
import { useQuery } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { DashboardStats } from './DashboardStats';
import { ProductTable } from './ProductTable';
import { ProductEditor } from './ProductEditor';
import { OrderTable } from './OrderTable';
import { TemplatesPage } from './TemplatesPage';
import { SettingsPage } from './SettingsPage';
import { LivePreview } from './LivePreview';
import { Button } from '../ui/button';
import { Plus, ExternalLink, ArrowRight, X, Package, ShoppingBag } from 'lucide-react';

interface AdminLayoutProps {
  initialSection?: 'dashboard' | 'products' | 'templates' | 'orders' | 'settings';
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
  const [currentSection, setCurrentSection] = useState<'dashboard' | 'products' | 'templates' | 'orders' | 'settings'>(
    initialSection
  );

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(initialIsNew);
  const [previewModalProduct, setPreviewModalProduct] = useState<Product | null>(null);

  const products = useQuery(api.products.list);
  const orders = useQuery(api.orders.list);

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

  const handleCreateNewProduct = (templateId?: 'classic-cod' | 'premium' | 'big-offer') => {
    setEditingProduct(null);
    setIsCreatingNew(true);
    setCurrentSection('products');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsCreatingNew(false);
    setCurrentSection('products');
  };

  const handleCloseEditor = () => {
    setEditingProduct(null);
    setIsCreatingNew(false);
  };

  const handleSavedProduct = (saved: Product) => {
    setEditingProduct(null);
    setIsCreatingNew(false);
  };

  // Section titles
  const getSectionTitle = () => {
    if (currentSection === 'products' && (isCreatingNew || editingProduct)) {
      return isCreatingNew ? 'إنشاء منتج جديد' : 'تعديل بيانات المنتج';
    }
    switch (currentSection) {
      case 'dashboard':
        return 'لوحة التحكم والتحليلات (Dashboard)';
      case 'products':
        return 'إدارة المنتجات وصفحات الهبوط (Products)';
      case 'templates':
        return 'قوالب صفحات الهبوط (Templates)';
      case 'orders':
        return 'إدارة طلبيات الدفع عند الاستلام (Orders)';
      case 'settings':
        return 'إعدادات المتجر (Settings)';
      default:
        return 'لوحة التحكم';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar */}
      <AdminSidebar
        currentSection={currentSection}
        onNavigate={(sec) => {
          handleCloseEditor();
          setCurrentSection(sec);
        }}
        onCreateProduct={() => handleCreateNewProduct()}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader
          title={getSectionTitle()}
          subtitle="COD Landing Builder — نظام بناء صفحات الهبوط متعددة المنتجات مع التحديث الفوري"
        />

        <main className="flex-1 overflow-y-auto p-6">
          {/* Dashboard View */}
          {currentSection === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <DashboardStats />

              {/* Quick Split: Recent Products & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Products Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <button
                      onClick={() => setCurrentSection('products')}
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
                      onClick={() => setCurrentSection('orders')}
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

          {/* Settings View */}
          {currentSection === 'settings' && <SettingsPage />}
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
