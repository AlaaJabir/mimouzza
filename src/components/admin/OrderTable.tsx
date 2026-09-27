import React, { useState } from 'react';
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
} from 'lucide-react';

export const OrderTable: React.FC = () => {
  const orders = useQuery(api.orders.list);
  const products = useQuery(api.products.list);
  const statusHistory = useQuery(api.orders.getStatusHistory);
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
      {/* Page Title & Export Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Cash on Delivery Orders
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Manage incoming customer orders, update confirmation status, and export to Excel
          </p>
        </div>

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

      {/* Search & Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-neutral-200/70 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
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
            className="text-xs px-4 py-2 rounded-full border border-neutral-200/80 bg-[#F8F8F6] text-[#111111] font-semibold max-w-[240px] truncate focus:outline-none cursor-pointer"
          >
            <option value="all">All Products</option>
            {(products || []).map((prod) => (
              <option key={prod._id} value={prod._id}>
                {prod.name}
              </option>
            ))}
          </select>
        </div>

        {/* Count Badge */}
        <div className="flex items-center justify-end gap-3 px-2">
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
                <th className="py-3.5 px-4">Order ID & Customer</th>
                <th className="py-3.5 px-4">Phone & Delivery Address</th>
                <th className="py-3.5 px-4">Product & Variants</th>
                <th className="py-3.5 px-4">Qty & Total</th>
                <th className="py-3.5 px-4">Attribution (UTM)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-neutral-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <div className="font-bold text-[#111111]">No orders found</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      New orders placed on your landing pages will appear here automatically.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="hover:bg-[#F8F8F6]/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Customer & Order ID */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#111111] text-sm">{order.customerName}</div>
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
                    <td className="py-4 px-4 text-neutral-500 font-mono text-[11px]">
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
                  Visitor: <span className="font-bold text-[#111111]">{selectedOrder.visitorId || '—'}</span>
                </div>
                <div className="truncate">
                  Session: <span className="font-bold text-[#111111]">{selectedOrder.sessionId || '—'}</span>
                </div>
                <div>
                  Source: <span className="font-bold text-[#111111]">{selectedOrder.utmSource || 'direct'}</span>
                </div>
                <div>
                  Medium: <span className="font-bold text-[#111111]">{selectedOrder.utmMedium || 'none'}</span>
                </div>
                <div className="col-span-2 truncate">
                  Campaign: <span className="font-bold text-[#111111]">{selectedOrder.utmCampaign || 'none'}</span>
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
                onClick={() => handleDeleteOrder(selectedOrder._id)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
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

