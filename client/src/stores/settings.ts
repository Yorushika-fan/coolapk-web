import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Per-browser preferences: feed-list filter rules and which left-nav
// entries to hide. Persisted to localStorage so the user's config
// survives reloads. Schema is intentionally permissive (string `field`
// and `mode`) so mid-flight migrations of the rule shape don't blow up
// the app — unrecognized rules are ignored at filter time.

export type FilterField = 'tag' | 'user' | 'content'
export type FilterMode = 'exact' | 'fuzzy' | 'regex'

export type FilterRule = {
  id: string
  field: FilterField
  mode: FilterMode
  value: string
  enabled: boolean
}

type SettingsState = {
  filters: FilterRule[]
  // Stable string keys identifying LeftNav entries (declared in LeftNav).
  // Anything in this list is hidden from the rendered nav.
  hiddenNavKeys: string[]
  addFilter: (rule: Omit<FilterRule, 'id' | 'enabled'> & { enabled?: boolean }) => void
  updateFilter: (id: string, patch: Partial<Omit<FilterRule, 'id'>>) => void
  removeFilter: (id: string) => void
  toggleFilter: (id: string) => void
  clearFilters: () => void
  setNavHidden: (key: string, hidden: boolean) => void
}

const newId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      filters: [],
      hiddenNavKeys: [],
      addFilter: (rule) =>
        set({
          filters: [
            ...get().filters,
            {
              id: newId(),
              field: rule.field,
              mode: rule.mode,
              value: rule.value,
              enabled: rule.enabled ?? true,
            },
          ],
        }),
      updateFilter: (id, patch) =>
        set({
          filters: get().filters.map((r) =>
            r.id === id ? { ...r, ...patch } : r,
          ),
        }),
      removeFilter: (id) =>
        set({ filters: get().filters.filter((r) => r.id !== id) }),
      toggleFilter: (id) =>
        set({
          filters: get().filters.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r,
          ),
        }),
      clearFilters: () => set({ filters: [] }),
      setNavHidden: (key, hidden) => {
        const cur = get().hiddenNavKeys
        const next = hidden
          ? cur.includes(key)
            ? cur
            : [...cur, key]
          : cur.filter((k) => k !== key)
        set({ hiddenNavKeys: next })
      },
    }),
    {
      name: 'coolapk-settings',
      version: 1,
    },
  ),
)
