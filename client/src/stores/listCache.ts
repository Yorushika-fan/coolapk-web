import { create } from 'zustand'

// Keyed cache for paginated lists across the app — Home, Topic, User
// feed/replies, channel Pages all share this store. Each route is
// uniquely identified by its `cacheKey` (e.g. `topic:小米15`,
// `userFeed:2197288`); state outlives any single mount so navigating
// to a detail page and back keeps the list and scroll position warm.

type Entry = {
  items: unknown[]
  page: number
  hasMore: boolean
  loaded: boolean
  scrollY: number
}

const defaultEntry: Entry = {
  items: [],
  page: 0,
  hasMore: true,
  loaded: false,
  scrollY: 0,
}

type State = {
  entries: Record<string, Entry>
  setSnapshot: (key: string, patch: Partial<Entry>) => void
  appendItems: (key: string, extra: unknown[]) => void
  setScrollY: (key: string, y: number) => void
  reset: (key: string) => void
}

export const useListCacheStore = create<State>((set) => ({
  entries: {},
  setSnapshot: (key, patch) =>
    set((s) => ({
      entries: {
        ...s.entries,
        [key]: { ...defaultEntry, ...s.entries[key], ...patch },
      },
    })),
  appendItems: (key, extra) =>
    set((s) => {
      const cur = s.entries[key] ?? defaultEntry
      return {
        entries: {
          ...s.entries,
          [key]: { ...cur, items: [...cur.items, ...extra] },
        },
      }
    }),
  setScrollY: (key, y) =>
    set((s) => {
      const cur = s.entries[key] ?? defaultEntry
      return {
        entries: { ...s.entries, [key]: { ...cur, scrollY: y } },
      }
    }),
  reset: (key) =>
    set((s) => {
      const next = { ...s.entries }
      delete next[key]
      return { entries: next }
    }),
}))
