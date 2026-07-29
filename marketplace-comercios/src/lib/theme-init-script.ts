import { THEME_STORAGE_KEY } from '@/components/providers/theme-provider'

// Runs before hydration (next/script beforeInteractive, must live in the
// root layout) to set the right class immediately and avoid a flash of the
// wrong theme. Using next/script instead of a raw <script> element (which is
// what next-themes does internally) avoids Next 16/Turbopack's "Encountered
// a script tag while rendering React component" console warning.
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var theme = stored || 'system';
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`
