import { create } from 'zustand';
import { getAdList, getAdTypes, updateAd, deleteAd } from '../service/ad';

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

interface AdStore {
  adList: Ad[];
  currentPage: number;
  pageSize: number;
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

function computeScore(ad: Ad): number {
  return ad.price + ad.price * ad.heat * 0.42;
}

function resortList(list: Ad[]): Ad[] {
  return [...list].sort((a, b) => {
    const scoreA = computeScore(a);
    const scoreB = computeScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

const dirtyIds: Set<string> = new Set();
let pendingResort = false;

// requestIdleCallback 兼容处理
const scheduleIdle = (cb: () => void) => {
  if (typeof (window as any).requestIdleCallback === 'function') {
    (window as any).requestIdleCallback(cb, { timeout: 120 });
  } else {
    setTimeout(cb, 0);
  }
};

function batchMergeInsert(base: Ad[], updatedItems: Ad[]): Ad[] {
  const sortedUpdated = [...updatedItems].sort((a, b) => {
    const sa = computeScore(a);
    const sb = computeScore(b);
    if (sb !== sa) return sb - sa;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  let i = 0;
  let j = 0;
  const result: Ad[] = [];
  while (i < base.length && j < sortedUpdated.length) {
    const a = base[i];
    const b = sortedUpdated[j];
    const sa = computeScore(a);
    const sb = computeScore(b);
    if (sb > sa) {
      result.push(b);
      j++;
    } else if (sb < sa) {
      result.push(a);
      i++;
    } else {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      if (tb >= ta) {
        result.push(b);
        j++;
      } else {
        result.push(a);
        i++;
      }
    }
  }
  while (i < base.length) result.push(base[i++]);
  while (j < sortedUpdated.length) result.push(sortedUpdated[j++]);
  return result;
}

function runDeferredResort(get: () => AdStore, set: any) {
  const state = get();
  if (dirtyIds.size === 0) {
    pendingResort = false;
    return;
  }
  const allDirtyIds = Array.from(dirtyIds);
  dirtyIds.clear();
  pendingResort = false;
  const original = state.adList;
  if (original.length === 0) return;

  const dirtyItems: Ad[] = [];
  const base: Ad[] = [];
  for (const ad of original) {
    if (allDirtyIds.includes(ad.id)) dirtyItems.push(ad);
    else base.push(ad);
  }

  const DIRTY_FULL_THRESHOLD = 0.15;
  if (dirtyItems.length === 0) return;
  if (
    dirtyItems.length > original.length * DIRTY_FULL_THRESHOLD ||
    original.length < 200
  ) {
    set({ adList: resortList([...base, ...dirtyItems]) });
    return;
  }

  const merged = batchMergeInsert(base, dirtyItems);
  set({ adList: merged });
}

function markDirty(adId: string, get: () => AdStore, set: any) {
  dirtyIds.add(adId);
  if (!pendingResort) {
    pendingResort = true;
    scheduleIdle(() => runDeferredResort(get, set));
  }
}

function mergeAdLists(current: Ad[], incoming: Ad[]): Ad[] {
  const byId = new Map<string, Ad>();
  for (const c of current) byId.set(c.id, c);
  const result: Ad[] = [];
  for (const next of incoming) {
    const prev = byId.get(next.id);
    if (!prev) {
      result.push(next);
      continue;
    }
    if (
      prev.price !== next.price ||
      prev.heat !== next.heat ||
      prev.title !== next.title ||
      prev.content !== next.content ||
      prev.landing_url !== next.landing_url ||
      prev.video_ids !== next.video_ids ||
      prev.publisher !== next.publisher
    ) {
      result.push(next);
    } else {
      result.push(prev);
    }
  }
  return result;
}

export const useAdStore = create<AdStore>((set, get) => ({
  adList: [],
  currentPage: 1,
  pageSize: 10,
  loading: false,
  adTypes: [],
  selectedAd: null,
  fetchAdList: async (
    page?: number,
    size?: number,
    options?: { silent?: boolean },
  ) => {
    const currentPage = page ?? get().currentPage;
    const pageSize = size ?? get().pageSize;
    const silent = options?.silent;
    if (!silent) set({ loading: true });
    try {
      const response = await getAdList(currentPage, pageSize);
      if (response.code === 200) {
        const incoming = response.data.list || [];
        if (silent) {
          const merged = mergeAdLists(get().adList, incoming);
          set({ adList: merged });
        } else {
          set({
            adList: incoming,
            currentPage: response.data.page || currentPage,
            pageSize: response.data.size || pageSize,
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
      console.log('[useAdStore] updateAd response', response);
      if (response.code !== 200) {
        throw new Error('出价更新失败 code=' + response.code);
      }
      const maxAttempts = 4;
      let matched = false;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          await get().fetchAdList(undefined, undefined, { silent: true });
        } catch (err) {
          console.warn('fetchAdList retry failed', err);
        }
        const latest = get().adList.find((a) => a.id === adId);
        console.log('[useAdStore] fetch attempt', i + 1, {
          latestPrice: latest?.price,
        });
        if (latest && Number(latest.price) === Number(price)) {
          matched = true;
          break;
        }
        // 等待一段时间再重试，给后端一些延迟处理时间
        // 第一次 300ms，第二次 600ms，依次倍增
        await new Promise((res) => setTimeout(res, 300 * (i + 1)));
      }
      if (!matched) {
        // 若重试后仍未匹配，做一次完整刷新（非 silent）以替换本地列表
        try {
          await get().fetchAdList(undefined, undefined, { silent: false });
        } catch (err) {
          console.warn('full fetchAdList failed', err);
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
