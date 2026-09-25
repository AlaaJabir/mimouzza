import * as products from './products';
import * as orders from './orders';
import * as templates from './templates';
import * as settings from './settings';
import * as analytics from './analytics';

export const api = {
  products: {
    list: products.list,
    listPublished: products.listPublished,
    getBySlug: products.getBySlug,
    getById: products.getById,
    create: products.create,
    update: products.update,
    duplicate: products.duplicate,
    remove: products.remove,
    togglePublish: products.togglePublish,
  },
  orders: {
    list: orders.list,
    getByProductId: orders.getByProductId,
    checkDuplicate: orders.checkDuplicate,
    create: orders.create,
    updateStatus: orders.updateStatus,
    getMetrics: orders.getMetrics,
  },
  templates: {
    list: templates.list,
    getById: templates.getById,
  },
  settings: {
    get: settings.get,
    update: settings.update,
    updateAdSpend: settings.updateAdSpend,
    resetSeed: settings.resetSeed,
  },
  analytics: {
    logEvent: analytics.logEvent,
    getFunnelMetrics: analytics.getFunnelMetrics,
    getCtaPerformance: analytics.getCtaPerformance,
    getTrafficSourcePerformance: analytics.getTrafficSourcePerformance,
    getCampaignPerformance: analytics.getCampaignPerformance,
    getProductAnalyticsTable: analytics.getProductAnalyticsTable,
    getRecentEvents: analytics.getRecentEvents,
  },
};
