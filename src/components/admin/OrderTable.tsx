import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Order, OrderStatus } from '../../../convex/schema';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import {
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const OrderTable: React.FC = () => {
  const orders = useQuery(api.orders.list);
  const products = useQuery(api.products.list);
  const updateStatus = useMutation(api.orders.updateStatus);
  const removeOrder = useMutation(api.orders.remove);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const filteredOrders = (orders || []).filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.phone.includes(search) ||
      order.city.toLowerCase().includes(search.toLowerCase()) ||
      order.address.toLowerCase().includes(search.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesProduct = productFilter === 'all' || order.productId === productFilter;
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateStatus({ orderId, status: newStatus });
    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    await removeOrder({ orderId });
    setSelectedOrder(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ar-MA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatExcelDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'NEW', label: 'جديد (NEW)' },
    { value: 'CONFIRMED', label: 'مؤكد (CONFIRMED)' },
    { value: 'PROCESSING', label: 'قيد التجهيز (PROCESSING)' },
    { value: 'SHIPPED', label: 'تم الشحن (SHIPPED)' },
    { value: 'DELIVERED', label: 'تم التسليم (DELIVERED)' },
    { value: 'CANCELLED', label: 'ملغي (CANCELLED)' },
  ];

  const getStatusLabel = (status: OrderStatus) => {
    return statusOptions.find((s) => s.value === status)?.label || status;
  };

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) return;

    const rows = filteredOrders.map((order) => {
      const variantsStr =
        order.variants && Object.keys(order.variants).length > 0
          ? Object.entries(order.variants)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' | ')
          : '';

      return {
        'رقم الطلب (Order ID)': order.orderNumber,
        'تاريخ الطلب (Date)': formatExcelDate(order.createdAt),
        'الاسم الكامل (Customer Name)': order.customerName,
        'رقم الهاتف (Phone)': order.phone,
        'المدينة (City)': order.city,
        'العنوان الكامل (Address)': order.address,
        'المنتج (Product)': order.productName,
        'الخيارات (Variants)': variantsStr,
        'الكمية (Qty)': order.quantity,
        'المجموع (Total)': order.total,
        'العملة (Currency)': order.currency || 'DH',
        'الحالة (Status)': getStatusLabel(order.status),
        'ملاحظات الزبون (Notes)': order.notes || '',
        'مصدر الزيارة (UTM Source)': order.utmSource || 'Direct',
        'الحملة الإعلانية (UTM Campaign)': order.utmCampaign || '',
        'الوسيط (UTM Medium)': order.utmMedium || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns for clean readability in Excel
    worksheet['!cols'] = [
      { wch: 15 }, // Order ID
      { wch: 18 }, // Date
      { wch: 24 }, // Customer Name
      { wch: 16 }, // Phone
      { wch: 22 }, // City
      { wch: 36 }, // Address
      { wch: 34 }, // Product
      { wch: 28 }, // Variants
      { wch: 10 }, // Qty
      { wch: 14 }, // Total
      { wch: 10 }, // Currency
      { wch: 20 }, // Status
      { wch: 28 }, // Notes
      { wch: 16 }, // UTM Source
      { wch: 22 }, // UTM Campaign
      { wch: 14 }, // UTM Medium
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `COD_Orders_${dateStamp}.xlsx`);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Search, Filters & Excel Export Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث بالاسم، الهاتف، المدينة أو رقم الطلب..."
              className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
              dir="rtl"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">جميع الحالات (All Statuses)</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Product Filter */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 max-w-[220px] truncate"
          >
            <option value="all">جميع المنتجات (All Products)</option>
            {(products || []).map((prod) => (
              <option key={prod._id} value={prod._id}>
                {prod.name}
              </option>
            ))}
          </select>
        </div>

        {/* Count & Excel Export Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-xs text-slate-500 font-semibold">
            عدد الطلبيات:{' '}
            <span className="text-slate-900 font-bold font-mono">{filteredOrders.length}</span>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>تم تحميل ملف Excel بنجاح!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير إلى Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">رقم الطلب / العميل</th>
                <th className="py-3 px-4">الهاتف / المدينة والعنوان</th>
                <th className="py-3 px-4">المنتج / الخيارات</th>
                <th className="py-3 px-4">الكمية والمجموع</th>
                <th className="py-3 px-4">مصدر الزيارة (UTM)</th>
                <th className="py-3 px-4 text-center">الحالة (Status)</th>
                <th className="py-3 px-4">تاريخ الطلب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <div>لا توجد طلبيات مطابقة للبحث</div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Customer & Order ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="font-mono text-[11px] text-amber-700 font-semibold">
                        {order.orderNumber}
                      </div>
                    </td>

                    {/* Phone, City & Address */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-800 font-mono" dir="ltr">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{order.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{order.city}</span>
                      </div>
                      {order.address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {order.address}
                        </div>
                      )}
                    </td>

                    {/* Product & Variant */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {order.productName}
                      </div>
                      {order.variants && Object.keys(order.variants).length > 0 && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {Object.entries(order.variants)
                            .map(([, v]) => `${v}`)
                            .join(' · ')}
                        </div>
                      )}
                    </td>

                    {/* Quantity & Total */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 font-mono text-sm">
                        {order.total} {order.currency || 'DH'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {order.quantity} قطعة
                      </div>
                    </td>

                    {/* UTM Source */}
                    <td className="py-3.5 px-4">
                      {order.utmSource ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] border border-blue-200">
                          {order.utmSource}
                          {order.utmCampaign ? ` / ${order.utmCampaign}` : ''}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Direct / Organic</span>
                      )}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value as OrderStatus)
                        }
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 font-semibold bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right border border-slate-200"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  تفاصيل الطلبية: {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  تاريخ التسجيل: {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">الاسم الكامل:</span>
                <span className="font-bold text-slate-900">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الهاتف:</span>
                <a
                  href={`tel:${selectedOrder.phone}`}
                  className="font-mono font-bold text-amber-700 hover:underline"
                  dir="ltr"
                >
                  {selectedOrder.phone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المدينة:</span>
                <span className="font-semibold text-slate-900">{selectedOrder.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">العنوان:</span>
                <span className="text-slate-800 text-right max-w-xs">{selectedOrder.address}</span>
              </div>
              {selectedOrder.notes && (
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-500">ملاحظات الزبون:</span>
                  <span className="text-amber-800 font-medium">{selectedOrder.notes}</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">المنتج:</span>
                <span className="font-bold text-slate-900 truncate max-w-[250px]">
                  {selectedOrder.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">الكمية:</span>
                <span className="font-mono font-bold">{selectedOrder.quantity}</span>
              </div>
              {selectedOrder.variants && Object.keys(selectedOrder.variants).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">الخيارات:</span>
                  <span className="font-semibold text-slate-800">
                    {Object.entries(selectedOrder.variants)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' | ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-bold">
                <span>المجموع الكلي:</span>
                <span className="text-amber-600 font-mono text-base">
                  {selectedOrder.total} {selectedOrder.currency || 'DH'}
                </span>
              </div>
            </div>

            {/* Marketing UTM Details */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60 text-[11px] space-y-1">
              <div className="font-bold text-blue-900 mb-1">بيانات التتبع الإعلاني (Marketing Attribution):</div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono">
                <div>Source: <span className="font-bold text-slate-900">{selectedOrder.utmSource || 'none'}</span></div>
                <div>Medium: <span className="font-bold text-slate-900">{selectedOrder.utmMedium || 'none'}</span></div>
                <div>Campaign: <span className="font-bold text-slate-900">{selectedOrder.utmCampaign || 'none'}</span></div>
                <div>Content: <span className="font-bold text-slate-900">{selectedOrder.utmContent || 'none'}</span></div>
              </div>
            </div>

            {/* Status & Delete Controls */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">تحديث الحالة:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder._id, e.target.value as OrderStatus)
                  }
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-semibold bg-white"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteOrder(selectedOrder._id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف الطلب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
