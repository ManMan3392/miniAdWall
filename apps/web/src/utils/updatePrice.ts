import type { Ad, AdStore } from '@/store';

const dirtyIds: Set<string> = new Set();
let pendingResort = false;

function resortList(list: Ad[]): Ad[] {
  return [...list].sort((a, b) => {
    const scoreA = computeScore(a);
    const scoreB = computeScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

const scheduleIdle = (cb: () => void) => {
  if (typeof (window as any).requestIdleCallback === 'function') {
    (window as any).requestIdleCallback(cb, { timeout: 120 });
  } else {
    setTimeout(cb, 0);
  }
};

function computeScore(ad: Ad): number {
  return ad.price + ad.price * ad.heat * 0.42;
}

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

export function markDirty(adId: string, get: () => AdStore, set: any) {
  dirtyIds.add(adId);
  if (!pendingResort) {
    pendingResort = true;
    scheduleIdle(() => runDeferredResort(get, set));
  }
}
