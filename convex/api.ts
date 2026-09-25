import * as products from './products';
import * as orders from './orders';
import * as templates from './templates';
import * as settings from './settings';

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
    resetSeed: settings.resetSeed,
  },
};
