'use client';

import { LOCALES, LOCALE_NAMES, isLocale } from '@/lib/i18n/locales';
import { useLocale, useT } from '@/lib/i18n/locale-context';

/** Dil seçici. Seçim tarayıcıda saklanır ve sonraki sayfalarda da geçerli olur. */
export function LanguageSwitcher() {
  const t = useT();
  const { locale, setLocale } = useLocale();

  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <span className="sr-only">{t.languageLabel}</span>
      <select
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
        className="min-h-11 rounded-xl border-2 border-line bg-surface px-3 font-semibold outline-none focus:border-accent"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
