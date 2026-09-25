import { db } from './db';
import { StoreSettings } from './schema';

export const get = {
  name: 'settings:get',
  query: () => {
    return db.getSettings();
  },
};

export const update = {
  name: 'settings:update',
  mutation: (args: Partial<StoreSettings>) => {
    return db.updateSettings(args);
  },
};

export const updateAdSpend = {
  name: 'settings:updateAdSpend',
  mutation: (args: { campaign: string; spend: number }) => {
    return db.updateCampaignAdSpend(args.campaign, args.spend);
  },
};

export const resetSeed = {
  name: 'settings:resetSeed',
  mutation: () => {
    db.resetToSeed();
    return { success: true };
  },
};
