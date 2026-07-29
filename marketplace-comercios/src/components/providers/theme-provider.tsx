'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

export const THEME_STORAGE_KEY = 'theme'
const STORAGE_KEY = THEME_STORAGE_KEY

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(resolved)
  document.documentElement.style.colorScheme = resolved
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')

  useEffect(() => {
    // Reads the value the inline beforeInteractive script already applied to
    // the DOM, so React state matches reality — can't be known during SSR.
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs from localStorage/DOM (external systems), only knowable client-side
    setThemeState(stored)
    setResolvedTheme(stored === 'system' ? getSystemTheme() : stored)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange() {
      if (theme !== 'system') return
      const next = getSystemTheme()
      setResolvedTheme(next)
      applyTheme(next)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    const resolved = next === 'system' ? getSystemTheme() : next
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider')
  }
  return context
}
