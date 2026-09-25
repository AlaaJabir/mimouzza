import React, { useState } from 'react';
import { Order, OrderStatus } from '../../../convex/schema';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { OrderStatusBadge } from '../ui/badge';
import {
  Search,
  Phone,
  MapPin,
  Clock,
  Filter,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';

export const OrderTable: React.FC = () => {
  const orders = useQuery(api.orders.list);
  const updateStatus = useMutation(api.orders.updateStatus);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = (orders || []).filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.phone.includes(search) ||
      order.city.toLowerCase().includes(search.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateStatus({ orderId, status: newStatus });
    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
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

  const statusOptions: { value: OrderStatus; label: string }[] = [
    { value: 'NEW', label: 'جديد (NEW)' },
    { value: 'CONFIRMED', label: 'مؤكد (CONFIRMED)' },
    { value: 'PROCESSING', label: 'قيد التجهيز (PROCESSING)' },
    { value: 'SHIPPED', label: 'تم الشحن (SHIPPED)' },
    { value: 'DELIVERED', label: 'تم التسليم (DELIVERED)' },
    { value: 'CANCELLED', label: 'ملغي (CANCELLED)' },
  ];

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 flex-1">
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
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          عدد الطلبيات: <span className="text-slate-900 font-bold font-mono">{filteredOrders.length}</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">رقم الطلب / العميل</th>
                <th className="py-3 px-4">الهاتف / المدينة</th>
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

                    {/* Phone & City */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-800 font-mono" dir="ltr">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{order.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{order.city}</span>
                      </div>
                    </td>

                    {/* Product & Variant */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {order.productName}
                      </div>
                      {order.variants && Object.keys(order.variants).length > 0 && (
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {Object.entries(order.variants)
                            .map(([k, v]) => `${v}`)
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
              {selectedOrder.variants && (
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

            {/* Status Control */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">تحديث حالة الطلب:</span>
              <select
                value={selectedOrder.status}
                onChange={(e) =>
                  handleStatusChange(selectedOrder._id, e.target.value as OrderStatus)
                }
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 font-semibold bg-white"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
