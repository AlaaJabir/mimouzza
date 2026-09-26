import React, { useState } from 'react';
import { Product, ProductStatus } from '../../../convex/schema';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { getProductStatus } from '../../../convex/db';
import { Button } from '../ui/button';
import {
  Plus,
  Search,
  ExternalLink,
  Edit,
  Eye,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Archive,
  Package,
  Image as ImageIcon,
} from 'lucide-react';

interface ProductTableProps {
  onEdit: (product: Product) => void;
  onPreview: (product: Product) => void;
  onCreateNew: () => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  onEdit,
  onPreview,
  onCreateNew,
}) => {
  const products = useQuery(api.products.list);
  const updateStatus = useMutation(api.products.updateStatus);
  const duplicateProduct = useMutation(api.products.duplicate);
  const removeProduct = useMutation(api.products.remove);

  const [search, setSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const handleCopyProductLink = (slug: string) => {
    const url = `${window.location.origin}/p/${encodeURIComponent(slug)}`;
    navigator.clipboard?.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const filteredProducts = (products || []).filter((p) => {
    const status = getProductStatus(p);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesTemplate = filterTemplate === 'all' || p.templateId === filterTemplate;
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    return matchesSearch && matchesTemplate && matchesStatus;
  });

  const handleStatusChange = async (id: string, status: ProductStatus) => {
    await updateStatus({ id, status });
  };

  const handleDuplicate = async (id: string) => {
    await duplicateProduct({ id });
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `هل أنت متأكد من حذف أو أرشفة المنتج "${name}"؟\n(ملاحظة: إذا كانت هناك طلبيات مرتبطة بهذا المنتج فسيتم أرشفته تلقائياً للحفاظ على سجل الطلبيات)`
      )
    ) {
      const res = await removeProduct({ id });
      if (res && res.archived) {
        setNoticeMessage(
          `تم تحويل المنتج "${name}" إلى حالة "مؤرشف (ARCHIVED)" للحفاظ على الطلبيات والتقارير المرتبطة به.`
        );
        setTimeout(() => setNoticeMessage(null), 5000);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ar-MA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      {noticeMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
          <span>{noticeMessage}</span>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-amber-600 hover:text-amber-800 px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم أو الرابط / Search products..."
              className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              dir="rtl"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold"
          >
            <option value="all">جميع الحالات (All Statuses)</option>
            <option value="ACTIVE">نشط ومنشور (ACTIVE)</option>
            <option value="DRAFT">مسودة (DRAFT)</option>
            <option value="ARCHIVED">مؤرشف (ARCHIVED)</option>
          </select>

          {/* Template Filter */}
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">جميع القوالب (All Templates)</option>
            <option value="classic-cod">Classic COD</option>
            <option value="premium">Premium Product</option>
            <option value="big-offer">Big Offer</option>
          </select>
        </div>

        <Button
          onClick={onCreateNew}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
        >
          <Plus className="w-4 h-4 mr-1" />
          + إنشاء منتج جديد / Create Product
        </Button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">المنتج والرابط العام (Product & Public URL)</th>
                <th className="py-3 px-4">القالب (Template)</th>
                <th className="py-3 px-4">السعر (Price)</th>
                <th className="py-3 px-4 text-center">الحالة (Status)</th>
                <th className="py-3 px-4">آخر تحديث</th>
                <th className="py-3 px-4 text-center">إجراءات (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Package className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <div className="font-bold text-slate-600 mb-1">
                      {(products || []).length === 0
                        ? 'No products yet — لا توجد منتجات مسجلة في قاعدة البيانات بعد'
                        : 'لا توجد منتجات مطابقة للبحث'}
                    </div>
                    {(products || []).length === 0 && (
                      <div className="mt-3">
                        <Button
                          onClick={onCreateNew}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          أنشئ أول منتج لك الآن
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const mainImage = product.images && product.images.length > 0 ? product.images[0] : '';
                  const status = getProductStatus(product);

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span dir="ltr">/p/{product.slug}</span>
                              <a
                                href={`/p/${encodeURIComponent(product.slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="فتح صفحة الهبوط العامة"
                                className="text-amber-600 hover:text-amber-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyProductLink(product.slug)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 text-slate-700 font-sans font-semibold cursor-pointer transition-colors"
                                title="نسخ رابط المنتج لفتحه في الهاتف أو متصفح آخر"
                              >
                                {copiedSlug === product.slug ? '✓ تم نسخ الرابط' : 'نسخ الرابط'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Template */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {product.templateId === 'classic-cod'
                            ? 'Classic COD'
                            : product.templateId === 'premium'
                            ? 'Premium'
                            : 'Big Offer'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        {product.price} {product.currency || 'DH'}
                        {product.compareAtPrice > product.price && (
                          <span className="block text-[11px] text-slate-400 line-through font-normal">
                            {product.compareAtPrice} {product.currency || 'DH'}
                          </span>
                        )}
                      </td>

                      {/* Product Status Selector (ACTIVE / DRAFT / ARCHIVED) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {status === 'ACTIVE' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                          {status === 'DRAFT' && (
                            <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          {status === 'ARCHIVED' && (
                            <Archive className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          <select
                            value={status}
                            onChange={(e) =>
                              handleStatusChange(product._id, e.target.value as ProductStatus)
                            }
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                              status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : status === 'ARCHIVED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <option value="ACTIVE">نشط (ACTIVE)</option>
                            <option value="DRAFT">مسودة (DRAFT)</option>
                            <option value="ARCHIVED">مؤرشف (ARCHIVED)</option>
                          </select>
                        </div>
                      </td>

                      {/* Updated Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(product.updatedAt || product.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onEdit(product)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                            title="تعديل المنتج"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onPreview(product)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="معاينة فورية"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/p/${encodeURIComponent(product.slug)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-amber-600 hover:text-amber-700 transition-colors"
                            title="فتح صفحة الهبوط في تبويب جديد"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => handleDuplicate(product._id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="نسخ المنتج"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                            title="حذف أو أرشفة المنتج"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
