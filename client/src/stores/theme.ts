import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type ThemeState = {
  isDark: boolean
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>()(
  subscribeWithSelector((set, get) => ({
    isDark: false,
    toggle: () => set({ isDark: !get().isDark }),
    init: () => {
      try {
        const stored = localStorage.getItem('theme')
        if (stored === 'dark') {
          set({ isDark: true })
          return
        }
        if (stored === 'light') {
          set({ isDark: false })
          return
        }
        const prefersDark =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        set({ isDark: !!prefersDark })
      } catch {
        set({ isDark: false })
      }
    },
  })),
)

if (typeof window !== 'undefined') {
  useThemeStore.subscribe(
    (s) => s.isDark,
    (dark) => {
      try {
        localStorage.setItem('theme', dark ? 'dark' : 'light')
      } catch {
        // noop
      }
      document.documentElement.classList.toggle('dark', dark)
    },
  )
}
