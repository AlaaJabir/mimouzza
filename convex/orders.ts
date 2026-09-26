import { db } from './db';
import { Order, OrderStatus } from './schema';

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

export const checkDuplicate = {
  name: 'orders:checkDuplicate',
  query: (args: { productId: string; phone: string; timeWindowMinutes?: number }) => {
    return db.checkDuplicateOrder(args.productId, args.phone, args.timeWindowMinutes ?? 10);
  },
};

export const create = {
  name: 'orders:create',
  mutation: (args: Omit<Order, '_id' | 'orderNumber' | 'createdAt'>) => {
    return db.createOrder(args);
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

export const getMetrics = {
  name: 'orders:getMetrics',
  query: () => {
    const orders = db.getOrders();
    const products = db.getProducts();

    const totalOrders = orders.length;
    const newOrders = orders.filter((o) => o.status === 'NEW').length;
    const confirmedOrders = orders.filter((o) =>
      ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status)
    ).length;
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;

    const totalRevenue = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0);

    const totalProducts = products.length;
    const publishedProducts = products.filter((p) => p.isPublished).length;

    return {
      totalOrders,
      newOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      totalProducts,
      publishedProducts,
    };
  },
};
