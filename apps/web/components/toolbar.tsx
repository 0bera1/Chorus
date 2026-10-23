'use client';

import { useT } from '@/lib/i18n/locale-context';
import { useTheme, type Theme } from '@/lib/theme-context';
import { LanguageSwitcher } from './language-switcher';
import { MoonIcon, SunIcon } from './icons';

/** Sayfa üst çubuğu: dil ve tema seçenekleri. */
export function Toolbar() {
  return (
    <div className="flex w-full flex-wrap items-center justify-end gap-3">
      <LanguageSwitcher />
      <ThemeSwitcher />
    </div>
  );
}

/** Açık / koyu tema için iki seçenekli düğme grubu. */
export function ThemeSwitcher() {
  const t = useT();
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as Theme, label: t.theme.light, Icon: SunIcon },
    { value: 'dark' as Theme, label: t.theme.dark, Icon: MoonIcon },
  ];

  return (
    <div role="group" aria-label={t.theme.label} className="flex overflow-hidden rounded-xl border border-line bg-surface text-sm font-semibold">
      {options.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={active}
            className={`flex min-h-11 items-center gap-2 px-3 transition ${active ? 'bg-accent text-accent-fg' : 'text-muted hover:text-fg'}`}
          >
            <option.Icon size={16} />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
