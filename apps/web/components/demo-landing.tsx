'use client';

import { useT } from '@/lib/i18n/locale-context';
import { DemoStarter } from './demo-starter';
import { BrandBackdrop } from './brand-backdrop';
import { Toolbar } from './toolbar';
import { TourLauncher } from './tour/tour-launcher';

/** Demo sayfası: demo odasını başlatma ve Öğret rehberi. */
export function DemoLanding() {
  const t = useT();

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 overflow-hidden px-6 py-16 text-center">
      <BrandBackdrop />
      <Toolbar />
      <h1 className="text-4xl font-black tracking-tight">{t.demo.title}</h1>
      <p className="text-lg text-muted">{t.demo.body}</p>
      <DemoStarter />
      <TourLauncher />
    </main>
  );
}
