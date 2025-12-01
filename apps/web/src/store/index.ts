import { create } from 'zustand';
import { getAdList, getAdTypes, updateAd, deleteAd } from '../service/ad';
import { mergeAdLists } from '@/utils/mergeAdList';
import { markDirty } from '@/utils/updatePrice';

interface AdType {
  id: number;
  type_code: string;
  type_name: string;
}

export interface Ad {
  id: string;
  type_id: number;
  publisher: string;
  title: string;
  content: string;
  heat: number;
  price: number;
  landing_url: string;
  video_ids: string;
  video_urls: string[];
  ext_info: any;
  created_at: string;
  updated_at: string;
  type_code?: string;
  sort_rule?: any;
}

export interface AdStore {
  adList: Ad[];
  currentPage: number;
  pageSize: number;
  total: number;
  loading: boolean;
  adTypes: AdType[];
  selectedAd: Ad | null;
  fetchAdList: (
    page?: number,
    size?: number,
    options?: { silent?: boolean },
  ) => Promise<void>;
  fetchAdTypes: () => Promise<void>;
  updatePrice: (adId: string, price: number) => Promise<any>;
  updateAdData: (adId: string, data: any) => Promise<any>;
  deleteAdData: (adId: string) => Promise<any>;
  setSelectedAd: (ad: Ad | null) => void;
  setPage: (page: number) => void;
  setLocalPrice: (adId: string, price: number) => void;
}

export const useAdStore = create<AdStore>((set, get) => ({
  adList: [],
  currentPage: 1,
  pageSize: 9,
  total: 0,
  loading: false,
  adTypes: [],
  selectedAd: null,
  fetchAdList: async (
    page = get().currentPage,
    size = get().pageSize,
    options?: { silent?: boolean },
  ) => {
    const currentPage = page;
    const pageSize = size;
    const silent = options?.silent;
    if (!silent) set({ loading: true });
    try {
      const response = await getAdList(currentPage, pageSize);
      if (response.code === 200) {
        const incoming = response.data.list || [];
        const total = response.data.total || get().total || 0;
        if (silent) {
          const merged = mergeAdLists(get().adList, incoming);
          set({ adList: merged, total });
        } else {
          set({
            adList: incoming,
            currentPage: response.data.page || currentPage,
            pageSize: response.data.size || pageSize,
            total,
          });
        }
      }
    } catch (error) {
      console.error('获取广告列表失败:', error);
    } finally {
      if (!silent) set({ loading: false });
    }
  },

  fetchAdTypes: async () => {
    try {
      const response = await getAdTypes();
      if (response.code === 200) {
        set({ adTypes: response.data || [] });
      }
    } catch (error) {
      console.error('获取广告类型失败:', error);
    }
  },

  updatePrice: async (adId: string, price: number) => {
    const prev = get().adList;
    const target = prev.find((a) => a.id === adId);
    if (target) {
      const optimisticallyUpdated = prev.map((a) =>
        a.id === adId ? { ...a, price } : a,
      );
      set({ adList: optimisticallyUpdated });
      markDirty(adId, get, set);
    }
    try {
      const response = await updateAd(adId, { price });
      if (response.code !== 200) {
        throw new Error('出价更新失败 code=' + response.code);
      }
      const updatedAd = response.data;
      if (updatedAd && updatedAd.id) {
        set({
          adList: get().adList.map((a) =>
            a.id === String(updatedAd.id) ? { ...a, ...updatedAd } : a,
          ),
        });
      } else {
        try {
          setTimeout(() => {
            get()
              .fetchAdList(undefined, undefined, { silent: true })
              .catch(() => {});
          }, 2000);
        } catch (err) {
          console.warn('fetchAdList after update failed', err);
        }
      }
      return response;
    } catch (error) {
      set({ adList: prev });
      console.error('更新出价失败:', error);
      throw error;
    }
  },

  updateAdData: async (adId: string, data: any) => {
    const prev = get().adList;
    const affectsSort =
      Object.prototype.hasOwnProperty.call(data, 'price') ||
      Object.prototype.hasOwnProperty.call(data, 'heat');
    const optimisticallyUpdated = prev.map((a) =>
      a.id === adId ? { ...a, ...data } : a,
    );
    set({ adList: optimisticallyUpdated });
    if (affectsSort) {
      markDirty(adId, get, set);
    }
    try {
      const response = await updateAd(adId, data);
      if (response.code !== 200) {
        throw new Error('广告更新失败 code=' + response.code);
      }
      const updatedAd = response.data;
      if (updatedAd && updatedAd.id) {
        set({
          adList: get().adList.map((a) =>
            a.id === String(updatedAd.id) ? { ...a, ...updatedAd } : a,
          ),
        });
      }
      if (affectsSort) {
        setTimeout(() => {
          get()
            .fetchAdList(undefined, undefined, { silent: true })
            .catch(() => {});
        }, 2000);
      }
      return response;
    } catch (error) {
      set({ adList: prev });
      console.error('更新广告失败:', error);
      throw error;
    }
  },

  setLocalPrice: (adId: string, price: number) => {
    const prev = get().adList;
    const exists = prev.some((a) => a.id === adId);
    if (!exists) return;
    const updated = prev.map((a) => (a.id === adId ? { ...a, price } : a));
    set({ adList: updated });
    markDirty(adId, get, set);
  },

  deleteAdData: async (adId: string) => {
    try {
      const response = await deleteAd(adId);
      if (response.code === 200) {
        await get().fetchAdList(undefined, undefined, { silent: true });
      }
      return response;
    } catch (error) {
      console.error('删除广告失败:', error);
      throw error;
    }
  },

  setSelectedAd: (ad: Ad | null) => {
    set({ selectedAd: ad });
  },

  setPage: (page: number) => {
    set({ currentPage: page });
  },
}));
