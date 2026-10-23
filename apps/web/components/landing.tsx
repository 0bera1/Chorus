'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/locale-context';
import { JoinForm } from './join-form';
import { Logo } from './logo';
import { BrandBackdrop } from './brand-backdrop';
import { Toolbar } from './toolbar';
import { TourLauncher } from './tour/tour-launcher';

/** Ana sayfa: tanıtım, oda kodu girişi ve Öğret rehberi. */
export function Landing() {
  const t = useT();

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-10 overflow-hidden px-6 py-16 text-center">
      <BrandBackdrop />
      <Toolbar />

      <Logo size={96} animated />
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-black tracking-tight md:text-6xl">{t.landing.heroTitle}</h1>
        <p className="mx-auto max-w-xl text-lg text-muted">{t.landing.heroBody}</p>
      </div>
      <JoinForm />
      <p className="text-sm text-muted">{t.landing.joinHint}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/create" className="min-h-12 rounded-xl bg-accent px-6 py-3 font-bold text-accent-fg shadow-card">
          {t.nav.create}
        </Link>
        <Link href="/demo" className="min-h-12 rounded-xl border-2 border-line bg-surface px-6 py-3 font-bold">
          {t.nav.demo}
        </Link>
        <TourLauncher />
      </div>
    </main>
  );
}
