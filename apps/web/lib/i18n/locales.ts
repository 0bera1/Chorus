export const LOCALES = ['tr', 'en', 'zh', 'hi', 'es'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'tr';

/** Dil adları kendi dillerinde gösterilir; kullanıcı kendi dilini kolayca bulsun. */
export const LOCALE_NAMES: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  zh: '中文',
  hi: 'हिन्दी',
  es: 'Español',
};

export const LOCALE_STORAGE_KEY = 'chorus-locale';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
