import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { db } from './db';
import { Order, OrderStatus } from './schema';

const mutation =
  typeof window === 'undefined' ? mutationGeneric : ((definition: any) => definition as any);
const query =
  typeof window === 'undefined' ? queryGeneric : ((definition: any) => definition as any);

export const orderArgsValidator = {
  productId: v.string(),
  productName: v.string(),
  productImage: v.string(),
  customerName: v.string(),
  phone: v.string(),
  city: v.string(),
  address: v.string(),
  quantity: v.number(),
  variants: v.any(),
  notes: v.optional(v.string()),
  total: v.number(),
  amount: v.optional(v.number()),
  currency: v.string(),
  status: v.union(
    v.literal('NEW'),
    v.literal('PENDING'),
    v.literal('CONFIRMED'),
    v.literal('PROCESSING'),
    v.literal('SHIPPED'),
    v.literal('DELIVERED'),
    v.literal('CANCELLED'),
    v.literal('FAILED')
  ),
  visitorId: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  eventId: v.optional(v.string()),
  utmSource: v.string(),
  utmMedium: v.string(),
  utmCampaign: v.string(),
  utmContent: v.string(),
  utmTerm: v.string(),
  fbclid: v.optional(v.string()),
  fbc: v.optional(v.string()),
  fbp: v.optional(v.string()),
  landingPage: v.optional(v.string()),
};

// ==========================================
// 1. CONVEX CLOUD BACKEND FUNCTIONS (orders)
// ==========================================

export const createConvex = mutation({
  args: orderArgsValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db.query('orders').collect();
    const orderSeq = 1000 + existing.length + 1;
    const orderNumber = `COD-${orderSeq}-${now.toString(36).slice(-3).toUpperCase()}`;
    const safeTotal = Number(args.total || args.amount) || 0;

    const orderRecord = {
      ...args,
      orderNumber,
      total: safeTotal,
      amount: safeTotal,
      createdAt: now,
      updatedAt: now,
    };

    const id = await ctx.db.insert('orders', orderRecord);

    await ctx.db.insert('orderStatusHistory', {
      orderId: id,
      orderNumber,
      productId: args.productId,
      previousStatus: null,
      newStatus: 'NEW',
      timestamp: now,
    });

    return {
      _id: id,
      ...orderRecord,
    };
  },
});

export const listConvex = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('orders').order('desc').collect();
  },
});

export const getByProductIdConvex = query({
  args: { productId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orders')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .collect();
  },
});

export const checkDuplicateConvex = query({
  args: {
    productId: v.string(),
    phone: v.string(),
    timeWindowMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowMinutes = args.timeWindowMinutes ?? 10;
    const threshold = Date.now() - windowMinutes * 60 * 1000;
    const phoneClean = args.phone.replace(/[\s\-\(\)\.]/g, '');
    const candidates = await ctx.db
      .query('orders')
      .withIndex('by_phone', (q) => q.eq('phone', args.phone))
      .filter((q) => q.gte(q.field('createdAt'), threshold))
      .collect();

    return (
      candidates.find((o) => {
        const cClean = o.phone.replace(/[\s\-\(\)\.]/g, '');
        return o.productId === args.productId && cClean === phoneClean;
      }) || null
    );
  },
});

export const updateStatusConvex = mutation({
  args: {
    orderId: v.string(),
    status: v.union(
      v.literal('NEW'),
      v.literal('PENDING'),
      v.literal('CONFIRMED'),
      v.literal('PROCESSING'),
      v.literal('SHIPPED'),
      v.literal('DELIVERED'),
      v.literal('CANCELLED'),
      v.literal('FAILED')
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query('orders')
      .filter((q) => q.eq(q.field('_id'), args.orderId))
      .first();

    if (!existing) {
      throw new Error(`Order with ID ${args.orderId} not found`);
    }

    const prevStatus = existing.status;
    await ctx.db.patch(existing._id, {
      status: args.status,
      updatedAt: now,
    });

    await ctx.db.insert('orderStatusHistory', {
      orderId: existing._id,
      orderNumber: existing.orderNumber,
      productId: existing.productId,
      previousStatus: prevStatus,
      newStatus: args.status,
      timestamp: now,
    });

    return { success: true };
  },
});

// ==========================================
// 2. CLIENT-SIDE COMPATIBLE DISPATCHERS
// ==========================================

export const list = {
  name: 'orders:list',
  query: () => {
    return db.getOrders();
  },
};

export const getByProductId = {
  name: 'orders:getByProductId',
  query: (args: { productId: string }) => {
    return db.getOrders().filter((o) => o.productId === args.productId);
  },
};

export const getStatusHistory = {
  name: 'orders:getStatusHistory',
  query: (args?: { orderId?: string }) => {
    return db.getOrderStatusHistory(args?.orderId);
  },
};

export const checkDuplicate = {
  name: 'orders:checkDuplicate',
  query: (args: { productId: string; phone: string; timeWindowMinutes?: number }) => {
    return db.checkDuplicateOrder(args.productId, args.phone, args.timeWindowMinutes ?? 10);
  },
};

export const create = {
  name: 'orders:create',
  mutation: async (args: Omit<Order, '_id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    return await db.createOrder(args);
  },
};

export const updateStatus = {
  name: 'orders:updateStatus',
  mutation: (args: { orderId: string; status: OrderStatus }) => {
    return db.updateOrderStatus(args.orderId, args.status);
  },
};

export const remove = {
  name: 'orders:remove',
  mutation: (args: { orderId: string }) => {
    return db.deleteOrder(args.orderId);
  },
};

export const removeMany = {
  name: 'orders:removeMany',
  mutation: (args: { orderIds: string[] }) => {
    return db.deleteOrders(args.orderIds);
  },
};

export const getMetrics = {
  name: 'orders:getMetrics',
  query: () => {
    const orders = db.getOrders();
    const products = db.getProducts();

    const totalOrders = orders.length;
    const newOrders = orders.filter((o) => o.status === 'NEW' || o.status === 'PENDING').length;
    const confirmedOrders = orders.filter((o) =>
      ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
    ).length;
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const failedOrders = orders.filter((o) => o.status === 'FAILED').length;

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'FAILED')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const confirmedRevenue = orders
      .filter((o) => ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const deliveredRevenue = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const totalProducts = products.length;
    const publishedProducts = products.filter((p) => p.isPublished).length;

    return {
      totalOrders,
      newOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      failedOrders,
      totalRevenue,
      confirmedRevenue,
      deliveredRevenue,
      totalProducts,
      publishedProducts,
    };
  },
};
