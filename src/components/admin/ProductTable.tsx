import React, { useState } from 'react';
import { Product, ProductStatus } from '../../../convex/schema';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { getProductStatus } from '../../../convex/db';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleConfirmDelete = async (id: string, name: string) => {
    const res = await removeProduct({ id });
    setDeletingId(null);
    if (res && res.archived) {
      setNoticeMessage(
        `Product "${name}" was moved to ARCHIVED to preserve historical orders and analytics.`
      );
      setTimeout(() => setNoticeMessage(null), 5000);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-5" dir="ltr">
      {/* Page Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Products & Landing Pages
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Create, customize, and publish Arabic COD landing pages with instant live preview
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#e66000] text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Product</span>
        </button>
      </div>

      {noticeMessage && (
        <div className="p-4 rounded-2xl bg-[#FFF3EB] border border-[#FF6B00]/30 text-[#111111] text-xs font-semibold flex items-center justify-between">
          <span>{noticeMessage}</span>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-neutral-500 hover:text-[#111111] px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-neutral-200/70 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or slug..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-[#F8F8F6] border border-neutral-200/80 text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-4 py-2 rounded-full border border-neutral-200/80 bg-[#F8F8F6] text-[#111111] font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active (Published)</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Template Filter */}
          <select
            value={filterTemplate}
            onChange={(e) => setFilterTemplate(e.target.value)}
            className="text-xs px-4 py-2 rounded-full border border-neutral-200/80 bg-[#F8F8F6] text-[#111111] font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Templates</option>
            <option value="classic-cod">Classic COD</option>
            <option value="premium">Premium Product</option>
            <option value="big-offer">Big Offer</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-neutral-400 px-2">
          Showing <span className="text-[#111111] font-bold">{filteredProducts.length}</span> products
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-neutral-200/70 shadow-2xs overflow-hidden p-2 sm:p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 text-neutral-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Product & Public Landing URL</th>
                <th className="py-3.5 px-4">Template</th>
                <th className="py-3.5 px-4">COD Price</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-neutral-400">
                    <Package className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <div className="font-bold text-[#111111] mb-1">
                      {(products || []).length === 0
                        ? 'No products created yet'
                        : 'No products match your current filter'}
                    </div>
                    {(products || []).length === 0 && (
                      <div className="mt-3">
                        <button
                          onClick={onCreateNew}
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FF6B00] hover:bg-[#e66000] text-white font-bold text-xs cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Your First Product</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const mainImage =
                    product.images && product.images.length > 0 ? product.images[0] : '';
                  const status = getProductStatus(product);

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-[#F8F8F6]/60 transition-colors"
                    >
                      {/* Product Name & Image */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3.5">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-2xl object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-[#F8F8F6] border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-[#111111] truncate max-w-xs sm:max-w-sm text-sm">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mt-1">
                              <span>/p/{product.slug}</span>
                              <a
                                href={`/p/${encodeURIComponent(product.slug)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open public landing page"
                                className="text-[#FF6B00] hover:underline inline-flex items-center gap-0.5 font-sans font-semibold"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCopyProductLink(product.slug)}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8F8F6] hover:bg-[#FFF3EB] text-neutral-700 hover:text-[#FF6B00] font-sans font-semibold cursor-pointer transition-colors border border-neutral-200/80"
                              >
                                {copiedSlug === product.slug ? '✓ Copied URL' : 'Copy Link'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Template */}
                      <td className="py-4 px-4">
                        <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F8F8F6] border border-neutral-200/80 text-[#111111]">
                          {product.templateId === 'classic-cod'
                            ? 'Classic COD'
                            : product.templateId === 'premium'
                            ? 'Premium'
                            : 'Big Offer'}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-4 font-mono font-extrabold text-[#111111] text-sm tabular-nums">
                        {product.price} {product.currency || 'DH'}
                        {product.compareAtPrice > product.price && (
                          <span className="block text-[11px] text-neutral-400 line-through font-normal">
                            {product.compareAtPrice} {product.currency || 'DH'}
                          </span>
                        )}
                      </td>

                      {/* Product Status Selector */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {status === 'ACTIVE' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#129A56] shrink-0" />
                          )}
                          {status === 'DRAFT' && (
                            <XCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          )}
                          {status === 'ARCHIVED' && (
                            <Archive className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          <select
                            value={status}
                            onChange={(e) =>
                              handleStatusChange(product._id, e.target.value as ProductStatus)
                            }
                            className={`text-xs font-bold px-3 py-1 rounded-full border cursor-pointer focus:outline-none ${
                              status === 'ACTIVE'
                                ? 'bg-[#E8F8F0] text-[#129A56] border-[#129A56]/20'
                                : status === 'ARCHIVED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="DRAFT">Draft</option>
                            <option value="ARCHIVED">Archived</option>
                          </select>
                        </div>
                      </td>

                      {/* Updated Date */}
                      <td className="py-4 px-4 text-neutral-500 font-mono text-[11px]">
                        {formatDate(product.updatedAt || product.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        {deletingId === product._id ? (
                          <div className="inline-flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            <button
                              onClick={() => handleConfirmDelete(product._id, product.name)}
                              className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="text-[11px] text-neutral-500 hover:text-[#111111] cursor-pointer ml-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEdit(product)}
                              className="p-2 rounded-full border border-neutral-200/90 bg-white hover:bg-[#111111] hover:text-white text-neutral-700 transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onPreview(product)}
                              className="p-2 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-100 text-neutral-700 transition-colors cursor-pointer"
                              title="Live Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <a
                              href={`/p/${encodeURIComponent(product.slug)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-full bg-[#FFF3EB] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white transition-colors"
                              title="Open Landing Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>

                            <button
                              onClick={() => handleDuplicate(product._id)}
                              className="p-2 rounded-full border border-neutral-200/90 bg-white hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                              title="Duplicate Product"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingId(product._id)}
                              className="p-2 rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                              title="Delete or Archive Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
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

