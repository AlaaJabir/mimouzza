import React, { useState } from 'react';
import { Product } from '../../../convex/schema';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
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
  Package,
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
  const togglePublish = useMutation(api.products.togglePublish);
  const duplicateProduct = useMutation(api.products.duplicate);
  const removeProduct = useMutation(api.products.remove);

  const [search, setSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');

  const filteredProducts = (products || []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesTemplate = filterTemplate === 'all' || p.templateId === filterTemplate;
    return matchesSearch && matchesTemplate;
  });

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await togglePublish({ id, isPublished: !currentStatus });
  };

  const handleDuplicate = async (id: string) => {
    await duplicateProduct({ id });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) {
      await removeProduct({ id });
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
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
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
                <th className="py-3 px-4">المنتج (Product)</th>
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
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <div>لا توجد منتجات مطابقة للبحث</div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const mainImage = product.images[0] || '/src/assets/images/seed_beauty_serum_1790331758543.jpg';

                  return (
                    <tr key={product._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={mainImage}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-xs sm:max-w-sm">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                              <span>/p/{product.slug}</span>
                              <a
                                href={`/p/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="فتح صفحة الهبوط العامة"
                                className="text-amber-600 hover:text-amber-700"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
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

                      {/* Published Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(product._id, product.isPublished)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                            product.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {product.isPublished ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>منشور (Live)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>مسودة (Draft)</span>
                            </>
                          )}
                        </button>
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
                            href={`/p/${product.slug}`}
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
                            title="حذف المنتج"
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
