import type { Ad } from '@/store';

export function mergeAdLists(current: Ad[], incoming: Ad[]): Ad[] {
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
