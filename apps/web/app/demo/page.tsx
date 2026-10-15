import type { Metadata } from 'next';
import { DemoStarter } from '@/components/demo-starter';
import { T } from '@/lib/strings';

export const metadata: Metadata = { title: T.demo.title };

export default function DemoPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-black tracking-tight">{T.demo.title}</h1>
      <p className="text-lg text-muted">{T.demo.body}</p>
      <DemoStarter />
    </main>
  );
}
