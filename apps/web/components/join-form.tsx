'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useT } from '@/lib/i18n/locale-context';

/** Oda kodu girişi: kodu büyük harfe çevirip /j/KOD sayfasına yönlendirir. */
export function JoinForm() {
  const t = useT();
  const router = useRouter();
  const [code, setCode] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length === 6) router.push(`/j/${clean}`);
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <label className="sr-only" htmlFor="room-code">
        {t.landing.joinLabel}
      </label>
      <input
        id="room-code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
        placeholder={t.landing.joinPlaceholder}
        autoComplete="off"
        inputMode="text"
        className="min-h-14 flex-1 rounded-2xl border-2 border-line bg-surface px-5 text-center text-xl font-bold tracking-[0.3em] uppercase outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={code.trim().length !== 6}
        className="min-h-14 shrink-0 whitespace-nowrap rounded-2xl bg-accent px-6 text-lg font-bold text-accent-fg shadow-card disabled:opacity-50"
      >
        {t.landing.joinButton}
      </button>
    </form>
  );
}
