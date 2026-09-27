import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Order, OrderStatus } from '../../../convex/schema';
import { useQuery, useMutation } from '../../lib/convex-client';
import { api } from '../../../convex/api';
import { BUSINESS_TIMEZONE } from '../../../convex/analytics';
import {
  Search,
  Phone,
  MapPin,
  ShoppingBag,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  History,
  AlertTriangle,
  Eye,
  Sparkles,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';

function isLikelyTestOrFakeOrder(order: Order): boolean {
  const combinedText = `${order.customerName || ''} ${order.address || ''} ${order.notes || ''} ${
    order.productName || ''
  }`.toLowerCase();

  const testKeywords = [
    'test',
    'tesst',
    'testing',
    'fake',
    'demo',
    'azerty',
    'qwerty',
    'asdf',
    'تيست',
    'تست',
    'تجربة',
    'تجريبي',
    'وهمي',
    'فيك',
    'ااا',
    'aaa',
    'bbb',
    'xxx',
    '1234',
  ];

  if (testKeywords.some((kw) => combinedText.includes(kw))) {
    return true;
  }

  const digits = (order.phone || '').replace(/\D/g, '');
  const fakePhones = [
    '0600000000',
    '0611111111',
    '0622222222',
    '0633333333',
    '0644444444',
    '0655555555',
    '0666666666',
    '0677777777',
    '0688888888',
    '0699999999',
    '0612345678',
    '0712345678',
    '0700000000',
  ];
  if (fakePhones.includes(digits)) {
    return true;
  }

  if (order.status === 'CANCELLED' || order.status === 'FAILED') {
    return true;
  }

  return false;
}

export const OrderTable: React.FC = () => {
  const orders = useQuery(api.orders.list);
  const products = useQuery(api.products.list);
  const statusHistory = useQuery(api.orders.getStatusHistory);
  const updateStatus = useMutation(api.orders.updateStatus);
  const removeOrder = useMutation(api.orders.remove);
  const removeManyOrders = useMutation(api.orders.removeMany);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [onlyTestOrdersFilter, setOnlyTestOrdersFilter] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    mode: 'single' | 'bulk';
    orderIds: string[];
    label: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  const allOrders = orders || [];

  const detectedTestOrdersCount = useMemo(
    () => allOrders.filter((o) => isLikelyTestOrFakeOrder(o)).length,
    [allOrders]
  );

  const filteredOrders = useMemo(() => {
    return allOrders.filter((order) => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(search.toLowerCase()) ||
        order.phone.includes(search) ||
        order.city.toLowerCase().includes(search.toLowerCase()) ||
        order.address.toLowerCase().includes(search.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        order.productName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesProduct = productFilter === 'all' || order.productId === productFilter;
      const matchesTestFilter = !onlyTestOrdersFilter || isLikelyTestOrFakeOrder(order);
      return matchesSearch && matchesStatus && matchesProduct && matchesTestFilter;
    });
  }, [allOrders, search, statusFilter, productFilter, onlyTestOrdersFilter]);

  const allFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((order) => selectedOrderIds.has(order._id));

  const toggleSelectOrder = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        filteredOrders.forEach((o) => next.delete(o._id));
        return next;
      });
    } else {
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        filteredOrders.forEach((o) => next.add(o._id));
        return next;
      });
    }
  };

  const handleSelectDetectedTestOrders = () => {
    const testIds = allOrders.filter((o) => isLikelyTestOrFakeOrder(o)).map((o) => o._id);
    if (testIds.length > 0) {
      setSelectedOrderIds(new Set(testIds));
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await updateStatus({ orderId, status: newStatus });
    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const promptSingleDelete = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDeleteModal({
      mode: 'single',
      orderIds: [order._id],
      label: `${order.orderNumber} (${order.customerName} — ${order.phone})`,
    });
  };

  const promptBulkDelete = (idsToDelete?: string[]) => {
    const ids = idsToDelete || Array.from(selectedOrderIds);
    if (ids.length === 0) return;
    setConfirmDeleteModal({
      mode: 'bulk',
      orderIds: ids,
      label: `${ids.length} selected order${ids.length > 1 ? 's' : ''}`,
    });
  };

  const executeConfirmedDelete = async () => {
    if (!confirmDeleteModal || confirmDeleteModal.orderIds.length === 0) return;
    setIsDeleting(true);
    try {
      const ids = confirmDeleteModal.orderIds;
      if (ids.length === 1) {
        await removeOrder({ orderId: ids[0] });
      } else {
        await removeManyOrders({ orderIds: ids });
      }

      if (selectedOrder && ids.includes(selectedOrder._id)) {
        setSelectedOrder(null);
      }

      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });

      setDeleteToast(
        ids.length === 1
          ? 'تم حذف الطلب بنجاح (Order deleted permanently)'
          : `تم حذف ${ids.length} طلبات بنجاح (${ids.length} orders deleted permanently)`
      );
      setTimeout(() => setDeleteToast(null), 3500);
      setConfirmDeleteModal(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      timeZone: BUSINESS_TIMEZONE,
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
    { value: 'NEW', label: 'New / Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'FAILED', label: 'Failed Delivery' },
  ];

  const getStatusLabel = (status: OrderStatus) => {
    return statusOptions.find((s) => s.value === status)?.label || status;
  };

  const selectedOrderHistory = selectedOrder
    ? (statusHistory || []).filter((h) => h.orderId === selectedOrder._id)
    : [];

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
        'Order ID': order.orderNumber,
        Date: formatExcelDate(order.createdAt),
        'Customer Name': order.customerName,
        Phone: order.phone,
        City: order.city,
        Address: order.address,
        Product: order.productName,
        Variants: variantsStr,
        Qty: order.quantity,
        Total: order.total,
        Currency: order.currency || 'DH',
        Status: getStatusLabel(order.status),
        Notes: order.notes || '',
        'Visitor ID': order.visitorId || '',
        'Session ID': order.sessionId || '',
        'UTM Source': order.utmSource || 'Direct',
        'UTM Campaign': order.utmCampaign || '',
        'UTM Medium': order.utmMedium || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 24 },
      { wch: 16 },
      { wch: 22 },
      { wch: 36 },
      { wch: 34 },
      { wch: 28 },
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 20 },
      { wch: 28 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

    const dateStamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `COD_Orders_${dateStamp}.xlsx`);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="space-y-5" dir="ltr">
      {/* Page Title & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Cash on Delivery Orders
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage incoming customer orders, remove test/fake orders, and export to Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {detectedTestOrdersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                handleSelectDetectedTestOrders();
                const testIds = allOrders
                  .filter((o) => isLikelyTestOrFakeOrder(o))
                  .map((o) => o._id);
                promptBulkDelete(testIds);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Test / Fake Orders ({detectedTestOrdersCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={filteredOrders.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            {exportSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#129A56]" />
                <span>Excel Downloaded!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-[#FF6B00]" />
                <span>Export to Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delete Notification Banner */}
      {deleteToast && (
        <div className="bg-[#E8F8F0] border border-[#129A56]/30 text-[#129A56] px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{deleteToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteToast(null)}
            className="text-[#129A56] hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Selection Action Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs font-mono">
              {selectedOrderIds.size}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-rose-950">
              {selectedOrderIds.size === 1
                ? '1 order selected for deletion'
                : `${selectedOrderIds.size} orders selected for deletion (تحديد للحذف)`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedOrderIds(new Set())}
              className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={() => promptBulkDelete()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedOrderIds.size}) — حذف المحدد</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-neutral-200/70 shadow-2xs">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone, city, or order ID..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-[#F8F8F6] border border-neutral-200/80 text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:border-[#111111]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-4 py-2 rounded-full border border-neutral-200/80 bg-[#F8F8F6] text-[#111111] font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
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
            className="text-xs px-4 py-2 rounded-full border border-neutral-200/80 bg-[#F8F8F6] text-[#111111] font-semibold max-w-[220px] truncate focus:outline-none cursor-pointer"
          >
            <option value="all">All Products</option>
            {(products || []).map((prod) => (
              <option key={prod._id} value={prod._id}>
                {prod.name}
              </option>
            ))}
          </select>

          {/* Quick Filter for Likely Test/Fake Orders */}
          <button
            type="button"
            onClick={() => setOnlyTestOrdersFilter((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
              onlyTestOrdersFilter
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-[#F8F8F6] text-neutral-700 border-neutral-200/80 hover:bg-neutral-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test / Fake Filter ({detectedTestOrdersCount})</span>
          </button>
        </div>

        {/* Count Badge & Select All */}
        <div className="flex items-center justify-end gap-3 px-2">
          {filteredOrders.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="text-xs font-bold text-[#FF6B00] hover:underline cursor-pointer"
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </button>
          )}
          <div className="text-xs text-neutral-500 font-semibold">
            Total Orders:{' '}
            <span className="text-[#111111] font-extrabold font-mono">{filteredOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-neutral-200/70 shadow-2xs overflow-hidden p-2 sm:p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 text-neutral-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-3 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    disabled={filteredOrders.length === 0}
                    className="text-neutral-400 hover:text-[#111111] disabled:opacity-40 cursor-pointer flex items-center justify-center"
                    title="Select All Orders"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#FF6B00]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Order ID & Customer</th>
                <th className="py-3.5 px-4">Phone & Delivery Address</th>
                <th className="py-3.5 px-4">Product & Variants</th>
                <th className="py-3.5 px-4">Qty & Total</th>
                <th className="py-3.5 px-4">Attribution (UTM)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-neutral-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <div className="font-bold text-[#111111]">No orders found</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      New orders placed on your landing pages will appear here automatically.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.has(order._id);
                  const isLikelyTest = isLikelyTestOrFakeOrder(order);
                  return (
                    <tr
                      key={order._id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50/60 hover:bg-rose-50'
                          : 'hover:bg-[#F8F8F6]/60'
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-4 px-3"
                        onClick={(e) => toggleSelectOrder(order._id, e)}
                      >
                        <button
                          type="button"
                          className="text-neutral-400 hover:text-[#111111] cursor-pointer flex items-center justify-center"
                          aria-label="Select order"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Customer & Order ID */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111111] text-sm">
                            {order.customerName}
                          </span>
                          {isLikelyTest && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase tracking-wide">
                              Test / Fake?
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-[#FF6B00] font-bold mt-0.5">
                          {order.orderNumber}
                        </div>
                      </td>

                      {/* Phone, City & Address */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-[#111111] font-mono font-semibold">
                          <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span>{order.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-600 mt-0.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
                          <span className="truncate max-w-[160px]">{order.city}</span>
                        </div>
                        {order.address && (
                          <div className="text-[11px] text-neutral-400 truncate max-w-[200px] mt-0.5">
                            {order.address}
                          </div>
                        )}
                      </td>

                      {/* Product & Variant */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-[#111111] truncate max-w-[200px]">
                          {order.productName}
                        </div>
                        {order.variants && Object.keys(order.variants).length > 0 && (
                          <div className="text-[11px] text-neutral-500 truncate max-w-[200px] mt-0.5">
                            {Object.entries(order.variants)
                              .map(([, v]) => `${v}`)
                              .join(' · ')}
                          </div>
                        )}
                      </td>

                      {/* Quantity & Total */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-[#111111] font-mono text-sm tabular-nums">
                          {order.total} {order.currency || 'DH'}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-medium">
                          Qty: {order.quantity}
                        </div>
                      </td>

                      {/* UTM Source */}
                      <td className="py-4 px-4">
                        {order.utmSource ? (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#FFF3EB] text-[#FF6B00] font-mono text-[10px] font-bold">
                            {order.utmSource}
                            {order.utmCampaign ? ` / ${order.utmCampaign}` : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-medium">
                            Direct / Organic
                          </span>
                        )}
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value as OrderStatus)
                          }
                          className={`text-xs px-3 py-1.5 rounded-full border font-bold cursor-pointer focus:outline-none ${
                            order.status === 'NEW'
                              ? 'bg-[#FFF3EB] text-[#FF6B00] border-[#FF6B00]/30'
                              : order.status === 'CONFIRMED' || order.status === 'DELIVERED'
                                ? 'bg-[#E8F8F0] text-[#129A56] border-[#129A56]/30'
                                : order.status === 'CANCELLED' || order.status === 'FAILED'
                                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                                  : 'bg-[#F8F8F6] text-[#111111] border-neutral-200'
                          }`}
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Direct Actions: View & Delete */}
                      <td
                        className="py-4 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 rounded-full bg-[#F8F8F6] hover:bg-neutral-200 text-neutral-600 hover:text-[#111111] transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => promptSingleDelete(order, e)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 font-bold text-[11px] transition-all cursor-pointer"
                            title="Delete Fake / Test Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
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

      {/* Confirm Delete Modal (Single or Bulk) */}
      {confirmDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !isDeleting && setConfirmDeleteModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-left border border-neutral-200"
            dir="ltr"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#111111]">
                  Delete Fake / Test Order{confirmDeleteModal.orderIds.length > 1 ? 's' : ''}?
                </h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  You are about to permanently delete{' '}
                  <span className="font-bold text-[#111111]">{confirmDeleteModal.label}</span>.
                  This will also remove it from revenue & conversion statistics.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteModal(null)}
                className="px-4 py-2 rounded-full bg-[#F8F8F6] hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeConfirmedDelete}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeleting
                    ? 'Deleting...'
                    : `Yes, Delete Permanently (${confirmDeleteModal.orderIds.length})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left border border-neutral-200 max-h-[90vh] overflow-y-auto"
            dir="ltr"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-extrabold text-[#111111]">
                  Order Details: <span className="text-[#FF6B00]">{selectedOrder.orderNumber}</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-[#111111] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Customer Details */}
            <div className="bg-[#F8F8F6] p-4 rounded-2xl border border-neutral-200/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Customer Name:</span>
                <span className="font-bold text-[#111111]">{selectedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Phone:</span>
                <a
                  href={`tel:${selectedOrder.phone}`}
                  className="font-mono font-bold text-[#FF6B00] hover:underline"
                >
                  {selectedOrder.phone}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">City:</span>
                <span className="font-semibold text-[#111111]">{selectedOrder.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Delivery Address:</span>
                <span className="text-[#111111] text-right max-w-xs">{selectedOrder.address}</span>
              </div>
              {selectedOrder.notes && (
                <div className="flex justify-between border-t border-neutral-200 pt-2">
                  <span className="text-neutral-500 font-medium">Customer Notes:</span>
                  <span className="text-[#FF6B00] font-semibold">{selectedOrder.notes}</span>
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-4 rounded-2xl border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Product:</span>
                <span className="font-bold text-[#111111] truncate max-w-[250px]">
                  {selectedOrder.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-medium">Quantity:</span>
                <span className="font-mono font-bold text-[#111111]">{selectedOrder.quantity}</span>
              </div>
              {selectedOrder.variants && Object.keys(selectedOrder.variants).length > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Selected Variants:</span>
                  <span className="font-semibold text-[#111111]">
                    {Object.entries(selectedOrder.variants)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' | ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-100 pt-2 text-sm font-extrabold">
                <span>Total COD Amount:</span>
                <span className="text-[#FF6B00] font-mono text-base">
                  {selectedOrder.total} {selectedOrder.currency || 'DH'}
                </span>
              </div>
            </div>

            {/* Marketing & Session Attribution Details */}
            <div className="p-4 bg-[#F8F8F6] rounded-2xl border border-neutral-200/70 text-[11px] space-y-1.5">
              <div className="font-bold text-[#111111] mb-1">Attribution & Tracking Identity</div>
              <div className="grid grid-cols-2 gap-2 text-neutral-500 font-mono">
                <div className="truncate">
                  Visitor:{' '}
                  <span className="font-bold text-[#111111]">{selectedOrder.visitorId || '—'}</span>
                </div>
                <div className="truncate">
                  Session:{' '}
                  <span className="font-bold text-[#111111]">{selectedOrder.sessionId || '—'}</span>
                </div>
                <div>
                  Source:{' '}
                  <span className="font-bold text-[#111111]">
                    {selectedOrder.utmSource || 'direct'}
                  </span>
                </div>
                <div>
                  Medium:{' '}
                  <span className="font-bold text-[#111111]">
                    {selectedOrder.utmMedium || 'none'}
                  </span>
                </div>
                <div className="col-span-2 truncate">
                  Campaign:{' '}
                  <span className="font-bold text-[#111111]">
                    {selectedOrder.utmCampaign || 'none'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Status History Audit Log */}
            <div className="p-4 bg-[#F8F8F6] rounded-2xl border border-neutral-200/70 text-[11px] space-y-2">
              <div className="font-bold text-[#111111] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span>Order Status History</span>
              </div>
              {selectedOrderHistory.length === 0 ? (
                <div className="text-neutral-400">No status changes recorded yet</div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedOrderHistory.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-neutral-200/80 font-mono"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-neutral-500">{item.previousStatus || 'CREATED'}</span>
                        <span className="text-neutral-400">→</span>
                        <span className="font-bold text-[#129A56]">{item.newStatus}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status & Delete Controls */}
            <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#111111]">Update Status:</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder._id, e.target.value as OrderStatus)
                  }
                  className="text-xs px-3.5 py-1.5 rounded-full border border-neutral-300 font-bold bg-white cursor-pointer"
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
                onClick={(e) => promptSingleDelete(selectedOrder, e)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
