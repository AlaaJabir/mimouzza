import { db } from './db';

export const list = {
  name: 'templates:list',
  query: () => {
    return db.getTemplates();
  },
};

export const getById = {
  name: 'templates:getById',
  query: (args: { id: string }) => {
    return db.getTemplates().find((t) => t.id === args.id) || null;
  },
};
