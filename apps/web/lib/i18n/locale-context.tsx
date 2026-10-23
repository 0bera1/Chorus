'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, type Dictionary } from './dictionaries';
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, type Locale } from './locales';

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: dictionaries[DEFAULT_LOCALE],
  setLocale: () => {},
});

/** Önce kayıtlı seçime, yoksa tarayıcının dil listesine bakar. */
function detectLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Depolama engelliyse (gizli pencere vb.) tarayıcı dili kullanılır
  }
  for (const language of navigator.languages) {
    const code = language.slice(0, 2).toLowerCase();
    if (isLocale(code)) return code;
  }
  return DEFAULT_LOCALE;
}

/**
 * İlk render her zaman varsayılan dilde yapılır (sunucu ile istemci eşleşsin diye);
 * kayıtlı ya da tarayıcı dili mount'tan sonra uygulanır.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Kaydedilemezse seçim yalnızca bu oturumda geçerli olur
    }
  }, []);

  const value = useMemo(() => ({ locale, t: dictionaries[locale], setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT(): Dictionary {
  return useContext(LocaleContext).t;
}

export function useLocale(): Pick<LocaleContextValue, 'locale' | 'setLocale'> {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale };
}
