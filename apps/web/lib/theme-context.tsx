'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'chorus-theme';

/**
 * Sayfa boyanmadan önce çalışan satır içi betik: kayıtlı temayı (yoksa sistem tercihini)
 * <html data-theme> üzerine yazar. Böylece yanlış temanın kısa bir an görünmesi engellenir.
 */
export const themeInitScript = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;}catch(e){}})();`;

interface ThemeValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeValue>({ theme: 'light', setTheme: () => {} });

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Sunucu ve ilk istemci render'ı aynı olsun diye açık tema ile başlar; gerçek tema mount'tan sonra okunur
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(currentTheme());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Kaydedilemezse tema yalnızca bu sayfada geçerli olur
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  return useContext(ThemeContext);
}
