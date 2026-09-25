import { db } from './db';
import { Product } from './schema';

export const list = {
  name: 'products:list',
  query: () => {
    return db.getProducts();
  },
};

export const listPublished = {
  name: 'products:listPublished',
  query: () => {
    return db.getProducts().filter((p) => p.isPublished);
  },
};

export const getBySlug = {
  name: 'products:getBySlug',
  query: (args: { slug: string }) => {
    return db.getProductBySlug(args.slug);
  },
};

export const getById = {
  name: 'products:getById',
  query: (args: { id: string }) => {
    return db.getProductById(args.id);
  },
};

export const create = {
  name: 'products:create',
  mutation: (args: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => {
    return db.createProduct(args);
  },
};

export const update = {
  name: 'products:update',
  mutation: (args: { id: string; updates: Partial<Product> }) => {
    return db.updateProduct(args.id, args.updates);
  },
};

export const duplicate = {
  name: 'products:duplicate',
  mutation: (args: { id: string }) => {
    return db.duplicateProduct(args.id);
  },
};

export const remove = {
  name: 'products:remove',
  mutation: (args: { id: string }) => {
    return db.deleteProduct(args.id);
  },
};

export const togglePublish = {
  name: 'products:togglePublish',
  mutation: (args: { id: string; isPublished: boolean }) => {
    return db.updateProduct(args.id, { isPublished: args.isPublished });
  },
};
